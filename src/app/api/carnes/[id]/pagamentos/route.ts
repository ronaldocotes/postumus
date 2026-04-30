import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: installmentId } = await params;
    const data = await request.json();

    // Verificar se já existe pagamento para esta parcela
    const existing = await prisma.payment.findUnique({
      where: { installmentId },
    });

    if (existing) {
      return NextResponse.json({ error: "Parcela já paga" }, { status: 400 });
    }

    // Criar pagamento
    const payment = await prisma.payment.create({
      data: {
        installmentId,
        paidAmount: data.paidAmount,
        paidAt: new Date(),
        paymentMethod: data.paymentMethod || "CASH",
        receivedById: data.receivedById || null,
        notes: data.notes || null,
      },
    });

    // Atualizar status da parcela
    await prisma.installment.update({
      where: { id: installmentId },
      data: { status: "PAID" },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao registrar pagamento:", error);
    return NextResponse.json(
      { error: "Erro ao registrar pagamento", message: error.message },
      { status: 500 }
    );
  }
}
