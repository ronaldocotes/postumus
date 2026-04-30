/**
 * Orquestra a geração do PDF completo
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const { drawCobrador, drawCliente, COUPON_H, SPLIT } = require('./coupon');
const { cutLine, perfLine, mm } = require('./utils/draw');
const { gerarParcelas } = require('./utils/dates');
const palettes = require('./palettes');

// Tamanho A4 em pontos (72dpi)
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 10 * mm;
const GAP = 5 * mm;

function generate(config) {
  // ──────────────────────────────────────────────────────────────────────
  // Resolve paleta
  // ──────────────────────────────────────────────────────────────────────
  let pal;
  if (typeof config.paleta === 'string') {
    pal = palettes[config.paleta];
    if (!pal) {
      throw new Error(
        `Paleta "${config.paleta}" não encontrada. Use: ${Object.keys(palettes).join(', ')}`
      );
    }
  } else {
    pal = config.paleta; // objeto customizado
  }

  // ──────────────────────────────────────────────────────────────────────
  // Gera parcelas com datas
  // ──────────────────────────────────────────────────────────────────────
  const parcelas = gerarParcelas(config);
  const couponW = PAGE_W - 2 * MARGIN;
  const perfX = MARGIN + couponW * SPLIT + 7.5; // centro da linha picotada

  const pageContentHeight = PAGE_H - 2 * MARGIN - 10 * mm; // espaço disponível
  const perPage = Math.floor((pageContentHeight + GAP) / (COUPON_H + GAP));
  const totalPages = Math.ceil(config.nParcelas / perPage);

  // ──────────────────────────────────────────────────────────────────────
  // Cria documento PDF
  // ──────────────────────────────────────────────────────────────────────
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    info: {
      Title: `Carnê – ${config.cliente}`,
      Author: config.empresa,
      Subject: `Carnê de pagamento nº ${config.carneId}`,
      Creator: 'Posthumous - Sistema de Gestão',
    },
  });

  const outputPath = path.resolve(config.output);
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  let idx = 0;

  // ──────────────────────────────────────────────────────────────────────
  // Loop por páginas
  // ──────────────────────────────────────────────────────────────────────
  for (let pg = 0; pg < totalPages; pg++) {
    if (pg > 0) doc.addPage();

    // ────────────────────────────────────────────────────────────────────
    // CABEÇALHO DE PÁGINA
    // ────────────────────────────────────────────────────────────────────
    const headerY = 5;
    doc.save()
      .fontSize(6)
      .fillColor(pal.muted)
      .font('Helvetica')
      .text(
        `${config.empresa} • ${config.subtitulo} | CNPJ ${config.cnpj}`,
        MARGIN,
        headerY,
        { width: PAGE_W - 2 * MARGIN - 60, lineBreak: false }
      )
      .text(`Carnê ${config.carneId}`, PAGE_W - MARGIN - 80, headerY, {
        width: 75,
        align: 'right',
        lineBreak: false,
      })
      .strokeColor(pal.border)
      .lineWidth(0.4)
      .moveTo(MARGIN, headerY + 12)
      .lineTo(PAGE_W - MARGIN, headerY + 12)
      .stroke()
      .restore();

    // ────────────────────────────────────────────────────────────────────
    // CUPONS DA PÁGINA
    // ────────────────────────────────────────────────────────────────────
    let onPage = 0;
    let yPos = headerY + 18;

    while (idx < config.nParcelas && onPage < perPage) {
      const parcela = parcelas[idx];
      const xStart = MARGIN;

      // Desenha via cobrador (esquerda)
      drawCobrador(doc, xStart, yPos, couponW, parcela, config, pal);

      // Desenha linha perfurada vertical
      perfLine(doc, perfX, yPos, yPos + COUPON_H, pal.perf);

      // Desenha via cliente (direita)
      const clienteX = xStart + couponW * SPLIT + 15;
      drawCliente(doc, clienteX, yPos, couponW, parcela, config, pal);

      yPos += COUPON_H + GAP;
      onPage++;
      idx++;

      // Desenha linha de corte entre cupons
      if (idx < config.nParcelas && onPage < perPage) {
        cutLine(doc, MARGIN, yPos - GAP / 2, couponW, pal.border);
      }
    }

    // ────────────────────────────────────────────────────────────────────
    // RODAPÉ
    // ────────────────────────────────────────────────────────────────────
    const footerY = PAGE_H - MARGIN - 12;
    doc.save()
      .fontSize(6.5)
      .fillColor(pal.muted)
      .font('Helvetica')
      .text(
        `Pág. ${pg + 1}/${totalPages} | Total: ${config.total} • Parcelas: ${config.nParcelas}x ${config.valorParcela}`,
        MARGIN,
        footerY
      )
      .restore();
  }

  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      console.log('\n✓ PDF gerado com sucesso!');
      console.log(`📁 Arquivo: ${outputPath}`);
      console.log(`\n📊 Detalhes:`);
      console.log(`   • ${config.nParcelas} parcelas`);
      console.log(`   • Total: ${config.total}`);
      console.log(`   • Valor parcela: ${config.valorParcela}`);
      console.log(`   • Cliente: ${config.cliente}`);
      console.log(`   • CPF: ${config.cpf}`);
      console.log(`   • Carnê nº: ${config.carneId}\n`);
      resolve();
      process.exit(0);
    });

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      reject(err);
    });
    
    doc.on('error', (err) => {
      console.error('Doc error:', err);
      reject(err);
    });
  });
}

module.exports = { generate };
