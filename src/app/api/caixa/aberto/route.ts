import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const openRegister = await prisma.cashRegister.findFirst({
    where: { status: "OPEN" },
    include: {
      openedBy: { select: { name: true } },
      _count: { select: { sales: true, movements: true } },
    },
  });

  if (!openRegister) {
    return NextResponse.json(null);
  }

  // Calcular saldo teórico
  const salesAgg = await prisma.sale.aggregate({
    where: { cashRegisterId: openRegister.id, status: "PAID" },
    _sum: { finalAmount: true },
  });

  const movementsAgg = await prisma.cashRegisterMovement.groupBy({
    by: ["type"],
    where: { cashRegisterId: openRegister.id },
    _sum: { amount: true },
  });

  const totalSales = salesAgg._sum.finalAmount || 0;
  const totalSangria = movementsAgg.find((m) => m.type === "SANGRIA")?._sum.amount || 0;
  const totalReforco = movementsAgg.find((m) => m.type === "REFORCO")?._sum.amount || 0;

  const theoreticalBalance = openRegister.initialAmount + totalSales - totalSangria + totalReforco;

  return NextResponse.json({
    ...openRegister,
    theoreticalBalance,
    totalSales,
    totalSangria,
    totalReforco,
  });
}
