import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ProgressFields } from "@/lib/srs/fsrs";
import type { VerbForms } from "@/lib/import/vocabulary";

export type StudyMode = "daily" | "review" | "new" | "difficult" | "bookmarked";
export const STUDY_MODES: StudyMode[] = ["daily", "review", "new", "difficult", "bookmarked"];

export type StudyCard = {
  id: string;
  lemma: string;
  article: "der" | "die" | "das" | null;
  plural: string | null;
  hasPlural: boolean | null;
  partOfSpeech: string;
  cefrLevel: string;
  topic: string | null;
  ipa: string | null;
  pronunciationGuide: string | null;
  translations: string[];
  examples: { de: string; en: string }[];
  verbForms: VerbForms | null;
  auxiliary: string | null;
  isVerified: boolean;
  isBookmarked: boolean;
  progress: ProgressFields | null;
};

const VOCAB_FIELDS =
  "id, lemma, article, plural, has_plural, part_of_speech, cefr_level, ipa, pronunciation_guide, verb_forms, auxiliary, is_verified, topics(name), vocabulary_translations(translation, is_primary, sort_order), vocabulary_examples(sentence_de, sentence_en, sort_order)";

const PROGRESS_FIELDS =
  "vocabulary_id, state, stability, difficulty, due_at, last_reviewed_at, scheduled_days, learning_steps, reps, lapses, correct_count, incorrect_count, is_bookmarked, is_known";

type ProgressRow = ProgressFields & { vocabulary_id: string; is_bookmarked: boolean; is_known: boolean };

/** Calendar date (YYYY-MM-DD) in the student's timezone. */
export function localDate(timezone: string, now = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

type VocabRow = {
  id: string;
  lemma: string;
  article: "der" | "die" | "das" | null;
  plural: string | null;
  has_plural: boolean | null;
  part_of_speech: string;
  cefr_level: string;
  ipa: string | null;
  pronunciation_guide: string | null;
  verb_forms: unknown;
  auxiliary: string | null;
  is_verified: boolean;
  topics: { name: string } | null;
  vocabulary_translations: { translation: string; is_primary: boolean; sort_order: number }[];
  vocabulary_examples: { sentence_de: string; sentence_en: string; sort_order: number }[];
};

export function toStudyCard(v: VocabRow, p: ProgressRow | undefined): StudyCard {
  const translations = [...v.vocabulary_translations]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    .map((t) => t.translation);
  return {
    id: v.id,
    lemma: v.lemma,
    article: v.article,
    plural: v.plural,
    hasPlural: v.has_plural,
    partOfSpeech: v.part_of_speech,
    cefrLevel: v.cefr_level,
    topic: v.topics?.name ?? null,
    ipa: v.ipa,
    pronunciationGuide: v.pronunciation_guide,
    translations,
    examples: [...v.vocabulary_examples].sort((a, b) => a.sort_order - b.sort_order).map((e) => ({ de: e.sentence_de, en: e.sentence_en })),
    verbForms: (v.verb_forms as VerbForms | null) ?? null,
    auxiliary: v.auxiliary,
    isVerified: v.is_verified,
    isBookmarked: p?.is_bookmarked ?? false,
    progress: p
      ? {
          state: p.state,
          stability: p.stability,
          difficulty: p.difficulty,
          due_at: p.due_at,
          last_reviewed_at: p.last_reviewed_at,
          scheduled_days: p.scheduled_days,
          learning_steps: p.learning_steps,
          reps: p.reps,
          lapses: p.lapses,
          correct_count: p.correct_count,
          incorrect_count: p.incorrect_count,
        }
      : null,
  };
}

export async function getPublishedDecks() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("flashcard_decks")
    .select("id, slug, title, description, cefr_level, required_plan, topics(name), flashcards(count)")
    .eq("is_published", true)
    .order("cefr_level")
    .order("sort_order")
    .order("title");
  return (data ?? []).map((d) => ({
    id: d.id,
    slug: d.slug,
    title: d.title,
    description: d.description,
    cefrLevel: d.cefr_level,
    requiredPlan: d.required_plan,
    topic: (d.topics as { name: string } | null)?.name ?? null,
    cardCount: (d.flashcards as unknown as { count: number }[])[0]?.count ?? 0,
  }));
}

/** New words studied today, from daily_activity in the student's timezone. */
export async function getNewWordsToday(userId: string, timezone: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_activity")
    .select("new_words, reviews, xp")
    .eq("user_id", userId)
    .eq("activity_date", localDate(timezone))
    .maybeSingle();
  return { newWords: data?.new_words ?? 0, reviews: data?.reviews ?? 0, xp: data?.xp ?? 0 };
}

export type SessionPlan = {
  cards: StudyCard[];
  dueCount: number;
  newCount: number;
  newRemainingToday: number;
  deck: { slug: string; title: string } | null;
};

const MAX_REVIEWS_PER_SESSION = 100;

