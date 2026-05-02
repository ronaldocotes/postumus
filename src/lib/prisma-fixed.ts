import { PrismaClient } from "@/generated/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const dbUrl = (process.env.DATABASE_URL || "").replace(/^\uFEFF/, "").trim();
  
  if (!dbUrl) {
    throw new Error("DATABASE_URL is not set. Adicione ao .env");
  }

  console.log(`🔌 Conectando ao banco: ${dbUrl.includes('neon.tech') ? 'Neon' : 'Local PG'}`);

  try {
    if (dbUrl.includes("neon.tech")) {
      // Neon - usar adapter Neon
      const adapter = new PrismaNeon({ connectionString: dbUrl });
      return new PrismaClient({ adapter });
    }
    
    // PostgreSQL local - usar adapter PG
    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  } catch (error: any) {
    console.error("Erro criando Prisma Client:", error.message);
    throw new Error(`Falha na conexão: ${error.message}`);
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

