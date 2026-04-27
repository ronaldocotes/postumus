import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface PDFReportData {
  title: string;
  headers: string[];
  data: (string | number)[][];
  summary?: { label: string; value: string; color?: string }[];
  filename?: string;
  period?: string;
}

export function generateAndDownloadPDF(reportData: PDFReportData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // ===== CABEÇALHO COM LOGO E TÍTULO =====
  // Fundo branco
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 50, "F");

  // Logo (círculo azul com ícone de flor de lótus estilizada)
  doc.setFillColor(74, 111, 165);
  doc.circle(margin + 8, 20, 10, "F");
  
  // Desenhar uma flor de lótus simplificada no centro
  doc.setFillColor(255, 255, 255);
  // Pétalas superiores
  doc.ellipse(margin + 8, 16, 2, 3, "F");
  doc.ellipse(margin + 5, 18, 2, 2.5, "F");
  doc.ellipse(margin + 11, 18, 2, 2.5, "F");
  // Centro da flor
  doc.setFillColor(212, 228, 247);
  doc.circle(margin + 8, 20, 2, "F");

  // Nome da empresa ao lado do logo
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Posthumous", margin + 20, 17);

  doc.setTextColor(107, 114, 128);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Gestão de Serviços Póstumos", margin + 20, 23);

  // Título do relatório e data à direita
  const today = new Date().toLocaleDateString("pt-BR");
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(reportData.title, pageWidth - margin, 17, { align: "right" });

  doc.setTextColor(107, 114, 128);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Emitido em: ${today}`, pageWidth - margin, 23, { align: "right" });

  // Linha separadora
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, 35, pageWidth - margin, 35);

  // ===== CARDS DE RESUMO =====
  let startY = 45;
  if (reportData.summary && reportData.summary.length > 0) {
    const cardWidth = (pageWidth - margin * 2 - (reportData.summary.length - 1) * 4) / reportData.summary.length;
    const cardHeight = 22;

    reportData.summary.forEach((item, index) => {
      const xPos = margin + index * (cardWidth + 4);
      
      // Definir cor do card baseado no label
      let bgColor: [number, number, number];
      let textColor: [number, number, number];
      
      if (item.label.toLowerCase().includes("receita") || item.label.toLowerCase().includes("total recebido")) {
        bgColor = [220, 252, 231]; // Verde claro
        textColor = [22, 101, 52];
      } else if (item.label.toLowerCase().includes("despesa")) {
        bgColor = [254, 226, 226]; // Vermelho claro
        textColor = [153, 27, 27];
      } else if (item.label.toLowerCase().includes("saldo")) {
        bgColor = [239, 246, 255]; // Azul claro
        textColor = [30, 64, 175];
      } else if (item.label.toLowerCase().includes("inadimplente") || item.label.toLowerCase().includes("atraso")) {
        bgColor = [254, 242, 242]; // Vermelho muito claro
        textColor = [185, 28, 28];
      } else {
        bgColor = [248, 250, 252]; // Cinza claro
        textColor = [71, 85, 105];
      }

      // Card com borda arredondada
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      doc.roundedRect(xPos, startY, cardWidth, cardHeight, 2, 2, "F");

      // Label
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(item.label, xPos + 4, startY + 7);

      // Valor
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(item.value, xPos + 4, startY + 16);
    });

    startY += cardHeight + 8;
  }

  // ===== TABELA DE DADOS =====
  if (reportData.data.length > 0) {
    autoTable(doc, {
      head: [reportData.headers],
      body: reportData.data,
      startY: startY,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        font: "helvetica",
        textColor: 55,
        lineColor: [229, 231, 235],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [249, 250, 251],
        textColor: 55,
        fontStyle: "bold",
        halign: "left",
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255],
      },
      rowStyles: {
        0: { fillColor: [255, 255, 255] },
      },
      didDrawPage: (data) => {
        // Rodapé em cada página
        const pageCount = doc.getNumberOfPages();
        const currentPage = data.pageNumber;

        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(
          `Página ${currentPage} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );

        doc.text(
          "Posthumous - Sistema de Gestão",
          margin,
          doc.internal.pageSize.getHeight() - 10
        );
      },
    });
  } else {
    // Mensagem quando não há dados
    doc.setFontSize(11);
    doc.setTextColor(156, 163, 175);
    doc.text("Nenhum dado encontrado para este relatório.", margin, startY + 15);
  }

  // Download do PDF
  const filename = reportData.filename || `relatorio-${Date.now()}.pdf`;
  doc.save(filename);

  return true;
}

// Funções específicas para cada tipo de relatório
export function generateClientesPDF(data: any[]) {
  return generateAndDownloadPDF({
    title: "Relatório de Clientes Ativos",
    headers: ["Nome", "CPF", "Telefone", "Cidade", "Bairro"],
    data: data.map((c) => [
      c.name,
      c.cpf || "-",
      c.cellphone || c.phone || "-",
      c.city || "-",
      c.neighborhood || "-",
    ]),
    summary: [
      { label: "Total de Clientes", value: String(data.length) },
      { label: "Com Carnê", value: String(data.filter((c) => c.hasCarne).length || 0) },
    ],
    filename: `clientes-${new Date().toISOString().split("T")[0]}.pdf`,
  });
}

