-- =============================================================================
-- Deutsche with Divya: foundation schema (Phase 1)
--
-- Creates every core table of the platform, its constraints and indexes,
-- helper functions for role checks, the new-user trigger and Row Level
-- Security. Later phases add behaviour (FSRS scheduling, AI, payments) on top
-- of these tables rather than reshaping them.
--
-- Conventions
--   * uuid primary keys (gen_random_uuid) for all entity tables
--   * created_at / updated_at on mutable tables, maintained by trigger
--   * "is_published" gates student visibility of authored content
--   * "required_plan" records which membership tier unlocks content; tier
--     enforcement is added in Phase 6 (see docs/05-roadmap.md)
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

-- -----------------------------------------------------------------------------
-- Enumerated types
-- -----------------------------------------------------------------------------
create type public.cefr_level as enum ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
create type public.german_article as enum ('der', 'die', 'das');
create type public.part_of_speech as enum (
  'noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition',
  'conjunction', 'article', 'numeral', 'interjection', 'particle', 'phrase'
);
create type public.app_role as enum ('student', 'teacher', 'admin');
create type public.plan_tier as enum ('free', 'premium', 'premium_plus');
create type public.subscription_status as enum (
  'trialing', 'active', 'past_due', 'cancelled', 'expired'
);
create type public.payment_provider as enum ('manual', 'razorpay', 'stripe');
create type public.srs_state as enum ('new', 'learning', 'review', 'relearning');
create type public.review_rating as enum ('again', 'hard', 'good', 'easy');
create type public.study_direction as enum ('de_en', 'en_de');
create type public.exercise_type as enum (
  'grammar_practice', 'grammar_quiz', 'sentence_builder', 'listening',
  'story_comprehension', 'vocabulary_quiz', 'lesson_quiz', 'assignment'
);
create type public.question_type as enum (
  'multiple_choice', 'fill_blank', 'reorder_words', 'translate_en_de',
  'translate_de_en', 'article_select', 'verb_conjugation',
  'sentence_completion', 'free_text', 'true_false'
);
create type public.listening_kind as enum ('sentences', 'audio_file', 'youtube');
create type public.announcement_audience as enum (
  'everyone', 'students', 'free', 'premium', 'premium_plus', 'staff'
);
create type public.ai_scenario as enum (
  'beginner', 'everyday', 'travel', 'workplace', 'interview', 'advanced',
  'writing_correction'
);
create type public.ai_message_role as enum ('user', 'assistant', 'system');
create type public.import_status as enum ('pending', 'validated', 'imported', 'failed');

-- -----------------------------------------------------------------------------
-- Generic helpers
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- =============================================================================
-- IDENTITY, ROLES AND MEMBERSHIP
-- =============================================================================

create table public.roles (
  id          smallint primary key,
  key         public.app_role not null unique,
  name        text not null,
  description text
);

insert into public.roles (id, key, name, description) values
  (1, 'student', 'Student', 'Learner with access to their own learning data'),
  (2, 'teacher', 'Teacher', 'Creates content and views student progress'),
  (3, 'admin',   'Administrator', 'Full control of the platform');

create table public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  email                 extensions.citext,
  full_name             text check (char_length(full_name) <= 120),
  display_name          text check (char_length(display_name) <= 60),
  avatar_url            text,
  current_level         public.cefr_level not null default 'A1',
  daily_new_words       smallint not null default 10
                          check (daily_new_words in (5, 10, 15, 20, 30)),
  study_direction       public.study_direction not null default 'de_en',
  timezone              text not null default 'Asia/Kolkata',
  country               text,
  marketing_opt_in      boolean not null default false,
  onboarded_at          timestamptz,
  last_active_at        timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index profiles_email_idx on public.profiles (email);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.user_roles (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role_id    smallint not null references public.roles (id),
  granted_by uuid references public.profiles (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role_id)
);
create index user_roles_role_idx on public.user_roles (role_id);

