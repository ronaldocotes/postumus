// src/lib/company-context.ts
// Resolve a empresa atual a partir da requisição (header, cookie ou query param)

import { cookies, headers } from "next/headers";
import { prisma } from "./prisma";

export interface CompanyContext {
  companyId: string;
  databaseUrl: string;
  companyName: string;
}

/**
 * Busca a empresa pelo ID no banco principal (catalog).
 * O banco principal contém apenas Company e User (autenticação).
 */
export async function resolveCompanyById(companyId: string): Promise<CompanyContext | null> {
  if (!companyId) return null;

  const company = await prisma.company.findUnique({
    where: { id: companyId, active: true },
  });

  if (!company?.databaseUrl) {
    console.warn(`⚠️ Empresa ${companyId} não encontrada ou sem databaseUrl`);
    return null;
  }

  return {
    companyId: company.id,
    databaseUrl: company.databaseUrl,
    companyName: company.tradeName || company.name,
  };
}

/**
 * Extrai o companyId da requisição na seguinte ordem:
 * 1. Header x-company-id
 * 2. Cookie company_id
 * 3. Query param ?companyId=...
 */
export async function getCompanyIdFromRequest(request?: Request): Promise<string | null> {
  // 1. Tenta header
  const h = await headers();
  const headerId = h.get("x-company-id");
  if (headerId) return headerId;

  // 2. Tenta cookie
  const c = await cookies();
  const cookieId = c.get("company_id")?.value;
  if (cookieId) return cookieId;

  // 3. Tenta query param (se request foi passada)
  if (request) {
    const url = new URL(request.url);
    const queryId = url.searchParams.get("companyId");
    if (queryId) return queryId;
  }

  return null;
}

/**
 * Resolve o contexto completo da empresa a partir da requisição.
 */
export async function resolveCompanyContext(request?: Request): Promise<CompanyContext | null> {
  const companyId = await getCompanyIdFromRequest(request);
  if (!companyId) return null;
  return resolveCompanyById(companyId);
}
