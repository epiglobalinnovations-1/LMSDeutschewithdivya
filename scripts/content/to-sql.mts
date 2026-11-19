/**
 * Turns a content file (CSV, XLSX or generator JSON) into one SQL statement
 * that calls public.import_vocabulary(). Used to seed the starter list and to
 * load content through the Supabase SQL editor or MCP.
 *
 *   node --experimental-strip-types scripts/content/to-sql.mts content/a1/starter-vocabulary.json \
 *     --deck a1-starter --title "A1 starter words" --level A1 > /tmp/a1.sql
 */
import fs from "node:fs";
import path from "node:path";
import { parseVocabularyFile } from "../../src/lib/import/vocabulary.ts";

const args = process.argv.slice(2);
const file = args[0];
if (!file) {
  console.error("usage: to-sql.mts <file> [--deck slug] [--title text] [--level A1] [--topic slug] [--mode upsert|skip]");
  process.exit(2);
}
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i > 0 ? args[i + 1] : undefined;
};

const buf = fs.readFileSync(file);
const result = await parseVocabularyFile(path.basename(file), buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
for (const e of result.parseErrors) console.error("warning:", e);
for (const e of [...result.errors, ...result.duplicates]) console.error(`row ${e.row} ${e.field}: ${e.message}`);
if (result.errors.length || result.parseErrors.some((e) => !e.startsWith("metadata"))) process.exit(1);

const items = result.entries.map((e) => e.entry);
const deckSlug = opt("deck");
const deck = deckSlug
  ? { slug: deckSlug, title: opt("title") ?? deckSlug, cefr_level: opt("level") ?? items[0]?.cefr_level, topic: opt("topic") }
  : null;
const q = (v: unknown) => `'${JSON.stringify(v).replaceAll("'", "''")}'::jsonb`;
process.stdout.write(
  `select public.import_vocabulary(${q(items)}, '${opt("mode") === "skip" ? "skip" : "upsert"}', ${deck ? q(deck) : "null"});\n`,
);
console.error(`${items.length} words${deck ? ` into deck ${deck.slug}` : ""}`);
