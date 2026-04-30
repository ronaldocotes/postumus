# 🗂️ Gerador de Carnê – Posthumous

Gera carnês de pagamento em PDF com **duas vias por cupom** (cobrador + cliente), corte horizontal e picote vertical.

## Estrutura do projeto

```
carne-nodejs/
├── src/
│   ├── index.js        ← ponto de entrada (rode este)
│   ├── config.js       ← ✏️ edite aqui os dados do carnê
│   ├── generator.js    ← orquestra a geração do PDF
│   ├── coupon.js       ← desenha cada cupom (2 vias)
│   ├── palettes.js     ← paletas de cores disponíveis
│   └── utils/
│       ├── draw.js     ← funções de desenho (PDFKit)
│       └── dates.js    ← gerador de datas mensais
├── package.json
└── README.md
```

## Instalação

```bash
npm install
```

## Uso

```bash
npm start
```

O arquivo `carne_pagamentos.pdf` será gerado na raiz do projeto.

## Configuração

Edite **`src/config.js`** para alterar os dados:

```js
module.exports = {
  empresa:      'Posthumous',
  subtitulo:    'Gestão de Serviços Póstumos',
  cnpj:         '12.345.678/0001-99',

  cliente:      'Ana Costa',
  cpf:          '123.456.789-00',
  endereco:     'Rua das Flores, 123 – Macapá/AP',

  carneId:      '2026-4567',
  total:        'R$ 3.050,00',
  nParcelas:    12,
  valorParcela: 'R$ 254,00',
  jurosDia:     'R$ 0,85/dia',

  paleta: 'azul',   // azul | verde | cinza | vinho | preto

  output:        'carne_pagamentos.pdf',
  diaVencimento: 9,
  mesInicio:     1,
  anoInicio:     2026,
};
```

## Paletas disponíveis

| Chave    | Nome                  | Descrição               |
|----------|-----------------------|-------------------------|
| `azul`   | Azul Corporativo      | Sóbrio, confiável       |
| `verde`  | Verde Institucional   | Equilíbrio, seriedade   |
| `cinza`  | Cinza Profissional    | Neutro, atemporal       |
| `vinho`  | Vinho / Bordô         | Distinção, cerimônia    |
| `preto`  | Preto & Dourado       | Premium, sofisticado    |

## Paleta personalizada

Em vez de uma string, passe um objeto em `paleta`:

```js
paleta: {
  name:      'Minha Paleta',
  dark:      '#1a1a2e',
  accent:    '#e94560',
  accentMid: '#ff6b6b',
  light:     '#fde8e8',
  xlight:    '#fff5f5',
  label:     '#ffb3b3',
  border:    '#ffd0d0',
  perf:      '#ff8888',
  text:      '#1a1a2e',
  muted:     '#6b7280',
},
```

## Dependências

- [pdfkit](https://pdfkit.org/) — geração de PDF em Node.js
