import type { Metadata } from "next";
import { PageHero, Section } from "@/components/site/section";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Deutsche with Divya collects, uses and protects your personal data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy policy" intro="Last updated: 19 November 2026" />
      <Section>
        <article className="prose-dwd max-w-3xl">
          <p>
            Deutsche with Divya (“we”, “us”) runs the website deutschewithdivya.com and its learning platform. This policy
            explains what personal data we collect, why, and the choices you have. We process personal data in line with
            India’s Digital Personal Data Protection Act, 2023 and, for learners in the European Union, the GDPR.
          </p>

          <h2>What we collect</h2>
          <ul>
            <li><strong>Account data:</strong> your name, email address and password (stored only as a secure hash by our authentication provider).</li>
            <li><strong>Learning data:</strong> your level, daily targets, words studied, review history, exercise answers, achievements and study time.</li>
            <li><strong>AI practice data:</strong> messages you write to the AI tutor and the corrections returned, so you can review them.</li>
            <li><strong>Payment data:</strong> if you buy a membership, payments are handled by Razorpay or Stripe. We receive a payment reference and status, never your full card or bank details.</li>
            <li><strong>Messages:</strong> anything you send through the contact form.</li>
            <li><strong>Technical data:</strong> essential cookies that keep you signed in, and basic logs (IP address, browser) used for security.</li>
          </ul>

          <h2>Why we use it</h2>
          <ul>
            <li>To create and secure your account and provide the courses you signed up for.</li>
            <li>To schedule your reviews and show your progress. This is the core of the service.</li>
            <li>So your teacher can see your progress and help you, if you are enrolled in her courses.</li>
            <li>To reply to your messages and send essential account emails (verification, password reset).</li>
            <li>To process payments and keep records required by law.</li>
          </ul>
          <p>We do not sell your personal data and we do not use it for third-party advertising.</p>

          <h2>Who we share it with</h2>
          <p>
            Only with service providers that run the platform on our behalf: Supabase (database and authentication), Vercel
            (hosting), our email delivery provider, Razorpay and Stripe (payments) and Anthropic (AI tutor responses, only the
            text of your tutor conversations). Each is bound by a data processing agreement. Some providers store data outside
            India; we use providers with appropriate safeguards.
          </p>

          <h2>Other students</h2>
          <p>
            Other students never see your email address or learning data. If leaderboards are enabled, only your display name
            and points are shown, and you can choose a display name of your own.
          </p>

          <h2>How long we keep it</h2>
          <p>
            We keep your account and learning history while your account is active. If you delete your account, we delete your
            personal data within 30 days, except records we must keep for tax or legal reasons.
          </p>

          <h2>Your rights</h2>
          <p>
            You can access, correct or delete your personal data, withdraw consent and raise a grievance. Most details can be
            changed in your profile settings. For anything else, contact us through the <a href="/contact">contact page</a>.
          </p>

          <h2>Children</h2>
          <p>
            Learners under 18 need the consent of a parent or guardian to create an account.
          </p>

          <h2>Changes</h2>
          <p>If we change this policy in a meaningful way, we will tell you by email or in the app before the change applies.</p>
        </article>
      </Section>
    </>
  );
}