-- Role helpers. SECURITY DEFINER so RLS policies can call them without
-- recursing into user_roles' own policies.
create or replace function public.has_role(check_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and r.key = check_role
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('teacher') or public.has_role('admin');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('admin');
$$;

create table public.membership_plans (
  id               uuid primary key default gen_random_uuid(),
  tier             public.plan_tier not null unique,
  name             text not null,
  description      text,
  price_inr_month  integer check (price_inr_month >= 0),   -- paise
  price_usd_month  integer check (price_usd_month >= 0),   -- cents
  price_inr_year   integer check (price_inr_year >= 0),
  price_usd_year   integer check (price_usd_year >= 0),
  features         jsonb not null default '[]'::jsonb,
  limits           jsonb not null default '{}'::jsonb,
  is_active        boolean not null default true,
  sort_order       smallint not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger membership_plans_updated_at before update on public.membership_plans
  for each row execute function public.set_updated_at();

create table public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles (id) on delete cascade,
  plan_id              uuid not null references public.membership_plans (id),
  status               public.subscription_status not null default 'active',
  provider             public.payment_provider not null default 'manual',
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz not null default now(),
  current_period_end   timestamptz,
  cancel_at_period_end boolean not null default false,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  check (current_period_end is null or current_period_end > current_period_start)
);
create index subscriptions_user_idx on public.subscriptions (user_id, status);
create unique index subscriptions_provider_ref_uidx
  on public.subscriptions (provider, provider_subscription_id)
  where provider_subscription_id is not null;
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Effective tier of the current user (free when no active subscription).
create or replace function public.current_plan_tier()
returns public.plan_tier
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select mp.tier
       from public.subscriptions s
       join public.membership_plans mp on mp.id = s.plan_id
      where s.user_id = auth.uid()
        and s.status in ('trialing', 'active')
        and (s.current_period_end is null or s.current_period_end > now())
      order by case mp.tier when 'premium_plus' then 3 when 'premium' then 2 else 1 end desc
      limit 1),
    'free'::public.plan_tier
  );
$$;

-- New auth user -> profile + student role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, display_name)
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ' ', 1), '')
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role_id)
  values (new.id, 1)
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in sync when a user changes their address.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- =============================================================================
-- COURSES
-- =============================================================================

