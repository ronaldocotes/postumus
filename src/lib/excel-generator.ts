import * as XLSX from "xlsx";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);

interface ExcelReportData {
  title: string;
  headers: string[];
  data: (string | number)[][];
  summary?: { label: string; value: string }[];
  filename?: string;
  sheetName?: string;
}

function generateAndDownloadExcel(reportData: ExcelReportData) {
  // Criar workbook
  const wb = XLSX.utils.book_new();

  // Dados do resumo (se houver)
  const summaryRows: (string | number)[][] = [];
  if (reportData.summary && reportData.summary.length > 0) {
    summaryRows.push(["RESUMO"], [""]);
    reportData.summary.forEach((item) => {
      summaryRows.push([item.label, item.value]);
    });
    summaryRows.push([""], [""]);
  }

  // Dados principais
  const mainData = [reportData.headers, ...reportData.data];

  // Combinar tudo
  const allData = [...summaryRows, ...mainData];

  // Criar worksheet
  const ws = XLSX.utils.aoa_to_sheet(allData);

  // Configurar larguras das colunas
  const colWidths = reportData.headers.map(() => ({ wch: 20 }));
  ws["!cols"] = colWidths;

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(
    wb,
    ws,
    reportData.sheetName || "Relatório"
  );

  // Gerar arquivo e fazer download
  const filename = reportData.filename || `relatorio-${Date.now()}.xlsx`;
  XLSX.writeFile(wb, filename);

  return true;
}

// Funções específicas para cada tipo de relatório
export function generateClientesExcel(data: any[]) {
  return generateAndDownloadExcel({
    title: "Clientes Ativos",
    headers: ["Nome", "CPF", "Telefone", "Cidade", "Bairro", "Email"],
    data: data.map((c) => [
      c.name,
      c.cpf || "-",
      c.cellphone || c.phone || "-",
      c.city || "-",
      c.neighborhood || "-",
      c.email || "-",
    ]),
    summary: [
      { label: "Total de Clientes", value: String(data.length) },
      {
        label: "Com Carnê",
        value: String(data.filter((c) => c.hasCarne).length || 0),
      },
    ],
    filename: `clientes-${new Date().toISOString().split("T")[0]}.xlsx`,
    sheetName: "Clientes",
  });
}

export function generateInadimplentesExcel(data: any[], totalGeral: number) {
  const rows: (string | number)[][] = [];

  data.forEach((item) => {
    rows.push([item.client.name, item.client.cpf || "-", "", "", "", ""]);
    rows.push([
      "",
      "Parcela",
      "Ano",
      "Vencimento",
      "Valor",
      "Total Cliente",
    ]);
    item.payments.forEach((p: any) => {
      rows.push([
        "",
        `${p.installment}ª`,
        p.year,
        new Date(p.dueDate).toLocaleDateString("pt-BR"),
        fmt(p.amount),
        "",
      ]);
    });
    rows.push(["", "", "", "", "", fmt(item.totalOverdue)]);
    rows.push(["", "", "", "", "", ""]);
  });

  return generateAndDownloadExcel({
    title: "Inadimplentes",
    headers: ["Cliente", "CPF", "", "", "", ""],
    data: rows,
    summary: [
      { label: "Clientes em Atraso", value: String(data.length) },
      { label: "Total Devido", value: fmt(totalGeral) },
    ],
    filename: `inadimplentes-${new Date().toISOString().split("T")[0]}.xlsx`,
    sheetName: "Inadimplentes",
  });
}

export function generateFinanceiroExcel(data: any[], resumo: any) {
  return generateAndDownloadExcel({
    title: "Financeiro Mensal",
    headers: ["Data", "Descrição", "Categoria", "Tipo", "Valor"],
    data: data.map((t) => [
      new Date(t.date).toLocaleDateString("pt-BR"),
      t.description,
      t.category || "-",
      t.type === "INCOME" ? "Receita" : "Despesa",
      fmt(t.amount),
    ]),
    summary: [
      { label: "Receitas", value: fmt(resumo?.income || 0) },
      { label: "Despesas", value: fmt(resumo?.expense || 0) },
      { label: "Saldo", value: fmt(resumo?.balance || 0) },
    ],
    filename: `financeiro-${new Date().toISOString().split("T")[0]}.xlsx`,
    sheetName: "Financeiro",
  });
}

export function generateContribuintesExcel(data: any[], total: number) {
  return generateAndDownloadExcel({
    title: "Contribuintes (Carnê)",
    headers: [
      "Código",
      "Nome",
      "CPF",
      "Telefone",
      "Bairro",
      "Vencimento",
      "Dependentes",
      "Pendente",
    ],
    data: data.map((c) => [
      c.code || "-",
      c.name,
      c.cpf || "-",
      c.cellphone || c.phone || "-",
      c.neighborhood || "-",
      `Dia ${c.dueDay || "-"}`,
      c.totalDependents || 0,
      c.pendingAmount > 0 ? fmt(c.pendingAmount) : "Em dia",
    ]),
    summary: [
      { label: "Total Contribuintes", value: String(total || data.length) },
      {
        label: "Inadimplentes",
        value: String(data.filter((c) => c.pendingAmount > 0).length),
      },
    ],
    filename: `contribuintes-${new Date().toISOString().split("T")[0]}.xlsx`,
    sheetName: "Contribuintes",
  });
}

