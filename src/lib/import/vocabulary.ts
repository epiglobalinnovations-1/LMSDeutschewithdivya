/**
 * Vocabulary import: parse CSV, Excel or JSON, normalise every row into one
 * shape, validate it and detect duplicates before anything touches the
 * database. The database side is `public.import_vocabulary(items, mode, deck)`.
 *
 * Accepted inputs (see docs/content-format.md):
 *  - JSON from the content generator: `{ metadata, items: [...] }` or a bare array
 *  - CSV / Excel with a header row; column names are matched case-insensitively
 *    and common aliases are accepted (word/lemma, category/part_of_speech, ...)
 */
import Papa from "papaparse";
import { z } from "zod";

export const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const ARTICLES = ["der", "die", "das"] as const;
export const PARTS_OF_SPEECH = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "preposition",
  "conjunction",
  "article",
  "numeral",
  "interjection",
  "particle",
  "phrase",
] as const;
export const MAX_IMPORT_ROWS = 5000;

const personKeys = ["ich", "du", "er_sie_es", "wir", "ihr", "sie_Sie"] as const;
const conjugation = z.object(Object.fromEntries(personKeys.map((k) => [k, z.string().trim().min(1)])) as Record<
  (typeof personKeys)[number],
  z.ZodString
>);

export const verbFormsSchema = z.object({
  infinitive: z.string().trim().min(1).optional(),
  present: conjugation.optional(),
  praeteritum: conjugation.optional(),
  partizip_ii: z.string().trim().min(1).optional(),
});
export type VerbForms = z.infer<typeof verbFormsSchema>;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? undefined : v))
    .optional();

export const vocabEntrySchema = z
  .object({
    content_id: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9._-]{3,80}$/, "Use 3–80 letters, digits, dots, dashes or underscores")
      .optional(),
    lemma: z.string().trim().min(1, "The German word is required").max(120),
    article: z.enum(ARTICLES).optional(),
    plural: optionalText(120),
    has_plural: z.boolean().optional(),
    part_of_speech: z.enum(PARTS_OF_SPEECH, { message: "Unknown part of speech" }),
    cefr_level: z.enum(CEFR, { message: "Level must be A1–C2" }),
    topic: optionalText(60),
    ipa: optionalText(120),
    pronunciation_guide: optionalText(200),
    difficulty: z.number().int().min(1).max(5).optional(),
    frequency_rank: z.number().int().positive().optional(),
    notes: optionalText(1000),
    source: optionalText(200),
    verb_forms: verbFormsSchema.optional(),
    auxiliary: z.enum(["haben", "sein"]).optional(),
    related_terms: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
    translations: z.array(z.string().trim().min(1).max(200)).min(1, "At least one English translation is required").max(10),
    examples: z
      .array(z.object({ de: z.string().trim().min(1).max(500), en: z.string().trim().min(1).max(500) }))
      .max(10)
      .default([]),
    is_verified: z.boolean().default(false),
    is_published: z.boolean().default(true),
  })
  .superRefine((v, ctx) => {
    if (v.article && v.part_of_speech !== "noun") {
      ctx.addIssue({ code: "custom", path: ["article"], message: "Only nouns take an article" });
    }
    if (v.part_of_speech === "noun" && !v.article) {
      ctx.addIssue({ code: "custom", path: ["article"], message: "Nouns need der, die or das" });
    }
    if (v.has_plural === false && v.plural) {
      ctx.addIssue({ code: "custom", path: ["plural"], message: "Marked as having no plural but a plural was given" });
    }
    if ((v.verb_forms || v.auxiliary) && v.part_of_speech !== "verb") {
      ctx.addIssue({ code: "custom", path: ["verb_forms"], message: "Verb forms are only allowed on verbs" });
    }
  });
export type VocabEntry = z.infer<typeof vocabEntrySchema>;

export type RowIssue = { row: number; field: string; message: string };
export type ParsedImport = {
  entries: { row: number; entry: VocabEntry }[];
  errors: RowIssue[];
  duplicates: RowIssue[];
  metadata: Record<string, unknown> | null;
  totalRows: number;
};

