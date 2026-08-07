"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const LINKS = [
  { href: "/", label: "Tajmer" },
  { href: "/subjects", label: "Predmeti" },
  { href: "/stats", label: "Statistika" },
];

export default function NavBar() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface-page/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
        <span className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-wide text-ink">
          <span aria-hidden>🍅</span>
          <span className="sr-only sm:not-sr-only">Study Timer</span>
        </span>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <nav className="flex min-w-0 gap-1 overflow-x-auto rounded-full border border-border bg-surface-card p-1 backdrop-blur">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`shrink-0 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                    active
                      ? "bg-accent text-white shadow-sm shadow-accent/30"
                      : "text-ink-secondary hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={() => supabase.auth.signOut()}
            className="shrink-0 rounded-full border border-border px-2.5 py-1.5 text-xs text-ink-muted transition-colors hover:border-border-strong hover:text-ink sm:px-3 sm:text-sm"
          >
            Odjava
          </button>
        </div>
      </div>
    </header>
  );
}
