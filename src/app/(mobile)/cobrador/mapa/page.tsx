"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import BottomNav from "@/components/cobrador/BottomNav";
import PaymentModal from "@/components/carnes/PaymentModal";

const CobradorMap = dynamic(() => import("@/components/cobrador/CobradorMap"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Carregando mapa...</p>
      </div>
    </div>
  ),
});

interface ClienteHoje {
  clientId: string;
  clientName: string;
  address: string;
  neighborhood: string | null;
  latitude: number | null;
  longitude: number | null;
  installmentId: string;
  installmentNumber: number;
  installmentValue: number;
  status: "PENDING" | "OVERDUE";
}

export default function CobradorMapaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [clientes, setClientes] = useState<ClienteHoje[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClienteHoje | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [paidInstallments, setPaidInstallments] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/cobrador/mapa");
    }
  }, [status, router]);

  const fetchClientes = useCallback(async () => {
    try {
      const res = await fetch("/api/cobrador/hoje");
      if (!res.ok) throw new Error("Erro");
      const data = await res.json();
      setClientes((data.clients || []).filter((c: ClienteHoje) => c.latitude && c.longitude));
    } catch (e) {
      console.error(e);
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
        throw new Error(data.error || "Erro ao registrar");
      }

      setPaidInstallments((prev) => new Set([...prev, selectedClient.installmentId]));
      setModalOpen(false);
      setSelectedClient(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <>
      <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 pt-12 pb-3 flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-900">Mapa de Cobranças</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {clientes.filter((c) => !paidInstallments.has(c.installmentId)).length} clientes no mapa
          </p>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clientes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center px-6">
            <div>
              <p className="text-gray-500 font-medium">Sem localização disponível</p>
              <p className="text-gray-400 text-sm mt-1">
                Os clientes de hoje não têm coordenadas cadastradas
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 relative">
            <CobradorMap
              clientes={clientes}
              paidInstallments={paidInstallments}
              onCobrar={handleCobrar}
            />
          </div>
        )}
      </div>

      <BottomNav />

      {selectedClient && (
        <>
          {/* Bottom sheet info */}
          <div
            className="fixed bottom-16 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[400] p-4 border-t border-gray-200"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-base">{selectedClient.clientName}</h3>
                {selectedClient.address && (
                  <p className="text-gray-500 text-sm">{selectedClient.address}</p>
                )}
                {selectedClient.neighborhood && (
                  <p className="text-gray-400 text-xs">{selectedClient.neighborhood}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-400">Parcela {selectedClient.installmentNumber}</p>
                <p className="text-xl font-bold text-gray-900">{fmt(selectedClient.installmentValue)}</p>
              </div>
              {selectedClient.latitude && selectedClient.longitude && (
                <a
                  href={`https://maps.google.com/?q=${selectedClient.latitude},${selectedClient.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 11l19-9-9 19-2-8-8-2z" />
                  </svg>
                  Maps
                </a>
              )}
              {!paidInstallments.has(selectedClient.installmentId) && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex-1 bg-green-500 active:bg-green-600 text-white font-bold py-2.5 rounded-xl text-base"
                  style={{ minHeight: "48px" }}
                >
                  Cobrar
                </button>
              )}
              {paidInstallments.has(selectedClient.installmentId) && (
                <span className="flex-1 text-center text-green-600 font-semibold">Pago</span>
              )}
            </div>
          </div>
        </>
      )}

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
