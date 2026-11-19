import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/site/auth-card";
import { ResendForm } from "./resend-form";

export const metadata: Metadata = { title: "Confirm your email", robots: { index: false } };

export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const { email } = await searchParams;
  const address = typeof email === "string" ? email : undefined;
  return (
    <AuthCard
      title="Check your inbox"
      intro={
        <>
          We sent a confirmation link to {address ? <strong className="text-ink">{address}</strong> : "your email address"}. Open
          it on this device to activate your account.
        </>
      }
      footer={
        <Link href="/login" className="text-accent hover:underline">
          Back to log in
        </Link>
      }
    >
      <div className="space-y-6">
        <p className="text-sm text-muted">Nothing there after a few minutes? Check your spam folder, or send it again.</p>
        <ResendForm email={address} />
      </div>
    </AuthCard>
  );
}
