import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const sale = await prisma.serviceSale.update({
    where: { id },
    data: {
      status: body.status,
      paymentMethod: body.paymentMethod || undefined,
      paidAt: body.status === "PAID" ? new Date() : undefined,
      notes: body.notes || undefined,
    },
  });
  return NextResponse.json(sale);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.serviceSale.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
