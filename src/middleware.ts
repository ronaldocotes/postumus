import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth pages and API routes
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes("favicon")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: "postumus-prod-secret-2026-secure",
    secureCookie: process.env.NODE_ENV === "production",
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clientes/:path*",
    "/fornecedores/:path*",
    "/mercadorias/:path*",
    "/carnes/:path*",
    "/financeiro/:path*",
    "/relatorios/:path*",
    "/usuarios/:path*",
  ],
};
