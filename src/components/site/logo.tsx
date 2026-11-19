import Link from "next/link";
import { cn } from "@/lib/cn";

/** Wordmark: serif "Deutsche" with a small tricolour rule beneath "with Divya". */
export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex flex-col leading-none", className)} aria-label="Deutsche with Divya, home">
      <span className="font-display text-[1.35rem] font-semibold tracking-tight text-ink">
        Deutsche <span className="font-normal italic text-accent">with Divya</span>
      </span>
      <FlagRule className="mt-1.5 w-12" />
    </Link>
  );
}

/** Three short bars: a subtle German-inspired accent. */
export function FlagRule({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("flex h-[3px] overflow-hidden rounded-full", className)}>
      <span className="flex-1 bg-ink" />
      <span className="flex-1 bg-accent" />
      <span className="flex-1 bg-gold" />
    </span>
  );
}
