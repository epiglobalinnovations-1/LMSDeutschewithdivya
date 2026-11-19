import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { Database } from "@/lib/supabase/database.types";

export type Course = Database["public"]["Tables"]["courses"]["Row"];
export type CourseModule = Database["public"]["Tables"]["course_modules"]["Row"];
export type Plan = Database["public"]["Tables"]["membership_plans"]["Row"];

export async function listPublishedCourses(): Promise<Course[]> {
  const db = createPublicClient();
  if (!db) return [];
  const { data, error } = await db.from("courses").select("*").order("sort_order");
  if (error) throw new Error(`Could not load courses: ${error.message}`);
  return data;
}

export async function getCourseWithModules(slug: string) {
  const db = createPublicClient();
  if (!db) return null;
  const { data, error } = await db
    .from("courses")
    .select("*, course_modules(*)")
    .eq("slug", slug)
    .order("sort_order", { referencedTable: "course_modules" })
    .maybeSingle();
  if (error) throw new Error(`Could not load course: ${error.message}`);
  return data;
}

export async function listPlans(): Promise<Plan[]> {
  const db = createPublicClient();
  if (!db) return [];
  const { data, error } = await db.from("membership_plans").select("*").order("sort_order");
  if (error) throw new Error(`Could not load plans: ${error.message}`);
  return data;
}

export const planLabel: Record<Database["public"]["Enums"]["plan_tier"], string> = {
  free: "Free",
  premium: "Premium",
  premium_plus: "Premium Plus",
};
