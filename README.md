# Deutsche with Divya

German learning platform (LMS) for Divya's students: courses, flashcards with FSRS
spaced repetition, grammar, listening, stories, sentence building, an AI tutor, and
teacher/admin tools. Production domain: https://deutschewithdivya.com (not yet live).

**Status:** Phase 1 (Foundation) complete. See [docs/05-roadmap.md](docs/05-roadmap.md)
for completed, pending and blocked tasks.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres,
Auth, RLS, Storage) · Zod · Vitest · Playwright. Hosting: Vercel.

## Documentation

| Doc | Contents |
|---|---|
| [01 Reference analysis](docs/01-reference-analysis.md) | 10sentences.com analysis and feature map |
| [02 Architecture](docs/02-architecture.md) | System design, decisions, external APIs needing configuration |
| [03 Database schema](docs/03-database-schema.md) | Tables, relationships, RLS model |
| [04 Pages and navigation](docs/04-pages-and-navigation.md) | Public site, student app, admin app |
| [05 Roadmap](docs/05-roadmap.md) | Phases, milestones, task list |
| [06 Services and costs](docs/06-services-and-costs.md) | Third-party services and monthly costs |
| [07 Deployment checklist](docs/07-deployment-checklist.md) | Vercel, DNS, SSL, auth URLs |

## Run it locally

```bash
npm install
cp .env.example .env.local      # then fill in the Supabase URL and publishable key
npm run dev                     # http://localhost:3000
```

### Option A: against the hosted Supabase project
Use the project URL and publishable key from Supabase → Project settings → API keys.
Add `http://localhost:3000/**` to Authentication → URL configuration → Redirect URLs.

### Option B: fully local stack (no cloud account needed)
Requires Docker. Starts Postgres 16, Supabase Auth (GoTrue), PostgREST, a small gateway
on :54321 that mimics Supabase's API paths, and an SMTP sink that captures emails.

```bash
./scripts/local-stack/start.sh          # applies migrations + seed, prints local keys
# put NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 and the printed LOCAL_ANON_KEY
# into .env.local as NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm run dev
# captured emails (confirmation, reset links): http://localhost:54321/__mail
```

`npm run db:reset` re-applies migrations and seed to the local database.

## Tests and checks

```bash
npm run lint
npm run typecheck
npm test                        # unit tests
npm run test:db                 # RLS tests against the local database (22 tests)
npm run build
npm start & node tests/e2e/phase1.mjs   # browser end-to-end check (33 checks, needs the local stack)
```

## Database

Migrations live in `supabase/migrations` and are the source of truth. Reference data is
in `supabase/seed.sql`. Regenerate TypeScript types after a schema change with
`npm run db:types` (local stack running).

To give someone teacher/admin rights, run `scripts/grant-role.sql` in the Supabase SQL
editor with their email.

## Project layout

```
src/app/(marketing)   public website        src/app/app     student application
src/app/(auth)        login, register…      src/app/admin   teacher/admin application
src/components        UI, site, learning    src/lib         Supabase clients, auth, validation, data
supabase/             migrations, seed      tests/          RLS and end-to-end tests
```

## Security notes

- Every table has Row Level Security. Students can only read and write their own data.
- Exercise answers are never readable by students; grading happens on the server.
- Secrets (service role key, AI and payment keys) are server-only environment variables.
- Role helper functions live in a `private` schema that is not exposed through the API.
