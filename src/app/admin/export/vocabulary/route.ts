import Papa from "papaparse";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/** Staff-only export of all vocabulary as CSV or generator-style JSON. */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user?.isStaff) return new Response("Forbidden", { status: 403 });
  const format = new URL(request.url).searchParams.get("format") === "json" ? "json" : "csv";
  const supabase = await createClient();

  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("vocabulary")
      .select(
        "content_id, lemma, article, plural, has_plural, part_of_speech, cefr_level, ipa, pronunciation_guide, difficulty, frequency_rank, notes, source, verb_forms, auxiliary, related_terms, is_verified, is_published, topics(slug), vocabulary_translations(translation, sort_order), vocabulary_examples(sentence_de, sentence_en, sort_order)",
      )
      .order("cefr_level")
      .order("lemma")
      .range(from, from + 999);
    if (error) return new Response(`Export failed: ${error.message}`, { status: 500 });
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  type Row = {
    content_id: string | null;
    lemma: string;
    article: string | null;
    plural: string | null;
    has_plural: boolean | null;
    part_of_speech: string;
    cefr_level: string;
    ipa: string | null;
    pronunciation_guide: string | null;
    difficulty: number;
    frequency_rank: number | null;
    notes: string | null;
    source: string | null;
    verb_forms: unknown;
    auxiliary: string | null;
    related_terms: string[];
    is_verified: boolean;
    is_published: boolean;
    topics: { slug: string } | null;
    vocabulary_translations: { translation: string; sort_order: number }[];
    vocabulary_examples: { sentence_de: string; sentence_en: string; sort_order: number }[];
  };
  const items = (rows as Row[]).map((r) => ({
    id: r.content_id,
    word: r.lemma,
    article: r.article,
    plural: r.has_plural === false ? "no plural" : r.plural,
    category: r.part_of_speech,
    translation: [...r.vocabulary_translations].sort((a, b) => a.sort_order - b.sort_order).map((t) => t.translation),
    level: r.cefr_level,
    topic: r.topics?.slug ?? null,
    ipa: r.ipa,
    pronunciation_guide: r.pronunciation_guide,
    examples: [...r.vocabulary_examples].sort((a, b) => a.sort_order - b.sort_order).map((e) => ({ de: e.sentence_de, en: e.sentence_en })),
    difficulty: r.difficulty,
    frequency_rank: r.frequency_rank,
    related_vocabulary: r.related_terms,
    verb_forms: r.verb_forms,
    auxiliary: r.auxiliary,
    notes: r.notes,
    source: r.source,
    is_verified: r.is_verified,
    is_published: r.is_published,
  }));

  const stamp = new Date().toISOString().slice(0, 10);
  if (format === "json") {
    const body = JSON.stringify(
      {
        metadata: { module: "vocabulary", course_level: "mixed", topic: "mixed", language: "de-DE / en", content_version: stamp, total_items: items.length, quality_check_status: "exported" },
        items,
      },
      null,
      2,
    );
    return new Response(body, {
      headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="vocabulary-${stamp}.json"` },
    });
  }
  const csv = Papa.unparse(
    items.map((i) => {
      const vf = (i.verb_forms ?? {}) as { present?: Record<string, string>; partizip_ii?: string };
      return {
        id: i.id ?? "",
        word: i.word,
        article: i.article ?? "",
        plural: i.plural ?? "",
        category: i.category,
        translation: i.translation.join("; "),
        level: i.level,
        topic: i.topic ?? "",
        ipa: i.ipa ?? "",
        pronunciation_guide: i.pronunciation_guide ?? "",
        example_de: i.examples[0]?.de ?? "",
        example_en: i.examples[0]?.en ?? "",
        difficulty: i.difficulty,
        related: i.related_vocabulary.join("; "),
        partizip_ii: vf.partizip_ii ?? "",
        auxiliary: i.auxiliary ?? "",
        present: vf.present ? ["ich", "du", "er_sie_es", "wir", "ihr", "sie_Sie"].map((k) => vf.present![k]).join("; ") : "",
        notes: i.notes ?? "",
        source: i.source ?? "",
        verified: i.is_verified ? "yes" : "no",
        published: i.is_published ? "yes" : "no",
      };
    }),
  );
  return new Response("﻿" + csv, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="vocabulary-${stamp}.csv"` },
  });
}
