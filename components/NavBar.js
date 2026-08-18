"use client";

import { useState } from "react";
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

// A short synthesized splat — a low thump (impact), a filtered noise burst
// sweeping downward (the wet body of the splat), and a delayed high noise
// tail (a "flick" of juice) — no audio asset needed, same Web Audio
// approach as the phase-end beep in Timer.js.
function playSplat() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();

    const thump = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thump.type = "sine";
    thump.frequency.setValueAtTime(150, ctx.currentTime);
    thump.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.18);
    thumpGain.gain.setValueAtTime(0.35, ctx.currentTime);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
    thump.connect(thumpGain);
    thumpGain.connect(ctx.destination);

    const squishSize = Math.floor(ctx.sampleRate * 0.2);
    const squishBuffer = ctx.createBuffer(1, squishSize, ctx.sampleRate);
    const squishData = squishBuffer.getChannelData(0);
    for (let i = 0; i < squishSize; i++) {
      squishData[i] = (Math.random() * 2 - 1) * (1 - i / squishSize) ** 1.5;
    }
    const squish = ctx.createBufferSource();
    squish.buffer = squishBuffer;
    const squishFilter = ctx.createBiquadFilter();
    squishFilter.type = "lowpass";
    squishFilter.frequency.setValueAtTime(2200, ctx.currentTime);
    squishFilter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.2);
    const squishGain = ctx.createGain();
    squishGain.gain.setValueAtTime(0.35, ctx.currentTime);
    squish.connect(squishFilter);
    squishFilter.connect(squishGain);
    squishGain.connect(ctx.destination);

    const flickSize = Math.floor(ctx.sampleRate * 0.08);
    const flickBuffer = ctx.createBuffer(1, flickSize, ctx.sampleRate);
    const flickData = flickBuffer.getChannelData(0);
    for (let i = 0; i < flickSize; i++) flickData[i] = (Math.random() * 2 - 1) * (1 - i / flickSize);
    const flick = ctx.createBufferSource();
    flick.buffer = flickBuffer;
    const flickFilter = ctx.createBiquadFilter();
    flickFilter.type = "highpass";
    flickFilter.frequency.value = 3000;
    const flickGain = ctx.createGain();
    flickGain.gain.setValueAtTime(0.12, ctx.currentTime + 0.05);
    flick.connect(flickFilter);
    flickFilter.connect(flickGain);
    flickGain.connect(ctx.destination);

    thump.start();
    thump.stop(ctx.currentTime + 0.22);
    squish.start();
    squish.stop(ctx.currentTime + 0.2);
    flick.start(ctx.currentTime + 0.05);
    flick.stop(ctx.currentTime + 0.13);
    flick.onended = () => ctx.close();
  } catch {
    // Web Audio unavailable — silently skip
  }
}

export default function NavBar() {
  const pathname = usePathname();
  const [splatting, setSplatting] = useState(false);

  if (pathname === "/login") return null;

  function handleTomatoClick() {
    if (splatting) return;
    setSplatting(true);
    playSplat();
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
