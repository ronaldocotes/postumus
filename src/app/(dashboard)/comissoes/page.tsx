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
  CheckCircle,
  DollarSign,
  TrendingUp,
  Users,
  Award,
  Filter,
  Percent,
  Wallet,
  Calendar,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface CommissionRule {
  id: string;
  name: string;
  targetType: string;
  basis: string;
  percentage: number;
  fixedAmount: number | null;
  minValue: number | null;
  maxValue: number | null;
  productId: string | null;
  serviceId: string | null;
  active: boolean;
  product?: { name: string } | null;
  service?: { name: string } | null;
}

interface Commission {
  id: string;
  userId: string;
  user: { name: string };
  saleId: string | null;
  sale: { finalAmount: number; clientName: string | null; createdAt: string } | null;
  basis: string;
  amount: number;
  saleAmount: number;
  percentage: number | null;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

interface RankingItem {
  userId: string;
  userName: string;
  totalAmount: number;
  count: number;
}

const TARGET_LABELS: Record<string, string> = {
  VENDEDOR: "Vendedor",
  COBRADOR: "Cobrador",
  GERENTE: "Gerente",
  ATENDENTE: "Atendente",
};

const BASIS_LABELS: Record<string, string> = {
  VENDA_TOTAL: "Venda Total",
  VENDA_PRODUTO: "Venda de Produto",
  VENDA_SERVICO: "Venda de Serviço",
  RECEBIMENTO: "Recebimento",
  PLANO_NOVO: "Plano Novo",
  UPGRADE_PLANO: "Upgrade de Plano",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDENTE: { label: "Pendente", color: "bg-yellow-100 text-yellow-700" },
  APROVADA: { label: "Aprovada", color: "bg-blue-100 text-blue-700" },
  PAGA: { label: "Paga", color: "bg-green-100 text-green-700" },
  CANCELADA: { label: "Cancelada", color: "bg-red-100 text-red-700" },
};

export default function ComissoesPage() {
  const { success, error: toastError, loading: toastLoading, update } = useToast();

  const [activeTab, setActiveTab] = useState<"dashboard" | "comissoes" | "regras">("dashboard");

  // Dashboard stats
  const [stats, setStats] = useState<any>(null);
  const [ranking, setRanking] = useState<RankingItem[]>([]);

  // Commissions
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [commissionStatus, setCommissionStatus] = useState("all");
  const [commissionPage, setCommissionPage] = useState(1);
  const [commissionPages, setCommissionPages] = useState(1);

  // Rules
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);

  const [ruleForm, setRuleForm] = useState({
    name: "",
    targetType: "VENDEDOR",
    basis: "VENDA_TOTAL",
    percentage: "",
    fixedAmount: "",
    minValue: "",
    maxValue: "",
    notes: "",
  });

  useEffect(() => {
    if (activeTab === "dashboard") {
      loadStats();
      loadRanking();
    } else if (activeTab === "comissoes") {
      loadCommissions();
    } else if (activeTab === "regras") {
      loadRules();
    }
  }, [activeTab, commissionStatus, commissionPage]);

