"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type DeckFormState = { ok: boolean; message: string } | null;

const deckSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug: lowercase letters, digits and dashes").max(80),
  title: z.string().trim().min(2, "Give the deck a title").max(120),
  description: z.string().trim().max(500).optional(),
  cefr_level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional().or(z.literal("").transform(() => undefined)),
  topic: z.string().trim().max(60).optional(),
  required_plan: z.enum(["free", "premium", "premium_plus"]).default("free"),
  is_published: z.boolean(),
});

function fromForm(form: FormData) {
  const s = (k: string) => (typeof form.get(k) === "string" ? (form.get(k) as string) : undefined);
  return deckSchema.safeParse({
    slug: s("slug"),
    title: s("title"),
    description: s("description") || undefined,
    cefr_level: s("cefr_level") ?? "",
    topic: s("topic") || undefined,
    required_plan: s("required_plan") || "free",
    is_published: form.get("is_published") === "on",
  });
}

async function topicId(slug?: string) {
  if (!slug) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("topics").select("id").eq("slug", slug).maybeSingle();
  return data?.id ?? null;
}

export async function saveDeck(_prev: DeckFormState, form: FormData): Promise<DeckFormState> {
  const user = await requireStaff();
  const parsed = fromForm(form);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  const supabase = await createClient();
  const row = {
    slug: d.slug,
    title: d.title,
    description: d.description ?? null,
    cefr_level: d.cefr_level ?? null,
    topic_id: await topicId(d.topic),
    required_plan: d.required_plan,
    is_published: d.is_published,
  };
  const existingId = form.get("id");
  if (typeof existingId === "string" && existingId) {
    const { error } = await supabase.from("flashcard_decks").update(row).eq("id", existingId);
    if (error) return { ok: false, message: error.code === "23505" ? "Another deck uses this slug." : error.message };
    revalidatePath("/admin/flashcards");
    if (row.slug !== form.get("originalSlug")) redirect(`/admin/flashcards/${row.slug}`);
    return { ok: true, message: "Deck saved." };
  }
  const { error } = await supabase.from("flashcard_decks").insert({ ...row, created_by: user.id });
  if (error) return { ok: false, message: error.code === "23505" ? "Another deck uses this slug." : error.message };
  revalidatePath("/admin/flashcards");
  redirect(`/admin/flashcards/${row.slug}`);
}

export type AddWordsState = { ok: boolean; message: string } | null;

/** Add words to a deck by typing German words (one per line or comma-separated). */
export async function addWords(_prev: AddWordsState, form: FormData): Promise<AddWordsState> {
  await requireStaff();
  const deckId = z.uuid().safeParse(form.get("deckId"));
  if (!deckId.success) return { ok: false, message: "Unknown deck." };
  const words = String(form.get("words") ?? "")
    .split(/[\n,;]/)
    .map((w) => w.trim().replace(/^(der|die|das)\s+/i, ""))
    .filter(Boolean)
    .slice(0, 300);
  if (words.length === 0) return { ok: false, message: "Type at least one word." };
  const supabase = await createClient();
  const { data: found } = await supabase.from("vocabulary").select("id, lemma").in("lemma", words);
  const { count } = await supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("deck_id", deckId.data);
  const rows = (found ?? []).map((v, i) => ({ deck_id: deckId.data, vocabulary_id: v.id, sort_order: (count ?? 0) + i + 1 }));
  if (rows.length) await supabase.from("flashcards").upsert(rows, { onConflict: "deck_id,vocabulary_id", ignoreDuplicates: true });
  const foundSet = new Set((found ?? []).map((f) => f.lemma.toLowerCase()));
  const missing = words.filter((w) => !foundSet.has(w.toLowerCase()));
  revalidatePath("/admin/flashcards");
  return {
    ok: missing.length === 0,
    message: `Added ${rows.length} ${rows.length === 1 ? "word" : "words"}.${missing.length ? ` Not found in the vocabulary: ${missing.join(", ")}.` : ""}`,
  };
}

export async function removeCard(form: FormData) {
  await requireStaff();
  const id = z.uuid().safeParse(form.get("cardId"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("flashcards").delete().eq("id", id.data);
  revalidatePath("/admin/flashcards");
}

export async function deleteDeck(form: FormData) {
  await requireStaff();
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success || form.get("confirm") !== "on") return;
  const supabase = await createClient();
  await supabase.from("flashcard_decks").delete().eq("id", id.data);
  revalidatePath("/admin/flashcards");
  redirect("/admin/flashcards");
}
