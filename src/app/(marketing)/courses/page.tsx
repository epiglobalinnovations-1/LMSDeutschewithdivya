import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/site/section";
import { Badge, Card } from "@/components/ui/card";
import { listPublishedCourses, planLabel } from "@/lib/data/catalog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "German courses A1 to C1",
  description:
    "Structured German courses from A1 beginner to advanced. German A1 course, German A2 course and B1 preparation with flashcards, grammar and speaking practice.",
  alternates: { canonical: "/courses" },
};

export default async function CoursesPage() {
  const courses = await listPublishedCourses();

  return (
    <>
      <PageHero
        eyebrow="German courses"
        title="A clear path through every CEFR level."
        intro="Each course combines vocabulary, grammar, listening and speaking, organised into short modules you can finish in a week."
      />
      <Section>
        {courses.length === 0 ? (
          <Card className="p-10 text-center text-ink-soft">Courses are being prepared. Please check back soon.</Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {courses.map((c) => (
              <Link key={c.id} href={`/courses/${c.slug}`} className="group">
                <Card className="flex h-full flex-col p-7 transition-shadow group-hover:shadow-[var(--shadow-lift)]">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-5xl text-accent">{c.cefr_level}</span>
                    <Badge tone={c.required_plan === "free" ? "success" : "gold"}>
                      {c.required_plan === "free" ? "Free" : planLabel[c.required_plan]}
                    </Badge>
                  </div>
                  <h2 className="mt-5 text-xl font-semibold">{c.title}</h2>
                  {c.subtitle && <p className="text-sm text-muted">{c.subtitle}</p>}
                  <p className="mt-3 flex-1 leading-relaxed text-ink-soft">{c.description}</p>
                  <span className="mt-5 text-sm font-medium text-accent group-hover:underline">See what you will learn →</span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
