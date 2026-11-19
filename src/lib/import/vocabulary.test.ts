import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import fs from "node:fs";
import { normaliseRecord, parseCsv, parseJson, parseVocabularyFile, validateRecords } from "./vocabulary";

const enc = (s: string) => new TextEncoder().encode(s).buffer as ArrayBuffer;

describe("normaliseRecord", () => {
  it("splits an article written into the word column and strips 'die' from plurals", () => {
    const r = normaliseRecord({ Word: "der Tisch", Plural: "die Tische", Translation: "table", Level: "a1" });
    expect(r).toMatchObject({ lemma: "Tisch", article: "der", plural: "Tische", has_plural: true, part_of_speech: "noun", cefr_level: "A1" });
  });
  it("understands 'no plural' and German headers", () => {
    const r = normaliseRecord({ Wort: "Milch", Artikel: "die", Plural: "no plural", Englisch: "milk", Wortart: "Nomen" });
    expect(r).toMatchObject({ lemma: "Milch", article: "die", has_plural: false, plural: undefined, part_of_speech: "noun" });
  });
  it("splits translations and related terms on semicolons", () => {
    const r = normaliseRecord({ lemma: "fahren", translation: "to drive; to go", related: "das Auto; der Zug" });
    expect(r.translations).toEqual(["to drive", "to go"]);
    expect(r.related_terms).toEqual(["das Auto", "der Zug"]);
  });
  it("reads verb forms from generator JSON", () => {
    const r = normaliseRecord({
      word: "gehen",
      category: "verb",
      verb_forms: { present: { ich: "gehe", du: "gehst", "er/sie/es": "geht", wir: "gehen", ihr: "geht", "sie/Sie": "gehen" }, partizip_ii: "gegangen" },
      auxiliary: "sein",
    });
    expect(r.verb_forms).toEqual({
      present: { ich: "gehe", du: "gehst", er_sie_es: "geht", wir: "gehen", ihr: "geht", sie_Sie: "gehen" },
      partizip_ii: "gegangen",
    });
    expect(r.auxiliary).toBe("sein");
  });
  it("reads a six-part conjugation column from a spreadsheet", () => {
    const r = normaliseRecord({ lemma: "sein", pos: "verb", present: "bin; bist; ist; sind; seid; sind" });
    expect((r.verb_forms as { present: Record<string, string> }).present.er_sie_es).toBe("ist");
  });
  it("maps word difficulties", () => {
    expect(normaliseRecord({ difficulty: "hard" }).difficulty).toBe(4);
    expect(normaliseRecord({ difficulty: "2" }).difficulty).toBe(2);
  });
});

