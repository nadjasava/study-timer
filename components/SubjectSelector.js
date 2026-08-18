"use client";

import { useSubjects } from "@/lib/storage";
import Dropdown from "./Dropdown";

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
    <div className="w-full max-w-[220px]">
      <Dropdown
        value={value}
        onChange={onChange}
        placeholder="Izaberi predmet"
        options={subjects.map((s) => ({ value: s.id, label: s.name, color: s.color }))}
      />
    </div>
  );
}
