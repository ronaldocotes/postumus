#!/usr/bin/env node
/**
 * Gerador de Carnês de Pagamento - Posthumous
 * Ponto de entrada
 */

const config = require('./config');
const { generate } = require('./generator');

async function main() {
  try {
    console.log('📄 Gerando carnê de pagamento...\n');
    await generate(config);
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error.message);
    console.error(error);
    process.exit(1);
  }
}

console.log('Iniciando...');
main().then(() => {
  console.log('Concluído!');
  process.exit(0);
}).catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
