"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/cobrador/BottomNav";
import PaymentModal from "@/components/carnes/PaymentModal";
import ReciboModal from "@/components/cobrador/ReciboModal";
import { queuePayment, isOnline, cacheClients, getCachedClients } from "@/lib/offline-queue";
import { optimizeRoute, calculateRouteDistance } from "@/lib/route-optimizer";

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
  const [offline, setOffline] = useState(false);
  const [routeOptimized, setRouteOptimized] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClienteHoje | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixPayload, setPixPayload] = useState<string | null>(null);
  const [reciboData, setReciboData] = useState<{
    clientName: string;
    valor: number;
    paymentMethod: string;
    parcelaNumero: number;
    data: string;
    cobradorName: string;
    endereco?: string;
  } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/mobile/cobrador");
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

  // Get user location for route optimization
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 10000 }
      );
    }
  }, []);

  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true);

      // Try to load from cache first if offline
      if (!isOnline()) {
        const cached = await getCachedClients("cobrador-hoje");
        if (cached) {
          setClientes(cached.clients || []);
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/cobrador/hoje");
      if (!res.ok) throw new Error("Erro ao buscar clientes");
      const data = await res.json();
      setClientes(data.clients || []);
      setRouteOptimized(false);

      // Cache for offline use
      await cacheClients("cobrador-hoje", data);
    } catch (e: any) {
      // Try cache as fallback even when online request fails
      try {
        const cached = await getCachedClients("cobrador-hoje");
        if (cached) {
          setClientes(cached.clients || []);
        } else {
          setError(e.message);
        }
      } catch {
        setError(e.message);
      }
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

  const handleOptimizeRoute = () => {
    const validClientes = clientes.filter((c) => c.latitude && c.longitude);
    if (validClientes.length < 2) return;

    const optimized = optimizeRoute<ClienteHoje>(
      validClientes,
      userLocation?.lat,
      userLocation?.lng
    );

    // Merge optimized with non-geolocated clients (keep at end)
    const withoutGeo = clientes.filter((c) => !c.latitude || !c.longitude);
    setClientes([...optimized, ...withoutGeo]);
    setRouteOptimized(true);
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

    if (!isOnline()) {
      // Offline: queue payment
      try {
        await queuePayment({
          installmentId: selectedClient.installmentId,
          paymentMethod: method,
          latitude: lat,
          longitude: lng,
          clientName: selectedClient.clientName,
          valor: selectedClient.installmentValue,
        });
        setCobrados((prev) => new Set([...prev, selectedClient.installmentId]));
        setModalOpen(false);
        setSuccessMsg(`Pagamento de ${selectedClient.clientName} salvo offline! Será sincronizado quando houver internet.`);
        setTimeout(() => setSuccessMsg(""), 4000);
      } catch (e: any) {
        alert("Erro ao salvar offline: " + e.message);
      } finally {
        setSaving(false);
      }
      return;
    }

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

      const data = await res.json();

      // Show receipt for all payment methods
      setReciboData({
        clientName: selectedClient.clientName,
        valor: data.valor || selectedClient.installmentValue,
        paymentMethod: method,
        parcelaNumero: data.numero || selectedClient.installmentNumber,
        data: new Date().toISOString(),
        cobradorName: (session?.user as any)?.name || "Cobrador",
        endereco: selectedClient.address,
      });

      // If PIX with QR code from Asaas, show it
      if (method === "PIX" && data.pixQrCode) {
        setPixQrCode(data.pixQrCode);
        setPixPayload(data.pixPayload || null);
        setSuccessMsg(`PIX gerado para ${selectedClient.clientName}! Escaneie o QR code.`);
        setTimeout(() => {
          setPixQrCode(null);
          setPixPayload(null);
        }, 60000);
      } else {
        setSuccessMsg(`Pagamento de ${selectedClient.clientName} registrado!`);
      }

      setCobrados((prev) => new Set([...prev, selectedClient.installmentId]));
      setModalOpen(false);
      setTimeout(() => setSuccessMsg(""), method === "PIX" && data.pixQrCode ? 60000 : 3000);
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

          {offline && (
            <div className="mt-2 bg-white/20 rounded-lg px-3 py-1.5 text-sm font-medium flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Modo offline — pagamentos serão sincronizados depois
            </div>
          )}

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

          {/* Route optimization */}
          {clientes.filter((c) => c.latitude && c.longitude).length >= 2 && (
            <button
              onClick={handleOptimizeRoute}
              disabled={routeOptimized}
              className={`mt-3 w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                routeOptimized
                  ? "bg-green-500/30 text-green-100"
                  : "bg-white/20 text-white active:bg-white/30"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                <line x1="9" y1="3" x2="9" y2="18" />
                <line x1="15" y1="6" x2="15" y2="21" />
              </svg>
              {routeOptimized ? "Rota otimizada" : "Otimizar rota"}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-4 py-4 space-y-3">
          {successMsg && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm font-medium text-center">
              {successMsg}
            </div>
          )}

          {pixQrCode && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-sm font-bold text-gray-900 mb-2">QR Code PIX</p>
              <img src={`data:image/png;base64,${pixQrCode}`} alt="QR Code PIX" className="w-48 h-48 mx-auto rounded-lg border border-gray-100" />
              {pixPayload && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Código PIX (copia e cola)</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pixPayload);
                      alert("Código PIX copiado!");
                    }}
                    className="w-full text-xs bg-gray-100 text-gray-700 py-2 rounded-lg font-mono truncate px-2"
                  >
                    {pixPayload.slice(0, 40)}...
                  </button>
                </div>
              )}
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
                      {offline ? "Cobrar (salvar offline)" : "Cobrar"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

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

      {reciboData && (
        <ReciboModal
          data={reciboData}
          onClose={() => setReciboData(null)}
        />
      )}
    </>
  );
}
