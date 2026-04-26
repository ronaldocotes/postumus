export { default } from "next-auth/middleware";

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
