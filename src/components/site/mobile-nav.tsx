"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { publicNav } from "@/lib/site";
import { buttonClasses } from "@/components/ui/button";

export function MobileNav() {
  const pathname = usePathname();
  // Remember which page the menu was opened on; navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (fn: (o: boolean) => boolean) => setOpenOn(fn(open) ? pathname : null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
        className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-paper-deep"
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
          {open ? (
            <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          ) : (
            <path d="M3 7h16M3 15h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          )}
        </svg>
      </button>
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-line bg-paper px-5 pb-10 pt-4">
          <nav aria-label="Main">
            <ul className="divide-y divide-line">
              {publicNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className="block py-4 font-display text-2xl text-ink aria-[current=page]:text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/contact" className="block py-4 font-display text-2xl text-ink">
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
          <div className="mt-8 grid gap-3">
            <Link href="/register" className={buttonClasses("primary", "lg")}>
              Start learning free
            </Link>
            <Link href="/login" className={buttonClasses("secondary", "lg")}>
              Log in
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
