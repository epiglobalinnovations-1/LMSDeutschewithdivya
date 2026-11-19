import { StudySession } from "@/components/learning/study-session";
import { requireUser } from "@/lib/auth/session";
import { STUDY_MODES, buildStudySession, type StudyMode } from "@/lib/data/study";

export const metadata = { title: "Study session" };

const titles: Record<StudyMode, string> = {
  daily: "Daily session",
  review: "Due reviews",
  new: "New words",
  difficult: "Difficult words",
  bookmarked: "Bookmarked words",
};

export default async function StudyPage({ searchParams }: PageProps<"/app/flashcards/study">) {
  const sp = await searchParams;
  const user = await requireUser("/app/flashcards");
  const mode = (STUDY_MODES as string[]).includes(String(sp.mode)) ? (sp.mode as StudyMode) : "daily";
  const deckSlug = typeof sp.deck === "string" && /^[a-z0-9-]{1,80}$/.test(sp.deck) ? sp.deck : null;
  const dir = sp.dir === "en_de" ? "en_de" : sp.dir === "de_en" ? "de_en" : (user.profile?.study_direction ?? "de_en");

  const plan = await buildStudySession({
    userId: user.id,
    level: user.profile?.current_level ?? "A1",
    dailyTarget: user.profile?.daily_new_words ?? 10,
    timezone: user.profile?.timezone ?? "Asia/Kolkata",
    mode,
    deckSlug,
  });

  return (
    <StudySession
      key={`${mode}-${deckSlug}`}
      cards={plan.cards}
      initialDirection={dir}
      backHref="/app/flashcards"
      title={plan.deck ? plan.deck.title : titles[mode]}
    />
  );
}
