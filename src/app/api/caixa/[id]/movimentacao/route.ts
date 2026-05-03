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
  const type = body.type;
  const amount = parseFloat(body.amount);
  const reason = body.reason || "";

  if (!["SANGRIA", "REFORCO"].includes(type)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }
  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
  }

  const register = await prisma.cashRegister.findUnique({
    where: { id },
  });

  if (!register) {
    return NextResponse.json({ error: "Caixa não encontrado" }, { status: 404 });
  }
  if (register.status !== "OPEN") {
    return NextResponse.json({ error: "Caixa está fechado" }, { status: 400 });
  }

  // Calcular saldo atual para validar sangria
  if (type === "SANGRIA") {
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
    const currentBalance = register.initialAmount + totalSales - totalSangria + totalReforco;

    if (amount > currentBalance) {
      return NextResponse.json(
        { error: "Valor da sangria excede o saldo disponível" },
        { status: 400 }
      );
    }
  }

  const movement = await prisma.cashRegisterMovement.create({
    data: {
      cashRegisterId: id,
      type,
      amount,
      reason,
      createdById: userId,
    },
    include: {
      createdBy: { select: { name: true } },
    },
  });

  return NextResponse.json(movement, { status: 201 });
}
