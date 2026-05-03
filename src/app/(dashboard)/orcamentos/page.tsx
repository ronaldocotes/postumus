"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  X,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  DollarSign,
  Send,
} from "lucide-react";
import SearchSelect from "@/components/ui/SearchSelect";
import { useToast } from "@/components/ui/Toast";

interface Budget {
  id: string;
  title: string;
  clientId: string | null;
  clientName: string | null;
  total: number;
  status: string;
  validUntil: string | null;
  createdAt: string;
  client: { id: string; name: string; cpf: string } | null;
  _count: { items: number };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDENTE: { label: "Pendente", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  APROVADO: { label: "Aprovado", color: "bg-green-100 text-green-700", icon: CheckCircle },
  REJEITADO: { label: "Rejeitado", color: "bg-red-100 text-red-700", icon: XCircle },
  EXPIRADO: { label: "Expirado", color: "bg-gray-100 text-gray-600", icon: Clock },
  CONVERTIDO: { label: "Convertido", color: "bg-blue-100 text-blue-700", icon: ArrowRight },
};

export default function OrcamentosPage() {
  const { success, error: toastError, loading: toastLoading, update } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);

  const [clientOptions, setClientOptions] = useState<{ value: string; label: string }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const [form, setForm] = useState({
    clientId: "",
    clientName: "",
    title: "",
    description: "",
    validUntil: "",
    notes: "",
    discount: "",
    items: [] as any[],
  });

