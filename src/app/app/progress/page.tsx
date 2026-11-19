import { PageTitle } from "@/components/app/app-shell";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getProgressOverview } from "@/lib/data/progress";
import { getCategoryCounts } from "@/lib/data/study";
import { getDashboardStats } from "@/lib/data/student";

export const metadata = { title: "My progress" };

export default async function ProgressPage() {
  const user = await requireUser("/app/progress");
  const tz = user.profile?.timezone ?? "Asia/Kolkata";
  const [o, counts, stats] = await Promise.all([getProgressOverview(user.id, tz), getCategoryCounts(), getDashboardStats(user.id, tz)]);
  const maxXp = Math.max(10, ...o.days.map((d) => d.xp));

  return (
    <>
      <PageTitle eyebrow="My progress" title="How you are doing" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Words started" value={counts.totalSeen} />
        <Stat label="Mastered" value={counts.mastered} />
        <Stat label="Day streak" value={stats.streakDays} />
        <Stat label="Total XP" value={o.xpTotal} />
        <Stat label="Reviews" value={o.totalReviews} />
        <Stat label="Recall accuracy" value={o.accuracy === null ? "–" : `${o.accuracy}%`} />
        <Stat label="Study time" value={`${o.minutesTotal} min`} />
        <Stat label="Active days" value={o.activeDays} />
      </div>

      <Card className="mt-6 p-6">
        <h2 className="font-semibold">Last 30 days</h2>
        <p className="text-sm text-muted">XP earned per day</p>
        <div className="mt-4 flex h-40 items-end gap-[3px]" role="img" aria-label="Bar chart of XP per day for the last 30 days">
          {o.days.map((d) => (
            <div key={d.date} className="group relative flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t bg-accent/80 group-hover:bg-accent"
                style={{ height: `${Math.max(d.xp ? 4 : 1, (d.xp / maxXp) * 100)}%`, opacity: d.xp ? 1 : 0.15 }}
              />
              <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-xs text-paper group-hover:block">
                {d.date.slice(5)}: {d.xp} XP, {d.reviews} reviews
              </span>
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>{o.days[0].date.slice(5)}</span>
          <span>Today</span>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold">Words by category</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <Row label="Learning" value={counts.learning} />
            <Row label="Due now" value={counts.due} />
            <Row label="Difficult" value={counts.difficult} />
            <Row label="Mastered" value={counts.mastered} />
            <Row label="Bookmarked" value={counts.bookmarked} />
          </ul>
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold">Words by level</h2>
          {Object.keys(o.wordsByLevel).length === 0 ? (
            <p className="mt-3 text-sm text-muted">Start a flashcard session to see your words here.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {Object.entries(o.wordsByLevel)
                .sort()
                .map(([lvl, n]) => (
                  <Row key={lvl} label={lvl} value={n} />
                ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted">Grammar, listening and writing skills appear here once those modules open.</p>
        </Card>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </Card>
  );
}
function Row({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex justify-between border-b border-line pb-2 last:border-0">
      <span className="text-ink-soft">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </li>
  );
}
