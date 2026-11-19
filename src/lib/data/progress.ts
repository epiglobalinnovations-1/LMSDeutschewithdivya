import "server-only";
import { createClient } from "@/lib/supabase/server";
import { localDate } from "./study";

export async function getProgressOverview(userId: string, timezone: string) {
  const supabase = await createClient();
  const today = localDate(timezone);
  const start = new Date(`${today}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 29);
  const from = start.toISOString().slice(0, 10);

  const [activity, allActivity, totalReviews, againReviews, byLevel] = await Promise.all([
    supabase
      .from("daily_activity")
      .select("activity_date, xp, minutes_studied, new_words, reviews")
      .eq("user_id", userId)
      .gte("activity_date", from)
      .order("activity_date"),
    supabase.from("daily_activity").select("xp, minutes_studied").eq("user_id", userId),
    supabase.from("review_history").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("review_history").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("rating", "again"),
    supabase.from("student_vocabulary_progress").select("state, vocabulary(cefr_level)").eq("user_id", userId).neq("state", "new").limit(20000),
  ]);

  const days: { date: string; xp: number; minutes: number; newWords: number; reviews: number }[] = [];
  const rows = new Map((activity.data ?? []).map((r) => [r.activity_date, r]));
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    const r = rows.get(key);
    days.push({ date: key, xp: r?.xp ?? 0, minutes: r?.minutes_studied ?? 0, newWords: r?.new_words ?? 0, reviews: r?.reviews ?? 0 });
  }

  const levels: Record<string, number> = {};
  for (const r of byLevel.data ?? []) {
    const lvl = (r.vocabulary as { cefr_level: string } | null)?.cefr_level ?? "?";
    levels[lvl] = (levels[lvl] ?? 0) + 1;
  }
  const total = totalReviews.count ?? 0;
  const again = againReviews.count ?? 0;
  return {
    days,
    xpTotal: (allActivity.data ?? []).reduce((s, r) => s + r.xp, 0),
    minutesTotal: (allActivity.data ?? []).reduce((s, r) => s + r.minutes_studied, 0),
    activeDays: (allActivity.data ?? []).filter((r) => r.xp > 0 || r.minutes_studied > 0).length,
    totalReviews: total,
    accuracy: total ? Math.round(((total - again) / total) * 100) : null,
    wordsByLevel: levels,
  };
}

export async function getAchievements(userId: string) {
  const supabase = await createClient();
  const [{ data: all }, { data: earned }] = await Promise.all([
    supabase.from("achievements").select("id, key, title, description, icon, xp_reward, sort_order").eq("is_active", true).order("sort_order"),
    supabase.from("student_achievements").select("achievement_id, earned_at").eq("user_id", userId),
  ]);
  const map = new Map((earned ?? []).map((e) => [e.achievement_id, e.earned_at]));
  return (all ?? []).map((a) => ({ ...a, earnedAt: map.get(a.id) ?? null }));
}
