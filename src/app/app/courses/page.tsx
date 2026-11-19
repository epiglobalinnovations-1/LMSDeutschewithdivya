import Link from "next/link";
import { PageTitle } from "@/components/app/app-shell";
import { buttonClasses } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { planLabel } from "@/lib/data/catalog";
import { createClient } from "@/lib/supabase/server";
import { leave } from "./actions";
import { EnrolButton } from "./enrol-button";

export const metadata = { title: "My courses" };

export default async function CoursesPage() {
  const user = await requireUser("/app/courses");
  const supabase = await createClient();
  const [{ data: courses }, { data: enrolled }] = await Promise.all([
    supabase.from("courses").select("id, slug, title, subtitle, cefr_level, required_plan, course_modules(count)").eq("is_published", true).order("sort_order"),
    supabase.from("enrollments").select("course_id, enrolled_at, completed_at").eq("user_id", user.id),
  ]);
  const mine = new Map((enrolled ?? []).map((e) => [e.course_id, e]));
  const list = courses ?? [];
  const my = list.filter((c) => mine.has(c.id));
  const other = list.filter((c) => !mine.has(c.id));

  return (
    <>
      <PageTitle eyebrow="My courses" title={my.length ? "Your courses" : "Choose your first course"}>
        Lessons open course by course as Divya publishes them. Your flashcards already follow your level.
      </PageTitle>

      {my.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {my.map((c) => (
            <li key={c.id}>
              <Card className="flex h-full flex-col p-5">
                <div className="flex gap-2">
                  <Badge tone="accent">{c.cefr_level}</Badge>
                  <Badge tone="success">Enrolled</Badge>
                </div>
                <p className="mt-3 font-semibold">{c.title}</p>
                {c.subtitle && <p className="text-sm text-ink-soft">{c.subtitle}</p>}
                <p className="mt-1 text-sm text-muted">{(c.course_modules as unknown as { count: number }[])[0]?.count ?? 0} modules</p>
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
                  <Link href={`/app/flashcards/study?mode=daily`} className={buttonClasses("primary", "sm")}>
                    Practise {c.cefr_level} words
                  </Link>
                  <Link href={`/courses/${c.slug}`} className="text-sm text-accent hover:underline">
                    Course outline
                  </Link>
                  <form action={leave}>
                    <input type="hidden" name="courseId" value={c.id} />
                    <button className="text-sm text-muted hover:text-danger">Leave</button>
                  </form>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {other.length > 0 && (
        <>
          <h2 className="mt-10 font-display text-2xl">{my.length ? "More courses" : "Available courses"}</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {other.map((c) => (
              <li key={c.id}>
                <Card className="flex h-full flex-col p-5">
                  <div className="flex gap-2">
                    <Badge tone="accent">{c.cefr_level}</Badge>
                    <Badge tone={c.required_plan === "free" ? "neutral" : "gold"}>{planLabel[c.required_plan]}</Badge>
                  </div>
                  <p className="mt-3 font-semibold">{c.title}</p>
                  {c.subtitle && <p className="text-sm text-ink-soft">{c.subtitle}</p>}
                  <div className="mt-auto pt-4">
                    <EnrolButton courseId={c.id} />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
