import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const carne = await prisma.carne.findUnique({
    where: { id },
    include: {
      client: true,
      payments: { orderBy: { installment: "asc" } },
    },
  });
  if (!carne) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(carne);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.payment.deleteMany({ where: { carneId: id } });
  await prisma.carne.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
