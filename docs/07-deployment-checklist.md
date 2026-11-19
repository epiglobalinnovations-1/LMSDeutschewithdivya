# Deployment checklist (Phase 7, prepared now)

Nothing here is done yet unless marked. The domain is **not** connected; do not
announce it until step 10 passes on both hostnames.

1. **GitHub repository** ✅ `epiglobalinnovations-1/lmsdeutschewithdivya`.
2. **Vercel project**: import the repo into the "Epiglobal Team" Vercel team. Framework preset: Next.js. Build command `npm run build`. Node 22.
3. **Supabase project** ✅ `deutsche-with-divya` (ref `sxneztthpybqnknecile`, Mumbai). Before launch: upgrade the org to Pro for daily backups and no auto-pause; enable Point-in-Time Recovery if budget allows.
4. **Environment variables** (Vercel → Settings → Environment Variables):
   | Name | Scope | Value |
   |---|---|---|
   | `NEXT_PUBLIC_SITE_URL` | Production | `https://deutschewithdivya.com` |
   | `NEXT_PUBLIC_SITE_URL` | Preview | leave unset (falls back to the request origin) |
   | `NEXT_PUBLIC_SUPABASE_URL` | All | `https://sxneztthpybqnknecile.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | All | Supabase → Project settings → API keys → publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | secret key (server only; Phase 2+) |
   | `ANTHROPIC_API_KEY` | Production | Phase 4 |
5. **Domain connection**: Vercel → Domains → add `deutschewithdivya.com` and `www.deutschewithdivya.com`; set the apex as primary and www to redirect (the app also redirects www → apex in `next.config.ts`).
6. **DNS** at the registrar: apex `A 76.76.21.21` (or the value Vercel shows), `www CNAME cname.vercel-dns.com`. Email DNS (SPF, DKIM, DMARC) for the email provider.
7. **SSL**: issued automatically by Vercel once DNS resolves. Verify both hostnames serve a valid certificate.
8. **Authentication URLs** (Supabase → Authentication → URL configuration):
   - Site URL: `https://deutschewithdivya.com`
   - Redirect URLs: `https://deutschewithdivya.com/**`, `https://*-epiglobal-team.vercel.app/**` (previews), `http://localhost:3000/**`
   - SMTP: custom provider (Resend recommended) with sender `hallo@deutschewithdivya.com`.
   - Email templates: use `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/app` for confirmation and `...&type=recovery` for reset, so links work on any device.
9. **Production database**: migrations in `supabase/migrations` are already applied to the hosted project (`foundation_schema`, `content_format`, `harden_functions`) plus `seed.sql`. For future changes apply new migrations in order; never edit applied ones. Run the security advisor after every migration.
10. **Final production testing**: run `BASE_URL=https://deutschewithdivya.com` smoke checks (public pages, sign-up with a real inbox, password reset, settings save), Lighthouse on mobile, check `https://www.deutschewithdivya.com` redirects with 308 to the apex, and check `/sitemap.xml` and `/robots.txt`.
11. **Make Divya an admin**: after she registers, run `scripts/grant-role.sql` with her email in the Supabase SQL editor.
