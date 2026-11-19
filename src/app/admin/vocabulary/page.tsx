import Link from "next/link";
import { PageTitle } from "@/components/app/app-shell";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/field";
import { requireStaff } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { bulkUpdate } from "./actions";

export const metadata = { title: "Vocabulary admin" };
const PAGE = 50;
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default async function AdminVocabularyPage({ searchParams }: PageProps<"/admin/vocabulary">) {
  await requireStaff();
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  const q = one(sp.q)?.replace(/[%_,()]/g, " ").trim().slice(0, 60);
  const level = LEVELS.includes(one(sp.level) ?? "") ? one(sp.level) : undefined;
  const status = one(sp.status);
  const page = Math.max(1, Number(one(sp.page)) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("vocabulary")
    .select("id, lemma, article, part_of_speech, cefr_level, is_verified, is_published, source, topics(name), vocabulary_translations(translation, sort_order)", { count: "exact" });
  if (q) query = query.ilike("lemma", `%${q}%`);
  if (level) query = query.eq("cefr_level", level as "A1");
  if (status === "draft") query = query.eq("is_verified", false);
  if (status === "verified") query = query.eq("is_verified", true);
  if (status === "hidden") query = query.eq("is_published", false);
  const { data, count } = await query.order("cefr_level").order("lemma").range((page - 1) * PAGE, page * PAGE - 1);
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const href = (p: number) => {
    const s = new URLSearchParams();
    if (q) s.set("q", q);
    if (level) s.set("level", level);
    if (status) s.set("status", status);
    s.set("page", String(p));
    return `/admin/vocabulary?${s}`;
  };

  return (
    <>
      <PageTitle eyebrow="Admin" title="Vocabulary">
        {count ?? 0} entries. Draft entries are visible to students with a “draft” note until a teacher verifies them.
      </PageTitle>
      {sp.deleted && (
        <div className="mb-4">
          <FormMessage tone="success">The word was deleted.</FormMessage>
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <form className="flex flex-wrap gap-2" action="/admin/vocabulary">
          <input name="q" defaultValue={q} placeholder="Search German word" aria-label="Search" className="h-10 rounded-xl border border-line-strong bg-surface px-3" />
          <select name="level" defaultValue={level ?? ""} aria-label="Level" className="h-10 rounded-xl border border-line-strong bg-surface px-3">
            <option value="">All levels</option>
            {LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <select name="status" defaultValue={status ?? ""} aria-label="Status" className="h-10 rounded-xl border border-line-strong bg-surface px-3">
            <option value="">Any status</option>
            <option value="draft">Draft (unverified)</option>
            <option value="verified">Verified</option>
            <option value="hidden">Unpublished</option>
          </select>
          <button className={buttonClasses("secondary", "sm", "h-10")}>Filter</button>
        </form>
        <div className="flex gap-2">
          <ButtonLink href="/admin/import" variant="secondary" size="sm">
            Import
          </ButtonLink>
          <ButtonLink href="/admin/vocabulary/new" size="sm">
            New word
          </ButtonLink>
        </div>
      </div>

      <form action={bulkUpdate}>
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-paper text-left text-muted">
              <tr>
                <th className="w-8 px-3 py-2">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-3 py-2 font-medium">Word</th>
                <th className="px-3 py-2 font-medium">English</th>
                <th className="px-3 py-2 font-medium">Level</th>
                <th className="hidden px-3 py-2 font-medium md:table-cell">Topic</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((w) => (
                <tr key={w.id} className="border-t border-line">
                  <td className="px-3 py-2">
                    <input type="checkbox" name="ids" value={w.id} aria-label={`Select ${w.lemma}`} className="h-4 w-4" />
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/admin/vocabulary/${w.id}`} className="font-medium hover:text-accent">
                      {w.article && <span className="text-muted">{w.article} </span>}
                      {w.lemma}
                    </Link>
                    <span className="ml-1 text-xs text-muted">{w.part_of_speech}</span>
                  </td>
                  <td className="px-3 py-2 text-ink-soft">
                    {[...w.vocabulary_translations]
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((t) => t.translation)
                      .join(", ")}
                  </td>
                  <td className="px-3 py-2">{w.cefr_level}</td>
                  <td className="hidden px-3 py-2 md:table-cell">{(w.topics as { name: string } | null)?.name ?? "–"}</td>
                  <td className="space-x-1 px-3 py-2">
                    <Badge tone={w.is_verified ? "success" : "gold"}>{w.is_verified ? "Verified" : "Draft"}</Badge>
                    {!w.is_published && <Badge>Hidden</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">With selected:</span>
          <button name="op" value="verify" className={buttonClasses("secondary", "sm")}>
            Mark verified
          </button>
          <button name="op" value="unverify" className={buttonClasses("ghost", "sm")}>
            Mark draft
          </button>
          <button name="op" value="publish" className={buttonClasses("ghost", "sm")}>
            Publish
          </button>
          <button name="op" value="unpublish" className={buttonClasses("ghost", "sm")}>
            Hide
          </button>
        </div>
      </form>

      {pages > 1 && (
        <nav className="mt-6 flex justify-between text-sm" aria-label="Pages">
          {page > 1 ? <Link href={href(page - 1)} className="text-accent">← Previous</Link> : <span />}
          <span className="text-muted">
            Page {page} of {pages}
          </span>
          {page < pages ? <Link href={href(page + 1)} className="text-accent">Next →</Link> : <span />}
        </nav>
      )}
    </>
  );
}
