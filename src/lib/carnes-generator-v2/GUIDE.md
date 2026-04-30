# 📋 Gerador de Carnês de Pagamento – Posthumous

Sistema completo para gerar carnês de pagamento em PDF com design profissional, duas vias (cobrador + cliente), corte e picote.

## 📁 Localização

```
src/lib/carnes-generator-v2/
├── server.js              ← Servidor HTTP + Frontend
├── package.json
├── public/
│   └── carnes.html        ← Interface web (UI interativa)
├── src/
│   ├── index.js           ← CLI (comando direto)
│   ├── config.js          ← Dados do carnê
│   ├── generator.js       ← Orquestra geração PDF
│   ├── coupon.js          ← Desenha cupom (2 vias)
│   ├── palettes.js        ← Cores disponíveis
│   └── utils/
│       ├── draw.js        ← Funções PDFKit
│       └── dates.js       ← Gerador de datas
└── output/                ← PDFs gerados (temporário)
```

## 🚀 Como Usar

### Opção 1: Linha de Comando (CLI)

```bash
cd src/lib/carnes-generator-v2
npm run generate
```

Edite os dados em `src/config.js` e rode novamente.

### Opção 2: Interface Web

```bash
cd src/lib/carnes-generator-v2
npm start
```

Acesse http://localhost:3001 no navegador.

### Opção 3: API via Next.js

```javascript
// Cliente Next.js / React
const response = await fetch('/api/carnes/gerar-pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    empresa: 'Posthumous',
    cliente: 'Ana Costa',
    cpf: '123.456.789-00',
    carneId: '2026-4567',
    total: 'R$ 3.050,00',
    nParcelas: 12,
    valorParcela: 'R$ 254,00',
    jurosDia: 'R$ 0,85/dia',
    paleta: 'azul',
  }),
});

const pdf = await response.blob();
// Faz download do PDF
```

## ⚙️ Configuração

Edite `src/config.js`:

```javascript
module.exports = {
  // 🏢 DADOS DA EMPRESA
  empresa: 'Posthumous',
  subtitulo: 'Gestão de Serviços Póstumos',
  cnpj: '12.345.678/0001-99',

  // 👤 DADOS DO CLIENTE
  cliente: 'Ana Costa',
  cpf: '123.456.789-00',
  endereco: 'Rua das Flores, 123 – Macapá/AP',

  // 📄 DADOS DO CARNÊ
  carneId: '2026-4567',
  total: 'R$ 3.050,00',
  nParcelas: 12,
  valorParcela: 'R$ 254,00',
  jurosDia: 'R$ 0,85/dia',

  // 🎨 PALETA (azul | verde | cinza | vinho | preto)
  paleta: 'azul',

  // 📅 DATAS
  diaVencimento: 9,    // dia do mês fixo
  mesInicio: 1,        // janeiro
  anoInicio: 2026,

  // 💾 ARQUIVO DE SAÍDA
  output: 'carne_pagamentos.pdf',
};
```

## 🎨 Paletas de Cores

| Chave    | Nome                  | Uso Recomendado        |
|----------|-----------------------|------------------------|
| `azul`   | Azul Corporativo      | Geral, confiável       |
| `verde`  | Verde Institucional   | Saúde, sustentável     |
| `cinza`  | Cinza Profissional    | Neutro, formal         |
| `vinho`  | Vinho / Bordô         | Premium, elegante      |
| `preto`  | Preto & Dourado       | Luxury, sofisticado    |

### Paleta Personalizada

```javascript
// Em vez de string, passe um objeto:
paleta: {
  name: 'Minha Paleta',
  dark: '#1a1a2e',
  accent: '#e94560',
  accentMid: '#ff6b6b',
  light: '#fde8e8',
  xlight: '#fff5f5',
  label: '#ffb3b3',
  border: '#ffd0d0',
  perf: '#ff8888',
  text: '#1a1a2e',
  muted: '#6b7280',
}
```

## 📊 Características

✅ **Duas vias por cupom:**
- Via do cobrador (esquerda) – fundo claro, barra superior escura, campo de assinatura
- Via do cliente (direita) – recibo branco, badge de status "PENDENTE"

✅ **Layout profissional:**
- Cantos arredondados em todos os cupons
- Linha perfurada vertical (picote) entre as vias
- Linha tracejada horizontal com ✂ entre cupons
- Cabeçalho com identificação da empresa
- Rodapé com resumo de totais

✅ **Geração automática de datas:**
- Cria uma parcela por mês
- Data de vencimento fixa (ex: 9 de cada mês)
- Formato brasileiro (DD/MM/YYYY)

✅ **Múltiplas paletas:**
- 5 cores predefinidas
- Suporte a cores customizadas
- Tema escuro/claro

## 📦 Dependências

```json
{
  "pdfkit": "^0.15.0",    // Geração de PDF
  "nodemon": "^3.0.0"     // Dev: reload automático
}
```

## 📝 Exemplos

### Exemplo 1: CLI básico
```bash
npm run generate
```

### Exemplo 2: Servidor web
```bash
npm start
# Acesse http://localhost:3001
```

### Exemplo 3: Integração Next.js
```javascript
// src/app/carnes/page.tsx
'use client';

import { useState } from 'react';

export default function CarnesPage() {
  const [loading, setLoading] = useState(false);

  async function gerar() {
    setLoading(true);
    try {
      const res = await fetch('/api/carnes/gerar-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: 'Cliente Teste',
          nParcelas: 12,
          total: 'R$ 1.200,00',
          valorParcela: 'R$ 100,00',
        }),
      });

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'carnê.pdf';
      a.click();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={gerar} disabled={loading}>
      {loading ? 'Gerando...' : 'Gerar Carnê'}
    </button>
  );
}
```

## 🔧 Troubleshooting

### PDF não está sendo gerado
- Verificar se a pasta `output/` existe
- Confirmar que PDFKit está instalado: `npm list pdfkit`
- Ver logs de erro: `npm run generate 2>&1`

### Servidor não inicia
```bash
# Verificar porta 3001
netstat -ano | findstr :3001

# Usar porta diferente (editar server.js)
const PORT = 3002;
```

### Dados não aparecem no PDF
- Conferir `src/config.js` com caracteres especiais
- Usar encoding UTF-8 no arquivo

## 📖 Documentação PDFKit

- [PDFKit Docs](http://pdfkit.org/)
- [Font Support](http://pdfkit.org/docs/getting_started/fonts)
- [Text & Styling](http://pdfkit.org/docs/getting_started/text)

## 🐛 Relatórios de Erro

Encontrou um bug? Descreva:
1. O que tentou fazer
2. Qual foi o erro exato
3. Com qual config/paleta
4. Sistema operacional e versão do Node.js

---

**Desenvolvido por Posthumous – Sistema de Gestão de Serviços Póstumos**

v2.0.0 · Abril de 2026
