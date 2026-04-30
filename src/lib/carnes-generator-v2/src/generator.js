// src/generator.js
// Orquestra a geração do PDF completo

const PDFDocument = require('pdfkit');
const fs          = require('fs');
const path        = require('path');

const { drawCobrador, drawCliente, COUPON_H, SPLIT } = require('./coupon');
const { cutLine, perfLine, mm }                       = require('./utils/draw');
const { gerarParcelas }                               = require('./utils/dates');
const palettes                                        = require('./palettes');

// Tamanho A4 em pontos (72dpi)
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN  = 10 * mm;
const GAP     = 5  * mm;

function generate(config) {
  // ── Resolve paleta ──────────────────────────────────────────────────────
  let pal;
  if (typeof config.paleta === 'string') {
    pal = palettes[config.paleta];
    if (!pal) throw new Error(`Paleta "${config.paleta}" não encontrada. Use: ${Object.keys(palettes).join(', ')}`);
  } else {
    pal = config.paleta; // objeto customizado
  }

  // ── Parcelas ────────────────────────────────────────────────────────────
  const parcelas  = gerarParcelas(config);
  const couponW   = PAGE_W - 2 * MARGIN;
  const perfX     = MARGIN + couponW * SPLIT;

  const perPage   = Math.floor((PAGE_H - 2 * MARGIN + GAP) / (COUPON_H + GAP));
  const totalPages = Math.ceil(config.nParcelas / perPage);

  // ── Documento ───────────────────────────────────────────────────────────
  const doc = new PDFDocument({
    size:    'A4',
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    info: {
      Title:   `Carnê – ${config.cliente}`,
      Author:  config.empresa,
      Subject: `Carnê de pagamento nº ${config.carneId}`,
    },
  });

  const outputPath = path.resolve(config.output);
  const stream     = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  let idx = 0;

  for (let pg = 0; pg < totalPages; pg++) {
    if (pg > 0) doc.addPage();

    // ── Cabeçalho de página ──────────────────────────────────────────────
    doc.save()
      .fontSize(6)
      .fillColor(pal.muted)
      .font('Helvetica')
      .text(
        `${config.empresa} · ${config.subtitulo}  |  CNPJ ${config.cnpj}  |  Carnê nº ${config.carneId}  —  ${config.cliente}`,
        MARGIN, PAGE_H - MARGIN + 3 * mm, { lineBreak: false }
      )
      .text(
        `Pág. ${pg + 1}/${totalPages}`,
        PAGE_W - MARGIN - 40, PAGE_H - MARGIN + 3 * mm, { lineBreak: false }
      )
      .strokeColor(pal.border).lineWidth(0.3)
      .moveTo(MARGIN, PAGE_H - MARGIN + 1.5 * mm)
      .lineTo(PAGE_W - MARGIN, PAGE_H - MARGIN + 1.5 * mm)
      .stroke()
      .restore();

    // ── Cupons da página ─────────────────────────────────────────────────
    let onPage = 0;

    while (idx < config.nParcelas && onPage < perPage) {
      const parcela = parcelas[idx];
      const yStart  = PAGE_H - MARGIN - (COUPON_H + GAP) * onPage - COUPON_H;

      // Via do cobrador
      drawCobrador(doc, MARGIN, yStart, couponW,
        parcela.num, config.nParcelas,
        parcela.ref, parcela.venc,
        config, pal);

      // Picote vertical
      perfLine(doc, perfX, yStart + 2 * mm, yStart + COUPON_H - 2 * mm, pal.perf);

      // Via do cliente
      drawCliente(doc, perfX, yStart, couponW,
        parcela.num, config.nParcelas,
        parcela.ref, parcela.venc,
        config, pal);

      // Linha de corte horizontal
      if (onPage < perPage - 1 && idx < config.nParcelas - 1) {
        cutLine(doc, MARGIN, yStart - GAP / 2, couponW, pal.perf);
      }

      idx++;
      onPage++;
    }
  }

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(outputPath));
    stream.on('error',  reject);
  });
}

module.exports = { generate };
