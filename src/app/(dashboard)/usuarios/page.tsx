"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, X, Shield, ShieldCheck, UserCog } from "lucide-react";

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

const emptyForm = { name: "", email: "", password: "", role: "SECRETARIA" };

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
    setForm({ ...form, [e.target.name]: e.target.value });
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
    const payload: any = { name: form.name, email: form.email, role: form.role };
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
    setForm({ name: u.name || "", email: u.email || "", password: "", role: u.role || "SECRETARIA" });
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={18} /> Novo Usuário
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar por nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-gray-900">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Perfil</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Criado em</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-800 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 flex items-center gap-2">
                  {u.role === "ADMIN" ? <ShieldCheck size={16} className="text-red-500" /> : u.role === "COBRADOR" ? <UserCog size={16} className="text-amber-500" /> : <Shield size={16} className="text-blue-400" />}
                  {u.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-800">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[u.role]}`}>
                    {roleLabels[u.role]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {u.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-800">{fmtDate(u.createdAt)}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => handleEdit(u.id)} className="text-blue-600 hover:text-blue-800"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nenhum usuário encontrado</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{editId ? "Editar Usuário" : "Novo Usuário"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input name="name" value={form.name} onChange={handleChange} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editId ? "Nova Senha (deixe em branco para manter)" : "Senha *"}
                </label>
                <input name="password" type="password" value={form.password} onChange={handleChange}
                  required={!editId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={editId ? "••••••••" : ""} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Acesso *</label>
                <select name="role" value={form.role} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="SECRETARIA">Secretária</option>
                  <option value="COBRADOR">Cobrador</option>
                  <option value="AGENTE_FUNERARIO">Agente Funerário</option>
                  <option value="GERENTE">Gerente</option>
                  <option value="ADMIN">Administrador</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {form.role === "ADMIN" && "Acesso total ao sistema"}
                  {form.role === "GERENTE" && "Gerencia equipe, relatórios e financeiro"}
                  {form.role === "SECRETARIA" && "Cadastros, carnês e atendimento"}
                  {form.role === "COBRADOR" && "Carnês, pagamentos e rotas de cobrança"}
                  {form.role === "AGENTE_FUNERARIO" && "Atendimento funerário e serviços"}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium">Cancelar</button>
                <button type="submit" disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
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
