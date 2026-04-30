/**
 * Gerador de datas para parcelas do carnê
 */

/**
 * Gera um array de objetos com datas de vencimento para cada parcela
 */
function gerarParcelas(config) {
  const parcelas = [];
  const { nParcelas, diaVencimento, mesInicio, anoInicio } = config;

  for (let i = 1; i <= nParcelas; i++) {
    const dataVenc = new Date(anoInicio, mesInicio - 1 + i - 1, diaVencimento);
    const mes = (mesInicio - 1 + i - 1) % 12 + 1;
    const ano = anoInicio + Math.floor((mesInicio - 1 + i - 1) / 12);

    parcelas.push({
      numero: i,
      mes,
      ano,
      dataVencimento: dataVenc.toLocaleDateString('pt-BR'),
      referencia: `${String(i).padStart(2, '0')}/${ano}`,
    });
  }

  return parcelas;
}

module.exports = {
  gerarParcelas,
};
