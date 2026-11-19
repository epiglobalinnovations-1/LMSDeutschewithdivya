import { z } from "zod";

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const DAILY_NEW_WORD_OPTIONS = [5, 10, 15, 20, 30] as const;

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, { error: "Enter your name." }).max(120),
  displayName: z.string().trim().max(60).optional().transform((v) => v || null),
  currentLevel: z.enum(CEFR_LEVELS),
  dailyNewWords: z.coerce
    .number()
    .refine((n) => (DAILY_NEW_WORD_OPTIONS as readonly number[]).includes(n), { error: "Choose 5, 10, 15, 20 or 30." }),
  studyDirection: z.enum(["de_en", "en_de"]),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1, { error: "Enter your name." }).max(120),
  email: z.string().trim().max(254).pipe(z.email({ error: "Enter a valid email address." })),
  topic: z.enum(["courses", "membership", "technical", "other"]),
  message: z
    .string()
    .trim()
    .min(10, { error: "Please write at least 10 characters." })
    .max(5000, { error: "Please keep it under 5,000 characters." }),
  // Honeypot: real people leave this empty.
  website: z.string().max(0).optional(),
});