export function generateInadimplentesPDF(data: any[], totalGeral: number) {
  const rows: (string | number)[][] = [];

  data.forEach((item) => {
    rows.push([item.client.name, item.client.cpf || "-", "", "", fmt(item.totalOverdue)]);
    item.payments.forEach((p: any) => {
      rows.push([
        `  ↳ Parcela ${p.installment}/${p.year}`,
        "",
        new Date(p.dueDate).toLocaleDateString("pt-BR"),
        fmt(p.amount),
        "",
      ]);
    });
    rows.push(["", "", "", "", ""]);
  });

  return generateAndDownloadPDF({
    title: "Relatório de Inadimplentes",
    headers: ["Cliente / Parcela", "CPF", "Vencimento", "Valor", "Total"],
    data: rows,
    summary: [
      { label: "Clientes em Atraso", value: String(data.length) },
      { label: "Total Devido", value: fmt(totalGeral) },
    ],
    filename: `inadimplentes-${new Date().toISOString().split("T")[0]}.pdf`,
  });
}

export function generateFinanceiroPDF(data: any[], resumo: any) {
  return generateAndDownloadPDF({
    title: "Relatório Financeiro Mensal",
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
    filename: `financeiro-${new Date().toISOString().split("T")[0]}.pdf`,
  });
}

export function generateContribuintesPDF(data: any[], total: number) {
  return generateAndDownloadPDF({
    title: "Relatório de Contribuintes (Carnê)",
    headers: ["Código", "Nome", "Telefone", "Bairro", "Venc.", "Dependentes", "Pendente"],
    data: data.map((c) => [
      c.code || "-",
      c.name,
      c.cellphone || c.phone || "-",
      c.neighborhood || "-",
      `Dia ${c.dueDay || "-"}`,
      String(c.totalDependents || 0),
      c.pendingAmount > 0 ? fmt(c.pendingAmount) : "Em dia",
    ]),
    summary: [
      { label: "Total Contribuintes", value: String(total || data.length) },
      { label: "Inadimplentes", value: String(data.filter((c) => c.pendingAmount > 0).length) },
    ],
    filename: `contribuintes-${new Date().toISOString().split("T")[0]}.pdf`,
  });
}

export function generateFornecedoresPDF(data: any[]) {
  return generateAndDownloadPDF({
    title: "Relatório de Fornecedores",
    headers: ["Nome", "CNPJ", "Telefone", "Contato", "Email"],
    data: data.map((s) => [
      s.name,
      s.cnpj || "-",
      s.phone || "-",
      s.contactName || "-",
      s.email || "-",
    ]),
    summary: [{ label: "Total Fornecedores", value: String(data.length) }],
    filename: `fornecedores-${new Date().toISOString().split("T")[0]}.pdf`,
  });
}

export function generateMercadoriasPDF(data: any[]) {
  const lowStock = data.filter((p) => p.stock < 5).length;

  return generateAndDownloadPDF({
    title: "Relatório de Mercadorias",
    headers: ["Nome", "SKU", "Preço", "Custo", "Estoque", "Fornecedor"],
    data: data.map((p) => [
      p.name,
      p.sku || "-",
      fmt(p.price),
      p.cost ? fmt(p.cost) : "-",
      String(p.stock),
      p.supplier?.name || "-",
    ]),
    summary: [
      { label: "Total Produtos", value: String(data.length) },
      { label: "Estoque Baixo", value: String(lowStock) },
    ],
    filename: `mercadorias-${new Date().toISOString().split("T")[0]}.pdf`,
  });
}

export function generatePagamentosPDF(data: any[], total: number) {
  return generateAndDownloadPDF({
    title: "Relatório de Pagamentos Recebidos",
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
    filename: `pagamentos-${new Date().toISOString().split("T")[0]}.pdf`,
  });
}

export function generateServicosPDF(data: any[], totalGeral: number, totalVendas: number) {
  const rows: (string | number)[][] = [];

  data.forEach((item) => {
    rows.push([item.service.name, "", "", String(item.totalQty), fmt(item.totalRevenue)]);
    item.sales.forEach((s: any) => {
      rows.push([
        `  ↳ ${new Date(s.date).toLocaleDateString("pt-BR")}`,
        s.client,
        String(s.quantity),
        fmt(s.totalPrice),
        s.status === "PAID" ? "Pago" : "Pendente",
      ]);
    });
    rows.push(["", "", "", "", ""]);
  });

  return generateAndDownloadPDF({
    title: "Relatório de Vendas de Serviços",
    headers: ["Serviço / Data", "Cliente", "Qtd", "Valor", "Status"],
    data: rows,
    summary: [
      { label: "Total Vendas", value: String(totalVendas || 0) },
      { label: "Faturamento", value: fmt(totalGeral || 0) },
    ],
    filename: `servicos-${new Date().toISOString().split("T")[0]}.pdf`,
  });
}

export function generateCompradoresPDF(data: any[], totalGeral: number) {
  const rows: (string | number)[][] = [];

  data.forEach((item) => {
    rows.push([item.client.name, item.client.cpf || "-", "", "", fmt(item.totalSpent)]);
    item.purchases.forEach((p: any) => {
      rows.push([
        `  ↳ ${new Date(p.date).toLocaleDateString("pt-BR")}`,
        "",
        p.description,
        "",
        fmt(p.amount),
      ]);
    });
    rows.push(["", "", "", "", ""]);
  });

  return generateAndDownloadPDF({
    title: "Relatório de Compradores de Mercadoria",
    headers: ["Cliente / Data", "CPF", "Descrição", "", "Valor"],
    data: rows,
    summary: [
      { label: "Total Compradores", value: String(data.length) },
      { label: "Total Vendido", value: fmt(totalGeral || 0) },
    ],
    filename: `compradores-${new Date().toISOString().split("T")[0]}.pdf`,
  });
}