/**
 * Build a study session for the signed-in student.
 *  daily:      due reviews first, then new words up to what is left of today's target
 *  review:     due reviews only
 *  new:        new words only (still capped by today's target)
 *  difficult:  the hardest words, due or not
 *  bookmarked: bookmarked words, due or not
 * A deck slug narrows every mode to that deck. Without a deck, new words come
 * from the student's current level, in deck order.
 */
export async function buildStudySession(opts: {
  userId: string;
  level: string;
  dailyTarget: number;
  timezone: string;
  mode: StudyMode;
  deckSlug?: string | null;
}): Promise<SessionPlan> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  let deck: { id: string; slug: string; title: string } | null = null;
  let deckVocab: string[] | null = null;
  if (opts.deckSlug) {
    const { data } = await supabase
      .from("flashcard_decks")
      .select("id, slug, title, flashcards(vocabulary_id, sort_order)")
      .eq("slug", opts.deckSlug)
      .eq("is_published", true)
      .maybeSingle();
    if (data) {
      deck = { id: data.id, slug: data.slug, title: data.title };
      deckVocab = [...data.flashcards].sort((a, b) => a.sort_order - b.sort_order).map((f) => f.vocabulary_id);
    }
  }

  const { data: progressRows } = await supabase
    .from("student_vocabulary_progress")
    .select(PROGRESS_FIELDS)
    .eq("user_id", opts.userId)
    .limit(20000);
  const progress = new Map<string, ProgressRow>((progressRows ?? []).map((r) => [r.vocabulary_id, r as ProgressRow]));
  const inDeck = (id: string) => !deckVocab || deckVocab.includes(id);

  const started = [...progress.values()].filter((p) => p.state !== "new" && inDeck(p.vocabulary_id));
  const due = started.filter((p) => p.due_at <= now).sort((a, b) => a.due_at.localeCompare(b.due_at));

  const { newWords } = await getNewWordsToday(opts.userId, opts.timezone);
  const newRemainingToday = Math.max(0, opts.dailyTarget - newWords);

  let ids: string[] = [];
  let dueIds: string[] = [];
  let newIds: string[] = [];

  if (opts.mode === "difficult") {
    ids = started
      .filter((p) => p.difficulty >= 7 || p.lapses >= 3)
      .sort((a, b) => b.difficulty - a.difficulty || b.lapses - a.lapses)
      .slice(0, 50)
      .map((p) => p.vocabulary_id);
  } else if (opts.mode === "bookmarked") {
    ids = [...progress.values()].filter((p) => p.is_bookmarked && inDeck(p.vocabulary_id)).slice(0, 100).map((p) => p.vocabulary_id);
  } else {
    if (opts.mode !== "new") dueIds = due.slice(0, MAX_REVIEWS_PER_SESSION).map((p) => p.vocabulary_id);
    if (opts.mode !== "review" && newRemainingToday > 0) {
      const fresh = (id: string) => {
        const p = progress.get(id);
        return !p || (p.state === "new" && !p.is_known);
      };
      if (deckVocab) {
        newIds = deckVocab.filter(fresh).slice(0, newRemainingToday);
      } else {
        const { data: candidates } = await supabase
          .from("vocabulary")
          .select("id, flashcards(sort_order)")
          .eq("is_published", true)
          .eq("cefr_level", opts.level as "A1")
          .order("frequency_rank", { ascending: true, nullsFirst: false })
          .order("content_id", { ascending: true, nullsFirst: false })
          .limit(2000);
        newIds = (candidates ?? [])
          .map((c) => c.id)
          .filter(fresh)
          .slice(0, newRemainingToday);
      }
    }
    ids = [...dueIds, ...newIds];
  }

  const cards = await loadCards(ids, progress);
  return { cards, dueCount: dueIds.length || due.length, newCount: newIds.length, newRemainingToday, deck: deck && { slug: deck.slug, title: deck.title } };
}

async function loadCards(ids: string[], progress: Map<string, ProgressRow>) {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const rows: VocabRow[] = [];
  for (let i = 0; i < ids.length; i += 150) {
    const { data, error } = await supabase.from("vocabulary").select(VOCAB_FIELDS).in("id", ids.slice(i, i + 150));
    if (error) throw new Error(`Could not load words: ${error.message}`);
    rows.push(...((data ?? []) as unknown as VocabRow[]));
  }
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.flatMap((id) => {
    const v = byId.get(id);
    return v ? [toStudyCard(v, progress.get(id))] : [];
  });
}

/** One word with the student's progress, for the vocabulary detail page. */
export async function getWord(userId: string, id: string) {
  const supabase = await createClient();
  const [{ data: v }, { data: p }] = await Promise.all([
    supabase.from("vocabulary").select(VOCAB_FIELDS).eq("id", id).maybeSingle(),
    supabase.from("student_vocabulary_progress").select(PROGRESS_FIELDS).eq("user_id", userId).eq("vocabulary_id", id).maybeSingle(),
  ]);
  if (!v) return null;
  return toStudyCard(v as unknown as VocabRow, (p as ProgressRow | null) ?? undefined);
}

