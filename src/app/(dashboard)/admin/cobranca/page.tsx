"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Filter,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CollectionStats {
  totalRoutes: number;
  totalStops: number;
  visitedStops: number;
  pendingStops: number;
  totalCollected: number;
  totalExpected: number;
  collectionRate: number;
  collectors: CollectorStats[];
  dailyStats: DailyStat[];
}

interface CollectorStats {
  id: string;
  name: string;
  totalStops: number;
  visitedStops: number;
  totalCollected: number;
  collectionRate: number;
}

interface DailyStat {
  date: string;
  stops: number;
  visited: number;
  collected: number;
}

export default function AdminCobrancaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [startDate, setStartDate] = useState<string>(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState<string>(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [selectedCollector, setSelectedCollector] = useState<string>("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      loadStats();
    }
  }, [status, startDate, endDate, selectedCollector]);

  async function loadStats() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate,
        endDate,
        collectorId: selectedCollector,
      });
      
      const res = await fetch(`/api/admin/collection-stats?${params}`);
      const data = await res.json();
      
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    if (!stats) return;
    
    // Gera CSV
    const csvContent = [
      ["Data", "Paradas", "Visitadas", "Cobrança (R$)"].join(";"),
      ...stats.dailyStats.map((day) => [
        format(new Date(day.date), "dd/MM/yyyy"),
        day.stops,
        day.visited,
        day.collected.toFixed(2),
      ].join(";")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-cobranca-${startDate}-${endDate}.csv`;
    link.click();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin")}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Relatório de Cobrança</h1>
              <p className="text-sm text-slate-500">Acompanhamento de rotas e pagamentos</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-slate-500" />
            <h2 className="font-semibold text-slate-900">Filtros</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data Inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data Final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleExport}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={20} className="text-blue-600" />
                  <span className="text-sm text-slate-500">Rotas</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalRoutes}</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={20} className="text-indigo-600" />
                  <span className="text-sm text-slate-500">Paradas</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalStops}</p>
                <p className="text-xs text-slate-500">
                  {stats.visitedStops} visitadas ({Math.round(stats.collectionRate)}%)
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={20} className="text-green-600" />
                  <span className="text-sm text-slate-500">Cobrado</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  R$ {stats.totalCollected.toFixed(2)}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={20} className="text-amber-600" />
                  <span className="text-sm text-slate-500">Taxa de Cobrança</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.collectionRate.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Collectors Performance */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users size={20} className="text-slate-500" />
                <h2 className="font-semibold text-slate-900">Desempenho por Cobrador</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-2 text-sm font-medium text-slate-700">Cobrador</th>
                      <th className="text-center py-2 px-2 text-sm font-medium text-slate-700">Paradas</th>
                      <th className="text-center py-2 px-2 text-sm font-medium text-slate-700">Visitadas</th>
                      <th className="text-right py-2 px-2 text-sm font-medium text-slate-700">Cobrado</th>
                      <th className="text-center py-2 px-2 text-sm font-medium text-slate-700">Taxa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.collectors.map((collector) => (
                      <tr key={collector.id} className="border-b border-slate-100">
                        <td className="py-3 px-2">{collector.name}</td>
                        <td className="text-center py-3 px-2">{collector.totalStops}</td>
                        <td className="text-center py-3 px-2">{collector.visitedStops}</td>
                        <td className="text-right py-3 px-2 font-medium">
                          R$ {collector.totalCollected.toFixed(2)}
                        </td>
                        <td className="text-center py-3 px-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              collector.collectionRate >= 80
                                ? "bg-green-100 text-green-800"
                                : collector.collectionRate >= 50
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {collector.collectionRate.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Daily Chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={20} className="text-slate-500" />
                <h2 className="font-semibold text-slate-900">Evolução Diária</h2>
              </div>

              <div className="space-y-3">
                {stats.dailyStats.map((day) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <div className="w-20 text-sm text-slate-600">
                      {format(new Date(day.date), "dd/MM")}
                    </div>
                    <div className="flex-1">
                      <div className="h-8 bg-slate-100 rounded-lg overflow-hidden flex">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{
                            width: `${day.stops > 0 ? (day.visited / day.stops) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-24 text-right text-sm">
                      <span className="font-medium">{day.visited}/{day.stops}</span>
                      <span className="text-slate-500 ml-1">visitas</span>
                    </div>
                    <div className="w-28 text-right text-sm font-medium text-green-600">
                      R$ {day.collected.toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
