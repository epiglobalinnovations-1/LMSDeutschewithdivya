import Link from "next/link";
import { PageTitle } from "@/components/app/app-shell";
import { WordActions } from "@/components/learning/word-actions";
import { buttonClasses } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { LIBRARY_PAGE_SIZE, getCategoryCounts, getTopics, searchLibrary, type LibraryFilter } from "@/lib/data/study";
import { categoriesOf } from "@/lib/srs/fsrs";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Vocabulary" };

const CATEGORIES = ["new", "learning", "due", "difficult", "mastered", "bookmarked", "known"] as const;
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default async function VocabularyPage({ searchParams }: PageProps<"/app/vocabulary">) {
  const sp = await searchParams;
  const user = await requireUser("/app/vocabulary");
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  const filter: LibraryFilter = {
    q: one(sp.q)?.slice(0, 60),
    level: LEVELS.includes(one(sp.level) ?? "") ? one(sp.level) : undefined,
    topic: one(sp.topic)?.match(/^[a-z0-9-]{1,40}$/) ? one(sp.topic) : undefined,
    category: (CATEGORIES as readonly string[]).includes(one(sp.category) ?? "") ? (one(sp.category) as LibraryFilter["category"]) : undefined,
    page: Number(one(sp.page)) || 1,
  };

  // Deck filter: narrow to that deck's words via the topic-independent path.
  const deckSlug = one(sp.deck)?.match(/^[a-z0-9-]{1,80}$/) ? one(sp.deck) : undefined;
  let deckTitle: string | null = null;
  if (deckSlug) {
    const supabase = await createClient();
    const { data } = await supabase.from("flashcard_decks").select("title").eq("slug", deckSlug).maybeSingle();
    deckTitle = data?.title ?? null;
  }

  const [{ cards, total, page }, topics, counts] = await Promise.all([searchLibrary(user.id, { ...filter, deck: deckSlug }), getTopics(), getCategoryCounts()]);
  const pages = Math.max(1, Math.ceil(total / LIBRARY_PAGE_SIZE));
  const now = new Date();
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q: filter.q, level: filter.level, topic: filter.topic, category: filter.category, deck: deckSlug, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/app/vocabulary?${s}` : "/app/vocabulary";
  };

  return (
    <>
      <PageTitle eyebrow="Vocabulary" title="Your word library">
        {counts.totalSeen} words started · {counts.mastered} mastered · {counts.due} due now
      </PageTitle>

      <form className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]" action="/app/vocabulary" role="search">
        <label className="sr-only" htmlFor="q">
          Search
        </label>
        <input
          id="q"
          name="q"
          defaultValue={filter.q}
          placeholder="Search German or English"
          className="h-11 rounded-xl border border-line-strong bg-surface px-4"
        />
        <Select name="level" label="Level" value={filter.level} options={LEVELS.map((l) => [l, l])} />
        <Select name="topic" label="Topic" value={filter.topic} options={topics.map((t) => [t.slug, t.name])} />
        <Select name="category" label="Category" value={filter.category} options={CATEGORIES.map((c) => [c, c[0].toUpperCase() + c.slice(1)])} />
        {deckSlug && <input type="hidden" name="deck" value={deckSlug} />}
        <button className={buttonClasses("primary")}>Search</button>
      </form>

      {deckTitle && (
        <p className="mt-3 text-sm">
          Deck: <strong>{deckTitle}</strong>{" "}
          <Link href={qs({ deck: undefined })} className="text-accent hover:underline">
            show all words
          </Link>
        </p>
      )}

      <p className="mt-4 text-sm text-muted" data-testid="result-count">
        {total} {total === 1 ? "word" : "words"}
      </p>

      {cards.length === 0 ? (
        <Card className="mt-3 p-8 text-center text-ink-soft">No words match these filters.</Card>
      ) : (
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
          {cards.map((c) => {
            const cats = categoriesOf(c.progress, now);
            return (
              <li key={c.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link href={`/app/vocabulary/${c.id}`} className="font-medium hover:text-accent">
                    {c.article && <span className="text-muted">{c.article} </span>}
                    {c.lemma}
                  </Link>
                  <span className="ml-2 text-sm text-ink-soft">{c.translations.join(", ")}</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge tone="accent">{c.cefrLevel}</Badge>
                    {cats.map((k) => (
                      <Badge key={k} tone={k === "mastered" ? "success" : k === "difficult" || k === "due" ? "gold" : "neutral"}>
                        {k}
                      </Badge>
                    ))}
                  </div>
                </div>
                <WordActions id={c.id} bookmarked={c.isBookmarked} started={!!c.progress && c.progress.state !== "new"} compact />
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-between text-sm" aria-label="Pages">
          {page > 1 ? <Link href={qs({ page: String(page - 1) })} className="text-accent hover:underline">← Previous</Link> : <span />}
          <span className="text-muted">
            Page {page} of {pages}
          </span>
          {page < pages ? <Link href={qs({ page: String(page + 1) })} className="text-accent hover:underline">Next →</Link> : <span />}
        </nav>
      )}
    </>
  );
}

function Select({ name, label, value, options }: { name: string; label: string; value?: string; options: [string, string][] }) {
  return (
    <>
      <label className="sr-only" htmlFor={name}>
        {label}
      </label>
      <select id={name} name={name} defaultValue={value ?? ""} className="h-11 rounded-xl border border-line-strong bg-surface px-3">
        <option value="">All {label.toLowerCase()}s</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </>
  );
}
