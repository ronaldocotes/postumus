import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      receitasHoje,
      cobrancasPendentes,
      clientesInadimplentes,
      pagamentosHoje,
      ultimosPagamentos,
      receitasMes,
    ] = await Promise.all([
      // Receitas de hoje (parcelas pagas hoje)
      prisma.installment.aggregate({
        where: {
          status: "PAID",
          updatedAt: { gte: startOfToday, lte: endOfToday },
        },
        _sum: { valor: true },
        _count: true,
      }),
      // Cobranças pendentes (parcelas em aberto)
      prisma.installment.count({
        where: { status: { in: ["PENDING", "LATE"] } },
      }),
      // Clientes inadimplentes (com alguma parcela LATE)
      prisma.client.count({
        where: {
          active: true,
          carnes: {
            some: {
              installments: {
                some: { status: "LATE" },
              },
            },
          },
        },
      }),
      // Pagamentos recebidos hoje (count)
      prisma.installment.count({
        where: {
          status: "PAID",
          updatedAt: { gte: startOfToday, lte: endOfToday },
        },
      }),
      // Últimos 10 pagamentos
      prisma.installment.findMany({
        where: { status: "PAID" },
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          carne: {
            include: {
              client: {
                select: { id: true, name: true, phone: true },
              },
            },
          },
        },
      }),
      // Receita do mês
      prisma.installment.aggregate({
        where: {
          status: "PAID",
          updatedAt: { gte: startOfMonth, lte: endOfToday },
        },
        _sum: { valor: true },
      }),
    ]);

    return NextResponse.json({
      receitasHoje: receitasHoje._sum.valor || 0,
      cobrancasPendentes,
      clientesInadimplentes,
      pagamentosHoje,
      receitasMes: receitasMes._sum.valor || 0,
      ultimosPagamentos: ultimosPagamentos.map((inst) => ({
        id: inst.id,
        valor: inst.valor,
        paidAt: inst.updatedAt,
        clienteNome: inst.carne?.client?.name || "—",
        clientePhone: inst.carne?.client?.phone || null,
        numeroParcela: inst.numero,
      })),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[mobile/gerente-stats]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
