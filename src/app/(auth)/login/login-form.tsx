"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";
import type { FormState } from "@/lib/validation/form";
import { login } from "../actions";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  const v = state.values ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      {notice && !state.message && <FormMessage tone="success">{notice}</FormMessage>}
      {state.message && (
        <FormMessage>
          {state.message}{" "}
          {v.unconfirmed && (
            <Link className="font-semibold underline" href={`/verify-email?email=${encodeURIComponent(v.email ?? "")}`}>
              Resend link
            </Link>
          )}
        </FormMessage>
      )}
      <input type="hidden" name="next" value={next ?? "/app"} />
      <Field label="Email" name="email" error={state.errors?.email}>
        <Input name="email" type="email" autoComplete="email" inputMode="email" defaultValue={v.email} error={state.errors?.email} required />
      </Field>
      <Field label="Password" name="password" error={state.errors?.password}>
        <Input name="password" type="password" autoComplete="current-password" error={state.errors?.password} required />
      </Field>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm text-accent hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
