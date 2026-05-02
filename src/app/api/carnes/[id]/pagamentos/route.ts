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

    // Buscar parcela com dados do carnê e cliente para criar transação financeira
    const installment = await prisma.installment.findUnique({
      where: { id: installmentId },
      include: {
        carne: {
          include: { client: { select: { id: true, name: true } } },
        },
      },
    });

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

    // Auto-criar transação financeira de receita (somente se não vier da tela de clientes que já cria)
    if (installment && !data.skipFinancial) {
      try {
        await prisma.financialTransaction.create({
          data: {
            type: "INCOME",
            description: `Pagamento carnê ${installment.carne.year} - parcela ${installment.numero}`,
            amount: installment.valor,
            date: new Date(),
            category: "Carnê",
            status: "PAID",
            clientId: installment.carne.clientId,
          },
        });
      } catch (e) {
        // Non-critical: log but don't fail the payment
        console.error("Erro ao criar transação financeira:", e);
      }
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao registrar pagamento:", error);
    return NextResponse.json(
      { error: "Erro ao registrar pagamento", message: error.message },
      { status: 500 }
    );
  }
}
