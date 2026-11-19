import Link from "next/link";
import { PageTitle } from "@/components/app/app-shell";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Badge, Card, ProgressRing } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { buildStudySession, getCategoryCounts, getNewWordsToday, getPublishedDecks } from "@/lib/data/study";

export const metadata = { title: "Flashcards" };

export default async function FlashcardsPage() {
  const user = await requireUser("/app/flashcards");
  const tz = user.profile?.timezone ?? "Asia/Kolkata";
  const target = user.profile?.daily_new_words ?? 10;
  const level = user.profile?.current_level ?? "A1";
  const [decks, counts, today, plan] = await Promise.all([
    getPublishedDecks(),
    getCategoryCounts(),
    getNewWordsToday(user.id, tz),
    buildStudySession({ userId: user.id, level, dailyTarget: target, timezone: tz, mode: "daily" }),
  ]);
  const pct = Math.min(100, (today.newWords / target) * 100);
  const dir = user.profile?.study_direction ?? "de_en";

  return (
    <>
      <PageTitle eyebrow="Flashcards" title="Today’s practice">
        Reviews are scheduled with FSRS, so each word comes back just before you would forget it.
      </PageTitle>

      <Card className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-5">
          <div className="relative">
            <ProgressRing value={pct} size={76} label="Today's new words" />
            <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
              {today.newWords}/{target}
            </span>
          </div>
          <div>
            <p className="font-display text-2xl" data-testid="session-size">
              {plan.cards.length === 0 ? "All done for today" : `${plan.cards.length} cards ready`}
            </p>
            <p className="text-sm text-ink-soft">
              {plan.dueCount} {plan.dueCount === 1 ? "review" : "reviews"} due · {plan.newCount} new {plan.newCount === 1 ? "word" : "words"}
            </p>
            <Link href="/app/settings" className="text-xs text-accent hover:underline">
              Daily target: {target} new words. Change
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/app/flashcards/study?mode=daily&dir=${dir}`} size="lg" aria-disabled={plan.cards.length === 0}>
            {plan.cards.length === 0 ? "Practise anyway" : "Start session"}
          </ButtonLink>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Mode href={`/app/flashcards/study?mode=review&dir=${dir}`} label="Due reviews" value={counts.due} />
        <Mode href={`/app/flashcards/study?mode=new&dir=${dir}`} label="New words left today" value={plan.newRemainingToday} />
        <Mode href={`/app/flashcards/study?mode=difficult&dir=${dir}`} label="Difficult" value={counts.difficult} />
        <Mode href={`/app/flashcards/study?mode=bookmarked&dir=${dir}`} label="Bookmarked" value={counts.bookmarked} />
        <Mode href="/app/vocabulary?category=mastered" label="Mastered" value={counts.mastered} />
      </div>

      <h2 className="mt-10 font-display text-2xl">Decks</h2>
      {decks.length === 0 ? (
        <p className="mt-3 text-ink-soft">No decks are published yet.</p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {decks.map((d) => (
            <li key={d.id}>
              <Card className="flex h-full flex-col p-5">
                <div className="flex items-center gap-2">
                  {d.cefrLevel && <Badge tone="accent">{d.cefrLevel}</Badge>}
                  {d.topic && <Badge>{d.topic}</Badge>}
                  {d.requiredPlan !== "free" && <Badge tone="gold">{d.requiredPlan === "premium" ? "Premium" : "Premium Plus"}</Badge>}
                </div>
                <p className="mt-3 font-semibold">{d.title}</p>
                {d.description && <p className="mt-1 text-sm text-ink-soft">{d.description}</p>}
                <p className="mt-1 text-sm text-muted">{d.cardCount} words</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <Link href={`/app/flashcards/study?mode=daily&deck=${d.slug}&dir=${dir}`} className={buttonClasses("secondary", "sm")}>
                    Study this deck
                  </Link>
                  <Link href={`/app/vocabulary?deck=${d.slug}`} className={buttonClasses("ghost", "sm")}>
                    Browse words
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Mode({ href, label, value }: { href: string; label: string; value: number }) {
  return (
    <Link href={href} className="rounded-[var(--radius-card)] border border-line bg-surface p-4 hover:border-ink">
      <p className="font-display text-3xl">{value}</p>
      <p className="text-sm text-ink-soft">{label}</p>
    </Link>
  );
}
