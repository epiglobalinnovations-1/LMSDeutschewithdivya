/**
 * Phase 2 end-to-end check: flashcards, FSRS scheduling, XP/streaks,
 * vocabulary library, progress, achievements, courses and the admin
 * vocabulary/import/deck tools, against a running app + local stack.
 *
 *   node tests/e2e/phase2.mjs   (same env vars as phase1.mjs)
 */
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import pg from "pg";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const AUTH = process.env.AUTH_URL ?? "http://localhost:54321/auth/v1";
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

const keys = execFileSync("node", [new URL("../../scripts/local-stack/keys.mjs", import.meta.url).pathname], { encoding: "utf8" });
const SERVICE = /LOCAL_SERVICE_ROLE_KEY=(\S+)/.exec(keys)[1];

const db = new pg.Client({ connectionString: DB });
await db.connect();
const stamp = Date.now();
const email = `p2-${stamp}@example.com`;
const password = "Deutsch2026";

const created = await fetch(`${AUTH}/admin/users`, {
  method: "POST",
  headers: { "content-type": "application/json", apikey: SERVICE, authorization: `Bearer ${SERVICE}` },
  body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: "Lena Krüger" } }),
});
if (!created.ok) throw new Error(`could not create user: ${created.status} ${await created.text()}`);
const userId = (await created.json()).id;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

async function login(p) {
  await p.goto(BASE + "/login?next=/app");
  await p.getByLabel("Email").fill(email);
  await p.getByLabel("Password").fill(password);
  await p.getByRole("button", { name: "Log in" }).click();
  await p.waitForURL((u) => u.pathname === "/app");
}
const q1 = async (sql, params = []) => (await db.query(sql, params)).rows[0];

console.log("Flashcards");
await step("sign in and see today's session size", async () => {
  await login(page);
  await page.goto(BASE + "/app/flashcards");
  const size = await page.getByTestId("session-size").textContent();
  assert(/10 cards ready/.test(size), `expected 10 cards, got "${size}"`);
  await page.screenshot({ path: `${SHOTS}desktop-flashcards.png`, fullPage: true });
});

await step("study session: flip, rate with keyboard, re-queue a forgotten card, summary", async () => {
  await page.getByRole("link", { name: "Start session" }).click();
  await page.waitForURL(/\/app\/flashcards\/study/);
  await page.getByRole("button", { name: /Question side/ }).waitFor();
  await page.screenshot({ path: `${SHOTS}desktop-study-front.png` });
  // first card: don't know (1) → comes back later in the session
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: /Don't know/ }).waitFor();
  await page.screenshot({ path: `${SHOTS}desktop-study-back.png` });
  await page.keyboard.press("1");
  await page.getByRole("button", { name: /Question side/ }).waitFor();
  let rated = 1;
  for (let i = 0; i < 20; i++) {
    if (await page.getByTestId("session-summary").count()) break;
    await page.keyboard.press("Space");
    await page.getByRole("button", { name: /Know it/ }).waitFor();
    const before = await page.locator("[aria-live=polite]").first().textContent();
    await page.keyboard.press("3");
    await page.waitForFunction(
      (b) => document.querySelector("[data-testid=session-summary]") || document.querySelector("[aria-live=polite]")?.textContent !== b,
      before,
      { timeout: 10000 },
    );
    rated++;
  }
  await page.getByTestId("session-summary").waitFor();
  assert(rated === 11, `expected 11 ratings (10 cards + 1 repeat), got ${rated}`);
  const summary = await page.getByTestId("session-summary").textContent();
  assert(/Gut gemacht/.test(summary) && /90%/.test(summary), `summary: ${summary}`);
  assert(/Erste Schritte/.test(summary), "first achievement not shown");
  await page.screenshot({ path: `${SHOTS}desktop-study-summary.png`, fullPage: true });
});

await step("reviews persisted and scheduled by FSRS", async () => {
  const p = await q1("select count(*)::int n, count(*) filter (where state = 'learning')::int learning, min(due_at) > now() future from student_vocabulary_progress where user_id = $1", [userId]);
  assert(p.n === 10 && p.learning === 10 && p.future, `progress ${JSON.stringify(p)}`);
  const h = await q1("select count(*)::int n, count(*) filter (where rating = 'again')::int again from review_history where user_id = $1", [userId]);
  assert(h.n === 11 && h.again === 1, `history ${JSON.stringify(h)}`);
  const a = await q1("select new_words, reviews, xp from daily_activity where user_id = $1", [userId]);
  // 11 reviews + 2×10 new + 1 bonus (11/10) + 10 XP achievement
  assert(a.new_words === 10 && a.reviews === 11 && a.xp === 42, `activity ${JSON.stringify(a)}`);
});

await step("daily target reached: no new words left", async () => {
  await page.goto(BASE + "/app/flashcards");
  const size = await page.getByTestId("session-size").textContent();
  assert(/All done for today/.test(size), `got "${size}"`);
});

