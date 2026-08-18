"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Registering in dev would cache-first-serve stale build chunks across
    // hot reloads (Turbopack doesn't hash them per save), masking edits —
    // so only run the service worker against a real production build.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
