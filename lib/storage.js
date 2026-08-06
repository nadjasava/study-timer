"use client";

import { useSyncExternalStore } from "react";

const SUBJECTS_KEY = "study-timer:subjects";
const SESSIONS_KEY = "study-timer:sessions";
const POMODORO_SETTINGS_KEY = "study-timer:pomodoroSettings";

const DEFAULT_POMODORO_SETTINGS = {
  workMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  intervalsUntilLongBreak: 4,
  autoStartNextPhase: true,
};

const listeners = new Set();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", emitChange);
}

// Wraps a localStorage key as a store compatible with useSyncExternalStore,
// so components stay in sync (and hydrate safely) without manual effects.
function createStore(key, fallback) {
  let cachedRaw;
  let cachedValue = fallback;

  function getSnapshot() {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      try {
        cachedValue = raw ? JSON.parse(raw) : fallback;
      } catch {
        cachedValue = fallback;
      }
    }
    return cachedValue;
  }

  function getServerSnapshot() {
    return fallback;
  }

  function set(value) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
    emitChange();
  }

  return { subscribe, getSnapshot, getServerSnapshot, set };
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const subjectsStore = createStore(SUBJECTS_KEY, []);
const sessionsStore = createStore(SESSIONS_KEY, []);
const pomodoroSettingsStore = createStore(
  POMODORO_SETTINGS_KEY,
  DEFAULT_POMODORO_SETTINGS
);

export function getSubjects() {
  return subjectsStore.getSnapshot();
}

export function useSubjects() {
  return useSyncExternalStore(
    subjectsStore.subscribe,
    subjectsStore.getSnapshot,
    subjectsStore.getServerSnapshot
  );
}

export function addSubject(name, color) {
  const subject = { id: createId(), name, color };
  subjectsStore.set([...getSubjects(), subject]);
  return subject;
}

export function deleteSubject(id) {
  subjectsStore.set(getSubjects().filter((s) => s.id !== id));
}

export function getSessions() {
  return sessionsStore.getSnapshot();
}

export function useSessions() {
  return useSyncExternalStore(
    sessionsStore.subscribe,
    sessionsStore.getSnapshot,
    sessionsStore.getServerSnapshot
  );
}

export function addSession(session) {
  const entry = { id: createId(), ...session };
  sessionsStore.set([...getSessions(), entry]);
  return entry;
}

export function getPomodoroSettings() {
  return { ...DEFAULT_POMODORO_SETTINGS, ...pomodoroSettingsStore.getSnapshot() };
}

export function usePomodoroSettings() {
  const saved = useSyncExternalStore(
    pomodoroSettingsStore.subscribe,
    pomodoroSettingsStore.getSnapshot,
    pomodoroSettingsStore.getServerSnapshot
  );
  return { ...DEFAULT_POMODORO_SETTINGS, ...saved };
}

export function savePomodoroSettings(settings) {
  pomodoroSettingsStore.set(settings);
}
