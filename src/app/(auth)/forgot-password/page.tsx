import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/site/auth-card";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot your password?"
      intro="Enter your email and we will send you a link to choose a new one."
      footer={
        <Link href="/login" className="text-accent hover:underline">
          Back to log in
        </Link>
      }
    >
      <ForgotForm />
    </AuthCard>
  );
}
