"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Search } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const categories = ["Tanatopraxia", "Translado", "Ornamentação", "Velório", "Sepultamento", "Cremação", "Documentação", "Aluguel de Capela", "Aluguel de Ônibus", "Aluguel", "Outro"];

export default function ServicosPage() {
  const { success, error: toastError, loading: toastLoading, update } = useToast();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({ name: "", description: "", price: "", cost: "", category: "" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const sRes = await fetch("/api/servicos");
      if (!sRes.ok) {
        throw new Error("Erro ao carregar dados");
      }
      const sData = await sRes.json();
      setServices(Array.isArray(sData) ? sData : sData.data || []);
    } catch (err) {
      console.error("Erro ao carregar serviços:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    const toastId = toastLoading(editing ? "Atualizando..." : "Criando...");
    const url = editing ? `/api/servicos/${editing.id}` : "/api/servicos";
    const method = editing ? "PUT" : "POST";
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        update(toastId, editing ? "Serviço atualizado! ✅" : "Serviço criado! ✅", "success");
        setShowForm(false);
        setEditing(null);
        setForm({ name: "", description: "", price: "", cost: "", category: "" });
        loadData();
      } else {
        const err = await res.json();
        update(toastId, err.error || "Erro ao salvar", "error");
      }
    } catch (err) {
      update(toastId, "Erro de conexão", "error");
    }
    setFormLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir este serviço?")) return;
    const toastId = toastLoading("Removendo...");
    try {
      await fetch(`/api/servicos/${id}`, { method: "DELETE" });
      update(toastId, "Serviço removido! ✅", "success");
      loadData();
    } catch (err) {
      update(toastId, "Erro ao remover", "error");
    }
  }

  function openEdit(s: any) {
    setEditing(s);
    setForm({ name: s.name, description: s.description || "", price: String(s.price), cost: s.cost ? String(s.cost) : "", category: s.category || "" });
    setShowForm(true);
  }

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.category || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Carregando...</p></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo de Serviços</h1>
        <button onClick={() => { setEditing(null); setForm({ name: "", description: "", price: "", cost: "", category: "" }); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Novo Serviço
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar por serviço ou categoria..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Tabela de Catálogo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b">
            <th className="py-3 px-4 text-left font-semibold text-gray-800">Serviço</th>
            <th className="py-3 px-4 text-left font-semibold text-gray-800">Categoria</th>
            <th className="py-3 px-4 text-right font-semibold text-gray-800">Preço</th>
            <th className="py-3 px-4 text-right font-semibold text-gray-800">Custo</th>
            <th className="py-3 px-4 text-center font-semibold text-gray-800">Vendas</th>
            <th className="py-3 px-4 text-right font-semibold text-gray-800">Ações</th>
          </tr></thead>
          <tbody>
            {filteredServices.map(s => (
              <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-900">{s.name}</p>
                  {s.description && <p className="text-xs text-gray-500">{s.description}</p>}
                </td>
                <td className="py-3 px-4">
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">{s.category || "Geral"}</span>
                </td>
                <td className="py-3 px-4 text-right font-medium text-gray-900">{fmt(s.price)}</td>
                <td className="py-3 px-4 text-right text-gray-600">{s.cost ? fmt(s.cost) : "-"}</td>
                <td className="py-3 px-4 text-center text-gray-800">{s._count?.sales || 0}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openEdit(s)} className="text-blue-600 hover:text-blue-800" title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-800" title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredServices.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-gray-500">Nenhum serviço cadastrado</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Serviço */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{editing ? "Editar Serviço" : "Novo Serviço"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Tanatopraxia" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Selecione...</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço *</label>
                  <input required type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custo</label>
                  <input type="number" step="0.01" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium">Cancelar</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{formLoading ? "Salvando..." : (editing ? "Salvar" : "Cadastrar")}</button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
