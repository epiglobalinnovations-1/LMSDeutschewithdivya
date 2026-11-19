# G. Third-party services and costs

Prices are the providers' public list prices as best known on 19 Nov 2026 and change
often; confirm on each pricing page before committing. INR conversions are approximate
(1 USD ≈ ₹84–88).

## Required to launch

| Service | Used for | Plan to start | Approx. cost | Notes |
|---|---|---|---|---|
| Supabase | Database, auth, storage | Free while building → **Pro** at launch | Free; Pro US$25/month per org (includes one small compute instance) | Free projects pause after a week of inactivity and have no backups. Pro adds daily backups. The org already has other projects; check whether it is already on Pro. |
| Vercel | Hosting Next.js | **Pro** (Hobby is for non-commercial use only) | US$20/month per member | Includes generous bandwidth for this scale. |
| Domain | deutschewithdivya.com | already registered | renewal ~₹800–1,500/year | DNS changes in Phase 7. |
| Transactional email | Verification and reset emails | Resend Free → Pro | Free up to 3,000 emails/month (100/day); Pro US$20/month for 50,000 | Supabase's built-in email is for testing only. Needs SPF/DKIM DNS records. |
| GitHub | Code hosting | Free | US$0 | Repo `lmsdeutschewithdivya`. |

**Launch baseline: about US$45–65/month (≈ ₹4,000–5,500)** before AI, TTS and payment fees.

## Usage-based (enabled in later phases)

| Service | Used for | Pricing model | Rough monthly estimate |
|---|---|---|---|
| Anthropic Claude API | AI tutor, writing correction | per token; smaller models are a fraction of a cent per short exchange | 500 active Premium Plus students × 40 short exchanges ≈ US$20–80 depending on model. Capped by per-plan daily limits. |
| Text-to-speech (optional) | Native-quality German audio files | Google Cloud TTS / Azure Speech: roughly US$15–16 per 1M characters for neural voices, with a free monthly allowance; ElevenLabs from ~US$5/month | Generating audio for 10,000 words + examples (~1M characters) is a one-off ≈ US$0–16. Browser speech synthesis is free and used by default. |
| Razorpay | INR payments (UPI, cards, netbanking) | ~2% per domestic transaction (+18% GST on the fee); no monthly fee | e.g. ₹10 on a ₹499 subscription |
| Stripe | International cards | ~2.9%–4.3% + fixed fee per transaction, plus currency conversion | Only on international sales |
| Upstash Redis (optional) | API rate limiting | Free tier, then pay per request | US$0 at launch |
| Sentry (optional) | Error logging | Free developer tier | US$0 at launch |
| YouTube IFrame player | Licensed video embeds | free | US$0 |

## Decisions needed from Paul / Divya
1. Confirm the Supabase org plan (Free vs Pro) before launch.
2. Choose the email provider (recommendation: Resend) and who manages DNS.
3. Membership prices in INR and USD (Phase 6). Payments stay off until set.
4. Whether to pay for a premium TTS voice or start with free browser voices.
