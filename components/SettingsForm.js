"use client";

import { savePomodoroSettings, usePomodoroSettings } from "@/lib/storage";

function SettingField({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 text-sm text-ink-secondary">
      {label}
      <input
        type="number"
        min="1"
        className="w-20 rounded-lg border border-border bg-white/[0.03] px-3 py-2 text-center text-ink outline-none focus:border-accent"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function ToggleField({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 text-sm text-ink-secondary">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-white/[0.12]"
        }`}
      >
        <span
          className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
        />
      </button>
    </label>
  );
}

export default function SettingsForm() {
  const settings = usePomodoroSettings();

  function handleChange(field, rawValue) {
    const value = Math.max(1, Number(rawValue) || 1);
    savePomodoroSettings({ ...settings, [field]: value });
  }

  function handleToggle(field, value) {
    savePomodoroSettings({ ...settings, [field]: value });
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-5 rounded-3xl border border-border bg-surface-card p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <SettingField
        label="Trajanje učenja (min)"
        value={settings.workMinutes}
        onChange={(v) => handleChange("workMinutes", v)}
      />
      <SettingField
        label="Kratka pauza (min)"
        value={settings.breakMinutes}
        onChange={(v) => handleChange("breakMinutes", v)}
      />
      <SettingField
        label="Duža pauza (min)"
        value={settings.longBreakMinutes}
        onChange={(v) => handleChange("longBreakMinutes", v)}
      />
      <SettingField
        label="Broj intervala pre duže pauze"
        value={settings.intervalsUntilLongBreak}
        onChange={(v) => handleChange("intervalsUntilLongBreak", v)}
      />
      <div className="border-t border-border pt-5">
        <ToggleField
          label="Automatski nastavi sledeću fazu"
          checked={settings.autoStartNextPhase}
          onChange={(v) => handleToggle("autoStartNextPhase", v)}
        />
      </div>
    </div>
  );
}
