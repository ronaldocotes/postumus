// src/utils/dates.js
// Gera os vencimentos mensais automaticamente

function gerarParcelas(config) {
  const parcelas = [];
  const { nParcelas, diaVencimento, mesInicio, anoInicio } = config;

  for (let i = 0; i < nParcelas; i++) {
    const totalMeses = (mesInicio - 1) + i;
    const ano  = anoInicio + Math.floor(totalMeses / 12);
    const mes  = (totalMeses % 12) + 1;
    const ref  = `${String(mes).padStart(2, '0')}/${ano}`;
    const venc = `${String(diaVencimento).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
    parcelas.push({ num: i + 1, ref, venc });
  }

  return parcelas;
}

module.exports = { gerarParcelas };
