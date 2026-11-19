"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/field";
import { saveWord, type WordFormState } from "../actions";

export type WordFormValues = {
  id: string;
  content_id: string;
  lemma: string;
  article: string;
  plural: string;
  no_plural: boolean;
  part_of_speech: string;
  cefr_level: string;
  topic: string;
  ipa: string;
  pronunciation_guide: string;
  translations: string;
  examples: string;
  difficulty: string;
  notes: string;
  source: string;
  related: string;
  partizip_ii: string;
  auxiliary: string;
  present: Record<string, string>;
  is_verified: boolean;
  is_published: boolean;
};

const POS = ["noun", "verb", "adjective", "adverb", "pronoun", "preposition", "conjunction", "article", "numeral", "interjection", "particle", "phrase"];
const PERSONS: [string, string][] = [
  ["ich", "ich"],
  ["du", "du"],
  ["er_sie_es", "er/sie/es"],
  ["wir", "wir"],
  ["ihr", "ihr"],
  ["sie_Sie", "sie/Sie"],
];
const select = "h-12 w-full rounded-xl border border-line-strong bg-surface px-3";

export function WordForm({ values, topics }: { values: WordFormValues; topics: { slug: string; name: string }[] }) {
  const [state, action, pending] = useActionState<WordFormState, FormData>(saveWord, null);
  const err = (k: string) => state?.errors?.[k];

  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="id" value={values.id} />
      {state && <FormMessage tone={state.ok ? "success" : "danger"}>{state.message}</FormMessage>}

      <section className="grid gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-6 sm:grid-cols-3">
        <Field label="German word" name="lemma" error={err("lemma")}>
          <Input name="lemma" defaultValue={values.lemma} required maxLength={120} error={err("lemma")} />
        </Field>
        <Field label="Category" name="part_of_speech" error={err("part_of_speech")}>
          <select id="part_of_speech" name="part_of_speech" defaultValue={values.part_of_speech} className={select}>
            {POS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Article (nouns)" name="article" error={err("article")}>
          <select id="article" name="article" defaultValue={values.article} className={select}>
            <option value="">–</option>
            <option>der</option>
            <option>die</option>
            <option>das</option>
          </select>
        </Field>
        <Field label="Plural (without die)" name="plural" error={err("plural")}>
          <Input name="plural" defaultValue={values.plural} maxLength={120} />
        </Field>
        <label className="flex items-center gap-2 self-end pb-3 text-sm">
          <input type="checkbox" name="no_plural" defaultChecked={values.no_plural} className="h-4 w-4" /> No plural in normal use
        </label>
        <div />
        <Field label="Level" name="cefr_level" error={err("cefr_level")}>
          <select id="cefr_level" name="cefr_level" defaultValue={values.cefr_level} className={select}>
            {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Topic" name="topic">
          <select id="topic" name="topic" defaultValue={values.topic} className={select}>
            <option value="">–</option>
            {topics.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Difficulty (1–5)" name="difficulty" error={err("difficulty")}>
          <Input name="difficulty" type="number" min={1} max={5} defaultValue={values.difficulty} />
        </Field>
      </section>

      <section className="grid gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-6 sm:grid-cols-2">
        <Field label="English translations" name="translations" error={err("translations")} hint="One per line; the first is the main one">
          <Textarea name="translations" defaultValue={values.translations} className="min-h-24" error={err("translations")} />
        </Field>
        <Field label="Examples" name="examples" error={err("examples")} hint="One per line: German sentence | English translation">
          <Textarea name="examples" defaultValue={values.examples} className="min-h-24" />
        </Field>
        <Field label="IPA" name="ipa" error={err("ipa")}>
          <Input name="ipa" defaultValue={values.ipa} maxLength={120} />
        </Field>
        <Field label="Pronunciation guide for English speakers" name="pronunciation_guide" error={err("pronunciation_guide")}>
          <Input name="pronunciation_guide" defaultValue={values.pronunciation_guide} maxLength={200} />
        </Field>
        <Field label="Related words" name="related" hint="Separate with ;">
          <Input name="related" defaultValue={values.related} />
        </Field>
        <Field label="Content ID" name="content_id" error={err("content_id")} hint="Stable ID used by imports, e.g. A1-VOC-FOOD-0001">
          <Input name="content_id" defaultValue={values.content_id} maxLength={80} />
        </Field>
      </section>

      <section className="space-y-4 rounded-[var(--radius-card)] border border-line bg-surface p-6">
        <h2 className="font-semibold">Verb forms (verbs only)</h2>
        {err("verb_forms") && <p className="text-sm text-danger">{err("verb_forms")![0]}</p>}
        <div className="grid gap-3 sm:grid-cols-3">
          {PERSONS.map(([k, label]) => (
            <Field key={k} label={`Präsens: ${label}`} name={`present_${k}`}>
              <Input name={`present_${k}`} defaultValue={values.present[k] ?? ""} />
            </Field>
          ))}
          <Field label="Partizip II" name="partizip_ii">
            <Input name="partizip_ii" defaultValue={values.partizip_ii} />
          </Field>
          <Field label="Perfekt with" name="auxiliary">
            <select id="auxiliary" name="auxiliary" defaultValue={values.auxiliary} className={select}>
              <option value="">–</option>
              <option>haben</option>
              <option>sein</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="grid gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-6 sm:grid-cols-2">
        <Field label="Notes" name="notes">
          <Textarea name="notes" defaultValue={values.notes} className="min-h-20" />
        </Field>
        <Field label="Source" name="source">
          <Input name="source" defaultValue={values.source} maxLength={200} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_verified" defaultChecked={values.is_verified} className="h-4 w-4" /> Verified by a teacher
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_published" defaultChecked={values.is_published} className="h-4 w-4" /> Published (visible to students)
        </label>
      </section>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save word"}
      </Button>
    </form>
  );
}
