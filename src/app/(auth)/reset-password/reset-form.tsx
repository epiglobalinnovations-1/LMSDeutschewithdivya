"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";
import type { FormState } from "@/lib/validation/form";
import { updatePassword } from "../actions";

export function ResetForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(updatePassword, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message && <FormMessage>{state.message}</FormMessage>}
      <Field label="New password" name="password" error={state.errors?.password} hint="At least 8 characters, with a letter and a number.">
        <Input name="password" type="password" autoComplete="new-password" error={state.errors?.password} required />
      </Field>
      <Field label="Confirm new password" name="confirmPassword" error={state.errors?.confirmPassword}>
        <Input name="confirmPassword" type="password" autoComplete="new-password" error={state.errors?.confirmPassword} required />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
