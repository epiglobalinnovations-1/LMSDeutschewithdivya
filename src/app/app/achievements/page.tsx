import { PageTitle } from "@/components/app/app-shell";
import { Badge, Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getAchievements, getProgressOverview } from "@/lib/data/progress";

export const metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  const user = await requireUser("/app/achievements");
  const [items, overview] = await Promise.all([getAchievements(user.id), getProgressOverview(user.id, user.profile?.timezone ?? "Asia/Kolkata")]);
  const earned = items.filter((a) => a.earnedAt).length;

  return (
    <>
      <PageTitle eyebrow="Achievements" title={`${earned} of ${items.length} earned`}>
        {overview.xpTotal} XP in total. Achievements are checked every time you finish a card.
      </PageTitle>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => (
          <li key={a.id}>
            <Card className={a.earnedAt ? "h-full p-5" : "h-full p-5 opacity-60"}>
              <div className="flex items-center justify-between">
                <span aria-hidden className="text-2xl">
                  {a.earnedAt ? "🏅" : "○"}
                </span>
                <Badge tone={a.earnedAt ? "success" : "neutral"}>{a.earnedAt ? "Earned" : `+${a.xp_reward} XP`}</Badge>
              </div>
              <p className="mt-3 font-semibold">{a.title}</p>
              <p className="text-sm text-ink-soft">{a.description}</p>
              {a.earnedAt && (
                <p className="mt-2 text-xs text-muted">
                  {new Date(a.earnedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
