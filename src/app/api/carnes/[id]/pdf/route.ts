/**
 * API Route para gerar carnês em PDF
 * GET /api/carnes/[id]/pdf
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID do carnê é obrigatório" }, { status: 400 });
    }

    // Busca carnê com cliente e parcelas
    const carne = await prisma.carne.findUnique({
      where: { id },
      include: {
        client: true,
        installments: { orderBy: { numero: "asc" }, include: { payment: true } },
      },
    });

    if (!carne) {
      return NextResponse.json({ error: "Carnê não encontrado" }, { status: 404 });
    }

    // Busca empresa
    let company: any = null;
    try { company = await prisma.company.findFirst({ where: { active: true } }); } catch (e) {}

    // Gera PDF - Fix CWD for pdfkit font loading
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path");
    const originalCwd = process.cwd;
    process.cwd = () => "C:\\Users\\sdcot\\Postumus";
    
    const pdfkit = require("pdfkit");
    const PDFDocument = pdfkit.default || pdfkit;

    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: "A4", margin: 40 });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const pdfReady = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    const empresaNome = company?.tradeName || company?.name || "Posthumous";
    const client = carne.client;
    const installments = carne.installments;

    const fmtMoney = (v: number) => "R$ " + v.toFixed(2).replace(".", ",");
    const fmtDate = (d: Date) => {
      const dt = new Date(d);
      return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
    };

    // Header
    doc.fontSize(16).font("Helvetica-Bold").text(empresaNome, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(12).text("CARNÊ DE PAGAMENTO", { align: "center" });
    doc.moveDown(1);

    // Info do cliente
    doc.fontSize(10).font("Helvetica-Bold").text("Cliente: ", { continued: true });
    doc.font("Helvetica").text(client.name);
    doc.font("Helvetica-Bold").text("Ano: ", { continued: true });
    doc.font("Helvetica").text(`${carne.year} | ${installments.length}x de ${fmtMoney(installments[0]?.valor || 0)}`);
    doc.font("Helvetica-Bold").text("Total: ", { continued: true });
    doc.font("Helvetica").text(fmtMoney(carne.totalValue));
    doc.moveDown(1);

    // Linha
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke("#cccccc");
    doc.moveDown(0.8);

    // Tabela
    let y = doc.y;
    doc.fontSize(8).font("Helvetica-Bold");
    doc.text("PARCELA", 40, y);
    doc.text("VENCIMENTO", 130, y);
    doc.text("VALOR", 260, y);
    doc.text("STATUS", 380, y);
    y += 18;
    doc.moveTo(40, y - 4).lineTo(555, y - 4).stroke("#e0e0e0");

    doc.font("Helvetica").fontSize(9);
    for (const inst of installments) {
      if (y > 760) { doc.addPage(); y = 40; }
      const status = inst.payment ? "PAGO" : "PENDENTE";
      doc.fillColor("#111").text(`${String(inst.numero).padStart(2, "0")}/${installments.length}`, 40, y);
      doc.text(fmtDate(inst.dueDate), 130, y);
      doc.font("Helvetica-Bold").text(fmtMoney(inst.valor), 260, y).font("Helvetica");
      doc.fillColor(status === "PAGO" ? "#16a34a" : "#d97706").text(status, 380, y);
      doc.fillColor("#111");
      y += 20;
    }

    // Footer
    doc.fontSize(7).fillColor("#999").text(
      `Gerado em ${new Date().toLocaleDateString("pt-BR")} - ${empresaNome}`,
      40, 790, { align: "center" }
    );

    doc.end();
    process.cwd = originalCwd; // Restore original cwd

    const pdfBuffer = await pdfReady;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="carne_${client.name.replace(/\s+/g, "_")}_${carne.year}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error: any) {
    console.error("Erro ao gerar PDF:", error);
    return NextResponse.json(
      { error: "Erro ao gerar PDF", details: error.message },
      { status: 500 }
    );
  }
}
