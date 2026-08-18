"use client";

import { useRef, useState } from "react";
import { addSubject, deleteSubject, updateSubject, useSubjects } from "@/lib/storage";

const COLORS = [
  "var(--color-series-1)",
  "var(--color-series-2)",
  "var(--color-series-3)",
  "var(--color-series-4)",
  "var(--color-series-5)",
  "var(--color-series-6)",
  "var(--color-series-7)",
  "var(--color-series-8)",
  "var(--color-series-9)",
];

const CONFIRM_DELETE_TIMEOUT_MS = 3000;

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-nowrap gap-1.5 overflow-x-auto sm:gap-2.5">
      {COLORS.map((c) => (
        <button
          type="button"
          key={c}
          onClick={() => onChange(c)}
          aria-label={`Boja ${c}`}
          className="h-7 w-7 shrink-0 rounded-full ring-offset-2 ring-offset-surface-card transition-shadow sm:h-8 sm:w-8"
          style={{
            backgroundColor: c,
            boxShadow: value === c ? "0 0 0 2px var(--color-ink)" : "none",
          }}
        />
      ))}
    </div>
  );
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function SubjectCard({ subject, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const confirmTimeoutRef = useRef(null);

  function handleDeleteClick() {
    if (confirming) {
      clearTimeout(confirmTimeoutRef.current);
      onDelete(subject.id);
      return;
    }
    setConfirming(true);
    confirmTimeoutRef.current = setTimeout(() => setConfirming(false), CONFIRM_DELETE_TIMEOUT_MS);
  }

  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl border border-border bg-surface-card p-5 backdrop-blur-xl transition-colors hover:border-border-strong">
      <span
        className="h-8 w-8 rounded-full"
        style={{ backgroundColor: subject.color, boxShadow: `0 0 24px -4px ${subject.color}` }}
      />
      <span className="truncate text-sm font-medium text-ink">{subject.name}</span>

      <div className="absolute right-3 top-3 flex items-center gap-1">
        <button
          onClick={() => onEdit(subject)}
          aria-label={`Izmeni ${subject.name}`}
          className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-white/[0.08] hover:text-ink"
        >
          <PencilIcon />
        </button>
        <button
          onClick={handleDeleteClick}
          aria-label={confirming ? `Potvrdi brisanje ${subject.name}` : `Obriši ${subject.name}`}
          className={`rounded-full text-xs font-medium transition-colors ${
            confirming
              ? "bg-danger px-2.5 py-1 text-white"
              : "p-1.5 text-ink-muted hover:bg-danger-wash hover:text-danger"
          }`}
        >
          {confirming ? "Potvrdi?" : "✕"}
        </button>
      </div>
    </div>
  );
}

const ERROR_MESSAGE = "Nešto nije uspelo. Proveri konekciju i pokušaj ponovo.";

export default function SubjectManager() {
  const subjects = useSubjects();
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(COLORS[0]);

  async function handleAdd(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const err = await addSubject(trimmed, color);
    if (err) {
      setError(ERROR_MESSAGE);
      return;
    }
    setError("");
    setName("");
  }

  async function handleDelete(id) {
    const err = await deleteSubject(id);
    if (err) {
      setError(ERROR_MESSAGE);
      return;
    }
    setError("");
    if (editingId === id) setEditingId(null);
  }

  function startEdit(subject) {
    setEditingId(subject.id);
    setEditName(subject.name);
    setEditColor(subject.color);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(e) {
    e.preventDefault();
    const trimmed = editName.trim();
    if (!trimmed) return;
    const err = await updateSubject(editingId, { name: trimmed, color: editColor });
    if (err) {
      setError(ERROR_MESSAGE);
      return;
    }
    setError("");
    setEditingId(null);
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
        <ColorPicker value={color} onChange={setColor} />
        {error && <p className="text-sm text-danger">{error}</p>}
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
          {subjects.map((s) =>
            editingId === s.id ? (
              <form
                key={s.id}
                onSubmit={saveEdit}
                className="flex flex-col gap-3 rounded-2xl border border-accent/50 bg-surface-card p-5 backdrop-blur-xl"
              >
                <input
                  type="text"
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="rounded-lg border border-border bg-white/[0.03] px-3 py-1.5 text-sm text-ink outline-none focus:border-accent"
                />
                <ColorPicker value={editColor} onChange={setEditColor} />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={!editName.trim()}
                    className="flex-1 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Sačuvaj
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
                  >
                    Otkaži
                  </button>
                </div>
              </form>
            ) : (
              <SubjectCard key={s.id} subject={s} onEdit={startEdit} onDelete={handleDelete} />
            )
          )}
        </div>
      )}
    </div>
  );
}
