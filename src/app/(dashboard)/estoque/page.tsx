"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Search,
  X,
  Plus,
  Minus,
  History,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Supplier {
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  cost: number | null;
  stock: number;
  minStock: number;
  supplier: Supplier | null;
  _count: { movements: number };
}

interface CreatedBy {
  name: string | null;
}

interface StockMovement {
  id: string;
  productId: string;
  type: "ENTRADA" | "SAIDA" | "AJUSTE";
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string | null;
  reference: string | null;
  unitCost: number | null;
  averageCost: number | null;
  sourceId: string | null;
  sourceType: string | null;
  location: string | null;
  createdBy: CreatedBy | null;
  createdAt: string;
}

interface Stats {
  total: number;
  lowStock: number;
  totalValue: number;
  movementsToday: number;
}

type MovType = "ENTRADA" | "SAIDA" | "AJUSTE";

const REASONS: Record<MovType, string[]> = {
  ENTRADA: ["Compra", "Devolução", "Ajuste manual", "Transferência"],
  SAIDA: ["Venda de serviço", "Uso interno", "Perda", "Ajuste manual", "Devolução a fornecedor"],
  AJUSTE: ["Inventário", "Correção de sistema", "Ajuste manual"],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(d: string) {
  return new Date(d).toLocaleString("pt-BR");
}

function getStockStatus(p: Product) {
  if (p.stock === 0) return "critical";
  if (p.minStock > 0 && p.stock < p.minStock) return "critical";
  if (p.minStock > 0 && p.stock <= p.minStock * 1.5) return "low";
  return "normal";
}

const STATUS_LABEL: Record<string, string> = {
  critical: "Crítico",
  low: "Baixo",
  normal: "Normal",
};

const STATUS_CLASSES: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border border-red-300",
  low: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  normal: "bg-green-100 text-green-700 border border-green-300",
};

const MOV_CLASSES: Record<MovType, string> = {
  ENTRADA: "text-green-700 bg-green-100",
  SAIDA: "text-red-700 bg-red-100",
  AJUSTE: "text-yellow-700 bg-yellow-100",
};

// ─── Modal: Movimentação ──────────────────────────────────────────────────────

