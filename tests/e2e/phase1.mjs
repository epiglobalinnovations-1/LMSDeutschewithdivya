/**
 * Phase 1 end-to-end check. Drives a real browser through the public site and
 * the full account lifecycle against a running app + Supabase-compatible stack.
 *
 *   BASE_URL=http://localhost:3000 MAIL_URL=http://localhost:54321/__mail \
 *   DATABASE_URL=postgres://postgres:postgres@localhost:54322/postgres \
 *   node tests/e2e/phase1.mjs
 *
 * Screenshots are written to tests/e2e/screenshots/.
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
// Uses the project dependency if installed, else a globally installed Playwright.
const { chromium } = require("playwright");
import pg from "pg";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const MAIL = process.env.MAIL_URL ?? "http://localhost:54321/__mail";
const DB = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:54322/postgres";
const SHOTS = new URL("./screenshots/", import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

const results = [];
async function step(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ✓ ${name}`);
  } catch (e) {
    results.push({ name, ok: false, error: e.message });
    console.log(`  ✗ ${name}\n      ${e.message.split("\n")[0]}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function latestMailTo(email, subjectPart) {
  for (let i = 0; i < 20; i++) {
    const list = await (await fetch(MAIL)).json();
    const m = list.find((x) => x.to.includes(email) && (!subjectPart || x.subject.toLowerCase().includes(subjectPart)));
    if (m) return m;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no email for ${email}`);
}
function linkFrom(mail) {
  const m = /href="([^"]+)"/.exec(mail.body);
  assert(m, "email has no link");
  return m[1].replace(/&amp;/g, "&");
}

const db = new pg.Client({ connectionString: DB });
await db.connect();
const browser = await chromium.launch();
const stamp = Date.now();
const email = `e2e-${stamp}@example.com`;
const password = "Deutsch2026";
const newPassword = "Sprechen2027";

// ---------------------------------------------------------------- public site
console.log("Public website");
const pub = await browser.newPage({ viewport: { width: 1280, height: 860 } });
const pages = [
  ["/", /Learn German/],
  ["/about", /Divya/],
  ["/courses", /CEFR level/],
  ["/courses/german-a1", /German A1/],
  ["/method", /Words first/],
  ["/resources", /Start speaking German/],
  ["/pricing", /Start free/],
  ["/login", /Willkommen/],
  ["/register", /Fangen wir an/],
  ["/contact", /Questions/],
  ["/privacy", /Privacy policy/],
  ["/terms", /Terms and conditions/],
];
for (const [path, h1] of pages) {
  await step(`${path} renders`, async () => {
    const res = await pub.goto(BASE + path);
    assert(res.status() === 200, `status ${res.status()}`);
    const text = await pub.locator("h1").first().innerText();
    assert(h1.test(text), `h1 was "${text}"`);
    const name = path === "/" ? "home" : path.slice(1).replace(/\//g, "-");
    await pub.screenshot({ path: `${SHOTS}desktop-${name}.png`, fullPage: true });
  });
}
await step("courses page lists courses from the database", async () => {
  await pub.goto(BASE + "/courses");
  const cards = await pub.locator("main a[href^='/courses/german-']").count();
  assert(cards === 3, `expected 3 published courses, saw ${cards}`);
});
await step("pricing shows the three plans from the database", async () => {
  await pub.goto(BASE + "/pricing");
  for (const n of ["Free", "Premium", "Premium Plus"]) assert(await pub.getByRole("heading", { name: n, exact: true }).count(), `missing ${n}`);
});
await step("homepage flashcard flips", async () => {
  await pub.goto(BASE + "/");
  const card = pub.getByRole("button", { name: /Card front/ });
  await card.click();
  assert((await pub.getByRole("button", { name: /Card back/ }).count()) === 1, "card did not flip");
});
await step("sitemap and robots", async () => {
  const s = await (await fetch(BASE + "/sitemap.xml")).text();
  assert(s.includes("/courses/german-a1"), "sitemap missing course");
  const r = await (await fetch(BASE + "/robots.txt")).text();
  assert(r.includes("Disallow: /app"), "robots missing disallow");
});
await step("home has JSON-LD and Open Graph tags", async () => {
  const html = await (await fetch(BASE + "/")).text();
  assert(html.includes("application/ld+json"), "no JSON-LD");
  assert(html.includes('property="og:title"'), "no og:title");
});

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await step("mobile layout: menu opens, no horizontal scroll", async () => {
  for (const path of ["/", "/courses", "/pricing", "/register"]) {
    await mobile.goto(BASE + path);
    const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert(overflow <= 0, `${path} overflows by ${overflow}px`);
    await mobile.screenshot({ path: `${SHOTS}mobile-${path === "/" ? "home" : path.slice(1)}.png`, fullPage: true });
  }
  await mobile.goto(BASE + "/");
  await mobile.getByRole("button", { name: "Open menu" }).click();
  assert(await mobile.locator("#mobile-menu").isVisible(), "menu not visible");
  await mobile.screenshot({ path: `${SHOTS}mobile-menu.png` });
});

await step("contact form validates and saves", async () => {
  await pub.goto(BASE + "/contact");
  await pub.getByRole("button", { name: "Send message" }).click();
  await pub.getByText("Enter your name.").waitFor();
  await pub.getByLabel("Your name").fill("E2E Visitor");
  await pub.getByLabel("Email").fill(`visitor-${stamp}@example.com`);
  await pub.getByLabel("Message").fill("Which level should I start with? I know a little German.");
  await pub.getByRole("button", { name: "Send message" }).click();
  await pub.getByText("Your message has been received").waitFor();
  const { rowCount } = await db.query("select 1 from public.contact_messages where email = $1", [`visitor-${stamp}@example.com`]);
  assert(rowCount === 1, "contact message not in database");
});

// ---------------------------------------------------------------- auth flow
console.log("Authentication");
const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
const page = await ctx.newPage();

await step("protected route redirects to login", async () => {
  await page.goto(BASE + "/app/settings");
  assert(page.url().includes("/login?next=%2Fapp%2Fsettings"), page.url());
});

await step("registration validates input", async () => {
  await page.goto(BASE + "/register");
  await page.getByLabel("Full name").fill("A");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByLabel("Confirm password").fill("different");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByText("Enter a valid email address.").waitFor();
  await page.getByText("Use at least 8 characters.").waitFor();
  await page.getByText("Please accept the terms to continue.").waitFor();
  await page.screenshot({ path: `${SHOTS}register-errors.png`, fullPage: true });
});

await step("registration creates an unconfirmed account", async () => {
  await page.getByLabel("Full name").fill("Priya Sharma");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByLabel(/I agree/).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/verify-email/);
  const { rows } = await db.query(
    "select u.email_confirmed_at, p.full_name, array(select r.key::text from public.user_roles ur join public.roles r on r.id = ur.role_id where ur.user_id = u.id) roles from auth.users u join public.profiles p on p.id = u.id where u.email = $1",
    [email],
  );
  assert(rows.length === 1, "user/profile not created");
  assert(rows[0].email_confirmed_at === null, "already confirmed");
  assert(rows[0].full_name === "Priya Sharma", "name not saved");
  assert(rows[0].roles.join() === "student", `roles ${rows[0].roles}`);
});

await step("login is refused until email is confirmed", async () => {
  await page.goto(BASE + "/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.getByText("Please confirm your email address first").waitFor();
});

await step("confirmation email link verifies and signs in", async () => {
  const mail = await latestMailTo(email);
  await page.goto(linkFrom(mail));
  await page.waitForURL((u) => u.pathname === "/app");
  await page.getByRole("heading", { name: /Priya, ready for today/ }).waitFor();
  await page.screenshot({ path: `${SHOTS}desktop-dashboard.png`, fullPage: true });
});

await step("dashboard shows live stats from the database", async () => {
  await page.getByText("10 new words").waitFor();
  await page.getByText("0 reviews due").waitFor();
});

await step("settings save to the database", async () => {
  await page.goto(BASE + "/app/settings");
  await page.getByLabel("New words per day").selectOption("20");
  await page.getByLabel("Card direction").selectOption("en_de");
  await page.getByLabel("Display name").fill("Priya");
  await page.getByRole("button", { name: "Save settings" }).click();
  await page.getByText("Settings saved.").waitFor();
  const { rows } = await db.query("select daily_new_words, study_direction from public.profiles p join auth.users u on u.id = p.id where u.email = $1", [email]);
  assert(rows[0].daily_new_words === 20 && rows[0].study_direction === "en_de", JSON.stringify(rows[0]));
  await page.screenshot({ path: `${SHOTS}desktop-settings.png`, fullPage: true });
});

await step("coming-soon modules are clearly labelled", async () => {
  await page.goto(BASE + "/app/grammar");
  await page.getByText("Arrives in phase 3").waitFor();
});

await step("students cannot open the admin area", async () => {
  await page.goto(BASE + "/admin");
  await page.waitForURL(/\/app\?denied=admin/);
  await page.getByText("only available to teachers and administrators").waitFor();
});

await step("an admin grant opens the admin area with live data", async () => {
  await db.query(
    "insert into public.user_roles (user_id, role_id) select id, r from auth.users, unnest(array[2,3]) r where email = $1 on conflict do nothing",
    [email],
  );
  await page.goto(BASE + "/admin");
  await page.getByRole("heading", { name: "Overview" }).waitFor();
  await page.getByText("Which level should I start with?").first().waitFor();
  await page.screenshot({ path: `${SHOTS}desktop-admin.png`, fullPage: true });
});

await step("log out", async () => {
  await page.goto(BASE + "/app");
  await page.getByRole("button", { name: "Log out" }).first().click();
  await page.waitForURL(/\/login\?signedout=1/);
  await page.goto(BASE + "/app");
  assert(page.url().includes("/login"), "still signed in");
});

await step("password reset by email", async () => {
  await page.goto(BASE + "/forgot-password");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await page.getByText("we have sent a link").waitFor();
  const mail = await latestMailTo(email, "reset");
  await page.goto(linkFrom(mail));
  await page.waitForURL(/\/reset-password/);
  await page.getByLabel("New password", { exact: true }).fill(newPassword);
  await page.getByLabel("Confirm new password").fill(newPassword);
  await page.getByRole("button", { name: "Save new password" }).click();
  await page.waitForURL(/\/app\?password=updated/);
  await page.getByText("Your password has been updated.").waitFor();
});

await step("old password no longer works, new one does", async () => {
  const c2 = await browser.newContext();
  const p2 = await c2.newPage();
  await p2.goto(BASE + "/login");
  await p2.getByLabel("Email").fill(email);
  await p2.getByLabel("Password").fill(password);
  await p2.getByRole("button", { name: "Log in" }).click();
  await p2.getByText("Email or password is incorrect.").waitFor();
  await p2.getByLabel("Password").fill(newPassword);
  await p2.getByRole("button", { name: "Log in" }).click();
  await p2.waitForURL((u) => u.pathname === "/app");
  await c2.close();
});

await step("mobile dashboard", async () => {
  const c3 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p3 = await c3.newPage();
  await p3.goto(BASE + "/login?next=/app");
  await p3.getByLabel("Email").fill(email);
  await p3.getByLabel("Password").fill(newPassword);
  await p3.getByRole("button", { name: "Log in" }).click();
  await p3.waitForURL((u) => u.pathname === "/app");
  await p3.getByRole("heading", { name: /ready for today/ }).waitFor();
  const overflow = await p3.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 0, `overflows by ${overflow}px`);
  await p3.screenshot({ path: `${SHOTS}mobile-dashboard.png`, fullPage: true });
  await c3.close();
});

await browser.close();
await db.query("delete from auth.users where email = $1", [email]);
await db.query("delete from public.contact_messages where email = $1", [`visitor-${stamp}@example.com`]);
await db.end();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
