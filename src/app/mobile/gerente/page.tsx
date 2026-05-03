"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  AlertCircle,
  Users,
  CheckCircle,
  Phone,
  RefreshCw,
  LogOut,
  WifiOff,
  ArrowRight,
  DollarSign,
  Bike,
} from "lucide-react";
import Link from "next/link";

interface GerenteStats {
  receitasHoje: number;
  cobrancasPendentes: number;
  clientesInadimplentes: number;
  pagamentosHoje: number;
  receitasMes: number;
  totalClientes: number;
  cobradorPhone: string | null;
  evolucaoMensal: Array<{ mes: string; valor: number }>;
  ultimosPagamentos: Array<{
    id: string;
    valor: number;
    paidAt: string;
    clienteNome: string;
    clientePhone: string | null;
    numeroParcela: number;
  }>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function SimpleBarChart({ data }: { data: Array<{ mes: string; valor: number }> }) {
  const max = Math.max(...data.map((d) => d.valor), 1);
  return (
    <div className="flex items-end justify-between gap-2 h-32 mt-2">
      {data.map((item) => {
        const height = Math.max((item.valor / max) * 100, 4);
        return (
          <div key={item.mes} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end justify-center">
              <div
                className="w-full max-w-[28px] rounded-t-lg transition-all"
                style={{
                  height: `${height}%`,
                  background: item.valor > 0 ? "linear-gradient(to top, #4a6fa5, #5a7fb5)" : "#e2e8f0",
                  minHeight: item.valor > 0 ? "4px" : "4px",
                }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">{item.mes}</span>
            <span className="text-[9px] text-slate-500">
              {item.valor > 0 ? formatCurrency(item.valor).replace("R$", "") : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function MobileGerentePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<GerenteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/mobile/gerente-stats");
      if (!res.ok) throw new Error("Falha ao carregar dados");
      const data = await res.json();
      setStats(data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadStats();
  }, [status, loadStats]);

  if (status === "loading" || (status === "authenticated" && loading && !stats)) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#4a6fa5] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: "Receitas Hoje",
      value: formatCurrency(stats?.receitasHoje || 0),
      icon: DollarSign,
      color: "#22c55e",
      bg: "#f0fdf4",
    },
    {
      label: "Cobranças Pendentes",
      value: stats?.cobrancasPendentes ?? "—",
      icon: AlertCircle,
      color: "#f59e0b",
      bg: "#fffbeb",
    },
    {
      label: "Clientes Inadimplentes",
      value: stats?.clientesInadimplentes ?? "—",
      icon: Users,
      color: "#ef4444",
      bg: "#fef2f2",
    },
    {
      label: "Pagamentos Hoje",
      value: stats?.pagamentosHoje ?? "—",
      icon: CheckCircle,
      color: "#4a6fa5",
      bg: "#eff6ff",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-8">
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-4 pt-safe-top"
        style={{ background: "linear-gradient(135deg, #4a6fa5, #3d5a87)" }}
      >
        <div className="flex items-center justify-between py-4">
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Posthumous</h1>
            <p className="text-blue-200 text-xs">
              {session?.user?.name || "Gerente"} •{" "}
              <span className={isOnline ? "text-green-300" : "text-red-300"}>
                {isOnline ? "Online" : "Offline"}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadStats}
              disabled={loading}
              className="p-2 rounded-full bg-white/20 text-white active:bg-white/30 transition-colors"
              aria-label="Atualizar"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-full bg-white/20 text-white active:bg-white/30 transition-colors"
              aria-label="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Receita do mês destaque */}
        <div className="pb-5 pt-1">
          <p className="text-blue-200 text-xs mb-1">Receita do Mês</p>
          <p className="text-white text-3xl font-bold">
            {formatCurrency(stats?.receitasMes || 0)}
          </p>
          {lastUpdate && (
            <p className="text-blue-200 text-xs mt-1">
              Atualizado às {formatTime(lastUpdate.toISOString())}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Cards principais */}
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-2xl p-4 shadow-sm border border-white"
                style={{ background: card.bg }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: card.color + "22" }}
                >
                  <Icon size={20} style={{ color: card.color }} />
                </div>
                <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                <p className="text-xs text-slate-500 mt-1">{card.label}</p>
              </div>
            );
          })}
        </div>

        {/* Gráfico de evolução mensal */}
        {stats?.evolucaoMensal && stats.evolucaoMensal.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-slate-700 text-sm">Evolução Mensal</h2>
              <TrendingUp size={16} className="text-[#4a6fa5]" />
            </div>
            <SimpleBarChart data={stats.evolucaoMensal} />
          </div>
        )}

        {/* Botão ligar para cobrador */}
        {stats?.cobradorPhone && (
          <a
            href={`tel:${stats.cobradorPhone}`}
            className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-slate-100 p-4 active:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Bike size={18} className="text-[#4a6fa5]" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">Ligar para Cobrador</p>
                <p className="text-xs text-slate-400">{stats.cobradorPhone}</p>
              </div>
            </div>
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Phone size={14} className="text-white" />
            </div>
          </a>
        )}

        {/* Ações rápidas */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700 text-sm">Ações Rápidas</h2>
          </div>
          <div className="divide-y divide-slate-50">
            <Link
              href="/dashboard"
              className="flex items-center justify-between px-4 py-3 active:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} className="text-[#4a6fa5]" />
                </div>
                <span className="text-sm text-slate-700">Dashboard Completo</span>
              </div>
              <ArrowRight size={16} className="text-slate-400" />
            </Link>
            <Link
              href="/carnes"
              className="flex items-center justify-between px-4 py-3 active:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <AlertCircle size={16} className="text-amber-500" />
                </div>
                <span className="text-sm text-slate-700">Ver Cobranças</span>
              </div>
              <ArrowRight size={16} className="text-slate-400" />
            </Link>
            <Link
              href="/clientes"
              className="flex items-center justify-between px-4 py-3 active:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Users size={16} className="text-red-500" />
                </div>
                <span className="text-sm text-slate-700">Clientes</span>
              </div>
              <ArrowRight size={16} className="text-slate-400" />
            </Link>
            <Link
              href="/financeiro"
              className="flex items-center justify-between px-4 py-3 active:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign size={16} className="text-green-600" />
                </div>
                <span className="text-sm text-slate-700">Financeiro</span>
              </div>
              <ArrowRight size={16} className="text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Últimos pagamentos */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700 text-sm">Últimos Pagamentos</h2>
            <Link href="/carnes" className="text-xs text-[#4a6fa5]">
              Ver todos
            </Link>
          </div>

          {!stats?.ultimosPagamentos?.length ? (
            <div className="px-4 py-8 text-center text-slate-400 text-sm">
              Nenhum pagamento registrado ainda hoje
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {stats.ultimosPagamentos.map((pag) => (
                <div
                  key={pag.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={16} className="text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate max-w-[160px]">
                        {pag.clienteNome}
                      </p>
                      <p className="text-xs text-slate-400">
                        Parcela {pag.numeroParcela} • {formatTime(pag.paidAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(pag.valor)}
                    </span>
                    {pag.clientePhone && (
                      <a
                        href={`tel:${pag.clientePhone}`}
                        className="w-7 h-7 bg-[#4a6fa5]/10 rounded-full flex items-center justify-center"
                        aria-label={`Ligar para ${pag.clienteNome}`}
                      >
                        <Phone size={13} className="text-[#4a6fa5]" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status offline */}
        {!isOnline && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <WifiOff size={16} className="text-amber-500 flex-shrink-0" />
            <p className="text-amber-700 text-sm">
              Você está offline. Os dados podem estar desatualizados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
