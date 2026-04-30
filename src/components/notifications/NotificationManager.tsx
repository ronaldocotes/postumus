"use client";

import { useEffect } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell } from "lucide-react";

export function NotificationManager() {
  const { isSupported, isSubscribed, subscribe, unsubscribe } =
    usePushNotifications();

  useEffect(() => {
    // Tenta registrar SW ao carregar
    if (isSupported && !isSubscribed) {
      // Pergunta ao usuário se quer ativar notificações
      // subscribe();
    }
  }, [isSupported, isSubscribed]);

  if (!isSupported) return null;

  return (
    <div className="fixed bottom-20 right-4 z-30">
      {!isSubscribed ? (
        <button
          onClick={subscribe}
          className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <Bell size={20} />
          <span className="text-sm font-medium">Ativar Notificações</span>
        </button>
      ) : (
        <button
          onClick={unsubscribe}
          className="p-3 bg-green-600 text-white rounded-full shadow-lg"
          title="Notificações ativas"
        >
          <Bell size={20} />
        </button>
      )}
    </div>
  );
}
