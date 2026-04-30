import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Buscar dados de um pagamento específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        receivedBy: {
          select: {
            name: true,
          },
        },
        installment: {
          select: {
            numero: true,
            valor: true,
            carne: {
              select: {
                year: true,
                client: {
                  select: {
                    name: true,
                    address: true,
                    neighborhood: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ payment });

  } catch (error: any) {
    console.error("Erro ao buscar pagamento:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados", message: error.message },
      { status: 500 }
    );
  }
}
