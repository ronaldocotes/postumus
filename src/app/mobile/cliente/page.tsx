"use client";

import { useState, useCallback } from "react";
import {
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Users,
  MapPin,
  Phone,
  QrCode,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Copy,
  Check,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Installment {
  id: string;
  numero: number;
  valor: number;
  dueDate: string;
  status: "PENDING" | "PAID" | "LATE";
  paidAt: string | null;
  paymentMethod: string | null;
}

interface CarneData {
  id: string;
  ano: number;
  totalValue: number;
  descricao: string | null;
  parcelas: Installment[];
  resumo: { pagas: number; pendentes: number; atrasadas: number; total: number };
  proximaVencer: Installment | null;
}

interface ClienteData {
  id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
  cellphone: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  dueDay: number | null;
  monthlyValue: number | null;
  status: string;
}

interface PortalData {
  cliente: ClienteData;
  carnes: CarneData[];
  dependentes: Array<{
    id: string;
    name: string;
    relationship: string;
    birthDate: string | null;
  }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

function formatCPF(cpf: string) {
  const c = cpf.replace(/\D/g, "");
  return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  PAID: { label: "Paga", color: "#22c55e", icon: CheckCircle },
  PENDING: { label: "Pendente", color: "#f59e0b", icon: Clock },
  LATE: { label: "Atrasada", color: "#ef4444", icon: AlertCircle },
};

// PIX key placeholder — replace with actual company PIX key from settings
const PIX_KEY = "pagamentos@posthumous.com.br";

function generatePixCode(valor: number, nome: string, chave: string) {
  // Simplified static PIX code for demonstration
  // In production, use proper EMV QR code generation
  return `00020126360014BR.GOV.BCB.PIX0114${chave}5204000053039865802BR5925${nome.substring(0, 25).padEnd(25)}6009SAO PAULO62070503***6304`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] || STATUS_LABELS.PENDING;
  const Icon = s.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: s.color + "1a", color: s.color }}
    >
      <Icon size={11} />
      {s.label}
    </span>
  );
}

