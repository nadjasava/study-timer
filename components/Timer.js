"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SubjectSelector from "./SubjectSelector";
import { addSession, usePomodoroSettings } from "@/lib/storage";
import { formatMinutesSeconds } from "@/lib/timeUtils";

const RING_SIZE = 240;
const RING_STROKE = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const PHASE_LABELS = {
  work: "Učenje",
  break: "Pauza",
  longBreak: "Duža pauza",
};

const PHASE_RING_COLOR = {
  work: "var(--color-accent)",
  break: "var(--color-danger)",
  longBreak: "var(--color-danger)",
};

function phaseDurationSecondsFor(phase, settings) {
  if (phase === "work") return settings.workMinutes * 60;
  if (phase === "longBreak") return settings.longBreakMinutes * 60;
  return settings.breakMinutes * 60;
}

function playBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Web Audio unavailable — silently skip the beep
  }
}

function notify(title, body) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function ProgressRing({ progress, color }) {
  const offset = RING_CIRCUMFERENCE * (1 - progress);
  return (
    <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90" role="presentation">
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth={RING_STROKE}
      />
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RING_RADIUS}
        fill="none"
        stroke={color}
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s linear" }}
      />
    </svg>
  );
}

export default function Timer() {
  const settings = usePomodoroSettings();

  const [subjectId, setSubjectId] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState("work");
  // null = phase hasn't started ticking yet, so remaining time is just derived from settings
  const [tickingRemaining, setTickingRemaining] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);

  const sessionStartRef = useRef(null);

  const phaseDurationSeconds = phaseDurationSecondsFor(phase, settings);
  const remaining = tickingRemaining ?? phaseDurationSeconds;
  const ringProgress = phaseDurationSeconds > 0 ? remaining / phaseDurationSeconds : 0;

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!isRunning) return undefined;

    const interval = setInterval(() => {
      setTickingRemaining((prev) => {
        const current = prev ?? phaseDurationSeconds;
        if (current > 1) return current - 1;

        if (phase === "work") {
          if (subjectId && sessionStartRef.current) {
            addSession({
              subjectId,
              mode: "pomodoro",
              startTime: sessionStartRef.current,
              endTime: new Date().toISOString(),
              durationSeconds: settings.workMinutes * 60,
              date: new Date().toISOString().slice(0, 10),
            });
          }
          const nextCount = completedCount + 1;
          setCompletedCount(nextCount);
          const nextPhase =
            nextCount % settings.intervalsUntilLongBreak === 0 ? "longBreak" : "break";
          playBeep();
          notify(
            nextPhase === "longBreak" ? "Duža pauza!" : "Pauza!",
            "Vreme je za pauzu."
          );
          setPhase(nextPhase);
          sessionStartRef.current = null;
          if (!settings.autoStartNextPhase) {
            setIsRunning(false);
          }
          return phaseDurationSecondsFor(nextPhase, settings);
        }

        playBeep();
        notify("Nazad na učenje!", "Pauza je gotova.");
        setPhase("work");
        if (settings.autoStartNextPhase) {
          sessionStartRef.current = new Date().toISOString();
        } else {
          setIsRunning(false);
        }
        return settings.workMinutes * 60;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, phase, subjectId, settings, phaseDurationSeconds, completedCount]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = isRunning
      ? `${formatMinutesSeconds(remaining)} · ${PHASE_LABELS[phase]} — Study Timer`
      : "Study Timer";
  }, [isRunning, remaining, phase]);

  function handleStart() {
    if (!subjectId) return;
    if (!sessionStartRef.current && phase === "work") {
      sessionStartRef.current = new Date().toISOString();
    }
    setIsRunning(true);
  }

  function handlePause() {
    setIsRunning(false);
  }

  function handleReset() {
    setIsRunning(false);
    setPhase("work");
    setTickingRemaining(null);
    sessionStartRef.current = null;
  }

  return (
    <div className="relative flex w-full max-w-md flex-col items-center gap-8 rounded-3xl border border-border bg-surface-card p-10 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <Link
        href="/settings"
        aria-label="Podešavanja tajmera"
        aria-disabled={isRunning}
        className={`absolute right-5 top-5 rounded-full p-2 text-ink-muted transition-colors ${
          isRunning
            ? "pointer-events-none opacity-30"
            : "hover:bg-white/[0.06] hover:text-ink"
        }`}
      >
        <GearIcon />
      </Link>

      <SubjectSelector value={subjectId} onChange={setSubjectId} />

      <div className="relative flex items-center justify-center">
        <ProgressRing progress={ringProgress} color={PHASE_RING_COLOR[phase]} />
        <div className="absolute flex flex-col items-center gap-1">
          <span className="font-mono text-5xl font-semibold tabular-nums text-ink">
            {formatMinutesSeconds(remaining)}
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
            {PHASE_LABELS[phase]}
          </span>
        </div>
      </div>

      <p className="text-sm text-ink-muted">
        Završeno intervala: <span className="text-ink-secondary">{completedCount}</span>
      </p>

      <div className="flex gap-3">
        {!isRunning ? (
          <button
            className="rounded-full bg-accent px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            disabled={!subjectId}
            onClick={handleStart}
          >
            Start
          </button>
        ) : (
          <button
            className="rounded-full border border-border bg-white/[0.03] px-8 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-white/[0.08]"
            onClick={handlePause}
          >
            Pauza
          </button>
        )}

        <button
          className="rounded-full border border-danger/40 bg-danger-wash px-8 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/20"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
