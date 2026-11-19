import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd, PageHero, Section } from "@/components/site/section";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { getCourseWithModules, listPublishedCourses, planLabel } from "@/lib/data/catalog";
import { site } from "@/lib/site";

export const revalidate = 300;

export async function generateStaticParams() {
  const courses = await listPublishedCourses();
  return courses.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseWithModules(slug);
  if (!course) return {};
  return {
    title: `${course.title} course online`,
    description: course.description ?? undefined,
    alternates: { canonical: `/courses/${course.slug}` },
  };
}

export default async function CoursePage({ params }: PageProps<"/courses/[slug]">) {
  const { slug } = await params;
  const course = await getCourseWithModules(slug);
  if (!course) notFound();
  const modules = course.course_modules ?? [];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: course.title,
          description: course.description,
          inLanguage: "de",
          educationalLevel: `CEFR ${course.cefr_level}`,
          provider: { "@type": "EducationalOrganization", name: site.name, sameAs: site.url },
        }}
      />
      <PageHero eyebrow={`CEFR ${course.cefr_level} · ${course.subtitle ?? ""}`} title={course.title} intro={course.description} />
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
          <div>
            <h2 className="font-display text-2xl">Course outline</h2>
            {modules.length === 0 ? (
              <p className="mt-4 text-ink-soft">The detailed outline for this course is being finalised.</p>
            ) : (
              <ol className="mt-6 space-y-3">
                {modules.map((m, i) => (
                  <li key={m.id}>
                    <Card className="flex gap-5 p-5">
                      <span className="font-display text-2xl text-gold">{String(i + 1).padStart(2, "0")}</span>
                      <div>
                        <h3 className="font-semibold">{m.title}</h3>
                        {m.description && <p className="mt-1 text-sm text-ink-soft">{m.description}</p>}
                      </div>
                    </Card>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <aside>
            <Card className="sticky top-24 space-y-4 p-6">
              <Badge tone={course.required_plan === "free" ? "success" : "gold"}>
                {course.required_plan === "free" ? "Included in the free plan" : `${planLabel[course.required_plan]} plan`}
              </Badge>
              <p className="text-sm leading-relaxed text-ink-soft">
                Flashcards with spaced repetition, grammar lessons, listening and sentence practice for every module.
              </p>
              <ButtonLink href={`/register?course=${course.slug}`} className="w-full">
                Start this course
              </ButtonLink>
              <ButtonLink href="/pricing" variant="secondary" className="w-full">
                Compare plans
              </ButtonLink>
            </Card>
          </aside>
        </div>
      </Section>
    </>
  );
}
