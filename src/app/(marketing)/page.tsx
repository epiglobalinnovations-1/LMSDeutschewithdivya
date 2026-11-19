import Link from "next/link";
import { Flashcard } from "@/components/learning/flashcard";
import { Eyebrow, JsonLd, Section } from "@/components/site/section";
import { ButtonLink } from "@/components/ui/button";
import { Card, Container } from "@/components/ui/card";
import { site } from "@/lib/site";

const path = [
  { step: "01", de: "Wörter lernen", en: "Learn words", text: "Short daily sets of high-frequency words with article, plural and a real example sentence." },
  { step: "02", de: "Wörter erkennen", en: "Recognise words", text: "Spaced repetition brings each word back just before you would forget it." },
  { step: "03", de: "Wörter verstehen", en: "Understand words", text: "Meet the same words again in stories and listening, at your level." },
  { step: "04", de: "Sätze bauen", en: "Build sentences", text: "Reorder, complete and translate, with explanations for every mistake." },
  { step: "05", de: "Deutsch sprechen", en: "Speak German", text: "Practise conversations for travel, work and interviews with an AI tutor." },
  { step: "06", de: "Auf Deutsch denken", en: "Think in German", text: "Grammar becomes instinct when you have used it hundreds of times." },
];

const features = [
  { title: "Flashcards that remember for you", text: "German → English and English → German, swipe or keyboard, with a daily target of 5 to 30 new words. An FSRS scheduler decides what you review each day." },
  { title: "Grammar, explained simply", text: "Articles, cases, word order and verb tenses in plain English, with examples, practice and a short quiz for every topic." },
  { title: "Listening and stories", text: "Slow down audio, show or hide the transcript, tap any word for its meaning and save it to your vocabulary." },
  { title: "Sentence builder", text: "Turn words into sentences. Valid alternatives are accepted, and every correction explains the rule behind it." },
  { title: "AI conversation practice", text: "Everyday, travel, workplace and interview scenarios that adapt to your CEFR level and keep you speaking German." },
  { title: "Progress you can see", text: "Words learned, reviews due, streaks and weekly study time, plus a clear recommendation for what to do next." },
];

const levels = [
  { level: "A1", name: "Beginner", text: "Introduce yourself, order food, talk about family and daily life.", href: "/courses/german-a1" },
  { level: "A2", name: "Elementary", text: "Talk about the past, make plans, handle shopping and travel.", href: "/courses/german-a2" },
  { level: "B1", name: "Intermediate", text: "Give opinions, tell stories and manage work situations.", href: "/courses/german-b1" },
  { level: "B2+", name: "Upper levels", text: "Complex discussions, structured writing, university and career German.", href: "/courses" },
];

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: site.name,
          url: site.url,
          description: site.description,
          areaServed: ["IN", "Worldwide"],
          knowsLanguage: ["de", "en"],
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <Container className="grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <Eyebrow>German for Indian and international learners</Eyebrow>
            <h1 className="mt-5 font-display text-[2.6rem] leading-[1.04] tracking-tight text-ink sm:text-6xl">
              Learn German <em className="text-accent">properly</em>, one word at a time.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              A structured path from your first <span lang="de">„Hallo“</span> to confident conversation. Smart
              flashcards, clear grammar, real listening and speaking practice, all guided by Divya.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/register" size="lg">
                Start learning free
              </ButtonLink>
              <ButtonLink href="/courses" variant="secondary" size="lg">
                Explore courses
              </ButtonLink>
            </div>
            <p className="mt-5 text-sm text-muted">Free plan available. No card needed.</p>
          </div>
          <div className="mx-auto w-full max-w-sm lg:max-w-md">
            <Flashcard
              word={{
                lemma: "Frühstück",
                article: "das",
                plural: "Frühstücke",
                partOfSpeech: "noun",
                translation: "breakfast",
                exampleDe: "Ich esse mein Frühstück um sieben Uhr.",
                exampleEn: "I eat my breakfast at seven o'clock.",
                cefrLevel: "A1",
                topic: "Food",
              }}
            />
            <p className="mt-4 text-center text-sm text-muted">Try it: flip the card and listen.</p>
          </div>
        </Container>
      </section>

      {/* Method path */}
      <Section className="border-y border-line/70 bg-surface">
        <div className="max-w-2xl">
          <Eyebrow>The method</Eyebrow>
          <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">Six steps from words to thinking in German.</h2>
        </div>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {path.map((p) => (
            <li key={p.step} className="bg-surface p-6 sm:p-8">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-sm text-gold">{p.step}</span>
                <span lang="de" className="text-sm italic text-muted">
                  {p.de}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{p.en}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{p.text}</p>
            </li>
          ))}
        </ol>
        <Link href="/method" className="mt-8 inline-block text-accent underline-offset-4 hover:underline">
          Read about the method →
        </Link>
      </Section>

      {/* Features */}
      <Section>
        <div className="max-w-2xl">
          <Eyebrow>Inside the platform</Eyebrow>
          <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">Everything you need, nothing that distracts.</h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="p-7">
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-3 leading-relaxed text-ink-soft">{f.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* Levels */}
      <Section className="bg-paper-deep/60">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <Eyebrow>Courses</Eyebrow>
            <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">Start where you are.</h2>
          </div>
          <ButtonLink href="/courses" variant="secondary">
            All courses
          </ButtonLink>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {levels.map((l) => (
            <Link
              key={l.level}
              href={l.href}
              className="group rounded-[var(--radius-card)] border border-line bg-surface p-6 transition-shadow hover:shadow-[var(--shadow-lift)]"
            >
              <span className="font-display text-4xl text-accent">{l.level}</span>
              <h3 className="mt-3 font-semibold">{l.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{l.text}</p>
              <span className="mt-4 inline-block text-sm text-accent group-hover:underline">View course →</span>
            </Link>
          ))}
        </div>
      </Section>

      {/* Closing CTA */}
      <Section>
        <Card className="relative overflow-hidden px-6 py-14 text-center sm:px-16">
          <p lang="de" className="font-display text-lg italic text-muted">
            Aller Anfang ist schwer.
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl leading-tight sm:text-4xl">
            Every beginning is hard. We make it a lot easier.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-soft">
            Create a free account, set your daily target and learn your first ten words today.
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink href="/register" size="lg">
              Create your free account
            </ButtonLink>
          </div>
        </Card>
      </Section>
    </>
  );
}