describe("validateRecords", () => {
  const base = { lemma: "Haus", article: "das", plural: "Häuser", part_of_speech: "noun", cefr_level: "A1", translation: "house" };

  it("accepts a valid noun", () => {
    const r = validateRecords([base]);
    expect(r.errors).toEqual([]);
    expect(r.entries[0].entry).toMatchObject({ lemma: "Haus", article: "das", translations: ["house"], is_verified: false });
  });
  it("reports missing fields with row numbers", () => {
    const r = validateRecords([{ ...base, translation: "" }, { ...base, lemma: "Auto", cefr_level: "Z9" }], { firstRow: 2 });
    expect(r.entries).toHaveLength(0);
    expect(r.errors).toContainEqual(expect.objectContaining({ row: 2, field: "translations" }));
    expect(r.errors).toContainEqual(expect.objectContaining({ row: 3, field: "cefr_level" }));
  });
  it("requires gender for nouns and forbids it elsewhere", () => {
    const r = validateRecords([
      { lemma: "Haus", part_of_speech: "noun", cefr_level: "A1", translation: "house" },
      { lemma: "schnell", article: "der", part_of_speech: "adjective", cefr_level: "A1", translation: "fast" },
    ]);
    expect(r.errors.map((e) => e.field)).toEqual(["article", "article"]);
  });
  it("rejects verb forms on non-verbs and incomplete conjugations", () => {
    const r = validateRecords([
      { lemma: "gut", part_of_speech: "adjective", cefr_level: "A1", translation: "good", partizip_ii: "x" },
      { lemma: "gehen", part_of_speech: "verb", cefr_level: "A1", translation: "to go", present: "gehe; gehst" },
    ]);
    expect(r.errors.some((e) => e.row === 1 && e.field === "verb_forms")).toBe(true);
    expect(r.errors.some((e) => e.row === 2 && e.field.startsWith("verb_forms.present"))).toBe(true);
  });
  it("flags duplicates inside a file by word and by id", () => {
    const r = validateRecords([
      { ...base, id: "A1-1" },
      { ...base, lemma: "haus", id: "A1-2" },
      { ...base, lemma: "Baum", article: "der", id: "A1-1" },
    ]);
    expect(r.entries).toHaveLength(1);
    expect(r.duplicates.map((d) => d.field)).toEqual(["lemma", "content_id"]);
  });
  it("applies defaults for level and topic", () => {
    const r = validateRecords([{ lemma: "Hallo", category: "phrase", translation: "hello" }], { cefr_level: "A1", topic: "Greetings" });
    expect(r.entries[0].entry).toMatchObject({ cefr_level: "A1", topic: "greetings" });
  });
  it("refuses oversized files", () => {
    const r = validateRecords(Array.from({ length: 5001 }, () => base));
    expect(r.errors[0].field).toBe("file");
  });
});

describe("file parsers", () => {
  it("parses CSV with a BOM and quoted commas", () => {
    const { records } = parseCsv('﻿word,article,translation\nTisch,der,"table, desk"\n');
    expect(records).toEqual([{ word: "Tisch", article: "der", translation: "table, desk" }]);
  });
  it("parses generator JSON with metadata", () => {
    const { records, metadata } = parseJson(JSON.stringify({ metadata: { course_level: "A1" }, items: [{ word: "Hallo" }] }));
    expect(records).toHaveLength(1);
    expect(metadata).toEqual({ course_level: "A1" });
  });
  it("rejects malformed JSON", () => {
    expect(parseJson("{oops").parseErrors[0]).toMatch(/Invalid JSON/);
  });
  it("takes level and topic from JSON metadata and checks total_items", async () => {
    const json = JSON.stringify({
      metadata: { course_level: "A1", topic: "food", total_items: 2 },
      items: [{ word: "das Brot", plural: "Brote", translation: "bread" }],
    });
    const r = await parseVocabularyFile("food.json", enc(json));
    expect(r.entries[0].entry).toMatchObject({ cefr_level: "A1", topic: "food", article: "das" });
    expect(r.parseErrors[0]).toMatch(/total_items/);
  });
  it("parses an Excel workbook", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Words");
    ws.addRow(["Word", "Article", "Plural", "Translation", "Level"]);
    ws.addRow(["Stuhl", "der", "Stühle", "chair", "A1"]);
    ws.addRow([]);
    ws.addRow(["kalt", "", "", "cold", "A1"]);
    const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
    const r = await parseVocabularyFile("words.xlsx", buf);
    expect(r.errors).toEqual([{ row: 3, field: "part_of_speech", message: "Unknown part of speech" }]);
    expect(r.entries[0]).toMatchObject({ row: 2, entry: { lemma: "Stuhl", plural: "Stühle" } });
  });
  it("rejects unknown file types", async () => {
    const r = await parseVocabularyFile("words.pdf", enc("x"));
    expect(r.parseErrors[0]).toMatch(/csv/);
  });
  it("accepts the bundled A1 starter list without errors", async () => {
    const buf = fs.readFileSync("content/a1/starter-vocabulary.json");
    const r = await parseVocabularyFile("starter-vocabulary.json", enc(buf.toString("utf8")));
    expect(r.errors).toEqual([]);
    expect(r.duplicates).toEqual([]);
    expect(r.entries.length).toBe(135);
    expect(r.entries.every((e) => e.entry.is_verified === false)).toBe(true);
  });
});
