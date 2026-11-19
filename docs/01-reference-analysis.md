# A–B. Reference platform analysis and feature map

Reference: https://10sentences.com/ (reviewed 19 Nov 2026). We take the learning
*concepts* only. Branding, mascot, copy, word lists, video clips and code are not
reused.

## A. What the reference platform does

| Area | What we observed |
|---|---|
| Positioning | German-only vocabulary trainer aimed at A2/B1 learners and the most frequent words. Word lists: A2 (369), B1 (1,012), "most frequent" (3,477). |
| Learning path | Sequence of units of five words. Each unit: learn 5 flashcards, then three games (matching, fill in the blanks, order words). |
| Word pages | Every word has its own page: numbered meanings, conjugation table (Präsens, Präteritum, Partizip II), three example sentences with grammar notes, and a 10-step drill (introduction, build a sentence, 6× translate, free writing). |
| Writing feedback | Learner-written sentences are corrected by AI ("red pen") with explanations. The site warns AI corrections can be wrong. |
| Listening | "Hear it": search a word and hear it in real YouTube clips in sequence, with subtitles, translation, replay and 0.75× speed (privacy-enhanced YouTube embed, no downloading). |
| Stories | Short A2 audio dramas (4–6 min), different voice per character, normal/slow speed, sentence-highlighted transcript, tap any word for meaning. |
| Chat | Practice chat with AI partners (and some real learners); hints suggest recently learned words; messages corrected before sending. |
| Progress | "Words you recognise" counter, per-exercise and per-word progress, saved automatically. No detailed statistics page found. |
| Gamification | Units, mascot, leaderboard, a "bot or not?" chat game. No streaks, XP or badges found. |
| Spaced repetition | A "revision" feature and "learning plan" exist behind the paywall, but the algorithm is not documented. |
| Onboarding | Pick a word list, start free; Google or email magic link sign-in; 16+ age requirement. |
| Pricing | 7-day free trial, then Pro ≈ US$7.50/month or US$15 per 3 months. Stories, "Hear it" and word pages stay free. Android app via Google Play. |

### What it does well (worth adopting)
1. **Word-first, sentence-second.** Every word immediately appears in real sentences and the learner produces their own sentences.
2. **Short units** (5 words) with several exercise types per unit, so each word is met 10+ times in different forms.
3. **AI correction with explanations** rather than right/wrong marking.
4. **Listening tied to vocabulary** (hear the word you just learned in context, slowed down).
5. **Free top-of-funnel content** (stories, listening, word pages) that is also good SEO.

### Gaps we will close
1. No beginner (A1) path; we start at absolute zero, which matters for Indian learners preparing for A1 visa/exam requirements.
2. No visible spaced repetition algorithm; we use **FSRS** with transparent "due today" counts.
3. No structured grammar curriculum; we add a full grammar library with lessons, practice and quizzes.
4. No teacher layer; we add Divya's teacher/admin dashboards, assignments, announcements and student analytics.
5. No streaks/XP/badges/certificates; we add light, learning-first gamification.
6. Pricing in USD only; we price in INR (Razorpay) with USD for international learners (Stripe).

## B. Feature map: reference concept → Deutsche with Divya module

| Learning stage (our philosophy) | Reference concept | Our module | Phase |
|---|---|---|---|
| Learn words | 5-word units, flashcards | Flashcard engine (DE→EN, EN→DE, swipe, keyboard, bookmark, known/unknown, daily target 5–30) | 2 |
| Recognise words | Matching game, revision | FSRS spaced repetition: new / learning / due / difficult / mastered | 2 |
| Understand words | Word pages with meanings, conjugations, examples | Vocabulary library with article, plural, verb forms, IPA, audio, examples | 2 |
| Understand words | Stories with tap-to-translate | Stories with click-a-word → meaning → save to my vocabulary | 3 |
| Understand words | "Hear it" clips | Listening practice: TTS sentences, uploaded audio, licensed YouTube embeds; slow-down, transcripts, questions | 3 |
| Build sentences | Order words, fill blanks, translate | Sentence builder: reorder, fill blank, complete, conjugate, article select, EN→DE translation | 3 |
| Build sentences | (none) | Grammar library: 21 topics, explanation, examples, practice, mini quiz | 3 |
| Speak German | Free writing + red pen | AI writing correction (what is right, wrong, why, corrected sentence, grammar rule; accepts valid alternatives) | 4 |
| Think in German | AI chat partners | AI German tutor: 6 scenarios, CEFR-adapted, corrections, mistake tracking | 4 |
| (motivation) | Leaderboard | Streaks, XP, badges, weekly targets, leaderboard (opt-in display names), certificates | 2–5 |
| (teaching) | — | Teacher/admin: courses, lessons, vocabulary import (CSV/Excel/JSON), decks, exercises, announcements, analytics | 5 |
| (business) | Trial + Pro | Free / Premium / Premium Plus, Razorpay + Stripe, admin-configured prices | 6 |
