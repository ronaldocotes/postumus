# TODO - Correção de Erros de Conexão
Plano aprovado. Progresso:

## ✅ [Concluído] 1. Criar TODO.md para rastreamento

## ✅ 2. Criar src/lib/db-config.ts (configuração centralizada do pool)

## ✅ 3. Editar src/lib/prisma.ts (melhorar retry e logging)

## ✅ 4. Editar prisma/schema.prisma (adicionar url=env(\"DATABASE_URL\"))

## ✅ 5. Editar check-db.js (corrigir importação do PrismaClient)

## ✅ 6. Editar scripts/test-db.js (corrigir importação e dotenv)

## ✅ 7. Refatorar import-access.js (transações em batches + retry)

## ✅ 8. Atualizar scripts de teste (test-neon.js, check-neon.js, etc.) para usar env

## ✅ 9. Testar todas as correções
- npx prisma generate
- node check-db.js
- Testar importação pequena

## ✅ 10. [Finalizar] attempt_completion
