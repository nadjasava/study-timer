"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { addExam, deleteExam, useExams, useSubjects } from "@/lib/storage";
import { daysUntil, formatDateDMY } from "@/lib/timeUtils";

const CONFIRM_DELETE_TIMEOUT_MS = 3000;
const ERROR_MESSAGE = "Nešto nije uspelo. Proveri konekciju i pokušaj ponovo.";

function countdownLabel(days) {
  if (days < 0) return { text: "Prošlo", tone: "muted" };
  if (days === 0) return { text: "Danas", tone: "urgent" };
  if (days === 1) return { text: "Sutra", tone: "urgent" };
  if (days <= 7) return { text: `Za ${days} dana`, tone: "soon" };
  return { text: `Za ${days} dana`, tone: "normal" };
}

const TONE_CLASSES = {
  muted: "text-ink-muted",
  urgent: "text-danger",
  soon: "text-accent",
  normal: "text-ink-secondary",
};

// The native date input's own text/icon rendering follows browser/OS locale
// and theme (mm/dd/yyyy on some desktops, unreadable dark-on-dark text on
// some Android builds), so it's kept only as the value holder + calendar
// UI, fully transparent, opened explicitly via showPicker() from a real
// visible button — some browsers silently refuse a bare click on a
// fully-transparent input (an anti-clickjacking protection), which is why
// just stacking it under a label and relying on click-through didn't work.
function DateInput({ value, onChange }) {
  const inputRef = useRef(null);

  function openPicker() {
    const el = inputRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      el.showPicker();
    } else {
      el.focus();
      el.click();
    }
  }

  return (
    <button
      type="button"
      onClick={openPicker}
      className="relative w-full rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-left focus:border-accent"
    >
      <span className={value ? "text-ink" : "text-ink-muted"}>
        {value ? formatDateDMY(value) : "Datum"}
      </span>
      <input
        ref={inputRef}
        type="date"
        tabIndex={-1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
      />
    </button>
  );
}

function ExamRow({ exam, subject, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const confirmTimeoutRef = useRef(null);
  const days = daysUntil(exam.examDate);
  const { text, tone } = countdownLabel(days);

  function handleDeleteClick() {
    if (confirming) {
      clearTimeout(confirmTimeoutRef.current);
      onDelete(exam.id);
      return;
    }
    setConfirming(true);
    confirmTimeoutRef.current = setTimeout(() => setConfirming(false), CONFIRM_DELETE_TIMEOUT_MS);
  }

  return (
    <li className="flex items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0">
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: subject?.color ?? "var(--color-ink-muted)" }}
        />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-ink">
            {subject?.name ?? "Obrisan predmet"}
            {exam.title && <span className="text-ink-muted"> ({exam.title})</span>}
          </span>
          <span className="truncate text-xs text-ink-muted">{formatDateDMY(exam.examDate)}</span>
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-3">
        <span className={`font-mono text-xs font-semibold tabular-nums ${TONE_CLASSES[tone]}`}>
          {text}
        </span>
        <button
          onClick={handleDeleteClick}
          aria-label={
            confirming
              ? `Potvrdi brisanje ispita iz ${subject?.name ?? "obrisanog predmeta"}`
              : `Obriši ispit iz ${subject?.name ?? "obrisanog predmeta"}`
          }
          className={`rounded-full text-xs font-medium transition-colors ${
            confirming
              ? "bg-danger px-2.5 py-1 text-white"
              : "p-1.5 text-ink-muted hover:bg-danger-wash hover:text-danger"
          }`}
        >
          {confirming ? "Potvrdi?" : "✕"}
        </button>
      </span>
    </li>
  );
}

export default function ExamManager() {
  const exams = useExams();
  const subjects = useSubjects();

  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [examDate, setExamDate] = useState("");
  const [error, setError] = useState("");

  const subjectById = Object.fromEntries(subjects.map((s) => [s.id, s]));

  async function handleAdd(e) {
    e.preventDefault();
    if (!subjectId || !examDate) return;
    const err = await addExam(subjectId, title.trim(), examDate);
    if (err) {
      setError(ERROR_MESSAGE);
      return;
    }
    setError("");
    setTitle("");
    setExamDate("");
  }

  async function handleDelete(id) {
    const err = await deleteExam(id);
    setError(err ? ERROR_MESSAGE : "");
  }

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 text-center text-sm text-ink-muted">
        <p>Prvo dodaj bar jedan predmet da bi mogla da zakažeš ispit.</p>
        <Link
          href="/subjects"
          className="rounded-full border border-accent/40 bg-accent-wash px-4 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
        >
          Dodaj predmet
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <form
        onSubmit={handleAdd}
        className="flex flex-col gap-5 rounded-3xl border border-border bg-surface-card p-8 shadow-2xl shadow-black/40 backdrop-blur-xl"
      >
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
        >
          <option value="" disabled>
            Izaberi predmet
          </option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id} className="bg-surface-page text-ink">
              {s.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Napomena (opciono)"
          className="rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-ink placeholder:text-ink-muted outline-none focus:border-accent"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <DateInput value={examDate} onChange={setExamDate} />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          disabled={!subjectId || !examDate}
        >
          Dodaj ispit
        </button>
      </form>

      <section className="rounded-2xl border border-border bg-surface-card p-6 backdrop-blur-xl">
        <h2 className="text-sm font-semibold text-ink">Predstojeći ispiti</h2>
        {exams.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">Nema zakazanih ispita.</p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-border">
            {exams.map((exam) => (
              <ExamRow
                key={exam.id}
                exam={exam}
                subject={subjectById[exam.subjectId]}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