  async function loadStats() {
    try {
      const res = await fetch("/api/comissoes/estatisticas");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadRanking() {
    try {
      const res = await fetch("/api/comissoes/ranking");
      const data = await res.json();
      setRanking(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadCommissions() {
    try {
      const params = new URLSearchParams();
      if (commissionStatus !== "all") params.set("status", commissionStatus);
      params.set("page", String(commissionPage));

      const res = await fetch(`/api/comissoes?${params}`);
      const data = await res.json();
      setCommissions(data.commissions || []);
      setCommissionPages(data.pages || 1);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadRules() {
    try {
      const res = await fetch("/api/comissoes/regras?active=true");
      const data = await res.json();
      setRules(data.rules || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRuleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const toastId = toastLoading(editingRule ? "Atualizando..." : "Criando regra...");

    try {
      const url = editingRule ? `/api/comissoes/regras/${editingRule.id}` : "/api/comissoes/regras";
      const method = editingRule ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ruleForm,
          percentage: parseFloat(ruleForm.percentage),
          fixedAmount: ruleForm.fixedAmount ? parseFloat(ruleForm.fixedAmount) : null,
          minValue: ruleForm.minValue ? parseFloat(ruleForm.minValue) : null,
          maxValue: ruleForm.maxValue ? parseFloat(ruleForm.maxValue) : null,
        }),
      });

      if (res.ok) {
        update(toastId, editingRule ? "Regra atualizada!" : "Regra criada!", "success");
        setShowRuleForm(false);
        loadRules();
      } else {
        const err = await res.json();
        update(toastId, err.error || "Erro", "error");
      }
    } catch {
      update(toastId, "Erro de conexão", "error");
    }
  }

  async function handleDeleteRule(id: string) {
    if (!confirm("Deseja excluir esta regra?")) return;
    const toastId = toastLoading("Excluindo...");
    try {
      const res = await fetch(`/api/comissoes/regras/${id}`, { method: "DELETE" });
      if (res.ok) {
        update(toastId, "Regra excluída!", "success");
        loadRules();
      } else {
        const err = await res.json();
        update(toastId, err.error || "Erro", "error");
      }
    } catch {
      update(toastId, "Erro de conexão", "error");
    }
  }

  async function updateCommissionStatus(id: string, status: string) {
    const toastId = toastLoading("Atualizando...");
    try {
      const res = await fetch(`/api/comissoes/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        update(toastId, "Status atualizado!", "success");
        loadCommissions();
        loadStats();
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

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comissões</h1>
          <p className="text-gray-500 mt-1">Gerencie regras e pagamentos de comissão</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === "dashboard"
                ? "bg-[#4a6fa5] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("comissoes")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === "comissoes"
                ? "bg-[#4a6fa5] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Comissões
          </button>
          <button
            onClick={() => setActiveTab("regras")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === "regras"
                ? "bg-[#4a6fa5] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Regras
          </button>
        </div>
      </div>

      {/* ─── DASHBOARD ─── */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Total em Comissões</p>
                  <p className="text-xl font-bold text-gray-900">{stats ? fmt(stats.valorPago + stats.valorPendente) : "—"}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center">
                  <Wallet size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Pendente</p>
                  <p className="text-xl font-bold text-gray-900">{stats ? fmt(stats.valorPendente) : "—"}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Pago</p>
                  <p className="text-xl font-bold text-gray-900">{stats ? fmt(stats.valorPago) : "—"}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Total de Comissões</p>
                  <p className="text-xl font-bold text-gray-900">{stats ? stats.total : "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ranking */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Award size={18} className="text-[#4a6fa5]" />
              <h2 className="font-bold text-gray-900">Ranking de Vendedores</h2>
            </div>
            <div className="p-4">
              {ranking.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Nenhuma comissão paga ainda</p>
              ) : (
                <div className="space-y-3">
                  {ranking.map((item, idx) => (
                    <div key={item.userId} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx === 0 ? "bg-yellow-100 text-yellow-700" :
                        idx === 1 ? "bg-gray-200 text-gray-700" :
                        idx === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.userName}</p>
                        <p className="text-xs text-gray-500">{item.count} venda{item.count !== 1 ? "s" : ""}</p>
                      </div>
                      <p className="font-bold text-gray-900">{fmt(item.totalAmount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── COMISSÕES ─── */}
      {activeTab === "comissoes" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <select
              value={commissionStatus}
              onChange={(e) => { setCommissionStatus(e.target.value); setCommissionPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="APROVADA">Aprovada</option>
              <option value="PAGA">Paga</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Venda</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Base</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {commissions.map((c) => {
                  const sInfo = STATUS_LABELS[c.status] || STATUS_LABELS.PENDENTE;
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{c.user.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        {c.sale ? (
                          <div>
                            <div className="text-gray-700">#{c.saleId?.slice(-6)}</div>
                            {c.sale.clientName && <div className="text-xs text-gray-500">{c.sale.clientName}</div>}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{BASIS_LABELS[c.basis] || c.basis}</div>
                        <div className="text-xs text-gray-500">Base: {fmt(c.saleAmount)}</div>
                        {c.percentage && <div className="text-xs text-gray-500">{c.percentage}% </div>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {fmt(c.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sInfo.color}`}>
                          {sInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {c.status === "PENDENTE" && (
                            <>
                              <button
                                onClick={() => updateCommissionStatus(c.id, "APROVADA")}
                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                              >
                                Aprovar
                              </button>
                              <button
                                onClick={() => updateCommissionStatus(c.id, "CANCELADA")}
                                className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300"
                              >
                                Cancelar
                              </button>
                            </>
                          )}
                          {c.status === "APROVADA" && (
                            <button
                              onClick={() => updateCommissionStatus(c.id, "PAGA")}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                            >
                              Pagar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {commissions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      Nenhuma comissão encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {commissionPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <button
                disabled={commissionPage === 1}
                onClick={() => setCommissionPage((p) => p - 1)}
                className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <span className="text-sm text-gray-500">Página {commissionPage} de {commissionPages}</span>
              <button
                disabled={commissionPage === commissionPages}
                onClick={() => setCommissionPage((p) => p + 1)}
                className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40"
              >
                Próxima <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── REGRAS ─── */}
      {activeTab === "regras" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => {
                setEditingRule(null);
                setRuleForm({
                  name: "",
                  targetType: "VENDEDOR",
                  basis: "VENDA_TOTAL",
                  percentage: "",
                  fixedAmount: "",
                  minValue: "",
                  maxValue: "",
                  notes: "",
                });
                setShowRuleForm(true);
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
            >
              <Plus size={18} /> Nova Regra
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Regra</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Alvo</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Base</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Percentual</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{rule.name}</div>
                        {rule.notes && <div className="text-xs text-gray-500">{rule.notes}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {TARGET_LABELS[rule.targetType] || rule.targetType}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {BASIS_LABELS[rule.basis] || rule.basis}
                        {rule.product && <div className="text-xs text-gray-500">Prod: {rule.product.name}</div>}
                        {rule.service && <div className="text-xs text-gray-500">Serv: {rule.service.name}</div>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-medium text-gray-900">{rule.percentage}%</div>
                        {rule.fixedAmount && <div className="text-xs text-gray-500">+ {fmt(rule.fixedAmount)} fixo</div>}
                        {(rule.minValue || rule.maxValue) && (
                          <div className="text-xs text-gray-500">
                            {rule.minValue ? `Min: ${fmt(rule.minValue)}` : ""}
                            {rule.maxValue ? ` Max: ${fmt(rule.maxValue)}` : ""}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          rule.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {rule.active ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingRule(rule);
                              setRuleForm({
                                name: rule.name,
                                targetType: rule.targetType,
                                basis: rule.basis,
                                percentage: String(rule.percentage),
                                fixedAmount: rule.fixedAmount ? String(rule.fixedAmount) : "",
                                minValue: rule.minValue ? String(rule.minValue) : "",
                                maxValue: rule.maxValue ? String(rule.maxValue) : "",
                                notes: rule.notes || "",
                              });
                              setShowRuleForm(true);
                            }}
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-md"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rules.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400">
                        Nenhuma regra cadastrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rule Form */}
      {showRuleForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editingRule ? "Editar Regra" : "Nova Regra de Comissão"}
              </h2>
              <button onClick={() => setShowRuleForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRuleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Regra *</label>
                <input
                  required
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Comissão Vendedor Padrão"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Funcionário</label>
                  <select
                    value={ruleForm.targetType}
                    onChange={(e) => setRuleForm({ ...ruleForm, targetType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(TARGET_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base de Cálculo</label>
                  <select
                    value={ruleForm.basis}
                    onChange={(e) => setRuleForm({ ...ruleForm, basis: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(BASIS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Percentual (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={ruleForm.percentage}
                    onChange={(e) => setRuleForm({ ...ruleForm, percentage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Fixo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ruleForm.fixedAmount}
                    onChange={(e) => setRuleForm({ ...ruleForm, fixedAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Mínimo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ruleForm.minValue}
                    onChange={(e) => setRuleForm({ ...ruleForm, minValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Máximo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ruleForm.maxValue}
                    onChange={(e) => setRuleForm({ ...ruleForm, maxValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={ruleForm.notes}
                  onChange={(e) => setRuleForm({ ...ruleForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRuleForm(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  {editingRule ? "Salvar Alterações" : "Criar Regra"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
