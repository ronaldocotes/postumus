"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, X, Shield, ShieldCheck, UserCog, ChevronRight } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

const roleLabels: Record<string, string> = { ADMIN: "Administrador", GERENTE: "Gerente", SECRETARIA: "Secretária", COBRADOR: "Cobrador", AGENTE_FUNERARIO: "Agente Funerário" };
const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  GERENTE: "bg-green-100 text-green-700",
  SECRETARIA: "bg-blue-100 text-blue-700",
  COBRADOR: "bg-amber-100 text-amber-700",
  AGENTE_FUNERARIO: "bg-purple-100 text-purple-700",
};

const avatarColors = ["bg-purple-100", "bg-pink-100", "bg-blue-100", "bg-green-100", "bg-yellow-100", "bg-indigo-100", "bg-rose-100", "bg-cyan-100"];
const avatarTextColors = ["text-purple-700", "text-pink-700", "text-blue-700", "text-green-700", "text-yellow-700", "text-indigo-700", "text-rose-700", "text-cyan-700"];

const getAvatarColor = (name: string) => avatarColors[name.charCodeAt(0) % 8];
const getAvatarTextColor = (name: string) => avatarTextColors[name.charCodeAt(0) % 8];
const getInitials = (name: string) => name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();

const emptyForm = { name: "", email: "", password: "", role: "SECRETARIA", active: true };

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch(`/api/usuarios?search=${search}`);
    const data = await res.json();
    setUsers(data.users || []);
  }

  useEffect(() => { load(); }, [search]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
    setForm({ ...form, [target.name]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (!editId && !form.password) {
      alert("Senha é obrigatória para novos usuários");
      setLoading(false);
      return;
    }

    const url = editId ? `/api/usuarios/${editId}` : "/api/usuarios";
    const method = editId ? "PUT" : "POST";
    const payload: any = { name: form.name, email: form.email, role: form.role, active: form.active };
    if (form.password) payload.password = form.password;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
      load();
    } else {
      const err = await res.json();
      alert(err.error || "Erro ao salvar");
    }
    setLoading(false);
  }

  async function handleEdit(id: string) {
    const res = await fetch(`/api/usuarios/${id}`);
    const u = await res.json();
    setForm({ name: u.name || "", email: u.email || "", password: "", role: u.role || "SECRETARIA", active: u.active !== false });
    setEditId(id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja desativar este usuário?")) return;
    await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
    load();
  }

  const fmtDate = (d: string) => new Intl.DateTimeFormat("pt-BR").format(new Date(d));

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg">
          <Plus size={18} /> Novo Usuário
        </button>
      </div>

      <div className="relative mb-8">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar por nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => (
          <div key={u.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-blue-200 transition-all text-left cursor-pointer group">
            
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarColor(u.name)} ${getAvatarTextColor(u.name)}`}>
                  {getInitials(u.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{u.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Perfil</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[u.role]}`}>
                  {roleLabels[u.role]}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${u.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {u.active ? "Ativo" : "Inativo"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Criado</span>
                <span className="text-xs text-gray-700">{fmtDate(u.createdAt)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 flex gap-2">
              <button onClick={() => handleEdit(u.id)}
                className="flex-1 flex items-center justify-center gap-1 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors">
                <Edit size={14} /> Editar
              </button>
              <button onClick={() => handleDelete(u.id)}
                className="flex-1 flex items-center justify-center gap-1 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors">
                <Trash2 size={14} /> Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Nenhum usuário encontrado</p>
          <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
            className="text-blue-600 hover:text-blue-700 font-medium">Criar novo usuário</button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">{editId ? "Editar Usuário" : "Novo Usuário"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Nome *</label>
                <input name="name" value={form.name} onChange={handleChange} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {editId ? "Nova Senha (deixe em branco para manter)" : "Senha *"}
                </label>
                <input name="password" type="password" value={form.password} onChange={handleChange}
                  required={!editId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder={editId ? "••••••••" : ""} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Perfil de Acesso *</label>
                <select name="role" value={form.role} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
                  <option value="SECRETARIA">Secretária</option>
                  <option value="COBRADOR">Cobrador</option>
                  <option value="AGENTE_FUNERARIO">Agente Funerário</option>
                  <option value="GERENTE">Gerente</option>
                  <option value="ADMIN">Administrador</option>
                </select>
                <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                  {form.role === "ADMIN" && "✓ Acesso total ao sistema"}
                  {form.role === "GERENTE" && "✓ Gerencia equipe, relatórios e financeiro"}
                  {form.role === "SECRETARIA" && "✓ Cadastros, carnês e atendimento"}
                  {form.role === "COBRADOR" && "✓ Carnês, pagamentos e rotas de cobrança"}
                  {form.role === "AGENTE_FUNERARIO" && "✓ Atendimento funerário e serviços"}
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input type="checkbox" id="active" name="active" checked={form.active} onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                <label htmlFor="active" className="flex-1 text-sm font-medium text-gray-900 cursor-pointer">
                  Usuário Ativo
                </label>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${form.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {form.active ? "Ativo" : "Inativo"}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 font-medium transition-colors">Cancelar</button>
                <button type="submit" disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors">
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
