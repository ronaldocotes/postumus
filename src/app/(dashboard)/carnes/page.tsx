"use client";

import { useEffect, useState } from "react";
import { Plus, Search, FileText, CheckCircle, Clock, AlertTriangle, ChevronRight, Calendar, DollarSign } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import SearchSelect from "@/components/ui/SearchSelect";

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
  const { success, error, loading: toastLoading, update } = useToast();
  const [carnes, setCarnes] = useState<Carne[]>([]);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showDetail, setShowDetail] = useState<Carne | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState({ clientId: "", year: String(new Date().getFullYear()), totalValue: "", installments: "12", description: "" });
  const [formLoading, setFormLoading] = useState(false);

  // Função para gerar cor baseada no nome
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-purple-200 text-purple-800",
      "bg-pink-200 text-pink-800",
      "bg-blue-200 text-blue-800",
      "bg-green-200 text-green-800",
      "bg-yellow-200 text-yellow-800",
      "bg-indigo-200 text-indigo-800",
      "bg-rose-200 text-rose-800",
      "bg-cyan-200 text-cyan-800",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Função para extrair iniciais
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  async function load() {
    const res = await fetch(`/api/carnes?search=${search}`);
    const data = await res.json();
    setCarnes(data.carnes || []);
  }

  async function loadClients() {
    const res = await fetch("/api/clientes?limit=999");
    const data = await res.json();
    setClients(data.clients || []);
  }

  useEffect(() => { load(); }, [search]);

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const fmtDate = (d: string) => new Intl.DateTimeFormat("pt-BR").format(new Date(d));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    const toastId = toastLoading("Criando carnê...");
    
    try {
      const res = await fetch("/api/carnes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, year: parseInt(form.year), totalValue: parseFloat(form.totalValue), installments: parseInt(form.installments) }),
      });
      if (res.ok) { 
        setShowNew(false); 
        setForm({ clientId: "", year: String(new Date().getFullYear()), totalValue: "", installments: "12", description: "" }); 
        load();
        update(toastId, "Carnê criado com sucesso! ✅", "success");
      } else {
        const err = await res.json();
        update(toastId, err.error || "Erro ao criar carnê", "error");
      }
    } catch (err) {
      update(toastId, "Erro de conexão", "error");
    }
    setFormLoading(false);
  }

  async function handlePay(paymentId: string) {
    const method = prompt("Método: CASH, PIX, CARD", "CASH");
    if (!method) return;
    const payment = showDetail?.payments.find(p => p.id === paymentId);
    if (!payment) return;
    
    const toastId = toastLoading("Registrando pagamento...");
    try {
      const res = await fetch(`/api/carnes/${paymentId}/pagamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAmount: payment.amount, paymentMethod: method }),
      });
      
      if (res.ok) {
        const carneRes = await fetch(`/api/carnes/${showDetail!.id}`);
        const updated = await carneRes.json();
        setShowDetail(updated);
        load();
        update(toastId, "Pagamento registrado com sucesso! ✅", "success");
      } else {
        update(toastId, "Erro ao registrar pagamento", "error");
      }
    } catch (err) {
      update(toastId, "Erro de conexão", "error");
    }
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

      <div className="grid gap-3">
        {carnes.map((c) => {
          const paid = c.payments.filter(p => p.status === "PAID").length;
          const overdue = c.payments.filter(p => p.status === "OVERDUE").length;
          const progressPercent = (paid / c.installments) * 100;
          const isQuitado = paid === c.installments;
          
          return (
            <button
              key={c.id}
              onClick={() => setShowDetail(c)}
              className="text-left bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
            >
              <div className="flex items-start gap-4">
                {/* Avatar com Iniciais */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarColor(c.client.name)}`}>
                  {getInitials(c.client.name)}
                </div>

                {/* Informações Principais */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 truncate">{c.client.name}</h3>
                    {/* Badge de Status */}
                    {isQuitado ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex-shrink-0">
                        ✓ Quitado
                      </span>
                    ) : overdue > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 flex-shrink-0">
                        ⚠ {overdue} em Atraso
                      </span>
                    ) : null}
                  </div>

                  {/* Informações Secundárias com Ícones */}
                  <div className="grid grid-cols-3 gap-3 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1.5">
                      <FileText size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{c.client.cpf}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                      <span>Ano {c.year}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-gray-900">{fmt(c.totalValue)}</span>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700">
                        {paid}/{c.installments} pagos
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(progressPercent)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isQuitado
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                            : overdue > 0
                            ? "bg-gradient-to-r from-orange-400 to-red-500"
                            : "bg-gradient-to-r from-blue-500 to-blue-600"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Info de Parcelas */}
                  <p className="text-xs text-gray-500">
                    {c.installments}x de {fmt(c.totalValue / c.installments)}
                  </p>
                </div>

                {/* Ícone de Navegação */}
                <ChevronRight 
                  size={20} 
                  className="text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1"
                />
              </div>
            </button>
          );
        })}
        {carnes.length === 0 && <p className="text-center text-gray-600 py-8">Nenhum carnê encontrado</p>}
      </div>

      {/* New Carne Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Gerar Novo Carnê</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                <SearchSelect
                  options={clients.map(c => ({ value: c.id, label: c.name, sub: c.cpf || undefined }))}
                  value={form.clientId}
                  onChange={(val) => setForm({ ...form, clientId: val })}
                  placeholder="Buscar cliente por nome ou CPF..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Ano</label><input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Parcelas</label><input type="number" value={form.installments} onChange={(e) => setForm({ ...form, installments: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Valor Total *</label><input type="number" step="0.01" value={form.totalValue} onChange={(e) => setForm({ ...form, totalValue: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" /></div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium">Cancelar</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{formLoading ? "Gerando..." : "Gerar Carnê"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">{showDetail.client.name}</h2>
                  <p className="text-sm text-gray-600 mt-1">Carnê {showDetail.year} • {fmt(showDetail.totalValue)}</p>
                </div>
                <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600 p-1">
                  <span className="text-2xl">✕</span>
                </button>
              </div>
              
              {/* Barra de Progresso */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">Progresso do Pagamento</span>
                  <span className="text-xs font-bold text-gray-900">
                    {showDetail.payments.filter(p => p.status === "PAID").length}/{showDetail.installments} pagos
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(showDetail.payments.filter(p => p.status === "PAID").length / showDetail.installments) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Scrollable Table Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 z-5">
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Parcela</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Vencimento</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">Valor</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {showDetail.payments.map((p, idx) => {
                    const getStatusBadge = (status: string) => {
                      if (status === "PAID") return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">✓ Pago</span>;
                      if (status === "OVERDUE") return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">⚠ Atrasado</span>;
                      return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">⏱ Pendente</span>;
                    };
                    
                    return (
                      <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">{p.installment}/{showDetail.installments}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{fmtDate(p.dueDate)}</td>
                        <td className="px-4 py-4 text-sm font-bold text-gray-900 text-right">{fmt(p.amount)}</td>
                        <td className="px-4 py-4 text-center">{getStatusBadge(p.status)}</td>
                        <td className="px-4 py-4 text-right">
                          {p.status !== "PAID" && (
                            <button 
                              onClick={() => handlePay(p.id)} 
                              className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                            >
                              Registrar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
