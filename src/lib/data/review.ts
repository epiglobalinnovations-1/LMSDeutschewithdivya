import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { applyReview, formatInterval, type ProgressFields, type ReviewRating } from "@/lib/srs/fsrs";

export const reviewInput = z.object({
  vocabularyId: z.uuid(),
  rating: z.enum(["again", "hard", "good", "easy"]),
  direction: z.enum(["de_en", "en_de"]),
  durationMs: z.number().int().min(0).max(3_600_000).optional(),
  source: z.string().max(40).optional(),
});
export type ReviewInput = z.infer<typeof reviewInput>;

export type ActivitySummary = {
  date: string;
  reviews: number;
  new_words: number;
  minutes: number;
  xp_today: number;
  streak: number;
  awarded: { key: string; title: string; xp: number }[];
};

export type ReviewOutcome =
  | { ok: true; state: ProgressFields["state"]; dueAt: string; interval: string; activity: ActivitySummary | null }
  | { ok: false; error: string };

const FIELDS =
  "state, stability, difficulty, due_at, last_reviewed_at, scheduled_days, learning_steps, reps, lapses, correct_count, incorrect_count, is_known";

/**
 * Record one review for the signed-in student: schedule it with FSRS, store
 * the new memory state, append to the review log and refresh today's
 * activity (XP, streak, achievements) through the database function.
 * RLS guarantees a student can only touch their own rows.
 */
export async function recordReview(userId: string, input: ReviewInput, opts: { markKnown?: boolean } = {}): Promise<ReviewOutcome> {
  const supabase = await createClient();
  const { data: vocab } = await supabase.from("vocabulary").select("id").eq("id", input.vocabularyId).maybeSingle();
  if (!vocab) return { ok: false, error: "This word is not available." };

  const { data: row, error: readError } = await supabase
    .from("student_vocabulary_progress")
    .select(FIELDS)
    .eq("user_id", userId)
    .eq("vocabulary_id", input.vocabularyId)
    .maybeSingle();
  if (readError) return { ok: false, error: "Could not load your progress. Please try again." };

  const now = new Date();
  const current: ProgressFields | null = row && row.state !== "new" ? row : null;
  const { next, log } = applyReview(current, input.rating as ReviewRating, now);

  const { error: upsertError } = await supabase.from("student_vocabulary_progress").upsert(
    {
      user_id: userId,
      vocabulary_id: input.vocabularyId,
      ...next,
      ...(current ? {} : { first_seen_at: now.toISOString() }),
      ...(opts.markKnown ? { is_known: true } : {}),
      source: input.source ?? "flashcards",
    },
    { onConflict: "user_id,vocabulary_id" },
  );
  if (upsertError) return { ok: false, error: "Could not save your answer. Please try again." };

  const { error: logError } = await supabase.from("review_history").insert({
    user_id: userId,
    vocabulary_id: input.vocabularyId,
    direction: input.direction,
    duration_ms: input.durationMs ?? null,
    ...log,
  });
  if (logError) console.error("review_history insert failed", logError);

  const { data: activity, error: actError } = await supabase.rpc("record_study_activity");
  if (actError) console.error("record_study_activity failed", actError);

  return {
    ok: true,
    state: next.state,
    dueAt: next.due_at,
    interval: formatInterval(new Date(next.due_at).getTime() - now.getTime()),
    activity: (activity as ActivitySummary | null) ?? null,
  };
}

export async function setBookmark(userId: string, vocabularyId: string, bookmarked: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("student_vocabulary_progress")
    .upsert({ user_id: userId, vocabulary_id: vocabularyId, is_bookmarked: bookmarked }, { onConflict: "user_id,vocabulary_id" });
  return !error;
}
