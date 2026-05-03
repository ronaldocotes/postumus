/**
 * API Route para gerar carnês em PDF com cupons coloridos
 * GET /api/carnes/[id]/pdf?paleta=azul&pendentesOnly=true
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PALETAS: Record<string, { dark: string; accent: string; light: string }> = {
  azul:  { dark: "#1e3a5f", accent: "#2563eb", light: "#dbeafe" },
  verde: { dark: "#14532d", accent: "#16a34a", light: "#dcfce7" },
  vinho: { dark: "#4a0e1a", accent: "#9b1c31", light: "#ffe4e6" },
  preto: { dark: "#111827", accent: "#b8960c", light: "#fef9c3" },
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(_.url);
    const paletaKey = url.searchParams.get("paleta") || "azul";
    const pendentesOnly = url.searchParams.get("pendentesOnly") === "true";
    const paleta = PALETAS[paletaKey] || PALETAS.azul;

    if (!id) {
      return NextResponse.json({ error: "ID do carnê é obrigatório" }, { status: 400 });
    }

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

    let company: any = null;
    try { company = await prisma.company.findFirst({ where: { active: true } }); } catch (e) {}

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path");
    const originalCwd = process.cwd;
    process.cwd = () => "C:\\Users\\sdcot\\Postumus";

    const pdfkit = require("pdfkit");
    const PDFDocument = pdfkit.default || pdfkit;

    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: "A4", margin: 30 });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const pdfReady = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    const empresaNome = company?.tradeName || company?.name || "Posthumous";
    const client = carne.client;
    const installments = pendentesOnly
      ? carne.installments.filter((i) => !i.payment)
      : carne.installments;

    const fmtMoney = (v: number) => "R$ " + v.toFixed(2).replace(".", ",");
    const fmtDate = (d: Date) => {
      const dt = new Date(d);
      return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
    };

    const [rD, gD, bD] = hexToRgb(paleta.dark);
    const [rA, gA, bA] = hexToRgb(paleta.accent);
    const [rL, gL, bL] = hexToRgb(paleta.light);

    const pageWidth = 595;
    const marginX = 30;
    const usableWidth = pageWidth - marginX * 2;
    const couponHeight = 90;
    const gapY = 8;

    let y = 30;

    // Header
    doc.fontSize(14).font("Helvetica-Bold").fillColor(paleta.dark).text(empresaNome, marginX, y, { align: "center", width: usableWidth });
    y += 20;
    doc.fontSize(10).font("Helvetica").fillColor("#666").text("CARNÊ DE PAGAMENTO", marginX, y, { align: "center", width: usableWidth });
    y += 18;
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#333").text(`Cliente: `, marginX, y, { continued: true });
    doc.font("Helvetica").text(`${client.name}  |  CPF: ${client.cpf || "-"}`);
    y += 14;
    doc.font("Helvetica-Bold").text(`Ano: `, marginX, y, { continued: true });
    doc.font("Helvetica").text(`${carne.year}  |  ${installments.length}x de ${fmtMoney(carne.installments[0]?.valor || 0)}  |  Total: ${fmtMoney(carne.totalValue)}`);
    y += 22;

    for (let idx = 0; idx < installments.length; idx++) {
      const inst = installments[idx];
      const parcNum = String(inst.numero).padStart(2, "0");
      const parcTotal = String(carne.installments.length).padStart(2, "0");

      // Quebra de página se necessário
      if (y + couponHeight > 800) {
        doc.addPage();
        y = 30;
      }

      // Linha de corte (exceto no primeiro)
      if (idx > 0) {
        doc.save();
        doc.moveTo(marginX + 20, y - gapY + 4).lineTo(usableWidth + marginX - 20, y - gapY + 4).dash(4, { space: 3 }).stroke("#999");
        doc.restore();
        doc.fontSize(7).fillColor("#999").text("✂ CORTE AQUI", marginX, y - gapY, { align: "center", width: usableWidth });
      }

      // === CONTAINER DO CUPOM ===
      const cx = marginX;
      const cy = y;
      const cw = usableWidth;
      const ch = couponHeight;

      // Borda externa
      doc.rect(cx, cy, cw, ch).lineWidth(0.5).stroke("#ccc");

      // === VIA COBRADOR (esquerda, 40%) ===
      const cobW = cw * 0.40;
      // Fundo claro
      doc.save();
      doc.rect(cx, cy, cobW, ch).fillColor(rL, gL, bL).fill();
      doc.restore();
      // Borda direita da via cobrador
      doc.moveTo(cx + cobW, cy).lineTo(cx + cobW, cy + ch).stroke("#ccc");

      // Header via cobrador
      doc.save();
      doc.rect(cx, cy, cobW, 18).fillColor(rD, gD, bD).fill();
      doc.restore();
      doc.fontSize(7).font("Helvetica-Bold").fillColor("#fff").text(empresaNome.toUpperCase(), cx + 4, cy + 5, { width: cobW - 8 });
      doc.fontSize(5).font("Helvetica").text("VIA COBRADOR", cx + cobW - 4, cy + 6, { align: "right", width: 50 });

      // Corpo via cobrador
      doc.fontSize(5).fillColor("#888").text("CLIENTE", cx + 4, cy + 24);
      doc.fontSize(8).font("Helvetica-Bold").fillColor(paleta.dark).text(client.name.split(" ").slice(0, 2).join(" "), cx + 4, cy + 32, { width: cobW - 40 });
      doc.fontSize(5).font("Helvetica").fillColor("#666").text(`Ref: ${fmtDate(inst.dueDate)}`, cx + 4, cy + 48);

      // Número da parcela grande
      doc.fontSize(22).font("Helvetica-Bold").fillColor(paleta.accent).text(`${parcNum}/${parcTotal}`, cx + cobW - 38, cy + 30, { width: 34, align: "right" });

      // === PERFORAÇÃO (centro, 3%) ===
      const perfX = cx + cobW;
      const perfW = cw * 0.03;
      doc.save();
      doc.rect(perfX, cy, perfW, ch).fillColor(0.97, 0.97, 0.97).fill();
      doc.restore();
      // Bolinhas de perfuração
      for (let b = 0; b < 6; b++) {
        const by = cy + 18 + b * 11;
        doc.circle(perfX + perfW / 2, by, 1.5).fillColor(rL, gL, bL).fill();
      }
      doc.moveTo(perfX + perfW, cy).lineTo(perfX + perfW, cy + ch).stroke("#ccc");

      // === VIA CLIENTE / RECIBO (direita, 57%) ===
      const cliX = perfX + perfW;
      const cliW = cw - cobW - perfW;
      // Header
      doc.save();
      doc.rect(cliX, cy, cliW, 18).fillColor(rD, gD, bD).fill();
      doc.restore();
      doc.fontSize(7).font("Helvetica-Bold").fillColor("#fff").text(empresaNome.toUpperCase(), cliX + 4, cy + 5, { width: cliW - 8 });
      doc.fontSize(5).font("Helvetica").text("VIA CLIENTE / RECIBO", cliX + cliW - 4, cy + 6, { align: "right", width: 70 });

      // Corpo via cliente - grid 2x2
      const col1 = cliX + 4;
      const col2 = cliX + cliW / 2 + 2;
      const row1 = cy + 24;
      const row2 = cy + 52;

      doc.fontSize(5).fillColor("#888").text("CLIENTE", col1, row1);
      doc.fontSize(7).font("Helvetica-Bold").fillColor("#111").text(client.name.split(" ")[0], col1, row1 + 8, { width: cliW / 2 - 8 });

      doc.fontSize(5).fillColor("#888").text("VENCIMENTO", col1, row2);
      doc.fontSize(7).font("Helvetica-Bold").fillColor("#111").text(fmtDate(inst.dueDate), col1, row2 + 8);

      doc.fontSize(5).fillColor("#888").text("PARCELA", col2, row1);
      doc.fontSize(14).font("Helvetica-Bold").fillColor(paleta.accent).text(`${parcNum}/${parcTotal}`, col2, row1 + 6);

      doc.fontSize(5).fillColor("#888").text("VALOR", col2, row2);
      doc.fontSize(9).font("Helvetica-Bold").fillColor(paleta.dark).text(fmtMoney(inst.valor), col2, row2 + 8);

      // Campo de assinatura
      doc.fontSize(5).fillColor("#888").text("_________________________________", col1, cy + ch - 14);
      doc.fontSize(4).fillColor("#888").text("ASSINATURA DO RECEBEDOR", col1, cy + ch - 8);

      y += couponHeight + gapY + (idx > 0 ? 4 : 0);
    }

    // Footer
    doc.fontSize(7).fillColor("#999").text(
      `Gerado em ${new Date().toLocaleDateString("pt-BR")} - ${empresaNome}`,
      marginX, 820, { align: "center", width: usableWidth }
    );

    doc.end();
    process.cwd = originalCwd;

    const pdfBuffer = await pdfReady;

    return new NextResponse(new Uint8Array(pdfBuffer), {
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
