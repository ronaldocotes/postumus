// src/coupon.js
// Desenha cada cupom (via cobrador + via cliente)

const {
  roundedRect, perfLine, statusBadge,
  label, labelRight, hLine, mm,
} = require('./utils/draw');

const COUPON_H = 65.5 * mm;
const SPLIT    = 0.38;
const PAD      = 3.5  * mm;

/**
 * Via esquerda — fica com o cobrador
 */
function drawCobrador(doc, x, y, couponW, num, nParcelas, ref, venc, config, pal) {
  const W = couponW * SPLIT;
  const H = COUPON_H;

  // Fundo + borda
  roundedRect(doc, x, y, W, H, 3 * mm, {
    fillColor:   pal.light,
    strokeColor: pal.border,
    lineWidth:   0.6,
  });

  // Barra superior
  roundedRect(doc, x, y + H - 10 * mm, W, 10 * mm, 3 * mm, { fillColor: pal.dark });
  doc.save().rect(x, y + H - 10 * mm, W, 5 * mm).fill(pal.dark).restore();

  // Empresa + rótulo na barra
  label(doc, x + PAD,         y + H - 6.5, config.empresa,      8,   '#ffffff', true);
  labelRight(doc, x + W - PAD, y + H - 6.5, 'VIA DO COBRADOR',  5.5, pal.label);

  // Faixa lateral decorativa
  doc.save().rect(x, y, 2.5 * mm, H - 10 * mm).fill(pal.accentMid).restore();

  // Linhas de dados
  const cx = x + PAD + 2.5 * mm;
  const r1  = y + H - 18 * mm;
  const r2  = y + H - 30 * mm;
  const r3  = y + H - 42 * mm;
  const r4  = y + H - 54 * mm;

  label(doc, cx, r1 + 4,  'CLIENTE',    5.5, pal.accent);
  label(doc, cx, r1 - 3,  config.cliente, 8.5, pal.text, true);

  hLine(doc, cx, r2 + 4, W - 3 * PAD, pal.border);
  label(doc, cx, r2,     'REFERÊNCIA',  5.5, pal.accent);
  label(doc, cx, r2 - 8, ref,           8,   pal.text, true);

  label(doc, cx, r3,     'VENCIMENTO',  5.5, pal.accent);
  label(doc, cx, r3 - 8, venc,          8,   pal.text, true);

  hLine(doc, cx, r4 + 4, W - 3 * PAD, pal.border);
  labelRight(doc, x + W - PAD, r4 + 3,  'PARCELA',                      5.5, pal.accent);
  labelRight(doc, x + W - PAD, r4 - 10,
    `${String(num).padStart(2,'0')}/${String(nParcelas).padStart(2,'0')}`,
    16, pal.accent, true);

  // Assinatura
  label(doc, cx, y + 3 * mm, 'Assinatura: ___________________________', 5.5, pal.muted);
}

/**
 * Via direita — recibo do cliente
 */
function drawCliente(doc, x, y, couponW, num, nParcelas, ref, venc, config, pal) {
  const W = couponW * (1 - SPLIT);
  const H = COUPON_H;

  // Fundo branco + borda
  roundedRect(doc, x, y, W, H, 3 * mm, {
    fillColor:   '#ffffff',
    strokeColor: pal.border,
    lineWidth:   0.6,
  });

  // Barra superior
  roundedRect(doc, x, y + H - 10 * mm, W, 10 * mm, 3 * mm, { fillColor: pal.dark });
  doc.save().rect(x, y + H - 10 * mm, W, 5 * mm).fill(pal.dark).restore();

  // Tarja de accent no canto direito da barra
  roundedRect(doc, x + W - 6 * mm, y + H - 10 * mm, 6 * mm, 10 * mm, 3 * mm, { fillColor: pal.accent });

  label(doc, x + PAD,           y + H - 6.5, config.empresa,           8,   '#ffffff', true);
  labelRight(doc, x + W - PAD, y + H - 6.5, 'VIA DO CLIENTE / RECIBO', 5.5, pal.label);

  // Colunas
  const col1 = x + PAD;
  const col2 = x + W * 0.50;
  const r1   = y + H - 18 * mm;
  const r2   = y + H - 30 * mm;
  const r3   = y + H - 42 * mm;
  const r4   = y + H - 54 * mm;

  // ── Coluna esquerda ─────────────────────────────────────
  label(doc, col1, r1 + 4,  'CLIENTE',        5.5, pal.accentMid);
  label(doc, col1, r1 - 3,  config.cliente,   8.5, pal.text, true);
  label(doc, col1, r1 - 11, `CPF: ${config.cpf}`, 6, pal.muted);

  label(doc, col1, r2 + 1,  'ENDEREÇO',       5.5, pal.accentMid);
  label(doc, col1, r2 - 7,  config.endereco,  6,   pal.text);

  hLine(doc, col1, r3 + 3, (W - 2 * PAD) * 0.47, pal.border);
  label(doc, col1, r3,      'REFERÊNCIA',      5.5, pal.accentMid);
  label(doc, col1, r3 - 8,  ref,               7.5, pal.text, true);

  label(doc, col1, r4,      'VENCIMENTO',      5.5, pal.accentMid);
  label(doc, col1, r4 - 8,  venc,              7.5, pal.text, true);

  // Separador vertical interno
  doc.save()
    .strokeColor(pal.border)
    .lineWidth(0.4)
    .dash(2, { space: 2 })
    .moveTo(col2 - 3 * mm, y + 4 * mm)
    .lineTo(col2 - 3 * mm, y + H - 13 * mm)
    .stroke()
    .undash()
    .restore();

  // ── Coluna direita ──────────────────────────────────────
  label(doc, col2, r1 + 4,  'CARNÊ Nº',       5.5, pal.accentMid);
  label(doc, col2, r1 - 3,  config.carneId,   7.5, pal.text, true);

  label(doc, col2, r2 + 2,  'PARCELA',         5.5, pal.accentMid);
  label(doc, col2, r2 - 10,
    `${String(num).padStart(2,'0')}/${String(nParcelas).padStart(2,'0')}`,
    14, pal.accent, true);

  hLine(doc, col2, r3 + 3, (W - 2 * PAD) * 0.52, pal.border);
  label(doc, col2, r3,      'VALOR DA PARCELA', 5.5, pal.accentMid);
  label(doc, col2, r3 - 11, config.valorParcela, 13, pal.dark, true);

  // Badge status
  statusBadge(doc, col2, y + 6 * mm, 22 * mm, 5.5 * mm,
    'PENDENTE', '#b45309', '#fef3c7');

  // Rodapé
  label(doc, col1,           y + 3.5,
    `Total: ${config.total}  ·  ${config.nParcelas}x de ${config.valorParcela}`,
    5.5, pal.muted);
  labelRight(doc, x + W - PAD, y + 3.5,
    `Juros: ${config.jurosDia}`, 5.5, pal.muted);
}

module.exports = { drawCobrador, drawCliente, COUPON_H, SPLIT };
