"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Eye, FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface Payment {
  id: string;
  installment: number;
  dueDate: string;
  amount: number;
  status: string;
  paidAt?: string;
  paymentMethod?: string;
}

interface Carne {
  id: string;
  year: number;
  totalValue: number;
  installments: number;
  client: { name: string; cpf: string };
  payments: Payment[];
}

export default function CarnesPage() {
  const [carnes, setCarnes] = useState<Carne[]>([]);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showDetail, setShowDetail] = useState<Carne | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState({ clientId: "", year: String(new Date().getFullYear()), totalValue: "", installments: "12", description: "" });
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch(`/api/carnes?search=${search}`);
    const data = await res.json();
    setCarnes(data.carnes || []);
  }

  async function loadClients() {
    const res = await fetch("/api/clientes?search=");
    const data = await res.json();
    setClients(data.clients || []);
  }

  useEffect(() => { load(); }, [search]);

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const fmtDate = (d: string) => new Intl.DateTimeFormat("pt-BR").format(new Date(d));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/carnes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, year: parseInt(form.year), totalValue: parseFloat(form.totalValue), installments: parseInt(form.installments) }),
    });
    if (res.ok) { setShowNew(false); setForm({ clientId: "", year: String(new Date().getFullYear()), totalValue: "", installments: "12", description: "" }); load(); }
    setLoading(false);
  }

  async function handlePay(paymentId: string) {
    const method = prompt("Método: CASH, PIX, CARD", "CASH");
    if (!method) return;
    const payment = showDetail?.payments.find(p => p.id === paymentId);
    if (!payment) return;
    await fetch(`/api/carnes/${paymentId}/pagamentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paidAmount: payment.amount, paymentMethod: method }),
    });
    // Refresh detail
    const res = await fetch(`/api/carnes/${showDetail!.id}`);
    const updated = await res.json();
    setShowDetail(updated);
    load();
  }

  const statusIcon = (s: string) => {
    if (s === "PAID") return <CheckCircle size={16} className="text-green-500" />;
    if (s === "OVERDUE") return <AlertTriangle size={16} className="text-red-500" />;
    return <Clock size={16} className="text-yellow-500" />;
  };

  const statusLabel: Record<string, string> = { PENDING: "Pendente", PAID: "Pago", OVERDUE: "Atrasado", CANCELLED: "Cancelado" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Carnês</h1>
        <button onClick={() => { setShowNew(true); loadClients(); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Gerar Carnê
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar por nome do cliente..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>

      <div className="grid gap-4">
        {carnes.map((c) => {
          const paid = c.payments.filter(p => p.status === "PAID").length;
          const overdue = c.payments.filter(p => p.status === "OVERDUE").length;
          return (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{c.client.name}</h3>
                  <p className="text-sm text-gray-500">CPF: {c.client.cpf} | Ano: {c.year}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Total: {fmt(c.totalValue)} | {c.installments}x de {fmt(c.totalValue / c.installments)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className="text-green-600">{paid}/{c.installments} pagos</p>
                    {overdue > 0 && <p className="text-red-600">{overdue} em atraso</p>}
                  </div>
                  <button onClick={() => setShowDetail(c)} className="text-blue-600 hover:text-blue-800">
                    <Eye size={20} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {carnes.length === 0 && <p className="text-center text-gray-500 py-8">Nenhum carnê encontrado</p>}
      </div>

      {/* New Carne Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Gerar Novo Carnê</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Selecione...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} - {c.cpf}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Ano</label><input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Parcelas</label><input type="number" value={form.installments} onChange={(e) => setForm({ ...form, installments: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Valor Total *</label><input type="number" step="0.01" value={form.totalValue} onChange={(e) => setForm({ ...form, totalValue: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" /></div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancelar</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? "Gerando..." : "Gerar Carnê"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{showDetail.client.name}</h2>
                <p className="text-sm text-gray-500">Carnê {showDetail.year} - {fmt(showDetail.totalValue)}</p>
              </div>
              <button onClick={() => setShowDetail(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Parcela</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {showDetail.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-sm">{p.installment}/{showDetail.installments}</td>
                    <td className="px-4 py-3 text-sm">{fmtDate(p.dueDate)}</td>
                    <td className="px-4 py-3 text-sm">{fmt(p.amount)}</td>
                    <td className="px-4 py-3 text-sm flex items-center gap-1">{statusIcon(p.status)} {statusLabel[p.status]}</td>
                    <td className="px-4 py-3 text-right">
                      {p.status !== "PAID" && (
                        <button onClick={() => handlePay(p.id)} className="text-green-600 hover:text-green-800 text-sm font-medium">
                          Registrar Pagamento
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
