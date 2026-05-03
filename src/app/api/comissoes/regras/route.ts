import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const active = searchParams.get("active");

  const where: any = {};
  if (active === "true") where.active = true;

  const rules = await prisma.commissionRule.findMany({
    where,
    include: {
      product: { select: { name: true } },
      service: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ rules });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const {
    name,
    targetType,
    basis,
    percentage,
    fixedAmount,
    minValue,
    maxValue,
    productId,
    serviceId,
    startDate,
    endDate,
    notes,
  } = body;

  if (!name || !percentage) {
    return NextResponse.json({ error: "Nome e percentual são obrigatórios" }, { status: 400 });
  }

  const rule = await prisma.commissionRule.create({
    data: {
      name,
      targetType: targetType || "VENDEDOR",
      basis: basis || "VENDA_TOTAL",
      percentage: parseFloat(percentage),
      fixedAmount: fixedAmount ? parseFloat(fixedAmount) : null,
      minValue: minValue ? parseFloat(minValue) : null,
      maxValue: maxValue ? parseFloat(maxValue) : null,
      productId: productId || null,
      serviceId: serviceId || null,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      notes: notes || null,
    },
  });

  return NextResponse.json(rule, { status: 201 });
}
