# Content format

Vocabulary reaches the platform in one of three ways, and all three go through the
same validator (`src/lib/import/vocabulary.ts`) and the same database function
(`public.import_vocabulary(items, mode, deck)`):

1. **Admin → Import and export**: upload CSV, Excel (.xlsx) or JSON. The file is
   checked first (errors, duplicates inside the file, words that already exist);
   nothing is written until you press Import.
2. **Admin → Vocabulary → New word**: one word at a time.
3. **Content files in the repository** (`content/`), converted to SQL with
   `node --experimental-strip-types scripts/content/to-sql.mts <file> --deck <slug> --title "<title>" --level A1`.
   The local stack applies everything in `supabase/content/` after the seed.

## JSON (content generator output)

```json
{
  "metadata": {
    "course_level": "A1",
    "module": "vocabulary",
    "topic": "food",
    "language": "de-DE / en",
    "content_version": "1.0.0",
    "total_items": 1,
    "quality_check_status": "pending_teacher_review"
  },
  "items": [
    {
      "id": "A1-VOC-FOOD-0001",
      "word": "Brot",
      "article": "das",
      "plural": "Brote",
      "category": "noun",
      "translation": ["bread"],
      "ipa": "bʁoːt",
      "pronunciation_guide": "BROHT",
      "example": { "de": "Ich kaufe ein Brot.", "en": "I am buying a loaf of bread." },
      "difficulty": 1,
      "topic": "food",
      "related_vocabulary": ["das Brötchen"]
    }
  ]
}
```

Verbs add:

```json
"verb_forms": {
  "infinitive": "gehen",
  "present":     { "ich": "gehe", "du": "gehst", "er_sie_es": "geht", "wir": "gehen", "ihr": "geht", "sie_Sie": "gehen" },
  "praeteritum": { "ich": "ging", "du": "gingst", "er_sie_es": "ging", "wir": "gingen", "ihr": "gingt", "sie_Sie": "gingen" },
  "partizip_ii": "gegangen"
},
"auxiliary": "sein"
```

`metadata.course_level` and `metadata.topic` fill in rows that leave them out.
A mismatch between `total_items` and the number of items is reported as a warning.

## CSV / Excel

One header row. Column names are case-insensitive and these aliases are accepted:

| Field | Accepted headers |
|---|---|
| German word (required) | `word`, `lemma`, `german`, `wort` (may include the article: “der Tisch”) |
| Article (nouns, required for nouns) | `article`, `artikel`, `gender` (`der/die/das` or `m/f/n`) |
| Plural | `plural` (“die” is stripped; write `no plural` or `-` when there is none) |
| Category | `category`, `part_of_speech`, `pos`, `wortart` (noun, verb, adjective, adverb, pronoun, preposition, conjunction, article, numeral, interjection, particle, phrase; German names work too). Left empty, a row with an article is a noun. |
| English (required) | `translation`, `english`, `meaning` (several separated by `;`) |
| Level | `level`, `cefr` (A1–C2) |
| Topic | `topic`, `thema` (a topic slug such as `food`, `daily-routines`) |
| Pronunciation | `ipa`, `pronunciation_guide` |
| Example | `example_de` + `example_en` |
| Other | `id` (stable content ID), `difficulty` (1–5 or easy/medium/hard), `frequency_rank`, `related` (`;`), `notes`, `source` |
| Verbs | `present` (six forms separated by `;`), `praeteritum`, `partizip_ii`, `auxiliary` (haben/sein) |

A template is at `/templates/vocabulary-template.csv`.

## Rules the validator enforces

- Nouns must have der, die or das; other categories must not.
- “No plural” and a plural value cannot both be set.
- Verb forms only on verbs; a conjugation needs all six persons.
- At least one English translation; level A1–C2.
- Duplicates inside one file (same word + article + category, or same `id`) are skipped and listed.
- At most 5,000 rows per file and 4 MB per upload.

## Existing words

A word is “the same” when its `id` matches, or its lemma (case-insensitive),
article and category match. Choose **update** to overwrite it with the file’s data
(translations and examples are replaced) or **skip** to leave it untouched.

## Verification

Imported words are drafts (`is_verified = false`) unless the importer ticks
“Mark as verified”. Students see a small “Draft entry, awaiting teacher review”
note on draft words. Teachers verify words in Admin → Vocabulary (one by one or
in bulk). The bundled A1 starter list (`content/a1/starter-vocabulary.json`,
135 words) is a draft written for the platform and is waiting for Divya’s review.
