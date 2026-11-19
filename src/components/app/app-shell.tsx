import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/cn";

export type NavItem = { href: string; label: string; soon?: boolean };

/**
 * Shared shell for the student and admin apps: sidebar on desktop, compact
 * top bar plus horizontally scrolling tabs on mobile.
 */
export function AppShell({
  nav,
  homeHref,
  userLabel,
  roleLabel,
  extraLinks,
  children,
}: {
  nav: NavItem[];
  homeHref: string;
  userLabel: string;
  roleLabel: string;
  extraLinks?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden border-r border-line bg-surface lg:flex lg:flex-col">
        <div className="px-6 py-6">
          <Logo href={homeHref} />
        </div>
        <nav aria-label="App" className="flex-1 space-y-0.5 px-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-ink-soft hover:bg-paper hover:text-ink"
            >
              {item.label}
              {item.soon && <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Soon</span>}
            </Link>
          ))}
        </nav>
        <div className="space-y-3 border-t border-line px-6 py-5 text-sm">
          <div>
            <p className="truncate font-medium">{userLabel}</p>
            <p className="text-xs text-muted">{roleLabel}</p>
          </div>
          {extraLinks}
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Logo href={homeHref} />
            <SignOutButton compact />
          </div>
          <nav aria-label="App" className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none]">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn("shrink-0 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft")}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main id="main" className="flex-1 px-4 py-6 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function SignOutButton({ compact }: { compact?: boolean }) {
  return (
    <form action="/auth/signout" method="post">
      <button type="submit" className={cn("text-ink-soft hover:text-accent", compact ? "text-sm" : "text-sm underline-offset-4 hover:underline")}>
        Log out
      </button>
    </form>
  );
}

export function PageTitle({ eyebrow, title, children }: { eyebrow?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>}
      <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">{title}</h1>
      {children && <div className="mt-2 text-ink-soft">{children}</div>}
    </div>
  );
}

export function ComingSoon({ title, phase, description, backHref }: { title: string; phase: number; description: string; backHref: string }) {
  return (
    <>
      <PageTitle eyebrow={`Arrives in phase ${phase}`} title={title} />
      <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface p-8">
        <p className="max-w-xl leading-relaxed text-ink-soft">{description}</p>
        <p className="mt-4 text-sm text-muted">
          This section is part of the development roadmap and is not available yet. Your account and settings are already
          saved, so everything you do here later will be added to the same progress.
        </p>
        <Link href={backHref} className="mt-6 inline-block text-sm font-medium text-accent hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    </>
  );
}
