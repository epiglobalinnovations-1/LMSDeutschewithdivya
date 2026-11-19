# E. Pages and navigation

## Public website (no sign-in)

Header: logo · Courses · Method · Resources · Pricing · About · [Log in] [Start free]
(mobile: logo + menu button opening a full-height sheet).
Footer: courses by level, company pages, legal, contact.

| # | Page | Route | Phase 1 status |
|---|---|---|---|
| 1 | Home | `/` | built |
| 2 | About Divya | `/about` | built (biography text awaiting Divya's details) |
| 3 | German courses | `/courses` (+ `/courses/[slug]`) | built, reads courses and modules from the database |
| 4 | Learning methodology | `/method` | built |
| 5 | Free learning resources | `/resources` | built (A1 starter phrases with pronunciation, links into free content) |
| 6 | Pricing and membership | `/pricing` | built, reads plans from the database; prices show "to be announced" until set |
| 7 | Log in | `/login` | built (working) |
| 8 | Student registration | `/register` | built (working, email verification) |
| 9 | Contact | `/contact` | built (form saves to database) |
| 10 | Privacy policy | `/privacy` | built (draft, needs legal review) |
| 11 | Terms and conditions | `/terms` | built (draft, needs legal review) |
| – | Forgot / reset password | `/forgot-password`, `/reset-password` | built (working) |
| – | Email confirmation handler | `/auth/confirm` | built |
| – | Sitemap, robots | `/sitemap.xml`, `/robots.txt` | built |

## Student application (`/app`, sign-in required)

Desktop: left sidebar. Mobile: bottom tab bar (Home · Flashcards · Practice · Progress · Me)
with the remaining items under "Practice" and "Me".

| # | Page | Route | Phase |
|---|---|---|---|
| 1 | Dashboard (Continue learning, due today, streak, recommendations) | `/app` | shell in 1, data in 2 |
| 2 | My courses | `/app/courses` | 2–3 |
| 3 | Flashcards (study session, deck picker, daily target) | `/app/flashcards` | 2 |
| 4 | Vocabulary library (search, filter by level/topic/category, bookmarks) | `/app/vocabulary` | 2 |
| 5 | Listening practice | `/app/listening` | 3 |
| 6 | Stories | `/app/stories` | 3 |
| 7 | Grammar practice | `/app/grammar` | 3 |
| 8 | Sentence builder | `/app/sentences` | 3 |
| 9 | AI German tutor | `/app/tutor` | 4 |
| 10 | My progress | `/app/progress` | 2 |
| 11 | Achievements | `/app/achievements` | 2 |
| 12 | Profile and settings (name, level, daily target, direction, password) | `/app/settings` | 1 (working) |

## Admin application (`/admin`, teacher or admin role)

Left sidebar with the ten sections; teachers see content and students, admins also see
subscriptions, settings and role management.

| # | Page | Route | Phase |
|---|---|---|---|
| 1 | Admin dashboard | `/admin` | shell in 1, data in 5 |
| 2 | Student management | `/admin/students` | 5 |
| 3 | Course management (course → module → lesson editor with preview) | `/admin/courses` | 5 |
| 4 | Vocabulary management | `/admin/vocabulary` | 2 (basic), 5 |
| 5 | Flashcard management | `/admin/flashcards` | 2 (basic), 5 |
| 6 | Exercise management | `/admin/exercises` | 3 |
| 7 | Learning analytics | `/admin/analytics` | 5 |
| 8 | Announcements | `/admin/announcements` | 5 |
| 9 | Subscription management | `/admin/subscriptions` | 6 |
| 10 | Content import and export (CSV, Excel, JSON with validation and duplicate detection) | `/admin/import` | 2 (vocabulary), 5 (all) |

## Access rules (enforced in `proxy.ts`, again in each layout, and finally by RLS)

- `/app/**`: signed in. Unverified email → sent to `/verify-email`.
- `/admin/**`: signed in and teacher or admin. Others get a 404-style "not allowed" page.
- `/login`, `/register`: signed-in users are redirected to `/app`.
