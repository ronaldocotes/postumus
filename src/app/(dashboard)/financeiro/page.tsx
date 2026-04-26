"use client";

import { useEffect, useState } from "react";
import { Plus, X, ArrowUpCircle, ArrowDownCircle, CheckCircle, Clock } from "lucide-react";
import SearchSelect from "@/components/ui/SearchSelect";

interface Transaction {
  id: string;
  type: string;
  description: string;
  amount: number;
  date: string;
  dueDate?: string;
  status: string;
  category?: string;
  client?: { name: string };
  supplier?: { name: string };
}

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "EXPENSE", description: "", amount: "", date: new Date().toISOString().split("T")[0],
    dueDate: "", category: "", notes: "", clientId: "", supplierId: "", status: "PENDING",
  });
  const [loading, setLoading] = useState(false);

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const fmtDate = (d: string) => new Intl.DateTimeFormat("pt-BR").format(new Date(d));

  async function load() {
    const params = filter ? `?type=${filter}` : "";
    const res = await fetch(`/api/financeiro${params}`);
    const data = await res.json();
    setTransactions(data.transactions || []);
  }

  async function loadRefs() {
    const [cRes, sRes] = await Promise.all([
      fetch("/api/clientes?limit=999"),
      fetch("/api/fornecedores?search="),
    ]);
    const cData = await cRes.json();
    const sData = await sRes.json();
    setClients(cData.clients || []);
    setSuppliers(sData.suppliers || []);
  }

  useEffect(() => { load(); loadRefs(); }, [filter]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload = {
      ...form,
      amount: parseFloat(form.amount),
      date: new Date(form.date),
      dueDate: form.dueDate ? new Date(form.dueDate) : null,
      clientId: form.clientId || null,
      supplierId: form.supplierId || null,
    };
    const res = await fetch("/api/financeiro", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) {
      setShowForm(false);
      setForm({ type: "EXPENSE", description: "", amount: "", date: new Date().toISOString().split("T")[0], dueDate: "", category: "", notes: "", clientId: "", supplierId: "", status: "PENDING" });
      load();
    }
    setLoading(false);
  }

  const income = transactions.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

  const categories = form.type === "INCOME"
    ? ["Carnê", "Venda de Serviço", "Venda de Mercadoria", "Aluguel", "Outros"]
    : ["Material", "Fornecedor", "Aluguel", "Salário", "Manutenção", "Conta de Luz", "Conta de Água", "Combustível", "Outros"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Nova Transação
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-600 font-medium">Receitas</p>
          <p className="text-xl font-bold text-green-600">{fmt(income)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-600 font-medium">Despesas</p>
          <p className="text-xl font-bold text-red-600">{fmt(expense)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-600 font-medium">Saldo</p>
          <p className={`text-xl font-bold ${income - expense >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(income - expense)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter("")} className={`px-3 py-1 rounded-lg text-sm font-medium ${!filter ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>Todos</button>
        <button onClick={() => setFilter("INCOME")} className={`px-3 py-1 rounded-lg text-sm font-medium ${filter === "INCOME" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"}`}>Receitas</button>
        <button onClick={() => setFilter("EXPENSE")} className={`px-3 py-1 rounded-lg text-sm font-medium ${filter === "EXPENSE" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-700"}`}>Despesas</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm text-gray-900">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Descrição</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Referência</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Valor</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Data</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{t.type === "INCOME" ? <ArrowUpCircle size={18} className="text-green-500" /> : <ArrowDownCircle size={18} className="text-red-500" />}</td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {t.description}
                  {t.category && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t.category}</span>}
                </td>
                <td className="px-6 py-4 text-gray-800">{t.client?.name || t.supplier?.name || "-"}</td>
                <td className={`px-6 py-4 font-medium ${t.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>{fmt(t.amount)}</td>
                <td className="px-6 py-4 text-gray-800">{fmtDate(t.date)}</td>
                <td className="px-6 py-4">{t.status === "PAID" ? <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle size={14} /> Pago</span> : <span className="flex items-center gap-1 text-yellow-600 font-medium"><Clock size={14} /> Pendente</span>}</td>
              </tr>
            ))}
            {transactions.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nenhuma transação encontrada</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Nova Transação</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setForm({ ...form, type: "EXPENSE", clientId: "", supplierId: "" })}
                    className={`flex-1 py-2 rounded-lg font-medium text-sm ${form.type === "EXPENSE" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700"}`}>
                    Despesa (A Pagar)
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, type: "INCOME", clientId: "", supplierId: "" })}
                    className={`flex-1 py-2 rounded-lg font-medium text-sm ${form.type === "INCOME" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"}`}>
                    Receita (A Receber)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Selecione...</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Cliente (para Receita) */}
              {form.type === "INCOME" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <SearchSelect
                    options={clients.map((c: any) => ({ value: c.id, label: c.name, sub: c.cpf || undefined }))}
                    value={form.clientId}
                    onChange={(val) => setForm({ ...form, clientId: val })}
                    placeholder="Buscar cliente..."
                  />
                </div>
              )}

              {/* Fornecedor (para Despesa) */}
              {form.type === "EXPENSE" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                  <SearchSelect
                    options={suppliers.map((s: any) => ({ value: s.id, label: s.name, sub: s.cnpj || undefined }))}
                    value={form.supplierId}
                    onChange={(val) => setForm({ ...form, supplierId: val })}
                    placeholder="Buscar fornecedor..."
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
                  <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="PENDING">Pendente</option>
                    <option value="PAID">Pago</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Data</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium">Cancelar</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? "Salvando..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
