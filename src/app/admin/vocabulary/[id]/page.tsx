import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/app/app-shell";
import { FormMessage } from "@/components/ui/field";
import { requireStaff } from "@/lib/auth/session";
import { getTopics } from "@/lib/data/study";
import type { VerbForms } from "@/lib/import/vocabulary";
import { createClient } from "@/lib/supabase/server";
import { deleteWord } from "../actions";
import { WordForm, type WordFormValues } from "./word-form";

export const metadata = { title: "Edit word" };

const blank: WordFormValues = {
  id: "new",
  content_id: "",
  lemma: "",
  article: "",
  plural: "",
  no_plural: false,
  part_of_speech: "noun",
  cefr_level: "A1",
  topic: "",
  ipa: "",
  pronunciation_guide: "",
  translations: "",
  examples: "",
  difficulty: "3",
  notes: "",
  source: "",
  related: "",
  partizip_ii: "",
  auxiliary: "",
  present: {},
  is_verified: false,
  is_published: true,
};

export default async function EditWordPage({ params, searchParams }: PageProps<"/admin/vocabulary/[id]">) {
  await requireStaff();
  const { id } = await params;
  const sp = await searchParams;
  const topics = await getTopics();
  let values = blank;

  if (id !== "new") {
    if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
    const supabase = await createClient();
    const { data: w } = await supabase
      .from("vocabulary")
      .select("*, topics(slug), vocabulary_translations(translation, sort_order), vocabulary_examples(sentence_de, sentence_en, sort_order)")
      .eq("id", id)
      .maybeSingle();
    if (!w) notFound();
    const vf = (w.verb_forms ?? {}) as VerbForms;
    values = {
      id: w.id,
      content_id: w.content_id ?? "",
      lemma: w.lemma,
      article: w.article ?? "",
      plural: w.plural ?? "",
      no_plural: w.has_plural === false,
      part_of_speech: w.part_of_speech,
      cefr_level: w.cefr_level,
      topic: (w.topics as { slug: string } | null)?.slug ?? "",
      ipa: w.ipa ?? "",
      pronunciation_guide: w.pronunciation_guide ?? "",
      translations: [...w.vocabulary_translations].sort((a, b) => a.sort_order - b.sort_order).map((t) => t.translation).join("\n"),
      examples: [...w.vocabulary_examples]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((e) => `${e.sentence_de} | ${e.sentence_en}`)
        .join("\n"),
      difficulty: String(w.difficulty),
      notes: w.notes ?? "",
      source: w.source ?? "",
      related: w.related_terms.join("; "),
      partizip_ii: vf.partizip_ii ?? "",
      auxiliary: w.auxiliary ?? "",
      present: (vf.present as Record<string, string> | undefined) ?? {},
      is_verified: w.is_verified,
      is_published: w.is_published,
    };
  }

  return (
    <>
      <Link href="/admin/vocabulary" className="text-sm text-ink-soft hover:text-accent">
        ← Vocabulary
      </Link>
      <PageTitle eyebrow="Admin · Vocabulary" title={id === "new" ? "New word" : `${values.article ? values.article + " " : ""}${values.lemma}`} />
      {sp.saved && (
        <div className="mb-4">
          <FormMessage tone="success">The word was created.</FormMessage>
        </div>
      )}
      <WordForm values={values} topics={topics} />
      {id !== "new" && (
        <form action={deleteWord} className="mt-8 border-t border-line pt-6">
          <input type="hidden" name="id" value={id} />
          <p className="text-sm text-muted">Deleting a word also removes it from decks and from every student’s review history.</p>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="confirm" required className="h-4 w-4" /> Yes, delete it permanently
          </label>
          <button className="mt-2 text-sm font-medium text-danger hover:underline">Delete this word</button>
        </form>
      )}
    </>
  );
}
