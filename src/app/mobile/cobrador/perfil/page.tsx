"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/cobrador/BottomNav";
import { getQueuedPayments, removeQueuedPayment, isOnline } from "@/lib/offline-queue";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function CobradorPerfilPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [todayStats, setTodayStats] = useState<{ cobrados: number; total: number } | null>(null);
  const [queuedCount, setQueuedCount] = useState(0);
  const [queuedTotal, setQueuedTotal] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/mobile/cobrador/perfil");
    }
  }, [status, router]);

  useEffect(() => {
    const handler = () => setOffline(!navigator.onLine);
    window.addEventListener("online", handler);
    window.addEventListener("offline", handler);
    setOffline(!navigator.onLine);
    return () => {
      window.removeEventListener("online", handler);
      window.removeEventListener("offline", handler);
    };
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTodayStats();
      loadQueuedPayments();
    }
  }, [status]);

  // Refresh queued payments when coming back online
  useEffect(() => {
    if (!offline) {
      loadQueuedPayments();
    }
  }, [offline]);

  const fetchTodayStats = async () => {
    try {
      const res = await fetch("/api/cobrador/hoje");
      if (!res.ok) return;
      const data = await res.json();
      setTodayStats({ cobrados: 0, total: data.total || 0 });
    } catch (e) {
      console.error(e);
    }
  };

  const loadQueuedPayments = async () => {
    try {
      const queued = await getQueuedPayments();
      setQueuedCount(queued.length);
      setQueuedTotal(queued.reduce((acc, q) => acc + q.valor, 0));
    } catch {
      setQueuedCount(0);
      setQueuedTotal(0);
    }
  };

  const handleSyncNow = async () => {
    if (!isOnline()) {
      alert("Você está offline. Conecte-se à internet para sincronizar.");
      return;
    }
    setSyncing(true);
    try {
      const queued = await getQueuedPayments();
      for (const payment of queued) {
        try {
          const res = await fetch("/api/cobrador/registrar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              installmentId: payment.installmentId,
              paymentMethod: payment.paymentMethod,
              latitude: payment.latitude,
              longitude: payment.longitude,
            }),
          });
          if (res.ok) {
            await removeQueuedPayment(payment.timestamp);
          }
        } catch (e) {
          console.error("Erro ao sincronizar pagamento:", e);
        }
      }
      await loadQueuedPayments();
      alert("Sincronização concluída!");
    } catch (e) {
      alert("Erro na sincronização");
    } finally {
      setSyncing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const user = session?.user as any;
  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()
    : "CB";

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header with avatar */}
        <div className="bg-blue-600 text-white px-4 pt-12 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-bold">{user?.name || "Cobrador"}</h1>
              <p className="text-blue-200 text-sm">{user?.email || ""}</p>
              <span className="inline-block mt-1 bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                {user?.role || "COBRADOR"}
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400 uppercase font-semibold">Clientes Hoje</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {todayStats ? todayStats.total : "—"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">com vencimento</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-400 uppercase font-semibold">Função</p>
              <p className="text-sm font-bold text-gray-900 mt-2">
                {user?.role || "—"}
              </p>
            </div>
          </div>

          {/* Offline sync card */}
          {queuedCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                    <path d="M1 4v6h6" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  <p className="text-amber-800 font-bold text-sm">Pagamentos pendentes</p>
                </div>
                <span className="bg-amber-200 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">{queuedCount}</span>
              </div>
              <p className="text-amber-700 text-sm mb-3">
                Total: {fmt(queuedTotal)}
              </p>
              <button
                onClick={handleSyncNow}
                disabled={syncing || offline}
                className="w-full bg-amber-500 active:bg-amber-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                style={{ minHeight: "44px" }}
              >
                {syncing ? "Sincronizando..." : offline ? "Aguardando conexão" : "Sincronizar agora"}
              </button>
            </div>
          )}

          {/* Info card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase">Informações</p>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-600">Nome</span>
                <span className="text-sm font-medium text-gray-900">{user?.name || "—"}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-600">Função</span>
                <span className="text-sm font-medium text-gray-900">{user?.role || "—"}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-600">Email</span>
                <span className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                  {user?.email || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              <a
                href="/mobile/cobrador"
                className="flex items-center justify-between px-4 py-3 active:bg-gray-50"
              >
                <span className="text-sm text-gray-700 font-medium">Cobranças de Hoje</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>
              <a
                href="/mobile/cobrador/clientes"
                className="flex items-center justify-between px-4 py-3 active:bg-gray-50"
              >
                <span className="text-sm text-gray-700 font-medium">Lista de Clientes</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>
              <a
                href="/mobile/cobrador/mapa"
                className="flex items-center justify-between px-4 py-3 active:bg-gray-50"
              >
                <span className="text-sm text-gray-700 font-medium">Mapa de Cobranças</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full bg-red-50 border border-red-200 text-red-600 font-bold py-3.5 rounded-2xl text-base active:bg-red-100 transition-colors"
            style={{ minHeight: "52px" }}
          >
            Sair da Conta
          </button>
        </div>
        <div className="h-4" />
      </div>

      <BottomNav />
    </>
  );
}
