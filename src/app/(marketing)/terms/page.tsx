import type { Metadata } from "next";
import { PageHero, Section } from "@/components/site/section";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: "The terms for using Deutsche with Divya.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms and conditions" intro="Last updated: 19 November 2026" />
      <Section>
        <article className="prose-dwd max-w-3xl">
          <p>
            These terms apply when you use deutschewithdivya.com and the Deutsche with Divya learning platform. By creating an
            account you agree to them.
          </p>

          <h2>Your account</h2>
          <ul>
            <li>Give accurate details and keep your password private. You are responsible for activity on your account.</li>
            <li>One account per person. Accounts and memberships may not be shared or resold.</li>
            <li>If you are under 18, a parent or guardian must agree to these terms on your behalf.</li>
          </ul>

          <h2>Memberships and payments</h2>
          <ul>
            <li>The free plan is free with the limits shown on the pricing page.</li>
            <li>Paid memberships are billed in advance for the period you choose and renew automatically unless cancelled before the renewal date.</li>
            <li>Prices are shown in INR for India and may be shown in other currencies elsewhere. Taxes are added where required.</li>
            <li>Cancelling stops future renewals; you keep access until the end of the period you paid for.</li>
            <li>Refund requests are considered within 7 days of the first payment of a new membership.</li>
          </ul>

          <h2>Content</h2>
          <p>
            All courses, vocabulary lists, exercises, audio and other materials on the platform belong to Deutsche with Divya or
            its licensors. You may use them for your own learning only. Copying, recording or redistributing them is not allowed.
          </p>

          <h2>AI features</h2>
          <p>
            The AI tutor and writing corrections are generated automatically. They are usually helpful but can be wrong. Use them
            as practice, not as an authority, and ask your teacher when in doubt. Do not share sensitive personal information in
            AI conversations.
          </p>

          <h2>Fair use</h2>
          <ul>
            <li>Do not try to access other users’ data, disrupt the service or use automated tools to scrape content.</li>
            <li>Be respectful in any message you send to us or other learners.</li>
          </ul>
          <p>We may suspend accounts that break these rules.</p>

          <h2>No guarantee of results</h2>
          <p>
            We work hard to help you learn, but we cannot guarantee a particular exam result or level within a specific time.
          </p>

          <h2>Liability</h2>
          <p>
            The platform is provided “as is”. To the extent permitted by law, our liability is limited to the amount you paid us
            in the 12 months before the claim.
          </p>

          <h2>Governing law</h2>
          <p>These terms are governed by the laws of India.</p>

          <h2>Contact</h2>
          <p>
            Questions about these terms? Use the <a href="/contact">contact page</a>.
          </p>
        </article>
      </Section>
    </>
  );
}
