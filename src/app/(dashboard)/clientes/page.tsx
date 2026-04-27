"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, X, Eye, Users, MapPin } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { estados, cidadesPorEstado, bairrosPorCidade, estadosCivis, getCidades, getBairros } from "@/lib/location-data";

interface Client {
  id: string;
  code?: string;
  name: string;
  cpf?: string;
  phone?: string;
  cellphone?: string;
  city?: string;
  neighborhood?: string;
  status: string;
  dueDay?: number;
  paymentLocation?: string;
  isAssured?: boolean;
  _count?: { dependents: number };
}

const statusLabels: Record<string, string> = { ACTIVE: "Ativo", CANCELLED: "Cancelado", SUSPENDED: "Suspenso" };
const statusColors: Record<string, string> = { ACTIVE: "bg-emerald-100 text-emerald-800", CANCELLED: "bg-red-100 text-red-800", SUSPENDED: "bg-amber-100 text-amber-800" };

const emptyForm: any = {
  name: "", cpf: "", rg: "", phone: "", cellphone: "", email: "",
  address: "", number: "", complement: "", neighborhood: "", city: "", state: "", zipCode: "",
  civilStatus: "", profession: "", workplace: "", fatherName: "", motherName: "", spouseName: "",
  dueDay: "10", paymentLocation: "RESIDENCIA", notes: "", isAssured: false,
  billingAddressSame: true, billingAddress: "", billingNumber: "", billingComplement: "",
  billingNeighborhood: "", billingCity: "", billingState: "", billingZipCode: "", billingReference: "",
  dependents: [],
};

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [showDependents, setShowDependents] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [dependents, setDependents] = useState<any[]>([]);
  const [newDependent, setNewDependent] = useState({ name: "", relationship: "OUTRO", cpf: "", phone: "", birthDate: "" });
  
  // Geolocalização
  const { cidade: geoCidade, estado: geoEstado, loading: geoLoading } = useGeolocation();
  
  // Estados para dropdowns
  const [cidadesDisponiveis, setCidadesDisponiveis] = useState<string[]>([]);
  const [bairrosDisponiveis, setBairrosDisponiveis] = useState<string[]>([]);
  
  // Atualizar cidades quando estado mudar
  useEffect(() => {
    if (form.state) {
      const cidades = getCidades(form.state);
      setCidadesDisponiveis(cidades);
      // Se a cidade atual não estiver na lista, limpar
      if (form.city && !cidades.includes(form.city)) {
        setForm((prev: any) => ({ ...prev, city: "", neighborhood: "" }));
        setBairrosDisponiveis([]);
      }
    } else {
      setCidadesDisponiveis([]);
    }
  }, [form.state]);
  
  // Atualizar bairros quando cidade mudar
  useEffect(() => {
    if (form.city) {
      const bairros = getBairros(form.city);
      setBairrosDisponiveis(bairros);
      // Se o bairro atual não estiver na lista, limpar
      if (form.neighborhood && !bairros.includes(form.neighborhood)) {
        setForm((prev: any) => ({ ...prev, neighborhood: "" }));
      }
    } else {
      setBairrosDisponiveis([]);
    }
  }, [form.city]);
  
  // Preencher cidade via geolocalização quando disponível
  useEffect(() => {
    if (geoCidade && !form.city && !editId) {
      // Verificar se a cidade está na lista de cidades do estado
      const estadoSigla = geoEstado === "Amapá" ? "AP" : geoEstado === "Pará" ? "PA" : "AP";
      setForm((prev: any) => ({ ...prev, city: geoCidade, state: estadoSigla }));
    }
  }, [geoCidade, geoEstado, editId]);

  async function loadClients() {
    try {
      const params = new URLSearchParams({ search, page: String(page) });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/clientes?${params}`);
      if (!res.ok) throw new Error("Erro ao carregar clientes");
      const data = await res.json();
      setClients(data.clients || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
      setClients([]);
      setTotal(0);
      setPages(1);
    }
  }

  useEffect(() => { loadClients(); }, [search, statusFilter, page]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const url = editId ? `/api/clientes/${editId}` : "/api/clientes";
    const method = editId ? "PUT" : "POST";
    const payload = { ...form, dueDay: parseInt(form.dueDay) || 10 };
    if (!payload.cpf) delete payload.cpf;
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { setShowForm(false); setEditId(null); setForm(emptyForm); loadClients(); }
    else { const err = await res.json(); alert(err.error || "Erro ao salvar"); }
    setLoading(false);
  }

  async function handleEdit(id: string) {
    const res = await fetch(`/api/clientes/${id}`);
    const c = await res.json();
    const f: any = {};
    Object.keys(emptyForm).forEach(k => { f[k] = c[k] || emptyForm[k]; });
    f.dueDay = String(c.dueDay || 10);
    f.paymentLocation = c.paymentLocation || "RESIDENCIA";
    f.billingAddressSame = c.billingAddressSame !== false;
    f.isAssured = c.isAssured || false;
    setForm(f);
    setDependents(c.dependents || []);
    setEditId(id);
    setShowForm(true);
  }

  async function handleDetail(id: string) {
    const res = await fetch(`/api/clientes/${id}`);
    const data = await res.json();
    setShowDetail(data);
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja cancelar este cliente?")) return;
    await fetch(`/api/clientes/${id}`, { method: "DELETE" });
    loadClients();
  }

  async function addDependent() {
    if (!newDependent.name.trim()) {
      alert("Nome do dependente é obrigatório");
      return;
    }
    if (!editId) {
      setDependents([...dependents, { ...newDependent, id: Date.now().toString() }]);
    } else {
      const res = await fetch(`/api/dependents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: editId, ...newDependent }),
      });
      if (res.ok) {
        const dependent = await res.json();
        setDependents([...dependents, dependent]);
      }
    }
    setNewDependent({ name: "", relationship: "OUTRO", cpf: "", phone: "", birthDate: "" });
  }

  async function deleteDependent(depId: string) {
    if (!confirm("Deseja remover este dependente?")) return;
    if (depId.length > 10) {
      await fetch(`/api/dependents/${depId}`, { method: "DELETE" });
    }
    setDependents(dependents.filter(d => d.id !== depId));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-600">{total} clientes encontrados</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
          <Plus size={18} /> Novo Cliente
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por nome, CPF, código ou celular..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none">
          <option value="">Todos</option>
          <option value="ACTIVE">Ativos</option>
          <option value="CANCELLED">Cancelados</option>
          <option value="SUSPENDED">Suspensos</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-gray-900">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Cód</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Telefone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Bairro</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Local Pgto</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase">Dep.</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase">Assegurado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-800 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-800 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-[#d4e4f7]">
                <td className="px-4 py-3 text-sm text-gray-600">{c.code || "-"}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.cellphone || c.phone || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.neighborhood || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {c.paymentLocation === "LOJA" ? "Loja" : "Residência"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  {(c._count?.dependents || 0) > 0 && (
                    <span className="flex items-center justify-center gap-1 text-blue-600">
                      <Users size={12} /> {c._count?.dependents}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  {c.isAssured ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-900 text-emerald-300">✓ Sim</span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">Não</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[c.status] || "bg-gray-200 text-gray-600"}`}>
                    {statusLabels[c.status] || c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-1">
                  <button onClick={() => handleDetail(c.id)} className="text-emerald-600 hover:text-emerald-800"><Eye size={16} /></button>
                  <button onClick={() => handleEdit(c.id)} className="text-blue-600 hover:text-blue-800"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && <tr><td colSpan={10} className="px-6 py-8 text-center text-gray-500 bg-gray-50">Nenhum cliente encontrado</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`px-3 py-1 rounded ${p === page ? "bg-[#4a6fa5] text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>{p}</button>
          ))}
          {pages > 10 && <span className="px-2 py-1 text-gray-500">...</span>}
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 border border-gray-200 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#4a6fa5]">{showDetail.name}</h2>
                <p className="text-sm text-gray-600">Código: {showDetail.code || "-"} | CPF: {showDetail.cpf || "-"}</p>
              </div>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div><span className="text-[#4a6fa5] font-medium">Endereço:</span> <span className="text-gray-900">{showDetail.address || "-"}, {showDetail.neighborhood || "-"}</span></div>
              <div><span className="text-[#4a6fa5] font-medium">Cidade:</span> <span className="text-gray-900">{showDetail.city || "-"}/{showDetail.state || "-"}</span></div>
              <div><span className="text-[#4a6fa5] font-medium">Celular:</span> <span className="text-gray-900">{showDetail.cellphone || "-"}</span></div>
              <div><span className="text-[#4a6fa5] font-medium">Telefone:</span> <span className="text-gray-900">{showDetail.phone || "-"}</span></div>
              <div><span className="text-[#4a6fa5] font-medium">Estado Civil:</span> <span className="text-gray-900">{showDetail.civilStatus || "-"}</span></div>
              <div><span className="text-[#4a6fa5] font-medium">Profissão:</span> <span className="text-gray-900">{showDetail.profession || "-"}</span></div>
              <div><span className="text-[#4a6fa5] font-medium">Cônjuge:</span> <span className="text-gray-900">{showDetail.spouseName || "-"}</span></div>
              <div><span className="text-[#4a6fa5] font-medium">Dia Vencimento:</span> <span className="text-gray-900">{showDetail.dueDay || "-"}</span></div>
              <div><span className="text-[#4a6fa5] font-medium">Local Pagamento:</span> <span className="text-gray-900">{showDetail.paymentLocation === "LOJA" ? "Loja" : "Residência"}</span></div>
              <div>
                <span className="text-[#4a6fa5] font-medium">Cliente Assegurado:</span>
                <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium" style={{
                  backgroundColor: showDetail.isAssured ? '#d1fae5' : '#f3f4f6',
                  color: showDetail.isAssured ? '#065f46' : '#6b7280'
                }}>
                  {showDetail.isAssured ? "✓ Sim" : "Não"}
                </span>
              </div>
              <div><span className="text-[#4a6fa5] font-medium">Pai:</span> <span className="text-gray-900">{showDetail.fatherName || "-"}</span></div>
              <div><span className="text-[#4a6fa5] font-medium">Mãe:</span> <span className="text-gray-900">{showDetail.motherName || "-"}</span></div>
            </div>

            {/* Endereço de Cobrança */}
            {showDetail.billingAddressSame === false && showDetail.billingAddress && (
              <div className="bg-[#d4e4f7] border border-[#4a6fa5] rounded-lg p-4 mb-6">
                <h3 className="font-bold text-[#4a6fa5] mb-2 flex items-center gap-2"><MapPin size={16} /> Endereço de Cobrança (diferente do residencial)</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-[#4a6fa5] font-medium">Endereço:</span> <span className="text-gray-900">{showDetail.billingAddress}{showDetail.billingNumber ? `, ${showDetail.billingNumber}` : ""}</span></div>
                  {showDetail.billingComplement && <div><span className="text-[#4a6fa5] font-medium">Complemento:</span> <span className="text-gray-900">{showDetail.billingComplement}</span></div>}
                  <div><span className="text-[#4a6fa5] font-medium">Bairro:</span> <span className="text-gray-900">{showDetail.billingNeighborhood || "-"}</span></div>
                  <div><span className="text-[#4a6fa5] font-medium">Cidade:</span> <span className="text-gray-900">{showDetail.billingCity || showDetail.city || "-"}/{showDetail.billingState || showDetail.state || "-"}</span></div>
                  {showDetail.billingReference && <div className="col-span-2"><span className="text-[#4a6fa5] font-medium">Referência:</span> <span className="text-gray-900">{showDetail.billingReference}</span></div>}
                </div>
              </div>
            )}

            {/* Dependents */}
            {showDetail.dependents?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-[#4a6fa5] mb-2 flex items-center gap-2"><Users size={16} /> Dependentes ({showDetail.dependents.length})</h3>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  {showDetail.dependents.map((d: any) => (
                    <div key={d.id} className="flex justify-between py-1 border-b border-gray-200 last:border-0">
                      <span className="text-sm text-gray-900">{d.name}</span>
                      <span className="text-xs text-gray-600">{d.relationship}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Carnês */}
            {showDetail.carnes?.length > 0 && (
              <div>
                <h3 className="font-bold text-[#4a6fa5] mb-2">Carnês</h3>
                {showDetail.carnes.slice(0, 3).map((c: any) => {
                  const paid = c.payments.filter((p: any) => p.status === "PAID").length;
                  const total = c.payments.length;
                  return (
                    <div key={c.id} className="bg-gray-50 rounded-lg p-3 mb-2 border border-gray-200">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-900">{c.year}</span>
                        <span className="text-sm text-emerald-600">{paid}/{total} pagos</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(paid / total) * 100}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {showDetail.notes && <p className="text-sm text-gray-600 mt-4"><strong className="text-[#4a6fa5]">Obs:</strong> {showDetail.notes}</p>}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{editId ? "Editar Cliente" : "Novo Cliente"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label><input name="name" value={form.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">CPF</label><input name="cpf" value={form.cpf} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">RG</label><input name="rg" value={form.rg} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Celular</label><input name="cellphone" value={form.cellphone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label><input name="phone" value={form.phone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label><input name="address" value={form.address} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                
                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select 
                    name="state" 
                    value={form.state} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    {estados.map(e => (
                      <option key={e.sigla} value={e.sigla}>{e.nome}</option>
                    ))}
                  </select>
                </div>
                
                {/* Cidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade {geoLoading && <span className="text-xs text-blue-500">(detectando...)</span>}</label>
                  <select 
                    name="city" 
                    value={form.city} 
                    onChange={handleChange} 
                    disabled={!form.state}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">{form.state ? "Selecione" : "Selecione o estado primeiro"}</option>
                    {cidadesDisponiveis.map(cidade => (
                      <option key={cidade} value={cidade}>{cidade}</option>
                    ))}
                  </select>
                </div>
                
                {/* Bairro */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                  <select 
                    name="neighborhood" 
                    value={form.neighborhood} 
                    onChange={handleChange} 
                    disabled={!form.city}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">{form.city ? "Selecione" : "Selecione a cidade primeiro"}</option>
                    {bairrosDisponiveis.map(bairro => (
                      <option key={bairro} value={bairro}>{bairro}</option>
                    ))}
                    <option value="OUTRO">Outro (digitar manualmente)</option>
                  </select>
                  {form.neighborhood === "OUTRO" && (
                    <input
                      type="text"
                      placeholder="Digite o bairro"
                      value={form.neighborhood === "OUTRO" ? "" : form.neighborhood}
                      onChange={e => setForm({ ...form, neighborhood: e.target.value })}
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
                
                <div><label className="block text-sm font-medium text-gray-700 mb-1">CEP</label><input name="zipCode" value={form.zipCode} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                
                {/* Estado Civil */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado Civil</label>
                  <select 
                    name="civilStatus" 
                    value={form.civilStatus} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione</option>
                    {estadosCivis.map(ec => (
                      <option key={ec} value={ec}>{ec}</option>
                    ))}
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Profissão</label><input name="profession" value={form.profession} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Cônjuge</label><input name="spouseName" value={form.spouseName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Pai</label><input name="fatherName" value={form.fatherName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Mãe</label><input name="motherName" value={form.motherName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dia Vencimento</label>
                  <input name="dueDay" type="number" min="1" max="31" value={form.dueDay} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Local de Pagamento</label>
                  <select name="paymentLocation" value={form.paymentLocation} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="RESIDENCIA">Residência</option>
                    <option value="LOJA">Loja</option>
                  </select>
                </div>

                {/* Cliente Assegurado */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isAssured || false}
                      onChange={e => setForm({ ...form, isAssured: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">✓ Cliente Assegurado</span>
                  </label>
                </div>

                {/* Endereço de Cobrança */}
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin size={18} className="text-blue-600" />
                    <h3 className="font-bold text-gray-900">Endereço de Cobrança</h3>
                  </div>
                  <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input type="checkbox" checked={form.billingAddressSame}
                      onChange={e => setForm({ ...form, billingAddressSame: e.target.checked })}
                      className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Mesmo endereço residencial</span>
                  </label>
                </div>

                {!form.billingAddressSame && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Endereço de Cobrança</label>
                      <input name="billingAddress" value={form.billingAddress} onChange={handleChange} placeholder="Rua, Av..." className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                      <input name="billingNumber" value={form.billingNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                      <input name="billingComplement" value={form.billingComplement} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                      <input name="billingNeighborhood" value={form.billingNeighborhood} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                      <input name="billingCity" value={form.billingCity} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <input name="billingState" value={form.billingState} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                      <input name="billingZipCode" value={form.billingZipCode} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ponto de Referência</label>
                      <input name="billingReference" value={form.billingReference} onChange={handleChange} placeholder="Próximo a..." className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </>
                )}

                {/* Dependentes - ÚLTIMO NO FORMULÁRIO */}
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Users size={18} className="text-blue-600" />
                      <h3 className="font-bold text-gray-900">Dependentes</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, dependents: [...(form.dependents || []), { name: "", relationship: "", birthDate: "" }] })}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>
                  
                  {form.dependents?.length === 0 && (
                    <p className="text-sm text-gray-500 italic">Nenhum dependente cadastrado</p>
                  )}
                  
                  {form.dependents?.map((dep: any, index: number) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
                        <input
                          value={dep.name}
                          onChange={e => {
                            const newDeps = [...form.dependents];
                            newDeps[index].name = e.target.value;
                            setForm({ ...form, dependents: newDeps });
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Nome do dependente"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Parentesco</label>
                        <select
                          value={dep.relationship}
                          onChange={e => {
                            const newDeps = [...form.dependents];
                            newDeps[index].relationship = e.target.value;
                            setForm({ ...form, dependents: newDeps });
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Selecione</option>
                          <option value="Cônjuge">Cônjuge</option>
                          <option value="Filho(a)">Filho(a)</option>
                          <option value="Pai">Pai</option>
                          <option value="Mãe">Mãe</option>
                          <option value="Irmão(ã)">Irmão(ã)</option>
                          <option value="Neto(a)">Neto(a)</option>
                          <option value="Sobrinho(a)">Sobrinho(a)</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">CPF</label>
                        <input
                          value={dep.cpf || ""}
                          onChange={e => {
                            const newDeps = [...form.dependents];
                            newDeps[index].cpf = e.target.value;
                            setForm({ ...form, dependents: newDeps });
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="000.000.000-00"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Nascimento</label>
                          <input
                            type="date"
                            value={dep.birthDate}
                            onChange={e => {
                              const newDeps = [...form.dependents];
                              newDeps[index].birthDate = e.target.value;
                              setForm({ ...form, dependents: newDeps });
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newDeps = form.dependents.filter((_: any, i: number) => i !== index);
                            setForm({ ...form, dependents: newDeps });
                          }}
                          className="self-end p-1 text-red-500 hover:text-red-700"
                          title="Remover"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Observações</label><textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
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
