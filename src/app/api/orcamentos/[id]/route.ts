import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const budget = await prisma.budget.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, cpf: true, phone: true } },
      items: true,
      createdBy: { select: { name: true } },
    },
  });

  if (!budget) {
    return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
  }

  return NextResponse.json(budget);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.budget.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
  }

  const { status, notes } = body;

  const updated = await prisma.budget.update({
    where: { id },
    data: {
      status: status || existing.status,
      notes: notes !== undefined ? notes : existing.notes,
    },
  });

  return NextResponse.json(updated);
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.$transaction(async (tx) => {
    await tx.budgetItem.deleteMany({ where: { budgetId: id } });
    await tx.budget.delete({ where: { id } });
  });

  return NextResponse.json({ success: true });
}
