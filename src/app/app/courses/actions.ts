"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const RANK = { free: 0, premium: 1, premium_plus: 2 } as const;

export type EnrolState = { ok: boolean; message: string } | null;

export async function enrol(_prev: EnrolState, form: FormData): Promise<EnrolState> {
  const user = await requireUser("/app/courses");
  const id = z.uuid().safeParse(form.get("courseId"));
  if (!id.success) return { ok: false, message: "Unknown course." };
  const supabase = await createClient();
  const [{ data: course }, { data: tier }] = await Promise.all([
    supabase.from("courses").select("id, title, required_plan").eq("id", id.data).eq("is_published", true).maybeSingle(),
    supabase.rpc("current_plan_tier"),
  ]);
  if (!course) return { ok: false, message: "This course is not available." };
  const have = RANK[(tier ?? "free") as keyof typeof RANK] ?? 0;
  if (RANK[course.required_plan] > have && !user.isStaff) {
    return { ok: false, message: `${course.title} is part of the ${course.required_plan === "premium" ? "Premium" : "Premium Plus"} membership.` };
  }
  const { error } = await supabase.from("enrollments").upsert({ user_id: user.id, course_id: course.id }, { onConflict: "user_id,course_id", ignoreDuplicates: true });
  if (error) return { ok: false, message: "Could not enrol you. Please try again." };
  revalidatePath("/app/courses");
  revalidatePath("/app");
  return { ok: true, message: `You are enrolled in ${course.title}.` };
}

export async function leave(form: FormData) {
  const user = await requireUser("/app/courses");
  const id = z.uuid().safeParse(form.get("courseId"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("enrollments").delete().eq("user_id", user.id).eq("course_id", id.data);
  revalidatePath("/app/courses");
}
