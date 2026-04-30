import { PoolConfig } from 'pg';

export const pgPoolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Aplica SSL automaticamente se for Neon ou ambiente de Produção
  ssl: process.env.DATABASE_URL?.includes('neon.tech') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined,
  connectionTimeoutMillis: 15000, // 15s para falhar rápido caso o banco esteja inacessível
  idleTimeoutMillis: 10000,       // 10s: Neon desconecta conexões ociosas rapidamente
  max: parseInt(process.env.DB_POOL_MAX || '20', 10), // Tamanho dinâmico via .env
  allowExitOnIdle: true,          // Permite que o Node finalize os scripts sem precisar forçar pool.end()
};

// Config para Neon serverless
if (process.env.DATABASE_URL?.includes('neon.tech')) {
  pgPoolConfig.application_name = 'funeraria-system';
}

// Função avançada de retry com Exponential Backoff e Logging detalhado
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
  operationName = 'DB_OPERATION'
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const startTime = Date.now();
      const result = await fn();
      
      if (i > 0) {
        console.log(`✅ [${operationName}] Sucesso na tentativa ${i + 1} (Recuperado em ${Date.now() - startTime}ms)`);
      }
      return result;
    } catch (error: any) {
      lastError = error;
      if (i === maxRetries - 1) {
        console.error(`❌ [${operationName}] Falha definitiva após ${maxRetries} tentativas:`, error.message);
        throw error;
      }
      const delayMs = baseDelay * (2 ** i) + Math.random() * 500; // Exponential backoff + Jitter
      console.warn(`⚠️ [${operationName}] Falha na tentativa ${i + 1}/${maxRetries}. Retentando em ${Math.round(delayMs)}ms... Erro: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}
