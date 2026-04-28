import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: paymentId } = await params;
  const data = await request.json();

  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      paidAmount: data.paidAmount,
      paidAt: new Date(),
      paymentMethod: data.paymentMethod || "CASH",
      receivedById: data.receivedById,
      notes: data.notes,
    },
  });

  return NextResponse.json(payment);
}
