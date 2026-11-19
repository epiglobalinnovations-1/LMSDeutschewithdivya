import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/site/auth-card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in", alternates: { canonical: "/login" } };

const notices: Record<string, string> = {
  signedout: "You have been logged out. Bis bald!",
  confirmed: "Your email is confirmed. Please log in.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  const notice = sp.signedout ? notices.signedout : sp.confirmed ? notices.confirmed : sp.error ? undefined : undefined;
  return (
    <AuthCard
      title="Willkommen zurück"
      intro="Log in to continue learning."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Create a free account
          </Link>
        </>
      }
    >
      {sp.error === "link" && (
        <p role="alert" className="mb-5 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          That link is invalid or has expired. Log in, or request a new link.
        </p>
      )}
      <LoginForm next={next} notice={notice} />
    </AuthCard>
  );
}
