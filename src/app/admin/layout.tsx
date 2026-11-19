import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { displayName, requireStaff } from "@/lib/auth/session";
import { adminModules } from "@/lib/modules";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireStaff();
  const nav = [
    { href: "/admin", label: "Admin dashboard" },
    ...adminModules.map((m) => ({ href: `/admin/${m.slug}`, label: m.label, soon: true })),
  ];
  return (
    <AppShell
      nav={nav}
      homeHref="/admin"
      userLabel={displayName(user)}
      roleLabel={[user.isAdmin && "Administrator", user.roles.includes("teacher") && "Teacher"].filter(Boolean).join(" · ")}
      extraLinks={
        <Link href="/app" className="block text-sm font-medium text-accent hover:underline">
          ← Student view
        </Link>
      }
    >
      {children}
    </AppShell>
  );
}
