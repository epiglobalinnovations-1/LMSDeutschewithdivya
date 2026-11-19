"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { submitReview, toggleBookmark } from "@/app/app/flashcards/actions";
import { buttonClasses } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { StudyCard } from "@/lib/data/study";
import type { ActivitySummary } from "@/lib/data/review";
import { previewIntervals, type ReviewRating } from "@/lib/srs/fsrs";
import { SpeakButton } from "./flashcard";

type Direction = "de_en" | "en_de";
type Result = { cardId: string; rating: ReviewRating; interval: string };

const RATINGS: { rating: ReviewRating; label: string; key: string; tone: string }[] = [
  { rating: "again", label: "Don't know", key: "1", tone: "border-danger/40 text-danger hover:bg-danger-soft" },
  { rating: "hard", label: "Hard", key: "2", tone: "border-line-strong text-ink hover:bg-paper-deep" },
  { rating: "good", label: "Know it", key: "3", tone: "border-success/40 text-success hover:bg-success-soft" },
  { rating: "easy", label: "Easy", key: "4", tone: "border-line-strong text-ink hover:bg-paper-deep" },
];
const MAX_REPEATS = 3;
const SWIPE_PX = 90;

const articleTone: Record<string, string> = { der: "text-[#1f4e79]", die: "text-accent", das: "text-success" };

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * A full flashcard session: flip, swipe (right = know it, left = don't know),
 * keyboard shortcuts, four FSRS ratings, bookmark, shuffle, previous/next,
 * DE→EN and EN→DE, a progress bar and an end-of-session summary. Every rating
 * is saved on the server immediately, so closing the tab never loses work.
 */
export function StudySession({
  cards,
  initialDirection,
  backHref,
  title,
}: {
  cards: StudyCard[];
  initialDirection: Direction;
  backHref: string;
  title: string;
}) {
  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const [queue, setQueue] = useState<string[]>(() => cards.map((c) => c.id));
  const [pos, setPos] = useState(0);
  const [viewBack, setViewBack] = useState<number | null>(null); // index into results when looking back
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState<Direction>(initialDirection);
  const [results, setResults] = useState<Result[]>([]);
  const [repeats, setRepeats] = useState<Record<string, number>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>(() => Object.fromEntries(cards.map((c) => [c.id, c.isBookmarked])));
  const [progressById, setProgressById] = useState(() => new Map(cards.map((c) => [c.id, c.progress])));
  const [activity, setActivity] = useState<ActivitySummary | null>(null);
  const [awarded, setAwarded] = useState<ActivitySummary["awarded"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const shownAt = useRef<number>(0);

  const done = pos >= queue.length;
  const reviewing = viewBack !== null ? results[viewBack] : null;
  const currentId = reviewing ? reviewing.cardId : queue[pos];
  const card = currentId ? byId.get(currentId) : undefined;
  const uniqueTotal = cards.length;
  const uniqueDone = new Set(results.filter((r) => r.rating !== "again").map((r) => r.cardId)).size;

  useEffect(() => {
    shownAt.current = Date.now();
  }, [currentId]);

  const intervals = useMemo(() => {
    if (!card || reviewing) return null;
    // Recomputed per card; labels are approximate, so the current time is fine.
    return previewIntervals(progressById.get(card.id) ?? null, new Date());
  }, [card, reviewing, progressById]);

  const rate = useCallback(
    (rating: ReviewRating) => {
      if (!card || reviewing || pending) return;
      const durationMs = Math.min(Date.now() - shownAt.current, 3_600_000);
      const id = card.id;
      setError(null);
      startTransition(async () => {
        const res = await submitReview({ vocabularyId: id, rating, direction, durationMs });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setResults((r) => [...r, { cardId: id, rating, interval: res.interval }]);
        setProgressById((m) => {
          const next = new Map(m);
          const prev = m.get(id);
          next.set(id, {
            ...(prev ?? { stability: 0, difficulty: 0, scheduled_days: 0, learning_steps: 0, reps: 0, lapses: 0, correct_count: 0, incorrect_count: 0, last_reviewed_at: null }),
            state: res.state,
            due_at: res.dueAt,
            last_reviewed_at: new Date().toISOString(),
          });
          return next;
        });
        if (res.activity) {
          setActivity(res.activity);
          if (res.activity.awarded.length) setAwarded((a) => [...a, ...res.activity!.awarded]);
        }
        // Forgotten words come back later in the same session.
        if (rating === "again" && (repeats[id] ?? 0) < MAX_REPEATS) {
          setRepeats((r) => ({ ...r, [id]: (r[id] ?? 0) + 1 }));
          setQueue((q) => {
            const insertAt = Math.min(q.length, pos + 4);
            return [...q.slice(0, insertAt), id, ...q.slice(insertAt)];
          });
        }
        setPos((p) => p + 1);
        setFlipped(false);
        setDrag(0);
      });
    },
    [card, reviewing, pending, direction, repeats, pos],
  );

  const next = useCallback(() => {
    if (viewBack !== null) {
      setViewBack(viewBack + 1 < results.length ? viewBack + 1 : null);
      setFlipped(false);
      return;
    }
    // Skip: move the current card to the end of the queue.
    if (!done && queue.length - pos > 1) {
      setQueue((q) => [...q.slice(0, pos), ...q.slice(pos + 1), q[pos]]);
      setFlipped(false);
    }
  }, [viewBack, results.length, done, queue.length, pos]);

  const prev = useCallback(() => {
    if (results.length === 0) return;
    setViewBack((v) => (v === null ? results.length - 1 : Math.max(0, v - 1)));
    setFlipped(true);
  }, [results.length]);

  const shuffleRest = useCallback(() => {
    setQueue((q) => [...q.slice(0, pos), ...shuffled(q.slice(pos))]);
    setFlipped(false);
  }, [pos]);

  const bookmark = useCallback(() => {
    if (!card) return;
    const id = card.id;
    const value = !bookmarks[id];
    setBookmarks((b) => ({ ...b, [id]: value }));
    toggleBookmark(id, value).then((r) => {
      if (!r.ok) {
        setBookmarks((b) => ({ ...b, [id]: !value }));
        setError("Could not update the bookmark.");
      }
    });
  }, [card, bookmarks]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === " " || k === "enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (k === "arrowleft") prev();
      else if (k === "arrowright") next();
      else if (k === "b") bookmark();
      else if (k === "s") shuffleRest();
      else if (k === "d") setDirection((d) => (d === "de_en" ? "en_de" : "de_en"));
      else if (flipped && !reviewing) {
        const r = RATINGS.find((x) => x.key === k);
        if (r) rate(r.rating);
        if (k === "k") rate("good");
        if (k === "u") rate("again");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, bookmark, shuffleRest, rate, flipped, reviewing]);

  if (cards.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-8 text-center">
        <p className="font-display text-2xl">Nothing to study right now</p>
        <p className="mt-2 text-ink-soft">You have no reviews due and today’s new-word target is complete. Come back tomorrow, or practise a deck.</p>
        <Link href={backHref} className={buttonClasses("primary", "md", "mt-6")}>
          Back to flashcards
        </Link>
      </div>
    );
  }

  if (done && viewBack === null) {
    return <Summary results={results} activity={activity} awarded={awarded} backHref={backHref} cards={byId} onReview={prev} />;
  }
  if (!card) return null;

  const german = card.article ? `${card.article} ${card.lemma}` : card.lemma;
  const translation = card.translations.join(", ");
  const example = card.examples[0];
  const promptGerman = direction === "de_en";

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center justify-between gap-3 text-sm">
        <Link href={backHref} className="text-ink-soft hover:text-accent">
          ← {title}
        </Link>
        <span className="tabular-nums text-muted" aria-live="polite">
          {Math.min(uniqueDone, uniqueTotal)} / {uniqueTotal}
        </span>
      </div>
      <ProgressBar value={(uniqueDone / uniqueTotal) * 100} label="Session progress" />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-full border border-line bg-surface p-0.5 text-sm" role="group" aria-label="Direction">
          {(["de_en", "en_de"] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={direction === d}
              onClick={() => {
                setDirection(d);
                setFlipped(false);
              }}
              className={cn("rounded-full px-3 py-1", direction === d ? "bg-ink text-paper" : "text-ink-soft")}
            >
              {d === "de_en" ? "DE → EN" : "EN → DE"}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <IconButton label="Previous card (←)" onClick={prev} disabled={results.length === 0 || viewBack === 0}>
            ‹
          </IconButton>
          <IconButton label="Next card (→)" onClick={next} disabled={viewBack === null && queue.length - pos <= 1}>
            ›
          </IconButton>
          <IconButton label="Shuffle remaining cards (S)" onClick={shuffleRest} disabled={queue.length - pos <= 1 || viewBack !== null}>
            ⤨
          </IconButton>
          <IconButton label={bookmarks[card.id] ? "Remove bookmark (B)" : "Bookmark (B)"} onClick={bookmark} pressed={bookmarks[card.id]}>
            {bookmarks[card.id] ? "★" : "☆"}
          </IconButton>
        </div>
      </div>

      {reviewing && (
        <p className="mt-3 rounded-xl bg-gold-soft px-3 py-2 text-sm text-[#7a5f17]">
          Looking back: you answered “{RATINGS.find((r) => r.rating === reviewing.rating)?.label}”, next review in {reviewing.interval}.{" "}
          <button type="button" className="font-medium underline" onClick={() => setViewBack(null)}>
            Return to session
          </button>
        </p>
      )}

      <div
        className="mt-4 touch-pan-y [perspective:1400px]"
        onPointerDown={(e) => {
          dragStart.current = e.clientX;
          setDragging(true);
        }}
        onPointerMove={(e) => {
          if (dragStart.current !== null) setDrag(e.clientX - dragStart.current);
        }}
        onPointerUp={() => {
          const dx = drag;
          dragStart.current = null;
          setDragging(false);
          // A drag is not a tap: ignore the click event that follows it.
          suppressClick.current = Math.abs(dx) >= 8;
          if (Math.abs(dx) > SWIPE_PX && !reviewing) {
            if (!flipped) {
              setFlipped(true);
              setDrag(0);
            } else rate(dx > 0 ? "good" : "again");
          } else setDrag(0);
        }}
        onPointerCancel={() => {
          dragStart.current = null;
          setDragging(false);
          setDrag(0);
        }}
      >
        <div
          role="button"
          tabIndex={0}
          aria-pressed={flipped}
          aria-label={flipped ? "Answer side. Press Space to turn back." : "Question side. Press Space to reveal the answer."}
          onClick={() => {
            if (suppressClick.current) {
              suppressClick.current = false;
              return;
            }
            setFlipped((f) => !f);
          }}
          style={{ transform: `translateX(${drag}px) rotate(${drag / 30}deg)` }}
          className={cn("relative transition-transform", !dragging && "duration-300")}
        >
          <div
            className={cn(
              "relative grid min-h-[22rem] select-none transition-transform duration-500 [transform-style:preserve-3d]",
              flipped && "[transform:rotateY(180deg)]",
            )}
          >
            <Face>
              <Meta card={card} />
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                {promptGerman ? (
                  <>
                    {card.article && (
                      <span className={cn("text-sm font-semibold uppercase tracking-[0.2em]", articleTone[card.article])}>{card.article}</span>
                    )}
                    <span className="font-display text-4xl font-medium sm:text-5xl">{card.lemma}</span>
                  </>
                ) : (
                  <span className="font-display text-3xl sm:text-4xl">{translation}</span>
                )}
                <span className="text-sm text-muted">{card.partOfSpeech}</span>
              </div>
              <p className="text-center text-xs text-muted">Tap, press Space or swipe to reveal</p>
            </Face>
            <Face back>
              <Meta card={card} />
              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                <span className="font-display text-3xl">{promptGerman ? translation : german}</span>
                {promptGerman ? null : <span className="text-sm text-muted">{translation}</span>}
                {(card.ipa || card.pronunciationGuide) && (
                  <p className="text-sm text-ink-soft">
                    {card.ipa && <span className="font-mono">/{card.ipa}/</span>}
                    {card.ipa && card.pronunciationGuide && " · "}
                    {card.pronunciationGuide}
                  </p>
                )}
                {card.partOfSpeech === "noun" && (
                  <p className="text-sm text-ink-soft">
                    Plural: {card.plural ? `die ${card.plural}` : card.hasPlural === false ? "no plural in normal use" : "–"}
                  </p>
                )}
                {card.verbForms?.present && (
                  <p className="text-sm text-ink-soft">
                    ich {card.verbForms.present.ich} · du {card.verbForms.present.du} · er/sie/es {card.verbForms.present.er_sie_es}
                    {card.verbForms.partizip_ii && ` · Perfekt: ${card.auxiliary === "sein" ? "ist" : "hat"} ${card.verbForms.partizip_ii}`}
                  </p>
                )}
                {example && (
                  <blockquote className="max-w-sm">
                    <p className="font-display text-lg italic">„{example.de}“</p>
                    <p className="mt-1 text-sm text-muted">{example.en}</p>
                  </blockquote>
                )}
              </div>
              <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                <SpeakButton text={german} label="Word" />
                {example && <SpeakButton text={example.de} label="Example" />}
              </div>
            </Face>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {flipped && !reviewing ? (
          RATINGS.map((r) => (
            <button
              key={r.rating}
              type="button"
              disabled={pending}
              onClick={() => rate(r.rating)}
              className={cn("flex flex-col items-center rounded-2xl border bg-surface px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-60", r.tone)}
            >
              {r.label}
              <span className="text-xs font-normal text-muted">
                {intervals?.[r.rating]} · {r.key}
              </span>
            </button>
          ))
        ) : (
          <button
            type="button"
            onClick={() => setFlipped(true)}
            disabled={!!reviewing}
            className={buttonClasses("primary", "lg", "col-span-2 sm:col-span-4")}
          >
            Show answer
          </button>
        )}
      </div>
      <p className="mt-4 hidden text-center text-xs text-muted sm:block">
        Space flip · 1–4 rate · K know · U don’t know · ← → previous/next · S shuffle · B bookmark · D direction
      </p>
      <p className="mt-4 text-center text-xs text-muted sm:hidden">Swipe right if you know it, left if you don’t.</p>
      {!card.isVerified && <p className="mt-2 text-center text-xs text-muted">Draft entry, awaiting teacher review.</p>}
    </div>
  );
}

function Face({ back, children }: { back?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex min-h-[22rem] flex-col rounded-[1.5rem] border border-line bg-surface p-6 shadow-[var(--shadow-lift)] [backface-visibility:hidden] [grid-area:1/1]",
        back && "[transform:rotateY(180deg)]",
      )}
    >
      {children}
    </div>
  );
}

