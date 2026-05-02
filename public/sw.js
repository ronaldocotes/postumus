// Service Worker - Posthumous PWA
// Cache name with version for easy updates

const CACHE_VERSION = "posthumous-v2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/mobile/gerente",
  "/mobile/cliente",
  "/manifest.json",
  "/logo-oficial.png",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/offline.html",
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS.filter(Boolean)))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name.startsWith("posthumous-") && name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== "GET" || url.protocol === "chrome-extension:") return;

  // API routes: network-first, no cache for POST/mutations
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // Next.js internals: network only
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(
      fetch(request).catch(() => new Response("", { status: 503 }))
    );
    return;
  }

  // Pages & assets: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    // Cache successful GET API responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({
        offline: true,
        error: "Sem conexão com a internet. Dados podem estar desatualizados.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // Return cached immediately if available, otherwise wait for network
  if (cached) {
    // Refresh in background
    fetchPromise.catch(() => {});
    return cached;
  }

  const networkResponse = await fetchPromise;
  if (networkResponse) return networkResponse;

  // Offline fallback page
  const offlineFallback = await caches.match("/offline.html");
  if (offlineFallback) return offlineFallback;

  return new Response(
    "<!DOCTYPE html><html lang='pt-BR'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Offline - Posthumous</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc;color:#334155}.card{background:white;border-radius:16px;padding:40px;text-align:center;max-width:380px;box-shadow:0 4px 24px rgba(0,0,0,.08)}h1{color:#4a6fa5;margin-top:0}p{color:#64748b}</style></head><body><div class='card'><h1>Sem Conexão</h1><p>Você está offline. Verifique sua conexão com a internet e tente novamente.</p><button onclick='location.reload()' style='background:#4a6fa5;color:white;border:none;padding:12px 24px;border-radius:8px;font-size:16px;cursor:pointer;margin-top:8px'>Tentar novamente</button></div></body></html>",
    {
      headers: { "Content-Type": "text/html" },
    }
  );
}

// ─── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); } catch { data = { title: "Posthumous", body: event.data.text() }; }

  const options = {
    body: data.body || "Nova notificação",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    tag: data.tag || "posthumous-notification",
    requireInteraction: false,
    data: data.data || {},
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Posthumous", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const existingWindow = clientList.find((c) => c.url.includes(targetUrl));
      if (existingWindow) return existingWindow.focus();
      return clients.openWindow(targetUrl);
    })
  );
});

// ─── Background Sync ──────────────────────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-payments") {
    event.waitUntil(syncPendingPayments());
  }
});

async function syncPendingPayments() {
  try {
    const db = await openDB();
    const tx = db.transaction("sync-queue", "readonly");
    const store = tx.objectStore("sync-queue");
    const requests = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    for (const req of requests) {
      try {
        const response = await fetch(req.url, {
          method: req.method,
          headers: req.headers,
          body: req.body,
        });
        if (response.ok) {
          const deleteTx = db.transaction("sync-queue", "readwrite");
          deleteTx.objectStore("sync-queue").delete(req.timestamp);
        }
      } catch {}
    }
  } catch {}
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("posthumous-offline", 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("sync-queue")) {
        db.createObjectStore("sync-queue", { keyPath: "timestamp" });
      }
    };
  });
}
