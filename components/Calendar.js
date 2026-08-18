"use client";

import { useState } from "react";

const WEEKDAY_LABELS = ["P", "U", "S", "Č", "P", "S", "N"];
const MONTH_LABELS = [
  "Januar",
  "Februar",
  "Mart",
  "April",
  "Maj",
  "Jun",
  "Jul",
  "Avgust",
  "Septembar",
  "Oktobar",
  "Novembar",
  "Decembar",
];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toISODate(y, m, d) {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// A self-drawn month-view calendar standing in for the native
// <input type="date"> picker — the native one is OS chrome that page CSS
// can't restyle, so this is the only way to make it match the app's theme.
export default function Calendar({ value, onChange }) {
  const initial = value ? new Date(`${value}T00:00:00`) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const startWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  return (
    <div className="w-64 rounded-xl border border-border bg-surface-page p-3 shadow-2xl shadow-black/40">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrevMonth}
          aria-label="Prethodni mesec"
          className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-white/[0.08] hover:text-ink"
        >
          <ChevronLeftIcon />
        </button>
        <span className="text-sm font-medium text-ink">
          {MONTH_LABELS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={goNextMonth}
          aria-label="Sledeći mesec"
          className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-white/[0.08] hover:text-ink"
        >
          <ChevronRightIcon />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-ink-muted">
        {WEEKDAY_LABELS.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <span key={i} />;
          const iso = toISODate(viewYear, viewMonth, d);
          const isSelected = iso === value;
          return (
            <button
              type="button"
              key={i}
              onClick={() => onChange(iso)}
              className={`h-8 w-8 rounded-full text-sm transition-colors ${
                isSelected ? "bg-accent text-white" : "text-ink hover:bg-white/[0.08]"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
