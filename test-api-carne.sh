#!/bin/bash
# Teste a API de geração de carnês

# 1. Teste básico via curl
echo "🧪 Testando API de geração de carnês..."
echo ""

curl -X POST http://localhost:3000/api/carnes/gerar-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "cliente": "Ana Costa Silva",
    "cpf": "123.456.789-00",
    "nParcelas": 12,
    "total": "R$ 3.050,00",
    "valorParcela": "R$ 254,00",
    "empresa": "Posthumous",
    "carneId": "2026-001",
    "paleta": "azul"
  }' \
  --output teste_carne.pdf \
  -w "\n✅ Status: %{http_code}\n"

echo ""
echo "📄 Arquivo salvo em: teste_carne.pdf"
echo ""
