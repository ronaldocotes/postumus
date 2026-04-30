# 🗂️ Gerador de Carnê – Posthumous

Gera carnês de pagamento em PDF com **duas vias por cupom** (cobrador + cliente), corte horizontal e picote vertical.

## 📁 Estrutura do projeto

```
carnes-generator/
├── src/
│   ├── index.js        ← ponto de entrada (rode este)
│   ├── config.js       ← ✏️ edite aqui os dados do carnê
│   ├── generator.js    ← orquestra a geração do PDF
│   ├── coupon.js       ← desenha cada cupom (2 vias)
│   ├── palettes.js     ← paletas de cores disponíveis
│   └── utils/
│       ├── draw.js     ← funções de desenho (PDFKit)
│       └── dates.js    ← gerador de datas mensais
└── README.md
```

## 🚀 Como usar

### 1. Instalar dependências

```bash
npm install pdfkit
```

### 2. Configurar dados

Edite **`config.js`** para alterar os dados:

```js
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
  carneId:      '2026-4567',
  total:        'R$ 3.050,00',
  nParcelas:    12,
  valorParcela: 'R$ 254,00',
  jurosDia:     'R$ 0,85/dia',

  // Paleta de cores
  paleta: 'azul',   // azul | verde | cinza | vinho | preto

  // Arquivo de saída
  output: 'carne_pagamentos.pdf',

  // Gerar datas automaticamente
  diaVencimento: 9,
  mesInicio:     1,    // janeiro
  anoInicio:     2026,
};
```

### 3. Gerar PDF

```bash
node index.js
```

O arquivo `carne_pagamentos.pdf` será gerado no diretório especificado em `config.output`.

## 🎨 Paletas disponíveis

| Chave    | Nome                  | Descrição               |
|----------|-----------------------|-------------------------|
| `azul`   | Azul Corporativo      | Sóbrio, confiável       |
| `verde`  | Verde Institucional   | Equilíbrio, seriedade   |
| `cinza`  | Cinza Profissional    | Neutro, atemporal       |
| `vinho`  | Vinho / Bordô         | Distinção, cerimônia    |
| `preto`  | Preto & Dourado       | Premium, sofisticado    |

### Paleta personalizada

Em vez de uma string, passe um objeto em `config.paleta`:

```js
module.exports = {
  // ...resto das configs

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
  },
};
```

## 📦 Dependências

- [pdfkit](https://pdfkit.org/) – geração de PDF em Node.js

## 📖 Características

✅ **Duas vias por cupom:**
- Via do cobrador (esquerda) – fundo claro, barra superior escura
- Via do cliente (direita) – recibo branco com badge de status

✅ **Layout profissional:**
- Cantos arredondados
- Linha perfurada vertical entre as vias
- Linha de corte horizontal entre cupons
- Cabeçalho e rodapé com informações

✅ **Customização:**
- 5 paletas de cores predefinidas
- Suporte a paletas personalizadas
- Geração automática de datas mensais

✅ **Código limpo:**
- Modular e reutilizável
- Bem documentado
- Funções auxiliares de desenho

## 📝 Exemplos de saída

Ver arquivos de exemplo na pasta `examples/` (quando disponível).

---

**Desenvolvido por Posthumous – Sistema de Gestão de Serviços Póstumos**
