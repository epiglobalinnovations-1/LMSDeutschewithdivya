import Link from "next/link";
import { Logo } from "@/components/site/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-5 py-6 sm:px-8">
        <Logo />
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-5 pb-16 pt-4 sm:items-center sm:pt-0">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="px-5 pb-8 text-center text-xs text-muted">
        <Link href="/privacy" className="hover:text-ink">
          Privacy
        </Link>
        <span className="mx-2">·</span>
        <Link href="/terms" className="hover:text-ink">
          Terms
        </Link>
        <span className="mx-2">·</span>
        <Link href="/contact" className="hover:text-ink">
          Help
        </Link>
      </footer>
    </div>
  );
}
