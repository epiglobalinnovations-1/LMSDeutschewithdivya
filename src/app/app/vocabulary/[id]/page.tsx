import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/app/app-shell";
import { SpeakButton } from "@/components/learning/flashcard";
import { WordActions } from "@/components/learning/word-actions";
import { Badge, Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getWord } from "@/lib/data/study";
import { categoriesOf, formatInterval, retrievability } from "@/lib/srs/fsrs";

export const metadata = { title: "Word" };

const PERSONS: [string, string][] = [
  ["ich", "ich"],
  ["du", "du"],
  ["er_sie_es", "er/sie/es"],
  ["wir", "wir"],
  ["ihr", "ihr"],
  ["sie_Sie", "sie/Sie"],
];

export default async function WordPage({ params }: PageProps<"/app/vocabulary/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const user = await requireUser(`/app/vocabulary/${id}`);
  const w = await getWord(user.id, id);
  if (!w) notFound();
  const now = new Date();
  const german = w.article ? `${w.article} ${w.lemma}` : w.lemma;
  const p = w.progress && w.progress.state !== "new" ? w.progress : null;
  const vf = w.verbForms;

  return (
    <>
      <Link href="/app/vocabulary" className="text-sm text-ink-soft hover:text-accent">
        ← Vocabulary
      </Link>
      <PageTitle eyebrow={`${w.cefrLevel} · ${w.partOfSpeech}${w.topic ? ` · ${w.topic}` : ""}`} title={german}>
        {w.translations.join(", ")}
      </PageTitle>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="space-y-5 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <SpeakButton text={german} label="Hear it" />
            {w.ipa && <span className="font-mono text-ink-soft">/{w.ipa}/</span>}
            {w.pronunciationGuide && <span className="text-sm text-muted">Say: {w.pronunciationGuide}</span>}
          </div>
          {w.partOfSpeech === "noun" && (
            <p>
              <span className="text-muted">Plural: </span>
              {w.plural ? `die ${w.plural}` : w.hasPlural === false ? "no plural in normal use" : "–"}
            </p>
          )}
          {vf && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted">
                    <th className="py-1 pr-4 font-medium">Person</th>
                    {vf.present && <th className="py-1 pr-4 font-medium">Präsens</th>}
                    {vf.praeteritum && <th className="py-1 font-medium">Präteritum</th>}
                  </tr>
                </thead>
                <tbody>
                  {PERSONS.map(([k, label]) => (
                    <tr key={k} className="border-t border-line">
                      <td className="py-1 pr-4 text-muted">{label}</td>
                      {vf.present && <td className="py-1 pr-4">{vf.present[k as keyof typeof vf.present]}</td>}
                      {vf.praeteritum && <td className="py-1">{vf.praeteritum[k as keyof typeof vf.praeteritum]}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
              {vf.partizip_ii && (
                <p className="mt-3 text-sm">
                  Perfekt: ich {w.auxiliary === "sein" ? "bin" : "habe"} {vf.partizip_ii}
                </p>
              )}
            </div>
          )}
          {w.examples.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold">Examples</h2>
              <ul className="mt-2 space-y-3">
                {w.examples.map((e, i) => (
                  <li key={i} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg italic">„{e.de}“</p>
                      <p className="text-sm text-muted">{e.en}</p>
                    </div>
                    <SpeakButton text={e.de} label="Play" />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!w.isVerified && <p className="text-xs text-muted">Draft entry, awaiting teacher review.</p>}
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="font-semibold">Your progress</h2>
          <div className="flex flex-wrap gap-1">
            {categoriesOf(w.progress, now).map((c) => (
              <Badge key={c}>{c}</Badge>
            ))}
          </div>
          {p ? (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Fact label="Next review" value={new Date(p.due_at) <= now ? "Due now" : `in ${formatInterval(new Date(p.due_at).getTime() - now.getTime())}`} />
              <Fact label="Recall chance" value={`${Math.round(retrievability(p, now) * 100)}%`} />
              <Fact label="Reviews" value={String(p.reps)} />
              <Fact label="Forgotten" value={`${p.lapses}×`} />
              <Fact label="Correct" value={String(p.correct_count)} />
              <Fact label="Incorrect" value={String(p.incorrect_count)} />
            </dl>
          ) : (
            <p className="text-sm text-ink-soft">You have not studied this word yet.</p>
          )}
          <WordActions id={w.id} bookmarked={w.isBookmarked} started={!!p} />
        </Card>
      </div>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-paper px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
