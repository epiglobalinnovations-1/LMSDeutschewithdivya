"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/validation/form";
import { submitContact } from "./actions";

const topics = [
  { value: "courses", label: "Courses and levels" },
  { value: "membership", label: "Membership and pricing" },
  { value: "technical", label: "Technical help" },
  { value: "other", label: "Something else" },
];

export function ContactForm({ defaultTopic }: { defaultTopic?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitContact, {});

  if (state.ok) {
    return (
      <FormMessage tone="success">
        <strong className="font-semibold">Danke!</strong> Your message has been received. We usually reply within two working days.
      </FormMessage>
    );
  }

  const v = state.values ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message && <FormMessage>{state.message}</FormMessage>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" name="name" error={state.errors?.name}>
          <Input name="name" autoComplete="name" defaultValue={v.name} error={state.errors?.name} required />
        </Field>
        <Field label="Email" name="email" error={state.errors?.email}>
          <Input name="email" type="email" autoComplete="email" defaultValue={v.email} error={state.errors?.email} required />
        </Field>
      </div>
      <Field label="Topic" name="topic" error={state.errors?.topic}>
        <Select name="topic" defaultValue={v.topic || defaultTopic || "courses"} error={state.errors?.topic}>
          {topics.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Message" name="message" error={state.errors?.message}>
        <Textarea name="message" defaultValue={v.message} error={state.errors?.message} required />
      </Field>
      {/* Honeypot, hidden from people and screen readers */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
