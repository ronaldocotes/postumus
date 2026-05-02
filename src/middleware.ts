import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — no auth required
  // /mobile/cliente is the public client portal (login by CPF)
  if (pathname.startsWith("/mobile/cliente")) {
    return NextResponse.next();
  }

  // Check for session cookie - on HTTPS it's __Secure- prefixed
  const sessionToken =
    request.cookies.get("__Secure-next-auth.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value;

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/clientes",
    "/clientes/:path*",
    "/fornecedores",
    "/fornecedores/:path*",
    "/mercadorias",
    "/mercadorias/:path*",
    "/carnes",
    "/carnes/:path*",
    "/financeiro",
    "/financeiro/:path*",
    "/relatorios",
    "/relatorios/:path*",
    "/usuarios",
    "/usuarios/:path*",
    "/admin",
    "/admin/:path*",
    "/estoque",
    "/estoque/:path*",
    "/vendas",
    "/vendas/:path*",
    "/servicos",
    "/servicos/:path*",
    "/mapa",
    "/mapa/:path*",
    "/cobranca",
    "/cobranca/:path*",
    "/empresa",
    "/empresa/:path*",
    "/localidades",
    "/localidades/:path*",
    "/configuracoes",
    "/configuracoes/:path*",
    "/cobrador",
    "/cobrador/:path*",
    "/mobile/gerente",
    "/mobile/gerente/:path*",
  ],
};
