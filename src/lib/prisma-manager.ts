// src/lib/prisma-manager.ts
// Gerenciador de conexões Prisma por empresa (multi-tenant database-based)

import { PrismaClient } from "@/generated/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { pgPoolConfig } from "./db-config";

// Cache de PrismaClient por databaseUrl
const clients = new Map<string, PrismaClient>();

function createPrismaClientForUrl(databaseUrl: string): PrismaClient {
  const url = databaseUrl.replace(/^\uFEFF/, "").trim();

  if (!url) {
    throw new Error("❌ databaseUrl está vazio");
  }

  console.log(`🔌 [PrismaManager] Conectando: ${url.includes("neon.tech") ? "Neon" : "PostgreSQL"}`);

  try {
    // Se for Neon (postgres://...@...neon.tech...), usar adapter Neon
    if (url.includes("neon.tech")) {
      const adapter = new PrismaNeon({
        connectionString: url.replace("&sslmode=require", "&sslmode=verify-full"),
      });
      return new PrismaClient({
        adapter,
        log: ["query", "warn", "error"],
      });
    }

    // Para PostgreSQL local, usar adapter PG
    const pool = new Pool({
      ...pgPoolConfig,
      connectionString: url,
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({
      adapter,
      log: ["query", "warn", "error"],
    });
  } catch (error: any) {
    console.error("❌ [PrismaManager] Erro criando Prisma Client:", {
      message: error.message,
      code: error.code,
    });
    throw new Error(`Falha na conexão: ${error.message}`);
  }
}

/**
 * Obtém ou cria um PrismaClient para a databaseUrl especificada.
 * Os clients são cacheados por URL para reutilização.
 */
export function getPrismaClient(databaseUrl: string): PrismaClient {
  const cached = clients.get(databaseUrl);
  if (cached) return cached;

  const client = createPrismaClientForUrl(databaseUrl);
  clients.set(databaseUrl, client);
  return client;
}

/**
 * Remove um client do cache (útil para reconexão ou cleanup).
 */
export function removePrismaClient(databaseUrl: string): void {
  const client = clients.get(databaseUrl);
  if (client) {
    // @ts-ignore — $disconnect existe no PrismaClient
    client.$disconnect?.().catch(() => {});
    clients.delete(databaseUrl);
  }
}

/**
 * Retorna estatísticas do cache de conexões.
 */
export function getConnectionStats(): { total: number; urls: string[] } {
  return {
    total: clients.size,
    urls: Array.from(clients.keys()).map((u) =>
      u.replace(/:\/\/[^:]+:[^@]+@/, "://***:***@")
    ),
  };
}
