"use client";

import { useEffect, useRef, useState } from "react";
import { savePomodoroSettings, usePomodoroSettings } from "@/lib/storage";
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushSubscriptionState,
  isPushSupported,
} from "@/lib/pushNotifications";

const SAVE_DELAY_MS = 600;

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

const ERROR_MESSAGE = "Čuvanje nije uspelo. Proveri konekciju i pokušaj ponovo.";

export default function SettingsForm() {
  const remoteSettings = usePomodoroSettings();
  const [settings, setSettings] = useState(remoteSettings);
  // Tracks which remoteSettings value is already reflected in `settings`, so
  // a fresh fetch can be copied in during render (no flash of stale data)
  // instead of via an effect, which would cost an extra render pass.
  const [syncedRemoteSettings, setSyncedRemoteSettings] = useState(remoteSettings);
  const [error, setError] = useState("");
  const saveTimerRef = useRef(null);

  // "checking" | "unsupported" | "unsubscribed" | "subscribed"
  const [pushState, setPushState] = useState("checking");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState("");

  if (remoteSettings !== syncedRemoteSettings) {
    setSyncedRemoteSettings(remoteSettings);
    setSettings(remoteSettings);
  }

  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

  useEffect(() => {
    // isPushSupported() reads navigator/window, unavailable during SSR —
    // same reasoning as the hydration reads in Timer/SyncBanner.
    if (!isPushSupported()) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setPushState("unsupported");
      return;
    }
    getPushSubscriptionState().then(setPushState);
  }, []);

  async function handlePushToggle(next) {
    setPushBusy(true);
    setPushError("");
    if (next) {
      const { error: err } = await enablePushNotifications();
      if (err === "denied") {
        setPushError("Dozvola za notifikacije je odbijena — omogući je u podešavanjima browsera.");
        setPushState("unsubscribed");
      } else if (err) {
        setPushError("Nešto nije uspelo. Pokušaj ponovo.");
        setPushState("unsubscribed");
      } else {
        setPushState("subscribed");
      }
    } else {
      const { error: err } = await disablePushNotifications();
      setPushError(err ? "Nešto nije uspelo. Pokušaj ponovo." : "");
      setPushState("unsubscribed");
    }
    setPushBusy(false);
  }

  async function persist(next) {
    const err = await savePomodoroSettings(next);
    setError(err ? ERROR_MESSAGE : "");
  }

  function handleChange(field, rawValue) {
    const value = Math.max(1, Number(rawValue) || 1);
    const next = { ...settings, [field]: value };
    setSettings(next);
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => persist(next), SAVE_DELAY_MS);
  }

  function handleToggle(field, value) {
    const next = { ...settings, [field]: value };
    setSettings(next);
    clearTimeout(saveTimerRef.current);
    persist(next);
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
      {error && <p className="text-sm text-danger">{error}</p>}

      {(pushState === "subscribed" || pushState === "unsubscribed") && (
        <div className="border-t border-border pt-5">
          <ToggleField
            label="Notifikacije na ovom uređaju"
            checked={pushState === "subscribed"}
            onChange={(v) => !pushBusy && handlePushToggle(v)}
          />
          {pushError && <p className="mt-2 text-sm text-danger">{pushError}</p>}
        </div>
      )}
    </div>
  );
}
