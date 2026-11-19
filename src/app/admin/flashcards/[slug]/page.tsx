import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/auth/session";
import { getTopics } from "@/lib/data/study";
import { createClient } from "@/lib/supabase/server";
import { deleteDeck, removeCard } from "../actions";
import { AddWordsForm, DeckForm } from "../deck-forms";

export const metadata = { title: "Edit deck" };

export default async function AdminDeckPage({ params }: PageProps<"/admin/flashcards/[slug]">) {
  await requireStaff();
  const { slug } = await params;
  const supabase = await createClient();
  const [{ data: deck }, topics] = await Promise.all([
    supabase
      .from("flashcard_decks")
      .select("*, topics(slug), flashcards(id, sort_order, vocabulary(id, lemma, article, is_verified, vocabulary_translations(translation, sort_order)))")
      .eq("slug", slug)
      .maybeSingle(),
    getTopics(),
  ]);
  if (!deck) notFound();
  const cards = [...deck.flashcards].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <Link href="/admin/flashcards" className="text-sm text-ink-soft hover:text-accent">
        ← Decks
      </Link>
      <PageTitle eyebrow="Admin · Deck" title={deck.title} />
      <DeckForm
        values={{
          id: deck.id,
          slug: deck.slug,
          title: deck.title,
          description: deck.description ?? "",
          cefr_level: deck.cefr_level ?? "",
          topic: (deck.topics as { slug: string } | null)?.slug ?? "",
          required_plan: deck.required_plan,
          is_published: deck.is_published,
        }}
        topics={topics}
      />

      <Card className="mt-6 p-6">
        <AddWordsForm deckId={deck.id} />
      </Card>

      <Card className="mt-6 overflow-hidden">
        <h2 className="border-b border-line px-6 py-4 font-semibold">{cards.length} words</h2>
        <ul className="divide-y divide-line text-sm">
          {cards.map((c) => {
            const v = c.vocabulary as unknown as {
              id: string;
              lemma: string;
              article: string | null;
              is_verified: boolean;
              vocabulary_translations: { translation: string; sort_order: number }[];
            } | null;
            if (!v) return null;
            return (
              <li key={c.id} className="flex items-center justify-between gap-2 px-6 py-2">
                <Link href={`/admin/vocabulary/${v.id}`} className="hover:text-accent">
                  {v.article && <span className="text-muted">{v.article} </span>}
                  {v.lemma}
                  <span className="ml-2 text-ink-soft">{[...v.vocabulary_translations].sort((a, b) => a.sort_order - b.sort_order)[0]?.translation}</span>
                  {!v.is_verified && <span className="ml-2 text-xs text-[#7a5f17]">draft</span>}
                </Link>
                <form action={removeCard}>
                  <input type="hidden" name="cardId" value={c.id} />
                  <button className="text-xs text-muted hover:text-danger">Remove</button>
                </form>
              </li>
            );
          })}
        </ul>
      </Card>

      <form action={deleteDeck} className="mt-8 border-t border-line pt-6">
        <input type="hidden" name="id" value={deck.id} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="confirm" required className="h-4 w-4" /> Yes, delete this deck (the words stay in the vocabulary)
        </label>
        <button className="mt-2 text-sm font-medium text-danger hover:underline">Delete deck</button>
      </form>
    </>
  );
}
