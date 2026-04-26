"use client";

import { useState } from "react";
import { FileText, Users, Truck, Package, AlertTriangle, DollarSign, CreditCard, Printer, Heart, ShoppingBag, Wrench } from "lucide-react";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtDate = (d: string) => new Intl.DateTimeFormat("pt-BR").format(new Date(d));

const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export default function RelatoriosPage() {
  const [report, setReport] = useState<any>(null);
  const [reportType, setReportType] = useState("");
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  async function generate(type: string) {
    setLoading(true);
    setReportType(type);
    const params = new URLSearchParams({ type });
    if (["financeiro", "pagamentos"].includes(type)) {
      params.set("month", String(month));
      params.set("year", String(year));
    }
    const res = await fetch(`/api/relatorios?${params}`);
    const data = await res.json();
    setReport(data);
    setLoading(false);
  }

  function handlePrint() {
    window.print();
  }

  const reportCards = [
    { type: "clientes", label: "Clientes Ativos", icon: Users, color: "bg-blue-500", desc: "Lista completa de todos os clientes ativos" },
    { type: "contribuintes", label: "Contribuintes (Carnê)", icon: Heart, color: "bg-teal-500", desc: "Clientes que pagam carnê do plano funerário" },
    { type: "compradores", label: "Compradores de Mercadoria", icon: ShoppingBag, color: "bg-indigo-500", desc: "Clientes que compraram produtos/serviços avulsos" },
    { type: "servicos", label: "Vendas de Serviços", icon: Wrench, color: "bg-violet-500", desc: "Tanatopraxia, translado, ornamentação e outros serviços" },
    { type: "fornecedores", label: "Fornecedores", icon: Truck, color: "bg-green-500", desc: "Lista de todos os fornecedores cadastrados" },
    { type: "mercadorias", label: "Mercadorias", icon: Package, color: "bg-purple-500", desc: "Estoque e preços de todas as mercadorias" },
    { type: "inadimplentes", label: "Inadimplentes", icon: AlertTriangle, color: "bg-red-500", desc: "Clientes com parcelas em atraso" },
    { type: "financeiro", label: "Financeiro Mensal", icon: DollarSign, color: "bg-emerald-500", desc: "Receitas e despesas do mês" },
    { type: "pagamentos", label: "Pagamentos Recebidos", icon: CreditCard, color: "bg-orange-500", desc: "Carnês pagos no período" },
  ];

  return (
    <div>
      {/* Header - hidden on print */}
      <div className="print:hidden">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          {report && (
            <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <Printer size={18} /> Imprimir / PDF
            </button>
          )}
        </div>

        {/* Period selector for financial reports */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Período (para relatórios financeiros):</p>
          <div className="flex gap-4 items-center">
            <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Report cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {reportCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.type}
                onClick={() => generate(card.type)}
                disabled={loading}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-left hover:shadow-md transition-shadow disabled:opacity-50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`${card.color} p-2 rounded-lg`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">{card.label}</h3>
                </div>
                <p className="text-sm text-gray-500">{card.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Report content - visible on screen and print */}
      {loading && <p className="text-center text-gray-500 py-8">Gerando relatório...</p>}

      {report && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 print:shadow-none print:border-none print:p-0">
          {/* Print header */}
          <div className="mb-6 print:mb-4">
            <div className="flex items-center justify-between border-b pb-4 print:pb-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900 print:text-lg">⚱️ Posthumous</h2>
                <p className="text-sm text-gray-500">Gestão Funerária</p>
              </div>
              <div className="text-right">
                <h3 className="font-bold text-gray-900">{report.title}</h3>
                <p className="text-sm text-gray-500">Emitido em: {fmtDate(new Date().toISOString())}</p>
              </div>
            </div>
          </div>

          {/* Clientes */}
          {reportType === "clientes" && (
            <div>
              <p className="text-sm text-gray-500 mb-4">{report.data?.length || 0} clientes encontrados</p>
              <table className="w-full text-sm text-gray-900">
                <thead><tr className="border-b bg-gray-50">
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">Nome</th>
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">CPF</th>
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">Telefone</th>
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">Cidade</th>
                </tr></thead>
                <tbody>
                  {report.data?.map((c: any) => (
                    <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 px-2 font-medium text-gray-900">{c.name}</td>
                      <td className="py-2 px-2 text-gray-800">{c.cpf}</td>
                      <td className="py-2 px-2 text-gray-800">{c.cellphone || c.phone || "-"}</td>
                      <td className="py-2 px-2 text-gray-800">{c.city || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Contribuintes */}
          {reportType === "contribuintes" && (
            <div>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
                <p className="text-teal-800 font-bold">{report.total || report.data?.length || 0} contribuintes ativos</p>
                <p className="text-teal-600 text-sm">Clientes com carnê do plano funerário</p>
              </div>
              <table className="w-full text-sm text-gray-900">
                <thead><tr className="border-b bg-gray-50">
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">Cód</th>
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">Nome</th>
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">Telefone</th>
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">Bairro</th>
                  <th className="py-2 px-2 text-center font-semibold text-gray-800">Venc.</th>
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">Local</th>
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">Cobrador</th>
                  <th className="py-2 px-2 text-center font-semibold text-gray-800">Dep.</th>
                  <th className="py-2 px-2 text-right font-semibold text-gray-800">Pendente</th>
                </tr></thead>
                <tbody>
                  {report.data?.map((c: any) => (
                    <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 px-2 text-gray-800">{c.code || "-"}</td>
                      <td className="py-2 px-2 font-medium text-gray-900">{c.name}</td>
                      <td className="py-2 px-2 text-gray-800">{c.cellphone || c.phone || "-"}</td>
                      <td className="py-2 px-2 text-gray-800">{c.neighborhood || "-"}</td>
                      <td className="py-2 px-2 text-center text-gray-800">Dia {c.dueDay || "-"}</td>
                      <td className="py-2 px-2 text-gray-800">{c.paymentLocation === "LOJA" ? "Loja" : "Residência"}</td>
                      <td className="py-2 px-2 text-gray-800">{c.cobrador || "-"}</td>
                      <td className="py-2 px-2 text-center text-gray-800">{c.totalDependents}</td>
                      <td className={`py-2 px-2 text-right font-medium ${c.pendingAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                        {c.pendingAmount > 0 ? fmt(c.pendingAmount) : "Em dia"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Compradores de Mercadoria */}
          {reportType === "compradores" && (
            <div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                <p className="text-indigo-800 font-bold">Total: {fmt(report.totalGeral || 0)}</p>
                <p className="text-indigo-600 text-sm">{report.data?.length || 0} compradores</p>
              </div>
              {report.data?.length === 0 && (
                <p className="text-center text-gray-500 py-8">Nenhum comprador de mercadoria encontrado. Registre vendas no módulo Financeiro com categoria diferente de &quot;CARNE&quot; e vinculando um cliente.</p>
              )}
              {report.data?.map((item: any, i: number) => (
                <div key={i} className="mb-6 border-b pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-gray-900">{item.client.name}</h4>
                      <p className="text-sm text-gray-600">CPF: {item.client.cpf || "-"} | Tel: {item.client.cellphone || item.client.phone || "-"}</p>
                    </div>
                    <p className="font-bold text-indigo-700">{fmt(item.totalSpent)}</p>
                  </div>
                  <table className="w-full text-sm text-gray-900">
                    <thead><tr className="border-b bg-gray-50">
                      <th className="py-1 px-2 text-left font-semibold text-gray-800">Data</th>
                      <th className="py-1 px-2 text-left font-semibold text-gray-800">Descrição</th>
                      <th className="py-1 px-2 text-right font-semibold text-gray-800">Valor</th>
                    </tr></thead>
                    <tbody>
                      {item.purchases.map((p: any, j: number) => (
                        <tr key={j} className="border-b border-gray-100">
                          <td className="py-1 px-2 text-gray-800">{fmtDate(p.date)}</td>
                          <td className="py-1 px-2 text-gray-800">{p.description}</td>
                          <td className="py-1 px-2 text-right text-gray-800">{fmt(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* Vendas de Serviços */}
          {reportType === "servicos" && (
            <div>
              <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-4">
                <p className="text-violet-800 font-bold">Total: {fmt(report.totalGeral || 0)}</p>
                <p className="text-violet-600 text-sm">{report.totalVendas || 0} vendas realizadas</p>
              </div>
              {(!report.data || report.data.length === 0) && (
                <p className="text-center text-gray-500 py-8">Nenhuma venda de serviço registrada. Use o módulo Serviços para registrar vendas.</p>
              )}
              {report.data?.map((item: any, i: number) => (
                <div key={i} className="mb-6 border-b pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-gray-900">{item.service.name}</h4>
                      <p className="text-sm text-gray-600">Categoria: {item.service.category || "Geral"} | {item.totalQty} vendas</p>
                    </div>
                    <p className="font-bold text-violet-700">{fmt(item.totalRevenue)}</p>
                  </div>
                  <table className="w-full text-sm text-gray-900">
                    <thead><tr className="border-b bg-gray-50">
                      <th className="py-1 px-2 text-left font-semibold text-gray-800">Data</th>
                      <th className="py-1 px-2 text-left font-semibold text-gray-800">Cliente</th>
                      <th className="py-1 px-2 text-center font-semibold text-gray-800">Qtd</th>
                      <th className="py-1 px-2 text-right font-semibold text-gray-800">Valor</th>
                      <th className="py-1 px-2 text-center font-semibold text-gray-800">Status</th>
                    </tr></thead>
                    <tbody>
                      {item.sales.map((s: any, j: number) => (
                        <tr key={j} className="border-b border-gray-100">
                          <td className="py-1 px-2 text-gray-800">{fmtDate(s.date)}</td>
                          <td className="py-1 px-2 text-gray-800">{s.client}</td>
                          <td className="py-1 px-2 text-center text-gray-800">{s.quantity}</td>
                          <td className="py-1 px-2 text-right font-medium text-gray-900">{fmt(s.totalPrice)}</td>
                          <td className="py-1 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${s.status === "PAID" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                              {s.status === "PAID" ? "Pago" : "Pendente"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* Fornecedores */}
          {reportType === "fornecedores" && (
            <div>
              <p className="text-sm text-gray-500 mb-4">{report.data?.length || 0} fornecedores encontrados</p>
              <table className="w-full text-sm text-gray-900">
                <thead><tr className="border-b bg-gray-50">
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">Nome</th>
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">CNPJ</th>
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">Telefone</th>
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">Contato</th>
                </tr></thead>
                <tbody>
                  {report.data?.map((s: any) => (
                    <tr key={s.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 px-2 font-medium text-gray-900">{s.name}</td>
                      <td className="py-2 px-2 text-gray-800">{s.cnpj || "-"}</td>
                      <td className="py-2 px-2 text-gray-800">{s.phone || "-"}</td>
                      <td className="py-2 px-2 text-gray-800">{s.contactName || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Mercadorias */}
          {reportType === "mercadorias" && (
            <div>
              <p className="text-sm text-gray-500 mb-4">{report.data?.length || 0} mercadorias encontradas</p>
              <table className="w-full text-sm text-gray-900">
                <thead><tr className="border-b bg-gray-50">
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">Nome</th>
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">SKU</th>
                  <th className="py-2 px-2 text-right font-semibold text-gray-800">Preço</th>
                  <th className="py-2 px-2 text-right font-semibold text-gray-800">Custo</th>
                  <th className="py-2 px-2 text-right font-semibold text-gray-800">Estoque</th>
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">Fornecedor</th>
                </tr></thead>
                <tbody>
                  {report.data?.map((p: any) => (
                    <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 px-2 font-medium text-gray-900">{p.name}</td>
                      <td className="py-2 px-2 text-gray-800">{p.sku || "-"}</td>
                      <td className="py-2 px-2 text-right text-gray-800">{fmt(p.price)}</td>
                      <td className="py-2 px-2 text-right text-gray-800">{p.cost ? fmt(p.cost) : "-"}</td>
                      <td className="py-2 px-2 text-right text-gray-800">{p.stock}</td>
                      <td className="py-2 px-2 text-gray-800">{p.supplier?.name || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Inadimplentes */}
          {reportType === "inadimplentes" && (
            <div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 font-bold">Total em atraso: {fmt(report.totalGeral || 0)}</p>
                <p className="text-red-600 text-sm">{report.data?.length || 0} clientes inadimplentes</p>
              </div>
              {report.data?.map((item: any, i: number) => (
                <div key={i} className="mb-6 border-b pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-gray-900">{item.client.name}</h4>
                      <p className="text-sm text-gray-500">CPF: {item.client.cpf} | Tel: {item.client.cellphone || item.client.phone || "-"}</p>
                      {item.client.address && <p className="text-sm text-gray-500">{item.client.address}, {item.client.city}</p>}
                    </div>
                    <p className="font-bold text-red-600">{fmt(item.totalOverdue)}</p>
                  </div>
                  <table className="w-full text-sm text-gray-900">
                    <thead><tr className="border-b bg-gray-50">
                      <th className="py-1 px-2 text-left font-semibold text-gray-900">Parcela</th>
                      <th className="py-1 px-2 text-left font-semibold text-gray-900">Ano</th>
                      <th className="py-1 px-2 text-left font-semibold text-gray-900">Vencimento</th>
                      <th className="py-1 px-2 text-right font-semibold text-gray-900">Valor</th>
                    </tr></thead>
                    <tbody>
                      {item.payments.map((p: any, j: number) => (
                        <tr key={j} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-1 px-2 text-gray-800">{p.installment}ª</td>
                          <td className="py-1 px-2 text-gray-800">{p.year}</td>
                          <td className="py-1 px-2 text-gray-800">{fmtDate(p.dueDate)}</td>
                          <td className="py-1 px-2 text-right text-gray-800">{fmt(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* Financeiro */}
          {reportType === "financeiro" && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">Receitas</p>
                  <p className="font-bold text-green-800">{fmt(report.resumo?.income || 0)}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">Despesas</p>
                  <p className="font-bold text-red-800">{fmt(report.resumo?.expense || 0)}</p>
                </div>
                <div className={`${(report.resumo?.balance || 0) >= 0 ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"} border rounded-lg p-3`}>
                  <p className="text-sm text-gray-700">Saldo</p>
                  <p className={`font-bold ${(report.resumo?.balance || 0) >= 0 ? "text-blue-800" : "text-red-800"}`}>{fmt(report.resumo?.balance || 0)}</p>
                </div>
              </div>
              <table className="w-full text-sm text-gray-900">
                <thead><tr className="border-b bg-gray-50">
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">Data</th>
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">Descrição</th>
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">Categoria</th>
                  <th className="py-2 px-2 text-right font-semibold text-gray-800">Valor</th>
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">Status</th>
                </tr></thead>
                <tbody>
                  {report.data?.map((t: any) => (
                    <tr key={t.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 px-2 text-gray-800">{fmtDate(t.date)}</td>
                      <td className="py-2 px-2 font-medium text-gray-900">{t.description}</td>
                      <td className="py-2 px-2 text-gray-800">{t.category || "-"}</td>
                      <td className={`py-2 px-2 text-right font-medium ${t.type === "INCOME" ? "text-green-600" : "text-red-600"}`}>
                        {t.type === "INCOME" ? "+" : "-"}{fmt(t.amount)}
                      </td>
                      <td className="py-2 px-2 text-gray-800">{t.status === "PAID" ? "Pago" : "Pendente"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagamentos Recebidos */}
          {reportType === "pagamentos" && (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-bold">Total recebido: {fmt(report.total || 0)}</p>
                <p className="text-green-600 text-sm">{report.data?.length || 0} pagamentos no período</p>
              </div>
              <table className="w-full text-sm text-gray-900">
                <thead><tr className="border-b bg-gray-50">
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">Data Pgto</th>
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">Cliente</th>
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">CPF</th>
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">Parcela</th>
                  <th className="py-2 px-2 text-left font-semibold text-gray-800">Método</th>
                  <th className="py-2 px-2 text-right font-semibold text-gray-800">Valor</th>
                </tr></thead>
                <tbody>
                  {report.data?.map((p: any) => (
                    <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 px-2 text-gray-800">{p.paidAt ? fmtDate(p.paidAt) : "-"}</td>
                      <td className="py-2 px-2 font-medium text-gray-900">{p.carne?.client?.name}</td>
                      <td className="py-2 px-2 text-gray-800">{p.carne?.client?.cpf}</td>
                      <td className="py-2 px-2 text-gray-800">{p.installment}ª/{p.carne?.year}</td>
                      <td className="py-2 px-2 text-gray-800">{p.paymentMethod || "-"}</td>
                      <td className="py-2 px-2 text-right font-medium text-gray-900">{fmt(p.paidAmount || p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
