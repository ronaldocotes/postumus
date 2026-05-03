// Offline queue for cobrador payments using IndexedDB
// Works with the existing Background Sync in sw.js (tag: "sync-payments")

interface QueuedPayment {
  timestamp: number;
  installmentId: string;
  paymentMethod: string;
  latitude?: number;
  longitude?: number;
  clientName: string;
  valor: number;
}

const DB_NAME = "posthumous-offline";
const DB_VERSION = 3;
const STORE_NAME = "sync-queue";
const CACHE_STORE = "client-cache";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "timestamp" });
      }
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: "key" });
      }
    };
  });
}

// Client cache for offline
export async function cacheClients(key: string, data: any): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(CACHE_STORE, "readwrite");
  const store = tx.objectStore(CACHE_STORE);

  await new Promise<void>((resolve, reject) => {
    const req = store.put({ key, data, timestamp: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getCachedClients(key: string): Promise<any | null> {
  const db = await openDB();
  const tx = db.transaction(CACHE_STORE, "readonly");
  const store = tx.objectStore(CACHE_STORE);

  return new Promise((resolve, reject) => {
    const req = store.get(key);
    req.onsuccess = () => {
      const result = req.result;
      if (result && Date.now() - result.timestamp < 24 * 60 * 60 * 1000) {
        resolve(result.data);
      } else {
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function queuePayment(data: Omit<QueuedPayment, "timestamp">): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  const payload = {
    timestamp: Date.now(),
    url: "/api/cobrador/registrar",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      installmentId: data.installmentId,
      paymentMethod: data.paymentMethod,
      latitude: data.latitude,
      longitude: data.longitude,
    }),
    // Keep original data for UI display
    _meta: {
      clientName: data.clientName,
      valor: data.valor,
      paymentMethod: data.paymentMethod,
    },
  };

  await new Promise<void>((resolve, reject) => {
    const req = store.put(payload);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  // Request background sync
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register("sync-payments");
    } catch (e) {
      console.warn("Background sync not available:", e);
    }
  }
}

export async function getQueuedPayments(): Promise<Array<QueuedPayment & { timestamp: number }>> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);

  const all = await new Promise<any[]>((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  return all
    .filter((item) => item._meta)
    .map((item) => ({
      timestamp: item.timestamp,
      installmentId: item._meta.installmentId || "",
      paymentMethod: item._meta.paymentMethod || "",
      clientName: item._meta.clientName || "",
      valor: item._meta.valor || 0,
    }));
}

export async function removeQueuedPayment(timestamp: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  await new Promise<void>((resolve, reject) => {
    const req = store.delete(timestamp);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export function isOnline(): boolean {
  return navigator.onLine;
}