// ---------------------------------------------------------------------------
// Field aliases: generator JSON keys, spreadsheet headers, German headers
// ---------------------------------------------------------------------------
const ALIASES: Record<string, string> = {
  id: "content_id",
  content_id: "content_id",
  word: "lemma",
  lemma: "lemma",
  german: "lemma",
  deutsch: "lemma",
  wort: "lemma",
  article: "article",
  artikel: "article",
  gender: "article",
  plural: "plural",
  category: "part_of_speech",
  part_of_speech: "part_of_speech",
  pos: "part_of_speech",
  word_type: "part_of_speech",
  wortart: "part_of_speech",
  level: "cefr_level",
  cefr: "cefr_level",
  cefr_level: "cefr_level",
  course_level: "cefr_level",
  topic: "topic",
  theme: "topic",
  thema: "topic",
  ipa: "ipa",
  pronunciation: "ipa",
  pronunciation_guide: "pronunciation_guide",
  difficulty: "difficulty",
  frequency_rank: "frequency_rank",
  frequency: "frequency_rank",
  notes: "notes",
  note: "notes",
  source: "source",
  translation: "translations",
  translations: "translations",
  english: "translations",
  englisch: "translations",
  meaning: "translations",
  example: "example",
  example_sentence: "example_de",
  example_de: "example_de",
  example_german: "example_de",
  example_en: "example_en",
  example_english: "example_en",
  example_translation: "example_en",
  examples: "examples",
  related: "related_terms",
  related_terms: "related_terms",
  related_vocabulary: "related_terms",
  verb_forms: "verb_forms",
  conjugation: "present",
  present: "present",
  present_tense: "present",
  praeteritum: "praeteritum",
  prateritum: "praeteritum",
  simple_past: "praeteritum",
  partizip_ii: "partizip_ii",
  partizip_2: "partizip_ii",
  past_participle: "partizip_ii",
  infinitive: "infinitive",
  auxiliary: "auxiliary",
  auxiliary_verb: "auxiliary",
  hilfsverb: "auxiliary",
  verified: "is_verified",
  is_verified: "is_verified",
  published: "is_published",
  is_published: "is_published",
};

const POS_ALIASES: Record<string, (typeof PARTS_OF_SPEECH)[number]> = {
  noun: "noun",
  nomen: "noun",
  substantiv: "noun",
  verb: "verb",
  adjective: "adjective",
  adjektiv: "adjective",
  adj: "adjective",
  adverb: "adverb",
  adv: "adverb",
  pronoun: "pronoun",
  pronomen: "pronoun",
  preposition: "preposition",
  präposition: "preposition",
  praeposition: "preposition",
  conjunction: "conjunction",
  konjunktion: "conjunction",
  article: "article",
  numeral: "numeral",
  number: "numeral",
  zahl: "numeral",
  interjection: "interjection",
  particle: "particle",
  partikel: "particle",
  phrase: "phrase",
  expression: "phrase",
  ausdruck: "phrase",
  greeting: "phrase",
};

const DIFFICULTY_WORDS: Record<string, number> = { very_easy: 1, easy: 2, medium: 3, hard: 4, very_hard: 5 };
const NO_PLURAL = /^(-|—|–|none|no plural|n\/a|kein plural|no plural in normal use|nur singular|only singular)$/i;

function normaliseKey(k: string) {
  return k
    .trim()
    .toLowerCase()
    .replace(/[\s/-]+/g, "_")
    .replace(/[()]/g, "");
}

function str(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === "string") return v.trim() === "" ? undefined : v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return undefined;
}

