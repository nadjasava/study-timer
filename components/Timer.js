"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SubjectSelector from "./SubjectSelector";
import {
  addSession,
  fetchActiveTimer,
  pushActiveTimer,
  subscribeActiveTimer,
  usePomodoroSettings,
  useSessions,
} from "@/lib/storage";
import { formatMinutesSeconds, startOfStudyDay } from "@/lib/timeUtils";

const RING_SIZE = 240;
const RING_STROKE = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const STORAGE_KEY = "study-timer:active-timer";

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
    osc.onended = () => ctx.close();
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

function loadStoredTimer() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function saveStoredTimer(state) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clearStoredTimer() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
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
  const sessions = useSessions();

  const [subjectId, setSubjectId] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState("work");
  // null = phase hasn't started ticking yet, so remaining time is just derived from settings
  const [remaining, setRemaining] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);

  // phaseEndAt is the wall-clock timestamp the running phase ends at, so a
  // reload or a backgrounded/locked phone can recompute the true remaining
  // time instead of losing whatever a setInterval counter had reached.
  const phaseEndAtRef = useRef(null);
  const sessionStartRef = useRef(null);
  // A state flag, not a ref: the persistence-write effect below needs to
  // see it flip in the SAME re-render as the restored values below, or it
  // fires once more with the pre-hydration defaults and clobbers what was
  // just restored from storage.
  const [hydrated, setHydrated] = useState(false);
  // Set right before a remote (another-device) update is applied locally,
  // so the push effect below skips re-sending the value that just arrived.
  const skipNextPushRef = useRef(false);

  const phaseDurationSeconds = phaseDurationSecondsFor(phase, settings);
  const displayRemaining = remaining ?? phaseDurationSeconds;
  const ringProgress = phaseDurationSeconds > 0 ? displayRemaining / phaseDurationSeconds : 0;

  const todayStart = startOfStudyDay();
  const todayCompletedCount = sessions.filter(
    (s) => s.mode === "pomodoro" && new Date(s.startTime) >= todayStart
  ).length;

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);

  // Restore an in-progress timer once on mount. If the stored phase already
  // ended while the tab/phone was away, land it exactly on that boundary —
  // the running effect below processes the transition on its first tick.
  useEffect(() => {
    // localStorage doesn't exist during SSR, so this can only run after
    // mount — the server and the client's first render must produce the
    // same markup, and only this post-mount pass may then diverge from it.
    /* eslint-disable react-hooks/set-state-in-effect */
    const stored = loadStoredTimer();
    if (stored) {
      setSubjectId(stored.subjectId ?? "");
      setPhase(stored.phase ?? "work");
      setCompletedCount(stored.completedCount ?? 0);
      sessionStartRef.current = stored.sessionStart ?? null;
      phaseEndAtRef.current = stored.phaseEndAt ?? null;

      if (stored.isRunning && stored.phaseEndAt) {
        const secondsLeft = Math.round((stored.phaseEndAt - Date.now()) / 1000);
        setRemaining(Math.max(0, secondsLeft));
        setIsRunning(true);
      } else {
        setRemaining(stored.remaining ?? null);
        setIsRunning(false);
      }
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Then check Supabase for a newer state set by another device while
    // this one was closed (e.g. started on the phone, opened laptop after).
    fetchActiveTimer().then((remote) => {
      if (!remote) return;
      const localSubjectId = stored?.subjectId ?? "";
      const localPhase = stored?.phase ?? "work";
      const localCompletedCount = stored?.completedCount ?? 0;
      const localPhaseEndAt = stored?.phaseEndAt ?? null;
      const localSessionStart = stored?.sessionStart ?? null;
      const localIsRunning = stored?.isRunning ?? false;
      const isSame =
        (remote.subjectId || "") === localSubjectId &&
        remote.phase === localPhase &&
        remote.isRunning === localIsRunning &&
        remote.completedCount === localCompletedCount &&
        remote.phaseEndAt === localPhaseEndAt &&
        remote.sessionStart === localSessionStart;
      if (isSame) return;

      skipNextPushRef.current = true;
      setSubjectId(remote.subjectId ?? "");
      setPhase(remote.phase ?? "work");
      setCompletedCount(remote.completedCount ?? 0);
      sessionStartRef.current = remote.sessionStart ?? null;
      phaseEndAtRef.current = remote.phaseEndAt ?? null;
      setIsRunning(remote.isRunning ?? false);
      if (remote.isRunning && remote.phaseEndAt) {
        setRemaining(Math.max(0, Math.round((remote.phaseEndAt - Date.now()) / 1000)));
      } else {
        setRemaining(remote.remainingSeconds ?? null);
      }
    });
  }, []);

  function completePhase() {
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
      notify(nextPhase === "longBreak" ? "Duža pauza!" : "Pauza!", "Vreme je za pauzu.");
      sessionStartRef.current = null;
      setPhase(nextPhase);

      const duration = phaseDurationSecondsFor(nextPhase, settings);
      if (settings.autoStartNextPhase) {
        phaseEndAtRef.current = Date.now() + duration * 1000;
        setRemaining(duration);
      } else {
        phaseEndAtRef.current = null;
        setRemaining(duration);
        setIsRunning(false);
      }
    } else {
      playBeep();
      notify("Nazad na učenje!", "Pauza je gotova.");
      setPhase("work");

      const duration = settings.workMinutes * 60;
      if (settings.autoStartNextPhase) {
        sessionStartRef.current = new Date().toISOString();
        phaseEndAtRef.current = Date.now() + duration * 1000;
        setRemaining(duration);
      } else {
        phaseEndAtRef.current = null;
        setRemaining(duration);
        setIsRunning(false);
      }
    }
  }

  // Ends the current work phase early, banking whatever time has actually
  // elapsed (not the full pomodoro length) before moving on to the break —
  // same transition completePhase() does on a natural completion, just
  // triggered manually and with a shorter logged duration.
  function skipToBreak() {
    if (phase !== "work") return;
    const elapsed = phaseDurationSeconds - displayRemaining;
    if (subjectId && sessionStartRef.current && elapsed > 0) {
      addSession({
        subjectId,
        mode: "pomodoro",
        startTime: sessionStartRef.current,
        endTime: new Date().toISOString(),
        durationSeconds: elapsed,
        date: new Date().toISOString().slice(0, 10),
      });
    }
    const nextCount = completedCount + 1;
    setCompletedCount(nextCount);
    const nextPhase =
      nextCount % settings.intervalsUntilLongBreak === 0 ? "longBreak" : "break";
    sessionStartRef.current = null;
    setPhase(nextPhase);

    const duration = phaseDurationSecondsFor(nextPhase, settings);
    if (settings.autoStartNextPhase) {
      phaseEndAtRef.current = Date.now() + duration * 1000;
      setRemaining(duration);
      setIsRunning(true);
    } else {
      phaseEndAtRef.current = null;
      setRemaining(duration);
      setIsRunning(false);
    }
  }

  function reconcile() {
    if (!phaseEndAtRef.current) return;
    const secondsLeft = Math.round((phaseEndAtRef.current - Date.now()) / 1000);
    if (secondsLeft > 0) {
      setRemaining(secondsLeft);
    } else {
      completePhase();
    }
  }

  useEffect(() => {
    if (!isRunning) return undefined;
    reconcile();
    const interval = setInterval(reconcile, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, phase, settings, subjectId, completedCount]);

  // Mobile browsers throttle or fully suspend timers in a backgrounded tab —
  // catch up the instant the screen is looked at again, instead of waiting
  // for the next interval tick.
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible" && isRunning) {
        reconcile();
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, phase, settings, subjectId, completedCount]);

  useEffect(() => {
    if (!hydrated) return;
    saveStoredTimer({
      subjectId,
      isRunning,
      phase,
      remaining,
      completedCount,
      phaseEndAt: phaseEndAtRef.current,
      sessionStart: sessionStartRef.current,
    });
  }, [hydrated, subjectId, isRunning, phase, remaining, completedCount]);

  // Pushes to Supabase only on meaningful transitions (start/pause/reset/
  // phase change), not on every per-second tick — `remaining` is read fresh
  // via closure without being a dependency, same reasoning as the interval
  // effects above.
  useEffect(() => {
    if (!hydrated) return;
    if (skipNextPushRef.current) {
      skipNextPushRef.current = false;
      return;
    }
    pushActiveTimer({
      subjectId,
      phase,
      phaseEndAt: phaseEndAtRef.current,
      remainingSeconds: remaining,
      isRunning,
      completedCount,
      sessionStart: sessionStartRef.current,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, subjectId, isRunning, phase, completedCount]);

  // Reflects changes made from another signed-in device (e.g. paused on the
  // phone, resumed on the laptop). Re-subscribes on every transition so the
  // echo check below always reads current values, never a stale closure.
  useEffect(() => {
    if (!hydrated) return undefined;
    const unsubscribe = subscribeActiveTimer((remote) => {
      if (!remote) return;
      const isEcho =
        (remote.subjectId || "") === subjectId &&
        remote.phase === phase &&
        remote.isRunning === isRunning &&
        remote.completedCount === completedCount &&
        remote.phaseEndAt === phaseEndAtRef.current &&
        remote.sessionStart === sessionStartRef.current;
      if (isEcho) return;

      skipNextPushRef.current = true;
      setSubjectId(remote.subjectId ?? "");
      setPhase(remote.phase ?? "work");
      setCompletedCount(remote.completedCount ?? 0);
      sessionStartRef.current = remote.sessionStart ?? null;
      phaseEndAtRef.current = remote.phaseEndAt ?? null;
      setIsRunning(remote.isRunning ?? false);
      if (remote.isRunning && remote.phaseEndAt) {
        setRemaining(Math.max(0, Math.round((remote.phaseEndAt - Date.now()) / 1000)));
      } else {
        setRemaining(remote.remainingSeconds ?? null);
      }
    });
    return unsubscribe;
  }, [hydrated, subjectId, isRunning, phase, completedCount]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = isRunning
      ? `${formatMinutesSeconds(displayRemaining)} · ${PHASE_LABELS[phase]} — Study Timer`
      : "Study Timer";
  }, [isRunning, displayRemaining, phase]);

  function handleStart() {
    if (!subjectId) return;
    if (!sessionStartRef.current && phase === "work") {
      sessionStartRef.current = new Date().toISOString();
    }
    phaseEndAtRef.current = Date.now() + displayRemaining * 1000;
    setIsRunning(true);
  }

  function handlePause() {
    setIsRunning(false);
    phaseEndAtRef.current = null;
  }

  function handleReset() {
    setIsRunning(false);
    setPhase("work");
    setRemaining(null);
    setCompletedCount(0);
    phaseEndAtRef.current = null;
    sessionStartRef.current = null;
    clearStoredTimer();
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
            {formatMinutesSeconds(displayRemaining)}
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
            {PHASE_LABELS[phase]}
          </span>
        </div>
      </div>

      <p className="text-sm text-ink-muted">
        Završeno intervala danas: <span className="text-ink-secondary">{todayCompletedCount}</span>
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

      {phase === "work" && (
        <button
          onClick={skipToBreak}
          disabled={!subjectId}
          className="text-xs font-medium text-ink-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          Preskoči na pauzu
        </button>
      )}
    </div>
  );
}
