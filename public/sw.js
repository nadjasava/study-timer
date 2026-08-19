const CACHE_NAME = "study-timer-v1";
const OFFLINE_URLS = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

function offlineFallbackResponse() {
  return new Response(
    `<!doctype html><html lang="sr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Study Timer</title></head>
<body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;
background:#0a0a0a;color:#fff;font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:24px">
<div><p style="font-size:15px;color:#898781;margin:0 0 12px">Nema internet konekcije.</p>
<button onclick="location.reload()" style="border:none;border-radius:999px;padding:10px 20px;
background:#c0392b;color:#fff;font-size:14px;font-weight:600">Pokušaj ponovo</button></div>
</body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

// Navigations go network-first (so the app never shows stale HTML while
// online) with a cache fallback for offline; hashed build assets are
// immutable, so they're cache-first once fetched once.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => {
          // A cache miss here used to fall through to `undefined`, which
          // respondWith() can't turn into a response — the browser showed
          // its own hard "This page couldn't load" error instead of ours.
          const cached = (await caches.match(request)) || (await caches.match("/"));
          return cached || offlineFallbackResponse();
        })
    );
    return;
  }

  if (request.url.includes("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || "Study Timer";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
