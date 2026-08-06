"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Tajmer" },
  { href: "/subjects", label: "Predmeti" },
  { href: "/stats", label: "Statistika" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface-page/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <span className="flex items-center gap-2 text-sm font-semibold tracking-wide text-ink">
          <span aria-hidden>⏱</span> Study Timer
        </span>
        <nav className="flex gap-1 rounded-full border border-border bg-surface-card p-1 backdrop-blur">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
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
      </div>
    </header>
  );
}
