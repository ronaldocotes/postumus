"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, X, Eye, Users, MapPin } from "lucide-react";

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
  cobrador?: { name: string };
  _count?: { dependents: number };
}

const statusLabels: Record<string, string> = { ACTIVE: "Ativo", CANCELLED: "Cancelado", SUSPENDED: "Suspenso" };
const statusColors: Record<string, string> = { ACTIVE: "bg-green-100 text-green-700", CANCELLED: "bg-red-100 text-red-700", SUSPENDED: "bg-yellow-100 text-yellow-700" };

const emptyForm: any = {
  name: "", cpf: "", rg: "", phone: "", cellphone: "", email: "",
  address: "", number: "", complement: "", neighborhood: "", city: "", state: "", zipCode: "",
  civilStatus: "", profession: "", workplace: "", fatherName: "", motherName: "", spouseName: "",
  dueDay: "10", paymentLocation: "RESIDENCIA", notes: "",
  billingAddressSame: true, billingAddress: "", billingNumber: "", billingComplement: "",
  billingNeighborhood: "", billingCity: "", billingState: "", billingZipCode: "", billingReference: "",
};

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  async function loadClients() {
    const params = new URLSearchParams({ search, page: String(page) });
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/clientes?${params}`);
    const data = await res.json();
    setClients(data.clients || []);
    setTotal(data.total || 0);
    setPages(data.pages || 1);
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
    setForm(f);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">{total} clientes encontrados</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus size={18} /> Novo Cliente
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por nome, CPF, código ou celular..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg outline-none">
          <option value="">Todos</option>
          <option value="ACTIVE">Ativos</option>
          <option value="CANCELLED">Cancelados</option>
          <option value="SUSPENDED">Suspensos</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cód</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bairro</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Local Pgto</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cobrador</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Dep.</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-500">{c.code || "-"}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.cellphone || c.phone || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.neighborhood || "-"}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {c.paymentLocation === "LOJA" ? "Loja" : "Residência"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.cobrador?.name || "-"}</td>
                <td className="px-4 py-3 text-sm text-center">
                  {(c._count?.dependents || 0) > 0 && (
                    <span className="flex items-center justify-center gap-1 text-blue-600">
                      <Users size={12} /> {c._count?.dependents}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[c.status] || "bg-gray-100"}`}>
                    {statusLabels[c.status] || c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-1">
                  <button onClick={() => handleDetail(c.id)} className="text-green-600 hover:text-green-800"><Eye size={16} /></button>
                  <button onClick={() => handleEdit(c.id)} className="text-blue-600 hover:text-blue-800"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && <tr><td colSpan={9} className="px-6 py-8 text-center text-gray-500">Nenhum cliente encontrado</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`px-3 py-1 rounded ${p === page ? "bg-blue-600 text-white" : "bg-gray-200"}`}>{p}</button>
          ))}
          {pages > 10 && <span className="px-2 py-1">...</span>}
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{showDetail.name}</h2>
                <p className="text-sm text-gray-500">Código: {showDetail.code || "-"} | CPF: {showDetail.cpf || "-"}</p>
              </div>
              <button onClick={() => setShowDetail(null)}><X size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div><span className="text-gray-500">Endereço:</span> {showDetail.address || "-"}, {showDetail.neighborhood || "-"}</div>
              <div><span className="text-gray-500">Cidade:</span> {showDetail.city || "-"}/{showDetail.state || "-"}</div>
              <div><span className="text-gray-500">Celular:</span> {showDetail.cellphone || "-"}</div>
              <div><span className="text-gray-500">Telefone:</span> {showDetail.phone || "-"}</div>
              <div><span className="text-gray-500">Estado Civil:</span> {showDetail.civilStatus || "-"}</div>
              <div><span className="text-gray-500">Profissão:</span> {showDetail.profession || "-"}</div>
              <div><span className="text-gray-500">Cônjuge:</span> {showDetail.spouseName || "-"}</div>
              <div><span className="text-gray-500">Dia Vencimento:</span> {showDetail.dueDay || "-"}</div>
              <div><span className="text-gray-500">Local Pagamento:</span> {showDetail.paymentLocation === "LOJA" ? "Loja" : "Residência"}</div>
              <div><span className="text-gray-500">Cobrador:</span> {showDetail.cobrador?.name || "-"}</div>
              <div><span className="text-gray-500">Pai:</span> {showDetail.fatherName || "-"}</div>
              <div><span className="text-gray-500">Mãe:</span> {showDetail.motherName || "-"}</div>
            </div>

            {/* Endereço de Cobrança */}
            {showDetail.billingAddressSame === false && showDetail.billingAddress && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><MapPin size={16} /> Endereço de Cobrança (diferente do residencial)</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-blue-600">Endereço:</span> <span className="text-gray-900">{showDetail.billingAddress}{showDetail.billingNumber ? `, ${showDetail.billingNumber}` : ""}</span></div>
                  {showDetail.billingComplement && <div><span className="text-blue-600">Complemento:</span> <span className="text-gray-900">{showDetail.billingComplement}</span></div>}
                  <div><span className="text-blue-600">Bairro:</span> <span className="text-gray-900">{showDetail.billingNeighborhood || "-"}</span></div>
                  <div><span className="text-blue-600">Cidade:</span> <span className="text-gray-900">{showDetail.billingCity || showDetail.city || "-"}/{showDetail.billingState || showDetail.state || "-"}</span></div>
                  {showDetail.billingReference && <div className="col-span-2"><span className="text-blue-600">Referência:</span> <span className="text-gray-900">{showDetail.billingReference}</span></div>}
                </div>
              </div>
            )}

            {/* Dependents */}
            {showDetail.dependents?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><Users size={16} /> Dependentes ({showDetail.dependents.length})</h3>
                <div className="bg-gray-50 rounded-lg p-3">
                  {showDetail.dependents.map((d: any) => (
                    <div key={d.id} className="flex justify-between py-1 border-b border-gray-200 last:border-0">
                      <span className="text-sm">{d.name}</span>
                      <span className="text-xs text-gray-500">{d.relationship}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Carnês */}
            {showDetail.carnes?.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Carnês</h3>
                {showDetail.carnes.slice(0, 3).map((c: any) => {
                  const paid = c.payments.filter((p: any) => p.status === "PAID").length;
                  const total = c.payments.length;
                  return (
                    <div key={c.id} className="bg-gray-50 rounded-lg p-3 mb-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{c.year}</span>
                        <span className="text-sm text-green-600">{paid}/{total} pagos</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(paid / total) * 100}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {showDetail.notes && <p className="text-sm text-gray-500 mt-4"><strong>Obs:</strong> {showDetail.notes}</p>}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editId ? "Editar Cliente" : "Novo Cliente"}</h2>
              <button onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label><input name="name" value={form.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">CPF</label><input name="cpf" value={form.cpf} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">RG</label><input name="rg" value={form.rg} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Celular</label><input name="cellphone" value={form.cellphone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label><input name="phone" value={form.phone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label><input name="address" value={form.address} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label><input name="neighborhood" value={form.neighborhood} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label><input name="city" value={form.city} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Estado</label><input name="state" value={form.state} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">CEP</label><input name="zipCode" value={form.zipCode} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Estado Civil</label><input name="civilStatus" value={form.civilStatus} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Profissão</label><input name="profession" value={form.profession} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
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
