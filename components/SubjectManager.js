"use client";

import { useState } from "react";
import { addSubject, deleteSubject, useSubjects } from "@/lib/storage";

const COLORS = [
  "var(--color-series-1)",
  "var(--color-series-2)",
  "var(--color-series-3)",
  "var(--color-series-4)",
  "var(--color-series-5)",
  "var(--color-series-6)",
  "var(--color-series-7)",
  "var(--color-series-8)",
];

export default function SubjectManager() {
  const subjects = useSubjects();
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  function handleAdd(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    addSubject(trimmed, color);
    setName("");
  }

  function handleDelete(id) {
    deleteSubject(id);
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-5 rounded-3xl border border-border bg-surface-card p-8 shadow-2xl shadow-black/40 backdrop-blur-xl"
      >
        <input
          type="text"
          placeholder="Naziv predmeta"
          className="rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-ink placeholder:text-ink-muted outline-none focus:border-accent"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex gap-2.5">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              aria-label={`Boja ${c}`}
              className="h-8 w-8 rounded-full ring-offset-2 ring-offset-surface-card transition-shadow"
              style={{
                backgroundColor: c,
                boxShadow: color === c ? "0 0 0 2px var(--color-ink)" : "none",
              }}
            />
          ))}
        </div>
        <button
          type="submit"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          disabled={!name.trim()}
        >
          Dodaj predmet
        </button>
      </form>

      {subjects.length === 0 ? (
        <p className="text-center text-sm text-ink-muted">Nema dodatih predmeta.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {subjects.map((s) => (
            <div
              key={s.id}
              className="group relative flex flex-col gap-3 rounded-2xl border border-border bg-surface-card p-5 backdrop-blur-xl transition-colors hover:border-border-strong"
            >
              <span
                className="h-8 w-8 rounded-full"
                style={{ backgroundColor: s.color, boxShadow: `0 0 24px -4px ${s.color}` }}
              />
              <span className="truncate text-sm font-medium text-ink">{s.name}</span>
              <button
                onClick={() => handleDelete(s.id)}
                aria-label={`Obriši ${s.name}`}
                className="absolute right-3 top-3 rounded-full p-1.5 text-ink-muted opacity-0 transition-opacity hover:bg-danger-wash hover:text-danger group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
