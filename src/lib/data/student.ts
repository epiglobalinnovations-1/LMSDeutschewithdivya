import "server-only";
import { createClient } from "@/lib/supabase/server";
import { localDate } from "./study";

export type DashboardStats = {
  wordsLearned: number;
  dueNow: number;
  newToday: number;
  streakDays: number;
  minutesThisWeek: number;
  xpTotal: number;
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Current streak: consecutive days with activity, ending today or yesterday. */
export function computeStreak(activeDates: string[], today = new Date()): number {
  const set = new Set(activeDates);
  const cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (!set.has(isoDate(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (set.has(isoDate(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

/** Live numbers for the student dashboard, read through RLS (own rows only). */
export async function getDashboardStats(userId: string, timezone = "Asia/Kolkata"): Promise<DashboardStats> {
  const supabase = await createClient();
  const now = new Date();
  const today = localDate(timezone, now);
  const weekAgo = new Date(now);
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 6);
  const ninetyAgo = new Date(now);
  ninetyAgo.setUTCDate(ninetyAgo.getUTCDate() - 90);

  const [learned, due, activity] = await Promise.all([
    supabase.from("student_vocabulary_progress").select("vocabulary_id", { count: "exact", head: true }).eq("user_id", userId).neq("state", "new"),
    supabase
      .from("student_vocabulary_progress")
      .select("vocabulary_id", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("state", "new")
      .lte("due_at", now.toISOString()),
    supabase
      .from("daily_activity")
      .select("activity_date, xp, minutes_studied, new_words")
      .eq("user_id", userId)
      .gte("activity_date", isoDate(ninetyAgo))
      .order("activity_date", { ascending: false }),
  ]);

  const rows = activity.data ?? [];
  const weekStart = isoDate(weekAgo);
  return {
    wordsLearned: learned.count ?? 0,
    dueNow: due.count ?? 0,
    newToday: rows.find((r) => r.activity_date === today)?.new_words ?? 0,
    streakDays: computeStreak(rows.filter((r) => r.xp > 0 || r.minutes_studied > 0).map((r) => r.activity_date), now),
    minutesThisWeek: rows.filter((r) => r.activity_date >= weekStart).reduce((s, r) => s + r.minutes_studied, 0),
    xpTotal: rows.reduce((s, r) => s + r.xp, 0),
  };
}

export async function getActiveAnnouncements() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("id, title, body, published_at")
    .order("published_at", { ascending: false })
    .limit(3);
  return data ?? [];
}
