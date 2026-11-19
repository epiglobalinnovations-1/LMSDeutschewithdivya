"use server";

import { createClient } from "@/lib/supabase/server";
import { contactSchema } from "@/lib/validation/profile";
import { echo, fieldErrors, type FormState } from "@/lib/validation/form";

export async function submitContact(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData);
  const parsed = contactSchema.safeParse(raw);
  const values = echo(formData, ["name", "email", "topic", "message"]);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  // Honeypot filled in: pretend success, store nothing.
  if (parsed.data.website) return { ok: true };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("contact_messages").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    topic: parsed.data.topic,
    message: parsed.data.message,
    user_id: user?.id ?? null,
  });

  if (error) {
    console.error("contact insert failed", error);
    return { message: "Sorry, your message could not be sent. Please try again in a moment.", values };
  }
  return { ok: true };
}