function Meta({ card }: { card: StudyCard }) {
  const state = card.progress?.state ?? "new";
  return (
    <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-muted">
      <span>{card.topic ?? ""}</span>
      <span className="flex gap-1.5">
        <span className={cn("rounded-full px-2 py-0.5", state === "new" ? "bg-gold-soft text-[#7a5f17]" : "bg-paper-deep text-ink-soft")}>
          {state === "new" ? "New" : state === "review" ? "Review" : "Learning"}
        </span>
        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent">{card.cefrLevel}</span>
      </span>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-lg leading-none text-ink hover:border-ink disabled:opacity-40",
        pressed && "border-gold text-gold",
      )}
    >
      {children}
    </button>
  );
}

function Summary({
  results,
  activity,
  awarded,
  backHref,
  cards,
  onReview,
}: {
  results: Result[];
  activity: ActivitySummary | null;
  awarded: ActivitySummary["awarded"];
  backHref: string;
  cards: Map<string, StudyCard>;
  onReview: () => void;
}) {
  const unique = new Set(results.map((r) => r.cardId));
  const firstTry = new Map<string, ReviewRating>();
  for (const r of results) if (!firstTry.has(r.cardId)) firstTry.set(r.cardId, r.rating);
  const knew = [...firstTry.values()].filter((r) => r !== "again").length;
  const missed = [...firstTry.entries()].filter(([, r]) => r === "again").map(([id]) => cards.get(id)).filter(Boolean) as StudyCard[];
  const accuracy = unique.size ? Math.round((knew / unique.size) * 100) : 0;

  return (
    <div className="mx-auto max-w-xl rounded-[var(--radius-card)] border border-line bg-surface p-6 sm:p-8" data-testid="session-summary">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Session complete</p>
      <h2 className="mt-2 font-display text-3xl">Gut gemacht!</h2>
      <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
        <SummaryStat label="Words" value={unique.size} />
        <SummaryStat label="Knew first time" value={`${accuracy}%`} />
        <SummaryStat label="XP today" value={activity?.xp_today ?? 0} />
      </dl>
      {activity && (
        <p className="mt-4 text-sm text-ink-soft">
          Streak: {activity.streak} {activity.streak === 1 ? "day" : "days"} · {activity.reviews} reviews and {activity.new_words} new words today
        </p>
      )}
      {awarded.length > 0 && (
        <div className="mt-5 rounded-2xl bg-gold-soft p-4">
          <p className="font-medium">New achievement{awarded.length > 1 ? "s" : ""}</p>
          <ul className="mt-1 text-sm">
            {awarded.map((a) => (
              <li key={a.key}>
                {a.title} (+{a.xp} XP)
              </li>
            ))}
          </ul>
        </div>
      )}
      {missed.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-medium">Words to look at again</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {missed.map((c) => (
              <li key={c.id} className="rounded-full bg-paper-deep px-3 py-1 text-sm">
                {c.article ? `${c.article} ` : ""}
                {c.lemma}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-7 flex flex-wrap gap-2">
        <Link href={backHref} className={buttonClasses("primary")}>
          Done
        </Link>
        <button type="button" onClick={onReview} className={buttonClasses("secondary")}>
          Look back through cards
        </button>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-paper px-2 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 font-display text-2xl">{value}</dd>
    </div>
  );
}
