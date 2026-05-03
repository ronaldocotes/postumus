"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  X,
  Package,
  Wrench,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle,
  AlertTriangle,
  Printer,
  Shield,
  ShieldCheck,
} from "lucide-react";
import SearchSelect from "@/components/ui/SearchSelect";
import { useToast } from "@/components/ui/Toast";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
}

interface Service {
  id: string;
  name: string;
  category: string | null;
  price: number;
}

interface CartItem {
  tempId: string;
  productId?: string;
  serviceId?: string;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  isPlanCovered: boolean;
}

interface ClientOption {
  value: string;
  label: string;
  sub?: string;
}

interface ClientData {
  id: string;
  name: string;
  isAssured: boolean;
}

const PLAN_TYPES = [
  { value: "INDIVIDUAL", label: "Individual" },
  { value: "FAMILIAR", label: "Familiar" },
  { value: "PET", label: "Pet" },
];

export default function PdvPage() {
  const { success, error: toastError, loading: toastLoading, update } = useToast();

  const [caixa, setCaixa] = useState<any>(null);
  const [loadingCaixa, setLoadingCaixa] = useState(true);

  const [activeTab, setActiveTab] = useState<"produtos" | "servicos">("produtos");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searching, setSearching] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);
  const [clientsMap, setClientsMap] = useState<Map<string, ClientData>>(new Map());
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [globalDiscount, setGlobalDiscount] = useState("");
  const [notes, setNotes] = useState("");

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [saleResult, setSaleResult] = useState<any>(null);
  const [clientPlan, setClientPlan] = useState<any>(null);

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  useEffect(() => {
    fetch("/api/caixa/aberto")
      .then((r) => r.json())
      .then((data) => {
        setCaixa(data);
        setLoadingCaixa(false);
      })
      .catch(() => setLoadingCaixa(false));
  }, []);

  // Load clients for SearchSelect
  useEffect(() => {
    fetch("/api/clientes?limit=999")
      .then((r) => r.json())
      .then((data) => {
        const clients: any[] = data.clients || data.data || [];
        setClientOptions(
          clients.map((c: any) => ({ value: c.id, label: c.name, sub: c.cpf || undefined }))
        );
        const map = new Map<string, ClientData>();
        clients.forEach((c: any) => {
          map.set(c.id, { id: c.id, name: c.name, isAssured: c.isAssured });
        });
        setClientsMap(map);
      });
  }, []);

  const selectedClient = clientId ? clientsMap.get(clientId) : null;
  const isAssuredClient = selectedClient?.isAssured ?? false;

  // Buscar plano do cliente assegurado
  useEffect(() => {
    if (isAssuredClient && clientId) {
      fetch(`/api/planos/cliente/${clientId}`)
        .then((r) => r.json())
        .then((data) => {
          setClientPlan(data);
        })
        .catch(() => setClientPlan(null));
    } else {
      setClientPlan(null);
    }
  }, [isAssuredClient, clientId]);

  const doSearch = useCallback(async () => {
    setSearching(true);
    try {
      if (activeTab === "produtos") {
        const res = await fetch(`/api/pdv/produtos?search=${encodeURIComponent(search)}`);
        const data = await res.json();
        setProducts(data.products || []);
      } else {
        const res = await fetch(`/api/pdv/servicos?search=${encodeURIComponent(search)}`);
        const data = await res.json();
        setServices(data.services || []);
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    const t = setTimeout(doSearch, 300);
    return () => clearTimeout(t);
  }, [doSearch]);

  function addToCart(item: { id: string; name: string; price: number; type: "product" | "service" }) {
    setCart((prev) => {
      const existing = prev.find(
        (c) => (item.type === "product" ? c.productId === item.id : c.serviceId === item.id)
      );
      if (existing) {
        return prev.map((c) =>
          (item.type === "product" ? c.productId === item.id : c.serviceId === item.id)
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [
        ...prev,
        {
          tempId: Math.random().toString(36).slice(2),
          productId: item.type === "product" ? item.id : undefined,
          serviceId: item.type === "service" ? item.id : undefined,
          name: item.name,
          price: item.price,
          quantity: 1,
          discount: 0,
          isPlanCovered: false,
        },
      ];
    });
  }

  function updateQty(tempId: string, delta: number) {
    setCart((prev) =>
      prev.map((c) => {
        if (c.tempId !== tempId) return c;
        const newQty = Math.max(1, c.quantity + delta);
        return { ...c, quantity: newQty };
      })
    );
  }

  function updateItemDiscount(tempId: string, value: string) {
    const discount = parseFloat(value) || 0;
    setCart((prev) => prev.map((c) => (c.tempId === tempId ? { ...c, discount } : c)));
  }

  function togglePlanCovered(tempId: string) {
    if (!isAssuredClient) return;
    setCart((prev) =>
      prev.map((c) => (c.tempId === tempId ? { ...c, isPlanCovered: !c.isPlanCovered } : c))
    );
  }

  function removeItem(tempId: string) {
    setCart((prev) => prev.filter((c) => c.tempId !== tempId));
  }

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const planCoveredTotal = cart
    .filter((c) => c.isPlanCovered)
    .reduce((sum, c) => sum + c.price * c.quantity, 0);
  const itemDiscounts = cart.reduce((sum, c) => sum + c.discount, 0);
  const globalDisc = parseFloat(globalDiscount) || 0;
  const upgradeTotal = subtotal - planCoveredTotal - itemDiscounts - globalDisc;
  const total = Math.max(0, upgradeTotal);

  async function handleCheckout() {
    if (cart.length === 0) {
      toastError("Carrinho vazio");
      return;
    }
    if (!caixa) {
      toastError("Nenhum caixa aberto");
      return;
    }

    // Se cliente é assegurado, todos os itens devem estar explicitamente marcados
    if (isAssuredClient) {
      const unmarked = cart.filter((c) => !c.isPlanCovered);
      const covered = cart.filter((c) => c.isPlanCovered);
      if (covered.length === 0) {
        toastError("Marque pelo menos um item como 'Coberto pelo Plano' para cliente assegurado");
        return;
      }
      if (unmarked.length === 0 && total <= 0) {
        // Tudo coberto pelo plano, sem upgrade — permitir sem pagamento
      }
    }

    setCheckoutLoading(true);
    const toastId = toastLoading("Finalizando venda...");

    const items = cart.map((c) => ({
      productId: c.productId,
      serviceId: c.serviceId,
      quantity: c.quantity,
      unitPrice: c.price,
      isPlanCovered: c.isPlanCovered,
    }));

    try {
      const res = await fetch("/api/pdv/venda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId || null,
          clientName: clientId ? null : clientName || null,
          paymentMethod,
          status: total > 0 ? "PAID" : "PAID",
          notes,
          discount: globalDisc,
          items,
          isPlanUsage: isAssuredClient,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        update(toastId, isAssuredClient ? "Atendimento registrado!" : "Venda finalizada!", "success");
        setSaleResult(data);
        setCart([]);
        setClientId("");
        setClientName("");
        setGlobalDiscount("");
        setNotes("");
      } else {
        update(toastId, data.error || "Erro ao finalizar", "error");
      }
    } catch {
      update(toastId, "Erro de conexão", "error");
    }
    setCheckoutLoading(false);
  }

  function printReceipt() {
    window.print();
  }

  if (loadingCaixa) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (!caixa) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Caixa Fechado</h2>
          <p className="text-gray-600 mb-6">
            Abra um caixa na página de Controle de Caixa para iniciar as vendas.
          </p>
          <a
            href="/caixa"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            <Plus size={18} /> Abrir Caixa
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col md:flex-row gap-4">
      {/* Left: Cart */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-gray-700" />
            <h2 className="font-bold text-gray-900">Carrinho</h2>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {cart.length} item{cart.length !== 1 ? "s" : ""}
            </span>
            {isAssuredClient && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                <ShieldCheck size={12} /> Assegurado
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Alerta para cliente assegurado */}
        {isAssuredClient && (
          <div className="mx-4 mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 flex-1">
              <p className="font-medium">Cliente Assegurado: {selectedClient?.name}</p>
              <p className="text-blue-600">
                Marque os itens cobertos pelo plano. Itens não marcados serão tratados como upgrade (pago).
              </p>
              {clientPlan && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {clientPlan.coverageUrn && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">Urna</span>
                  )}
                  {clientPlan.coverageCoffin && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">Caixão</span>
                  )}
                  {clientPlan.coverageService && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">Serviço</span>
                  )}
                  {clientPlan.coverageTransport && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">Transporte</span>
                  )}
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                    {PLAN_TYPES.find((t) => t.value === clientPlan.type)?.label || clientPlan.type}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              <ShoppingCart size={40} className="mx-auto mb-3 opacity-40" />
              <p>Carrinho vazio</p>
              <p className="text-sm mt-1">Busque produtos ou serviços à direita</p>
            </div>
          )}
          {cart.map((item) => (
            <div
              key={item.tempId}
              className={`rounded-lg p-3 flex items-start gap-3 ${
                item.isPlanCovered ? "bg-blue-50 border border-blue-200" : "bg-gray-50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 truncate">{item.name}</p>
                  {item.isPlanCovered && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                      <Shield size={10} /> Plano
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{fmt(item.price)} / un</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQty(item.tempId, -1)}
                  className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.tempId, 1)}
                  className="w-7 h-7 flex items-center justify-center bg-white border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="text-right min-w-[90px]">
                <p className={`font-bold ${item.isPlanCovered ? "text-blue-600 line-through" : "text-gray-900"}`}>
                  {fmt(item.price * item.quantity)}
                </p>
                {item.isPlanCovered && (
                  <p className="text-xs font-bold text-blue-600">Coberto</p>
                )}
                {!item.isPlanCovered && (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Desc."
                    value={item.discount || ""}
                    onChange={(e) => updateItemDiscount(item.tempId, e.target.value)}
                    className="w-20 mt-1 text-xs px-2 py-1 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>
              <div className="flex flex-col items-center gap-1">
                {isAssuredClient && (
                  <button
                    onClick={() => togglePlanCovered(item.tempId)}
                    title={item.isPlanCovered ? "Remover cobertura do plano" : "Marcar como coberto pelo plano"}
                    className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                      item.isPlanCovered
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                  >
                    {item.isPlanCovered ? "Plano" : "Upgrade"}
                  </button>
                )}
                <button
                  onClick={() => removeItem(item.tempId)}
                  className="text-gray-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout area */}
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Cliente</label>
              <SearchSelect
                options={clientOptions}
                value={clientId}
                onChange={(val) => {
                  setClientId(val);
                  if (val) setClientName("");
                }}
                placeholder="Buscar cliente..."
              />
            </div>
            {!clientId && (
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Cliente Avulso</label>
                <input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Formas de pagamento só aparecem se houver valor a pagar */}
          {total > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { value: "CASH", label: "Dinheiro", icon: Banknote },
                { value: "PIX", label: "Pix", icon: QrCode },
                { value: "CARD", label: "Cartão", icon: CreditCard },
                { value: "OTHER", label: "Outro", icon: CreditCard },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.value}
                    onClick={() => setPaymentMethod(m.value)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      paymentMethod === m.value
                        ? "bg-[#4a6fa5] text-white border-[#4a6fa5]"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={14} /> {m.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Desconto Total</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={globalDiscount}
                onChange={(e) => setGlobalDiscount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="R$ 0,00"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Observações</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notas..."
              />
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-gray-500">Subtotal: {fmt(subtotal)}</p>
              {planCoveredTotal > 0 && (
                <p className="text-xs text-blue-600">
                  Coberto pelo Plano: -{fmt(planCoveredTotal)}
                </p>
              )}
              {(itemDiscounts + globalDisc) > 0 && (
                <p className="text-xs text-green-600">
                  Desconto: -{fmt(itemDiscounts + globalDisc)}
                </p>
              )}
            </div>
            <div className="text-right">
              {isAssuredClient && planCoveredTotal > 0 && (
                <p className="text-xs text-blue-500 uppercase font-medium">Upgrade / Complemento</p>
              )}
              {!isAssuredClient && (
                <p className="text-xs text-gray-500 uppercase font-medium">Total</p>
              )}
              <p className="text-2xl font-bold text-gray-900">{fmt(total)}</p>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={checkoutLoading || cart.length === 0}
            className="w-full mt-3 py-3 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            {checkoutLoading
              ? "Processando..."
              : isAssuredClient
              ? total > 0
                ? "Registrar Atendimento + Upgrade"
                : "Registrar Atendimento ao Plano"
              : "Finalizar Venda"}
          </button>
        </div>
      </div>

      {/* Right: Search */}
      <div className="w-full md:w-96 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-3 border-b border-gray-100">
          <div className="flex gap-1 mb-2">
            <button
              onClick={() => { setActiveTab("produtos"); setSearch(""); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "produtos"
                  ? "bg-[#4a6fa5] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Package size={14} /> Produtos
            </button>
            <button
              onClick={() => { setActiveTab("servicos"); setSearch(""); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "servicos"
                  ? "bg-[#4a6fa5] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Wrench size={14} /> Serviços
            </button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === "produtos" ? "Buscar produto ou SKU..." : "Buscar serviço..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {searching && (
            <p className="text-center text-gray-400 text-sm py-4">Buscando...</p>
          )}
          {!searching && activeTab === "produtos" && products.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart({ id: p.id, name: p.name, price: p.price, type: "product" })}
              className="w-full text-left bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-lg p-3 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{p.name}</p>
                  {p.sku && <p className="text-xs text-gray-400">SKU: {p.sku}</p>}
                </div>
                <p className="text-sm font-bold text-[#4a6fa5]">{fmt(p.price)}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">Estoque: {p.stock}</p>
            </button>
          ))}
          {!searching && activeTab === "servicos" && services.map((s) => (
            <button
              key={s.id}
              onClick={() => addToCart({ id: s.id, name: s.name, price: s.price, type: "service" })}
              className="w-full text-left bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-lg p-3 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{s.name}</p>
                  {s.category && <p className="text-xs text-gray-400">{s.category}</p>}
                </div>
                <p className="text-sm font-bold text-[#4a6fa5]">{fmt(s.price)}</p>
              </div>
            </button>
          ))}
          {!searching && ((activeTab === "produtos" && products.length === 0) || (activeTab === "servicos" && services.length === 0)) && (
            <div className="text-center text-gray-400 py-8">
              <p className="text-sm">Nenhum resultado</p>
            </div>
          )}
        </div>
      </div>

      {/* Sale Success Modal */}
      {saleResult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md print:shadow-none">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle size={24} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                {saleResult.isPlanUsage ? "Atendimento Registrado!" : "Venda Concluída!"}
              </h2>
              <p className="text-sm text-gray-500">#{saleResult.id.slice(-6).toUpperCase()}</p>
            </div>

            <div className="border-t border-b border-gray-100 py-3 mb-3 space-y-2">
              {saleResult.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700 flex items-center gap-1">
                    {item.quantity}x {item.name}
                    {item.isPlanCovered && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">Plano</span>
                    )}
                  </span>
                  <span className={`font-medium ${item.isPlanCovered ? "text-blue-600" : "text-gray-900"}`}>
                    {item.isPlanCovered ? "Coberto" : fmt(item.totalPrice)}
                  </span>
                </div>
              ))}
              {saleResult.planCoveredAmount > 0 && (
                <div className="flex justify-between text-sm text-blue-600 pt-1 border-t border-dashed border-gray-200">
                  <span>Coberto pelo Plano</span>
                  <span className="font-medium">{fmt(saleResult.planCoveredAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>{saleResult.isPlanUsage ? "Upgrade Pago" : "Total"}</span>
                <span>{fmt(saleResult.finalAmount)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSaleResult(null)}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                {saleResult.isPlanUsage ? "Novo Atendimento" : "Nova Venda"}
              </button>
              <button
                onClick={printReceipt}
                className="flex-1 py-2 rounded-lg bg-[#4a6fa5] text-white text-sm font-medium hover:bg-[#3d5a87] flex items-center justify-center gap-1"
              >
                <Printer size={14} /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
