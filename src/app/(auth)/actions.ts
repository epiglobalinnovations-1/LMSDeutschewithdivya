"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { siteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  safeNext,
  emailSchema,
} from "@/lib/validation/auth";
import { echo, fieldErrors, type FormState } from "@/lib/validation/form";

/** Origin for links in auth emails: configured site URL, else the request origin. */
async function origin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return siteUrl;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : siteUrl;
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = echo(formData, ["fullName", "email"]);
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${await origin()}/auth/confirm?next=/app`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { errors: { email: ["An account with this email already exists. Try logging in."] }, values };
    }
    if (error.code === "weak_password") return { errors: { password: [error.message] }, values };
    if (error.status === 429) return { message: "Too many attempts. Please wait a minute and try again.", values };
    console.error("signUp failed", error);
    return { message: "We could not create your account right now. Please try again.", values };
  }

  // With email confirmation on, Supabase returns a user without a session.
  // An existing confirmed address also returns no identities (no account leak).
  if (data.session) redirect("/app");
  redirect(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = echo(formData, ["email"]);
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        message: "Please confirm your email address first. Check your inbox for the link.",
        values: { ...values, unconfirmed: "1" },
      };
    }
    if (error.status === 429) return { message: "Too many attempts. Please wait a minute and try again.", values };
    return { message: "Email or password is incorrect.", values };
  }
  redirect(safeNext(formData.get("next")));
}

export async function resendConfirmation(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { errors: { email: ["Enter a valid email address."] } };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data,
    options: { emailRedirectTo: `${await origin()}/auth/confirm?next=/app` },
  });
  if (error && error.status === 429) return { message: "Please wait a minute before requesting another email." };
  if (error) console.error("resend failed", error);
  // Same answer either way, so the form does not reveal which emails have accounts.
  return { ok: true, message: "If an unconfirmed account exists for this address, a new link is on its way." };
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = echo(formData, ["email"]);
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await origin()}/auth/confirm?next=/reset-password`,
  });
  if (error && error.status === 429) return { message: "Please wait a minute before requesting another email.", values };
  if (error) console.error("reset request failed", error);
  return { ok: true };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { message: "Your reset link has expired. Please request a new one." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { errors: { password: ["Choose a password you have not used before."] } };
    return { message: error.message };
  }
  redirect("/app?password=updated");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?signedout=1");
}
