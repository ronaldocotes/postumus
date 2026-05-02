"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/cobrador/BottomNav";
import PaymentModal from "@/components/carnes/PaymentModal";

interface ClienteHoje {
  clientId: string;
  clientName: string;
  address: string;
  neighborhood: string | null;
  city: string | null;
  cellphone: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  routeOrder: number | null;
  installmentId: string;
  installmentNumber: number;
  installmentValue: number;
  dueDate: string;
  status: "PENDING" | "OVERDUE";
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function CobradorHojePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [clientes, setClientes] = useState<ClienteHoje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cobrados, setCobrados] = useState<Set<string>>(new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClienteHoje | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/cobrador");
    }
  }, [status, router]);

  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cobrador/hoje");
      if (!res.ok) throw new Error("Erro ao buscar clientes");
      const data = await res.json();
      setClientes(data.clients || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchClientes();
    }
  }, [status, fetchClientes]);

  const handleCobrar = (cliente: ClienteHoje) => {
    setSelectedClient(cliente);
    setModalOpen(true);
  };

  const handlePayment = async (method: string) => {
    if (!selectedClient) return;
    setSaving(true);

    let lat: number | undefined;
    let lng: number | undefined;
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {}

    try {
      const res = await fetch("/api/cobrador/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installmentId: selectedClient.installmentId,
          paymentMethod: method,
          latitude: lat,
          longitude: lng,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao registrar pagamento");
      }

      setCobrados((prev) => new Set([...prev, selectedClient.installmentId]));
      setModalOpen(false);
      setSuccessMsg(`Pagamento de ${selectedClient.clientName} registrado!`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  const pendentes = clientes.filter((c) => !cobrados.has(c.installmentId));
  const totalPendente = pendentes.reduce((acc, c) => acc + c.installmentValue, 0);
  const totalCobrado = clientes
    .filter((c) => cobrados.has(c.installmentId))
    .reduce((acc, c) => acc + c.installmentValue, 0);
  const today = new Date();
  const dateStr = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-blue-600 text-white px-4 pt-12 pb-6">
          <p className="text-blue-200 text-sm capitalize">{dateStr}</p>
          <h1 className="text-2xl font-bold mt-1">Cobranças de Hoje</h1>

          {/* Summary */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{clientes.length}</p>
              <p className="text-blue-100 text-xs mt-0.5">Total</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{cobrados.size}</p>
              <p className="text-blue-100 text-xs mt-0.5">Cobrados</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-lg font-bold">{fmt(totalCobrado)}</p>
              <p className="text-blue-100 text-xs mt-0.5">Recebido</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4 space-y-3">
          {successMsg && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm font-medium text-center">
              {successMsg}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          {clientes.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Nenhuma cobrança para hoje</p>
              <p className="text-gray-400 text-sm mt-1">Dia {today.getDate()} não tem clientes com vencimento</p>
            </div>
          )}

          {clientes.map((cliente) => {
            const isPago = cobrados.has(cliente.installmentId);
            return (
              <div
                key={cliente.installmentId}
                className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${
                  isPago ? "border-green-200 opacity-70" : "border-gray-100"
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isPago ? (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Pago
                          </span>
                        ) : cliente.status === "OVERDUE" ? (
                          <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            Vencido
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            Pendente
                          </span>
                        )}
                        <span className="text-gray-400 text-xs">Parcela {cliente.installmentNumber}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-base leading-tight truncate">
                        {cliente.clientName}
                      </h3>
                      {(cliente.address || cliente.neighborhood) && (
                        <p className="text-gray-500 text-sm mt-0.5 truncate">
                          {[cliente.address, cliente.neighborhood].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-gray-900">{fmt(cliente.installmentValue)}</p>
                    </div>
                  </div>

                  {!isPago && (
                    <button
                      onClick={() => handleCobrar(cliente)}
                      disabled={saving}
                      className="mt-3 w-full bg-green-500 active:bg-green-600 text-white font-bold py-3 rounded-xl text-base transition-colors"
                      style={{ minHeight: "48px" }}
                    >
                      Cobrar
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Bottom padding */}
          <div className="h-4" />
        </div>
      </div>

      <BottomNav />

      {selectedClient && (
        <PaymentModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onPayment={handlePayment}
          installmentValue={selectedClient.installmentValue}
          clientName={selectedClient.clientName}
        />
      )}
    </>
  );
}
