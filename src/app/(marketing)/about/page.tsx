import type { Metadata } from "next";
import { Eyebrow, PageHero, Section } from "@/components/site/section";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About Divya",
  description: "Meet Divya, the German teacher behind Deutsche with Divya, and the way she teaches German to Indian and international learners.",
  alternates: { canonical: "/about" },
};

const principles = [
  {
    title: "Clarity before speed",
    text: "Grammar is explained in plain English, one idea at a time, with examples you would actually say.",
  },
  {
    title: "Words in context",
    text: "Every word comes with its article, its plural and a sentence, because that is how you will meet it in real life.",
  },
  {
    title: "Little and often",
    text: "Fifteen focused minutes a day beats a three-hour weekend session. The platform is built around that habit.",
  },
  {
    title: "Speak from day one",
    text: "Even at A1 you build your own sentences and say them aloud. Mistakes are explained, never just marked wrong.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title={
          <>
            Hallo, ich bin <em className="text-accent">Divya</em>.
          </>
        }
        intro="I teach German to learners in India and around the world: students heading to German universities, professionals planning a move, and people who simply love the language."
      />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div className="prose-dwd">
            <h2>Why this platform exists</h2>
            <p>
              Classes are where understanding happens, but memory is built in the days between them. Students told
              me the same thing again and again: they understood the lesson, and a week later the words were gone.
            </p>
            <p>
              Deutsche with Divya brings my courses, vocabulary lists and exercises into one place, and adds a
              spaced repetition system that reminds you of each word just before you would forget it. You always
              know what to study next, and I can see where each student needs help.
            </p>
            <h2>Who it is for</h2>
            <ul>
              <li>Complete beginners starting at A1</li>
              <li>Students preparing for A1, A2 and B1 language certificates</li>
              <li>Professionals and families planning a move to Germany, Austria or Switzerland</li>
              <li>Anyone who wants to keep their German alive between classes</li>
            </ul>
          </div>
          <div>
            <Eyebrow>How I teach</Eyebrow>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {principles.map((p) => (
                <Card key={p.title} className="p-6">
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.text}</p>
                </Card>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/register">Start learning with me</ButtonLink>
              <ButtonLink href="/contact" variant="secondary">
                Ask a question
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
