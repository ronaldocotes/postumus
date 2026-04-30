// Service Worker para notificações push e sincronização offline

const CACHE_NAME = "funeraria-v1";
const STATIC_ASSETS = [
  "/",
  "/cobranca",
  "/cobranca/pagamento",
  "/manifest.json",
];

// Instalação - cacheia assets estáticos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação - limpa caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Intercepta requisições
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // API calls - network first, cache fallback
  if (request.url.includes("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cacheia respostas GET
          if (request.method === "GET") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // Retorna do cache se offline
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            // Retorna resposta offline para POST
            if (request.method === "POST") {
              // Salva para sincronização posterior
              saveForSync(request);
              return new Response(
                JSON.stringify({
                  offline: true,
                  message: "Dados salvos. Serão sincronizados quando houver conexão.",
                }),
                {
                  headers: { "Content-Type": "application/json" },
                }
              );
            }
            return new Response("Offline", { status: 503 });
          });
        })
    );
    return;
  }

  // Static assets - cache first, network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, clone);
        });
        return response;
      });
    })
  );
});

// Recebe push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || "Nova notificação",
    icon: "/icon-192x192.png",
    badge: "/badge-72x72.png",
    tag: data.tag || "default",
    requireInteraction: true,
    actions: data.actions || [],
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Funeraria System", options)
  );
});

// Clique na notificação
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const { notification } = event;
  const { data } = notification;

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Abre ou foca janela existente
      for (const client of clientList) {
        if (client.url.includes("/cobranca") && "focus" in client) {
          return client.focus();
        }
      }
      // Abre nova janela
      if (clients.openWindow) {
        return clients.openWindow(data.url || "/cobranca");
      }
    })
  );
});

// Sincronização em background
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-payments") {
    event.waitUntil(syncPendingPayments());
  }
});

// Salva requisição para sincronização
async function saveForSync(request: Request) {
  const db = await openDB();
  const tx = db.transaction("sync-queue", "readwrite");
  const store = tx.objectStore("sync-queue");

  const body = await request.clone().text();
  await store.add({
    url: request.url,
    method: request.method,
    body,
    headers: Object.fromEntries(request.headers.entries()),
    timestamp: Date.now(),
  });
}

// Sincroniza pagamentos pendentes
async function syncPendingPayments() {
  const db = await openDB();
  const tx = db.transaction("sync-queue", "readonly");
  const store = tx.objectStore("sync-queue");
  const requests = await store.getAll();

  for (const req of requests) {
    try {
      const response = await fetch(req.url, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });

      if (response.ok) {
        // Remove do queue
        const deleteTx = db.transaction("sync-queue", "readwrite");
        await deleteTx.objectStore("sync-queue").delete(req.timestamp);

        // Notifica sucesso
        self.registration.showNotification("Sincronização", {
          body: "Pagamentos sincronizados com sucesso!",
          icon: "/icon-192x192.png",
        });
      }
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
    }
  }
}

// Abre IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("funeraria-offline", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("sync-queue")) {
        db.createObjectStore("sync-queue", { keyPath: "timestamp" });
      }
      if (!db.objectStoreNames.contains("routes-cache")) {
        db.createObjectStore("routes-cache", { keyPath: "id" });
      }
    };
  });
}
