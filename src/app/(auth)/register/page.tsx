import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/site/auth-card";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create your free account",
  description: "Register for Deutsche with Divya and start learning German free.",
  alternates: { canonical: "/register" },
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Fangen wir an"
      intro="Let’s begin. Create your free account to start learning German."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
