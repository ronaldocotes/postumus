// src/index.js
// Ponto de entrada — edite src/config.js para mudar os dados

const { generate } = require('./generator');
const config       = require('./config');

console.log('');
console.log('┌─────────────────────────────────────┐');
console.log('│   Gerador de Carnê · Posthumous     │');
console.log('└─────────────────────────────────────┘');
console.log('');
console.log(`  Cliente  : ${config.cliente}`);
console.log(`  Carnê nº : ${config.carneId}`);
console.log(`  Total    : R$ ${config.total}`);
console.log(`  Parcelas : ${config.nParcelas}x de ${config.valorParcela}`);
console.log(`  Paleta   : ${typeof config.paleta === 'string' ? config.paleta : 'customizada'}`);
console.log('');
console.log('  Gerando PDF...');

generate(config)
  .then(outputPath => {
    console.log(`  ✅  PDF gerado: ${outputPath}`);
    console.log('');
  })
  .catch(err => {
    console.error('  ❌  Erro:', err.message);
    process.exit(1);
  });
