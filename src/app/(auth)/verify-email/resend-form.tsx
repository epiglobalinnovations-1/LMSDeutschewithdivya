"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";
import type { FormState } from "@/lib/validation/form";
import { resendConfirmation } from "../actions";

export function ResendForm({ email }: { email?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resendConfirmation, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && <FormMessage tone={state.ok ? "success" : "danger"}>{state.message}</FormMessage>}
      <Field label="Email" name="email" error={state.errors?.email}>
        <Input name="email" type="email" autoComplete="email" defaultValue={email} error={state.errors?.email} required />
      </Field>
      <Button type="submit" variant="secondary" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Resend confirmation email"}
      </Button>
    </form>
  );
}
