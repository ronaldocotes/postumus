import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Total de parcelas vencidas no mês
  const [totalVencidas, totalPagas, carnesVencidos] = await Promise.all([
    prisma.carneParcela.aggregate({
      where: {
        dueDate: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.carneParcela.aggregate({
      where: {
        dueDate: { gte: startOfMonth, lte: endOfMonth },
        status: "PAID",
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.carneParcela.findMany({
      where: {
        dueDate: { gte: startOfMonth, lte: endOfMonth },
        status: { in: ["PENDING", "OVERDUE"] },
      },
      select: { amount: true },
    }),
  ]);

  const totalVencidoValor = totalVencidas._sum.amount || 0;
  const totalPagoValor = totalPagas._sum.amount || 0;
  const totalVencidoCount = totalVencidas._count.id || 0;

  // TR = (Total Pago / Total Vencido) * 100
  const tr = totalVencidoValor > 0 ? (totalPagoValor / totalVencidoValor) * 100 : 0;

  // Inadimplência = parcelas pendentes + atrasadas
  const inadimplentes = carnesVencidos.reduce((sum, p) => sum + (p.amount || 0), 0);
  const taxaInadimplencia = totalVencidoValor > 0 ? (inadimplentes / totalVencidoValor) * 100 : 0;

  return NextResponse.json({
    tr: parseFloat(tr.toFixed(2)),
    taxaInadimplencia: parseFloat(taxaInadimplencia.toFixed(2)),
    totalVencido: totalVencidoValor,
    totalRecebido: totalPagoValor,
    totalInadimplente: inadimplentes,
    parcelasVencidas: totalVencidoCount,
    parcelasPagas: totalPagas._count.id || 0,
    periodo: `${startOfMonth.toLocaleDateString("pt-BR")} - ${endOfMonth.toLocaleDateString("pt-BR")}`,
  });
}
