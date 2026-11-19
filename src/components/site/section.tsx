import type { ReactNode } from "react";
import { Container } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-xs font-semibold uppercase tracking-[0.18em] text-accent", className)}>{children}</p>;
}

export function PageHero({ eyebrow, title, intro }: { eyebrow: string; title: ReactNode; intro?: ReactNode }) {
  return (
    <section className="border-b border-line/70">
      <Container className="py-14 sm:py-20">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.08] tracking-tight text-ink sm:text-5xl">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{intro}</p>}
      </Container>
    </section>
  );
}

export function Section({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("py-16 sm:py-24", className)}>
      <Container>{children}</Container>
    </section>
  );
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe here: data is static and authored by us.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
