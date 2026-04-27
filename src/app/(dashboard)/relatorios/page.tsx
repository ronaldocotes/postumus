"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Eye, FileText, Users, Truck, Package, AlertTriangle, DollarSign, CreditCard, 
  Printer, Heart, ShoppingBag, Wrench, Download, FileSpreadsheet, 
  ChevronRight, TrendingUp, TrendingDown, Calendar, X, Loader2
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import {
  generateClientesPDF,
  generateContribuintesPDF,
  generateCompradoresPDF,
  generateServicosPDF,
  generateFornecedoresPDF,
  generateMercadoriasPDF,
  generateInadimplentesPDF,
  generateFinanceiroPDF,
  generatePagamentosPDF,
} from "@/lib/pdf-generator";
import {
  generateClientesExcel,
  generateContribuintesExcel,
  generateCompradoresExcel,
  generateServicosExcel,
  generateFornecedoresExcel,
  generateMercadoriasExcel,
  generateInadimplentesExcel,
  generateFinanceiroExcel,
  generatePagamentosExcel,
} from "@/lib/excel-generator";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtDate = (d: string) => new Intl.DateTimeFormat("pt-BR").format(new Date(d));

const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

// Tipos de relatórios organizados por seção
interface ReportCard {
  type: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  desc: string;
  metric?: string;
  metricValue?: string;
  metricAlert?: boolean;
  chart?: {
    type: "line" | "bar" | "progress" | "pie";
    data: number[];
    labels?: string[];
    max?: number;
    color?: string;
  };
}

