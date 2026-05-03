"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  X,
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  Users,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import SearchSelect from "@/components/ui/SearchSelect";
import { useToast } from "@/components/ui/Toast";

interface Plan {
  id: string;
  clientId: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string | null;
  monthlyValue: number;
  coverageUrn: boolean;
  coverageCoffin: boolean;
  coverageService: boolean;
  coverageTransport: boolean;
  maxDependents: number;
  notes: string | null;
  createdAt: string;
  client: { id: string; name: string; cpf: string | null; phone: string | null };
  _count: { coverages: number; usages: number };
}

const PLAN_TYPES = [
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "FAMILIAR", label: "Familiar" },
  { value: "PET", label: "Pet" },
];

const PLAN_STATUS = [
  { value: "ACTIVE", label: "Ativo", color: "bg-green-100 text-green-700", icon: ShieldCheck },
  { value: "EXPIRED", label: "Expirado", color: "bg-gray-100 text-gray-600", icon: Clock },
  { value: "CANCELLED", label: "Cancelado", color: "bg-red-100 text-red-700", icon: ShieldOff },
  { value: "SUSPENDED", label: "Suspenso", color: "bg-yellow-100 text-yellow-700", icon: ShieldAlert },
  { value: "RENOVACAO_PENDENTE", label: "Renovação Pendente", color: "bg-blue-100 text-blue-700", icon: RefreshCw },
];

const COVERAGE_TYPES = [
  { key: "coverageUrn", label: "Urna" },
  { key: "coverageCoffin", label: "Caixão" },
  { key: "coverageService", label: "Serviço Funerário" },
  { key: "coverageTransport", label: "Transporte" },
];