function list(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(str).filter((s): s is string => !!s);
  const s = str(v);
  if (!s) return [];
  return s
    .split(/\s*[;|]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function bool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  const s = str(v)?.toLowerCase();
  if (!s) return undefined;
  if (["true", "yes", "y", "1", "ja"].includes(s)) return true;
  if (["false", "no", "n", "0", "nein"].includes(s)) return false;
  return undefined;
}

function num(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  const s = str(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/** "ich gehe, du gehst, ..." or "gehe; gehst; geht; gehen; geht; gehen" → object */
function conjugationFrom(v: unknown): Record<string, string> | undefined {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, val] of Object.entries(o)) {
      const key = normaliseKey(k)
        .replace(/^er_sie_es$|^er$|^er_sie$/, "er_sie_es")
        .replace(/^sie_sie$|^sie_formal$/, "sie_Sie");
      const s = str(val);
      if (s) out[key === "sie_Sie" ? "sie_Sie" : key] = s;
    }
    return Object.keys(out).length ? out : undefined;
  }
  const parts = list(v);
  if (parts.length !== 6) return parts.length ? { _invalid: parts.join("; ") } : undefined;
  return Object.fromEntries(personKeys.map((k, i) => [k, parts[i].replace(/^(ich|du|er\/sie\/es|wir|ihr|sie\/Sie)\s+/i, "")]));
}

/** Map one raw record (any supported shape) to a candidate entry. */
export function normaliseRecord(raw: Record<string, unknown>, defaults: { cefr_level?: string; topic?: string; source?: string } = {}) {
  const r: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    const key = ALIASES[normaliseKey(k)];
    if (key && r[key] === undefined) r[key] = v;
  }

  let lemma = str(r.lemma) ?? "";
  let article = str(r.article)?.toLowerCase();
  // "der Tisch" in the word column: split off the article
  const m = /^(der|die|das)\s+(.+)$/i.exec(lemma);
  if (m && (!article || article === m[1].toLowerCase())) {
    article = m[1].toLowerCase();
    lemma = m[2];
  }
  if (article && ["m", "masculine", "maskulin"].includes(article)) article = "der";
  if (article && ["f", "feminine", "feminin"].includes(article)) article = "die";
  if (article && ["n", "neuter", "neutral"].includes(article)) article = "das";
  if (article === "-" || article === "none") article = undefined;

  let posRaw = str(r.part_of_speech)?.toLowerCase();
  if (!posRaw && article) posRaw = "noun";
  const part_of_speech = posRaw ? (POS_ALIASES[posRaw] ?? posRaw) : undefined;

  let plural = str(r.plural);
  let has_plural: boolean | undefined;
  if (plural && NO_PLURAL.test(plural)) {
    plural = undefined;
    has_plural = false;
  } else if (plural) {
    plural = plural.replace(/^die\s+/i, "");
    has_plural = true;
  }

  const diffRaw = r.difficulty;
  let difficulty: number | undefined;
  if (typeof diffRaw === "string" && DIFFICULTY_WORDS[normaliseKey(diffRaw)]) difficulty = DIFFICULTY_WORDS[normaliseKey(diffRaw)];
  else difficulty = num(diffRaw);

  const examples: { de: string; en: string }[] = [];
  const pushExample = (e: unknown) => {
    if (e && typeof e === "object" && !Array.isArray(e)) {
      const o = e as Record<string, unknown>;
      const de = str(o.de ?? o.german ?? o.sentence ?? o.sentence_de);
      const en = str(o.en ?? o.english ?? o.translation ?? o.sentence_en);
      if (de || en) examples.push({ de: de ?? "", en: en ?? "" });
    }
  };
  if (Array.isArray(r.examples)) r.examples.forEach(pushExample);
  if (r.example && typeof r.example === "object") pushExample(r.example);
  const exDe = str(r.example_de) ?? (typeof r.example === "string" ? str(r.example) : undefined);
  const exEn = str(r.example_en);
  if (exDe || exEn) examples.push({ de: exDe ?? "", en: exEn ?? "" });

  let verb_forms: Record<string, unknown> | undefined;
  const vfRaw = r.verb_forms && typeof r.verb_forms === "object" ? (r.verb_forms as Record<string, unknown>) : {};
  const present = conjugationFrom(vfRaw.present ?? vfRaw.present_tense ?? r.present);
  const praeteritum = conjugationFrom(vfRaw.praeteritum ?? vfRaw.prateritum ?? vfRaw.simple_past ?? r.praeteritum);
  const partizip = str(vfRaw.partizip_ii ?? vfRaw.past_participle ?? r.partizip_ii);
  const infinitive = str(vfRaw.infinitive ?? r.infinitive);
  if (present || praeteritum || partizip || (infinitive && part_of_speech === "verb")) {
    verb_forms = {
      ...(infinitive ? { infinitive } : {}),
      ...(present ? { present } : {}),
      ...(praeteritum ? { praeteritum } : {}),
      ...(partizip ? { partizip_ii: partizip } : {}),
    };
  }
  const auxiliary = str(vfRaw.auxiliary ?? r.auxiliary)?.toLowerCase();

  return {
    content_id: str(r.content_id),
    lemma,
    article,
    plural,
    has_plural,
    part_of_speech,
    cefr_level: (str(r.cefr_level) ?? defaults.cefr_level)?.toUpperCase(),
    topic: (str(r.topic) ?? defaults.topic)?.toLowerCase().replace(/[\s_]+/g, "-"),
    ipa: str(r.ipa)?.replace(/^\/(.*)\/$/, "$1").replace(/^\[(.*)\]$/, "$1"),
    pronunciation_guide: str(r.pronunciation_guide),
    difficulty,
    frequency_rank: num(r.frequency_rank),
    notes: str(r.notes),
    source: str(r.source) ?? defaults.source,
    verb_forms,
    auxiliary,
    related_terms: list(r.related_terms),
    translations: list(r.translations),
    examples,
    is_verified: bool(r.is_verified),
    is_published: bool(r.is_published),
  };
}

