"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "study-timer:install-dismissed";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // localStorage isn't available during SSR, so this can only be read
    // after mount — same reasoning as the hydration reads in Timer/SyncBanner.
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setDismissed(localStorage.getItem(DISMISSED_KEY) === "1");

    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    function handleAppInstalled() {
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  async function handleInstall() {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  if (!deferredPrompt || dismissed) return null;

  return (
    <div className="flex items-center justify-center gap-3 border-b border-border bg-accent-wash px-6 py-2 text-center text-xs text-ink-secondary">
      <span>Instaliraj Study Timer kao aplikaciju na uređaju.</span>
      <button
        onClick={handleInstall}
        className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        Instaliraj
      </button>
      <button
        onClick={handleDismiss}
        aria-label="Zatvori"
        className="shrink-0 text-ink-muted transition-colors hover:text-ink"
      >
        ✕
      </button>
    </div>
  );
}
