// src/config.js
// ─────────────────────────────────────────────────
// Edite aqui todos os dados do carnê antes de gerar
// ─────────────────────────────────────────────────

module.exports = {
  // Dados da empresa
  empresa:   'Posthumous',
  subtitulo: 'Gestão de Serviços Póstumos',
  cnpj:      '12.345.678/0001-99',

  // Dados do cliente
  cliente:   'Ana Costa',
  cpf:       '123.456.789-00',
  endereco:  'Rua das Flores, 123 – Macapá/AP',

  // Dados do carnê
  carneId:   '2026-4567',
  total:     'R$ 3.050,00',
  nParcelas: 12,
  valorParcela: 'R$ 254,00',
  jurosDia:  'R$ 0,85/dia',

  // Paleta: 'azul' | 'verde' | 'cinza' | 'vinho' | 'preto'
  // Ou passe um objeto customizado (veja palettes.js como referência)
  paleta: 'azul',

  // Arquivo de saída
  output: 'carne_pagamentos.pdf',

  // Gerar datas automaticamente a partir desta data (dia fixo)
  diaVencimento: 9,
  mesInicio: 1,    // janeiro
  anoInicio: 2026,
};
