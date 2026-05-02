import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma-fixed";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const data = await request.json();
    const { installmentId, paymentMethod, latitude, longitude, notes } = data;

    if (!installmentId || !paymentMethod) {
      return NextResponse.json(
        { error: "installmentId e paymentMethod são obrigatórios" },
        { status: 400 }
      );
    }

    // Check if already paid
    const existing = await prisma.payment.findUnique({
      where: { installmentId },
    });
    if (existing) {
      return NextResponse.json({ error: "Parcela já paga" }, { status: 400 });
    }

    // Get installment details
    const installment = await prisma.installment.findUnique({
      where: { id: installmentId },
      include: {
        carne: {
          include: { client: { select: { id: true, name: true } } },
        },
      },
    });

    if (!installment) {
      return NextResponse.json({ error: "Parcela não encontrada" }, { status: 404 });
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        installmentId,
        paidAmount: installment.valor,
        paidAt: new Date(),
        paymentMethod: paymentMethod,
        receivedById: userId,
        notes: notes || null,
      },
    });

    // Update installment status
    await prisma.installment.update({
      where: { id: installmentId },
      data: { status: "PAID" },
    });

    // Create financial transaction
    try {
      await prisma.financialTransaction.create({
        data: {
          type: "INCOME",
          description: `Cobrador: ${installment.carne.client.name} - carnê ${installment.carne.year} parcela ${installment.numero}`,
          amount: installment.valor,
          date: new Date(),
          category: "Carnê",
          status: "PAID",
          clientId: installment.carne.clientId,
        },
      });
    } catch (e) {
      console.error("Erro ao criar transação financeira:", e);
    }

    // Log visit with geolocation
    if (latitude && longitude) {
      try {
        await prisma.visitLog.create({
          data: {
            clientId: installment.carne.clientId,
            collectorId: userId,
            type: "PAYMENT",
            lat: latitude,
            lng: longitude,
            notes: `Pagamento parcela ${installment.numero} - ${paymentMethod}`,
          },
        });
      } catch (e) {
        console.error("Erro ao registrar visita:", e);
      }
    }

    return NextResponse.json(
      {
        success: true,
        payment,
        clientName: installment.carne.client.name,
        valor: installment.valor,
        numero: installment.numero,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erro ao registrar pagamento:", error);
    return NextResponse.json(
      { error: "Erro ao registrar pagamento", message: error.message },
      { status: 500 }
    );
  }
}
