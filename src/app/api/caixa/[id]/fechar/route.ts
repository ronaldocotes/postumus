import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const { id } = await params;

  const body = await request.json();
  const closedAmount = parseFloat(body.closedAmount);
  if (isNaN(closedAmount)) {
    return NextResponse.json({ error: "Valor de fechamento inválido" }, { status: 400 });
  }

  const register = await prisma.cashRegister.findUnique({
    where: { id },
  });

  if (!register) {
    return NextResponse.json({ error: "Caixa não encontrado" }, { status: 404 });
  }
  if (register.status !== "OPEN") {
    return NextResponse.json({ error: "Caixa já está fechado" }, { status: 400 });
  }

  // Calcular saldo teórico
  const salesAgg = await prisma.sale.aggregate({
    where: { cashRegisterId: id, status: "PAID" },
    _sum: { finalAmount: true },
  });
  const movementsAgg = await prisma.cashRegisterMovement.groupBy({
    by: ["type"],
    where: { cashRegisterId: id },
    _sum: { amount: true },
  });

  const totalSales = salesAgg._sum.finalAmount || 0;
  const totalSangria = movementsAgg.find((m) => m.type === "SANGRIA")?._sum.amount || 0;
  const totalReforco = movementsAgg.find((m) => m.type === "REFORCO")?._sum.amount || 0;
  const theoreticalBalance = register.initialAmount + totalSales - totalSangria + totalReforco;
  const difference = closedAmount - theoreticalBalance;

  const updated = await prisma.cashRegister.update({
    where: { id },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
      closedById: userId,
      closedAmount,
    },
    include: {
      openedBy: { select: { name: true } },
      closedBy: { select: { name: true } },
    },
  });

  return NextResponse.json({
    ...updated,
    theoreticalBalance,
    difference,
    totalSales,
    totalSangria,
    totalReforco,
  });
}
