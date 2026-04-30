"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X, Search } from "lucide-react";
import SearchSelect from "@/components/ui/SearchSelect";
import { useToast } from "@/components/ui/Toast";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtDate = (d: string) => new Intl.DateTimeFormat("pt-BR").format(new Date(d));

const paymentMethods = [
  { value: "CASH", label: "Dinheiro" },
  { value: "PIX", label: "Pix" },
  { value: "CARD", label: "Cartão" },
  { value: "BANK_TRANSFER", label: "Transferência" },
  { value: "OTHER", label: "Outro" },
];

export default function VendasPage() {
  const { success, error: toastError, loading: toastLoading, update } = useToast();
  const [sales, setSales] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    serviceId: "", clientId: "", clientName: "", quantity: "1", unitPrice: "",
    discount: "", paymentMethod: "CASH", status: "PAID", notes: "", date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [salesRes, sRes, cRes] = await Promise.all([
        fetch("/api/servicos/vendas"), fetch("/api/servicos"), fetch("/api/clientes"),
      ]);
      if (!salesRes.ok || !sRes.ok || !cRes.ok) {
        throw new Error("Erro ao carregar dados");
      }
      const salesData = await salesRes.json();
      const sData = await sRes.json();
      const cData = await cRes.json();
      setSales(Array.isArray(salesData) ? salesData : salesData.data || []);
      setServices(Array.isArray(sData) ? sData : sData.data || []);
      setClients(Array.isArray(cData) ? cData : cData.data || []);
    } catch (err) {
      console.error("Erro ao carregar vendas:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    const toastId = toastLoading("Registrando venda...");
    try {
      const res = await fetch("/api/servicos/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        update(toastId, "Venda registrada! ✅", "success");
        setShowForm(false);
        setForm({
          serviceId: "", clientId: "", clientName: "", quantity: "1", unitPrice: "",
          discount: "", paymentMethod: "CASH", status: "PAID", notes: "", date: new Date().toISOString().slice(0, 10),
        });
        loadData();
      } else {
        const err = await res.json();
        update(toastId, err.error || "Erro ao registrar", "error");
      }
    } catch (err) {
      update(toastId, "Erro de conexão", "error");
    }
    setFormLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir esta venda?")) return;
    const toastId = toastLoading("Removendo...");
    try {
      await fetch(`/api/servicos/vendas/${id}`, { method: "DELETE" });
      update(toastId, "Venda removida! ✅", "success");
      loadData();
    } catch (err) {
      update(toastId, "Erro ao remover", "error");
    }
  }

  function openNewSale(serviceId?: string) {
    const service = services.find(s => s.id === serviceId);
    setForm({
      serviceId: serviceId || "", clientId: "", clientName: "", quantity: "1",
      unitPrice: service ? String(service.price) : "",
      discount: "", paymentMethod: "CASH", status: "PAID", notes: "",
      date: new Date().toISOString().slice(0, 10),
    });
    setShowForm(true);
  }

  const filteredSales = sales.filter(s =>
    (s.service?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.client?.name || s.clientName || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Carregando...</p></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vendas de Serviços</h1>
        <button onClick={() => openNewSale()} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          <Plus size={18} /> Nova Venda
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar por serviço ou cliente..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      {/* Tabela de Vendas */}
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
            {filteredSales.map(s => (
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
                  <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-800">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredSales.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-gray-500">Nenhuma venda registrada</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Venda */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Registrar Venda de Serviço</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serviço *</label>
                <select required value={form.serviceId} onChange={e => {
                  const svc = services.find(s => s.id === e.target.value);
                  setForm({ ...form, serviceId: e.target.value, unitPrice: svc ? String(svc.price) : form.unitPrice });
                }} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Selecione o serviço...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} - {fmt(s.price)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <SearchSelect
                  options={clients.map((c: any) => ({ value: c.id, label: c.name, sub: c.cpf || undefined }))}
                  value={form.clientId}
                  onChange={(val) => setForm({ ...form, clientId: val })}
                  placeholder="Buscar cliente por nome ou CPF..."
                />
              </div>
              {!form.clientId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente (avulso)</label>
                  <input value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" placeholder="Nome do cliente" />
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qtd</label>
                  <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Unit.</label>
                  <input type="number" step="0.01" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desconto</label>
                  <input type="number" step="0.01" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pagamento</label>
                  <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500">
                    {paymentMethods.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500">
                    <option value="PAID">Pago</option>
                    <option value="PENDING">Pendente</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium">Cancelar</button>
                <button type="submit" disabled={formLoading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">{formLoading ? "Registrando..." : "Registrar Venda"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
