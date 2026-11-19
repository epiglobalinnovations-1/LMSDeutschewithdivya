import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/site/auth-card";
import { getSessionUser } from "@/lib/auth/session";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <AuthCard title="Link expired" intro="This password reset link is no longer valid.">
        <Link href="/forgot-password" className="text-accent hover:underline">
          Request a new link
        </Link>
      </AuthCard>
    );
  }
  return (
    <AuthCard title="Choose a new password" intro={`For ${user.email}`}>
      <ResetForm />
    </AuthCard>
  );
}
