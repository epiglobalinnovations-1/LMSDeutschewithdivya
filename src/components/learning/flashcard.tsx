"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { speakGerman } from "./speak";

export type FlashcardWord = {
  lemma: string;
  article?: "der" | "die" | "das" | null;
  plural?: string | null;
  partOfSpeech: string;
  translation: string;
  exampleDe?: string | null;
  exampleEn?: string | null;
  cefrLevel?: string;
  topic?: string | null;
};

const articleTone: Record<string, string> = {
  der: "text-[#1f4e79]",
  die: "text-accent",
  das: "text-success",
};

/**
 * Interactive flashcard. Click, tap, Enter or Space flips it. The speaker
 * button reads the German side aloud. In Phase 2 the study session wraps this
 * with swipe, known/unknown and FSRS scheduling.
 */
export function Flashcard({
  word,
  direction = "de_en",
  className,
}: {
  word: FlashcardWord;
  direction?: "de_en" | "en_de";
  className?: string;
}) {
  const [flipped, setFlipped] = useState(false);
  const german = word.article ? `${word.article} ${word.lemma}` : word.lemma;
  const showGermanFirst = direction === "de_en";

  const germanFace = (
    <div className="flex flex-col items-center gap-3 text-center">
      {word.article && (
        <span className={cn("text-sm font-semibold uppercase tracking-[0.2em]", articleTone[word.article])}>{word.article}</span>
      )}
      <span className="font-display text-4xl font-medium text-ink sm:text-5xl">{word.lemma}</span>
      <span className="text-sm text-muted">{word.partOfSpeech}</span>
    </div>
  );

  const englishFace = (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="font-display text-3xl text-ink sm:text-4xl">{word.translation}</span>
      <span className="text-sm text-muted">{word.partOfSpeech}</span>
    </div>
  );

  return (
    <div className={cn("[perspective:1400px]", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={flipped ? "Card back. Press to show the front." : "Card front. Press to reveal the answer."}
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setFlipped((f) => !f);
          }
        }}
        className={cn(
          "relative grid min-h-[22rem] cursor-pointer select-none transition-transform duration-500 [transform-style:preserve-3d]",
          flipped && "[transform:rotateY(180deg)]",
        )}
      >
        {/* Front */}
        <div className="absolute inset-0 flex flex-col rounded-[1.5rem] border border-line bg-surface p-6 shadow-[var(--shadow-lift)] [backface-visibility:hidden]">
          <CardMeta word={word} />
          <div className="flex flex-1 items-center justify-center">{showGermanFirst ? germanFace : englishFace}</div>
          <p className="text-center text-xs text-muted">Tap or press Space to flip</p>
        </div>

        {/* Back */}
        <div className="absolute inset-0 flex flex-col rounded-[1.5rem] border border-line bg-surface p-6 shadow-[var(--shadow-lift)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <CardMeta word={word} />
          <div className="flex flex-1 flex-col items-center justify-center gap-5">
            {showGermanFirst ? (
              <span className="font-display text-3xl text-ink">{word.translation}</span>
            ) : (
              <span className="font-display text-3xl text-ink">{german}</span>
            )}
            <dl className="grid w-full max-w-xs grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-paper px-3 py-2">
                <dt className="text-xs text-muted">Article</dt>
                <dd className="font-medium">{word.article ?? "–"}</dd>
              </div>
              <div className="rounded-xl bg-paper px-3 py-2">
                <dt className="text-xs text-muted">Plural</dt>
                <dd className="font-medium">{word.plural ? `die ${word.plural}` : "–"}</dd>
              </div>
            </dl>
            {word.exampleDe && (
              <blockquote className="max-w-sm text-center">
                <p className="font-display text-lg italic text-ink">„{word.exampleDe}“</p>
                {word.exampleEn && <p className="mt-1 text-sm text-muted">{word.exampleEn}</p>}
              </blockquote>
            )}
          </div>
          <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
            <SpeakButton text={german} label="Hear the word" />
            {word.exampleDe && <SpeakButton text={word.exampleDe} label="Hear the example" />}
          </div>
        </div>
      </div>
    </div>
  );
}

function CardMeta({ word }: { word: FlashcardWord }) {
  return (
    <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-muted">
      <span>{word.topic ?? ""}</span>
      {word.cefrLevel && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent">{word.cefrLevel}</span>}
    </div>
  );
}

export function SpeakButton({ text, label }: { text: string; label: string }) {
  const [unsupported, setUnsupported] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!speakGerman(text)) setUnsupported(true);
      }}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-sm text-ink hover:border-ink"
      title={unsupported ? "Your browser does not support speech" : label}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        <path d="M2 6h3l4-3v10L5 10H2z" fill="currentColor" />
        <path d="M11.5 5.5a3.5 3.5 0 010 5M13 3.5a6 6 0 010 9" stroke="currentColor" fill="none" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      {unsupported ? "No audio" : label}
    </button>
  );
}
