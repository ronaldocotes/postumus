// src/lib/carne-pdf-generator.ts
// Geração de carnê em PDF usando PDFKit

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require("pdfkit");
import { prisma } from "@/lib/prisma";

export async function generateCarnePDF(carneId: string): Promise<Buffer> {
  // Busca carnê com cliente e parcelas
  const carne = await prisma.carne.findUnique({
    where: { id: carneId },
    include: {
      client: true,
      installments: { orderBy: { numero: "asc" } },
    },
  });

  if (!carne) throw new Error("Carnê não encontrado");

  // Busca empresa ativa
  let company: any = null;
  try {
    company = await prisma.company.findFirst({ where: { active: true } });
  } catch (e) {
    // Company table might not exist
  }

  const client = carne.client;
  const installments = carne.installments;
  const empresaNome = company?.tradeName || company?.name || "Posthumous";
  const empresaCnpj = company?.cnpj || "";

  const fmtMoney = (v: number) =>
    "R$ " + v.toFixed(2).replace(".", ",");

  const fmtDate = (d: Date) => {
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
  };

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      info: {
        Title: `Carnê - ${client.name}`,
        Author: empresaNome,
      },
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc.fontSize(18).font("Helvetica-Bold").text(empresaNome, { align: "center" });
    if (empresaCnpj) {
      doc.fontSize(9).font("Helvetica").text(`CNPJ: ${empresaCnpj}`, { align: "center" });
    }
    doc.moveDown(0.5);
    doc.fontSize(14).font("Helvetica-Bold").text("CARNÊ DE PAGAMENTO", { align: "center" });
    doc.moveDown(1);

    // Info do cliente
    doc.fontSize(10).font("Helvetica-Bold").text("CLIENTE: ", { continued: true });
    doc.font("Helvetica").text(client.name);
    if (client.cpf) {
      doc.font("Helvetica-Bold").text("CPF: ", { continued: true });
      doc.font("Helvetica").text(client.cpf);
    }
    if (client.address) {
      doc.font("Helvetica-Bold").text("ENDEREÇO: ", { continued: true });
      doc.font("Helvetica").text(`${client.address || ""} - ${client.city || ""}`);
    }
    doc.font("Helvetica-Bold").text("ANO: ", { continued: true });
    doc.font("Helvetica").text(`${carne.year}`);
    doc.font("Helvetica-Bold").text("VALOR TOTAL: ", { continued: true });
    doc.font("Helvetica").text(fmtMoney(carne.totalValue));
    doc.font("Helvetica-Bold").text("PARCELAS: ", { continued: true });
    doc.font("Helvetica").text(`${installments.length}x de ${fmtMoney(installments[0]?.valor || 0)}`);
    doc.moveDown(1.5);

    // Linha separadora
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke("#cccccc");
    doc.moveDown(1);

    // Tabela de parcelas
    const tableTop = doc.y;
    const col1 = 40;
    const col2 = 120;
    const col3 = 250;
    const col4 = 370;
    const col5 = 470;

    // Header da tabela
    doc.fontSize(9).font("Helvetica-Bold");
    doc.text("PARCELA", col1, tableTop);
    doc.text("VENCIMENTO", col2, tableTop);
    doc.text("VALOR", col3, tableTop);
    doc.text("STATUS", col4, tableTop);
    doc.moveDown(0.5);

    // Linha abaixo do header
    const headerBottom = doc.y;
    doc.moveTo(40, headerBottom).lineTo(555, headerBottom).stroke("#e5e7eb");
    doc.moveDown(0.3);

    // Parcelas
    doc.font("Helvetica").fontSize(9);
    let y = doc.y;

    for (const inst of installments) {
      // Nova página se necessário
      if (y > 750) {
        doc.addPage();
        y = 40;
      }

      const status = inst.payment ? "PAGO" : inst.status === "LATE" ? "ATRASADO" : "PENDENTE";

      doc.text(`${String(inst.numero).padStart(2, "0")}/${String(installments.length).padStart(2, "0")}`, col1, y);
      doc.text(fmtDate(inst.dueDate), col2, y);
      doc.font("Helvetica-Bold").text(fmtMoney(inst.valor), col3, y);
      doc.font("Helvetica");

      // Status colorido
      if (status === "PAGO") {
        doc.fillColor("#16a34a").text(status, col4, y);
      } else if (status === "ATRASADO") {
        doc.fillColor("#dc2626").text(status, col4, y);
      } else {
        doc.fillColor("#d97706").text(status, col4, y);
      }
      doc.fillColor("#000000");

      y += 20;

      // Linha separadora
      doc.moveTo(40, y - 4).lineTo(555, y - 4).stroke("#f3f4f6");
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).fillColor("#6b7280").text(
      `Documento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
      40,
      undefined,
      { align: "center" }
    );
    doc.text(
      `${empresaNome} - Sistema de Gestão`,
      40,
      undefined,
      { align: "center" }
    );

    doc.end();
  });
}