export type LibraryFilter = {
  q?: string;
  level?: string;
  topic?: string;
  category?: "new" | "learning" | "due" | "difficult" | "mastered" | "bookmarked" | "known";
  deck?: string;
  page?: number;
};
export const LIBRARY_PAGE_SIZE = 40;

/** Searchable vocabulary list with the student's progress merged in. */
export async function searchLibrary(userId: string, f: LibraryFilter) {
  const supabase = await createClient();
  const page = Math.max(1, f.page ?? 1);
  const now = new Date().toISOString();

  // Category filters are driven by the student's own progress rows.
  let restrict: string[] | null = null;
  let exclude: string[] = [];
  if (f.category && f.category !== "new") {
    let q = supabase.from("student_vocabulary_progress").select("vocabulary_id").eq("user_id", userId).limit(20000);
    if (f.category === "learning") q = q.in("state", ["learning", "relearning"]);
    if (f.category === "due") q = q.neq("state", "new").lte("due_at", now);
    if (f.category === "difficult") q = q.neq("state", "new").or("difficulty.gte.7,lapses.gte.3");
    if (f.category === "mastered") q = q.eq("state", "review").gte("stability", 21);
    if (f.category === "bookmarked") q = q.eq("is_bookmarked", true);
    if (f.category === "known") q = q.eq("is_known", true);
    const { data } = await q;
    restrict = (data ?? []).map((r) => r.vocabulary_id);
  } else if (f.category === "new") {
    const { data } = await supabase.from("student_vocabulary_progress").select("vocabulary_id").eq("user_id", userId).neq("state", "new").limit(20000);
    exclude = (data ?? []).map((r) => r.vocabulary_id);
  }

  if (f.deck) {
    const { data: d } = await supabase.from("flashcard_decks").select("flashcards(vocabulary_id)").eq("slug", f.deck).maybeSingle();
    const deckIds = (d?.flashcards ?? []).map((c) => c.vocabulary_id);
    restrict = restrict ? restrict.filter((id) => deckIds.includes(id)) : deckIds;
  }
  if (restrict && restrict.length === 0) return { cards: [] as StudyCard[], total: 0, page };

  let query = supabase.from("vocabulary").select(VOCAB_FIELDS + ", topic_id", { count: "exact" }).eq("is_published", true);
  if (f.level) query = query.eq("cefr_level", f.level as "A1");
  if (f.topic) {
    const { data: t } = await supabase.from("topics").select("id").eq("slug", f.topic).maybeSingle();
    query = query.eq("topic_id", t?.id ?? -1);
  }
  if (f.q) {
    const term = f.q.replace(/[%_,()]/g, " ").trim();
    if (term) {
      const { data: tr } = await supabase.from("vocabulary_translations").select("vocabulary_id").ilike("translation", `%${term}%`).limit(500);
      const trIds = (tr ?? []).map((r) => r.vocabulary_id);
      query = trIds.length
        ? query.or(`lemma.ilike.%${term}%,id.in.(${trIds.join(",")})`)
        : query.ilike("lemma", `%${term}%`);
    }
  }
  if (restrict) query = query.in("id", restrict.slice(0, 1000));
  if (exclude.length) query = query.not("id", "in", `(${exclude.slice(0, 1000).join(",")})`);

  const from = (page - 1) * LIBRARY_PAGE_SIZE;
  const { data, count, error } = await query.order("lemma").range(from, from + LIBRARY_PAGE_SIZE - 1);
  if (error) throw new Error(`Could not search vocabulary: ${error.message}`);
  const rows = (data ?? []) as unknown as VocabRow[];

  const { data: prog } = rows.length
    ? await supabase
        .from("student_vocabulary_progress")
        .select(PROGRESS_FIELDS)
        .eq("user_id", userId)
        .in(
          "vocabulary_id",
          rows.map((r) => r.id),
        )
    : { data: [] };
  const pmap = new Map((prog ?? []).map((p) => [p.vocabulary_id, p as ProgressRow]));
  return { cards: rows.map((r) => toStudyCard(r, pmap.get(r.id))), total: count ?? 0, page };
}

export async function getTopics() {
  const supabase = await createClient();
  const { data } = await supabase.from("topics").select("slug, name").order("sort_order");
  return data ?? [];
}

export async function getCategoryCounts() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("vocabulary_category_counts");
  const row = data?.[0];
  return {
    learning: Number(row?.learning ?? 0),
    due: Number(row?.due ?? 0),
    difficult: Number(row?.difficult ?? 0),
    mastered: Number(row?.mastered ?? 0),
    bookmarked: Number(row?.bookmarked ?? 0),
    totalSeen: Number(row?.total_seen ?? 0),
  };
}
