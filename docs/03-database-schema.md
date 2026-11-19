# D. Database schema

Source of truth: `supabase/migrations/*.sql` (applied in order). This document
explains the design; the SQL has the exact columns, constraints and policies.

**34 tables, all with Row Level Security enabled. 65 policies.** Every table in the
required list from the brief exists, plus supporting tables (marked +).

## Entity overview

```
auth.users ─1:1─ profiles ─┬─< user_roles >── roles
                           ├─< subscriptions >── membership_plans
                           ├─< enrollments >── courses ─< course_modules ─< lessons
                           ├─< lesson_progress (+) >── lessons
                           ├─< student_vocabulary_progress >── vocabulary
                           ├─< review_history >── vocabulary
                           ├─< exercise_attempts >── exercises ─< exercise_questions
                           ├─< student_achievements >── achievements
                           ├─< daily_activity
                           └─< ai_conversations ─< ai_messages

topics (+) ─< vocabulary ─┬─< vocabulary_translations
                          ├─< vocabulary_examples (+)
                          ├─< vocabulary_relations (+)
                          └─< flashcards >── flashcard_decks

grammar_topics ─< exercises >── stories / listening_materials / lessons
announcements · contact_messages (+) · content_imports (+) · app_settings (+)
```

## Tables by area

### Identity, roles, membership
| Table | Purpose | Key constraints |
|---|---|---|
| `profiles` | One row per user (created by trigger on sign-up): name, CEFR level, daily new-word target, study direction, timezone | PK = `auth.users.id`; `daily_new_words ∈ {5,10,15,20,30}` |
| `roles` | `student`, `teacher`, `admin` | fixed ids 1–3 |
| `user_roles` | Many-to-many, so Divya can hold teacher + admin | PK (user_id, role_id) |
| `membership_plans` | Free / Premium / Premium Plus, prices in paise/cents, features, limits | one row per tier; prices NULL until Divya sets them |
| `subscriptions` | A user's plan period; provider = manual / razorpay / stripe | unique provider reference; period end > start |

### Courses
| `courses` → `course_modules` → `lessons` | Course catalogue; lessons hold ordered JSON content blocks | slug format checks, `is_published`, `required_plan` |
| `enrollments` | Student ↔ course, completion, last lesson | PK (user_id, course_id) |
| `lesson_progress` (+) | Lesson started/completed per student | PK (user_id, lesson_id) |

### Vocabulary and flashcards
| `topics` (+) | The 19 topics from the brief | slug unique |
| `vocabulary` | Lemma, article (nouns only), plural or `has_plural=false`, part of speech, CEFR, topic, IPA, pronunciation guide, verb forms (Präsens, Präteritum, Partizip II), auxiliary haben/sein, audio, image, difficulty 1–5, frequency rank, source, `is_verified`, `content_id` | **duplicate detection**: unique (lower(lemma), article, part_of_speech); article only for nouns; verb fields only for verbs |
| `vocabulary_translations` | One or more translations per word and language | one primary per language |
| `vocabulary_examples` (+) | German example + English translation + audio | |
| `vocabulary_relations` (+) | synonym / antonym / word family / compound links | no self links |
| `flashcard_decks`, `flashcards` | Curated decks (by course, topic, level) | unique (deck, word) |
| `student_vocabulary_progress` | Per student per word: FSRS state (new/learning/review/relearning), stability, difficulty, due date, first seen, last reviewed, reps, lapses, correct/incorrect counts, bookmark, known | PK (user_id, vocabulary_id); index on (user_id, due_at) for "due today" |
| `review_history` | Append-only log of every review (rating, direction, elapsed days, new stability/difficulty, time taken) | students can insert/select own, never update/delete |

The five categories in the brief are queries over `student_vocabulary_progress`:
**New** = no row yet or `state='new'`; **Learning** = `learning`/`relearning`;
**Due** = `due_at <= now()`; **Difficult** = `difficulty >= 7` or `lapses >= 3`;
**Mastered** = `state='review'` and `stability >= 21` days.

### Learning content
| `grammar_topics` | Lesson title, level, objectives, simple-English explanation, rules, ≥10 examples, common mistakes, memory tricks, practical usage | |
| `stories` | Reading passages: German/English title and text, audio, vocabulary highlights, grammar notes | comprehension questions are `exercises` with `story_id` |
| `listening_materials` | Kind = sentences / audio file / YouTube / dialogue; scenario, speakers, transcript DE/EN, timed segments, narration text, license note | YouTube id format check; YouTube rows need an id |
| `exercises` | A set of questions with type, skill (reading/listening/writing/speaking/grammar/vocabulary), level, difficulty, topic, objective; optionally attached to a grammar topic, lesson, story or listening item; `due_at` for assignments | |
| `exercise_questions` | 13 question types (multiple choice, fill blank, reorder, translate both ways, article select, conjugation, completion, matching, listening, reading, free text, true/false), options in `data`, `correct_answer`, `accepted_answers[]`, explanation | **staff-only select**: answers never reach students' browsers |
| `exercise_attempts` | Student answers, correctness, score, AI feedback | append-only for students |

### Motivation, communication, AI, operations
| `achievements` / `student_achievements` | Badge catalogue and awards | awards written server-side only |
| `daily_activity` | Per student per day: XP, minutes, new words, reviews, exercises (drives streaks, weekly time, leaderboards) | written server-side only |
| `announcements` | Divya's messages by audience, publish/expire window | students see only published, unexpired |
| `ai_conversations` / `ai_messages` | Tutor chats by scenario and level; corrections JSON; token counts | own rows only |
| `contact_messages` (+) | Public contact form | anyone inserts, staff read |
| `content_imports` (+) | Import batches with row counts, errors, generator metadata | staff only |
| `app_settings` (+) | Feature flags such as `payments.enabled=false`, `ai.enabled=false` | public flags readable, admin writes |

## Row Level Security model

| Data class | anon | student | teacher | admin |
|---|---|---|---|---|
| Published content (courses, vocabulary, decks, grammar, stories, listening, exercises) | read | read | read + write (incl. drafts) | read + write |
| Exercise questions/answers | – | – (graded server-side) | read + write | read + write |
| Own profile | – | read + update | read all | read all + update |
| Roles | – | read own | read all | grant / revoke |
| Learning data (progress, reviews, attempts, enrollments, AI chats) | – | own rows only | read all | read all |
| XP, achievements | – | read own | read all | read all |
| Subscriptions | – | read own | – | manage |
| Plans, public settings | read | read | read | manage |
| Contact messages | insert | insert | read | read |

Role checks use `private.has_role()`, `private.is_staff()` and `private.is_admin()`:
SECURITY DEFINER functions in a schema that is not exposed through the API.
Policies wrap `auth.uid()` in a sub-select so it is evaluated once per query.

Verified by `tests/db/rls.test.ts` (22 tests: sign-up trigger, profile isolation,
role escalation, private data isolation, append-only logs, XP and subscription
tampering, published vs draft content, hidden answers, contact form, RLS coverage).

## Storage buckets (created in Phase 2/3)

| Bucket | Read | Write |
|---|---|---|
| `audio` | public | staff |
| `images` | public | staff |
| `imports` | staff | staff |
| `avatars` | public | owner (path prefix = user id) |
