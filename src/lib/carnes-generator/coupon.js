/**
 * Desenha cada cupom (via cobrador + via cliente)
 */

const {
  roundedRect,
  perfLine,
  statusBadge,
  label,
  labelRight,
  hLine,
  mm,
} = require('./utils/draw');

const COUPON_H = 65.5 * mm;
const SPLIT = 0.38;
const PAD = 3.5 * mm;

/**
 * Via esquerda — fica com o cobrador
 */
function drawCobrador(doc, x, y, couponW, parcela, config, pal) {
  const W = couponW * SPLIT;
  const H = COUPON_H;

  // Fundo + borda com cantos arredondados
  roundedRect(doc, x, y, W, H, 3 * mm, {
    fillColor: pal.light,
    strokeColor: pal.border,
    lineWidth: 0.6,
  });

  // Barra superior escura
  roundedRect(doc, x, y + H - 10 * mm, W, 10 * mm, 3 * mm, {
    fillColor: pal.dark,
  });

  // Faixa lateral decorativa (accent)
  doc.save().rect(x, y, 2.5 * mm, H - 10 * mm).fill(pal.accentMid).restore();

  // Empresa + rótulo na barra
  label(doc, x + PAD, y + H - 6.5, config.empresa, 8, '#ffffff', true);
  labelRight(doc, x + W - PAD, y + H - 6.5, 'VIA DO COBRADOR', 5.5, pal.label);

  // Linhas de dados
  const cx = x + PAD + 2.5 * mm;
  const r1 = y + H - 18 * mm;
  const r2 = y + H - 30 * mm;
  const r3 = y + H - 42 * mm;
  const r4 = y + H - 54 * mm;

  // Cliente
  label(doc, cx, r1 + 4, 'CLIENTE', 5.5, pal.accent);
  label(doc, cx, r1 - 3, config.cliente, 8.5, pal.text, true);

  // Referência
  hLine(doc, cx, r2 + 4, W - 3 * PAD, pal.border);
  label(doc, cx, r2, 'REFERÊNCIA', 5.5, pal.accent);
  label(doc, cx, r2 - 8, parcela.referencia, 8, pal.text, true);

  // Vencimento
  label(doc, cx, r3, 'VENCIMENTO', 5.5, pal.accent);
  label(doc, cx, r3 - 8, parcela.dataVencimento, 8, pal.text, true);

  // Parcela
  hLine(doc, cx, r4 + 4, W - 3 * PAD, pal.border);
  labelRight(
    doc,
    x + W - PAD,
    r4 + 3,
    'PARCELA',
    5.5,
    pal.accent
  );
  labelRight(
    doc,
    x + W - PAD,
    r4 - 10,
    `${String(parcela.numero).padStart(2, '0')}/${String(config.nParcelas).padStart(2, '0')}`,
    16,
    pal.accent,
    true
  );

  // Campo de assinatura
  label(
    doc,
    cx,
    y + 3 * mm,
    'Assinatura: ___________________________',
    5.5,
    pal.muted
  );
}

/**
 * Via direita — recibo do cliente
 */
function drawCliente(doc, x, y, couponW, parcela, config, pal) {
  const W = couponW * (1 - SPLIT);
  const H = COUPON_H;

  // Fundo branco + borda
  roundedRect(doc, x, y, W, H, 3 * mm, {
    fillColor: '#ffffff',
    strokeColor: pal.border,
    lineWidth: 0.6,
  });

  // Barra superior escura
  roundedRect(doc, x, y + H - 10 * mm, W, 10 * mm, 3 * mm, {
    fillColor: pal.dark,
  });

  // Tarja de accent no canto direito da barra
  roundedRect(doc, x + W - 6 * mm, y + H - 10 * mm, 6 * mm, 10 * mm, 3 * mm, {
    fillColor: pal.accent,
  });

  // Textos da barra
  label(doc, x + PAD, y + H - 6.5, config.empresa, 8, '#ffffff', true);
  labelRight(doc, x + W - PAD, y + H - 6.5, 'VIA DO CLIENTE / RECIBO', 5.5, pal.label);

  // Layout com 2 colunas
  const col1 = x + PAD;
  const col2 = x + W * 0.50;
  const r1 = y + H - 18 * mm;
  const r2 = y + H - 30 * mm;
  const r3 = y + H - 42 * mm;
  const r4 = y + H - 54 * mm;

  // ────────────────────────────────────────────────────────────
  // COLUNA ESQUERDA
  // ────────────────────────────────────────────────────────────
  label(doc, col1, r1 + 4, 'CLIENTE', 5.5, pal.accentMid);
  label(doc, col1, r1 - 3, config.cliente, 8.5, pal.text, true);
  label(doc, col1, r1 - 11, `CPF: ${config.cpf}`, 6, pal.muted);

  hLine(doc, col1, r2 + 4, W * 0.48, pal.border);
  label(doc, col1, r2, 'REFERÊNCIA', 5.5, pal.accentMid);
  label(doc, col1, r2 - 8, parcela.referencia, 8, pal.text, true);

  label(doc, col1, r3, 'VENCIMENTO', 5.5, pal.accentMid);
  label(doc, col1, r3 - 8, parcela.dataVencimento, 8, pal.text, true);

  // ────────────────────────────────────────────────────────────
  // COLUNA DIREITA
  // ────────────────────────────────────────────────────────────
  label(doc, col2, r1 + 4, 'PARCELA', 5.5, pal.accentMid);
  label(
    doc,
    col2,
    r1 - 6,
    `${String(parcela.numero).padStart(2, '0')}/${String(config.nParcelas).padStart(2, '0')}`,
    13,
    pal.accent,
    true
  );

  label(doc, col2, r2, 'VALOR', 5.5, pal.accentMid);
  label(doc, col2, r2 - 8, config.valorParcela, 10, pal.dark, true);

  // Badge de status
  statusBadge(doc, col2, r3 - 12, 35 * mm, 6 * mm, 'PENDENTE', '#b45309', '#fef3c7');

  // Juros ao dia (info adicional)
  label(doc, col2, r4 + 2, 'Juros:', 4.5, pal.muted);
  label(doc, col2, r4 - 3, config.jurosDia, 5, pal.muted);
}

module.exports = {
  drawCobrador,
  drawCliente,
  COUPON_H,
  SPLIT,
  PAD,
};