create table public.courses (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title          text not null,
  subtitle       text,
  description    text,
  cefr_level     public.cefr_level not null,
  cover_image    text,
  required_plan  public.plan_tier not null default 'free',
  is_published   boolean not null default false,
  sort_order     integer not null default 0,
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index courses_published_idx on public.courses (is_published, cefr_level, sort_order);
create trigger courses_updated_at before update on public.courses
  for each row execute function public.set_updated_at();

create table public.course_modules (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses (id) on delete cascade,
  title        text not null,
  description  text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index course_modules_course_idx on public.course_modules (course_id, sort_order);
create trigger course_modules_updated_at before update on public.course_modules
  for each row execute function public.set_updated_at();

create table public.lessons (
  id               uuid primary key default gen_random_uuid(),
  module_id        uuid not null references public.course_modules (id) on delete cascade,
  slug             text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title            text not null,
  summary          text,
  content          jsonb not null default '[]'::jsonb,   -- ordered content blocks
  estimated_minutes smallint check (estimated_minutes between 1 and 240),
  is_free_preview  boolean not null default false,
  is_published     boolean not null default false,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (module_id, slug)
);
create index lessons_module_idx on public.lessons (module_id, sort_order);
create trigger lessons_updated_at before update on public.lessons
  for each row execute function public.set_updated_at();

create table public.enrollments (
  user_id       uuid not null references public.profiles (id) on delete cascade,
  course_id     uuid not null references public.courses (id) on delete cascade,
  enrolled_at   timestamptz not null default now(),
  completed_at  timestamptz,
  last_lesson_id uuid references public.lessons (id) on delete set null,
  primary key (user_id, course_id)
);
create index enrollments_course_idx on public.enrollments (course_id);

create table public.lesson_progress (
  user_id       uuid not null references public.profiles (id) on delete cascade,
  lesson_id     uuid not null references public.lessons (id) on delete cascade,
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  primary key (user_id, lesson_id)
);
create index lesson_progress_lesson_idx on public.lesson_progress (lesson_id);

-- =============================================================================
-- VOCABULARY AND FLASHCARDS
-- =============================================================================

create table public.topics (
  id          smallserial primary key,
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null,
  description text,
  sort_order  smallint not null default 0
);

create table public.vocabulary (
  id              uuid primary key default gen_random_uuid(),
  lemma           text not null check (char_length(lemma) between 1 and 120),
  article         public.german_article,
  plural          text,
  part_of_speech  public.part_of_speech not null,
  cefr_level      public.cefr_level not null,
  topic_id        smallint references public.topics (id) on delete set null,
  ipa             text,
  audio_path      text,                 -- Supabase Storage path (bucket: audio)
  image_path      text,                 -- Supabase Storage path (bucket: images)
  difficulty      smallint not null default 3 check (difficulty between 1 and 5),
  frequency_rank  integer check (frequency_rank > 0),
  notes           text,
  source          text,                 -- provenance, e.g. "Divya A1 core list"
  is_verified     boolean not null default false,
  is_published    boolean not null default true,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Articles only make sense for nouns.
  check (article is null or part_of_speech = 'noun')
);
-- Duplicate detection for imports: one row per lemma/article/part of speech.
create unique index vocabulary_identity_uidx
  on public.vocabulary (lower(lemma), article, part_of_speech) nulls not distinct;
create index vocabulary_level_topic_idx on public.vocabulary (cefr_level, topic_id);
create index vocabulary_frequency_idx on public.vocabulary (frequency_rank);
create trigger vocabulary_updated_at before update on public.vocabulary
  for each row execute function public.set_updated_at();

create table public.vocabulary_translations (
  id             uuid primary key default gen_random_uuid(),
  vocabulary_id  uuid not null references public.vocabulary (id) on delete cascade,
  language       text not null default 'en' check (language ~ '^[a-z]{2}$'),
  translation    text not null,
  is_primary     boolean not null default false,
  sort_order     smallint not null default 0,
  unique (vocabulary_id, language, translation)
);
create unique index vocabulary_translations_primary_uidx
  on public.vocabulary_translations (vocabulary_id, language) where is_primary;

create table public.vocabulary_examples (
  id             uuid primary key default gen_random_uuid(),
  vocabulary_id  uuid not null references public.vocabulary (id) on delete cascade,
  sentence_de    text not null,
  sentence_en    text not null,
  audio_path     text,
  sort_order     smallint not null default 0
);
create index vocabulary_examples_vocab_idx on public.vocabulary_examples (vocabulary_id, sort_order);

create table public.flashcard_decks (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title          text not null,
  description    text,
  cefr_level     public.cefr_level,
  topic_id       smallint references public.topics (id) on delete set null,
  course_id      uuid references public.courses (id) on delete set null,
  required_plan  public.plan_tier not null default 'free',
  is_published   boolean not null default false,
  sort_order     integer not null default 0,
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index flashcard_decks_published_idx on public.flashcard_decks (is_published, cefr_level);
create trigger flashcard_decks_updated_at before update on public.flashcard_decks
  for each row execute function public.set_updated_at();

create table public.flashcards (
  id             uuid primary key default gen_random_uuid(),
  deck_id        uuid not null references public.flashcard_decks (id) on delete cascade,
  vocabulary_id  uuid not null references public.vocabulary (id) on delete cascade,
  sort_order     integer not null default 0,
  unique (deck_id, vocabulary_id)
);
create index flashcards_vocab_idx on public.flashcards (vocabulary_id);

-- One row per student per word: the student's memory model of that word.
-- FSRS fields (stability, difficulty, due_at, state, reps, lapses) are written
-- by the scheduler in Phase 2.
create table public.student_vocabulary_progress (
  user_id            uuid not null references public.profiles (id) on delete cascade,
  vocabulary_id      uuid not null references public.vocabulary (id) on delete cascade,
  state              public.srs_state not null default 'new',
  stability          double precision not null default 0 check (stability >= 0),
  difficulty         double precision not null default 0 check (difficulty between 0 and 10),
  due_at             timestamptz not null default now(),
  first_seen_at      timestamptz not null default now(),
  last_reviewed_at   timestamptz,
  scheduled_days     integer not null default 0,
  reps               integer not null default 0 check (reps >= 0),
  lapses             integer not null default 0 check (lapses >= 0),
  correct_count      integer not null default 0 check (correct_count >= 0),
  incorrect_count    integer not null default 0 check (incorrect_count >= 0),
  is_bookmarked      boolean not null default false,
  is_known           boolean not null default false,  -- "I already know this"
  source             text,                            -- deck, story, listening...
  updated_at         timestamptz not null default now(),
  primary key (user_id, vocabulary_id)
);
create index svp_due_idx on public.student_vocabulary_progress (user_id, due_at)
  where state <> 'new';
create index svp_state_idx on public.student_vocabulary_progress (user_id, state);
create index svp_bookmark_idx on public.student_vocabulary_progress (user_id)
  where is_bookmarked;
create index svp_vocab_idx on public.student_vocabulary_progress (vocabulary_id);
create trigger svp_updated_at before update on public.student_vocabulary_progress
  for each row execute function public.set_updated_at();

-- Immutable log of every review (needed to re-fit FSRS parameters later).
create table public.review_history (
  id               bigserial primary key,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  vocabulary_id    uuid not null references public.vocabulary (id) on delete cascade,
  rating           public.review_rating not null,
  direction        public.study_direction not null,
  state_before     public.srs_state not null,
  stability_after  double precision not null,
  difficulty_after double precision not null,
  elapsed_days     double precision not null default 0,
  scheduled_days   integer not null default 0,
  duration_ms      integer check (duration_ms between 0 and 3600000),
  reviewed_at      timestamptz not null default now()
);
create index review_history_user_time_idx on public.review_history (user_id, reviewed_at desc);
create index review_history_vocab_idx on public.review_history (user_id, vocabulary_id, reviewed_at);

-- =============================================================================
-- GRAMMAR, STORIES, LISTENING, EXERCISES
-- =============================================================================

create table public.grammar_topics (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title          text not null,
  cefr_level     public.cefr_level not null,
  summary        text,
  explanation    text,                            -- Markdown, simple English
  examples       jsonb not null default '[]'::jsonb,  -- [{de, en, note}]
  required_plan  public.plan_tier not null default 'free',
  is_published   boolean not null default false,
  sort_order     integer not null default 0,
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index grammar_topics_level_idx on public.grammar_topics (is_published, cefr_level, sort_order);
create trigger grammar_topics_updated_at before update on public.grammar_topics
  for each row execute function public.set_updated_at();

create table public.stories (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title_de              text not null,
  title_en              text,
  cefr_level            public.cefr_level not null,
  body_de               text not null,
  body_en               text,
  audio_path            text,
  vocabulary_highlights jsonb not null default '[]'::jsonb, -- [{word, vocabulary_id?, meaning}]
  grammar_notes         text,
  required_plan         public.plan_tier not null default 'premium',
  is_published          boolean not null default false,
  created_by            uuid references public.profiles (id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index stories_level_idx on public.stories (is_published, cefr_level);
create trigger stories_updated_at before update on public.stories
  for each row execute function public.set_updated_at();

create table public.listening_materials (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null,
  cefr_level      public.cefr_level not null,
  kind            public.listening_kind not null,
  youtube_video_id text check (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
  start_seconds   integer check (start_seconds >= 0),
  end_seconds     integer check (end_seconds >= 0),
  audio_path      text,
  transcript_de   text,
  transcript_en   text,
  segments        jsonb not null default '[]'::jsonb,  -- [{de, en, start, end}]
  license_note    text,
  required_plan   public.plan_tier not null default 'premium',
  is_published    boolean not null default false,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (kind <> 'youtube' or youtube_video_id is not null),
  check (end_seconds is null or start_seconds is null or end_seconds > start_seconds)
);
create index listening_level_idx on public.listening_materials (is_published, cefr_level);
create trigger listening_materials_updated_at before update on public.listening_materials
  for each row execute function public.set_updated_at();

create table public.exercises (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title                text not null,
  exercise_type        public.exercise_type not null,
  cefr_level           public.cefr_level not null,
  instructions         text,
  grammar_topic_id     uuid references public.grammar_topics (id) on delete cascade,
  lesson_id            uuid references public.lessons (id) on delete cascade,
  story_id             uuid references public.stories (id) on delete cascade,
  listening_material_id uuid references public.listening_materials (id) on delete cascade,
  due_at               timestamptz,            -- for assignments
  required_plan        public.plan_tier not null default 'free',
  is_published         boolean not null default false,
  sort_order           integer not null default 0,
  created_by           uuid references public.profiles (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index exercises_grammar_idx on public.exercises (grammar_topic_id) where grammar_topic_id is not null;
create index exercises_lesson_idx on public.exercises (lesson_id) where lesson_id is not null;
create index exercises_story_idx on public.exercises (story_id) where story_id is not null;
create index exercises_listening_idx on public.exercises (listening_material_id) where listening_material_id is not null;
create index exercises_type_level_idx on public.exercises (is_published, exercise_type, cefr_level);
create trigger exercises_updated_at before update on public.exercises
  for each row execute function public.set_updated_at();

create table public.exercise_questions (
  id                uuid primary key default gen_random_uuid(),
  exercise_id       uuid not null references public.exercises (id) on delete cascade,
  question_type     public.question_type not null,
  prompt            text not null,
  data              jsonb not null default '{}'::jsonb,     -- options, tokens, blanks...
  correct_answer    jsonb not null,
  accepted_answers  text[] not null default '{}',
  explanation       text,
  points            smallint not null default 1 check (points > 0),
  sort_order        integer not null default 0
);
create index exercise_questions_exercise_idx on public.exercise_questions (exercise_id, sort_order);

create table public.exercise_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  exercise_id   uuid not null references public.exercises (id) on delete cascade,
  question_id   uuid references public.exercise_questions (id) on delete cascade,
  answer        jsonb not null,
  is_correct    boolean,
  score         numeric(5, 2) check (score between 0 and 100),
  ai_feedback   jsonb,
  duration_ms   integer check (duration_ms between 0 and 3600000),
  created_at    timestamptz not null default now()
);
create index exercise_attempts_user_idx on public.exercise_attempts (user_id, created_at desc);
create index exercise_attempts_exercise_idx on public.exercise_attempts (exercise_id);

-- =============================================================================
-- MOTIVATION AND ACTIVITY
-- =============================================================================

create table public.achievements (
  id           uuid primary key default gen_random_uuid(),
  key          text not null unique check (key ~ '^[a-z0-9_]+$'),
  title        text not null,
  description  text not null,
  icon         text,
  xp_reward    integer not null default 0 check (xp_reward >= 0),
  criteria     jsonb not null default '{}'::jsonb,
  is_active    boolean not null default true,
  sort_order   integer not null default 0
);

create table public.student_achievements (
  user_id         uuid not null references public.profiles (id) on delete cascade,
  achievement_id  uuid not null references public.achievements (id) on delete cascade,
  earned_at       timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table public.daily_activity (
  user_id              uuid not null references public.profiles (id) on delete cascade,
  activity_date        date not null,
  xp                   integer not null default 0 check (xp >= 0),
  minutes_studied      integer not null default 0 check (minutes_studied >= 0),
  new_words            integer not null default 0 check (new_words >= 0),
  reviews              integer not null default 0 check (reviews >= 0),
  exercises_completed  integer not null default 0 check (exercises_completed >= 0),
  updated_at           timestamptz not null default now(),
  primary key (user_id, activity_date)
);
create index daily_activity_date_idx on public.daily_activity (activity_date);
create trigger daily_activity_updated_at before update on public.daily_activity
  for each row execute function public.set_updated_at();

create table public.announcements (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text not null,
  audience      public.announcement_audience not null default 'students',
  published_at  timestamptz,
  expires_at    timestamptz,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (expires_at is null or published_at is null or expires_at > published_at)
);
create index announcements_published_idx on public.announcements (published_at desc);
create trigger announcements_updated_at before update on public.announcements
  for each row execute function public.set_updated_at();

-- =============================================================================
-- AI TUTOR
-- =============================================================================

create table public.ai_conversations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  scenario     public.ai_scenario not null,
  cefr_level   public.cefr_level not null,
  title        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index ai_conversations_user_idx on public.ai_conversations (user_id, updated_at desc);
create trigger ai_conversations_updated_at before update on public.ai_conversations
  for each row execute function public.set_updated_at();

create table public.ai_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.ai_conversations (id) on delete cascade,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  role             public.ai_message_role not null,
  content          text not null check (char_length(content) <= 8000),
  corrections      jsonb,          -- [{original, corrected, explanation, rule}]
  input_tokens     integer,
  output_tokens    integer,
  created_at       timestamptz not null default now()
);
create index ai_messages_conversation_idx on public.ai_messages (conversation_id, created_at);
create index ai_messages_user_idx on public.ai_messages (user_id, created_at desc);

-- =============================================================================
-- OPERATIONS
-- =============================================================================

create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  email       extensions.citext not null check (char_length(email) <= 254),
  topic       text check (char_length(topic) <= 60),
  message     text not null check (char_length(message) between 10 and 5000),
  user_id     uuid references public.profiles (id) on delete set null,
  handled_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index contact_messages_created_idx on public.contact_messages (created_at desc);

create table public.content_imports (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('vocabulary', 'flashcards', 'exercises', 'stories')),
  file_name    text not null,
  status       public.import_status not null default 'pending',
  total_rows   integer not null default 0,
  inserted     integer not null default 0,
  updated      integer not null default 0,
  skipped      integer not null default 0,
  errors       jsonb not null default '[]'::jsonb,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create table public.app_settings (
  key         text primary key check (key ~ '^[a-z0-9_.]+$'),
  value       jsonb not null,
  is_public   boolean not null default false,
  updated_by  uuid references public.profiles (id) on delete set null,
  updated_at  timestamptz not null default now()
);
create trigger app_settings_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
-- Pattern
--   * Authored content: anyone may read published rows; staff read and write all.
--   * Private learning data: a student reads and writes only rows where
--     user_id = auth.uid(); staff may read for progress tracking.
--   * Identity and billing: students read their own; admins manage.
-- (select auth.uid()) is wrapped in a sub-select so Postgres evaluates it once
-- per statement instead of once per row.

alter table public.roles                        enable row level security;
alter table public.profiles                     enable row level security;
alter table public.user_roles                   enable row level security;
alter table public.membership_plans             enable row level security;
alter table public.subscriptions                enable row level security;
alter table public.courses                      enable row level security;
alter table public.course_modules               enable row level security;
alter table public.lessons                      enable row level security;
alter table public.enrollments                  enable row level security;
alter table public.lesson_progress              enable row level security;
alter table public.topics                       enable row level security;
alter table public.vocabulary                   enable row level security;
alter table public.vocabulary_translations      enable row level security;
alter table public.vocabulary_examples          enable row level security;
alter table public.flashcard_decks              enable row level security;
alter table public.flashcards                   enable row level security;
alter table public.student_vocabulary_progress  enable row level security;
alter table public.review_history               enable row level security;
alter table public.grammar_topics               enable row level security;
alter table public.stories                      enable row level security;
alter table public.listening_materials          enable row level security;
alter table public.exercises                    enable row level security;
alter table public.exercise_questions           enable row level security;
alter table public.exercise_attempts            enable row level security;
alter table public.achievements                 enable row level security;
alter table public.student_achievements         enable row level security;
alter table public.daily_activity               enable row level security;
alter table public.announcements                enable row level security;
alter table public.ai_conversations             enable row level security;
alter table public.ai_messages                  enable row level security;
alter table public.contact_messages             enable row level security;
alter table public.content_imports              enable row level security;
alter table public.app_settings                 enable row level security;

-- Reference data -------------------------------------------------------------
create policy "roles readable" on public.roles for select using (true);
create policy "topics readable" on public.topics for select using (true);
create policy "topics staff write" on public.topics for all
  using (public.is_staff()) with check (public.is_staff());
create policy "plans readable" on public.membership_plans for select
  using (is_active or public.is_admin());
create policy "plans admin write" on public.membership_plans for all
  using (public.is_admin()) with check (public.is_admin());
create policy "achievements readable" on public.achievements for select
  using (is_active or public.is_staff());
create policy "achievements staff write" on public.achievements for all
  using (public.is_staff()) with check (public.is_staff());
create policy "public settings readable" on public.app_settings for select
  using (is_public or public.is_admin());
create policy "settings admin write" on public.app_settings for all
  using (public.is_admin()) with check (public.is_admin());

-- Profiles -------------------------------------------------------------------
create policy "own profile readable" on public.profiles for select
  using (id = (select auth.uid()) or public.is_staff());
create policy "own profile updatable" on public.profiles for update
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "admin manages profiles" on public.profiles for update
  using (public.is_admin()) with check (public.is_admin());

-- Roles: users see their own; only admins grant/revoke.
create policy "own roles readable" on public.user_roles for select
  using (user_id = (select auth.uid()) or public.is_staff());
create policy "admin grants roles" on public.user_roles for insert
  with check (public.is_admin());
create policy "admin revokes roles" on public.user_roles for delete
  using (public.is_admin());

-- Subscriptions: written only by admins or the service role (payment webhooks).
create policy "own subscriptions readable" on public.subscriptions for select
  using (user_id = (select auth.uid()) or public.is_admin());
create policy "admin manages subscriptions" on public.subscriptions for all
  using (public.is_admin()) with check (public.is_admin());

-- Authored content (published rows public, staff manage) ----------------------
create policy "published courses readable" on public.courses for select
  using (is_published or public.is_staff());
create policy "staff manage courses" on public.courses for all
  using (public.is_staff()) with check (public.is_staff());

create policy "modules of published courses readable" on public.course_modules for select
  using (public.is_staff() or exists (
    select 1 from public.courses c where c.id = course_id and c.is_published));
create policy "staff manage modules" on public.course_modules for all
  using (public.is_staff()) with check (public.is_staff());

create policy "published lessons readable" on public.lessons for select
  using (public.is_staff() or (is_published and exists (
    select 1 from public.course_modules m join public.courses c on c.id = m.course_id
    where m.id = module_id and c.is_published)));
create policy "staff manage lessons" on public.lessons for all
  using (public.is_staff()) with check (public.is_staff());

create policy "published vocabulary readable" on public.vocabulary for select
  using (is_published or public.is_staff());
create policy "staff manage vocabulary" on public.vocabulary for all
  using (public.is_staff()) with check (public.is_staff());

create policy "translations readable" on public.vocabulary_translations for select
  using (public.is_staff() or exists (
    select 1 from public.vocabulary v where v.id = vocabulary_id and v.is_published));
create policy "staff manage translations" on public.vocabulary_translations for all
  using (public.is_staff()) with check (public.is_staff());

create policy "examples readable" on public.vocabulary_examples for select
  using (public.is_staff() or exists (
    select 1 from public.vocabulary v where v.id = vocabulary_id and v.is_published));
create policy "staff manage examples" on public.vocabulary_examples for all
  using (public.is_staff()) with check (public.is_staff());

create policy "published decks readable" on public.flashcard_decks for select
  using (is_published or public.is_staff());
create policy "staff manage decks" on public.flashcard_decks for all
  using (public.is_staff()) with check (public.is_staff());

create policy "cards of published decks readable" on public.flashcards for select
  using (public.is_staff() or exists (
    select 1 from public.flashcard_decks d where d.id = deck_id and d.is_published));
create policy "staff manage cards" on public.flashcards for all
  using (public.is_staff()) with check (public.is_staff());

create policy "published grammar readable" on public.grammar_topics for select
  using (is_published or public.is_staff());
create policy "staff manage grammar" on public.grammar_topics for all
  using (public.is_staff()) with check (public.is_staff());

create policy "published stories readable" on public.stories for select
  using (is_published or public.is_staff());
create policy "staff manage stories" on public.stories for all
  using (public.is_staff()) with check (public.is_staff());

create policy "published listening readable" on public.listening_materials for select
  using (is_published or public.is_staff());
create policy "staff manage listening" on public.listening_materials for all
  using (public.is_staff()) with check (public.is_staff());

create policy "published exercises readable" on public.exercises for select
  using (is_published or public.is_staff());
create policy "staff manage exercises" on public.exercises for all
  using (public.is_staff()) with check (public.is_staff());

-- Question rows include correct answers. Students only reach them through the
-- server (service role) grading endpoint, so only staff may select directly.
create policy "staff read questions" on public.exercise_questions for select
  using (public.is_staff());
create policy "staff manage questions" on public.exercise_questions for all
  using (public.is_staff()) with check (public.is_staff());

create policy "published announcements readable" on public.announcements for select
  using (public.is_staff() or (
    (select auth.uid()) is not null
    and published_at is not null and published_at <= now()
    and (expires_at is null or expires_at > now())));
create policy "staff manage announcements" on public.announcements for all
  using (public.is_staff()) with check (public.is_staff());

-- Private learning data ------------------------------------------------------
create policy "own enrollments" on public.enrollments for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "staff read enrollments" on public.enrollments for select
  using (public.is_staff());

create policy "own lesson progress" on public.lesson_progress for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "staff read lesson progress" on public.lesson_progress for select
  using (public.is_staff());

create policy "own vocabulary progress" on public.student_vocabulary_progress for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "staff read vocabulary progress" on public.student_vocabulary_progress for select
  using (public.is_staff());

-- Review history is append-only for students.
create policy "own review history readable" on public.review_history for select
  using (user_id = (select auth.uid()) or public.is_staff());
create policy "own review history insert" on public.review_history for insert
  with check (user_id = (select auth.uid()));

-- Attempts are append-only for students.
create policy "own attempts readable" on public.exercise_attempts for select
  using (user_id = (select auth.uid()) or public.is_staff());
create policy "own attempts insert" on public.exercise_attempts for insert
  with check (user_id = (select auth.uid()));

-- Achievements and daily activity are awarded server-side; students read only.
create policy "own achievements readable" on public.student_achievements for select
  using (user_id = (select auth.uid()) or public.is_staff());
create policy "own activity readable" on public.daily_activity for select
  using (user_id = (select auth.uid()) or public.is_staff());

create policy "own conversations" on public.ai_conversations for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own ai messages readable" on public.ai_messages for select
  using (user_id = (select auth.uid()));

-- Contact form: anyone may submit; only staff read.
create policy "anyone submits contact" on public.contact_messages for insert
  with check (user_id is null or user_id = (select auth.uid()));
create policy "staff read contact" on public.contact_messages for select
  using (public.is_staff());
create policy "staff update contact" on public.contact_messages for update
  using (public.is_staff()) with check (public.is_staff());

create policy "staff manage imports" on public.content_imports for all
  using (public.is_staff()) with check (public.is_staff());

-- Lock helper functions to the roles that need them.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.handle_user_email_change() from public, anon, authenticated;
