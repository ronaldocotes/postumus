"use client";

import { useState, useEffect } from "react";
import {
  Landmark,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Lock,
  History,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface CashRegister {
  id: string;
  openedAt: string;
  closedAt: string | null;
  openedBy: { name: string };
  closedBy: { name: string } | null;
  initialAmount: number;
  closedAmount: number | null;
  status: "OPEN" | "CLOSED";
  theoreticalBalance?: number;
  difference?: number;
  totalSales?: number;
  totalSangria?: number;
  totalReforco?: number;
}

export default function CaixaPage() {
  const { success, error: toastError, loading: toastLoading, update } = useToast();
  const [openRegister, setOpenRegister] = useState<CashRegister | null>(null);
  const [history, setHistory] = useState<CashRegister[]>([]);
  const [loading, setLoading] = useState(true);

  const [showOpenForm, setShowOpenForm] = useState(false);
  const [initialAmount, setInitialAmount] = useState("");

  const [showMovement, setShowMovement] = useState(false);
  const [movementType, setMovementType] = useState<"SANGRIA" | "REFORCO">("SANGRIA");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementReason, setMovementReason] = useState("");

  const [showClose, setShowClose] = useState(false);
  const [closeAmount, setCloseAmount] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [openRes, histRes] = await Promise.all([
        fetch("/api/caixa/aberto"),
        fetch("/api/caixa"),
      ]);
      const openData = openRes.ok ? await openRes.json() : null;
      const histData = histRes.ok ? await histRes.json() : { registers: [] };
      setOpenRegister(openData);
      setHistory(histData.registers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleOpen(e: React.FormEvent) {
    e.preventDefault();
    const toastId = toastLoading("Abrindo caixa...");
    try {
      const res = await fetch("/api/caixa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initialAmount: parseFloat(initialAmount) || 0 }),
      });
      if (res.ok) {
        update(toastId, "Caixa aberto!", "success");
        setShowOpenForm(false);
        setInitialAmount("");
        loadData();
      } else {
        const err = await res.json();
        update(toastId, err.error || "Erro ao abrir caixa", "error");
      }
    } catch {
      update(toastId, "Erro de conexão", "error");
    }
  }

  async function handleMovement(e: React.FormEvent) {
    e.preventDefault();
    if (!openRegister) return;
    const toastId = toastLoading("Registrando movimentação...");
    try {
      const res = await fetch(`/api/caixa/${openRegister.id}/movimentacao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: movementType,
          amount: parseFloat(movementAmount),
          reason: movementReason,
        }),
      });
      if (res.ok) {
        update(toastId, "Movimentação registrada!", "success");
        setShowMovement(false);
        setMovementAmount("");
        setMovementReason("");
        loadData();
      } else {
        const err = await res.json();
        update(toastId, err.error || "Erro", "error");
      }
    } catch {
      update(toastId, "Erro de conexão", "error");
    }
  }

  async function handleClose(e: React.FormEvent) {
    e.preventDefault();
    if (!openRegister) return;
    const toastId = toastLoading("Fechando caixa...");
    try {
      const res = await fetch(`/api/caixa/${openRegister.id}/fechar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closedAmount: parseFloat(closeAmount) }),
      });
      if (res.ok) {
        update(toastId, "Caixa fechado!", "success");
        setShowClose(false);
        setCloseAmount("");
        loadData();
      } else {
        const err = await res.json();
        update(toastId, err.error || "Erro ao fechar", "error");
      }
    } catch {
      update(toastId, "Erro de conexão", "error");
    }
  }

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="animate-spin text-gray-400 mr-2" />
        <span className="text-gray-500">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Controle de Caixa</h1>
          <p className="text-gray-500 mt-1">Abertura, sangria, reforço e fechamento de turno</p>
        </div>
        {!openRegister && (
          <button
            onClick={() => setShowOpenForm(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
          >
            <Plus size={18} /> Abrir Caixa
          </button>
        )}
      </div>

      {/* Caixa Aberto */}
      {openRegister && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                  Caixa Aberto
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Aberto em {new Date(openRegister.openedAt).toLocaleString("pt-BR")} por{" "}
                <strong>{openRegister.openedBy.name}</strong>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setMovementType("REFORCO"); setShowMovement(true); }}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100"
              >
                <TrendingUp size={16} /> Reforço
              </button>
              <button
                onClick={() => { setMovementType("SANGRIA"); setShowMovement(true); }}
                className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-100"
              >
                <TrendingDown size={16} /> Sangria
              </button>
              <button
                onClick={() => setShowClose(true)}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                <Lock size={16} /> Fechar Caixa
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase font-medium">Valor Inicial</p>
              <p className="text-xl font-bold text-gray-900">{fmt(openRegister.initialAmount)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase font-medium">Vendas no Caixa</p>
              <p className="text-xl font-bold text-green-600">{fmt(openRegister.totalSales || 0)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase font-medium">Saldo Teórico</p>
              <p className="text-xl font-bold text-blue-600">{fmt(openRegister.theoreticalBalance || 0)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase font-medium">Movimentações</p>
              <div className="flex gap-3 text-sm">
                <span className="text-orange-600 font-medium">- {fmt(openRegister.totalSangria || 0)}</span>
                <span className="text-blue-600 font-medium">+ {fmt(openRegister.totalReforco || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sem caixa aberto */}
      {!openRegister && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8 flex items-center gap-4">
          <AlertTriangle className="text-yellow-600 shrink-0" size={24} />
          <div>
            <h3 className="font-bold text-yellow-900">Nenhum caixa aberto</h3>
            <p className="text-sm text-yellow-800">
              Abra um caixa para iniciar vendas no PDV.
            </p>
          </div>
        </div>
      )}

      {/* Histórico */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <History size={18} className="text-gray-500" />
          <h2 className="font-bold text-gray-900">Histórico de Caixas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Abertura</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Responsável</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Inicial</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Fechamento</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">
                    {new Date(reg.openedAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{reg.openedBy?.name}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {fmt(reg.initialAmount)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {reg.closedAmount != null ? fmt(reg.closedAmount) : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {reg.status === "OPEN" ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Aberto
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Fechado
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Nenhum caixa registrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Abrir Caixa */}
      {showOpenForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Abrir Caixa</h2>
              <button onClick={() => setShowOpenForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleOpen} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Inicial</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0,00"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpenForm(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Abrir Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Movimentação */}
      {showMovement && openRegister && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {movementType === "SANGRIA" ? "Registrar Sangria" : "Registrar Reforço"}
              </h2>
              <button onClick={() => setShowMovement(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleMovement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <input
                  type="text"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Troco, pagamento fornecedor..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMovement(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg font-medium ${
                    movementType === "SANGRIA"
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Fechar Caixa */}
      {showClose && openRegister && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Fechar Caixa</h2>
              <button onClick={() => setShowClose(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Valor Inicial</span>
                <span className="font-medium">{fmt(openRegister.initialAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Vendas</span>
                <span className="font-medium text-green-600">+ {fmt(openRegister.totalSales || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Movimentações</span>
                <span className="font-medium">
                  - {fmt(openRegister.totalSangria || 0)} / + {fmt(openRegister.totalReforco || 0)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="text-gray-700 font-medium">Saldo Teórico</span>
                <span className="font-bold text-blue-600">{fmt(openRegister.theoreticalBalance || 0)}</span>
              </div>
            </div>
            <form onSubmit={handleClose} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor de Fechamento</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={closeAmount}
                  onChange={(e) => setCloseAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="0,00"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClose(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Fechar Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
