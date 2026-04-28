import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json(
        { error: "Nao autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { clientId, type, notes, nextVisitDate, lat, lng } = body;

    if (!clientId || !type) {
      return NextResponse.json(
        { error: "clientId e type sao obrigatorios" },
        { status: 400 }
      );
    }

    // Cria o log de visita
    const visitLog = await prisma.visitLog.create({
      data: {
        clientId,
        collectorId: (session?.user as any)?.id,
        type,
        notes,
        nextVisitDate: nextVisitDate ? new Date(nextVisitDate) : null,
        lat,
        lng,
      },
    });

    // Se for pagamento, atualiza a parada da rota
    if (type === "PAYMENT") {
      await prisma.collectionRouteStop.updateMany({
        where: {
          clientId,
          visited: false,
        },
        data: {
          visited: true,
          visitedAt: new Date(),
          latitude: lat,
          longitude: lng,
        },
      });
    }

    return NextResponse.json({
      success: true,
      visitLog,
    });

  } catch (error) {
    console.error("Erro ao criar visit log:", error);
    return NextResponse.json(
      { error: "Erro interno ao registrar visita" },
      { status: 500 }
    );
  }
}

// GET: Buscar historico de visitas de um cliente
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId e obrigatorio" },
        { status: 400 }
      );
    }

    const logs = await prisma.visitLog.findMany({
      where: { clientId },
      include: {
        collector: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ logs });

  } catch (error) {
    console.error("Erro ao buscar visit logs:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar historico" },
      { status: 500 }
    );
  }
}
