"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Wrench, ShoppingCart, X, Search } from "lucide-react";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtDate = (d: string) => new Intl.DateTimeFormat("pt-BR").format(new Date(d));

const categories = ["Tanatopraxia", "Translado", "Ornamentação", "Velório", "Sepultamento", "Cremação", "Documentação", "Aluguel de Capela", "Aluguel de Ônibus", "Aluguel", "Outro"];
const paymentMethods = [
  { value: "CASH", label: "Dinheiro" },
  { value: "PIX", label: "Pix" },
  { value: "CARD", label: "Cartão" },
  { value: "BANK_TRANSFER", label: "Transferência" },
  { value: "OTHER", label: "Outro" },
];

export default function ServicosPage() {
  const [services, setServices] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [tab, setTab] = useState<"catalogo" | "vendas">("catalogo");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({ name: "", description: "", price: "", cost: "", category: "" });
  const [saleForm, setSaleForm] = useState({
    serviceId: "", clientId: "", clientName: "", quantity: "1", unitPrice: "",
    discount: "", paymentMethod: "CASH", status: "PAID", notes: "", date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [sRes, salesRes, cRes] = await Promise.all([
      fetch("/api/servicos"), fetch("/api/servicos/vendas"), fetch("/api/clientes"),
    ]);
    setServices(await sRes.json());
    setSales(await salesRes.json());
    const cData = await cRes.json();
    setClients(Array.isArray(cData) ? cData : cData.data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editing ? `/api/servicos/${editing.id}` : "/api/servicos";
    const method = editing ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", description: "", price: "", cost: "", category: "" });
    loadData();
  }

  async function handleSaleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/servicos/vendas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saleForm),
    });
    setShowSaleForm(false);
    setSaleForm({
      serviceId: "", clientId: "", clientName: "", quantity: "1", unitPrice: "",
      discount: "", paymentMethod: "CASH", status: "PAID", notes: "", date: new Date().toISOString().slice(0, 10),
    });
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir este serviço?")) return;
    await fetch(`/api/servicos/${id}`, { method: "DELETE" });
    loadData();
  }

  async function handleDeleteSale(id: string) {
    if (!confirm("Deseja excluir esta venda?")) return;
    await fetch(`/api/servicos/vendas/${id}`, { method: "DELETE" });
    loadData();
  }

  function openEdit(s: any) {
    setEditing(s);
    setForm({ name: s.name, description: s.description || "", price: String(s.price), cost: s.cost ? String(s.cost) : "", category: s.category || "" });
    setShowForm(true);
  }

  function openNewSale(serviceId?: string) {
    const service = services.find(s => s.id === serviceId);
    setSaleForm({
      serviceId: serviceId || "", clientId: "", clientName: "", quantity: "1",
      unitPrice: service ? String(service.price) : "",
      discount: "", paymentMethod: "CASH", status: "PAID", notes: "",
      date: new Date().toISOString().slice(0, 10),
    });
    setShowSaleForm(true);
  }

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.category || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Carregando...</p></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
        <div className="flex gap-2">
          <button onClick={() => openNewSale()} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            <ShoppingCart size={18} /> Nova Venda
          </button>
          <button onClick={() => { setEditing(null); setForm({ name: "", description: "", price: "", cost: "", category: "" }); setShowForm(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus size={18} /> Novo Serviço
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button onClick={() => setTab("catalogo")}
          className={`pb-2 px-1 font-medium ${tab === "catalogo" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
          <Wrench size={16} className="inline mr-1" /> Catálogo ({services.length})
        </button>
        <button onClick={() => setTab("vendas")}
          className={`pb-2 px-1 font-medium ${tab === "vendas" ? "text-green-600 border-b-2 border-green-600" : "text-gray-500 hover:text-gray-700"}`}>
          <ShoppingCart size={16} className="inline mr-1" /> Vendas ({sales.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Catálogo */}
      {tab === "catalogo" && (
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
                      <button onClick={() => openNewSale(s.id)} className="text-green-600 hover:text-green-800" title="Vender">
                        <ShoppingCart size={16} />
                      </button>
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
      )}

      {/* Vendas */}
      {tab === "vendas" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b">
              <th className="py-3 px-4 text-left font-semibold text-gray-800">Data</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-800">Serviço</th>
              <th className="py-3 px-4 text-left font-semibold text-gray-800">Cliente</th>
              <th className="py-3 px-4 text-center font-semibold text-gray-800">Qtd</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-800">Total</th>
              <th className="py-3 px-4 text-center font-semibold text-gray-800">Status</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-800">Ações</th>
            </tr></thead>
            <tbody>
              {sales.filter(s =>
                (s.service?.name || "").toLowerCase().includes(search.toLowerCase()) ||
                (s.client?.name || s.clientName || "").toLowerCase().includes(search.toLowerCase())
              ).map(s => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-800">{fmtDate(s.date)}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{s.service?.name}</td>
                  <td className="py-3 px-4 text-gray-800">{s.client?.name || s.clientName || "-"}</td>
                  <td className="py-3 px-4 text-center text-gray-800">{s.quantity}</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">{fmt(s.totalPrice)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.status === "PAID" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {s.status === "PAID" ? "Pago" : "Pendente"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleDeleteSale(s.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-gray-500">Nenhuma venda registrada</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editing ? "Salvar" : "Cadastrar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form Venda */}
      {showSaleForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Registrar Venda de Serviço</h2>
              <button onClick={() => setShowSaleForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serviço *</label>
                <select required value={saleForm.serviceId} onChange={e => {
                  const svc = services.find(s => s.id === e.target.value);
                  setSaleForm({ ...saleForm, serviceId: e.target.value, unitPrice: svc ? String(svc.price) : saleForm.unitPrice });
                }} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Selecione o serviço...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} - {fmt(s.price)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <select value={saleForm.clientId} onChange={e => setSaleForm({ ...saleForm, clientId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Cliente avulso (não cadastrado)</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name} {c.cpf ? `- ${c.cpf}` : ""}</option>)}
                </select>
              </div>
              {!saleForm.clientId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente (avulso)</label>
                  <input value={saleForm.clientName} onChange={e => setSaleForm({ ...saleForm, clientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nome do cliente" />
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input type="date" value={saleForm.date} onChange={e => setSaleForm({ ...saleForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qtd</label>
                  <input type="number" min="1" value={saleForm.quantity} onChange={e => setSaleForm({ ...saleForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Unit.</label>
                  <input type="number" step="0.01" value={saleForm.unitPrice} onChange={e => setSaleForm({ ...saleForm, unitPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desconto</label>
                  <input type="number" step="0.01" value={saleForm.discount} onChange={e => setSaleForm({ ...saleForm, discount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pagamento</label>
                  <select value={saleForm.paymentMethod} onChange={e => setSaleForm({ ...saleForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    {paymentMethods.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={saleForm.status} onChange={e => setSaleForm({ ...saleForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="PAID">Pago</option>
                    <option value="PENDING">Pendente</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea value={saleForm.notes} onChange={e => setSaleForm({ ...saleForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowSaleForm(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Registrar Venda</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
