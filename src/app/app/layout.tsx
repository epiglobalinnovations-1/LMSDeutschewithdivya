import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { displayName, requireUser } from "@/lib/auth/session";
import { RELEASED_PHASE, studentModules } from "@/lib/modules";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

export default async function StudentLayout({ children }: LayoutProps<"/app">) {
  const user = await requireUser();
  const nav = [
    { href: "/app", label: "Dashboard" },
    ...studentModules.map((m) => ({ href: `/app/${m.slug}`, label: m.label, soon: m.phase > RELEASED_PHASE })),
    { href: "/app/settings", label: "Profile & settings" },
  ];
  return (
    <AppShell
      nav={nav}
      homeHref="/app"
      userLabel={displayName(user)}
      roleLabel={user.isAdmin ? "Administrator" : user.isStaff ? "Teacher" : "Student"}
      extraLinks={
        user.isStaff ? (
          <Link href="/admin" className="block text-sm font-medium text-accent hover:underline">
            Open admin →
          </Link>
        ) : null
      }
    >
      {children}
    </AppShell>
  );
}
