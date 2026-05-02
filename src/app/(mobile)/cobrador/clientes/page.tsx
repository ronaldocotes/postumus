"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/cobrador/BottomNav";
import PaymentModal from "@/components/carnes/PaymentModal";

interface Installment {
  id: string;
  numero: number;
  valor: number;
  dueDate: string;
  status: string;
}

interface ClienteItem {
  id: string;
  name: string;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  cellphone: string | null;
  dueDay: number | null;
  monthlyValue: number | null;
  carnes: Array<{
    id: string;
    year: number;
    installments: Installment[];
  }>;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const statusColor = (s: string) => {
  if (s === "PAID") return "bg-green-100 text-green-700";
  if (s === "LATE") return "bg-red-100 text-red-700";
  if (s === "PARTIAL") return "bg-amber-100 text-amber-700";
  return "bg-yellow-100 text-yellow-700";
};

const statusLabel: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  LATE: "Atrasado",
  PARTIAL: "Parcial",
  CANCELLED: "Cancelado",
};

export default function CobradorClientesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [clientes, setClientes] = useState<ClienteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<{
    id: string;
    valor: number;
    clientName: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [paidInstallments, setPaidInstallments] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/cobrador/clientes");
    }
  }, [status, router]);

  const fetchClientes = useCallback(async () => {
    try {
      const res = await fetch("/api/clientes?limit=200&status=ACTIVE");
      if (!res.ok) throw new Error("Erro ao buscar clientes");
      const data = await res.json();

      const clientesComCarne = await Promise.all(
        (data.clients || data).slice(0, 50).map(async (c: any) => {
          try {
            const carneRes = await fetch(`/api/carnes?clientId=${c.id}`);
            const carneData = carneRes.ok ? await carneRes.json() : { carnes: [] };
            return { ...c, carnes: carneData.carnes || [] };
          } catch {
            return { ...c, carnes: [] };
          }
        })
      );

      setClientes(clientesComCarne);
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

  const handleCobrar = (installmentId: string, valor: number, clientName: string) => {
    setSelectedInstallment({ id: installmentId, valor, clientName });
    setModalOpen(true);
  };

  const handlePayment = async (method: string) => {
    if (!selectedInstallment) return;
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
          installmentId: selectedInstallment.id,
          paymentMethod: method,
          latitude: lat,
          longitude: lng,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao registrar");
      }

      setPaidInstallments((prev) => new Set([...prev, selectedInstallment.id]));
      setModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = clientes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 pt-12 pb-4 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-gray-900 mb-3">Clientes</h1>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="px-4 py-3 space-y-2">
          {loading && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              Nenhum cliente encontrado
            </div>
          )}

          {filtered.map((cliente) => {
            const isExpanded = expanded === cliente.id;
            const pendingInstallments = cliente.carnes.flatMap((c) =>
              c.installments.filter(
                (i) => i.status !== "PAID" && i.status !== "CANCELLED" && !paidInstallments.has(i.id)
              )
            );

            return (
              <div
                key={cliente.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <button
                  className="w-full p-4 text-left active:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : cliente.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{cliente.name}</h3>
                      {cliente.neighborhood && (
                        <p className="text-sm text-gray-500 truncate">{cliente.neighborhood}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {pendingInstallments.length > 0 && (
                        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          {pendingInstallments.length} pend.
                        </span>
                      )}
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#9ca3af"
                        strokeWidth="2"
                        style={{ transform: isExpanded ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50/50">
                    {cliente.address && (
                      <p className="text-sm text-gray-600">
                        {cliente.address}
                        {cliente.city ? ` - ${cliente.city}` : ""}
                      </p>
                    )}
                    {cliente.cellphone && (
                      <a
                        href={`tel:${cliente.cellphone}`}
                        className="flex items-center gap-2 text-blue-600 text-sm font-medium"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.97-1.97a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        {cliente.cellphone}
                      </a>
                    )}

                    {cliente.carnes.length === 0 ? (
                      <p className="text-gray-400 text-sm">Sem carnê ativo</p>
                    ) : (
                      cliente.carnes.map((carne) => (
                        <div key={carne.id}>
                          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                            Carnê {carne.year}
                          </p>
                          <div className="space-y-2">
                            {carne.installments.slice(0, 6).map((inst) => {
                              const isPaid =
                                inst.status === "PAID" || paidInstallments.has(inst.id);
                              return (
                                <div
                                  key={inst.id}
                                  className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-gray-100"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">
                                      Parcela {inst.numero}
                                    </p>
                                    <span
                                      className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${statusColor(isPaid ? "PAID" : inst.status)}`}
                                    >
                                      {isPaid ? "Pago" : statusLabel[inst.status] || inst.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900 text-sm">
                                      {fmt(inst.valor)}
                                    </span>
                                    {!isPaid && (
                                      <button
                                        onClick={() => handleCobrar(inst.id, inst.valor, cliente.name)}
                                        className="bg-green-500 active:bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                                        style={{ minHeight: "32px" }}
                                      >
                                        Cobrar
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div className="h-4" />
        </div>
      </div>

      <BottomNav />

      {selectedInstallment && (
        <PaymentModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onPayment={handlePayment}
          installmentValue={selectedInstallment.valor}
          clientName={selectedInstallment.clientName}
        />
      )}
    </>
  );
}
