"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Phone,
  MessageCircle,
  MapPin,
  DollarSign,
  X,
  CheckCircle,
  Clock,
  Navigation,
  ChevronRight,
} from "lucide-react";
import { format, isToday, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RouteStop {
  id: string;
  order: number;
  visited: boolean;
  visitedAt: string | null;
  client: {
    id: string;
    name: string;
    phone: string | null;
    address: string;
    neighborhood: string;
    lat: number | null;
    lng: number | null;
  };
  installments: {
    id: string;
    numero: number;
    valor: number;
    dueDate: string;
    status: string;
  }[];
}

interface CollectionRoute {
  id: string;
  date: string;
  status: string;
  stops: RouteStop[];
}

export default function CobrancaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [route, setRoute] = useState<CollectionRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if ((session?.user as any)?.id) {
      loadRoute();
    }
  }, [session, status]);

  async function loadRoute() {
    try {
      const res = await fetch(`/api/collection-routes?collectorId=${(session?.user as any)?.id}`);
      const data = await res.json();
      if (data.route) {
        setRoute(data.route);
        const firstNotVisited = data.route.stops.findIndex((s: RouteStop) => !s.visited);
        setCurrentPosition(firstNotVisited >= 0 ? firstNotVisited : 0);
      }
    } catch (error) {
      console.error("Erro ao carregar rota:", error);
    } finally {
      setLoading(false);
    }
  }

  function openBottomSheet(stop: RouteStop) {
    setSelectedStop(stop);
    setShowBottomSheet(true);
  }

  function closeBottomSheet() {
    setShowBottomSheet(false);
    setSelectedStop(null);
  }

  function handleCall() {
    if (selectedStop?.client.phone) {
      window.location.href = `tel:${selectedStop.client.phone}`;
    }
  }

  function handleWhatsApp() {
    if (selectedStop?.client.phone) {
      const phone = selectedStop.client.phone.replace(/\D/g, "");
      const message = encodeURIComponent(
        `Ola ${selectedStop.client.name}, sou o cobrador da Posthumous. Estou a caminho para realizar a cobranca.`
      );
      window.open(`https://wa.me/55${phone}?text=${message}`, "_blank");
    }
  }

  function handleNavigate() {
    if (selectedStop?.client.lat && selectedStop?.client.lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${selectedStop.client.lat},${selectedStop.client.lng}`,
        "_blank"
      );
    } else {
      const address = encodeURIComponent(
        `${selectedStop?.client.address}, ${selectedStop?.client.neighborhood}`
      );
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, "_blank");
    }
  }

  async function handlePayment() {
    if (!selectedStop) return;
    router.push(`/cobranca/pagamento?stopId=${selectedStop.id}&clientId=${selectedStop.client.id}`);
  }

  async function handleNotAttended() {
    if (!selectedStop) return;
    
    try {
      const res = await fetch("/api/visit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedStop.client.id,
          type: "NAO_ATENDEU",
          notes: "Cobrador nao encontrou o cliente",
        }),
      });

      if (res.ok) {
        await loadRoute();
        closeBottomSheet();
      }
    } catch (error) {
      console.error("Erro ao registrar nao atendimento:", error);
    }
  }

  async function handleReschedule() {
    if (!selectedStop) return;
    
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);
    
    try {
      const res = await fetch("/api/visit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedStop.client.id,
          type: "REMARCADO",
          nextVisitDate: nextDate.toISOString(),
          notes: "Remarcado para proximo dia util",
        }),
      });

      if (res.ok) {
        await loadRoute();
        closeBottomSheet();
      }
    } catch (error) {
      console.error("Erro ao remarcar:", error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando rota do dia...</p>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin size={32} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Nenhuma rota para hoje</h2>
          <p className="text-slate-600 mb-6">
            Voce nao tem clientes agendados para cobranca hoje. Entre em contato com o administrador.
          </p>
        </div>
      </div>
    );
  }

  const currentStop = route.stops[currentPosition];
  const pendingStops = route.stops.filter((s) => !s.visited).length;
  const completedStops = route.stops.filter((s) => s.visited).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-900">Rota de Cobranca</h1>
              <p className="text-sm text-slate-500">
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {completedStops}/{route.stops.length} visitados
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${(completedStops / route.stops.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Lista de Clientes */}
      <div className="p-4 space-y-3">
        {route.stops.map((stop, index) => {
          const isCurrent = index === currentPosition;
          const isVisited = stop.visited;

          return (
            <div
              key={stop.id}
              onClick={() => !isVisited && openBottomSheet(stop)}
              className={`bg-white rounded-xl border p-4 transition-all ${
                isVisited
                  ? "border-slate-200 opacity-60"
                  : isCurrent
                  ? "border-blue-500 shadow-md ring-2 ring-blue-100"
                  : "border-slate-200 hover:border-blue-300"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Status Indicator */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isVisited
                      ? "bg-green-100 text-green-600"
                      : isCurrent
                      ? "bg-blue-100 text-blue-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isVisited ? (
                    <CheckCircle size={20} />
                  ) : (
                    <span className="font-bold text-sm">{stop.order}</span>
                  )}
                </div>

                {/* Client Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{stop.client.name}</h3>
                  <p className="text-sm text-slate-500 truncate">{stop.client.neighborhood}</p>
                  <p className="text-xs text-slate-400 truncate">{stop.client.address}</p>

                  {/* Installments */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {stop.installments.map((inst) => (
                      <span
                        key={inst.id}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          inst.status === "LATE"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {inst.numero}a - R$ {inst.valor.toFixed(2)}
                        {isPast(new Date(inst.dueDate)) && !isToday(new Date(inst.dueDate)) && (
                          <span className="ml-1 text-red-600">(ATR)</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                {!isVisited && <ChevronRight size={20} className="text-slate-400 shrink-0" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Sheet */}
      {showBottomSheet && selectedStop && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 z-40" onClick={closeBottomSheet} />

          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-w-lg mx-auto">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{selectedStop.client.name}</h3>
                  <p className="text-sm text-slate-500">{selectedStop.client.neighborhood}</p>
                </div>
                <button onClick={closeBottomSheet} className="p-2 text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="p-4 grid grid-cols-3 gap-3">
              {/* Ligar */}
              <button
                onClick={handleCall}
                disabled={!selectedStop.client.phone}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Phone size={24} className="text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">Ligar</span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={handleWhatsApp}
                disabled={!selectedStop.client.phone}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <MessageCircle size={24} className="text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">WhatsApp</span>
              </button>

              {/* Navegar */}
              <button
                onClick={handleNavigate}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
                  <Navigation size={24} className="text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">Navegar</span>
              </button>

              {/* Receber */}
              <button
                onClick={handlePayment}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                  <DollarSign size={24} className="text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">Receber</span>
              </button>

              {/* Nao Atendeu */}
              <button
                onClick={handleNotAttended}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
              >
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <X size={24} className="text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">Nao Atendeu</span>
              </button>

              {/* Remarcar */}
              <button
                onClick={handleReschedule}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                  <Clock size={24} className="text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">Remarcar</span>
              </button>
            </div>

            {/* Installments Summary */}
            <div className="px-4 pb-6">
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-medium text-slate-900 mb-2">Parcelas Pendentes</h4>
                <div className="space-y-2">
                  {selectedStop.installments.map((inst) => (
                    <div
                      key={inst.id}
                      className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0"
                    >
                      <div>
                        <span className="font-medium text-slate-700">{inst.numero}a Parcela</span>
                        <p className="text-xs text-slate-500">
                          Venc: {format(new Date(inst.dueDate), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <span className="font-bold text-slate-900">R$ {inst.valor.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between">
                  <span className="font-medium text-slate-700">Total</span>
                  <span className="font-bold text-lg text-slate-900">
                    R$ {selectedStop.installments.reduce((sum, inst) => sum + inst.valor, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
