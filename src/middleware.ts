import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