export function generateFornecedoresExcel(data: any[]) {
  return generateAndDownloadExcel({
    title: "Fornecedores",
    headers: ["Nome", "CNPJ", "Telefone", "Contato", "Email", "Endereço"],
    data: data.map((s) => [
      s.name,
      s.cnpj || "-",
      s.phone || "-",
      s.contactName || "-",
      s.email || "-",
      s.address || "-",
    ]),
    summary: [{ label: "Total Fornecedores", value: String(data.length) }],
    filename: `fornecedores-${new Date().toISOString().split("T")[0]}.xlsx`,
    sheetName: "Fornecedores",
  });
}

export function generateMercadoriasExcel(data: any[]) {
  const lowStock = data.filter((p) => p.stock < 5).length;

  return generateAndDownloadExcel({
    title: "Mercadorias",
    headers: ["Nome", "SKU", "Preço", "Custo", "Estoque", "Fornecedor"],
    data: data.map((p) => [
      p.name,
      p.sku || "-",
      fmt(p.price),
      p.cost ? fmt(p.cost) : "-",
      p.stock,
      p.supplier?.name || "-",
    ]),
    summary: [
      { label: "Total Produtos", value: String(data.length) },
      { label: "Estoque Baixo", value: String(lowStock) },
    ],
    filename: `mercadorias-${new Date().toISOString().split("T")[0]}.xlsx`,
    sheetName: "Mercadorias",
  });
}

export function generatePagamentosExcel(data: any[], total: number) {
  return generateAndDownloadExcel({
    title: "Pagamentos Recebidos",
    headers: ["Data", "Cliente", "CPF", "Parcela", "Método", "Valor"],
    data: data.map((p) => [
      p.paidAt ? new Date(p.paidAt).toLocaleDateString("pt-BR") : "-",
      p.carne?.client?.name || "-",
      p.carne?.client?.cpf || "-",
      `${p.installment}ª/${p.carne?.year || "-"}`,
      p.paymentMethod || "-",
      fmt(p.paidAmount || p.amount),
    ]),
    summary: [
      { label: "Total Recebido", value: fmt(total || 0) },
      { label: "Pagamentos", value: String(data.length) },
    ],
    filename: `pagamentos-${new Date().toISOString().split("T")[0]}.xlsx`,
    sheetName: "Pagamentos",
  });
}

export function generateServicosExcel(
  data: any[],
  totalGeral: number,
  totalVendas: number
) {
  const rows: (string | number)[][] = [];

  data.forEach((item) => {
    rows.push([
      item.service.name,
      "",
      "",
      item.totalQty,
      fmt(item.totalRevenue),
    ]);
    item.sales.forEach((s: any) => {
      rows.push([
        "",
        new Date(s.date).toLocaleDateString("pt-BR"),
        s.client,
        s.quantity,
        fmt(s.totalPrice),
        s.status === "PAID" ? "Pago" : "Pendente",
      ]);
    });
    rows.push(["", "", "", "", ""]);
  });

  return generateAndDownloadExcel({
    title: "Vendas de Serviços",
    headers: ["Serviço", "Data", "Cliente", "Qtd", "Valor", "Status"],
    data: rows,
    summary: [
      { label: "Total Vendas", value: String(totalVendas || 0) },
      { label: "Faturamento", value: fmt(totalGeral || 0) },
    ],
    filename: `servicos-${new Date().toISOString().split("T")[0]}.xlsx`,
    sheetName: "Serviços",
  });
}

export function generateCompradoresExcel(data: any[], totalGeral: number) {
  const rows: (string | number)[][] = [];

  data.forEach((item) => {
    rows.push([item.client.name, item.client.cpf || "-", "", "", ""]);
    item.purchases.forEach((p: any) => {
      rows.push([
        "",
        new Date(p.date).toLocaleDateString("pt-BR"),
        p.description,
        "",
        fmt(p.amount),
      ]);
    });
    rows.push(["", "", "", "Total:", fmt(item.totalSpent)]);
    rows.push(["", "", "", "", ""]);
  });

  return generateAndDownloadExcel({
    title: "Compradores de Mercadoria",
    headers: ["Cliente", "CPF", "Data", "Descrição", "Valor"],
    data: rows,
    summary: [
      { label: "Total Compradores", value: String(data.length) },
      { label: "Total Vendido", value: fmt(totalGeral || 0) },
    ],
    filename: `compradores-${new Date().toISOString().split("T")[0]}.xlsx`,
    sheetName: "Compradores",
  });
}
