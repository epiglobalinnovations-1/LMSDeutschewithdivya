import Link from "next/link";
import { PageTitle } from "@/components/app/app-shell";
import { Badge, Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/auth/session";
import { getTopics } from "@/lib/data/study";
import { createClient } from "@/lib/supabase/server";
import { DeckForm } from "./deck-forms";

export const metadata = { title: "Flashcard decks" };

export default async function AdminDecksPage() {
  await requireStaff();
  const supabase = await createClient();
  const [{ data: decks }, topics] = await Promise.all([
    supabase.from("flashcard_decks").select("id, slug, title, cefr_level, is_published, required_plan, flashcards(count)").order("cefr_level").order("title"),
    getTopics(),
  ]);
  return (
    <>
      <PageTitle eyebrow="Admin" title="Flashcard decks" />
      <Card className="overflow-hidden">
        {(decks ?? []).length === 0 ? (
          <p className="p-6 text-sm text-muted">No decks yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {decks!.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-6 py-3">
                <Link href={`/admin/flashcards/${d.slug}`} className="font-medium hover:text-accent">
                  {d.title}
                </Link>
                <span className="flex items-center gap-2 text-sm text-muted">
                  {(d.flashcards as unknown as { count: number }[])[0]?.count ?? 0} words
                  {d.cefr_level && <Badge tone="accent">{d.cefr_level}</Badge>}
                  <Badge tone={d.is_published ? "success" : "neutral"}>{d.is_published ? "Published" : "Draft"}</Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <h2 className="mt-10 mb-4 font-display text-2xl">New deck</h2>
      <DeckForm
        values={{ id: "", slug: "", title: "", description: "", cefr_level: "A1", topic: "", required_plan: "free", is_published: false }}
        topics={topics}
      />
    </>
  );
}
