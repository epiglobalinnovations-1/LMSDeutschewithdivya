import Link from "next/link";
import { PageTitle } from "@/components/app/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card, ProgressRing } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/field";
import { displayName, requireUser } from "@/lib/auth/session";
import { getActiveAnnouncements, getDashboardStats } from "@/lib/data/student";

const levelNames: Record<string, string> = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper intermediate",
  C1: "Advanced",
  C2: "Proficient",
};

function greeting() {
  const h = new Date().toLocaleString("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" });
  const hour = Number(h);
  if (hour < 11) return "Guten Morgen";
  if (hour < 18) return "Guten Tag";
  return "Guten Abend";
}

export default async function DashboardPage({ searchParams }: PageProps<"/app">) {
  const sp = await searchParams;
  const user = await requireUser();
  const [stats, announcements] = await Promise.all([getDashboardStats(user.id), getActiveAnnouncements()]);
  const level = user.profile?.current_level ?? "A1";
  const target = user.profile?.daily_new_words ?? 10;
  const todayPct = Math.min(100, (stats.newToday / target) * 100);

  return (
    <>
      {sp.password === "updated" && (
        <div className="mb-6">
          <FormMessage tone="success">Your password has been updated.</FormMessage>
        </div>
      )}
      {sp.denied === "admin" && (
        <div className="mb-6">
          <FormMessage>The admin area is only available to teachers and administrators.</FormMessage>
        </div>
      )}

      <PageTitle eyebrow={`${greeting()}`} title={`${displayName(user)}, ready for today?`} />

      <Card className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-5">
          <div className="relative">
            <ProgressRing value={todayPct} size={76} label="Today's new words" />
            <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
              {stats.newToday}/{target}
            </span>
          </div>
          <div>
            <p className="text-sm text-muted">Today’s target</p>
            <p className="font-display text-2xl">{target} new words</p>
            <p className="text-sm text-ink-soft">
              {stats.dueNow} {stats.dueNow === 1 ? "review" : "reviews"} due
            </p>
          </div>
        </div>
        <ButtonLink href="/app/flashcards" size="lg">
          Continue learning
        </ButtonLink>
      </Card>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Current level" value={level} sub={levelNames[level]} />
        <Stat label="Words learned" value={stats.wordsLearned} />
        <Stat label="Day streak" value={stats.streakDays} sub={stats.streakDays === 1 ? "day" : "days"} />
        <Stat label="This week" value={stats.minutesThisWeek} sub="minutes" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="p-6">
          <h2 className="font-semibold">Recommended next</h2>
          {stats.wordsLearned === 0 ? (
            <p className="mt-2 text-ink-soft">
              Start with your first {target} {level} words. Flashcards open in the next release of the platform; your
              settings below decide how many new words you get each day.
            </p>
          ) : (
            <p className="mt-2 text-ink-soft">Clear your {stats.dueNow} due reviews first, then learn new words.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/app/settings" className="text-sm font-medium text-accent hover:underline">
              Adjust daily target →
            </Link>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold">Announcements</h2>
          {announcements.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No announcements right now.</p>
          ) : (
            <ul className="mt-3 space-y-4">
              {announcements.map((a) => (
                <li key={a.id}>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-ink-soft">{a.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {!user.emailConfirmed && (
        <p className="mt-6">
          <Badge tone="gold">Email not confirmed</Badge>
        </p>
      )}
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
      {sub && <p className="text-sm text-ink-soft">{sub}</p>}
    </Card>
  );
}