export default function PlanosPage() {
  const { success, error: toastError, loading: toastLoading, update } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showDetail, setShowDetail] = useState<Plan | null>(null);

  const [clientOptions, setClientOptions] = useState<{ value: string; label: string; sub?: string }[]>([]);

  const [form, setForm] = useState({
    clientId: "",
    type: "INDIVIDUAL",
    status: "ACTIVE",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    monthlyValue: "",
    coverageUrn: true,
    coverageCoffin: true,
    coverageService: true,
    coverageTransport: true,
    maxDependents: "0",
    notes: "",
  });

  useEffect(() => {
    loadPlans();
  }, [search, statusFilter, typeFilter, page]);

  useEffect(() => {
    fetch("/api/clientes?limit=999")
      .then((r) => r.json())
      .then((data) => {
        const clients = data.clients || data.data || [];
        setClientOptions(clients.map((c: any) => ({ value: c.id, label: c.name, sub: c.cpf || undefined })));
      });
  }, []);

  async function loadPlans() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      params.set("page", String(page));

      const res = await fetch(`/api/planos?${params}`);
      const data = await res.json();
      setPlans(data.plans || []);
      setPages(data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingPlan(null);
    setForm({
      clientId: "",
      type: "INDIVIDUAL",
      status: "ACTIVE",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      monthlyValue: "",
      coverageUrn: true,
      coverageCoffin: true,
      coverageService: true,
      coverageTransport: true,
      maxDependents: "0",
      notes: "",
    });
    setShowForm(true);
  }

  function openEdit(plan: Plan) {
    setEditingPlan(plan);
    setForm({
      clientId: plan.clientId,
      type: plan.type,
      status: plan.status,
      startDate: plan.startDate ? plan.startDate.slice(0, 10) : "",
      endDate: plan.endDate ? plan.endDate.slice(0, 10) : "",
      monthlyValue: String(plan.monthlyValue),
      coverageUrn: plan.coverageUrn,
      coverageCoffin: plan.coverageCoffin,
      coverageService: plan.coverageService,
      coverageTransport: plan.coverageTransport,
      maxDependents: String(plan.maxDependents),
      notes: plan.notes || "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const toastId = toastLoading(editingPlan ? "Atualizando..." : "Criando plano...");

    try {
      const url = editingPlan ? `/api/planos/${editingPlan.id}` : "/api/planos";
      const method = editingPlan ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          monthlyValue: parseFloat(form.monthlyValue),
          maxDependents: parseInt(form.maxDependents),
        }),
      });

      if (res.ok) {
        update(toastId, editingPlan ? "Plano atualizado!" : "Plano criado!", "success");
        setShowForm(false);
        loadPlans();
      } else {
        const err = await res.json();
        update(toastId, err.error || "Erro", "error");
      }
    } catch {
      update(toastId, "Erro de conexão", "error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir este plano?")) return;
    const toastId = toastLoading("Excluindo...");
    try {
      const res = await fetch(`/api/planos/${id}`, { method: "DELETE" });
      if (res.ok) {
        update(toastId, "Plano excluído!", "success");
        loadPlans();
        if (showDetail?.id === id) setShowDetail(null);
      } else {
        const err = await res.json();
        update(toastId, err.error || "Erro", "error");
      }
    } catch {
      update(toastId, "Erro de conexão", "error");
    }
  }

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const statusInfo = (status: string) => PLAN_STATUS.find((s) => s.value === status) || PLAN_STATUS[0];

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planos Funerários</h1>
          <p className="text-gray-500 mt-1">Gerencie contratos de assistência familiar</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
        >
          <Plus size={18} /> Novo Plano
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente ou CPF..."
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
          {PLAN_STATUS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos os tipos</option>
          {PLAN_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Valor Mensal</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Vigência</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Coberturas</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Usos</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2" /> Carregando...
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <Shield size={40} className="mx-auto mb-3 opacity-40" />
                    <p>Nenhum plano encontrado</p>
                  </td>
                </tr>
              ) : (
                plans.map((plan) => {
                  const sInfo = statusInfo(plan.status);
                  const StatusIcon = sInfo.icon;
                  const activeCoverages = COVERAGE_TYPES.filter((c) => (plan as any)[c.key]).length;
                  return (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{plan.client.name}</div>
                        {plan.client.cpf && <div className="text-xs text-gray-400">CPF: {plan.client.cpf}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {PLAN_TYPES.find((t) => t.value === plan.type)?.label || plan.type}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sInfo.color}`}>
                          <StatusIcon size={12} /> {sInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {fmt(plan.monthlyValue)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>
                            {new Date(plan.startDate).toLocaleDateString("pt-BR")}
                            {plan.endDate && ` → ${new Date(plan.endDate).toLocaleDateString("pt-BR")}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {activeCoverages}/4
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {plan._count.usages}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setShowDetail(plan)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                            title="Ver detalhes"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openEdit(plan)}
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md"
                            title="Editar"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(plan.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                            title="Excluir"
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

        {/* Pagination */}
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
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editingPlan ? "Editar Plano" : "Novo Plano Funerário"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingPlan && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                  <SearchSelect
                    options={clientOptions}
                    value={form.clientId}
                    onChange={(val) => setForm({ ...form, clientId: val })}
                    placeholder="Buscar cliente..."
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PLAN_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PLAN_STATUS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Início *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Término</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Mensal *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.monthlyValue}
                    onChange={(e) => setForm({ ...form, monthlyValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Máx. Dependentes</label>
                  <input
                    type="number"
                    min="0"
                    value={form.maxDependents}
                    onChange={(e) => setForm({ ...form, maxDependents: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Coberturas</label>
                <div className="grid grid-cols-2 gap-3">
                  {COVERAGE_TYPES.map((c) => (
                    <label
                      key={c.key}
                      className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={(form as any)[c.key]}
                        onChange={(e) => setForm({ ...form, [c.key]: e.target.checked })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  {editingPlan ? "Salvar Alterações" : "Criar Plano"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detail */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Detalhes do Plano</h2>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Cliente</p>
                <p className="font-bold text-gray-900">{showDetail.client.name}</p>
                {showDetail.client.cpf && <p className="text-sm text-gray-600">CPF: {showDetail.client.cpf}</p>}
                {showDetail.client.phone && <p className="text-sm text-gray-600">Tel: {showDetail.client.phone}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase font-medium">Tipo</p>
                  <p className="font-medium text-gray-900">
                    {PLAN_TYPES.find((t) => t.value === showDetail.type)?.label}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase font-medium">Status</p>
                  <p className="font-medium">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo(showDetail.status).color}`}>
                      {statusInfo(showDetail.status).label}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase font-medium">Valor Mensal</p>
                  <p className="text-lg font-bold text-gray-900">{fmt(showDetail.monthlyValue)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase font-medium">Dependentes</p>
                  <p className="text-lg font-bold text-gray-900">{showDetail.maxDependents}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Coberturas</p>
                <div className="grid grid-cols-2 gap-2">
                  {COVERAGE_TYPES.map((c) => (
                    <div
                      key={c.key}
                      className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                        (showDetail as any)[c.key]
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-gray-50 text-gray-400 border border-gray-100"
                      }`}
                    >
                      {(showDetail as any)[c.key] ? (
                        <CheckCircle size={14} />
                      ) : (
                        <X size={14} />
                      )}
                      {c.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">Vigência</p>
                <p className="text-sm text-gray-700">
                  {new Date(showDetail.startDate).toLocaleDateString("pt-BR")}
                  {showDetail.endDate
                    ? ` → ${new Date(showDetail.endDate).toLocaleDateString("pt-BR")}`
                    : " (sem término definido)"}
                </p>
              </div>

              {showDetail.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-700 uppercase font-medium mb-1">Observações</p>
                  <p className="text-sm text-yellow-800">{showDetail.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setShowDetail(null); openEdit(showDetail); }}
                  className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-1"
                >
                  <Edit3 size={14} /> Editar
                </button>
                <button
                  onClick={() => handleDelete(showDetail.id)}
                  className="flex-1 py-2 rounded-lg border border-red-300 text-red-700 text-sm font-medium hover:bg-red-50 flex items-center justify-center gap-1"
                >
                  <Trash2 size={14} /> Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
