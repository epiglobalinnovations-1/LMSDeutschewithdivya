# F. Development roadmap and task list

Each phase ends with a verification gate: typecheck, lint, unit tests, database RLS
tests, production build, and a browser check on phone and desktop widths. A phase is
only marked complete when its gate passes.

| Phase | Milestones | Verification gate |
|---|---|---|
| **1 Foundation** | M1.1 project + tooling · M1.2 design system · M1.3 public site (11 pages, SEO) · M1.4 Supabase project + schema + RLS + seed · M1.5 auth (register, verify, login, logout, reset, roles, protected routes) · M1.6 student/admin shells + settings | RLS tests; sign-up → verify → login → settings round-trip against real Supabase Auth; build; screenshots at 390px and 1280px |
| **2 Learning engine** | A1 core vocabulary (verified) · vocabulary import (CSV/Excel/JSON) · flashcard engine · FSRS scheduler · daily target · dashboard data · progress + history · achievements and streaks | FSRS unit tests; import validation tests; a full study session persists and reschedules correctly |
| **3 Learning content** | Grammar library (21 topics) · stories with click-to-save words · listening (TTS, audio, YouTube) · sentence builder · quizzes with server-side grading | Exercise grading tests; answers never in client payloads |
| **4 AI** | Provider interface · tutor (6 scenarios, CEFR adaptation) · writing correction · mistake tracking · recommendations · rate limits | Prompt contract tests with recorded responses; key never in client bundle |
| **5 Administration** | Teacher dashboard · student management · course/lesson editor with preview · bulk import/export · analytics · announcements · assignments | Staff-only access tests; import of 1,000+ rows |
| **6 Commercialisation** | Plan enforcement in RLS/UI · admin pricing · Razorpay + Stripe checkout and webhooks · subscription management | Sandbox payments end to end; webhook signature tests |
| **7 Deployment** | Vercel project · env vars · SMTP · domain + DNS + SSL · www → apex · auth redirect URLs · backups · error logging · launch checklist | Live checks on both hostnames; Lighthouse; security advisor clean |

## Task list

Legend: ✅ completed · 🔄 in progress · ⏳ pending · ⛔ blocked

### Phase 0: planning (section 23 A–H)
- ✅ A. Reference platform analysis (`docs/01-reference-analysis.md`)
- ✅ B. Feature map (`docs/01-reference-analysis.md`)
- ✅ C. Technical architecture (`docs/02-architecture.md`)
- ✅ D. Database schema (`docs/03-database-schema.md`, `supabase/migrations`)
- ✅ E. Pages and navigation (`docs/04-pages-and-navigation.md`)
- ✅ F. Roadmap (this file)
- ✅ G. Third-party services and costs (`docs/06-services-and-costs.md`)
- ✅ H. External APIs and configuration (`docs/02-architecture.md#h`)

### Phase 1: foundation
- ✅ Next.js 16 + TypeScript + Tailwind 4 project, lint, typecheck, Vitest
- ✅ Hosted Supabase project `deutsche-with-divya` (Mumbai, ap-south-1)
- ✅ Schema: 34 tables, constraints, indexes, RLS, triggers (3 migrations, applied)
- ✅ Content-format fields for the German content generator spec
- ✅ Seed: topics, plans, achievements, settings, course catalogue
- ✅ RLS test suite (22 tests)
- ✅ Design system (tokens, typography, buttons, fields, cards, progress, flashcard)
- ✅ Public website: 11 pages, metadata, Open Graph, JSON-LD, sitemap, robots, www → apex redirect
- ✅ Authentication: register, email verification, resend, login, logout, forgot/reset password, change password, protected routes, role-gated admin
- ✅ Student shell with live dashboard (target, due reviews, streak, weekly minutes) and profile settings
- ✅ Admin shell with live overview and contact messages
- ✅ Verification: lint, typecheck, 9 unit tests, 22 RLS tests, production build, 33 browser checks (desktop + mobile) against a real Supabase Auth server
- ⏳ Run the end-to-end check against the hosted project (needs auth redirect URLs and SMTP set in the Supabase dashboard; this build environment cannot reach supabase.co over HTTP)
- ⛔ Production email sending: needs an SMTP provider (see services doc). Until then Supabase's built-in sender works for testing only (a few emails per hour).
- ⏳ Bootstrap Divya's admin account: needs her sign-up email (`scripts/grant-role.sql`)
- ⛔ About page biography and real photo: needs Divya's details (deutschewithdivya.com blocks automated reading)

### Later phases
See milestone table above. Phase 2 starts after Phase 1 is reviewed.
