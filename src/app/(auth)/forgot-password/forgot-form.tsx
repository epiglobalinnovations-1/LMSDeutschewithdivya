"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";
import type { FormState } from "@/lib/validation/form";
import { requestPasswordReset } from "../actions";

export function ForgotForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, {});
  if (state.ok) {
    return (
      <FormMessage tone="success">
        If an account exists for that address, we have sent a link to reset your password. It is valid for one hour.
      </FormMessage>
    );
  }
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message && <FormMessage>{state.message}</FormMessage>}
      <Field label="Email" name="email" error={state.errors?.email}>
        <Input name="email" type="email" autoComplete="email" defaultValue={state.values?.email} error={state.errors?.email} required />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
