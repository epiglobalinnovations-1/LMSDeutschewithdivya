-- =============================================================================
-- Content format support
--
-- Extends the foundation schema so every field of the "German content
-- generator" JSON format (docs/content-format.md) has a home: stable content
-- IDs for idempotent re-imports, IPA plus an English-speaker pronunciation
-- guide, verb forms, plural usage, related vocabulary, structured grammar
-- lessons, dialogue-based listening material and exam-preparation exercises.
-- =============================================================================

-- New enum values ------------------------------------------------------------
alter type public.question_type add value if not exists 'match_vocabulary';
alter type public.question_type add value if not exists 'listening_comprehension';
alter type public.question_type add value if not exists 'reading_comprehension';
alter type public.exercise_type add value if not exists 'exam_prep';
alter type public.exercise_type add value if not exists 'reading';

create type public.language_skill as enum (
  'reading', 'listening', 'writing', 'speaking', 'grammar', 'vocabulary'
);
create type public.verb_auxiliary as enum ('haben', 'sein');

-- Stable external IDs: the generator assigns e.g. "A1-VOC-FAMILY-0001" so the
-- same file can be imported twice without creating duplicates.
-- Vocabulary ------------------------------------------------------------------
alter table public.vocabulary
  add column content_id          text unique check (content_id ~ '^[A-Za-z0-9._-]{3,80}$'),
  add column pronunciation_guide text check (char_length(pronunciation_guide) <= 200),
  -- false = "no plural in normal use" (e.g. die Milch); plural must then be null
  add column has_plural          boolean,
  -- {"infinitive","present":{"ich","du","er_sie_es","wir","ihr","sie_Sie"},
  --  "praeteritum":{...same keys...}, "partizip_ii"}
  add column verb_forms          jsonb,
  add column auxiliary           public.verb_auxiliary,
  add column related_terms       text[] not null default '{}',
  add constraint vocabulary_plural_usage_chk
    check (has_plural is distinct from false or plural is null),
  add constraint vocabulary_verb_fields_chk
    check ((verb_forms is null and auxiliary is null) or part_of_speech = 'verb'),
  add constraint vocabulary_verb_forms_shape_chk
    check (verb_forms is null or jsonb_typeof(verb_forms) = 'object'),
  -- Nouns must state gender; "the generator never omits gender".
  add constraint vocabulary_noun_article_chk
    check (part_of_speech <> 'noun' or article is not null or is_verified = false);

-- Optional explicit links between words (synonyms, antonyms, word family).
create table public.vocabulary_relations (
  vocabulary_id  uuid not null references public.vocabulary (id) on delete cascade,
  related_id     uuid not null references public.vocabulary (id) on delete cascade,
  relation       text not null default 'related'
                   check (relation in ('related', 'synonym', 'antonym', 'word_family', 'compound')),
  primary key (vocabulary_id, related_id, relation),
  check (vocabulary_id <> related_id)
);
create index vocabulary_relations_related_idx on public.vocabulary_relations (related_id);

alter table public.vocabulary_relations enable row level security;
create policy "relations readable" on public.vocabulary_relations for select using (true);
create policy "staff manage relations" on public.vocabulary_relations for all
  using (public.is_staff()) with check (public.is_staff());

-- Grammar lessons ---------------------------------------------------------------
alter table public.grammar_topics
  add column content_id       text unique check (content_id ~ '^[A-Za-z0-9._-]{3,80}$'),
  add column objectives       text[] not null default '{}',
  add column rules            jsonb not null default '[]'::jsonb,  -- [{rule, detail}]
  add column common_mistakes  jsonb not null default '[]'::jsonb,  -- [{wrong, right, why}]
  add column memory_tricks    text[] not null default '{}',
  add column practical_usage  text;

-- Exercises and questions --------------------------------------------------------
alter table public.exercises
  add column content_id         text unique check (content_id ~ '^[A-Za-z0-9._-]{3,80}$'),
  add column skill              public.language_skill,
  add column topic_id           smallint references public.topics (id) on delete set null,
  add column difficulty         smallint check (difficulty between 1 and 5),
  add column learning_objective text;
create index exercises_skill_idx on public.exercises (skill, cefr_level) where skill is not null;

alter table public.exercise_questions
  add column content_id         text unique check (content_id ~ '^[A-Za-z0-9._-]{3,80}$'),
  add column cefr_level         public.cefr_level,
  add column difficulty         smallint check (difficulty between 1 and 5),
  add column topic_id           smallint references public.topics (id) on delete set null,
  add column learning_objective text;

-- Reading passages (stories) -------------------------------------------------------
alter table public.stories
  add column content_id  text unique check (content_id ~ '^[A-Za-z0-9._-]{3,80}$'),
  add column topic_id    smallint references public.topics (id) on delete set null;

-- Listening dialogues -----------------------------------------------------------------
alter type public.listening_kind add value if not exists 'dialogue';
alter table public.listening_materials
  add column content_id        text unique check (content_id ~ '^[A-Za-z0-9._-]{3,80}$'),
  add column scenario          text,
  add column speakers          jsonb not null default '[]'::jsonb,   -- [{name, role, voice}]
  add column narration_text    text,                                 -- script for TTS
  add column vocabulary_notes  jsonb not null default '[]'::jsonb,   -- [{term, meaning, note}]
  add column topic_id          smallint references public.topics (id) on delete set null;

-- Import batches carry the generator's metadata object -----------------------------
alter table public.content_imports
  drop constraint content_imports_kind_check,
  add constraint content_imports_kind_check check (kind in (
    'vocabulary', 'flashcards', 'grammar', 'exercises', 'reading', 'stories',
    'listening', 'sentence_construction', 'exam_prep', 'course')),
  -- {course_level, module, topic, language, content_version, total_items, quality_check_status}
  add column metadata jsonb not null default '{}'::jsonb;
