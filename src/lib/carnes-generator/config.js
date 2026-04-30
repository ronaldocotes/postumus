/**
 * Configuração do Gerador de Carnês
 * Edite aqui os dados antes de gerar o PDF
 */

module.exports = {
  // ────────────────────────────────────────────────────────────────────────
  // DADOS DA EMPRESA
  // ────────────────────────────────────────────────────────────────────────
  empresa: 'Posthumous',
  subtitulo: 'Gestão de Serviços Póstumos',
  cnpj: '12.345.678/0001-99',

  // ────────────────────────────────────────────────────────────────────────
  // DADOS DO CLIENTE
  // ────────────────────────────────────────────────────────────────────────
  cliente: 'Ana Costa',
  cpf: '123.456.789-00',
  endereco: 'Rua das Flores, 123 – Macapá/AP',

  // ────────────────────────────────────────────────────────────────────────
  // DADOS DO CARNÊ
  // ────────────────────────────────────────────────────────────────────────
  carneId: '2026-4567',
  total: 'R$ 3.050,00',
  nParcelas: 12,
  valorParcela: 'R$ 254,00',
  jurosDia: 'R$ 0,85/dia',

  // ────────────────────────────────────────────────────────────────────────
  // PALETA DE CORES
  // ────────────────────────────────────────────────────────────────────────
  // Opções: 'azul' | 'verde' | 'cinza' | 'vinho' | 'preto'
  // Ou passe um objeto customizado (veja palettes.js como referência)
  paleta: 'azul',

  // ────────────────────────────────────────────────────────────────────────
  // CONFIGURAÇÕES DE SAÍDA
  // ────────────────────────────────────────────────────────────────────────
  output: 'carne_pagamentos.pdf',

  // Gerar datas automaticamente a partir desta data (dia fixo cada mês)
  diaVencimento: 9,
  mesInicio: 1,    // janeiro
  anoInicio: 2026,
};
