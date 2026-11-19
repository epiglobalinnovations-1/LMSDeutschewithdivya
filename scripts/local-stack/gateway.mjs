// Local stand-in for the Supabase API gateway, for verification only.
//   :54321  /auth/v1/*  -> GoTrue (:9999)
//           /rest/v1/*  -> PostgREST (:3001)
//           /__mail     -> JSON list of captured emails (newest first)
//   :2500   minimal SMTP sink that captures GoTrue's emails
import http from "node:http";
import net from "node:net";

const routes = [
  ["/auth/v1", 9999],
  ["/rest/v1", 3001],
];
const mail = [];

http
  .createServer((req, res) => {
    res.setHeader("access-control-allow-origin", req.headers.origin ?? "*");
    res.setHeader("access-control-allow-headers", "*");
    res.setHeader("access-control-allow-methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("access-control-allow-credentials", "true");
    res.setHeader("access-control-expose-headers", "*");
    if (req.method === "OPTIONS") return res.end();
    if (req.url.startsWith("/__mail")) {
      res.setHeader("content-type", "application/json");
      return res.end(JSON.stringify(mail.slice().reverse()));
    }
    const route = routes.find(([prefix]) => req.url.startsWith(prefix));
    if (!route) {
      res.statusCode = 404;
      return res.end("not found");
    }
    const [prefix, port] = route;
    const path = req.url.slice(prefix.length) || "/";
    const upstream = http.request(
      { host: "127.0.0.1", port, path, method: req.method, headers: { ...req.headers, host: `127.0.0.1:${port}` } },
      (up) => {
        res.writeHead(up.statusCode ?? 502, up.headers);
        up.pipe(res);
      },
    );
    upstream.on("error", (e) => {
      res.statusCode = 502;
      res.end(String(e));
    });
    req.pipe(upstream);
  })
  .listen(54321, () => console.log("gateway on :54321"));

net
  .createServer((socket) => {
    let data = false;
    let body = "";
    let buffer = "";
    let rcpt = [];
    socket.write("220 local-smtp ready\r\n");
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      let idx;
      while ((idx = buffer.indexOf("\r\n")) !== -1) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        if (data) {
          if (line === ".") {
            data = false;
            const decoded = body.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
            const subject = /^Subject: (.*)$/m.exec(body)?.[1] ?? "";
            mail.push({ to: rcpt, subject, body: decoded, at: new Date().toISOString() });
            console.log(`mail to ${rcpt.join(",")}: ${subject}`);
            body = "";
            rcpt = [];
            socket.write("250 OK\r\n");
          } else body += line + "\n";
          continue;
        }
        const cmd = line.slice(0, 4).toUpperCase();
        if (cmd === "EHLO" || cmd === "HELO") socket.write("250-local-smtp\r\n250 AUTH PLAIN LOGIN\r\n");
        else if (cmd === "AUTH") socket.write("235 OK\r\n");
        else if (cmd === "MAIL") socket.write("250 OK\r\n");
        else if (cmd === "RCPT") {
          rcpt.push(line.replace(/^RCPT TO:\s*/i, "").replace(/[<>]/g, ""));
          socket.write("250 OK\r\n");
        } else if (cmd === "DATA") {
          data = true;
          socket.write("354 go ahead\r\n");
        } else if (cmd === "QUIT") {
          socket.write("221 bye\r\n");
          socket.end();
        } else socket.write("250 OK\r\n");
      }
    });
  })
  .listen(2500, "0.0.0.0", () => console.log("smtp sink on :2500"));
