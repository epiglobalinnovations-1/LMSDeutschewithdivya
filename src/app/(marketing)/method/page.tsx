import type { Metadata } from "next";
import { PageHero, Section } from "@/components/site/section";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Learning methodology",
  description:
    "How Deutsche with Divya teaches German: high-frequency vocabulary, FSRS spaced repetition, grammar in context, listening, sentence building and speaking practice.",
  alternates: { canonical: "/method" },
};

const stages = [
  {
    de: "Wörter lernen",
    en: "Learn words",
    body: "You choose a daily target of 5, 10, 15, 20 or 30 new words. Each card shows the article (der, die, das), the plural, the word type, audio and an example sentence. Nouns are colour-coded by gender so the article sticks with the word.",
  },
  {
    de: "Wörter erkennen",
    en: "Recognise words",
    body: "Reviews are scheduled by FSRS, a modern, research-based spaced repetition algorithm. It models how well you remember each word and brings it back at the moment you are most likely to forget it. Easy words appear rarely; difficult words come back sooner.",
  },
  {
    de: "Wörter verstehen",
    en: "Understand words",
    body: "Words you know reappear in short stories and listening exercises at your level. Tap any unfamiliar word to see its meaning and add it to your own collection.",
  },
  {
    de: "Sätze bauen",
    en: "Build sentences",
    body: "Rearrange words, fill gaps, choose articles, conjugate verbs and translate from English. When you make a mistake you see what was right, what was wrong, why, and the grammar rule behind it.",
  },
  {
    de: "Deutsch sprechen",
    en: "Speak German",
    body: "Practise conversations for everyday life, travel, the workplace and job interviews. The tutor adapts to your level and gently keeps the conversation in German.",
  },
  {
    de: "Auf Deutsch denken",
    en: "Think in German",
    body: "With enough repetition in enough contexts, you stop translating in your head. That is the goal of every course.",
  },
];

export default function MethodPage() {
  return (
    <>
      <PageHero
        eyebrow="Learning methodology"
        title="Words first. Then sentences. Then conversation."
        intro="Most learners forget 70% of new vocabulary within a week. Our method is designed around that fact, not against it."
      />
      <Section>
        <ol className="space-y-5">
          {stages.map((s, i) => (
            <li key={s.en}>
              <Card className="grid gap-4 p-6 sm:grid-cols-[10rem_1fr] sm:p-8">
                <div>
                  <span className="font-display text-3xl text-gold">{i + 1}</span>
                  <p lang="de" className="mt-1 italic text-muted">
                    {s.de}
                  </p>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{s.en}</h2>
                  <p className="mt-2 leading-relaxed text-ink-soft">{s.body}</p>
                </div>
              </Card>
            </li>
          ))}
        </ol>
        <div className="mt-12 grid gap-6 rounded-[var(--radius-card)] border border-line bg-paper-deep/60 p-8 sm:grid-cols-3">
          <div>
            <p className="font-display text-4xl text-accent">5–30</p>
            <p className="mt-1 text-sm text-ink-soft">new words a day, your choice</p>
          </div>
          <div>
            <p className="font-display text-4xl text-accent">FSRS</p>
            <p className="mt-1 text-sm text-ink-soft">spaced repetition, personalised per word</p>
          </div>
          <div>
            <p className="font-display text-4xl text-accent">A1→C1</p>
            <p className="mt-1 text-sm text-ink-soft">CEFR-aligned courses and vocabulary</p>
          </div>
        </div>
        <div className="mt-10">
          <ButtonLink href="/register" size="lg">
            Try the method free
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
