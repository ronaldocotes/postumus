#!/usr/bin/env node
/**
 * Gerador de Carnês de Pagamento em PDF
 * Especificações: 4 cupons por página A4, 2 vias (cobrador e cliente)
 * 
 * Instalar dependências: npm install pdfkit
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ───────────────────────────────────────────────────────────────────────────────
// CONFIGURAÇÃO DE DADOS
// ───────────────────────────────────────────────────────────────────────────────

const CONFIG = {
  empresa: "Posthumous",
  subtitulo: "Gestão de Serviços Póstumos",
  cliente: "Ana Costa",
  cpf: "123.456.789-00",
  total: 3050.00,
  parcelas: 12,
  carneId: "2026-4567",
};

// Paleta de cores - Azul Corporativo (conforme HTML)
const PALETA = {
  dark: "#1e3a5f",
  accent: "#2563eb",
  light: "#dbeafe",
  xlight: "#eff6ff",
  text: "#1e293b",
  label: "#93c5fd",
  border: "#bfdbfe",
  perf: "#60a5fa",
};

// ───────────────────────────────────────────────────────────────────────────────
// CLASSE GERADOR
// ───────────────────────────────────────────────────────────────────────────────

class CarneGenerator {
  constructor(outputPath) {
    this.outputPath = outputPath;
    this.doc = new PDFDocument({
      size: 'A4',
      margin: 10,
      bufferPages: true,
    });
    this.pageWidth = this.doc.page.width;
    this.pageHeight = this.doc.page.height;
    this.margin = 10;
    this.cupomHeight = 185.5; // ~65.5mm em pt
    this.cupomWidth = this.pageWidth - (2 * this.margin);
    this.valorParcela = CONFIG.total / CONFIG.parcelas;
    this.dataBase = new Date(2026, 8, 1); // Setembro (mês 8)
  }

  /**
   * Formata número para formato monetário brasileiro
   */
  formatMoney(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  /**
   * Calcula data de vencimento para a parcela
   */
  getDataVencimento(numeroParcela) {
    const data = new Date(this.dataBase);
    data.setMonth(data.getMonth() + (numeroParcela - 1));
    return data.toLocaleDateString('pt-BR');
  }

  /**
   * Desenha um cupom com 2 vias
   */
  drawCupom(yPos, numeroParcela) {
    const xStart = this.margin;
    const cupomWidth = this.cupomWidth;
    const cupomHeight = this.cupomHeight;

    // Dados da parcela
    const dataRef = `${String(numeroParcela).padStart(2, '0')}/2026`;
    const dataVenc = this.getDataVencimento(numeroParcela);

    // ────────────────────────────────────────────────────────────────────
    // VIA COBRADOR (esquerda - 38%)
    // ────────────────────────────────────────────────────────────────────
    const viaCobradorWidth = cupomWidth * 0.38;

    // Fundo claro
    this.doc.rect(xStart, yPos, viaCobradorWidth, cupomHeight)
      .fillAndStroke(PALETA.light, PALETA.border);

    // Barra superior escura
    const barraHeight = 20;
    this.doc.rect(xStart, yPos + cupomHeight - barraHeight, viaCobradorWidth, barraHeight)
      .fill(PALETA.dark);

    // Texto barra
    this.doc.fontSize(7).fillColor('white').font('Helvetica-Bold');
    this.doc.text(CONFIG.empresa, xStart + 8, yPos + cupomHeight - barraHeight + 4, {
      width: viaCobradorWidth - 16,
      align: 'left',
    });

    this.doc.fontSize(6).text('VIA COBRADOR', xStart + 8, yPos + cupomHeight - barraHeight + 10, {
      width: viaCobradorWidth - 16,
      align: 'right',
    });

    // Conteúdo via cobrador
    let yContent = yPos + cupomHeight - barraHeight - 10;

    this.doc.fontSize(5).fillColor(PALETA.accent).font('Helvetica-Bold');
    this.doc.text('CLIENTE', xStart + 8, yContent);

    this.doc.fontSize(6).fillColor(PALETA.text).font('Helvetica');
    this.doc.text(CONFIG.cliente, xStart + 8, yContent + 8);

    yContent -= 25;

    this.doc.fontSize(5).fillColor(PALETA.accent).font('Helvetica-Bold');
    this.doc.text('REF.', xStart + 8, yContent);

    this.doc.fontSize(6).fillColor(PALETA.text).font('Helvetica');
    this.doc.text(dataRef, xStart + 8, yContent + 8);

    this.doc.fontSize(5).fillColor(PALETA.accent).font('Helvetica-Bold');
    this.doc.text('VENC.', xStart + 8, yContent + 20);

    this.doc.fontSize(6).fillColor(PALETA.text).font('Helvetica');
    this.doc.text(dataVenc, xStart + 8, yContent + 28);

    // Número da parcela (grande)
    this.doc.fontSize(16).fillColor(PALETA.accent).font('Helvetica-Bold');
    const parcelaText = `${String(numeroParcela).padStart(2, '0')}/${String(CONFIG.parcelas).padStart(2, '0')}`;
    this.doc.text(
      parcelaText,
      xStart + 8,
      yPos + 10,
      { width: viaCobradorWidth - 16, align: 'right' }
    );

    // ────────────────────────────────────────────────────────────────────
    // LINHA PERFURADA (vertical)
    // ────────────────────────────────────────────────────────────────────
    const perfX = xStart + viaCobradorWidth + 7;
    this.doc.strokeColor(PALETA.perf).lineWidth(0.5);

    const dashHeight = 5;
    const dashGap = 4;
    for (let y = yPos; y < yPos + cupomHeight; y += dashHeight + dashGap) {
      this.doc.moveTo(perfX, y).lineTo(perfX, Math.min(y + dashHeight, yPos + cupomHeight)).stroke();
    }

    // ────────────────────────────────────────────────────────────────────
    // VIA CLIENTE (direita - 62%)
    // ────────────────────────────────────────────────────────────────────
    const viaClienteX = xStart + viaCobradorWidth + 15;
    const viaClienteWidth = cupomWidth - viaCobradorWidth - 15;

    // Fundo e borda
    this.doc.rect(viaClienteX, yPos, viaClienteWidth, cupomHeight)
      .fillAndStroke('white', PALETA.border);

    // Barra superior
    this.doc.rect(viaClienteX, yPos + cupomHeight - barraHeight, viaClienteWidth, barraHeight)
      .fill(PALETA.dark);

    // Texto barra
    this.doc.fontSize(7).fillColor('white').font('Helvetica-Bold');
    this.doc.text(CONFIG.empresa, viaClienteX + 8, yPos + cupomHeight - barraHeight + 4, {
      width: viaClienteWidth - 16,
      align: 'left',
    });

    this.doc.fontSize(6).text('VIA CLIENTE/RECIBO', viaClienteX + 8, yPos + cupomHeight - barraHeight + 10, {
      width: viaClienteWidth - 16,
      align: 'right',
    });

    // Conteúdo em 2 colunas
    const colWidth = (viaClienteWidth - 14) / 2;
    const col1X = viaClienteX + 8;
    const col2X = viaClienteX + colWidth + 8;

    yContent = yPos + cupomHeight - barraHeight - 10;

    // Coluna 1
    this.doc.fontSize(5).fillColor('#64748b').font('Helvetica-Bold');
    this.doc.text('CLIENTE', col1X, yContent);

    this.doc.fontSize(6).fillColor(PALETA.text).font('Helvetica');
    this.doc.text(CONFIG.cliente, col1X, yContent + 8, { width: colWidth });

    yContent -= 25;

    this.doc.fontSize(5).fillColor('#64748b').font('Helvetica-Bold');
    this.doc.text('REFERÊNCIA', col1X, yContent);

    this.doc.fontSize(6).fillColor(PALETA.text).font('Helvetica');
    this.doc.text(dataRef, col1X, yContent + 8, { width: colWidth });

    yContent -= 25;

    this.doc.fontSize(5).fillColor('#64748b').font('Helvetica-Bold');
    this.doc.text('VENCIMENTO', col1X, yContent);

    this.doc.fontSize(6).fillColor(PALETA.text).font('Helvetica');
    this.doc.text(dataVenc, col1X, yContent + 8, { width: colWidth });

    // Coluna 2
    yContent = yPos + cupomHeight - barraHeight - 10;

    this.doc.fontSize(5).fillColor('#64748b').font('Helvetica-Bold');
    this.doc.text('PARCELA', col2X, yContent);

    this.doc.fontSize(12).fillColor(PALETA.accent).font('Helvetica-Bold');
    this.doc.text(parcelaText, col2X, yContent + 8, { width: colWidth, align: 'left' });

    yContent -= 25;

    this.doc.fontSize(5).fillColor('#64748b').font('Helvetica-Bold');
    this.doc.text('VALOR', col2X, yContent);

    this.doc.fontSize(10).fillColor(PALETA.dark).font('Helvetica-Bold');
    this.doc.text(this.formatMoney(this.valorParcela), col2X, yContent + 8, {
      width: colWidth,
      align: 'left',
    });

    // Badge de status
    yContent -= 20;
    this.doc.rect(col2X, yContent - 8, 45, 10).fill('#fef3c7');

    this.doc.fontSize(5).fillColor('#b45309').font('Helvetica-Bold');
    this.doc.text('PENDENTE', col2X + 2, yContent - 6, { width: 41, align: 'center' });
  }

  /**
   * Desenha linha de corte entre cupons
   */
  drawLinhaCortе(yPos) {
    this.doc.strokeColor('#cbd5e1').lineWidth(0.5);
    this.doc.dash(2, { space: 2 });

    const xStart = this.margin;
    const xEnd = this.pageWidth - this.margin;
    const midX = this.pageWidth / 2;

    // Linhas perfuradas
    this.doc.moveTo(xStart, yPos).lineTo(midX - 15, yPos).stroke();
    this.doc.moveTo(midX + 15, yPos).lineTo(xEnd, yPos).stroke();

    // Ícone de tesoura
    this.doc.undash();
    this.doc.fontSize(10).fillColor('#cbd5e1').font('Helvetica');
    this.doc.text('✂', midX - 8, yPos - 8, { width: 16, align: 'center' });
  }

  /**
   * Gera o PDF
   */
  generate() {
    console.log('📄 Gerando carnê de pagamento...\n');

    let cupomAtual = 1;
    let yPos = this.pageHeight - this.margin - this.cupomHeight;
    const cuponsPerPage = 4;

    // Itera por todas as parcelas
    for (let i = 0; i < CONFIG.parcelas; i++) {
      // Desenha cupom
      this.drawCupom(yPos, cupomAtual);

      // Próxima posição
      yPos -= this.cupomHeight + 6;

      // Linha de corte
      if (i < CONFIG.parcelas - 1) {
        this.drawLinhaCortе(yPos);
        yPos -= 8;
      }

      cupomAtual++;

      // Pula página após 4 cupons
      if (cupomAtual % (cuponsPerPage + 1) === 1 && i < CONFIG.parcelas - 1) {
        this.doc.addPage();
        yPos = this.pageHeight - this.margin - this.cupomHeight;
      }
    }

    // Rodapé com informações
    this.doc.fontSize(8).fillColor('#6b7280').font('Helvetica');
    this.doc.text(
      `Carnê nº ${CONFIG.carneId} • Cliente: ${CONFIG.cliente} • CPF: ${CONFIG.cpf}`,
      this.margin,
      this.pageHeight - 25
    );

    this.doc.text(
      `Total: ${this.formatMoney(CONFIG.total)} • Parcelas: ${CONFIG.parcelas}x ${this.formatMoney(this.valorParcela)}`,
      this.margin,
      this.pageHeight - 15
    );

    const now = new Date();
    const dataHora = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR');
    this.doc.text(`Gerado em: ${dataHora}`, this.margin, this.pageHeight - 5);

    // Salva arquivo
    const stream = fs.createWriteStream(this.outputPath);
    this.doc.pipe(stream);
    this.doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        console.log('✓ PDF gerado com sucesso!\n');
        console.log(`📁 Arquivo: ${this.outputPath}`);
        console.log(`📊 Detalhes:`);
        console.log(`   - ${CONFIG.parcelas} parcelas`);
        console.log(`   - Total: ${this.formatMoney(CONFIG.total)}`);
        console.log(`   - Valor parcela: ${this.formatMoney(this.valorParcela)}`);
        console.log(`   - Cliente: ${CONFIG.cliente}`);
        console.log(`   - CPF: ${CONFIG.cpf}`);
        console.log(`   - Carnê nº: ${CONFIG.carneId}\n`);
        resolve();
      });

      stream.on('error', reject);
      this.doc.on('error', reject);
    });
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// EXECUÇÃO
// ───────────────────────────────────────────────────────────────────────────────

async function main() {
  try {
    const outputPath = path.join(
      require('os').homedir(),
      'Downloads',
      'carne_pagamentos.pdf'
    );

    const generator = new CarneGenerator(outputPath);
    await generator.generate();
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error.message);
    process.exit(1);
  }
}

main();
