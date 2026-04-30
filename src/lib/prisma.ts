import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { pgPoolConfig } from "./db-config";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const dbUrl = (process.env.DATABASE_URL || "").replace(/^\uFEFF/, "").trim();
  
  if (!dbUrl) {
    throw new Error("❌ DATABASE_URL is not set. Adicione ao .env");
  }

  console.log(`🔌 Conectando ao banco: ${dbUrl.includes('neon.tech') ? 'Neon' : 'Local PG'}`);

  try {
    // Se for Neon (postgres://...@...neon.tech...), usar adapter Neon
    if (dbUrl.includes("neon.tech")) {
      const adapter = new PrismaNeon({ 
        connectionString: dbUrl.replace('&sslmode=require', '&sslmode=verify-full') 
      });
      return new PrismaClient({ 
        adapter,
        log: ['query', 'warn', 'error']
      });
    }
    
    // Para PostgreSQL local, usar adapter PG com configuração otimizada
    const pool = new Pool({ 
      ...pgPoolConfig,
      connectionString: dbUrl 
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ 
      adapter,
      log: ['query', 'warn', 'error']
    });
  } catch (error: any) {
    console.error("❌ Erro criando Prisma Client:", {
      message: error.message,
      code: error.code,
      url: dbUrl.includes('neon.tech') ? 'Neon' : 'Local'
    });
    throw new Error(`Falha na conexão: ${error.message}`);
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
