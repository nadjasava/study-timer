"use client";

import { useRef, useState } from "react";
import Popover from "./Popover";

function ChevronIcon() {
  return (
    <svg
      className="pointer-events-none h-3.5 w-3.5 shrink-0 text-ink-muted"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// A self-drawn dropdown standing in for a native <select> — the native one
// opens as OS chrome (a gray system sheet/list) that page CSS can't reach,
// so this is the only way to make it look like the rest of the app.
export default function Dropdown({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const selected = options.find((o) => o.value === value);

  return (
    <div className="w-full">
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-left text-sm text-ink outline-none transition-colors focus:border-accent"
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.color && (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: selected.color }}
            />
          )}
          <span className={`truncate ${selected ? "text-ink" : "text-ink-muted"}`}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronIcon />
      </button>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} matchWidth>
        <ul
          role="listbox"
          className="max-h-60 overflow-y-auto rounded-xl border border-border bg-surface-page py-1.5 shadow-2xl shadow-black/40"
        >
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors ${
                  o.value === value ? "bg-accent-wash text-accent" : "text-ink hover:bg-white/[0.06]"
                }`}
              >
                {o.color && (
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: o.color }}
                  />
                )}
                <span className="truncate">{o.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </Popover>
    </div>
  );
}
