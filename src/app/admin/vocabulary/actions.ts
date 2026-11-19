"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/session";
import { normaliseRecord, vocabEntrySchema } from "@/lib/import/vocabulary";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export type WordFormState = { ok: boolean; message: string; errors?: Record<string, string[]> } | null;

const PERSONS = ["ich", "du", "er_sie_es", "wir", "ihr", "sie_Sie"] as const;

function recordFromForm(form: FormData) {
  const get = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v : undefined;
  };
  const examples = (get("examples") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [de, ...rest] = l.split("|");
      return { de: de.trim(), en: rest.join("|").trim() };
    });
  const present = PERSONS.map((p) => get(`present_${p}`)?.trim() ?? "");
  const hasPresent = present.some(Boolean);
  return {
    id: get("content_id") || undefined,
    word: get("lemma"),
    article: get("article") || undefined,
    plural: get("no_plural") === "on" ? "no plural" : get("plural"),
    category: get("part_of_speech"),
    level: get("cefr_level"),
    topic: get("topic") || undefined,
    ipa: get("ipa"),
    pronunciation_guide: get("pronunciation_guide"),
    translation: (get("translations") ?? "").split(/\n|;/).map((t) => t.trim()).filter(Boolean),
    examples,
    difficulty: get("difficulty"),
    notes: get("notes"),
    source: get("source"),
    related: get("related"),
    verb_forms:
      hasPresent || get("partizip_ii")
        ? {
            ...(hasPresent ? { present: Object.fromEntries(PERSONS.map((p, i) => [p, present[i]])) } : {}),
            ...(get("partizip_ii") ? { partizip_ii: get("partizip_ii") } : {}),
          }
        : undefined,
    auxiliary: get("auxiliary") || undefined,
    is_verified: get("is_verified") === "on",
    is_published: get("is_published") === "on",
  };
}

export async function saveWord(_prev: WordFormState, form: FormData): Promise<WordFormState> {
  const user = await requireStaff();
  const idRaw = form.get("id");
  const id = idRaw && idRaw !== "new" ? z.uuid().safeParse(idRaw) : null;
  if (id && !id.success) return { ok: false, message: "Unknown word." };

  const parsed = vocabEntrySchema.safeParse(normaliseRecord(recordFromForm(form)));
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const i of parsed.error.issues) {
      const k = String(i.path[0] ?? "form");
      (errors[k] ??= []).push(i.message);
    }
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }
  const e = parsed.data;
  const supabase = await createClient();
  let topicId: number | null = null;
  if (e.topic) {
    const { data: t } = await supabase.from("topics").select("id").eq("slug", e.topic).maybeSingle();
    topicId = t?.id ?? null;
  }
  const row = {
    content_id: e.content_id ?? null,
    lemma: e.lemma,
    article: e.article ?? null,
    plural: e.plural ?? null,
    has_plural: e.has_plural ?? null,
    part_of_speech: e.part_of_speech,
    cefr_level: e.cefr_level,
    topic_id: topicId,
    ipa: e.ipa ?? null,
    pronunciation_guide: e.pronunciation_guide ?? null,
    difficulty: e.difficulty ?? 3,
    notes: e.notes ?? null,
    source: e.source ?? null,
    verb_forms: (e.verb_forms ?? null) as Json,
    auxiliary: e.auxiliary ?? null,
    related_terms: e.related_terms,
    is_verified: e.is_verified,
    is_published: e.is_published,
  };

  let wordId: string;
  if (id?.success) {
    const { error } = await supabase.from("vocabulary").update(row).eq("id", id.data);
    if (error) return { ok: false, message: friendly(error.message) };
    wordId = id.data;
  } else {
    const { data, error } = await supabase.from("vocabulary").insert({ ...row, created_by: user.id }).select("id").single();
    if (error) return { ok: false, message: friendly(error.message) };
    wordId = data.id;
  }

  await supabase.from("vocabulary_translations").delete().eq("vocabulary_id", wordId);
  await supabase
    .from("vocabulary_translations")
    .insert(e.translations.map((t, i) => ({ vocabulary_id: wordId, language: "en", translation: t, is_primary: i === 0, sort_order: i })));
  await supabase.from("vocabulary_examples").delete().eq("vocabulary_id", wordId);
  if (e.examples.length) {
    await supabase
      .from("vocabulary_examples")
      .insert(e.examples.map((x, i) => ({ vocabulary_id: wordId, sentence_de: x.de, sentence_en: x.en, sort_order: i })));
  }
  revalidatePath("/admin/vocabulary");
  if (!id) redirect(`/admin/vocabulary/${wordId}?saved=1`);
  return { ok: true, message: "Saved." };
}

function friendly(msg: string) {
  if (msg.includes("vocabulary_identity_uidx")) return "This word already exists with the same article and category.";
  if (msg.includes("content_id")) return "Another word already uses this content ID.";
  return `Could not save: ${msg}`;
}

export async function deleteWord(form: FormData) {
  await requireStaff();
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success || form.get("confirm") !== "on") return;
  const supabase = await createClient();
  await supabase.from("vocabulary").delete().eq("id", id.data);
  revalidatePath("/admin/vocabulary");
  redirect("/admin/vocabulary?deleted=1");
}

export async function bulkUpdate(form: FormData) {
  await requireStaff();
  const ids = z.array(z.uuid()).max(500).safeParse(form.getAll("ids"));
  const op = form.get("op");
  if (!ids.success || ids.data.length === 0) return;
  const supabase = await createClient();
  const patch =
    op === "verify" ? { is_verified: true } : op === "unverify" ? { is_verified: false } : op === "publish" ? { is_published: true } : op === "unpublish" ? { is_published: false } : null;
  if (!patch) return;
  await supabase.from("vocabulary").update(patch).in("id", ids.data);
  revalidatePath("/admin/vocabulary");
}
