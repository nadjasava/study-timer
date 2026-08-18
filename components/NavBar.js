"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const LINKS = [
  { href: "/", label: "Tajmer" },
  { href: "/subjects", label: "Predmeti" },
  { href: "/exams", label: "Ispiti" },
  { href: "/stats", label: "Statistika" },
];

function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const [splatting, setSplatting] = useState(false);
  const audioRef = useRef(null);

  if (pathname === "/login") return null;

  function handleTomatoClick() {
    if (splatting) return;
    setSplatting(true);
    if (!audioRef.current) audioRef.current = new Audio("/splat.mp3");
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface-page/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
        <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-ink">
          <button
            type="button"
            onClick={handleTomatoClick}
            aria-label="🍅"
            className="cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/tomato.png"
              alt=""
              aria-hidden
              onAnimationEnd={() => setSplatting(false)}
              className={`h-5 w-5 -translate-y-0.5 ${splatting ? "animate-tomato-splat" : ""}`}
            />
          </button>
          <span className="sr-only uppercase tracking-widest sm:not-sr-only">Study Timer</span>
        </span>
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          <nav className="flex min-w-0 gap-1 overflow-x-auto rounded-full border border-border bg-surface-card p-1 backdrop-blur">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`shrink-0 rounded-full px-2 py-1.5 text-[11px] font-medium transition-colors sm:px-4 sm:text-sm ${
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
            aria-label="Odjava"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2 py-1.5 text-xs text-ink-muted transition-colors hover:border-border-strong hover:text-ink sm:px-3 sm:text-sm"
          >
            <LogoutIcon />
            <span className="sr-only sm:not-sr-only">Odjava</span>
          </button>
        </div>
      </div>
    </header>
  );
}
