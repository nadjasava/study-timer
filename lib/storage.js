"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const DEFAULT_POMODORO_SETTINGS = {
  workMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  intervalsUntilLongBreak: 4,
  autoStartNextPhase: true,
};

function rowToSession(row) {
  return {
    id: row.id,
    subjectId: row.subject_id,
    mode: row.mode,
    startTime: row.start_time,
    endTime: row.end_time,
    durationSeconds: row.duration_seconds,
    date: row.date,
  };
}

function rowToSettings(row) {
  if (!row) return DEFAULT_POMODORO_SETTINGS;
  return {
    workMinutes: row.work_minutes,
    breakMinutes: row.break_minutes,
    longBreakMinutes: row.long_break_minutes,
    intervalsUntilLongBreak: row.intervals_until_long_break,
    autoStartNextPhase: row.auto_start_next_phase,
  };
}

// Module-level cache + listener set per resource, mirroring the previous
// useSyncExternalStore stores — but refresh() is now an async Supabase call,
// so state updates happen inside .then() (an async boundary), never
// synchronously in an effect body.
function createResource(fetcher, initialValue) {
  let cache = initialValue;
  const listeners = new Set();

  function notify() {
    listeners.forEach((listener) => listener(cache));
  }

  async function refresh() {
    const value = await fetcher();
    cache = value;
    notify();
    return cache;
  }

  function useValue() {
    const [value, setValue] = useState(cache);
    useEffect(() => {
      listeners.add(setValue);
      refresh();
      return () => listeners.delete(setValue);
    }, []);
    return value;
  }

  function reset() {
    cache = initialValue;
    notify();
  }

  return { refresh, useValue, reset, get: () => cache };
}

const subjectsResource = createResource(async () => {
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .order("created_at", { ascending: true });
  return error ? [] : data;
}, []);

const sessionsResource = createResource(async () => {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("start_time", { ascending: true });
  return error ? [] : data.map(rowToSession);
}, []);

const settingsResource = createResource(async () => {
  const { data } = await supabase.from("pomodoro_settings").select("*").maybeSingle();
  return rowToSettings(data);
}, DEFAULT_POMODORO_SETTINGS);

export function clearCaches() {
  subjectsResource.reset();
  sessionsResource.reset();
  settingsResource.reset();
}

export function useSubjects() {
  return subjectsResource.useValue();
}

export async function addSubject(name, color) {
  const { error } = await supabase.from("subjects").insert({ name, color });
  if (!error) await subjectsResource.refresh();
}

export async function deleteSubject(id) {
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (!error) await subjectsResource.refresh();
}

export function useSessions() {
  return sessionsResource.useValue();
}

export async function addSession(session) {
  const { error } = await supabase.from("sessions").insert({
    subject_id: session.subjectId,
    mode: session.mode,
    start_time: session.startTime,
    end_time: session.endTime,
    duration_seconds: session.durationSeconds,
    date: session.date,
  });
  if (!error) await sessionsResource.refresh();
}

export function usePomodoroSettings() {
  return settingsResource.useValue();
}

export async function savePomodoroSettings(settings) {
  const { error } = await supabase.from("pomodoro_settings").upsert(
    {
      work_minutes: settings.workMinutes,
      break_minutes: settings.breakMinutes,
      long_break_minutes: settings.longBreakMinutes,
      intervals_until_long_break: settings.intervalsUntilLongBreak,
      auto_start_next_phase: settings.autoStartNextPhase,
    },
    { onConflict: "user_id" }
  );
  if (!error) await settingsResource.refresh();
}