function MovimentacaoModal({
  product,
  defaultType,
  onClose,
  onSaved,
}: {
  product: Product;
  defaultType: MovType;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<MovType>(defaultType);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty === 0) {
      setError("Quantidade deve ser diferente de zero.");
      return;
    }

    // Para ENTRADA/SAIDA, quantity deve ser positiva
    // Para AJUSTE, quantity pode ser positiva (aumento) ou negativa (redução)
    const absQty = Math.abs(qty);
    const movQty = type === "AJUSTE" ? qty : absQty;

    if ((type === "ENTRADA" || type === "SAIDA") && qty <= 0) {
      setError("Quantidade deve ser maior que zero para entrada ou saída.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/estoque/movimentacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          type,
          quantity: movQty,
          reason: reason || null,
          reference: reference || null,
          unitCost: unitCost ? parseFloat(unitCost) : null,
          location: location || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao registrar movimentação.");
      } else {
        onSaved();
      }
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div
          className={`p-5 rounded-t-2xl flex items-center justify-between ${
            type === "ENTRADA"
              ? "bg-green-600"
              : type === "SAIDA"
              ? "bg-red-600"
              : "bg-yellow-500"
          }`}
        >
          <div>
            <h2 className="text-white font-bold text-lg">Movimentação de Estoque</h2>
            <p className="text-white/80 text-sm">{product.name}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <div className="flex gap-2">
              {(["ENTRADA", "SAIDA", "AJUSTE"] as MovType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setType(t); setReason(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    type === t
                      ? t === "ENTRADA"
                        ? "bg-green-600 text-white border-green-600"
                        : t === "SAIDA"
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-yellow-500 text-white border-yellow-500"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {t === "ENTRADA" ? "Entrada" : t === "SAIDA" ? "Saída" : "Ajuste"}
                </button>
              ))}
            </div>
          </div>

          {/* Estoque atual */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            Estoque atual: <strong>{product.stock}</strong> unidades
            {type === "AJUSTE" && (
              <span className="ml-2 text-yellow-700">(use + ou - para aumentar/diminuir)</span>
            )}
          </div>

          {/* Quantidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === "AJUSTE" ? "Quantidade do Ajuste (+ ou -)" : "Quantidade"}
            </label>
            <input
              type="number"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={type === "AJUSTE" ? "Ex: +10 ou -5" : "0"}
            />
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um motivo...</option>
              {REASONS[type].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Referência */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Referência <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nota fiscal, número do pedido..."
            />
          </div>

          {/* Local */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Local <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Loja, Almoxarifado, Capela..."
            />
          </div>

          {/* Custo unitário (só para entrada) */}
          {type === "ENTRADA" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custo Unitário <span className="text-gray-400">(opcional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0,00"
              />
              <p className="text-xs text-gray-400 mt-1">
                Será calculado o custo médio ponderado automaticamente.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-2 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-60 ${
                type === "ENTRADA"
                  ? "bg-green-600 hover:bg-green-700"
                  : type === "SAIDA"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-yellow-500 hover:bg-yellow-600"
              }`}
            >
              {loading ? "Salvando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Histórico ─────────────────────────────────────────────────────────

function HistoricoModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/estoque/${product.id}/historico?${params}`);
    const data = await res.json();
    setMovements(data.movements ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setLoading(false);
  }, [product.id, page, from, to]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg text-gray-900">Histórico de Movimentações</h2>
            <p className="text-sm text-gray-500">
              {product.name} · Estoque atual: {product.stock}
              {product.cost && (
                <span className="ml-2 text-gray-400">· Custo médio: {formatCurrency(product.cost)}</span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        {/* Filtros */}
        <div className="px-5 py-3 border-b border-gray-100 flex gap-3 flex-wrap items-end">
          <div>
            <label className="text-xs text-gray-500 block mb-1">De</label>
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Até</label>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          {(from || to) && (
            <button
              onClick={() => { setFrom(""); setTo(""); setPage(1); }}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 pb-1"
            >
              <X size={13} /> Limpar
            </button>
          )}
          <span className="ml-auto text-xs text-gray-400">{total} registros</span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <RefreshCw size={20} className="animate-spin mr-2" /> Carregando...
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Nenhuma movimentação encontrada.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase">Qtd</th>
                  <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase">Saldo</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase">Motivo</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase">Ref</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase">Custo Médio</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase">Quem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap text-xs">{formatDate(m.createdAt)}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${MOV_CLASSES[m.type]}`}>
                        {m.type}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-medium">
                      <span className={m.type === "ENTRADA" ? "text-green-700" : m.type === "SAIDA" ? "text-red-700" : "text-yellow-700"}>
                        {m.type === "SAIDA" ? "-" : m.type === "ENTRADA" ? "+" : ""}{m.quantity}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                        <span>{m.balanceBefore}</span>
                        <ArrowRightLeft size={10} className="text-gray-400" />
                        <span className="font-medium text-gray-700">{m.balanceAfter}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-600">{m.reason ?? "—"}</td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{m.reference ?? "—"}</td>
                    <td className="px-3 py-3 text-right text-gray-600 text-xs">
                      {m.averageCost ? formatCurrency(m.averageCost) : "—"}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{m.createdBy?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
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
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EstoquePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, lowStock: 0, totalValue: 0, movementsToday: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const [movModal, setMovModal] = useState<{ product: Product; type: MovType } | null>(null);
  const [histModal, setHistModal] = useState<Product | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, status: statusFilter });
    const res = await fetch(`/api/estoque?${params}`);
    const data = await res.json();
    setProducts(data.products ?? []);
    setStats(data.stats ?? { total: 0, lowStock: 0, totalValue: 0, movementsToday: 0 });
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  function handleMovSaved() {
    setMovModal(null);
    load();
  }

  const statCards = [
    {
      label: "Total de Produtos",
      value: stats.total,
      icon: Package,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Estoque Baixo",
      value: stats.lowStock,
      icon: AlertTriangle,
      color: stats.lowStock > 0 ? "bg-red-500" : "bg-gray-400",
      textColor: stats.lowStock > 0 ? "text-red-600" : "text-gray-500",
      bg: stats.lowStock > 0 ? "bg-red-50" : "bg-gray-50",
    },
    {
      label: "Valor em Estoque",
      value: formatCurrency(stats.totalValue),
      icon: TrendingUp,
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Movimentos Hoje",
      value: stats.movementsToday,
      icon: RefreshCw,
      color: "bg-purple-500",
      textColor: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="px-6 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Controle de Estoque</h1>
        <p className="text-gray-500 mt-1">Gerencie entradas, saídas e ajustes de estoque</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`rounded-xl border border-gray-200 ${card.bg} p-5`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">{card.label}</span>
                <div className={`${card.color} p-2 rounded-lg`}>
                  <Icon size={18} className="text-white" />
                </div>
              </div>
              <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Low stock alert */}
      {stats.lowStock > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-red-600 shrink-0" size={20} />
          <p className="text-sm text-red-800">
            <strong>{stats.lowStock} produto{stats.lowStock > 1 ? "s" : ""}</strong> com estoque abaixo do mínimo.
            Verifique os itens marcados em vermelho.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar produto ou SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "critical", "low", "normal"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === s
                  ? "bg-[#4a6fa5] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s === "all" ? "Todos" : s === "critical" ? "Crítico" : s === "low" ? "Baixo" : "Normal"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw size={20} className="animate-spin mr-2" /> Carregando...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-40" />
            <p>Nenhum produto encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Produto</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Estoque</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Mínimo</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Custo Médio</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Valor Estoque</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => {
                  const status = getStockStatus(p);
                  const valorEstoque = p.stock * (p.cost ?? p.price);
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-gray-50 ${status === "critical" ? "bg-red-50/50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{p.name}</div>
                        {p.supplier && (
                          <div className="text-xs text-gray-400">{p.supplier.name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-bold text-base ${
                            status === "critical"
                              ? "text-red-700"
                              : status === "low"
                              ? "text-yellow-700"
                              : "text-gray-800"
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">{p.minStock}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[status]}`}>
                          {STATUS_LABEL[status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 text-xs">
                        {p.cost ? formatCurrency(p.cost) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatCurrency(valorEstoque)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            title="Registrar Entrada"
                            onClick={() => setMovModal({ product: p, type: "ENTRADA" })}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
                          >
                            <Plus size={13} /> Entrada
                          </button>
                          <button
                            title="Registrar Saída"
                            onClick={() => setMovModal({ product: p, type: "SAIDA" })}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
                          >
                            <Minus size={13} /> Saída
                          </button>
                          <button
                            title="Histórico"
                            onClick={() => setHistModal(p)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                          >
                            <History size={13} />
                          </button>
                          <button
                            title="Ajuste"
                            onClick={() => setMovModal({ product: p, type: "AJUSTE" })}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium hover:bg-yellow-200 transition-colors"
                          >
                            <TrendingDown size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {movModal && (
        <MovimentacaoModal
          product={movModal.product}
          defaultType={movModal.type}
          onClose={() => setMovModal(null)}
          onSaved={handleMovSaved}
        />
      )}
      {histModal && (
        <HistoricoModal product={histModal} onClose={() => setHistModal(null)} />
      )}
    </div>
  );
}
