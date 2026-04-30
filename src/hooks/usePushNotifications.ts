"use client";

import { useState, useEffect, useCallback } from "react";

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  error: string | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    subscription: null,
    error: null,
  });

  // Verifica suporte
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isSupported =
      "serviceWorker" in navigator && "PushManager" in window;

    setState((prev) => ({ ...prev, isSupported }));

    if (isSupported) {
      checkSubscription();
    }
  }, []);

  // Registra service worker
  const registerServiceWorker = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registrado:", registration);
      return registration;
    } catch (error) {
      console.error("Erro ao registrar Service Worker:", error);
      setState((prev) => ({
        ...prev,
        error: "Erro ao registrar Service Worker",
      }));
      return null;
    }
  }, []);

  // Verifica subscription existente
  const checkSubscription = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      setState((prev) => ({
        ...prev,
        isSubscribed: !!subscription,
        subscription: subscription || null,
      }));

      return subscription;
    } catch (error) {
      console.error("Erro ao verificar subscription:", error);
      return null;
    }
  }, []);

  // Solicita permissão e subscribe
  const subscribe = useCallback(async () => {
    try {
      // Registra SW se ainda não estiver registrado
      let registration: ServiceWorkerRegistration | null = await navigator.serviceWorker.ready;
      if (!registration) {
        registration = await registerServiceWorker();
      }

      if (!registration) {
        throw new Error("Service Worker não registrado");
      }

      // Solicita permissão
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Permissão negada para notificações");
      }

      // Busca VAPID key do servidor
      const res = await fetch("/api/push/vapid-public-key");
      const { publicKey } = await res.json();

      // Subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as any,
      });

      // Envia subscription para o servidor
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription,
          userId: (await getSession())?.user?.id,
        }),
      });

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        subscription,
        error: null,
      }));

      return subscription;
    } catch (error: any) {
      console.error("Erro ao subscrever:", error);
      setState((prev) => ({
        ...prev,
        error: error.message,
      }));
      return null;
    }
  }, [registerServiceWorker]);

  // Unsubscribe
  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Notifica servidor
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
      }));

      return true;
    } catch (error: any) {
      console.error("Erro ao cancelar subscription:", error);
      setState((prev) => ({
        ...prev,
        error: error.message,
      }));
      return false;
    }
  }, []);

  // Envia notificação local
  const showNotification = useCallback(
    async (title: string, options?: NotificationOptions) => {
      if (!state.isSupported) return;

      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: "/icon-192x192.png",
        badge: "/badge-72x72.png",
        ...options,
      });
    },
    [state.isSupported]
  );

  return {
    ...state,
    subscribe,
    unsubscribe,
    showNotification,
    registerServiceWorker,
  };
}

// Helper: Converte base64 para Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// Helper: Pega sessão
async function getSession() {
  try {
    const res = await fetch("/api/auth/session");
    return await res.json();
  } catch {
    return null;
  }
}
