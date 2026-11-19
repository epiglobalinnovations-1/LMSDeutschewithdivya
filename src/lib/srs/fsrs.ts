/**
 * Spaced repetition with FSRS (Free Spaced Repetition Scheduler), via the
 * reference TypeScript implementation `ts-fsrs`.
 *
 * Maps between our `student_vocabulary_progress` rows and FSRS cards, applies
 * a rating, and classifies words into the five learner-facing categories.
 * Pure functions: no I/O, fully unit-tested.
 */
import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from "ts-fsrs";

export type SrsState = "new" | "learning" | "review" | "relearning";
export type ReviewRating = "again" | "hard" | "good" | "easy";

/** The scheduling fields we persist per student per word. */
export type ProgressFields = {
  state: SrsState;
  stability: number;
  difficulty: number;
  due_at: string;
  last_reviewed_at: string | null;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  correct_count: number;
  incorrect_count: number;
};

export const DESIRED_RETENTION = 0.9;

const scheduler = fsrs(
  generatorParameters({
    request_retention: DESIRED_RETENTION,
    maximum_interval: 365 * 3,
    enable_fuzz: true,
    enable_short_term: true,
    learning_steps: ["1m", "10m"],
    relearning_steps: ["10m"],
  }),
);

const stateToFsrs: Record<SrsState, State> = {
  new: State.New,
  learning: State.Learning,
  review: State.Review,
  relearning: State.Relearning,
};
const fsrsToState: Record<State, SrsState> = {
  [State.New]: "new",
  [State.Learning]: "learning",
  [State.Review]: "review",
  [State.Relearning]: "relearning",
};
const ratingToFsrs: Record<ReviewRating, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

export function emptyProgress(now: Date): ProgressFields {
  return fromCard(createEmptyCard(now), { correct_count: 0, incorrect_count: 0 });
}

function toCard(p: ProgressFields): Card {
  return {
    due: new Date(p.due_at),
    stability: p.stability,
    difficulty: p.difficulty,
    elapsed_days: 0,
    scheduled_days: p.scheduled_days,
    learning_steps: p.learning_steps,
    reps: p.reps,
    lapses: p.lapses,
    state: stateToFsrs[p.state],
    last_review: p.last_reviewed_at ? new Date(p.last_reviewed_at) : undefined,
  };
}

function fromCard(card: Card, counts: Pick<ProgressFields, "correct_count" | "incorrect_count">): ProgressFields {
  return {
    state: fsrsToState[card.state],
    stability: card.stability,
    difficulty: card.difficulty,
    due_at: card.due.toISOString(),
    last_reviewed_at: card.last_review ? card.last_review.toISOString() : null,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    ...counts,
  };
}

export type ReviewResult = {
  next: ProgressFields;
  log: {
    rating: ReviewRating;
    state_before: SrsState;
    stability_after: number;
    difficulty_after: number;
    elapsed_days: number;
    scheduled_days: number;
  };
};

/** Apply one review to a word's progress (or to a brand-new word when `current` is null). */
export function applyReview(current: ProgressFields | null, rating: ReviewRating, now: Date): ReviewResult {
  const before = current ?? emptyProgress(now);
  const card = toCard(before);
  const { card: after } = scheduler.next(card, now, ratingToFsrs[rating]);
  const correct = rating !== "again";
  const next = fromCard(after, {
    correct_count: before.correct_count + (correct ? 1 : 0),
    incorrect_count: before.incorrect_count + (correct ? 0 : 1),
  });
  const elapsedMs = before.last_reviewed_at ? now.getTime() - new Date(before.last_reviewed_at).getTime() : 0;
  return {
    next,
    log: {
      rating,
      state_before: before.state,
      stability_after: after.stability,
      difficulty_after: after.difficulty,
      elapsed_days: Math.max(0, elapsedMs / 86_400_000),
      scheduled_days: after.scheduled_days,
    },
  };
}

/** Probability (0–1) that the student still remembers the word now. */
export function retrievability(p: ProgressFields, now: Date): number {
  if (p.state === "new" || !p.last_reviewed_at) return 0;
  return scheduler.get_retrievability(toCard(p), now, false);
}

/** When each rating would bring the card back, for labelling the buttons. */
export function previewIntervals(current: ProgressFields | null, now: Date): Record<ReviewRating, string> {
  const out = {} as Record<ReviewRating, string>;
  for (const r of ["again", "hard", "good", "easy"] as const) {
    out[r] = formatInterval(new Date(applyReview(current, r, now).next.due_at).getTime() - now.getTime());
  }
  return out;
}

export function formatInterval(ms: number): string {
  const min = Math.max(1, Math.round(ms / 60_000));
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  if (d < 31) return `${d} d`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo} mo`;
  return `${(d / 365).toFixed(1)} y`;
}

// ---------------------------------------------------------------- categories

export type WordCategory = "new" | "learning" | "due" | "difficult" | "mastered";

/** Mastered: in long-term review and expected to be remembered for 3+ weeks. */
export const MASTERED_STABILITY_DAYS = 21;
/** Difficult: FSRS difficulty ≥ 7 (of 10) or forgotten 3+ times. */
export const DIFFICULT_DIFFICULTY = 7;
export const DIFFICULT_LAPSES = 3;

export function isDifficult(p: Pick<ProgressFields, "difficulty" | "lapses" | "state">) {
  return p.state !== "new" && (p.difficulty >= DIFFICULT_DIFFICULTY || p.lapses >= DIFFICULT_LAPSES);
}
export function isMastered(p: Pick<ProgressFields, "state" | "stability">) {
  return p.state === "review" && p.stability >= MASTERED_STABILITY_DAYS;
}
export function isDue(p: Pick<ProgressFields, "state" | "due_at">, now: Date) {
  return p.state !== "new" && new Date(p.due_at).getTime() <= now.getTime();
}

/** All categories a word belongs to (a difficult word can also be due). */
export function categoriesOf(p: ProgressFields | null, now: Date): WordCategory[] {
  if (!p || p.state === "new") return ["new"];
  const out: WordCategory[] = [];
  if (p.state === "learning" || p.state === "relearning") out.push("learning");
  if (isDue(p, now)) out.push("due");
  if (isDifficult(p)) out.push("difficult");
  if (isMastered(p)) out.push("mastered");
  return out;
}
