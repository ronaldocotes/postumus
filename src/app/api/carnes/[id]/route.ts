import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const carne = await prisma.carne.findUnique({
    where: { id },
    include: {
      client: true,
      installments: {
        orderBy: { numero: "asc" },
        include: {
          Payment: true,
        },
      },
    },
  });
  if (!carne) return NextResponse.json({ error: "Nao encontrado" }, { status: 404 });
  return NextResponse.json(carne);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Deleta os pagamentos relacionados às parcelas primeiro
  await prisma.payment.deleteMany({
    where: {
      installment: {
        carneId: id,
      },
    },
  });
  // Deleta as parcelas
  await prisma.installment.deleteMany({ where: { carneId: id } });
  // Deleta o carne
  await prisma.carne.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