export function dedupeKey(e: { lemma: string; article?: string | null; part_of_speech: string }) {
  return `${e.lemma.toLowerCase()}|${e.article ?? ""}|${e.part_of_speech}`;
}

/** Validate normalised records and flag duplicates inside the same file. */
export function validateRecords(
  records: Record<string, unknown>[],
  opts: { cefr_level?: string; topic?: string; source?: string; firstRow?: number } = {},
): ParsedImport {
  const firstRow = opts.firstRow ?? 1;
  const out: ParsedImport = { entries: [], errors: [], duplicates: [], metadata: null, totalRows: records.length };
  if (records.length > MAX_IMPORT_ROWS) {
    out.errors.push({ row: 0, field: "file", message: `At most ${MAX_IMPORT_ROWS} rows per import (found ${records.length})` });
    return out;
  }
  const seenKey = new Map<string, number>();
  const seenId = new Map<string, number>();

  records.forEach((raw, i) => {
    const row = i + firstRow;
    const candidate = normaliseRecord(raw, opts);
    const result = vocabEntrySchema.safeParse(candidate);
    if (!result.success) {
      for (const issue of result.error.issues) {
        out.errors.push({ row, field: issue.path.join(".") || "row", message: issue.message });
      }
      return;
    }
    const entry = result.data;
    const key = dedupeKey(entry);
    if (seenKey.has(key)) {
      out.duplicates.push({ row, field: "lemma", message: `Same word as row ${seenKey.get(key)}` });
      return;
    }
    if (entry.content_id && seenId.has(entry.content_id)) {
      out.duplicates.push({ row, field: "content_id", message: `Same id as row ${seenId.get(entry.content_id)}` });
      return;
    }
    seenKey.set(key, row);
    if (entry.content_id) seenId.set(entry.content_id, row);
    out.entries.push({ row, entry });
  });
  return out;
}

// ---------------------------------------------------------------------------
// File parsers
// ---------------------------------------------------------------------------
export function parseCsv(text: string) {
  const res = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });
  const fatal = res.errors.filter((e) => e.type !== "FieldMismatch");
  return { records: res.data as Record<string, unknown>[], parseErrors: fatal.map((e) => `Row ${(e.row ?? 0) + 2}: ${e.message}`) };
}