  useEffect(() => {
    loadBudgets();
    fetch("/api/clientes?limit=999")
      .then((r) => r.json())
      .then((data) => {
        const clients = data.clients || data.data || [];
        setClientOptions(clients.map((c: any) => ({ value: c.id, label: c.name })));
      });
    fetch("/api/pdv/produtos")
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []));
    fetch("/api/pdv/servicos")
      .then((r) => r.json())
      .then((data) => setServices(data.services || []));
  }, [search, statusFilter, page]);

  async function loadBudgets() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", String(page));

      const res = await fetch(`/api/orcamentos?${params}`);
      const data = await res.json();
      setBudgets(data.budgets || []);
      setPages(data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function addItem(type: "product" | "service", item: any) {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          tempId: Math.random().toString(36).slice(2),
          productId: type === "product" ? item.id : undefined,
          serviceId: type === "service" ? item.id : undefined,
          name: item.name,
          quantity: 1,
          unitPrice: item.price,
          notes: "",
        },
      ],
    }));
  }

  function updateItemQty(tempId: string, qty: number) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.tempId === tempId ? { ...i, quantity: Math.max(1, qty) } : i)),
    }));
  }

  function updateItemPrice(tempId: string, price: string) {
    const val = parseFloat(price) || 0;
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.tempId === tempId ? { ...i, unitPrice: val } : i)),
    }));
  }

  function removeItem(tempId: string) {
    setForm((prev) => ({ ...prev, items: prev.items.filter((i) => i.tempId !== tempId) }));
  }

  const subtotal = form.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const discount = parseFloat(form.discount) || 0;
  const total = Math.max(0, subtotal - discount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.items.length === 0) {
      toastError("Adicione pelo menos um item");
      return;
    }

    const toastId = toastLoading("Criando orçamento...");
    try {
      const res = await fetch("/api/orcamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          discount,
          items: form.items.map((i) => ({
            productId: i.productId,
            serviceId: i.serviceId,
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            notes: i.notes,
          })),
        }),
      });

      if (res.ok) {
        update(toastId, "Orçamento criado!", "success");
        setShowForm(false);
        setForm({
          clientId: "",
          clientName: "",
          title: "",
          description: "",
          validUntil: "",
          notes: "",
          discount: "",
          items: [],
        });
        loadBudgets();
      } else {
        const err = await res.json();
        update(toastId, err.error || "Erro", "error");
      }
    } catch {
      update(toastId, "Erro de conexão", "error");
    }
  }

  async function updateStatus(id: string, status: string) {
    const toastId = toastLoading("Atualizando...");
    try {
      const res = await fetch(`/api/orcamentos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        update(toastId, "Status atualizado!", "success");
        loadBudgets();
        if (showDetail?.id === id) {
          const updated = await res.json();
          setShowDetail(updated);
        }
      } else {
        const err = await res.json();
        update(toastId, err.error || "Erro", "error");
      }
    } catch {
      update(toastId, "Erro de conexão", "error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir este orçamento?")) return;
    const toastId = toastLoading("Excluindo...");
    try {
      const res = await fetch(`/api/orcamentos/${id}`, { method: "DELETE" });
      if (res.ok) {
        update(toastId, "Excluído!", "success");
        loadBudgets();
        setShowDetail(null);
      } else {
        const err = await res.json();
        update(toastId, err.error || "Erro", "error");
      }
    } catch {
      update(toastId, "Erro de conexão", "error");
    }
  }

  async function loadDetail(id: string) {
    const res = await fetch(`/api/orcamentos/${id}`);
    const data = await res.json();
    setShowDetail(data);
  }

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-500 mt-1">Propostas comerciais para clientes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#4a6fa5] text-white px-4 py-2 rounded-lg hover:bg-[#3d5a87] font-medium"
        >
          <Plus size={18} /> Novo Orçamento
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar orçamento..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos os status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Título</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Validade</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2" /> Carregando...
                  </td>
                </tr>
              ) : budgets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <FileText size={40} className="mx-auto mb-3 opacity-40" />
                    <p>Nenhum orçamento encontrado</p>
                  </td>
                </tr>
              ) : (
                budgets.map((b) => {
                  const sInfo = STATUS_CONFIG[b.status] || STATUS_CONFIG.PENDENTE;
                  const StatusIcon = sInfo.icon;
                  return (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{b.title}</div>
                        <div className="text-xs text-gray-500">{b._count.items} item(s)</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900">{b.client?.name || b.clientName || "Cliente avulso"}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sInfo.color}`}>
                          <StatusIcon size={12} /> {sInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(b.total)}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {b.validUntil
                          ? new Date(b.validUntil).toLocaleDateString("pt-BR")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => loadDetail(b.id)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                          >
                            <Eye size={16} />
                          </button>
                          {b.status === "PENDENTE" && (
                            <>
                              <button
                                onClick={() => updateStatus(b.id, "APROVADO")}
                                className="px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() => updateStatus(b.id, "REJEITADO")}
                                className="px-2 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                              >
                                Rejeitar
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <span className="text-sm text-gray-500">Página {page} de {pages}</span>
            <button
              disabled={page === pages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40"
            >
              Próxima <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Modal: Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Novo Orçamento</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Orçamento Velório - João Silva"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <SearchSelect
                    options={clientOptions}
                    value={form.clientId}
                    onChange={(val) => setForm({ ...form, clientId: val })}
                    placeholder="Buscar cliente..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente (se não cadastrado)</label>
                  <input
                    value={form.clientName}
                    onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Válido até</label>
                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desconto (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Itens do Orçamento</h3>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-gray-50 rounded-lg p-2 max-h-32 overflow-y-auto">
                    <p className="text-xs font-medium text-gray-500 mb-1">Produtos</p>
                    {products.slice(0, 10).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addItem("product", p)}
                        className="w-full text-left text-xs px-2 py-1 hover:bg-blue-50 rounded"
                      >
                        {p.name} - {fmt(p.price)}
                      </button>
                    ))}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 max-h-32 overflow-y-auto">
                    <p className="text-xs font-medium text-gray-500 mb-1">Serviços</p>
                    {services.slice(0, 10).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => addItem("service", s)}
                        className="w-full text-left text-xs px-2 py-1 hover:bg-blue-50 rounded"
                      >
                        {s.name} - {fmt(s.price)}
                      </button>
                    ))}
                  </div>
                </div>

                {form.items.length > 0 && (
                  <div className="space-y-2">
                    {form.items.map((item) => (
                      <div key={item.tempId} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                        <div className="flex-1 text-sm">{item.name}</div>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemQty(item.tempId, parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItemPrice(item.tempId, e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <div className="w-20 text-right text-sm font-medium">{fmt(item.quantity * item.unitPrice)}</div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.tempId)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto</span>
                    <span>-{fmt(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{fmt(total)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4a6fa5] text-white rounded-lg hover:bg-[#3d5a87] font-medium"
                >
                  Criar Orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detail */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">{showDetail.title}</h2>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Cliente</span>
                <span className="font-medium">{showDetail.client?.name || showDetail.clientName || "—"}</span>
              </div>

              <div className="border-t border-gray-100 pt-2">
                <p className="font-medium text-gray-900 mb-2">Itens</p>
                {showDetail.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{fmt(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span>{fmt(showDetail.total)}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowDetail(null)}
                  className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  Fechar
                </button>
                <button
                  onClick={() => handleDelete(showDetail.id)}
                  className="flex-1 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-medium hover:bg-red-50"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
