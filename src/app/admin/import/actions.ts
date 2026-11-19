"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/session";
import { CEFR, dedupeKey, parseVocabularyFile, type RowIssue, type VocabEntry } from "@/lib/import/vocabulary";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

const MAX_BYTES = 4 * 1024 * 1024;
const CHUNK = 250;

const options = z.object({
  level: z.enum(CEFR).optional().or(z.literal("").transform(() => undefined)),
  topic: z.string().trim().max(60).optional(),
  source: z.string().trim().max(200).optional(),
  mode: z.enum(["upsert", "skip"]).default("upsert"),
  deckSlug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Deck slug: lowercase letters, digits and dashes")
    .max(80)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  deckTitle: z.string().trim().max(120).optional(),
  markVerified: z.literal("on").optional(),
});

export type ImportPreview = {
  ok: boolean;
  fileName?: string;
  message?: string;
  totalRows: number;
  valid: number;
  newWords: number;
  existingWords: number;
  errors: RowIssue[];
  duplicates: RowIssue[];
  warnings: string[];
  sample: Pick<VocabEntry, "lemma" | "article" | "part_of_speech" | "cefr_level" | "translations" | "topic">[];
  result?: { inserted: number; updated: number; skipped: number };
};

const empty: ImportPreview = { ok: false, totalRows: 0, valid: 0, newWords: 0, existingWords: 0, errors: [], duplicates: [], warnings: [], sample: [] };

async function readUpload(form: FormData) {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." } as const;
  if (file.size > MAX_BYTES) return { error: "Files can be at most 4 MB. Split larger lists into several files." } as const;
  const opts = options.safeParse({
    level: form.get("level") ?? undefined,
    topic: (form.get("topic") as string) || undefined,
    source: (form.get("source") as string) || undefined,
    mode: form.get("mode") ?? undefined,
    deckSlug: form.get("deckSlug") ?? undefined,
    deckTitle: (form.get("deckTitle") as string) || undefined,
    markVerified: form.get("markVerified") ?? undefined,
  });
  if (!opts.success) return { error: opts.error.issues[0]?.message ?? "Check the import options." } as const;
  const parsed = await parseVocabularyFile(file.name, await file.arrayBuffer(), {
    cefr_level: opts.data.level,
    topic: opts.data.topic,
    source: opts.data.source,
  });
  return { file, opts: opts.data, parsed } as const;
}

async function countExisting(entries: VocabEntry[]) {
  const supabase = await createClient();
  const lemmas = [...new Set(entries.map((e) => e.lemma))];
  const existing = new Set<string>();
  for (let i = 0; i < lemmas.length; i += 200) {
    const { data } = await supabase
      .from("vocabulary")
      .select("lemma, article, part_of_speech")
      .in("lemma", lemmas.slice(i, i + 200));
    for (const r of data ?? []) existing.add(dedupeKey(r));
  }
  const ids = entries.map((e) => e.content_id).filter(Boolean) as string[];
  const existingIds = new Set<string>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await supabase.from("vocabulary").select("content_id").in("content_id", ids.slice(i, i + 200));
    for (const r of data ?? []) if (r.content_id) existingIds.add(r.content_id);
  }
  return entries.filter((e) => existing.has(dedupeKey(e)) || (e.content_id && existingIds.has(e.content_id))).length;
}

function summarise(fileName: string, parsed: Awaited<ReturnType<typeof parseVocabularyFile>>, existing: number): ImportPreview {
  return {
    ok: parsed.errors.length === 0 && parsed.entries.length > 0,
    fileName,
    totalRows: parsed.totalRows,
    valid: parsed.entries.length,
    existingWords: existing,
    newWords: parsed.entries.length - existing,
    errors: parsed.errors.slice(0, 200),
    duplicates: parsed.duplicates.slice(0, 200),
    warnings: parsed.parseErrors,
    sample: parsed.entries.slice(0, 8).map(({ entry: e }) => ({
      lemma: e.lemma,
      article: e.article,
      part_of_speech: e.part_of_speech,
      cefr_level: e.cefr_level,
      translations: e.translations,
      topic: e.topic,
    })),
  };
}

/** Step 1: parse and validate, report what would happen. Writes nothing. */
export async function previewImport(_prev: ImportPreview | null, form: FormData): Promise<ImportPreview> {
  await requireStaff();
  const up = await readUpload(form);
  if ("error" in up) return { ...empty, message: up.error };
  const existing = await countExisting(up.parsed.entries.map((e) => e.entry));
  const s = summarise(up.file.name, up.parsed, existing);
  if (up.parsed.entries.length === 0 && !s.message) s.message = "No valid rows found.";
  return s;
}

/** Step 2: the same file is uploaded again and imported in one call per chunk. */
export async function runImport(_prev: ImportPreview | null, form: FormData): Promise<ImportPreview> {
  const user = await requireStaff();
  const up = await readUpload(form);
  if ("error" in up) return { ...empty, message: up.error };
  const { parsed, opts, file } = up;
  if (parsed.errors.length > 0) {
    return { ...summarise(file.name, parsed, 0), ok: false, message: "Fix the rows with errors first. Nothing was imported." };
  }
  const supabase = await createClient();
  const entries = parsed.entries.map(({ entry }) => ({ ...entry, is_verified: opts.markVerified === "on" && user.isStaff ? true : entry.is_verified }));
  const deck = opts.deckSlug
    ? { slug: opts.deckSlug, title: opts.deckTitle || opts.deckSlug, cefr_level: opts.level ?? entries[0]?.cefr_level, topic: opts.topic }
    : null;

  const totals = { inserted: 0, updated: 0, skipped: 0 };
  let failure: string | null = null;
  for (let i = 0; i < entries.length; i += CHUNK) {
    const { data, error } = await supabase.rpc("import_vocabulary", {
      items: entries.slice(i, i + CHUNK) as unknown as Json,
      mode: opts.mode,
      deck: deck as unknown as Json,
    });
    if (error) {
      failure = `Rows ${i + 1}–${Math.min(i + CHUNK, entries.length)} failed: ${error.message}`;
      break;
    }
    const r = data as { inserted: number; updated: number; skipped: number };
    totals.inserted += r.inserted;
    totals.updated += r.updated;
    totals.skipped += r.skipped;
  }

  await supabase.from("content_imports").insert({
    kind: "vocabulary",
    file_name: file.name.slice(0, 200),
    status: failure ? "failed" : "imported",
    total_rows: parsed.totalRows,
    ...totals,
    errors: (failure ? [{ message: failure }] : parsed.duplicates.slice(0, 200)) as unknown as { [key: string]: Json }[],
    metadata: (parsed.metadata ?? {}) as { [key: string]: Json },
    created_by: user.id,
  });
  revalidatePath("/admin/import");
  revalidatePath("/admin/vocabulary");

  return {
    ...summarise(file.name, parsed, totals.updated + totals.skipped),
    ok: !failure,
    message: failure ?? `Imported ${totals.inserted} new, updated ${totals.updated}, skipped ${totals.skipped}.`,
    result: totals,
  };
}
