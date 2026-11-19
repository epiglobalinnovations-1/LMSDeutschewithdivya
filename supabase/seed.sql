-- =============================================================================
-- Reference data for Deutsche with Divya.
-- Safe to re-run: every insert is idempotent.
-- Contains no fabricated learner data. Paid-plan prices are intentionally NULL
-- until Divya sets them in the admin panel (Phase 6).
-- =============================================================================

-- Vocabulary topics (spec section 7) ----------------------------------------
insert into public.topics (slug, name, sort_order) values
  ('greetings', 'Greetings', 1),
  ('family', 'Family', 2),
  ('food', 'Food', 3),
  ('shopping', 'Shopping', 4),
  ('travel', 'Travel', 5),
  ('transportation', 'Transportation', 6),
  ('education', 'Education', 7),
  ('work', 'Work', 8),
  ('business', 'Business', 9),
  ('healthcare', 'Healthcare', 10),
  ('daily-routines', 'Daily routines', 11),
  ('weather', 'Weather', 12),
  ('housing', 'Housing', 13),
  ('relationships', 'Relationships', 14),
  ('emotions', 'Emotions', 15),
  ('technology', 'Technology', 16),
  ('government', 'Government', 17),
  ('society', 'Society', 18),
  ('culture', 'Culture', 19),
  ('numbers', 'Numbers and time', 20)
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;

-- Membership tiers (spec section 17) ----------------------------------------
insert into public.membership_plans (tier, name, description, features, limits, sort_order) values
  ('free', 'Free', 'Start learning German at no cost.',
   '["Basic A1 vocabulary", "Limited daily flashcards", "Selected grammar lessons", "Limited exercises"]',
   '{"daily_new_words_max": 10, "daily_reviews_max": 50, "ai_messages_per_day": 0}', 1),
  ('premium', 'Premium', 'The complete self-study programme.',
   '["Full vocabulary library", "Unlimited flashcards", "Full spaced repetition", "Complete grammar library", "Listening library", "Stories", "Progress analytics"]',
   '{"daily_new_words_max": 30, "daily_reviews_max": null, "ai_messages_per_day": 0}', 2),
  ('premium_plus', 'Premium Plus', 'Everything, plus AI conversation practice.',
   '["Everything in Premium", "AI German tutor", "Advanced conversation practice", "Additional learning resources"]',
   '{"daily_new_words_max": 30, "daily_reviews_max": null, "ai_messages_per_day": 200}', 3)
on conflict (tier) do update set
  name = excluded.name, description = excluded.description,
  features = excluded.features, limits = excluded.limits, sort_order = excluded.sort_order;

-- Platform settings ----------------------------------------------------------
insert into public.app_settings (key, value, is_public) values
  ('payments.enabled', 'false', true),
  ('payments.providers', '{"razorpay": false, "stripe": false}', false),
  ('learning.daily_new_word_options', '[5, 10, 15, 20, 30]', true),
  ('ai.enabled', 'false', true)
on conflict (key) do nothing;

-- Achievements (spec section 14) --------------------------------------------
insert into public.achievements (key, title, description, icon, xp_reward, criteria, sort_order) values
  ('first_steps', 'Erste Schritte', 'Complete your first study session.', 'footprints', 10, '{"sessions": 1}', 1),
  ('words_50', 'Wortschatz 50', 'Learn 50 words.', 'book', 50, '{"words_learned": 50}', 2),
  ('words_250', 'Wortschatz 250', 'Learn 250 words.', 'book-open', 150, '{"words_learned": 250}', 3),
  ('words_1000', 'Wortschatz 1000', 'Learn 1,000 words.', 'library', 500, '{"words_learned": 1000}', 4),
  ('streak_7', 'Eine Woche', 'Study seven days in a row.', 'flame', 70, '{"streak_days": 7}', 5),
  ('streak_30', 'Ein Monat', 'Study thirty days in a row.', 'flame', 300, '{"streak_days": 30}', 6),
  ('reviews_500', 'Fleißig', 'Complete 500 reviews.', 'repeat', 200, '{"reviews": 500}', 7),
  ('a1_complete', 'A1 geschafft', 'Complete the A1 course.', 'award', 500, '{"course_complete": "a1"}', 8)
on conflict (key) do update set
  title = excluded.title, description = excluded.description,
  icon = excluded.icon, xp_reward = excluded.xp_reward, criteria = excluded.criteria;

-- Course catalogue (structure only; lessons are authored by Divya) ------------
insert into public.courses (slug, title, subtitle, description, cefr_level, required_plan, is_published, sort_order) values
  ('german-a1', 'German A1', 'Absolute beginner',
   'Greet people, introduce yourself, order food, talk about your family and daily routine. Around 650 core words and the grammar that holds them together.',
   'A1', 'free', true, 1),
  ('german-a2', 'German A2', 'Elementary',
   'Talk about the past, make plans, handle shopping, travel and appointments, and understand short everyday texts.',
   'A2', 'premium', true, 2),
  ('german-b1', 'German B1', 'Intermediate',
   'Express opinions, tell stories, handle work and study situations, and prepare for the Goethe-Zertifikat B1.',
   'B1', 'premium', true, 3),
  ('german-b2', 'German B2', 'Upper intermediate',
   'Follow complex discussions, write structured texts and use German confidently at work and university.',
   'B2', 'premium', false, 4)
on conflict (slug) do update set
  title = excluded.title, subtitle = excluded.subtitle, description = excluded.description,
  cefr_level = excluded.cefr_level, required_plan = excluded.required_plan, sort_order = excluded.sort_order;

-- A1 module outline
insert into public.course_modules (course_id, title, description, sort_order)
select c.id, m.title, m.description, m.sort_order
from public.courses c
cross join (values
  ('Hallo! First words', 'Greetings, introductions, numbers and the alphabet.', 1),
  ('Meine Familie', 'Family, possessive articles and the verb haben.', 2),
  ('Essen und Trinken', 'Food, ordering and the accusative case.', 3),
  ('Mein Alltag', 'Daily routine, telling the time and separable verbs.', 4),
  ('In der Stadt', 'Directions, transport and prepositions of place.', 5),
  ('Wohnen', 'Rooms, furniture and describing your home.', 6)
) as m(title, description, sort_order)
where c.slug = 'german-a1'
  and not exists (select 1 from public.course_modules cm where cm.course_id = c.id and cm.title = m.title);
