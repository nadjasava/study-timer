"use client";

import { useEffect, useState } from "react";
import { getPendingSessionCount, syncPendingSessions } from "@/lib/storage";
import { onQueueChanged } from "@/lib/offlineQueue";

export default function SyncBanner() {
  const [offline, setOffline] = useState(false);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    // navigator.onLine and the queued-session count aren't available during
    // SSR, so the real values can only be read after mount — the server and
    // the client's first render must agree, and only this pass may diverge.
    /* eslint-disable react-hooks/set-state-in-effect */
    setOffline(!navigator.onLine);
    setPending(getPendingSessionCount());
    /* eslint-enable react-hooks/set-state-in-effect */

    async function trySync() {
      await syncPendingSessions();
      setPending(getPendingSessionCount());
    }

    function handleOnline() {
      setOffline(false);
      trySync();
    }
    function handleOffline() {
      setOffline(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    const unsubscribe = onQueueChanged(() => setPending(getPendingSessionCount()));
    trySync();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
    };
  }, []);

  if (!offline && pending === 0) return null;

  return (
    <div className="border-b border-border bg-surface-page px-6 py-2 text-center text-xs text-ink-muted">
      {offline
        ? "Nema interneta — podaci se čuvaju na uređaju dok se veza ne vrati."
        : `Sinhronizacija u toku — ${pending} ${pending === 1 ? "sesija čeka" : "sesije čekaju"}...`}
    </div>
  );
}
