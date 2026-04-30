"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  CheckCircle,
  Clock,
  Navigation,
  User,
} from "lucide-react";
import { format } from "date-fns";

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

export default function RotasPage() {
  const { status } = useSession();
  const router = useRouter();
  const [routes, setRoutes] = useState<CollectionRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<CollectionRoute | null>(null);

  const loadRoutes = async () => {
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
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    loadRoutes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function getStatusIcon(visited: boolean) {
    if (visited) {
      return <CheckCircle size={20} className="text-green-500" />;
    }
    return <Clock size={20} className="text-amber-500" />;
  }

  function getStatusText(stop: RouteStop) {
    if (stop.visited) {
      return `Visitado às ${stop.visitedAt ? format(new Date(stop.visitedAt), "HH:mm") : ""}`;
    }
    return "Pendente";
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando rotas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rotas de Cobrança</h1>
          <p className="text-slate-500">Acompanhe o desempenho das rotas de cobrança</p>
        </div>
      </div>

      {routes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin size={32} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Nenhuma rota ativa</h2>
          <p className="text-slate-600">Não há rotas de cobrança para hoje.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de Rotas */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Cobradores em Rota</h2>
            
            {routes.map((route) => (
              <div
                key={route.id}
                onClick={() => setSelectedRoute(route)}
                className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
                  selectedRoute?.id === route.id
                    ? "border-blue-500 ring-2 ring-blue-100"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{route.collector.name}</h3>
                      <p className="text-sm text-slate-500">{route.collector.zone || "Sem zona"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {route.stats.visited}/{route.stats.total}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Progresso</span>
                    <span className="font-medium text-slate-900">{route.stats.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${route.stats.progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex gap-4 text-sm">
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle size={16} />
                    <span>{route.stats.visited} visitados</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-600">
                    <Clock size={16} />
                    <span>{route.stats.pending} pendentes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detalhes da Rota Selecionada */}
          <div>
            {selectedRoute ? (
              <div className="bg-white rounded-xl border border-slate-200 sticky top-24">
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">
                        Rota de {selectedRoute.collector.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {selectedRoute.stats.visited} de {selectedRoute.stats.total} clientes visitados
                      </p>
                    </div>
                  </div>
                </div>

                <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                  {selectedRoute.stops.map((stop, index) => (
                    <div
                      key={stop.id}
                      className={`p-4 border-b border-slate-100 last:border-0 ${
                        stop.visited ? "bg-green-50/50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              stop.visited
                                ? "bg-green-100 text-green-600"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {stop.visited ? <CheckCircle size={16} /> : index + 1}
                          </div>
                          {index < selectedRoute.stops.length - 1 && (
                            <div className="w-0.5 h-full bg-slate-200 my-1" />
                          )}
                        </div>

                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-slate-900">{stop.client.name}</h4>
                              <p className="text-sm text-slate-500">{stop.client.neighborhood}</p>
                              <p className="text-xs text-slate-400">{stop.client.address}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(stop.visited)}
                            </div>
                          </div>

                          <div className="mt-2 flex items-center gap-4 text-sm">
                            <span
                              className={`inline-flex items-center gap-1 ${
                                stop.visited ? "text-green-600" : "text-amber-600"
                              }`}
                            >
                              {getStatusText(stop)}
                            </span>
                            
                            {stop.latitude && stop.longitude && (
                              <a
                                href={`https://www.google.com/maps?q=${stop.latitude},${stop.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                              >
                                <Navigation size={14} />
                                Ver no mapa
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-100 rounded-xl border border-slate-200 p-8 text-center">
                <MapPin size={48} className="mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600">Selecione uma rota para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
