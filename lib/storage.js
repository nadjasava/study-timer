"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { flushSessionQueue, getPendingSessionCount, queueSession } from "./offlineQueue";

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

function rowToExam(row) {
  return {
    id: row.id,
    subjectId: row.subject_id,
    title: row.title,
    examDate: row.exam_date,
  };
}

function rowToActiveTimer(row) {
  if (!row) return null;
  return {
    subjectId: row.subject_id,
    phase: row.phase,
    phaseEndAt: row.phase_end_at ? new Date(row.phase_end_at).getTime() : null,
    remainingSeconds: row.remaining_seconds,
    isRunning: row.is_running,
    completedCount: row.completed_count,
    sessionStart: row.session_start,
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

const examsResource = createResource(async () => {
  const { data, error } = await supabase
    .from("exams")
    .select("*")
    .order("exam_date", { ascending: true });
  return error ? [] : data.map(rowToExam);
}, []);

export function clearCaches() {
  subjectsResource.reset();
  sessionsResource.reset();
  settingsResource.reset();
  examsResource.reset();
}

export function useSubjects() {
  return subjectsResource.useValue();
}

export async function addSubject(name, color) {
  const { error } = await supabase.from("subjects").insert({ name, color });
  if (!error) await subjectsResource.refresh();
  return error;
}

export async function deleteSubject(id) {
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (!error) await subjectsResource.refresh();
  return error;
}

export async function updateSubject(id, { name, color }) {
  const { error } = await supabase.from("subjects").update({ name, color }).eq("id", id);
  if (!error) await subjectsResource.refresh();
  return error;
}

export function useSessions() {
  return sessionsResource.useValue();
}

function insertSessionRow(payload) {
  return supabase.from("sessions").insert(payload);
}

// A failed insert (typically no network) goes into a local queue instead of
// being dropped, so a completed pomodoro survives a dead connection.
export async function addSession(session) {
  const payload = {
    subject_id: session.subjectId,
    mode: session.mode,
    start_time: session.startTime,
    end_time: session.endTime,
    duration_seconds: session.durationSeconds,
    date: session.date,
  };
  const { error } = await insertSessionRow(payload);
  if (!error) {
    await sessionsResource.refresh();
    return;
  }
  queueSession(payload);
}

export { getPendingSessionCount };

export async function syncPendingSessions() {
  const remaining = await flushSessionQueue(insertSessionRow);
  if (remaining !== undefined) await sessionsResource.refresh();
  return remaining;
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
  return error;
}

export function useExams() {
  return examsResource.useValue();
}

export async function addExam(subjectId, title, examDate) {
  const { error } = await supabase
    .from("exams")
    .insert({ subject_id: subjectId, title, exam_date: examDate });
  if (!error) await examsResource.refresh();
  return error;
}

export async function deleteExam(id) {
  const { error } = await supabase.from("exams").delete().eq("id", id);
  if (!error) await examsResource.refresh();
  return error;
}

export async function updateExam(id, { subjectId, title, examDate }) {
  const { error } = await supabase
    .from("exams")
    .update({ subject_id: subjectId, title, exam_date: examDate })
    .eq("id", id);
  if (!error) await examsResource.refresh();
  return error;
}

export async function fetchActiveTimer() {
  const { data, error } = await supabase.from("active_timer").select("*").maybeSingle();
  return error ? null : rowToActiveTimer(data);
}

// Fire-and-forget: the timer already has a local (localStorage) source of
// truth for its own device, so a failed push here just means other devices
// won't see this update — not something to surface as an error to the user.
export async function pushActiveTimer(state) {
  await supabase.from("active_timer").upsert(
    {
      subject_id: state.subjectId || null,
      phase: state.phase,
      phase_end_at: state.phaseEndAt ? new Date(state.phaseEndAt).toISOString() : null,
      remaining_seconds: state.remainingSeconds ?? null,
      is_running: state.isRunning,
      completed_count: state.completedCount,
      session_start: state.sessionStart,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

// Subscribes to changes made from any other signed-in device; RLS scopes
// the Postgres changes feed to the current user's own row already.
export function subscribeActiveTimer(onChange) {
  const channel = supabase
    .channel("active_timer_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "active_timer" },
      (payload) => onChange(rowToActiveTimer(payload.new))
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export async function savePushSubscription(subscription) {
  const json = subscription.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    { onConflict: "endpoint" }
  );
  return error;
}

export async function deletePushSubscriptionByEndpoint(endpoint) {
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return error;
}
