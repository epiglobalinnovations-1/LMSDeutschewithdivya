"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { echo, fieldErrors, type FormState } from "@/lib/validation/form";
import { profileSchema } from "@/lib/validation/profile";

export async function saveProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/app/settings");
  const values = echo(formData, ["fullName", "displayName", "currentLevel", "dailyNewWords", "studyDirection"]);
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      display_name: parsed.data.displayName,
      current_level: parsed.data.currentLevel,
      daily_new_words: parsed.data.dailyNewWords,
      study_direction: parsed.data.studyDirection,
      onboarded_at: user.profile?.onboarded_at ?? new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("profile update failed", error);
    return { message: "Your settings could not be saved. Please try again.", values };
  }
  revalidatePath("/app", "layout");
  return { ok: true, message: "Settings saved.", values };
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/app/settings");
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  // Re-authenticate with the current password before changing it.
  const current = String(formData.get("currentPassword") ?? "");
  const { error: authError } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
  if (authError) return { errors: { currentPassword: ["Your current password is incorrect."] } };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { errors: { password: ["Choose a different password."] } };
    return { message: error.message };
  }
  return { ok: true, message: "Password changed." };
}
