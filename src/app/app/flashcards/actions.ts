"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { recordReview, reviewInput, setBookmark, type ReviewOutcome } from "@/lib/data/review";

export async function submitReview(raw: unknown): Promise<ReviewOutcome> {
  const user = await requireUser("/app/flashcards");
  const parsed = reviewInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Invalid review." };
  return recordReview(user.id, parsed.data);
}

export async function toggleBookmark(vocabularyId: string, bookmarked: boolean): Promise<{ ok: boolean }> {
  const user = await requireUser("/app/flashcards");
  const id = z.uuid().safeParse(vocabularyId);
  if (!id.success) return { ok: false };
  const ok = await setBookmark(user.id, id.data, bookmarked);
  revalidatePath("/app/vocabulary");
  return { ok };
}

/** "I already know this word": counts as an Easy review and is remembered as known. */
export async function markKnown(vocabularyId: string): Promise<ReviewOutcome> {
  const user = await requireUser("/app/vocabulary");
  const id = z.uuid().safeParse(vocabularyId);
  if (!id.success) return { ok: false, error: "Invalid word." };
  const out = await recordReview(user.id, { vocabularyId: id.data, rating: "easy", direction: "de_en", source: "library" }, { markKnown: true });
  revalidatePath("/app/vocabulary");
  return out;
}
