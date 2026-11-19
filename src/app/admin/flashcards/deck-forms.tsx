"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/field";
import { addWords, saveDeck, type AddWordsState, type DeckFormState } from "./actions";

const select = "h-12 w-full rounded-xl border border-line-strong bg-surface px-3";

export type DeckValues = {
  id: string;
  slug: string;
  title: string;
  description: string;
  cefr_level: string;
  topic: string;
  required_plan: string;
  is_published: boolean;
};

export function DeckForm({ values, topics }: { values: DeckValues; topics: { slug: string; name: string }[] }) {
  const [state, action, pending] = useActionState<DeckFormState, FormData>(saveDeck, null);
  return (
    <form action={action} className="grid gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-6 sm:grid-cols-2">
      <input type="hidden" name="id" value={values.id} />
      <input type="hidden" name="originalSlug" value={values.slug} />
      {state && (
        <div className="sm:col-span-2">
          <FormMessage tone={state.ok ? "success" : "danger"}>{state.message}</FormMessage>
        </div>
      )}
      <Field label="Title" name="title">
        <Input name="title" defaultValue={values.title} required maxLength={120} />
      </Field>
      <Field label="Slug" name="slug" hint="Used in links, e.g. a1-food">
        <Input name="slug" defaultValue={values.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Description" name="description">
          <Textarea name="description" defaultValue={values.description} className="min-h-20" maxLength={500} />
        </Field>
      </div>
      <Field label="Level" name="cefr_level">
        <select id="cefr_level" name="cefr_level" defaultValue={values.cefr_level} className={select}>
          <option value="">Mixed</option>
          {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </Field>
      <Field label="Topic" name="topic">
        <select id="topic" name="topic" defaultValue={values.topic} className={select}>
          <option value="">Mixed</option>
          {topics.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Available on" name="required_plan" hint="Plan limits are enforced once memberships launch">
        <select id="required_plan" name="required_plan" defaultValue={values.required_plan} className={select}>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
          <option value="premium_plus">Premium Plus</option>
        </select>
      </Field>
      <label className="flex items-center gap-2 self-end pb-3 text-sm">
        <input type="checkbox" name="is_published" defaultChecked={values.is_published} className="h-4 w-4" /> Published
      </label>
      <div className="sm:col-span-2">
        <Button disabled={pending}>{pending ? "Saving…" : values.id ? "Save deck" : "Create deck"}</Button>
      </div>
    </form>
  );
}

export function AddWordsForm({ deckId }: { deckId: string }) {
  const [state, action, pending] = useActionState<AddWordsState, FormData>(addWords, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="deckId" value={deckId} />
      <Field label="Add words" name="words" hint="German words, one per line or separated by commas. Articles are ignored.">
        <Textarea name="words" className="min-h-20" placeholder="Tisch, Stuhl, Lampe" />
      </Field>
      {state && <FormMessage tone={state.ok ? "success" : "info"}>{state.message}</FormMessage>}
      <Button size="sm" variant="secondary" disabled={pending}>
        {pending ? "Adding…" : "Add to deck"}
      </Button>
    </form>
  );
}
