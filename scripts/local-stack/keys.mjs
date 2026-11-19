// Prints local anon and service_role JWTs signed with the local stack secret.
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
const secret = readFileSync(new URL("./.jwt-secret", import.meta.url), "utf8").trim();
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const sign = (payload) => {
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64(payload);
  const sig = createHmac("sha256", secret).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
};
const iat = Math.floor(Date.now() / 1000);
const exp = iat + 10 * 365 * 24 * 3600;
console.log(`LOCAL_ANON_KEY=${sign({ iss: "supabase-local", role: "anon", iat, exp })}`);
console.log(`LOCAL_SERVICE_ROLE_KEY=${sign({ iss: "supabase-local", role: "service_role", iat, exp })}`);
