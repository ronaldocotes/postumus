// src/utils/draw.js
// Funções auxiliares de desenho para o PDFKit

const mm = 2.8346; // 1mm em pontos

/**
 * Desenha um retângulo com cantos arredondados
 */
function roundedRect(doc, x, y, w, h, r = 3 * mm, opts = {}) {
  doc.save();
  if (opts.fillColor) doc.fillColor(opts.fillColor);
  if (opts.strokeColor) doc.strokeColor(opts.strokeColor);
  if (opts.lineWidth)   doc.lineWidth(opts.lineWidth);

  doc
    .moveTo(x + r, y)
    .lineTo(x + w - r, y)
    .quadraticCurveTo(x + w, y, x + w, y + r)
    .lineTo(x + w, y + h - r)
    .quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    .lineTo(x + r, y + h)
    .quadraticCurveTo(x, y + h, x, y + h - r)
    .lineTo(x, y + r)
    .quadraticCurveTo(x, y, x + r, y)
    .closePath();

  if (opts.fillColor && opts.strokeColor) {
    doc.fillAndStroke();
  } else if (opts.fillColor) {
    doc.fill();
  } else if (opts.strokeColor) {
    doc.stroke();
  }

  doc.restore();
}

/**
 * Linha tracejada horizontal (corte entre cupons)
 */
function cutLine(doc, x, y, width, color = '#c4b5fd') {
  doc.save()
    .strokeColor(color)
    .lineWidth(0.4)
    .dash(5, { space: 4 })
    .moveTo(x + 8 * mm, y)
    .lineTo(x + width - 8 * mm, y)
    .stroke()
    .undash();

  // Ícone tesoura (caractere aproximado)
  doc.save()
    .fillColor(color)
    .fontSize(8)
    .text('✂', x + 2 * mm, y - 4, { lineBreak: false });

  doc.restore();
}

/**
 * Linha picotada vertical entre as duas vias
 */
function perfLine(doc, x, y1, y2, color = '#60a5fa') {
  doc.save()
    .strokeColor(color)
    .lineWidth(0.6)
    .dash(3, { space: 3 })
    .moveTo(x, y1)
    .lineTo(x, y2)
    .stroke()
    .undash()
    .restore();
}

/**
 * Badge de status (pill colorida)
 */
function statusBadge(doc, x, y, w, h, text, textColor, bgColor) {
  roundedRect(doc, x, y, w, h, h / 2, { fillColor: bgColor });
  doc.save()
    .fillColor(textColor)
    .fontSize(6)
    .font('Helvetica-Bold')
    .text(text, x, y + h / 2 - 3.5, {
      width: w,
      align: 'center',
      lineBreak: false,
    })
    .restore();
}

/**
 * Texto simples com controle total
 */
function label(doc, x, y, text, size = 6.5, color = '#64748b', bold = false) {
  doc.save()
    .fontSize(size)
    .fillColor(color)
    .font(bold ? 'Helvetica-Bold' : 'Helvetica')
    .text(String(text), x, y, { lineBreak: false })
    .restore();
}

/**
 * Texto alinhado à direita
 */
function labelRight(doc, x, y, text, size = 6.5, color = '#64748b', bold = false) {
  doc.save()
    .fontSize(size)
    .fillColor(color)
    .font(bold ? 'Helvetica-Bold' : 'Helvetica');

  const w = doc.widthOfString(String(text));
  doc.text(String(text), x - w, y, { lineBreak: false })
    .restore();
}

/**
 * Linha horizontal suave
 */
function hLine(doc, x, y, w, color = '#e5e7eb', lw = 0.3) {
  doc.save()
    .strokeColor(color)
    .lineWidth(lw)
    .moveTo(x, y)
    .lineTo(x + w, y)
    .stroke()
    .restore();
}

module.exports = { roundedRect, cutLine, perfLine, statusBadge, label, labelRight, hLine, mm };
