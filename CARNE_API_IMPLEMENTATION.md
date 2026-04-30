# ✅ Integração Completa: Gerador de Carnês v2

## 📋 O Que Foi Feito

### 1. ✅ API Endpoint Funcional
**Arquivo**: `src/app/api/carnes/gerar-pdf/route.ts`

```typescript
POST /api/carnes/gerar-pdf
Content-Type: application/json

Request Body:
{
  "cliente": "Ana Costa Silva",
  "cpf": "123.456.789-00",
  "nParcelas": 12,
  "total": "R$ 3.050,00",
  "valorParcela": "R$ 254,00",
  "paleta": "azul",
  "empresa": "Posthumous",
  "carneId": "2026-001"
}

Response:
Content-Type: application/pdf
Content-Disposition: attachment; filename="carne_2026-001.pdf"
[PDF Binary Data]
```

**Features**:
- ✅ Valida dados obrigatórios (cliente, nParcelas)
- ✅ Cria config dinâmica
- ✅ Executa gerador via subprocess (Node.js CLI)
- ✅ Lê PDF gerado e retorna como download
- ✅ Limpa automaticamente arquivos temporários
- ✅ Tratamento de erros robusto

---

### 2. ✅ CLI Wrapper para Subprocess
**Arquivo**: `src/lib/carnes-generator-v2/src/cli.js` (NOVO)

```bash
node cli.js <configPath> <outputPath>
```

Uso interno:
```bash
node "src/lib/carnes-generator-v2/src/cli.js" \
  "/tmp/config.json" \
  "/tmp/carne_output.pdf"
```

**Features**:
- ✅ Lê config JSON do arquivo
- ✅ Define path de saída dinâmico
- ✅ Trata erros de validação JSON
- ✅ Exit codes apropriados (0 = sucesso, 1 = erro)

---

### 3. ✅ Exemplos de Integração
**Arquivo**: `src/lib/carnes-generator-v2/INTEGRATION_EXAMPLES.ts` (NOVO)

Contém 6 exemplos prontos para usar:

1. **Componente React** - Botão com geração de carnê
2. **Fetch Vanilla JS** - Download simples
3. **Com Toast/Notificação** - UX feedback
4. **Integração Prisma** - Buscar dados do banco
5. **Classe CarneAPI** - Interface limpa e modular
6. **Batch Processing** - Gerar múltiplos carnês

---

### 4. ✅ Teste Manual
**Arquivo**: `test-api-carne.sh` (NOVO)

```bash
curl -X POST http://localhost:3000/api/carnes/gerar-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "cliente": "Test Client",
    "nParcelas": 12,
    "total": "R$ 100,00",
    "valorParcela": "R$ 8,33"
  }' \
  --output teste.pdf
```

---

### 5. ✅ Correções de Build
Corrigidos imports em 3 arquivos para evitar erro `default export`:

- `src/app/api/auth/reset-password/route.ts`
- `src/app/api/auth/reset-password/confirm/route.ts`
- `prisma/seed.ts`
- `scripts/seed-macapa.ts`
- `prisma.config.ts` (removido propriedade inválida `seed`)

**Resultado**: API route sem erros TypeScript ✅

---

## 🏗️ Arquitetura

```
API Request (POST /api/carnes/gerar-pdf)
    ↓
Validação de dados
    ↓
Criar arquivo config.json temporário
    ↓
Executar: node cli.js <config> <output>
    ↓
CLI wrapper carrega config e chama generator
    ↓
Generator cria PDF com PDFKit
    ↓
Ler PDF do arquivo
    ↓
Retornar como download (Content-Type: application/pdf)
    ↓
Limpar arquivos temporários
```

---

## 🧪 Como Testar

### Opção 1: Via Curl
```bash
curl -X POST http://localhost:3000/api/carnes/gerar-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "cliente": "João Silva",
    "nParcelas": 6,
    "total": "R$ 1.500,00",
    "valorParcela": "R$ 250,00"
  }' \
  --output carne_teste.pdf
```

### Opção 2: Via JavaScript
```javascript
const response = await fetch('/api/carnes/gerar-pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cliente: 'Maria Santos',
    nParcelas: 12,
    total: 'R$ 3.050,00',
    valorParcela: 'R$ 254,00',
  })
});

const blob = await response.blob();
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'carne.pdf';
link.click();
```

### Opção 3: Via CLI
```bash
cd src/lib/carnes-generator-v2
npm run generate
```

---

## 📂 Estrutura Final

```
src/
  ├─ app/
  │  └─ api/
  │     └─ carnes/
  │        └─ gerar-pdf/
  │           └─ route.ts ✅ (IMPLEMENTADO)
  │
  └─ lib/
     └─ carnes-generator-v2/
        ├─ src/
        │  ├─ cli.js ✅ (NOVO)
        │  ├─ config.js
        │  ├─ generator.js
        │  ├─ coupon.js
        │  ├─ index.js
        │  └─ utils/
        │     ├─ draw.js
        │     └─ dates.js
        ├─ public/
        │  └─ carnes.html
        ├─ package.json
        ├─ GUIDE.md
        ├─ INTEGRATION_EXAMPLES.ts ✅ (NOVO)
        └─ README.md
```

---

## 🎨 Paletas Disponíveis

| Paleta | Descrição |
|--------|-----------|
| `azul` | Azul corporativo (padrão) |
| `verde` | Verde institucional |
| `cinza` | Cinza profissional |
| `vinho` | Vinho/Bordô |
| `preto` | Preto & Dourado |

---

## 📊 Recursos

| Recurso | Status |
|---------|--------|
| Geração de PDFs | ✅ Completo |
| CLI | ✅ Completo |
| Web UI | ✅ Completo |
| API Next.js | ✅ Implementado |
| Integração Prisma | 🔄 Próximo passo |
| UI Button | 🔄 Próximo passo |
| Auto-generation | 🔄 Próximo passo |
| Histórico | 🔄 Próximo passo |

---

## 🚀 Próximos Passos (Fáceis)

### 1. Adicionar botão em `/dashboard/carnes`
```tsx
import { CarneAPI } from '@/lib/carnes-generator-v2/INTEGRATION_EXAMPLES';

<button onClick={() => CarneAPI.download({
  cliente: carne.cliente.name,
  nParcelas: carne.nParcelas,
  total: carne.totalValue,
  valorParcela: carne.installmentValue
})}>
  📄 Gerar PDF
</button>
```

### 2. Conectar com banco de dados
```tsx
// Na API route, adicionar:
const carne = await prisma.carne.findUnique({
  where: { id: carneId },
  include: { cliente: true }
});
```

### 3. Automatizar ao criar novo carnê
```tsx
// Após criar Carne, chamar:
await fetch('/api/carnes/gerar-pdf', { 
  method: 'POST', 
  body: JSON.stringify(carneData) 
});
```

---

## ✨ Destaques

✅ **Funcional**: PDF gerado com sucesso em teste  
✅ **Modular**: Componentes reutilizáveis  
✅ **Robusto**: Tratamento de erros e limpeza automática  
✅ **Escalável**: Suporta 6+ formas de integração  
✅ **Documentado**: Exemplos prontos para usar  
✅ **Testado**: Sem erros TypeScript  

---

**Data**: 30 de Abril de 2026  
**Status**: ✅ INTEGRAÇÃO COMPLETA - PRONTO PARA USO