await step("due reviews: swipe right on mobile, bookmark with B", async () => {
  await db.query("update student_vocabulary_progress set due_at = now() - interval '1 minute' where user_id = $1", [userId]);
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 2 });
  await m.addCookies(await ctx.cookies());
  const mp = await m.newPage();
  await mp.goto(BASE + "/app/flashcards/study?mode=review");
  const card = mp.getByRole("button", { name: /Question side/ });
  await card.waitFor();
  const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflow <= 0, `overflows by ${overflow}px`);
  await mp.screenshot({ path: `${SHOTS}mobile-study.png` });
  const box = await card.boundingBox();
  const swipe = async () => {
    await mp.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await mp.mouse.down();
    await mp.mouse.move(box.x + box.width / 2 + 160, box.y + box.height / 2, { steps: 8 });
    await mp.mouse.up();
  };
  await swipe(); // first swipe reveals
  await mp.getByRole("button", { name: /Answer side/ }).waitFor();
  await mp.keyboard.press("b");
  await mp.getByRole("button", { name: /Remove bookmark/ }).waitFor();
  await swipe(); // second swipe = know it
  await mp.getByText("1 / 10").waitFor();
  const r = await q1("select count(*)::int n from review_history where user_id = $1", [userId]);
  assert(r.n === 12, `expected 12 reviews, got ${r.n}`);
  const b = await q1("select count(*)::int n from student_vocabulary_progress where user_id = $1 and is_bookmarked", [userId]);
  assert(b.n === 1, "bookmark not saved");
  await m.close();
});

await step("direction toggle shows English first", async () => {
  await page.goto(BASE + "/app/flashcards/study?mode=bookmarked&dir=en_de");
  await page.getByRole("button", { name: "EN → DE", pressed: true }).waitFor();
  await page.getByRole("button", { name: /Question side/ }).waitFor();
});

console.log("Vocabulary, progress, achievements, courses");
await step("vocabulary search and word detail", async () => {
  await page.goto(BASE + "/app/vocabulary?q=bread");
  assert((await page.getByTestId("result-count").textContent()).startsWith("1 "), "search by English failed");
  await page.getByRole("link", { name: /Brot/ }).click();
  await page.getByRole("heading", { name: "das Brot" }).waitFor();
  assert(await page.getByText("die Brote").count(), "plural missing");
  await page.goto(BASE + "/app/vocabulary?q=gehen");
  await page.getByRole("link", { name: "gehen" }).click();
  await page.getByText("Perfekt: ich bin gegangen").waitFor();
  await page.screenshot({ path: `${SHOTS}desktop-word.png`, fullPage: true });
});

await step("'I know this' schedules a new word", async () => {
  await page.goto(BASE + "/app/vocabulary?category=new&q=Kartoffel");
  await page.getByRole("button", { name: "I know this" }).click();
  await page.getByText(/Marked as known/).waitFor();
  const r = await q1("select p.is_known, p.state from student_vocabulary_progress p join vocabulary v on v.id = p.vocabulary_id where p.user_id = $1 and v.lemma = 'Kartoffel'", [userId]);
  assert(r?.is_known && r.state !== "new", `known: ${JSON.stringify(r)}`);
});

await step("category filter: bookmarked", async () => {
  await page.goto(BASE + "/app/vocabulary?category=bookmarked");
  assert((await page.getByTestId("result-count").textContent()).startsWith("1 "), "bookmarked filter");
});

await step("progress and achievements pages", async () => {
  await page.goto(BASE + "/app/progress");
  await page.getByRole("heading", { name: "How you are doing" }).waitFor();
  assert(await page.getByText("Recall accuracy").count(), "no accuracy");
  await page.screenshot({ path: `${SHOTS}desktop-progress.png`, fullPage: true });
  await page.goto(BASE + "/app/achievements");
  await page.getByRole("heading", { name: /1 of 8 earned/ }).waitFor();
});

await step("dashboard shows real numbers", async () => {
  await page.goto(BASE + "/app");
  const text = await page.locator("main").textContent();
  assert(/11\/10/.test(text), "daily ring should show 11/10 (10 cards + one word marked known)");
  assert(/Words learned\s*11/.test(text), `words learned: ${text.slice(0, 400)}`);
});

await step("enrol in the free A1 course; premium course is gated", async () => {
  await page.goto(BASE + "/app/courses");
  const a1 = page.locator("li", { hasText: "German A1" }).first();
  await a1.getByRole("button", { name: "Enrol" }).click();
  // the course moves into "Your courses" once enrolled
  await page.getByRole("heading", { name: "Your courses" }).waitFor();
  const premium = page.locator("li", { hasText: "Premium" }).first();
  await premium.getByRole("button", { name: "Enrol" }).click();
  await page.getByText(/part of the Premium membership/).waitFor();
  const e = await q1("select count(*)::int n from enrollments where user_id = $1", [userId]);
  assert(e.n === 1, `enrolments: ${e.n}`);
});

