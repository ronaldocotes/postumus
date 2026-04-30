import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Buscar dados de uma parada específica com parcelas pendentes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const stop = await prisma.collectionRouteStop.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            address: true,
            neighborhood: true,
            phone: true,
          },
        },
      },
    });

    if (!stop) {
      return NextResponse.json(
        { error: "Parada não encontrada" },
        { status: 404 }
      );
    }

    // Busca parcelas pendentes do cliente
    const installments = await prisma.installment.findMany({
      where: {
        carne: { clientId: stop.client.id },
        status: { in: ["PENDING", "LATE"] },
      },
      orderBy: { numero: "asc" },
      select: {
        id: true,
        numero: true,
        valor: true,
        dueDate: true,
        status: true,
      },
    });

    return NextResponse.json({
      stop: {
        ...stop,
        installments,
      },
    });

  } catch (error: any) {
    console.error("Erro ao buscar parada:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados", message: error.message },
      { status: 500 }
    );
  }
}
