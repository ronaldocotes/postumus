"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Phone,
  CheckCircle,
  Clock,
  Navigation,
  User,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RouteStop {
  id: string;
  order: number;
  visited: boolean;
  visitedAt: string | null;
  latitude: number | null;
  longitude: number | null;
  client: {
    id: string;
    name: string;
    address: string;
    neighborhood: string;
    phone: string | null;
  };
}

interface CollectionRoute {
  id: string;
  date: string;
  status: string;
  collector: {
    id: string;
    name: string;
    zone: string | null;
  };
  stops: RouteStop[];
  stats: {
    total: number;
    visited: number;
    pending: number;
    progress: number;
  };
}

export default function AdminRoutesMobilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [routes, setRoutes] = useState<CollectionRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    loadRoutes();
    // Atualiza a cada 30 segundos
    const interval = setInterval(loadRoutes, 30000);
    return () => clearInterval(interval);
  }, [status]);

  async function loadRoutes() {
    try {
      const res = await fetch("/api/admin/routes");
      const data = await res.json();
      if (data.routes) {
        setRoutes(data.routes);
      }
    } catch (error) {
      console.error("Erro ao carregar rotas:", error);
    } finally {
      setLoading(false);
    }
  }

  const selectedRoute = routes[selectedRouteIndex];

  function nextRoute() {
    setSelectedRouteIndex((prev) => (prev + 1) % routes.length);
    setSelectedStop(null);
  }

  function prevRoute() {
    setSelectedRouteIndex((prev) => (prev - 1 + routes.length) % routes.length);
    setSelectedStop(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando rotas...</p>
        </div>
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin size={32} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Nenhuma rota ativa</h2>
          <p className="text-slate-600">Não há rotas de cobrança para hoje.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-blue-600 text-white sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">Acompanhamento</h1>
              <p className="text-sm text-blue-100">
                {format(new Date(), "EEEE, d MMM", { locale: ptBR })}
              </p>
            </div>
            <button
              onClick={loadRoutes}
              className="p-2 bg-blue-500 rounded-full active:bg-blue-400"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Seletor de Cobrador */}
      <div className="bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={prevRoute}
            className="p-2 text-slate-600 active:bg-slate-100 rounded-full"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User size={20} className="text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">{selectedRoute.collector.name}</h2>
                <p className="text-xs text-slate-500">{selectedRoute.collector.zone || "Sem zona"}</p>
              </div>
            </div>
            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {selectedRoute.stats.visited}/{selectedRoute.stats.total} visitados
            </div>
          </div>

          <button
            onClick={nextRoute}
            className="p-2 text-slate-600 active:bg-slate-100 rounded-full"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-3">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${selectedRoute.stats.progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-slate-500">
            <span>{selectedRoute.stats.progress}% concluído</span>
            <span>{selectedRoute.stats.pending} pendentes</span>
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="p-4 space-y-3">
        {selectedRoute.stops.map((stop, index) => (
          <div
            key={stop.id}
            onClick={() => setSelectedStop(selectedStop?.id === stop.id ? null : stop)}
            className={`bg-white rounded-xl border p-4 transition-all ${
              stop.visited ? "border-green-200 bg-green-50/30" : "border-slate-200"
            } ${selectedStop?.id === stop.id ? "ring-2 ring-blue-200" : ""}`}
          >
            <div className="flex items-start gap-3">
              {/* Status */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  stop.visited ? "bg-green-100" : "bg-slate-100"
                }`}
              >
                {stop.visited ? (
                  <CheckCircle size={20} className="text-green-600" />
                ) : (
                  <span className="font-bold text-slate-600">{stop.order}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 truncate">{stop.client.name}</h3>
                <p className="text-sm text-slate-500">{stop.client.neighborhood}</p>
                <p className="text-xs text-slate-400 truncate">{stop.client.address}</p>

                {/* Status e Hora */}
                <div className="mt-2 flex items-center gap-3">
                  <span
                    className={`text-xs font-medium ${
                      stop.visited ? "text-green-600" : "text-amber-600"
                    }`}
                  >
                    {stop.visited
                      ? `Visitado ${stop.visitedAt ? format(new Date(stop.visitedAt), "HH:mm") : ""}`
                      : "Pendente"}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações Expandidas */}
            {selectedStop?.id === stop.id && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-3">
                  {stop.client.phone && (
                    <>
                      <a
                        href={`tel:${stop.client.phone}`}
                        className="flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg font-medium"
                      >
                        <Phone size={18} />
                        Ligar
                      </a>
                      <a
                        href={`https://wa.me/55${stop.client.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg font-medium"
                      >
                        WhatsApp
                      </a>
                    </>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${stop.client.address}, ${stop.client.neighborhood}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 bg-indigo-50 text-indigo-700 rounded-lg font-medium col-span-full"
                  >
                    <Navigation size={18} />
                    Ver no Mapa
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Indicador de Rota */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-200">
        <div className="flex items-center gap-2">
          {routes.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full ${
                idx === selectedRouteIndex ? "bg-blue-600" : "bg-slate-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