const reportSections = [
  {
    id: "financeiro",
    title: "📈 Financeiro & Cobrança",
    description: "Controle de receitas, despesas e inadimplência",
    reports: [
      { 
        type: "financeiro", 
        label: "Financeiro Mensal", 
        icon: DollarSign, 
        color: "text-emerald-600", 
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        hoverColor: "hover:border-emerald-300 hover:shadow-emerald-100",
        desc: "Receitas e despesas do período",
        metric: "Saldo do mês",
        metricValue: "R$ 12.450,00",
        needsPeriod: true,
        chart: {
          type: "line",
          data: [8500, 9200, 8800, 10100, 11500, 12450],
          labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
          color: "#10b981",
        },
      },
      { 
        type: "pagamentos", 
        label: "Pagamentos Recebidos", 
        icon: CreditCard, 
        color: "text-orange-600", 
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        hoverColor: "hover:border-orange-300 hover:shadow-orange-100",
        desc: "Carnês pagos no período selecionado",
        metric: "Total recebido",
        metricValue: "R$ 8.320,00",
        needsPeriod: true,
        chart: {
          type: "bar",
          data: [45, 52, 48, 61, 58, 67],
          labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
          color: "#f97316",
        },
      },
      { 
        type: "inadimplentes", 
        label: "Inadimplentes", 
        icon: AlertTriangle, 
        color: "text-red-600", 
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        hoverColor: "hover:border-red-300 hover:shadow-red-100",
        desc: "Clientes com parcelas em atraso",
        metric: "Em atraso",
        metricValue: "15 carnês",
        metricAlert: true,
        needsPeriod: false,
        chart: {
          type: "progress",
          data: [15],
          max: 128,
          color: "#ef4444",
        },
      },
    ],
  },
  {
    id: "clientes",
    title: "👥 Clientes & Contratos",
    description: "Gestão de associados e contribuintes",
    reports: [
      { 
        type: "clientes", 
        label: "Clientes Ativos", 
        icon: Users, 
        color: "text-blue-600", 
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        hoverColor: "hover:border-blue-300 hover:shadow-blue-100",
        desc: "Lista completa de todos os clientes",
        metric: "Total ativos",
        metricValue: "343 clientes",
        needsPeriod: false,
        chart: {
          type: "line",
          data: [280, 295, 310, 325, 335, 343],
          labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
          color: "#3b82f6",
        },
      },
      { 
        type: "contribuintes", 
        label: "Contribuintes (Carnê)", 
        icon: Heart, 
        color: "text-teal-600", 
        bgColor: "bg-teal-50",
        borderColor: "border-teal-200",
        hoverColor: "hover:border-teal-300 hover:shadow-teal-100",
        desc: "Clientes com plano funerário",
        metric: "Contribuintes",
        metricValue: "128 ativos",
        needsPeriod: false,
        chart: {
          type: "pie",
          data: [128, 215],
          labels: ["Com Carnê", "Sem Carnê"],
          color: "#14b8a6",
        },
      },
    ],
  },
  {
    id: "operacional",
    title: "📦 Operacional & Estoque",
    description: "Vendas, mercadorias e fornecedores",
    reports: [
      { 
        type: "servicos", 
        label: "Vendas de Serviços", 
        icon: Wrench, 
        color: "text-violet-600", 
        bgColor: "bg-violet-50",
        borderColor: "border-violet-200",
        hoverColor: "hover:border-violet-300 hover:shadow-violet-100",
        desc: "Tanatopraxia, translado, ornamentação",
        metric: "Vendas no mês",
        metricValue: "24 serviços",
        needsPeriod: true,
        chart: {
          type: "bar",
          data: [18, 22, 19, 25, 21, 24],
          labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
          color: "#8b5cf6",
        },
      },
      { 
        type: "compradores", 
        label: "Compradores de Mercadoria", 
        icon: ShoppingBag, 
        color: "text-indigo-600", 
        bgColor: "bg-indigo-50",
        borderColor: "border-indigo-200",
        hoverColor: "hover:border-indigo-300 hover:shadow-indigo-100",
        desc: "Clientes que compraram produtos",
        metric: "Total vendido",
        metricValue: "R$ 3.450,00",
        needsPeriod: true,
        chart: {
          type: "line",
          data: [2100, 2800, 1950, 3200, 2900, 3450],
          labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
          color: "#6366f1",
        },
      },
      { 
        type: "mercadorias", 
        label: "Mercadorias", 
        icon: Package, 
        color: "text-purple-600", 
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
        hoverColor: "hover:border-purple-300 hover:shadow-purple-100",
        desc: "Estoque e preços de produtos",
        metric: "Estoque baixo",
        metricValue: "8 itens",
        metricAlert: true,
        needsPeriod: false,
        chart: {
          type: "progress",
          data: [8],
          max: 45,
          color: "#a855f7",
        },
      },
      { 
        type: "fornecedores", 
        label: "Fornecedores", 
        icon: Truck, 
        color: "text-green-600", 
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        hoverColor: "hover:border-green-300 hover:shadow-green-100",
        desc: "Lista de fornecedores cadastrados",
        metric: "Cadastrados",
        metricValue: "12 fornecedores",
        needsPeriod: false,
      },
    ],
  },
];

