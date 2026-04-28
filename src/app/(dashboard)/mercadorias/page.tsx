"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, X } from "lucide-react";
import SearchSelect from "@/components/ui/SearchSelect";
import { useToast } from "@/components/ui/Toast";

interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  stock: number;
  supplier?: { name: string };
}

interface Supplier { id: string; name: string; cnpj?: string; }

const emptyForm = { name: "", description: "", sku: "", price: "", cost: "", stock: "0", minStock: "0", supplierId: "" };

export default function MercadoriasPage() {
  const { success, error: toastError, loading: toastLoading, update, dismiss } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch(`/api/mercadorias?search=${search}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      toastError("Erro ao carregar mercadorias");
    }
  }

  async function loadSuppliers() {
    try {
      const res = await fetch("/api/fornecedores?search=");
      const data = await res.json();
      setSuppliers(data.suppliers || []);
    } catch (err) {
      toastError("Erro ao carregar fornecedores");
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => { 
    load(); 
    loadSuppliers();
  }, [search]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    const toastId = toastLoading(editId ? "Atualizando..." : "Criando...");
    const url = editId ? `/api/mercadorias/${editId}` : "/api/mercadorias";
    const method = editId ? "PUT" : "POST";
    const payload = {
      name: form.name, description: form.description || null, sku: form.sku || null,
      price: parseFloat(form.price), cost: form.cost ? parseFloat(form.cost) : null,
      stock: parseInt(form.stock), minStock: parseInt(form.minStock),
      supplierId: form.supplierId || null,
    };
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        update(toastId, editId ? "Mercadoria atualizada! ✅" : "Mercadoria criada! ✅", "success");
        setShowForm(false); 
        setEditId(null); 
        setForm(emptyForm); 
        load();
      } else { 
        const err = await res.json(); 
        update(toastId, err.error || "Erro ao salvar", "error");
      }
    } catch (err) {
      update(toastId, "Erro de conexão", "error");
    }
    setFormLoading(false);
  }

  async function handleEdit(id: string) {
    try {
      const res = await fetch(`/api/mercadorias/${id}`);
      const p = await res.json();
      setForm({ name: p.name||"", description: p.description||"", sku: p.sku||"", price: String(p.price), cost: p.cost ? String(p.cost) : "", stock: String(p.stock), minStock: String(p.minStock), supplierId: p.supplierId||"" });
      setEditId(id); 
      setShowForm(true);
    } catch (err) {
      toastError("Erro ao carregar mercadoria");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja desativar esta mercadoria?")) return;
    const toastId = toastLoading("Removendo...");
    try {
      await fetch(`/api/mercadorias/${id}`, { method: "DELETE" });
      update(toastId, "Mercadoria removida! ✅", "success");
      load();
    } catch (err) {
      update(toastId, "Erro ao remover", "error");
    }
  }

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mercadorias</h1>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Nova Mercadoria
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar por nome ou SKU..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-gray-900">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Preço</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Estoque</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Fornecedor</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-800 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                <td className="px-6 py-4 text-gray-800">{p.sku || "-"}</td>
                <td className="px-6 py-4 text-gray-800">{fmt(p.price)}</td>
                <td className="px-6 py-4 text-gray-800">{p.stock}</td>
                <td className="px-6 py-4 text-gray-800">{p.supplier?.name || "-"}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => handleEdit(p.id)} className="text-blue-600 hover:text-blue-800"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-600">Nenhuma mercadoria encontrada</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{editId ? "Editar Mercadoria" : "Nova Mercadoria"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label><input name="name" value={form.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">SKU</label><input name="sku" value={form.sku} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Preço *</label><input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Custo</label><input name="cost" type="number" step="0.01" value={form.cost} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label><input name="stock" type="number" value={form.stock} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo</label><input name="minStock" type="number" value={form.minStock} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                  <SearchSelect
                    options={suppliers.map(s => ({ value: s.id, label: s.name, sub: s.cnpj || undefined }))}
                    value={form.supplierId}
                    onChange={(val) => setForm({ ...form, supplierId: val })}
                    placeholder="Buscar fornecedor..."
                  />
                </div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label><textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium">Cancelar</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{formLoading ? "Salvando..." : "Salvar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
