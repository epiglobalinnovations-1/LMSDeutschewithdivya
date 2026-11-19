-- =============================================================================
-- Phase 2: learning engine
--
--  * FSRS learning-step counter on student progress
--  * record_study_activity(): derives today's XP / new words / reviews /
--    minutes from review_history, then awards achievements. SECURITY DEFINER
--    because students cannot write daily_activity or achievements directly;
--    values are derived, never taken from the client.
--  * vocabulary_category_counts(): new / learning / due / difficult / mastered
--  * import_vocabulary(): transactional bulk upsert used by the admin importer
--    and the content pipeline (runs with the caller's rights, so RLS applies)
--  * Storage buckets for audio, images, imports and avatars
-- =============================================================================

alter table public.student_vocabulary_progress
  add column learning_steps integer not null default 0 check (learning_steps >= 0);

-- Category thresholds, kept in one place (mirrors src/lib/srs/fsrs.ts).
create or replace function private.srs_mastered_stability() returns double precision
  language sql immutable as $$ select 21::double precision $$;
create or replace function private.srs_difficult_difficulty() returns double precision
  language sql immutable as $$ select 7::double precision $$;
create or replace function private.srs_difficult_lapses() returns integer
  language sql immutable as $$ select 3 $$;
grant execute on function private.srs_mastered_stability() to anon, authenticated, service_role;
grant execute on function private.srs_difficult_difficulty() to anon, authenticated, service_role;
grant execute on function private.srs_difficult_lapses() to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Current streak for a user, in their timezone
-- -----------------------------------------------------------------------------
create or replace function private.current_streak(p_user uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  tz text;
  d date;
  streak integer := 0;
begin
  select coalesce(timezone, 'Asia/Kolkata') into tz from public.profiles where id = p_user;
  d := (now() at time zone coalesce(tz, 'Asia/Kolkata'))::date;
  if not exists (select 1 from public.daily_activity where user_id = p_user and activity_date = d and (xp > 0 or minutes_studied > 0)) then
    d := d - 1;
  end if;
  while exists (select 1 from public.daily_activity where user_id = p_user and activity_date = d and (xp > 0 or minutes_studied > 0)) loop
    streak := streak + 1;
    d := d - 1;
  end loop;
  return streak;
end;
$$;
revoke all on function private.current_streak(uuid) from public;
grant execute on function private.current_streak(uuid) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Recompute today's activity and award achievements for the caller
-- -----------------------------------------------------------------------------
create or replace function public.record_study_activity()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  tz text;
  today date;
  day_start timestamptz;
  v_reviews integer;
  v_new integer;
  v_minutes integer;
  v_xp integer;
  v_words integer;
  v_total_reviews integer;
  v_days integer;
  v_streak integer;
  awarded jsonb := '[]'::jsonb;
  a record;
  ok boolean;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  select coalesce(timezone, 'Asia/Kolkata') into tz from public.profiles where id = uid;
  tz := coalesce(tz, 'Asia/Kolkata');
  today := (now() at time zone tz)::date;
  day_start := (today::timestamp at time zone tz);

  select count(*),
         count(*) filter (where state_before = 'new'),
         coalesce(round(sum(least(coalesce(duration_ms, 0), 60000)) / 60000.0), 0)::int
    into v_reviews, v_new, v_minutes
    from public.review_history
   where user_id = uid and reviewed_at >= day_start;

  -- 1 XP per review, +2 for each word met for the first time, +1 bonus for
  -- every 10 reviews. Exercises add XP in Phase 3.
  v_xp := v_reviews + 2 * v_new + (v_reviews / 10);

  insert into public.daily_activity (user_id, activity_date, xp, minutes_studied, new_words, reviews)
  values (uid, today, v_xp, v_minutes, v_new, v_reviews)
  on conflict (user_id, activity_date) do update
    set xp = greatest(public.daily_activity.xp - public.daily_activity.reviews - 2 * public.daily_activity.new_words
                      - (public.daily_activity.reviews / 10), 0) + excluded.xp,
        minutes_studied = excluded.minutes_studied,
        new_words = excluded.new_words,
        reviews = excluded.reviews;

  -- Achievements
  select count(*) into v_words from public.student_vocabulary_progress where user_id = uid and state <> 'new';
  select count(*) into v_total_reviews from public.review_history where user_id = uid;
  select count(*) into v_days from public.daily_activity where user_id = uid and (xp > 0 or minutes_studied > 0);
  v_streak := private.current_streak(uid);

  for a in
    select ac.* from public.achievements ac
     where ac.is_active
       and not exists (select 1 from public.student_achievements sa where sa.user_id = uid and sa.achievement_id = ac.id)
  loop
    ok := case
      when a.criteria ? 'words_learned' then v_words >= (a.criteria ->> 'words_learned')::int
      when a.criteria ? 'reviews' then v_total_reviews >= (a.criteria ->> 'reviews')::int
      when a.criteria ? 'streak_days' then v_streak >= (a.criteria ->> 'streak_days')::int
      when a.criteria ? 'sessions' then v_days >= (a.criteria ->> 'sessions')::int
      else false
    end;
    if ok then
      insert into public.student_achievements (user_id, achievement_id) values (uid, a.id) on conflict do nothing;
      update public.daily_activity set xp = xp + a.xp_reward where user_id = uid and activity_date = today;
      awarded := awarded || jsonb_build_object('key', a.key, 'title', a.title, 'xp', a.xp_reward);
    end if;
  end loop;

  update public.profiles set last_active_at = now() where id = uid;

  return jsonb_build_object(
    'date', today,
    'reviews', v_reviews,
    'new_words', v_new,
    'minutes', v_minutes,
    'xp_today', (select xp from public.daily_activity where user_id = uid and activity_date = today),
    'streak', v_streak,
    'awarded', awarded
  );
end;
$$;
revoke all on function public.record_study_activity() from public, anon;
grant execute on function public.record_study_activity() to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Category counts for the caller (RLS limits rows to their own)
-- -----------------------------------------------------------------------------
create or replace function public.vocabulary_category_counts()
returns table (learning bigint, due bigint, difficult bigint, mastered bigint, bookmarked bigint, total_seen bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*) filter (where state in ('learning', 'relearning')),
    count(*) filter (where state <> 'new' and due_at <= now()),
    count(*) filter (where state <> 'new' and (difficulty >= private.srs_difficult_difficulty() or lapses >= private.srs_difficult_lapses())),
    count(*) filter (where state = 'review' and stability >= private.srs_mastered_stability()),
    count(*) filter (where is_bookmarked),
    count(*) filter (where state <> 'new')
  from public.student_vocabulary_progress
  where user_id = auth.uid();
$$;
grant execute on function public.vocabulary_category_counts() to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Bulk vocabulary import
--   items: array of normalised entries (see src/lib/import/vocabulary.ts)
--   mode:  'upsert' updates existing words, 'skip' leaves them untouched
--   deck:  optional {slug, title, cefr_level, topic} to collect the words into
-- -----------------------------------------------------------------------------
create or replace function public.import_vocabulary(items jsonb, mode text default 'upsert', deck jsonb default null)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  it jsonb;
  v_id uuid;
  v_topic smallint;
  v_existing uuid;
  v_deck uuid;
  inserted int := 0;
  updated int := 0;
  skipped int := 0;
  pos int := 0;
  tr jsonb;
  ex jsonb;
  i int;
begin
  if auth.uid() is not null and not private.is_staff() then
    raise exception 'only teachers and administrators can import vocabulary' using errcode = '42501';
  end if;
  if mode not in ('upsert', 'skip') then
    raise exception 'mode must be upsert or skip';
  end if;

  if deck is not null then
    insert into public.flashcard_decks (slug, title, description, cefr_level, topic_id, is_published, created_by)
    values (
      deck ->> 'slug',
      coalesce(deck ->> 'title', deck ->> 'slug'),
      deck ->> 'description',
      (deck ->> 'cefr_level')::public.cefr_level,
      (select id from public.topics where slug = deck ->> 'topic'),
      coalesce((deck ->> 'is_published')::boolean, true),
      auth.uid()
    )
    on conflict (slug) do update set title = excluded.title
    returning id into v_deck;
  end if;

  for it in select * from jsonb_array_elements(items) loop
    pos := pos + 1;
    v_topic := (select id from public.topics where slug = it ->> 'topic');
    v_existing := null;

    if it ->> 'content_id' is not null then
      select id into v_existing from public.vocabulary where content_id = it ->> 'content_id';
    end if;
    if v_existing is null then
      select id into v_existing from public.vocabulary
       where lower(lemma) = lower(it ->> 'lemma')
         and article is not distinct from (it ->> 'article')::public.german_article
         and part_of_speech = (it ->> 'part_of_speech')::public.part_of_speech;
    end if;

    if v_existing is not null and mode = 'skip' then
      skipped := skipped + 1;
      v_id := v_existing;
    elsif v_existing is not null then
      update public.vocabulary set
        content_id = coalesce(it ->> 'content_id', content_id),
        lemma = it ->> 'lemma',
        article = (it ->> 'article')::public.german_article,
        plural = it ->> 'plural',
        has_plural = (it ->> 'has_plural')::boolean,
        part_of_speech = (it ->> 'part_of_speech')::public.part_of_speech,
        cefr_level = (it ->> 'cefr_level')::public.cefr_level,
        topic_id = coalesce(v_topic, topic_id),
        ipa = it ->> 'ipa',
        pronunciation_guide = it ->> 'pronunciation_guide',
        difficulty = coalesce((it ->> 'difficulty')::smallint, difficulty),
        frequency_rank = coalesce((it ->> 'frequency_rank')::int, frequency_rank),
        notes = it ->> 'notes',
        source = coalesce(it ->> 'source', source),
        verb_forms = it -> 'verb_forms',
        auxiliary = (it ->> 'auxiliary')::public.verb_auxiliary,
        related_terms = coalesce(array(select jsonb_array_elements_text(it -> 'related_terms')), '{}'),
        is_verified = coalesce((it ->> 'is_verified')::boolean, is_verified),
        is_published = coalesce((it ->> 'is_published')::boolean, is_published)
      where id = v_existing;
      v_id := v_existing;
      updated := updated + 1;
    else
      insert into public.vocabulary (
        content_id, lemma, article, plural, has_plural, part_of_speech, cefr_level, topic_id,
        ipa, pronunciation_guide, difficulty, frequency_rank, notes, source, verb_forms, auxiliary,
        related_terms, is_verified, is_published, created_by
      ) values (
        it ->> 'content_id', it ->> 'lemma', (it ->> 'article')::public.german_article, it ->> 'plural',
        (it ->> 'has_plural')::boolean, (it ->> 'part_of_speech')::public.part_of_speech,
        (it ->> 'cefr_level')::public.cefr_level, v_topic, it ->> 'ipa', it ->> 'pronunciation_guide',
        coalesce((it ->> 'difficulty')::smallint, 3), (it ->> 'frequency_rank')::int, it ->> 'notes',
        it ->> 'source', it -> 'verb_forms', (it ->> 'auxiliary')::public.verb_auxiliary,
        coalesce(array(select jsonb_array_elements_text(it -> 'related_terms')), '{}'),
        coalesce((it ->> 'is_verified')::boolean, false), coalesce((it ->> 'is_published')::boolean, true),
        auth.uid()
      ) returning id into v_id;
      inserted := inserted + 1;
    end if;

    if v_existing is null or mode = 'upsert' then
      delete from public.vocabulary_translations where vocabulary_id = v_id and language = 'en';
      i := 0;
      for tr in select * from jsonb_array_elements(coalesce(it -> 'translations', '[]'::jsonb)) loop
        insert into public.vocabulary_translations (vocabulary_id, language, translation, is_primary, sort_order)
        values (v_id, 'en', tr #>> '{}', i = 0, i)
        on conflict do nothing;
        i := i + 1;
      end loop;

      delete from public.vocabulary_examples where vocabulary_id = v_id;
      i := 0;
      for ex in select * from jsonb_array_elements(coalesce(it -> 'examples', '[]'::jsonb)) loop
        insert into public.vocabulary_examples (vocabulary_id, sentence_de, sentence_en, sort_order)
        values (v_id, ex ->> 'de', ex ->> 'en', i);
        i := i + 1;
      end loop;
    end if;

    if v_deck is not null then
      insert into public.flashcards (deck_id, vocabulary_id, sort_order)
      values (v_deck, v_id, pos)
      on conflict (deck_id, vocabulary_id) do nothing;
    end if;
  end loop;

  return jsonb_build_object('inserted', inserted, 'updated', updated, 'skipped', skipped, 'deck_id', v_deck);
end;
$$;
revoke all on function public.import_vocabulary(jsonb, text, jsonb) from public, anon;
grant execute on function public.import_vocabulary(jsonb, text, jsonb) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Storage buckets (hosted Supabase only; the local verification stack has no
-- storage schema, so this block is skipped there)
-- -----------------------------------------------------------------------------
do $storage$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
      ('audio', 'audio', true, 10485760, array['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/webm']),
      ('images', 'images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
      ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
      ('imports', 'imports', false, 20971520, array['text/csv', 'application/json',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'])
    on conflict (id) do nothing;

    execute $p$create policy "staff upload audio/images" on storage.objects for insert to authenticated
      with check (bucket_id in ('audio', 'images', 'imports') and private.is_staff())$p$;
    execute $p$create policy "staff update audio/images" on storage.objects for update to authenticated
      using (bucket_id in ('audio', 'images', 'imports') and private.is_staff())$p$;
    execute $p$create policy "staff delete audio/images" on storage.objects for delete to authenticated
      using (bucket_id in ('audio', 'images', 'imports') and private.is_staff())$p$;
    execute $p$create policy "staff read imports" on storage.objects for select to authenticated
      using (bucket_id = 'imports' and private.is_staff())$p$;
    execute $p$create policy "own avatar write" on storage.objects for insert to authenticated
      with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
    execute $p$create policy "own avatar update" on storage.objects for update to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
    execute $p$create policy "own avatar delete" on storage.objects for delete to authenticated
      using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)$p$;
  end if;
end
$storage$;