// Modal de seleção de período
function PeriodModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  reportName,
  loading 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: (month: number, year: number) => void;
  reportName: string;
  loading: boolean;
}) {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{reportName}</h3>
            <p className="text-sm text-slate-500 mt-1">Selecione o período desejado</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mês</label>
            <select 
              value={month} 
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              disabled={loading}
            >
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Ano</label>
            <input 
              type="number" 
              value={year} 
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(month, year)}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Gerar Relatório
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de mini gráficos
function MiniChart({ chart }: { chart: any }) {
  if (!chart) return null;

  const { type, data, labels, max, color } = chart;

  // Gráfico de linha (sparkline)
  if (type === "line") {
    const min = Math.min(...data);
    const range = Math.max(...data) - min || 1;
    const points = data
      .map((val: number, i: number) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 80 - 10;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <div className="mt-3 mb-2">
        <div className="flex items-end justify-between text-[10px] text-slate-400 mb-1">
          <span>{labels?.[0]}</span>
          <span>{labels?.[labels.length - 1]}</span>
        </div>
        <svg viewBox="0 0 100 100" className="w-full h-12">
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={`0,100 ${points} 100,100`}
            fill={`url(#gradient-${color})`}
          />
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Pontos nos extremos */}
          <circle cx="0" cy={100 - ((data[0] - min) / range) * 80 - 10} r="2" fill={color} />
          <circle cx="100" cy={100 - ((data[data.length - 1] - min) / range) * 80 - 10} r="3" fill={color} />
        </svg>
      </div>
    );
  }

  // Gráfico de barras
  if (type === "bar") {
    const maxVal = Math.max(...data);
    return (
      <div className="mt-3 mb-2">
        <div className="flex items-end justify-between gap-1 h-12">
          {data.map((val: number, i: number) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-sm transition-all duration-500"
                style={{
                  height: `${(val / maxVal) * 100}%`,
                  backgroundColor: color,
                  opacity: i === data.length - 1 ? 1 : 0.6,
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>{labels?.[0]}</span>
          <span>{labels?.[labels.length - 1]}</span>
        </div>
      </div>
    );
  }

  // Barra de progresso
  if (type === "progress") {
    const value = data[0];
    const percentage = max ? (value / max) * 100 : value;
    const isAlert = percentage > 15;

    return (
      <div className="mt-3 mb-2">
        <div className="flex justify-between text-xs text-slate-600 mb-1">
          <span>{value} de {max}</span>
          <span className={isAlert ? "text-red-600 font-medium" : ""}>
            {percentage.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: isAlert ? "#ef4444" : color,
            }}
          />
        </div>
      </div>
    );
  }

  // Gráfico de pizza/donut simplificado
  if (type === "pie") {
    const total = data.reduce((a: number, b: number) => a + b, 0);
    const percentage = (data[0] / total) * 100;

    return (
      <div className="mt-3 mb-2 flex items-center gap-3">
        <div className="relative w-12 h-12">
          <svg viewBox="0 0 36 36" className="w-full h-full">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeDasharray={`${percentage}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
            {percentage.toFixed(0)}%
          </span>
        </div>
        <div className="text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span>{labels?.[0]}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <div className="w-2 h-2 rounded-full bg-slate-300" />
            <span>{labels?.[1]}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Card de relatório com micro-métricas
function ReportCard({ 
  report, 
  onGenerate, 
  onExportPDF, 
  onExportExcel,
  loading 
}: { 
  report: any;
  onGenerate: () => void;
  onExportPDF: (e: React.MouseEvent) => void;
  onExportExcel: (e: React.MouseEvent) => void;
  loading: boolean;
}) {
  const Icon = report.icon;
  
  return (
    <div className={`group bg-white rounded-xl border ${report.borderColor} p-5 transition-all duration-200 ${report.hoverColor} hover:shadow-lg ${loading ? 'opacity-70' : ''}`}>
      {/* Header com ícone e título */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`${report.bgColor} ${report.color} p-2.5 rounded-xl`}>
            <Icon size={22} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{report.label}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{report.desc}</p>
          </div>
        </div>
      </div>

      {/* Micro-métrica */}
      <div className="mb-2">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
          report.metricAlert 
            ? 'bg-red-100 text-red-700 border border-red-200' 
            : 'bg-slate-100 text-slate-700 border border-slate-200'
        }`}>
          {report.metricAlert ? <AlertTriangle size={14} /> : <TrendingUp size={14} />}
          <span>{report.metric}: {report.metricValue}</span>
        </div>
      </div>

      {/* Mini Gráfico */}
      {report.chart && <MiniChart chart={report.chart} />}

      {/* Ações */}
      <div className="flex items-center gap-2">
        <button
          onClick={onGenerate}
          disabled={loading}
          className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-colors disabled:opacity-50"
          title="Visualizar Relatório"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Eye size={18} />
          )}
        </button>

        <button
          onClick={onExportPDF}
          disabled={loading}
          className="p-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-colors disabled:opacity-50"
          title="Exportar PDF"
        >
          <Download size={18} />
        </button>

        <button
          onClick={onExportExcel}
          disabled={loading}
          className="p-2.5 text-slate-600 hover:text-green-600 hover:bg-green-50 border border-slate-200 hover:border-green-200 rounded-lg transition-colors disabled:opacity-50"
          title="Exportar Excel"
        >
          <FileSpreadsheet size={18} />
        </button>
      </div>
    </div>
  );
}

export default function RelatoriosPage() {
  const [report, setReport] = useState<any>(null);
  const [reportType, setReportType] = useState("");
  const [loading, setLoading] = useState(false);
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [pendingReport, setPendingReport] = useState<any>(null);
  const [pendingExport, setPendingExport] = useState<{type: string, label: string, format: 'pdf' | 'excel'} | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const { loading: toastLoading, success, error, update, dismiss } = useToast();

  async function generate(type: string, month?: number, year?: number) {
    setLoading(true);
    setReportType(type);
    const params = new URLSearchParams({ type });
    if (month && year) {
      params.set("month", String(month));
      params.set("year", String(year));
    }
    const res = await fetch(`/api/relatorios?${params}`);
    const data = await res.json();
    setReport(data);
    setLoading(false);
  }

  // Scroll automático para o relatório quando carregar
  useEffect(() => {
    if (report && !loading && reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [report, loading]);

  function handleCardClick(reportData: any) {
    if (reportData.needsPeriod) {
      setPendingReport(reportData);
      setPeriodModalOpen(true);
    } else {
      generate(reportData.type);
    }
  }

  function handlePeriodConfirm(month: number, year: number) {
    if (pendingReport) {
      generate(pendingReport.type, month, year);
      setPeriodModalOpen(false);
      setPendingReport(null);
    } else if (pendingExport) {
      // Exportação com período
      if (pendingExport.format === 'pdf') {
        exportPDFWithPeriod(pendingExport.type, pendingExport.label, month, year);
      } else {
        exportExcelWithPeriod(pendingExport.type, pendingExport.label, month, year);
      }
      setPeriodModalOpen(false);
      setPendingExport(null);
    }
  }

  async function handleExportPDF(e: React.MouseEvent, type: string, label: string, needsPeriod: boolean) {
    e.stopPropagation();
    
    // Se precisa de período, abrir modal primeiro
    if (needsPeriod) {
      setPendingExport({ type, label, format: 'pdf' });
      setPeriodModalOpen(true);
      return;
    }
    
    // Exportação sem período
    await exportPDFWithPeriod(type, label);
  }

  async function exportPDFWithPeriod(type: string, label: string, month?: number, year?: number) {
    const toastId = toastLoading(`⏳ Gerando PDF de ${label}...`);
    
    try {
      // Buscar dados da API
      const params = new URLSearchParams({ type });
      if (month && year) {
        params.set("month", String(month));
        params.set("year", String(year));
      }
      const res = await fetch(`/api/relatorios?${params}`);
      const data = await res.json();
      
      if (!data || !data.data) {
        update(toastId, `❌ Erro ao gerar PDF: dados não encontrados`, "error");
        return;
      }

      // Gerar PDF baseado no tipo
      switch (type) {
        case "clientes":
          generateClientesPDF(data.data);
          break;
        case "contribuintes":
          generateContribuintesPDF(data.data, data.total);
          break;
        case "compradores":
          generateCompradoresPDF(data.data, data.totalGeral);
          break;
        case "servicos":
          generateServicosPDF(data.data, data.totalGeral, data.totalVendas);
          break;
        case "fornecedores":
          generateFornecedoresPDF(data.data);
          break;
        case "mercadorias":
          generateMercadoriasPDF(data.data);
          break;
        case "inadimplentes":
          generateInadimplentesPDF(data.data, data.totalGeral);
          break;
        case "financeiro":
          generateFinanceiroPDF(data.data, data.resumo);
          break;
        case "pagamentos":
          generatePagamentosPDF(data.data, data.total);
          break;
        default:
          update(toastId, `❌ Tipo de relatório não suportado`, "error");
          return;
      }

      update(toastId, `✅ PDF de ${label} baixado com sucesso!`, "success");
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      update(toastId, `❌ Erro ao gerar PDF de ${label}`, "error");
    }
  }

  async function handleExportExcel(e: React.MouseEvent, type: string, label: string, needsPeriod: boolean) {
    e.stopPropagation();
    
    // Se precisa de período, abrir modal primeiro
    if (needsPeriod) {
      setPendingExport({ type, label, format: 'excel' });
      setPeriodModalOpen(true);
      return;
    }
    
    // Exportação sem período
    await exportExcelWithPeriod(type, label);
  }

  async function exportExcelWithPeriod(type: string, label: string, month?: number, year?: number) {
    const toastId = toastLoading(`⏳ Gerando Excel de ${label}...`);

    try {
      // Buscar dados da API
      const params = new URLSearchParams({ type });
      if (month && year) {
        params.set("month", String(month));
        params.set("year", String(year));
      }
      const res = await fetch(`/api/relatorios?${params}`);
      const data = await res.json();

      if (!data || !data.data) {
        update(toastId, `❌ Erro ao gerar Excel: dados não encontrados`, "error");
        return;
      }

      // Gerar Excel baseado no tipo
      switch (type) {
        case "clientes":
          generateClientesExcel(data.data);
          break;
        case "contribuintes":
          generateContribuintesExcel(data.data, data.total);
          break;
        case "compradores":
          generateCompradoresExcel(data.data, data.totalGeral);
          break;
        case "servicos":
          generateServicosExcel(data.data, data.totalGeral, data.totalVendas);
          break;
        case "fornecedores":
          generateFornecedoresExcel(data.data);
          break;
        case "mercadorias":
          generateMercadoriasExcel(data.data);
          break;
        case "inadimplentes":
          generateInadimplentesExcel(data.data, data.totalGeral);
          break;
        case "financeiro":
          generateFinanceiroExcel(data.data, data.resumo);
          break;
        case "pagamentos":
          generatePagamentosExcel(data.data, data.total);
          break;
        default:
          update(toastId, `❌ Tipo de relatório não suportado`, "error");
          return;
      }

      update(toastId, `✅ Excel de ${label} baixado com sucesso!`, "success");
    } catch (err) {
      console.error("Erro ao gerar Excel:", err);
      update(toastId, `❌ Erro ao gerar Excel de ${label}`, "error");
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{report ? report.title : "Central de Relatórios"}</h1>
          {!report && <p className="text-slate-500 mt-1">Visualize, analise e exporte dados do sistema</p>}
        </div>
        {report ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setReport(null);
                setReportType("");
              }}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors"
            >
              <ChevronRight size={18} className="rotate-180" />
              Voltar
            </button>
            <button 
              onClick={handlePrint} 
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 font-medium transition-colors"
            >
              <Printer size={18} /> Imprimir
            </button>
          </div>
        ) : null}
      </div>

      {/* Modal de Período */}
      <PeriodModal
        isOpen={periodModalOpen}
        onClose={() => {
          setPeriodModalOpen(false);
          setPendingReport(null);
        }}
        onConfirm={handlePeriodConfirm}
        reportName={pendingReport?.label || ""}
        loading={loading}
      />

      {/* Seções de Relatórios - Só aparecem quando não há relatório ativo */}
      {!report && !loading && (
        <div className="space-y-8 print:hidden">
          {reportSections.map((section) => (
            <section key={section.id} className="space-y-4">
              {/* Título da Seção */}
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
                <p className="text-sm text-slate-500">{section.description}</p>
              </div>

              {/* Grid de Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {section.reports.map((reportData) => (
                  <ReportCard
                    key={reportData.type}
                    report={reportData}
                    onGenerate={() => handleCardClick(reportData)}
                    onExportPDF={(e) => handleExportPDF(e, reportData.type, reportData.label, reportData.needsPeriod)}
                    onExportExcel={(e) => handleExportExcel(e, reportData.type, reportData.label, reportData.needsPeriod)}
                    loading={loading && reportType === reportData.type}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && !periodModalOpen && (
        <div className="flex items-center justify-center py-16 print:hidden">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 size={24} className="animate-spin" />
            <span className="text-lg">Gerando relatório...</span>
          </div>
        </div>
      )}

      {/* Conteúdo do Relatório Gerado - Só aparece quando há relatório */}
      {report && !loading && (
        <div 
          ref={reportRef}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:shadow-none print:border-none print:p-0 print:rounded-none scroll-mt-6"
        >
          {/* Cabeçalho do Relatório */}
          <div className="mb-6 print:mb-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:pb-2">
              <div className="flex items-center gap-4">
                <img src="/logo-oficial.png" alt="Posthumous" className="w-14 h-14" />
                <div>
                  <h2 className="text-xl font-bold text-slate-900 print:text-lg">Posthumous</h2>
                  <p className="text-sm text-slate-500">Gestão de Serviços Póstumos</p>
                </div>
              </div>
              <div className="text-right">
                <h3 className="font-bold text-slate-900 text-lg">{report.title}</h3>
                <p className="text-sm text-slate-500">Emitido em: {fmtDate(new Date().toISOString())}</p>
              </div>
            </div>
          </div>

          {/* Conteúdo específico do relatório */}
          <ReportContent report={report} reportType={reportType} />
        </div>
      )}
    </div>
  );
}

// Componente separado para o conteúdo do relatório
function ReportContent({ report, reportType }: { report: any; reportType: string }) {
  if (!report) return null;

  switch (reportType) {
    case "clientes":
      return <ClientesReport data={report.data} />;
    case "contribuintes":
      return <ContribuintesReport data={report.data} total={report.total} />;
    case "compradores":
      return <CompradoresReport data={report.data} totalGeral={report.totalGeral} />;
    case "servicos":
      return <ServicosReport data={report.data} totalGeral={report.totalGeral} totalVendas={report.totalVendas} />;
    case "fornecedores":
      return <FornecedoresReport data={report.data} />;
    case "mercadorias":
      return <MercadoriasReport data={report.data} />;
    case "inadimplentes":
      return <InadimplentesReport data={report.data} totalGeral={report.totalGeral} />;
    case "financeiro":
      return <FinanceiroReport data={report.data} resumo={report.resumo} />;
    case "pagamentos":
      return <PagamentosReport data={report.data} total={report.total} />;
    default:
      return <p className="text-center text-slate-500 py-8">Selecione um relatório para visualizar</p>;
  }
}

// Sub-componentes de relatórios (simplificados para o exemplo)
function ClientesReport({ data }: { data: any[] }) {
  return (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-blue-800 font-bold text-lg">{data?.length || 0} clientes encontrados</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="py-3 px-3 text-left font-semibold text-slate-700">Nome</th>
              <th className="py-3 px-3 text-left font-semibold text-slate-700">CPF</th>
              <th className="py-3 px-3 text-left font-semibold text-slate-700">Telefone</th>
              <th className="py-3 px-3 text-left font-semibold text-slate-700">Cidade</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-3 font-medium text-slate-900">{c.name}</td>
                <td className="py-3 px-3 text-slate-600">{c.cpf}</td>
                <td className="py-3 px-3 text-slate-600">{c.cellphone || c.phone || "-"}</td>
                <td className="py-3 px-3 text-slate-600">{c.city || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContribuintesReport({ data, total }: { data: any[]; total?: number }) {
  return (
    <div>
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6">
        <p className="text-teal-800 font-bold text-lg">{total || data?.length || 0} contribuintes ativos</p>
        <p className="text-teal-600 text-sm">Clientes com carnê do plano funerário</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="py-3 px-2 text-left font-semibold text-slate-700">Cód</th>
              <th className="py-3 px-2 text-left font-semibold text-slate-700">Nome</th>
              <th className="py-3 px-2 text-left font-semibold text-slate-700">Telefone</th>
              <th className="py-3 px-2 text-left font-semibold text-slate-700">Bairro</th>
              <th className="py-3 px-2 text-center font-semibold text-slate-700">Venc.</th>
              <th className="py-3 px-2 text-right font-semibold text-slate-700">Pendente</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-2 text-slate-600">{c.code || "-"}</td>
                <td className="py-3 px-2 font-medium text-slate-900">{c.name}</td>
                <td className="py-3 px-2 text-slate-600">{c.cellphone || c.phone || "-"}</td>
                <td className="py-3 px-2 text-slate-600">{c.neighborhood || "-"}</td>
                <td className="py-3 px-2 text-center text-slate-600">Dia {c.dueDay || "-"}</td>
                <td className={`py-3 px-2 text-right font-medium ${c.pendingAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                  {c.pendingAmount > 0 ? fmt(c.pendingAmount) : "Em dia"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompradoresReport({ data, totalGeral }: { data: any[]; totalGeral?: number }) {
  return (
    <div>
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
        <p className="text-indigo-800 font-bold text-lg">Total: {fmt(totalGeral || 0)}</p>
        <p className="text-indigo-600 text-sm">{data?.length || 0} compradores</p>
      </div>
      {data?.length === 0 ? (
        <p className="text-center text-slate-500 py-8">Nenhum comprador encontrado</p>
      ) : (
        data?.map((item, i) => (
          <div key={i} className="mb-6 border border-slate-200 rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-slate-900">{item.client.name}</h4>
                <p className="text-sm text-slate-500">CPF: {item.client.cpf || "-"}</p>
              </div>
              <p className="font-bold text-indigo-700">{fmt(item.totalSpent)}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ServicosReport({ data, totalGeral, totalVendas }: { data: any[]; totalGeral?: number; totalVendas?: number }) {
  return (
    <div>
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-6">
        <p className="text-violet-800 font-bold text-lg">Total: {fmt(totalGeral || 0)}</p>
        <p className="text-violet-600 text-sm">{totalVendas || 0} vendas realizadas</p>
      </div>
      {(!data || data.length === 0) ? (
        <p className="text-center text-slate-500 py-8">Nenhuma venda de serviço registrada</p>
      ) : (
        data?.map((item, i) => (
          <div key={i} className="mb-6 border border-slate-200 rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-slate-900">{item.service.name}</h4>
                <p className="text-sm text-slate-500">{item.totalQty} vendas</p>
              </div>
              <p className="font-bold text-violet-700">{fmt(item.totalRevenue)}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function FornecedoresReport({ data }: { data: any[] }) {
  return (
    <div>
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <p className="text-green-800 font-bold text-lg">{data?.length || 0} fornecedores cadastrados</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="py-3 px-3 text-left font-semibold text-slate-700">Nome</th>
              <th className="py-3 px-3 text-left font-semibold text-slate-700">CNPJ</th>
              <th className="py-3 px-3 text-left font-semibold text-slate-700">Telefone</th>
              <th className="py-3 px-3 text-left font-semibold text-slate-700">Contato</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-3 font-medium text-slate-900">{s.name}</td>
                <td className="py-3 px-3 text-slate-600">{s.cnpj || "-"}</td>
                <td className="py-3 px-3 text-slate-600">{s.phone || "-"}</td>
                <td className="py-3 px-3 text-slate-600">{s.contactName || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MercadoriasReport({ data }: { data: any[] }) {
  return (
    <div>
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
        <p className="text-purple-800 font-bold text-lg">{data?.length || 0} mercadorias cadastradas</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="py-3 px-3 text-left font-semibold text-slate-700">Nome</th>
              <th className="py-3 px-3 text-left font-semibold text-slate-700">SKU</th>
              <th className="py-3 px-3 text-right font-semibold text-slate-700">Preço</th>
              <th className="py-3 px-3 text-right font-semibold text-slate-700">Estoque</th>
              <th className="py-3 px-3 text-left font-semibold text-slate-700">Fornecedor</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-3 font-medium text-slate-900">{p.name}</td>
                <td className="py-3 px-3 text-slate-600">{p.sku || "-"}</td>
                <td className="py-3 px-3 text-right text-slate-600">{fmt(p.price)}</td>
                <td className={`py-3 px-3 text-right font-medium ${p.stock < 5 ? "text-red-600" : "text-slate-600"}`}>
                  {p.stock}
                </td>
                <td className="py-3 px-3 text-slate-600">{p.supplier?.name || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InadimplentesReport({ data, totalGeral }: { data: any[]; totalGeral?: number }) {
  return (
    <div>
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle size={20} className="text-red-600" />
          <p className="text-red-800 font-bold text-lg">Total em atraso: {fmt(totalGeral || 0)}</p>
        </div>
        <p className="text-red-600 text-sm">{data?.length || 0} clientes inadimplentes</p>
      </div>
      {data?.map((item, i) => (
        <div key={i} className="mb-6 border border-red-100 rounded-xl p-4 bg-red-50/30">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-bold text-slate-900">{item.client.name}</h4>
              <p className="text-sm text-slate-500">{item.client.cpf}</p>
            </div>
            <p className="font-bold text-red-600">{fmt(item.totalOverdue)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FinanceiroReport({ data, resumo }: { data: any[]; resumo?: any }) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-700 text-sm mb-1">Receitas</p>
          <p className="text-green-800 font-bold text-xl">{fmt(resumo?.income || 0)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 text-sm mb-1">Despesas</p>
          <p className="text-red-800 font-bold text-xl">{fmt(resumo?.expense || 0)}</p>
        </div>
        <div className={`${(resumo?.balance || 0) >= 0 ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"} border rounded-xl p-4`}>
          <p className="text-slate-700 text-sm mb-1">Saldo</p>
          <p className={`font-bold text-xl ${(resumo?.balance || 0) >= 0 ? "text-blue-800" : "text-red-800"}`}>
            {fmt(resumo?.balance || 0)}
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="py-3 px-3 text-left font-semibold text-slate-700">Data</th>
              <th className="py-3 px-3 text-left font-semibold text-slate-700">Descrição</th>
              <th className="py-3 px-3 text-left font-semibold text-slate-700">Categoria</th>
              <th className="py-3 px-3 text-right font-semibold text-slate-700">Valor</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((t) => (
              <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-3 text-slate-600">{fmtDate(t.date)}</td>
                <td className="py-3 px-3 font-medium text-slate-900">{t.description}</td>
                <td className="py-3 px-3 text-slate-600">{t.category || "-"}</td>
                <td className={`py-3 px-3 text-right font-medium ${t.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                  {t.type === "INCOME" ? "+" : "-"}{fmt(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PagamentosReport({ data, total }: { data: any[]; total?: number }) {
  return (
    <div>
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <p className="text-green-800 font-bold text-lg">Total recebido: {fmt(total || 0)}</p>
        <p className="text-green-600 text-sm">{data?.length || 0} pagamentos no período</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="py-3 px-3 text-left font-semibold text-slate-700">Data</th>
              <th className="py-3 px-3 text-left font-semibold text-slate-700">Cliente</th>
              <th className="py-3 px-3 text-left font-semibold text-slate-700">Parcela</th>
              <th className="py-3 px-3 text-left font-semibold text-slate-700">Método</th>
              <th className="py-3 px-3 text-right font-semibold text-slate-700">Valor</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-3 text-slate-600">{p.paidAt ? fmtDate(p.paidAt) : "-"}</td>
                <td className="py-3 px-3 font-medium text-slate-900">{p.carne?.client?.name}</td>
                <td className="py-3 px-3 text-slate-600">{p.installment}ª/{p.carne?.year}</td>
                <td className="py-3 px-3 text-slate-600">{p.paymentMethod || "-"}</td>
                <td className="py-3 px-3 text-right font-medium text-slate-900">{fmt(p.paidAmount || p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
