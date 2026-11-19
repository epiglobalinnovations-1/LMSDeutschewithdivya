import Link from "next/link";
import { Container } from "@/components/ui/card";
import { FlagRule, Logo } from "./logo";

const columns = [
  {
    title: "Learn",
    links: [
      { href: "/courses/german-a1", label: "German A1" },
      { href: "/courses/german-a2", label: "German A2" },
      { href: "/courses/german-b1", label: "German B1" },
      { href: "/resources", label: "Free resources" },
    ],
  },
  {
    title: "Deutsche with Divya",
    links: [
      { href: "/about", label: "About Divya" },
      { href: "/method", label: "Our method" },
      { href: "/pricing", label: "Pricing" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/register", label: "Create account" },
      { href: "/login", label: "Log in" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms and conditions" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-paper-deep/60">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs space-y-4">
          <Logo />
          <p className="text-sm leading-relaxed text-muted">
            German for Indian and international learners, from your first “Hallo” to confident conversation.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{col.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-ink-soft hover:text-accent">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <Container className="flex flex-col gap-3 border-t border-line py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Deutsche with Divya. All rights reserved.</p>
        <FlagRule className="w-16" />
      </Container>
    </footer>
  );
}
