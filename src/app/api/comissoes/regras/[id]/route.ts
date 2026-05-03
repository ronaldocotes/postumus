import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.commissionRule.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Regra não encontrada" }, { status: 404 });
  }

  const rule = await prisma.commissionRule.update({
    where: { id },
    data: {
      name: body.name || existing.name,
      targetType: body.targetType || existing.targetType,
      basis: body.basis || existing.basis,
      percentage: body.percentage !== undefined ? parseFloat(body.percentage) : existing.percentage,
      fixedAmount: body.fixedAmount !== undefined ? (body.fixedAmount ? parseFloat(body.fixedAmount) : null) : existing.fixedAmount,
      minValue: body.minValue !== undefined ? (body.minValue ? parseFloat(body.minValue) : null) : existing.minValue,
      maxValue: body.maxValue !== undefined ? (body.maxValue ? parseFloat(body.maxValue) : null) : existing.maxValue,
      productId: body.productId !== undefined ? (body.productId || null) : existing.productId,
      serviceId: body.serviceId !== undefined ? (body.serviceId || null) : existing.serviceId,
      active: body.active !== undefined ? body.active : existing.active,
      endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : null) : existing.endDate,
      notes: body.notes !== undefined ? body.notes : existing.notes,
    },
  });

  return NextResponse.json(rule);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.commissionRule.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
