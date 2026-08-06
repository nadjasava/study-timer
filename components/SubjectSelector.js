"use client";

import { useSubjects } from "@/lib/storage";

export default function SubjectSelector({ value, onChange }) {
  const subjects = useSubjects();

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 text-center text-sm text-ink-muted">
        <p>Nemaš nijedan predmet.</p>
        <a
          href="/subjects"
          className="rounded-full border border-accent/40 bg-accent-wash px-4 py-1.5 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
        >
          Dodaj predmet
        </a>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[220px]">
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-full border border-border bg-white/[0.03] px-4 py-2 pr-9 text-sm text-ink outline-none focus:border-accent"
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
      <svg
        className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
