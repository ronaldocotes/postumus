#!/usr/bin/env node
/**
 * CLI wrapper para gerador de carnês
 * Aceita argumentos: node cli.js <configPath> <outputPath>
 * 
 * Uso:
 *   node cli.js /tmp/config.json /tmp/output.pdf
 */

const { generate } = require('./generator');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Erro: Use "node cli.js <configPath> <outputPath>"');
  process.exit(1);
}

const [configPath, outputPath] = args;

// Valida se arquivo de config existe
if (!fs.existsSync(configPath)) {
  console.error(`Erro: Arquivo de config não encontrado: ${configPath}`);
  process.exit(1);
}

try {
  // Lê configuração
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(configContent);

  // Define path de saída
  config.output = outputPath;

  // Gera PDF
  generate(config)
    .then(() => {
      console.log(`✅ PDF gerado com sucesso: ${outputPath}`);
      process.exit(0);
    })
    .catch(err => {
      console.error(`❌ Erro ao gerar PDF: ${err.message}`);
      process.exit(1);
    });
} catch (err) {
  if (err instanceof SyntaxError) {
    console.error(`Erro: JSON inválido no arquivo de config: ${err.message}`);
  } else {
    console.error(`Erro: ${err.message}`);
  }
  process.exit(1);
}
