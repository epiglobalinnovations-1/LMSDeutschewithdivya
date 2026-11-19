import type { Metadata } from "next";
import { PhraseList, type Phrase } from "@/components/learning/phrase-list";
import { Eyebrow, PageHero, Section } from "@/components/site/section";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Free German learning resources",
  description:
    "Free German resources for beginners: essential A1 phrases with audio, tips for der, die and das, and the German alphabet with umlauts.",
  alternates: { canonical: "/resources" },
};

const greetings: Phrase[] = [
  { de: "Hallo!", en: "Hello!" },
  { de: "Guten Morgen!", en: "Good morning!" },
  { de: "Guten Tag!", en: "Good day! / Hello!", note: "polite, daytime" },
  { de: "Guten Abend!", en: "Good evening!" },
  { de: "Tschüss!", en: "Bye!", note: "informal" },
  { de: "Auf Wiedersehen!", en: "Goodbye!", note: "polite" },
  { de: "Wie geht es Ihnen?", en: "How are you?", note: "polite" },
  { de: "Wie geht's?", en: "How's it going?", note: "informal" },
];

const firstConversation: Phrase[] = [
  { de: "Ich heiße Priya.", en: "My name is Priya." },
  { de: "Ich komme aus Indien.", en: "I come from India." },
  { de: "Ich wohne in Pune.", en: "I live in Pune." },
  { de: "Ich lerne Deutsch.", en: "I am learning German." },
  { de: "Sprechen Sie Englisch?", en: "Do you speak English?", note: "polite" },
  { de: "Ich verstehe das nicht.", en: "I don't understand that." },
  { de: "Noch einmal, bitte.", en: "Once more, please." },
  { de: "Danke schön!", en: "Thank you very much!" },
  { de: "Bitte schön!", en: "You're welcome!" },
  { de: "Entschuldigung!", en: "Excuse me! / Sorry!" },
];

const articleTips = [
  { ending: "-ung, -heit, -keit, -schaft, -ion", article: "die", example: "die Zeitung, die Freiheit, die Station" },
  { ending: "-chen, -lein", article: "das", example: "das Mädchen, das Brötchen" },
  { ending: "-er (people doing something), -ling", article: "der", example: "der Lehrer, der Frühling" },
  { ending: "Days, months, seasons", article: "der", example: "der Montag, der Mai, der Sommer" },
];

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="Free resources"
        title="Start speaking German today."
        intro="Essential phrases with audio, simple rules for der, die and das, and the sounds that make German German. Free, no account needed."
      />
      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>Greetings</Eyebrow>
            <h2 className="mt-3 font-display text-2xl">Saying hello and goodbye</h2>
            <div className="mt-6">
              <PhraseList phrases={greetings} />
            </div>
          </div>
          <div>
            <Eyebrow>Your first conversation</Eyebrow>
            <h2 className="mt-3 font-display text-2xl">Introduce yourself</h2>
            <div className="mt-6">
              <PhraseList phrases={firstConversation} />
            </div>
          </div>
        </div>
      </Section>

      <Section className="bg-surface">
        <Eyebrow>Der, die oder das?</Eyebrow>
        <h2 className="mt-3 font-display text-3xl">Four patterns that help with articles</h2>
        <p className="mt-3 max-w-2xl text-ink-soft">
          There is no perfect rule for German genders, which is why every noun on our flashcards comes with its article. These
          endings, though, are reliable and worth knowing from day one.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {articleTips.map((t) => (
            <Card key={t.ending} className="p-6">
              <p className="font-display text-3xl text-accent">{t.article}</p>
              <p className="mt-2 font-semibold">{t.ending}</p>
              <p lang="de" className="mt-1 text-sm text-ink-soft">
                {t.example}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      <Section>
        <Eyebrow>Pronunciation</Eyebrow>
        <h2 className="mt-3 font-display text-3xl">The special letters</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: "ä", t: "Like the “e” in “bed”.", w: "Mädchen" },
            { l: "ö", t: "Say “e” with rounded lips.", w: "schön" },
            { l: "ü", t: "Say “ee” with rounded lips.", w: "müde" },
            { l: "ß", t: "A sharp “s” sound, called Eszett.", w: "Straße" },
          ].map((x) => (
            <Card key={x.l} className="p-6">
              <p className="font-display text-5xl text-ink">{x.l}</p>
              <p className="mt-3 text-sm text-ink-soft">{x.t}</p>
              <p lang="de" className="mt-2 font-medium">
                {x.w}
              </p>
            </Card>
          ))}
        </div>
        <Card className="mt-12 flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-display text-2xl">Ready for more?</h3>
            <p className="mt-1 text-ink-soft">A free account gives you daily flashcards and your own progress tracking.</p>
          </div>
          <ButtonLink href="/register">Create a free account</ButtonLink>
        </Card>
      </Section>
    </>
  );
}
