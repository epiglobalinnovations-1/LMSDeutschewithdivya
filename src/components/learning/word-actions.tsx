"use client";

import { useState, useTransition } from "react";
import { markKnown, toggleBookmark } from "@/app/app/flashcards/actions";
import { cn } from "@/lib/cn";

/** Bookmark toggle and "I know this" for a word in the library. */
export function WordActions({ id, bookmarked, started, compact }: { id: string; bookmarked: boolean; started: boolean; compact?: boolean }) {
  const [isBookmarked, setBookmarked] = useState(bookmarked);
  const [known, setKnown] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        aria-pressed={isBookmarked}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const next = !isBookmarked;
            setBookmarked(next);
            const r = await toggleBookmark(id, next);
            if (!r.ok) {
              setBookmarked(!next);
              setMsg("Could not save the bookmark.");
            }
          })
        }
        className={cn(
          "rounded-full border px-3 py-1 text-sm",
          isBookmarked ? "border-gold bg-gold-soft text-[#7a5f17]" : "border-line-strong text-ink-soft hover:border-ink",
        )}
      >
        {isBookmarked ? "★ Bookmarked" : compact ? "☆" : "☆ Bookmark"}
      </button>
      {!started && !known && (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await markKnown(id);
              if (r.ok) {
                setKnown(true);
                setMsg(`Marked as known. We’ll check again in ${r.interval}.`);
              } else setMsg(r.error);
            })
          }
          className="rounded-full border border-line-strong px-3 py-1 text-sm text-ink-soft hover:border-ink"
        >
          I know this
        </button>
      )}
      {msg && (
        <span role="status" className="text-xs text-muted">
          {msg}
        </span>
      )}
    </div>
  );
}
