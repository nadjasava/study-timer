"use client";

const QUEUE_KEY = "study-timer:pending-sessions";
const QUEUE_CHANGED_EVENT = "study-timer:queue-changed";

function readQueue() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY)) || [];
  } catch {
    return [];
  }
}

function writeQueue(queue) {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new Event(QUEUE_CHANGED_EVENT));
}

export function onQueueChanged(listener) {
  window.addEventListener(QUEUE_CHANGED_EVENT, listener);
  return () => window.removeEventListener(QUEUE_CHANGED_EVENT, listener);
}

export function queueSession(payload) {
  const queue = readQueue();
  queue.push(payload);
  writeQueue(queue);
}

export function getPendingSessionCount() {
  return readQueue().length;
}

// Tries to insert every queued session again; whatever still fails (still
// offline, or a fresh error) stays queued for the next attempt.
export async function flushSessionQueue(insertFn) {
  const queue = readQueue();
  if (queue.length === 0) return 0;

  const remaining = [];
  for (const payload of queue) {
    const { error } = await insertFn(payload);
    if (error) remaining.push(payload);
  }
  writeQueue(remaining);
  return remaining.length;
}