export function parseJson(text: string): { records: Record<string, unknown>[]; metadata: Record<string, unknown> | null; parseErrors: string[] } {
  let data: unknown;
  try {
    data = JSON.parse(text.replace(/^﻿/, ""));
  } catch (e) {
    return { records: [], metadata: null, parseErrors: [`Invalid JSON: ${(e as Error).message}`] };
  }
  if (Array.isArray(data)) return { records: data as Record<string, unknown>[], metadata: null, parseErrors: [] };
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    const items = o.items ?? o.vocabulary ?? o.flashcards ?? o.data;
    if (Array.isArray(items)) {
      const metadata = o.metadata && typeof o.metadata === "object" ? (o.metadata as Record<string, unknown>) : null;
      return { records: items as Record<string, unknown>[], metadata, parseErrors: [] };
    }
  }
  return { records: [], metadata: null, parseErrors: ["JSON must be an array of words or an object with an \"items\" array"] };
}

export async function parseXlsx(buffer: ArrayBuffer) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buffer);
  } catch {
    return { records: [], parseErrors: ["Could not read the Excel file. Save it as .xlsx and try again."] };
  }
  const ws = wb.worksheets[0];
  if (!ws) return { records: [], parseErrors: ["The workbook has no sheets"] };
  const headers: string[] = [];
  ws.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col] = cell.text.trim();
  });
  const records: Record<string, unknown>[] = [];
  ws.eachRow({ includeEmpty: false }, (row, n) => {
    if (n === 1) return;
    const rec: Record<string, unknown> = {};
    let any = false;
    row.eachCell({ includeEmpty: false }, (cell, col) => {
      const h = headers[col];
      if (!h) return;
      const t = cell.text.trim();
      if (t) {
        rec[h] = t;
        any = true;
      }
    });
    if (any) records.push(rec);
  });
  return { records, parseErrors: [] as string[] };
}

export type ImportFormat = "csv" | "xlsx" | "json";
export function detectFormat(name: string): ImportFormat | null {
  const ext = name.toLowerCase().split(".").pop();
  if (ext === "csv" || ext === "tsv" || ext === "txt") return "csv";
  if (ext === "xlsx") return "xlsx";
  if (ext === "json") return "json";
  return null;
}

/** Parse + validate a whole file. */
export async function parseVocabularyFile(
  name: string,
  data: ArrayBuffer,
  defaults: { cefr_level?: string; topic?: string; source?: string } = {},
): Promise<ParsedImport & { format: ImportFormat | null; parseErrors: string[] }> {
  const format = detectFormat(name);
  const empty = { entries: [], errors: [], duplicates: [], metadata: null, totalRows: 0 };
  if (!format) return { ...empty, format, parseErrors: ["Upload a .csv, .xlsx or .json file"] };

  if (format === "xlsx") {
    const { records, parseErrors } = await parseXlsx(data);
    return { ...validateRecords(records, { ...defaults, firstRow: 2 }), format, parseErrors };
  }
  const text = new TextDecoder("utf-8").decode(data);
  if (format === "csv") {
    const { records, parseErrors } = parseCsv(text);
    return { ...validateRecords(records, { ...defaults, firstRow: 2 }), format, parseErrors };
  }
  const { records, metadata, parseErrors } = parseJson(text);
  const md = metadata ?? {};
  const merged = {
    cefr_level: defaults.cefr_level ?? str(md.course_level),
    topic: defaults.topic ?? (str(md.topic) && str(md.topic) !== "mixed" ? str(md.topic) : undefined),
    source: defaults.source,
  };
  const result = validateRecords(records, merged);
  if (metadata && typeof metadata.total_items === "number" && metadata.total_items !== records.length) {
    parseErrors.push(`metadata.total_items says ${metadata.total_items} but the file has ${records.length} items`);
  }
  return { ...result, metadata, format, parseErrors };
}
