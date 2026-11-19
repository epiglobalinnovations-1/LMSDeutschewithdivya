"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select } from "@/components/ui/field";
import { CEFR_LEVELS, DAILY_NEW_WORD_OPTIONS } from "@/lib/validation/profile";
import type { FormState } from "@/lib/validation/form";
import { changePassword, saveProfile } from "./actions";

type ProfileDefaults = {
  fullName: string;
  displayName: string;
  currentLevel: string;
  dailyNewWords: number;
  studyDirection: string;
};

export function ProfileForm({ defaults }: { defaults: ProfileDefaults }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProfile, {});
  const v = state.values;
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message && <FormMessage tone={state.ok ? "success" : "danger"}>{state.message}</FormMessage>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" name="fullName" error={state.errors?.fullName}>
          <Input name="fullName" autoComplete="name" defaultValue={v?.fullName ?? defaults.fullName} error={state.errors?.fullName} />
        </Field>
        <Field label="Display name" name="displayName" error={state.errors?.displayName} hint="Shown on leaderboards.">
          <Input name="displayName" defaultValue={v?.displayName ?? defaults.displayName} error={state.errors?.displayName} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Current level" name="currentLevel" error={state.errors?.currentLevel}>
          <Select name="currentLevel" defaultValue={v?.currentLevel ?? defaults.currentLevel}>
            {CEFR_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="New words per day" name="dailyNewWords" error={state.errors?.dailyNewWords}>
          <Select name="dailyNewWords" defaultValue={String(v?.dailyNewWords ?? defaults.dailyNewWords)}>
            {DAILY_NEW_WORD_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} words
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Card direction" name="studyDirection" error={state.errors?.studyDirection}>
          <Select name="studyDirection" defaultValue={v?.studyDirection ?? defaults.studyDirection}>
            <option value="de_en">German → English</option>
            <option value="en_de">English → German</option>
          </Select>
        </Field>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message && <FormMessage tone={state.ok ? "success" : "danger"}>{state.message}</FormMessage>}
      <Field label="Current password" name="currentPassword" error={state.errors?.currentPassword}>
        <Input name="currentPassword" type="password" autoComplete="current-password" error={state.errors?.currentPassword} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="New password" name="password" error={state.errors?.password}>
          <Input name="password" type="password" autoComplete="new-password" error={state.errors?.password} />
        </Field>
        <Field label="Confirm new password" name="confirmPassword" error={state.errors?.confirmPassword}>
          <Input name="confirmPassword" type="password" autoComplete="new-password" error={state.errors?.confirmPassword} />
        </Field>
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Changing…" : "Change password"}
      </Button>
    </form>
  );
}