function PixModal({
  parcela,
  clienteNome,
  onClose,
}: {
  parcela: Installment;
  clienteNome: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const pixCode = generatePixCode(parcela.valor, clienteNome, PIX_KEY);

  const copy = async () => {
    await navigator.clipboard.writeText(pixCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
        <h3 className="text-xl font-bold text-slate-800 text-center mb-1">
          Pagar via PIX
        </h3>
        <p className="text-slate-500 text-sm text-center mb-6">
          Parcela {parcela.numero} — {formatCurrency(parcela.valor)}
        </p>

        {/* QR Code placeholder */}
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center mb-5">
          <QrCode size={80} className="text-[#4a6fa5] mb-3" />
          <p className="text-xs text-slate-400 text-center">
            Aponte a câmera do seu banco para o QR Code
          </p>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Chave PIX: {PIX_KEY}
          </p>
        </div>

        {/* Código PIX copia-e-cola */}
        <div className="bg-blue-50 rounded-xl p-3 mb-4">
          <p className="text-xs text-slate-500 mb-1">PIX Copia e Cola</p>
          <p className="text-xs text-slate-700 break-all font-mono leading-relaxed">{pixCode}</p>
        </div>

        <button
          onClick={copy}
          className="w-full py-3.5 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-colors"
          style={{ background: copied ? "#22c55e" : "#4a6fa5" }}
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? "Código copiado!" : "Copiar código PIX"}
        </button>

        <p className="text-xs text-slate-400 text-center mt-3">
          Após o pagamento, aguarde a confirmação em até 1 dia útil.
        </p>
      </div>
    </div>
  );
}

function CarneCard({ carne, clienteNome }: { carne: CarneData; clienteNome: string }) {
  const [expanded, setExpanded] = useState(false);
  const [pixParcela, setPixParcela] = useState<Installment | null>(null);

  const progress = Math.round((carne.resumo.pagas / carne.resumo.total) * 100);

  return (
    <>
      {pixParcela && (
        <PixModal
          parcela={pixParcela}
          clienteNome={clienteNome}
          onClose={() => setPixParcela(null)}
        />
      )}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header */}
        <div
          className="px-4 py-4 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #4a6fa5, #3d5a87)" }}
        >
          <div>
            <p className="text-white font-bold text-base">Carnê {carne.ano}</p>
            {carne.descricao && (
              <p className="text-blue-200 text-xs mt-0.5">{carne.descricao}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-white font-bold">{formatCurrency(carne.totalValue)}</p>
            <p className="text-blue-200 text-xs">valor total</p>
          </div>
        </div>

        <div className="px-4 py-4">
          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>{carne.resumo.pagas} pagas</span>
              <span>{carne.resumo.pendentes + carne.resumo.atrasadas} pendentes</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, background: "#22c55e" }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1 text-right">{progress}% pago</p>
          </div>

          {/* Resumo badges */}
          <div className="flex gap-2 flex-wrap mb-4">
            <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-lg font-medium">
              {carne.resumo.pagas} pagas
            </span>
            {carne.resumo.atrasadas > 0 && (
              <span className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded-lg font-medium">
                {carne.resumo.atrasadas} atrasadas
              </span>
            )}
            {carne.resumo.pendentes > 0 && (
              <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-lg font-medium">
                {carne.resumo.pendentes} pendentes
              </span>
            )}
          </div>

          {/* Próxima a vencer */}
          {carne.proximaVencer && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-600 font-medium">Próximo vencimento</p>
                <p className="text-sm text-slate-700 font-semibold mt-0.5">
                  Parcela {carne.proximaVencer.numero} — {formatCurrency(carne.proximaVencer.valor)}
                </p>
                <p className="text-xs text-slate-400">
                  Vence em {formatDate(carne.proximaVencer.dueDate)}
                </p>
              </div>
              <button
                onClick={() => setPixParcela(carne.proximaVencer)}
                className="flex items-center gap-1.5 bg-[#4a6fa5] text-white text-xs font-semibold px-3 py-2 rounded-xl active:bg-[#3d5a87] transition-colors"
              >
                <QrCode size={14} />
                Pagar PIX
              </button>
            </div>
          )}

          {/* Ver todas as parcelas */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-2 text-[#4a6fa5] text-sm font-medium py-2"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {expanded ? "Ocultar parcelas" : "Ver todas as parcelas"}
          </button>

          {expanded && (
            <div className="mt-2 space-y-2 border-t border-slate-100 pt-3">
              {carne.parcelas.map((parcela) => (
                <div
                  key={parcela.id}
                  className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{
                        background: STATUS_LABELS[parcela.status]?.color + "1a" || "#f1f5f9",
                        color: STATUS_LABELS[parcela.status]?.color || "#64748b",
                      }}
                    >
                      {parcela.numero}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {formatCurrency(parcela.valor)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {parcela.status === "PAID" && parcela.paidAt
                          ? `Pago em ${formatDate(parcela.paidAt)}`
                          : `Vence em ${formatDate(parcela.dueDate)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={parcela.status} />
                    {parcela.status !== "PAID" && (
                      <button
                        onClick={() => setPixParcela(parcela)}
                        className="p-1.5 bg-[#4a6fa5]/10 rounded-lg"
                        aria-label="Pagar via PIX"
                      >
                        <QrCode size={14} className="text-[#4a6fa5]" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (data: PortalData) => void }) {
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 11);
    val = val
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
    setCpf(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cpfClean = cpf.replace(/\D/g, "");
    if (cpfClean.length < 11) {
      setError("Digite um CPF válido (11 dígitos)");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/mobile/cliente-portal?cpf=${cpfClean}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "CPF não encontrado no sistema");
        return;
      }
      const data: PortalData = await res.json();
      onLogin(data);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#4a6fa5] to-[#3d5a87] flex flex-col">
      {/* Logo area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6">
          <span className="text-white text-4xl font-bold">P</span>
        </div>
        <h1 className="text-white text-3xl font-bold mb-2">Posthumous</h1>
        <p className="text-blue-200 text-sm text-center">Portal do Associado</p>
      </div>

      {/* Login card */}
      <div className="bg-white rounded-t-3xl px-6 pt-8 pb-10">
        <h2 className="text-xl font-bold text-slate-800 mb-1">Consultar meu carnê</h2>
        <p className="text-slate-500 text-sm mb-6">
          Digite seu CPF para ver suas parcelas e fazer pagamentos via PIX.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              CPF
            </label>
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                inputMode="numeric"
                value={cpf}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                className="w-full pl-10 pr-4 py-3.5 border border-slate-200 rounded-xl text-slate-800 text-base focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-transparent"
                autoComplete="off"
              />
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle size={14} />
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#4a6fa5] text-white font-semibold rounded-xl text-base flex items-center justify-center gap-2 active:bg-[#3d5a87] transition-colors disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Search size={18} />
                Consultar
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-6">
          Seus dados são protegidos conforme a LGPD.
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "carnes" | "dados" | "dependentes";

export default function MobileClientePage() {
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("carnes");

  const handleLogin = useCallback((data: PortalData) => {
    setPortalData(data);
  }, []);

  if (!portalData) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const { cliente, carnes, dependentes } = portalData;

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: "carnes", label: "Meu Carnê", icon: CheckCircle },
    { id: "dados", label: "Meus Dados", icon: User },
    { id: "dependentes", label: "Dependentes", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-8">
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4"
        style={{ background: "linear-gradient(135deg, #4a6fa5, #3d5a87)" }}
      >
        <div className="flex items-center gap-3 py-4">
          <button
            onClick={() => setPortalData(null)}
            className="p-2 rounded-full bg-white/20 text-white"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">{cliente.name}</h1>
            <p className="text-blue-200 text-xs">
              {cliente.cpf ? formatCPF(cliente.cpf) : "—"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 pb-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-[#4a6fa5]"
                    : "text-blue-200 hover:bg-white/10"
                }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Tab: Carnês */}
        {activeTab === "carnes" && (
          <>
            {carnes.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-100">
                <CheckCircle size={48} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhum carnê encontrado</p>
              </div>
            ) : (
              carnes.map((carne) => (
                <CarneCard key={carne.id} carne={carne} clienteNome={cliente.name} />
              ))
            )}
          </>
        )}

        {/* Tab: Dados do cliente */}
        {activeTab === "dados" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="font-semibold text-slate-700">Dados Cadastrais</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {[
                { label: "Nome", value: cliente.name, icon: User },
                { label: "CPF", value: cliente.cpf ? formatCPF(cliente.cpf) : "—", icon: User },
                { label: "Telefone", value: cliente.phone || "—", icon: Phone },
                { label: "Celular", value: cliente.cellphone || "—", icon: Phone },
                {
                  label: "Endereço",
                  value: [cliente.address, cliente.neighborhood, cliente.city]
                    .filter(Boolean)
                    .join(", ") || "—",
                  icon: MapPin,
                },
                {
                  label: "Dia de Vencimento",
                  value: cliente.dueDay ? `Todo dia ${cliente.dueDay}` : "—",
                  icon: Clock,
                },
                {
                  label: "Mensalidade",
                  value: cliente.monthlyValue ? formatCurrency(cliente.monthlyValue) : "—",
                  icon: CheckCircle,
                },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start gap-3 px-4 py-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={15} className="text-[#4a6fa5]" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="text-sm text-slate-700 font-medium mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Dependentes */}
        {activeTab === "dependentes" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="font-semibold text-slate-700">Dependentes</h2>
            </div>
            {dependentes.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400 text-sm">
                Nenhum dependente cadastrado
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {dependentes.map((dep) => (
                  <div key={dep.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={16} className="text-[#4a6fa5]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{dep.name}</p>
                      <p className="text-xs text-slate-400">
                        {dep.relationship}
                        {dep.birthDate ? ` • ${formatDate(dep.birthDate)}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
