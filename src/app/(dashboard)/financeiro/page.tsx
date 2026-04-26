"use client";

import { useEffect, useState } from "react";
import { Plus, X, ArrowUpCircle, ArrowDownCircle, CheckCircle, Clock } from "lucide-react";

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
  const [filter, setFilter] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "EXPENSE", description: "", amount: "", date: new Date().toISOString().split("T")[0], dueDate: "", category: "", notes: "" });
  const [loading, setLoading] = useState(false);

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const fmtDate = (d: string) => new Intl.DateTimeFormat("pt-BR").format(new Date(d));

  async function load() {
    const params = filter ? `?type=${filter}` : "";
    const res = await fetch(`/api/financeiro${params}`);
    const data = await res.json();
    setTransactions(data.transactions || []);
  }

  useEffect(() => { load(); }, [filter]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload = { ...form, amount: parseFloat(form.amount), date: new Date(form.date), dueDate: form.dueDate ? new Date(form.dueDate) : null };
    const res = await fetch("/api/financeiro", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { setShowForm(false); setForm({ type: "EXPENSE", description: "", amount: "", date: new Date().toISOString().split("T")[0], dueDate: "", category: "", notes: "" }); load(); }
    setLoading(false);
  }

  const income = transactions.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

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
          <p className="text-sm text-gray-500">Receitas</p>
          <p className="text-xl font-bold text-green-600">{fmt(income)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Despesas</p>
          <p className="text-xl font-bold text-red-600">{fmt(expense)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Saldo</p>
          <p className={`text-xl font-bold ${income - expense >= 0 ? "text-green-600" : "text-red-600"}`}>{fmt(income - expense)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter("")} className={`px-3 py-1 rounded-lg text-sm ${!filter ? "bg-blue-600 text-white" : "bg-gray-200"}`}>Todos</button>
        <button onClick={() => setFilter("INCOME")} className={`px-3 py-1 rounded-lg text-sm ${filter === "INCOME" ? "bg-green-600 text-white" : "bg-gray-200"}`}>Receitas</button>
        <button onClick={() => setFilter("EXPENSE")} className={`px-3 py-1 rounded-lg text-sm ${filter === "EXPENSE" ? "bg-red-600 text-white" : "bg-gray-200"}`}>Despesas</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{t.type === "INCOME" ? <ArrowUpCircle size={18} className="text-green-500" /> : <ArrowDownCircle size={18} className="text-red-500" />}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{t.description}</td>
                <td className={`px-6 py-4 text-sm font-medium ${t.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>{fmt(t.amount)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{fmtDate(t.date)}</td>
                <td className="px-6 py-4 text-sm">{t.status === "PAID" ? <span className="flex items-center gap-1 text-green-600"><CheckCircle size={14} /> Pago</span> : <span className="flex items-center gap-1 text-yellow-600"><Clock size={14} /> Pendente</span>}</td>
              </tr>
            ))}
            {transactions.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhuma transação encontrada</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Nova Transação</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none">
                  <option value="EXPENSE">Despesa (A Pagar)</option>
                  <option value="INCOME">Receita (A Receber)</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label><input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Data</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Ex: Material, Serviço..." /></div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg">Cancelar</button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? "Salvando..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
