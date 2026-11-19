"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";
import type { FormState } from "@/lib/validation/form";
import { register } from "../actions";

export function RegisterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(register, {});
  const v = state.values ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message && <FormMessage>{state.message}</FormMessage>}
      <Field label="Full name" name="fullName" error={state.errors?.fullName}>
        <Input name="fullName" autoComplete="name" defaultValue={v.fullName} error={state.errors?.fullName} required />
      </Field>
      <Field label="Email" name="email" error={state.errors?.email}>
        <Input name="email" type="email" autoComplete="email" inputMode="email" defaultValue={v.email} error={state.errors?.email} required />
      </Field>
      <Field label="Password" name="password" error={state.errors?.password} hint="At least 8 characters, with a letter and a number.">
        <Input name="password" type="password" autoComplete="new-password" error={state.errors?.password} required />
      </Field>
      <Field label="Confirm password" name="confirmPassword" error={state.errors?.confirmPassword}>
        <Input name="confirmPassword" type="password" autoComplete="new-password" error={state.errors?.confirmPassword} required />
      </Field>
      <div className="space-y-1.5">
        <label className="flex items-start gap-3 text-sm text-ink-soft">
          <input type="checkbox" name="acceptTerms" className="mt-0.5 h-4 w-4 accent-[var(--accent)]" />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-accent underline" target="_blank">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-accent underline" target="_blank">
              privacy policy
            </Link>
            .
          </span>
        </label>
        {state.errors?.acceptTerms && (
          <p className="text-sm text-danger" role="alert">
            {state.errors.acceptTerms[0]}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
