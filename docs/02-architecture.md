# C. Technical architecture

## Stack (versions installed 19 Nov 2026)

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js App Router, React Server Components, Server Actions | Next 16.4, React 19.3 |
| Language | TypeScript (strict) | 5.x |
| Styling | Tailwind CSS v4 with CSS-variable design tokens | 4.3 |
| Backend | Supabase: Postgres 17, Auth (GoTrue), Row Level Security, Storage | hosted, ap-south-1 (Mumbai) |
| Supabase client | `@supabase/ssr` (cookie sessions) + `@supabase/supabase-js` | 0.12 / 2.119 |
| Validation | Zod (shared between forms, server actions and import pipeline) | 4.x |
| Spaced repetition | `ts-fsrs` (reference FSRS implementation) | Phase 2 |
| AI | Anthropic Claude API, server-side only, behind a provider interface | Phase 4 |
| Audio | Browser `speechSynthesis` (de-DE) by default; pluggable TTS provider (Google / Azure / ElevenLabs) that caches MP3s in Supabase Storage | Phase 3 |
| Payments | Razorpay (India, INR) and Stripe (international), disabled until configured | Phase 6 |
| Hosting | Vercel (Next.js), Supabase (data), domain deutschewithdivya.com | Phase 7 |
| Tests | Vitest (unit + database RLS tests), Playwright (browser smoke tests) | |

No deviation from the requested stack. One note: Next.js 16 renamed `middleware.ts`
to `proxy.ts`; we use the new convention.

## System diagram

```
 Browser (mobile-first PWA-ready UI)
   │  HTTPS
   ▼
 Vercel ── Next.js 16
   │  • Public site: static/ISR pages (SEO), contact form → server action
   │  • proxy.ts: refreshes the Supabase session cookie, guards /app and /admin
   │  • Server Components read data with the user's session (RLS applies)
   │  • Server Actions / Route Handlers: forms, grading, imports, AI, webhooks
   │  • Secrets (service role key, Claude key, payment keys) live only here
   ▼
 Supabase
   • Auth: email + password, email verification, password recovery
   • Postgres: 34 tables, RLS on every table, role helpers in a private schema
   • Storage buckets: audio (public read), images (public read), imports (staff only)
   ▼
 External APIs (server-side only): Claude, TTS provider, Razorpay, Stripe, SMTP (Resend)
```

## Key design decisions

1. **Security by RLS first.** The browser only ever holds the anon/publishable key
   and the user's JWT. Every table has RLS; students can read and write only rows
   where `user_id = auth.uid()`. Staff access is granted through
   `private.is_staff()` / `private.is_admin()`, which are not exposed as API
   endpoints. The service-role key is used only in server code for jobs that must
   cross users (grading against hidden answers, awarding XP, payment webhooks).
2. **Roles are a join table** (`user_roles`) so Divya can be both teacher and admin.
   A database trigger creates a profile and the `student` role on every sign-up.
3. **Answers never reach the browser.** `exercise_questions` (which contain correct
   answers) are readable by staff only; students submit answers to a server action
   that grades with the service role and stores an `exercise_attempts` row.
4. **XP, streaks and achievements are awarded server-side** (students have read-only
   access to `daily_activity` and `student_achievements`) so they cannot be faked.
5. **FSRS state per student per word** lives in `student_vocabulary_progress`; every
   review is appended to `review_history` so FSRS parameters can be re-optimised
   per student later.
6. **Content is data, not code.** Courses, lessons, vocabulary, grammar, stories,
   listening and exercises are rows authored through the admin UI or imported from
   CSV/Excel/JSON. Generated content carries a stable `content_id`, so re-importing
   a file updates rows instead of duplicating them.
7. **Membership gating** uses `required_plan` on content and
   `public.current_plan_tier()` for the signed-in user. Phase 1 stores it; Phase 6
   enforces it in RLS and the UI.
8. **AI behind an interface.** `lib/ai/provider.ts` exposes `chat()` and
   `correct()`; the Claude implementation is the default and another provider can be
   swapped in by environment variable. Requests are rate-limited per user and plan.

## Source layout

```
src/
  app/
    (marketing)/        public website: home, about, courses, method, resources,
                        pricing, contact, privacy, terms
    (auth)/             login, register, forgot-password, reset-password, verify
    auth/callback/      email-link handler (code exchange)
    app/                student application (requires sign-in)
    admin/              teacher/admin application (requires staff role)
    sitemap.ts, robots.ts
  components/ui/        design-system primitives (Button, Input, Card, Badge, Progress…)
  components/site/      header, footer, marketing sections
  lib/supabase/         server, browser and proxy clients; env handling
  lib/auth/             session and role helpers (Data Access Layer)
  lib/validation/       Zod schemas shared by forms and server actions
  proxy.ts              session refresh + route protection
supabase/
  migrations/           ordered SQL migrations (source of truth for the schema)
  seed.sql              reference data (topics, plans, achievements, course outline)
tests/db/               RLS tests run against a real Postgres
scripts/local-stack/    local Postgres + Supabase Auth for verification
docs/                   this documentation
```

## Environments

| Env | Web | Database |
|---|---|---|
| Local | `npm run dev` on :3000 | local stack (`scripts/local-stack/start.sh`) or the hosted project |
| Preview | Vercel preview per pull request | hosted project (later: Supabase branch) |
| Production | deutschewithdivya.com (apex canonical, www → apex) | hosted project `deutsche-with-divya` |

## H. Features that need external APIs or extra configuration

| Feature | Needs | Configured where | Status |
|---|---|---|---|
| Email verification, password reset | SMTP provider (Supabase's built-in sender is limited to a few emails per hour) | Supabase → Auth → SMTP; DNS (SPF/DKIM) for deutschewithdivya.com | Pending: choose provider (Resend recommended) |
| Google sign-in (optional) | Google Cloud OAuth client | Supabase → Auth → Providers | Not planned for Phase 1 |
| AI tutor, AI writing correction | `ANTHROPIC_API_KEY` | Vercel env (server only) | Phase 4 |
| Native German audio | TTS provider key (Google Cloud TTS / Azure Speech / ElevenLabs) | Vercel env; audio cached in Storage | Phase 3 (browser TTS works without a key) |
| YouTube listening | Video IDs of licensed/embeddable videos; official IFrame player | Admin UI | Phase 3, no key needed |
| Payments (INR) | Razorpay key id/secret + webhook secret | Vercel env + admin toggle | Phase 6, off by default |
| Payments (international) | Stripe secret + webhook secret | Vercel env + admin toggle | Phase 6, off by default |
| Rate limiting | Upstash Redis (or Postgres-based limiter) | Vercel env | Phase 4 |
| Error logging | Sentry DSN (optional) | Vercel env | Phase 7 |
| Domain | DNS records at the registrar | Registrar + Vercel | Phase 7 |
| Analytics | Vercel Web Analytics or Plausible | Vercel | Phase 7 |
