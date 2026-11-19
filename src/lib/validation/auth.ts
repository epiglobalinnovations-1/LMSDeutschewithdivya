import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email({ error: "Enter a valid email address." }));

export const passwordSchema = z
  .string()
  .min(8, { error: "Use at least 8 characters." })
  .max(72, { error: "Use at most 72 characters." })
  .regex(/[A-Za-z]/, { error: "Include at least one letter." })
  .regex(/[0-9]/, { error: "Include at least one number." });

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, { error: "Enter your name." }).max(120),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal("on", { error: "Please accept the terms to continue." }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords do not match.",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Enter your password." }),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    error: "Passwords do not match.",
  });

/** Only allow same-site relative redirects after sign-in. */
export function safeNext(value: FormDataEntryValue | string | null | undefined, fallback = "/app") {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
