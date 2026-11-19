import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function AuthCard({ title, intro, children, footer }: { title: string; intro?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <>
      <Card className="p-6 sm:p-9">
        <h1 className="font-display text-3xl tracking-tight">{title}</h1>
        {intro && <p className="mt-2 text-ink-soft">{intro}</p>}
        <div className="mt-7">{children}</div>
      </Card>
      {footer && <div className="mt-6 text-center text-sm text-ink-soft">{footer}</div>}
    </>
  );
}
