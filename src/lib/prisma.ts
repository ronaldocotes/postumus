import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const dbUrl = (process.env.DATABASE_URL || "").replace(/^\uFEFF/, "").trim();
  
  if (!dbUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  try {
    // Se for Neon (postgres://...@...neon.tech...), usar adapter Neon
    if (dbUrl.includes("neon.tech")) {
      const adapter = new PrismaNeon({ connectionString: dbUrl });
      return new PrismaClient({ adapter });
    }
    
    // Para PostgreSQL local, usar adapter PG
    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  } catch (error) {
    console.error("Error creating Prisma Client:", error);
    throw error;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