console.log("Admin");
await step("students cannot open admin tools or exports", async () => {
  await page.goto(BASE + "/admin/import");
  await page.waitForURL((u) => u.pathname === "/app");
  const res = await page.request.get(BASE + "/admin/export/vocabulary?format=csv");
  assert(res.status() === 403 || res.url().includes("/app"), `export status ${res.status()}`);
});

await db.query("insert into user_roles (user_id, role_id) values ($1, 2)", [userId]);

await step("import: check a file with errors, then a clean file", async () => {
  const bad = `${tmpdir()}/bad-${stamp}.csv`;
  writeFileSync(bad, "word,article,translation,level\nHaus,das,house,A1\nhaus,das,house,A1\nAuto,,car,A1\n");
  await page.goto(BASE + "/admin/import");
  await page.setInputFiles("input[name=file]", bad);
  await page.getByRole("button", { name: "1. Check file" }).click();
  const report = page.getByTestId("import-report");
  await report.getByText("Errors (fix these").waitFor();
  assert(await report.getByText("Same word as row 2").count(), "duplicate not flagged");
  assert(await page.getByRole("button", { name: /2. Import/ }).isDisabled(), "import should be disabled");

  const good = `${tmpdir()}/good-${stamp}.csv`;
  writeFileSync(
    good,
    `word,article,plural,category,translation,level,topic,example_de,example_en\nE2Ewort${stamp},das,E2Ewörter,noun,test word; trial word,A1,food,Das ist ein Wort.,This is a word.\nTisch,der,Tische,noun,table,A1,housing,,\n`,
  );
  await page.setInputFiles("input[name=file]", good);
  await page.getByRole("button", { name: "1. Check file" }).click();
  await report.getByText("Preview").waitFor();
  const stats = await report.textContent();
  assert(/New words\s*1/.test(stats) && /Already exist\s*1/.test(stats), `stats: ${stats}`);
  await page.getByLabel("Words that already exist").selectOption("skip");
  await page.getByLabel("Add to deck (optional)").fill(`e2e-deck-${stamp}`);
  await page.getByRole("button", { name: /2. Import 2 words/ }).click();
  await page.getByText("Imported 1 new, updated 0, skipped 1.").waitFor();
  await page.screenshot({ path: `${SHOTS}desktop-admin-import.png`, fullPage: true });
  const w = await q1("select is_verified, (select count(*)::int from vocabulary_translations t where t.vocabulary_id = v.id) tr from vocabulary v where lemma = $1", [`E2Ewort${stamp}`]);
  assert(w && w.is_verified === false && w.tr === 2, `word: ${JSON.stringify(w)}`);
  const d = await q1("select count(*)::int n from flashcards f join flashcard_decks d on d.id = f.deck_id where d.slug = $1", [`e2e-deck-${stamp}`]);
  assert(d.n === 2, `deck cards: ${d.n}`);
});

await step("admin vocabulary: filter drafts, edit and verify a word", async () => {
  await page.goto(BASE + `/admin/vocabulary?q=E2Ewort${stamp}&status=draft`);
  await page.getByRole("link", { name: new RegExp(`E2Ewort${stamp}`) }).click();
  await page.getByLabel("Pronunciation guide for English speakers").fill("ee-TSWAY-vort");
  await page.getByLabel("Verified by a teacher").check();
  await page.getByRole("button", { name: "Save word" }).click();
  await page.getByText("Saved.").waitFor();
  const w = await q1("select is_verified, pronunciation_guide from vocabulary where lemma = $1", [`E2Ewort${stamp}`]);
  assert(w.is_verified && w.pronunciation_guide === "ee-TSWAY-vort", JSON.stringify(w));
});

await step("admin word form validation", async () => {
  await page.goto(BASE + "/admin/vocabulary/new");
  await page.getByLabel("German word").fill("Lampe");
  await page.getByRole("button", { name: "Save word" }).click();
  await page.getByText("Nouns need der, die or das").waitFor();
  await page.getByText("At least one English translation is required").waitFor();
});

await step("admin deck: add words by name", async () => {
  await page.goto(BASE + `/admin/flashcards/e2e-deck-${stamp}`);
  await page.getByLabel("Add words").fill("Stuhl, das Bett, Quatschwort");
  await page.getByRole("button", { name: "Add to deck" }).click();
  await page.getByText("Added 2 words. Not found in the vocabulary: Quatschwort.").waitFor();
});

await step("CSV and JSON export", async () => {
  const csv = await page.request.get(BASE + "/admin/export/vocabulary?format=csv");
  assert(csv.status() === 200 && (await csv.text()).includes("word,article,plural"), "csv export");
  const json = await page.request.get(BASE + "/admin/export/vocabulary?format=json");
  const body = await json.json();
  assert(body.metadata.total_items === body.items.length && body.items.length >= 136, "json export");
});

await browser.close();
await db.query("delete from flashcard_decks where slug = $1", [`e2e-deck-${stamp}`]);
await db.query("delete from vocabulary where lemma = $1", [`E2Ewort${stamp}`]);
await db.query("delete from content_imports where created_by = $1", [userId]);
await db.query("delete from auth.users where id = $1", [userId]);
await db.end();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
