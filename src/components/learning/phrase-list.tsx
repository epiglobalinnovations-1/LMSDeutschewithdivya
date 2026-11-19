"use client";

import { SpeakButton } from "./flashcard";

export type Phrase = { de: string; en: string; note?: string };

export function PhraseList({ phrases }: { phrases: Phrase[] }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
      {phrases.map((p) => (
        <li key={p.de} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p lang="de" className="font-display text-xl text-ink">
              {p.de}
            </p>
            <p className="text-sm text-ink-soft">
              {p.en}
              {p.note && <span className="text-muted"> · {p.note}</span>}
            </p>
          </div>
          <SpeakButton text={p.de} label="Listen" />
        </li>
      ))}
    </ul>
  );
}
