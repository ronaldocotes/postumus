"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Search, X, Printer, Download } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import SearchSelect from "@/components/ui/SearchSelect";
import PaymentModal from "@/components/carnes/PaymentModal";

interface Installment {
  id: string;
  numero: number;
  valor: number;
  dueDate: string;
  status: string;
  payment?: {
    id: string;
    paidAmount: number;
    paidAt: string;
    paymentMethod?: string;
  };
}

interface Carne {
  id: string;
  year: number;
  totalValue: number;
  client: { name: string; cpf: string };
  installments: Installment[];
}

const AVATAR_COLORS = ['#10b981','#3b82f6','#f59e0b','#ec4899','#8b5cf6','#06b6d4'];
const PALETAS = {
  azul:  { dark:'#1e3a5f', accent:'#2563eb', light:'#dbeafe' },
  verde: { dark:'#14532d', accent:'#16a34a', light:'#dcfce7' },
  vinho: { dark:'#4a0e1a', accent:'#9b1c31', light:'#ffe4e6' },
  preto: { dark:'#111827', accent:'#b8960c', light:'#fef9c3' },
};

export default function CarnesPage() {
  const { success, error, loading: toastLoading, update } = useToast();
  const [carnes, setCarnes] = useState<Carne[]>([]);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showDetail, setShowDetail] = useState<Carne | null>(null);
  const [showPrint, setShowPrint] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState({ clientId: "", year: String(new Date().getFullYear()), totalValue: "", installments: "12", dueDay: "15" });
  const [formLoading, setFormLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [pixData, setPixData] = useState<any>(null);
  const [selectedPaleta, setSelectedPaleta] = useState<keyof typeof PALETAS>("azul");
  const [printOptions, setPrintOptions] = useState({ pendentesOnly: true, signature: true });
  const hasLoaded = useRef(false);

  const getAvatarColor = (i: number) => AVATAR_COLORS[i % AVATAR_COLORS.length];
  const getInitials = (name: string) => name.split(" ").slice(0,2).map(n => n[0]).join("").toUpperCase();

  const load = useCallback(async (searchTerm = "") => {
    try {
      const res = await fetch(`/api/carnes?search=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) return;
      const data = await res.json();
      setCarnes(data.carnes || []);
    } catch (err) {
      console.error("Erro ao carregar carnês:", err);
    }
  }, []);

  const loadClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clientes?limit=999");
      if (!res.ok) return;
      const data = await res.json();
      setClients(data.clients || []);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
    }
  }, []);

  const loadPixData = useCallback(async () => {
    try {
      const res = await fetch("/api/empresa");
      if (res.ok) {
        const data = await res.json();
        const company = data.companies?.[0];
        if (company) {
          setPixData({
            keyType: company.pixKeyType,
            key: company.pixKey,
            name: company.pixName,
            city: company.pixCity,
          });
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados PIX:", err);
    }
  }, []);

  useEffect(() => { 
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      load("");
      loadPixData();
    }
  }, [load, loadPixData]);

  useEffect(() => {
    const timer = setTimeout(() => load(search), 300);
    return () => clearTimeout(timer);
  }, [search, load]);

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const fmtDate = (d: string) => new Intl.DateTimeFormat("pt-BR").format(new Date(d));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId) { error("Selecione um cliente"); return; }
    if (!form.totalValue || parseFloat(form.totalValue) <= 0) { error("Valor total deve ser maior que 0"); return; }
    
    setFormLoading(true);
    const toastId = toastLoading("Criando carnê...");
    
    try {
      const res = await fetch("/api/carnes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          clientId: form.clientId,
          year: parseInt(form.year), 
          totalValue: parseFloat(form.totalValue), 
          installments: parseInt(form.installments),
        }),
      });
      
      const data = await res.json();
      if (res.ok) { 
        setShowNew(false); 
        setForm({ clientId: "", year: String(new Date().getFullYear()), totalValue: "", installments: "12", dueDay: "15" }); 
        load(search);
        update(toastId, "Carnê criado com sucesso! ✅", "success");
      } else {
        update(toastId, data.error || "Erro ao criar carnê", "error");
      }
    } catch (err: any) {
      update(toastId, "Erro de conexão", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handlePay(installmentId: string) {
    const installment = showDetail?.installments.find((i: any) => i.id === installmentId);
    if (!installment) return;
    setSelectedInstallment(installment);
    setShowPaymentModal(true);
  }

  async function handlePaymentMethodSelected(method: string) {
    if (!selectedInstallment || !showDetail) return;
    const toastId = toastLoading("Registrando pagamento...");
    try {
      const res = await fetch(`/api/carnes/${selectedInstallment.id}/pagamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAmount: selectedInstallment.valor, paymentMethod: method }),
      });
      
      if (res.ok) {
        const carneRes = await fetch(`/api/carnes/${showDetail!.id}`);
        const updated = await carneRes.json();
        setShowDetail(updated);
        load(search);
        update(toastId, "Pagamento registrado com sucesso! ✅", "success");
        setShowPaymentModal(false);
        setSelectedInstallment(null);
      } else {
        update(toastId, "Erro ao registrar pagamento", "error");
      }
    } catch (err) {
      update(toastId, "Erro de conexão", "error");
    }
  }

  async function handlePrint(carneId: string) {
    const toastId = toastLoading("Gerando carnê para impressão...");
    try {
      const { default: jsPDF } = await import("jspdf");
      
      const carne = showDetail;
      if (!carne) throw new Error("Carnê não carregado");

      const doc = new jsPDF();
      const client = carne.client;
      const installments = carne.installments;
      
      const fmtMoney = (v: number) => "R$ " + v.toFixed(2).replace(".", ",");
      const fmtDate = (d: string) => new Intl.DateTimeFormat("pt-BR").format(new Date(d));

      // Header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("CARNÊ DE PAGAMENTO", 105, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Posthumous - Gestão de Serviços Póstumos", 105, 28, { align: "center" });
      
      // Linha
      doc.setDrawColor(200);
      doc.line(20, 35, 190, 35);

      // Info do cliente
      doc.setFontSize(10);
      let y = 45;
      doc.setFont("helvetica", "bold");
      doc.text("Cliente:", 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(client.name, 50, y);
      
      y += 7;
      doc.setFont("helvetica", "bold");
      doc.text("Ano:", 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(`${carne.year} | ${installments.length}x de ${fmtMoney(installments[0]?.valor || 0)}`, 50, y);
      
      y += 7;
      doc.setFont("helvetica", "bold");
      doc.text("Total:", 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(fmtMoney(carne.totalValue), 50, y);
      
      // Tabela
      y += 15;
      doc.setDrawColor(200);
      doc.line(20, y, 190, y);
      y += 7;
      
      // Header tabela
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("PARCELA", 20, y);
      doc.text("VENCIMENTO", 55, y);
      doc.text("VALOR", 100, y);
      doc.text("STATUS", 145, y);
      y += 3;
      doc.line(20, y, 190, y);
      y += 7;

      // Parcelas
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      
      for (const inst of installments) {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        
        const status = inst.payment ? "PAGO" : "PENDENTE";
        
        doc.text(`${String(inst.numero).padStart(2, "0")}/${installments.length}`, 20, y);
        doc.text(fmtDate(inst.dueDate), 55, y);
        doc.setFont("helvetica", "bold");
        doc.text(fmtMoney(inst.valor), 100, y);
        doc.setFont("helvetica", "normal");
        
        if (status === "PAGO") {
          doc.setTextColor(22, 163, 74); // green
        } else {
          doc.setTextColor(217, 119, 6); // amber
        }
        doc.text(status, 145, y);
        doc.setTextColor(0);
        
        y += 8;
      }

      // Footer
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(
        `Gerado em ${new Date().toLocaleDateString("pt-BR")} - Posthumous`,
        105, 290, { align: "center" }
      );

      doc.save(`carne_${client.name.replace(/\s+/g, "_")}_${carne.year}.pdf`);
      update(toastId, "Carnê gerado com sucesso! ✅", "success");
    } catch (err: any) {
      console.error("Erro ao gerar PDF:", err);
      update(toastId, "Erro ao gerar carnê: " + (err.message || ""), "error");
    }
  }

  const renderCoupon = (parcela: Installment, carneInfo: Carne, paleta: typeof PALETAS.azul, index: number) => {
    const parcNum = String(parcela.numero).padStart(2,'0');
    const parcTotal = String(carneInfo.installments.length).padStart(2,'0');
    return (
      <div key={index}>
        {index > 0 && <div className="py-2 border-t-2 border-dashed border-gray-300 my-2 flex items-center justify-center"><span className="text-xs text-gray-400">✂ CORTE AQUI</span></div>}
        <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden mb-2 h-20">
          {/* Via Cobrador */}
          <div style={{background: paleta.light}} className="w-2/5 flex flex-col">
            <div style={{background: paleta.dark}} className="px-2 py-1 text-white flex items-center justify-between">
              <span className="text-[7px] font-bold">Posthumous</span>
              <small className="text-[5px]">VIA COBRADOR</small>
            </div>
            <div className="flex-1 px-2 py-1 flex items-center justify-between text-[7px]">
              <div>
                <div className="text-gray-400 text-[5px]">CLIENTE</div>
                <strong style={{color: paleta.dark}} className="text-[8px]">{carneInfo.client.name.split(' ').slice(0,2).join(' ')}</strong>
                <div className="text-gray-500 text-[5px] mt-0.5">Ref: {fmtDate(parcela.dueDate)}</div>
              </div>
              <div style={{color: paleta.accent}} className="font-black text-base">{parcNum}/{parcTotal}</div>
            </div>
          </div>
          {/* Perforação */}
          <div className="w-3 bg-gray-100 flex flex-col items-center justify-center gap-1">
            {Array(6).fill(null).map((_, i) => <div key={i} className="w-0.5 h-0.5 rounded-full" style={{background: paleta.light}}></div>)}
          </div>
          {/* Via Cliente */}
          <div className="flex-1 flex flex-col">
            <div style={{background: paleta.dark}} className="px-2 py-1 text-white flex items-center justify-between">
              <span className="text-[7px] font-bold">Posthumous</span>
              <small className="text-[5px]">VIA CLIENTE / RECIBO</small>
            </div>
            <div className="flex-1 grid grid-cols-2 px-2 py-1 gap-1">
              <div className="flex flex-col justify-around">
                <div><div className="text-[5px] text-gray-400 uppercase">Cliente</div><div className="text-[7px] font-semibold text-gray-900">{carneInfo.client.name.split(' ').slice(0,1).join('')}</div></div>
                <div><div className="text-[5px] text-gray-400 uppercase">Vencimento</div><div className="text-[7px] font-semibold text-gray-900">{fmtDate(parcela.dueDate)}</div></div>
              </div>
              <div className="flex flex-col justify-around">
                <div><div className="text-[5px] text-gray-400 uppercase">Parcela</div><div style={{color: paleta.accent}} className="text-xs font-black">{parcNum}/{parcTotal}</div></div>
                <div><div className="text-[5px] text-gray-400 uppercase">Valor</div><div style={{color: paleta.dark}} className="text-[7px] font-black">{fmt(parcela.valor)}</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPrintPreview = () => {
    if (!showDetail) return null;
    const paleta = PALETAS[selectedPaleta];
    const todasParcelas = printOptions.pendentesOnly 
      ? showDetail.installments.filter((p: any) => !p.payment)
      : showDetail.installments;
    const previewParcelas = todasParcelas.slice(0, 3);
    const restantes = todasParcelas.length - 3;
    
    return (
      <div className="space-y-2">
        {previewParcelas.map((p: any, i: number) => renderCoupon(p, showDetail, paleta, i))}
        {restantes > 0 && (
          <p className="text-xs text-gray-400 text-center pt-2">+ {restantes} cupons adicionais no PDF</p>
        )}
        {todasParcelas.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Todas as parcelas já estão pagas ✓</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
      `}</style>
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Carnês</h1>
        <button onClick={() => { setShowNew(true); loadClients(); }}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
          <Plus size={18} /> Gerar Carnê
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por nome do cliente..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedInstallment(null);
          }}
          onPayment={handlePaymentMethodSelected}
          installmentValue={selectedInstallment?.valor || 0}
          clientName={showDetail?.client.name || ""}
          pixData={pixData}
        />

        {/* Carnes List */}
        <div className="space-y-3">
          {carnes.map((c, idx) => {
            const paid = c.installments.filter(i => i.payment && i.status === "PAID").length;
            const total = c.installments.length;
            const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
            
            return (
              <button
                key={c.id}
                onClick={() => setShowDetail(c)}
                className="w-full text-left bg-white rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all p-5 group"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" 
                    style={{background: getAvatarColor(idx)}}>
                    {getInitials(c.client.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{c.client.name}</h3>
                    <div className="flex gap-5 mt-1 flex-wrap text-xs text-gray-500">
                      <div className="flex items-center gap-1"><span className="text-gray-400">📋</span>{c.client.cpf}</div>
                      <div className="flex items-center gap-1"><span className="text-gray-400">📅</span>Ano {c.year}</div>
                      <div className="flex items-center gap-1"><span className="text-gray-400">💰</span>{fmt(c.totalValue)}</div>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="font-medium text-gray-700">{paid}/{total} pagos</span>
                        <span className="text-gray-500">{pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all" style={{width: `${pct}%`}}></div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{total}x de {fmt(c.totalValue / total)}</p>
                  </div>

                  {/* Arrow */}
                  <div className="text-gray-400 group-hover:text-blue-600 transition-colors">→</div>
                </div>
              </button>
            );
          })}
          {carnes.length === 0 && <div className="text-center py-12 text-gray-500">Nenhum carnê encontrado</div>}
        </div>
      </div>

      {/* Modal: Gerar Carnê */}
      {showNew && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Gerar Novo Carnê</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cliente <span className="text-red-500">*</span></label>
                <SearchSelect
                  options={clients.map(c => ({ value: c.id, label: c.name, sub: c.cpf || undefined }))}
                  value={form.clientId}
                  onChange={(val) => setForm({ ...form, clientId: val })}
                  placeholder="Buscar cliente..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ano</label>
                  <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Parcelas</label>
                  <input type="number" value={form.installments} onChange={(e) => setForm({ ...form, installments: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Valor Total <span className="text-red-500">*</span></label>
                <input type="number" step="0.01" value={form.totalValue} onChange={(e) => setForm({ ...form, totalValue: e.target.value })} 
                  placeholder="R$ 0,00" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dia de Vencimento</label>
                <input type="number" min="1" max="28" value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNew(false)} 
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={formLoading} 
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm transition-colors">
                  {formLoading ? "Gerando..." : "Gerar Carnê"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalhes */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="border-b border-gray-100 p-6 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{showDetail.client.name}</h2>
                  <p className="text-sm text-gray-600 mt-1">Carnê {showDetail.year} • {fmt(showDetail.totalValue)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setShowPrint(true); }}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium text-sm transition-colors">
                    <Printer size={16} /> Imprimir
                  </button>
                  <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">Progresso do Pagamento</span>
                  <span className="text-xs font-bold text-gray-900">{showDetail.installments.filter(i => i.payment).length}/{showDetail.installments.length} pagos</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all" 
                    style={{width: `${(showDetail.installments.filter(i => i.payment).length / showDetail.installments.length) * 100}%`}}></div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">PARCELA</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">VENCIMENTO</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">VALOR</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wide">STATUS</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">AÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {showDetail.installments.map((inst) => {
                    const isPaid = !!inst.payment;
                    return (
                      <tr key={inst.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-900">{inst.numero}/{showDetail.installments.length}</td>
                        <td className="px-4 py-3 text-gray-600">{fmtDate(inst.dueDate)}</td>
                        <td className="px-4 py-3 font-bold text-gray-900 text-right">{fmt(inst.valor)}</td>
                        <td className="px-4 py-3 text-center">
                          {isPaid 
                            ? <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">✓ Pago</span>
                            : <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">⏰ Pendente</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!isPaid && (
                            <button onClick={() => handlePay(inst.id)} 
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-emerald-200 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-50 hover:border-emerald-500 hover:text-emerald-800 transition-all duration-200 shadow-sm hover:shadow">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                              </svg>
                              Pagar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Imprimir */}
      {showPrint && showDetail && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Imprimir Carnê</h2>
                <p className="text-sm text-gray-500 mt-1">Prévia do layout de impressão</p>
              </div>
              <button onClick={() => setShowPrint(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Preview */}
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Prévia dos cupons</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                {renderPrintPreview()}
              </div>

              {/* Color Palettes */}
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Paleta de cores</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {Object.entries(PALETAS).map(([key, pal]) => (
                  <button key={key}
                    onClick={() => setSelectedPaleta(key as keyof typeof PALETAS)}
                    className={`p-3 rounded-lg border-2 transition-all ${selectedPaleta === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <div className="font-semibold text-sm text-gray-900 mb-1">
                      {key === 'azul' && 'Azul Corporativo'}
                      {key === 'verde' && 'Verde Institucional'}
                      {key === 'vinho' && 'Vinho / Bordô'}
                      {key === 'preto' && 'Preto & Dourado'}
                    </div>
                    <div className="flex gap-2">
                      <div className="w-4 h-4 rounded" style={{background: pal.dark}}></div>
                      <div className="w-4 h-4 rounded" style={{background: pal.accent}}></div>
                      <div className="w-4 h-4 rounded" style={{background: pal.light}}></div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Options */}
              <div className="space-y-2 mb-6">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={printOptions.pendentesOnly} onChange={(e) => setPrintOptions({...printOptions, pendentesOnly: e.target.checked})} 
                    className="w-4 h-4 rounded border-gray-300 accent-blue-600" />
                  Apenas parcelas pendentes
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={printOptions.signature} onChange={(e) => setPrintOptions({...printOptions, signature: e.target.checked})} 
                    className="w-4 h-4 rounded border-gray-300 accent-blue-600" />
                  Campo de assinatura
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-4 flex gap-3 justify-end">
              <button onClick={() => setShowPrint(false)} 
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm">
                Cancelar
              </button>
              <button onClick={() => { handlePrint(showDetail.id); setShowPrint(false); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium text-sm">
                <Download size={16} /> Gerar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
