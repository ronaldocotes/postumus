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
    "/planos",
    "/planos/:path*",
    "/obitos",
    "/obitos/:path*",
    "/agenda",
    "/agenda/:path*",
    "/orcamentos",
    "/orcamentos/:path*",
    "/comissoes",
    "/comissoes/:path*",
    "/frota",
    "/frota/:path*",
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
    "/pdv",
    "/pdv/:path*",
    "/caixa",
    "/caixa/:path*",
    "/servicos",
    "/servicos/:path*",
    "/documentos",
    "/documentos/:path*",
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
    "/mobile/gerente",
    "/mobile/gerente/:path*",
    "/mobile/cobrador",
    "/mobile/cobrador/:path*",
  ],
};
