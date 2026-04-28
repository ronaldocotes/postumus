import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, startOfDay, endOfDay } from "date-fns";

// POST: Gerar rota de cobrança do dia para um cobrador
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { collectorId, date = new Date() } = body;

    if (!collectorId) {
      return NextResponse.json(
        { error: "ID do cobrador é obrigatório" },
        { status: 400 }
      );
    }

    // Verifica se já existe rota para este dia
    const existingRoute = await prisma.collectionRoute.findFirst({
      where: {
        collectorId,
        date: {
          gte: startOfDay(new Date(date)),
          lte: endOfDay(new Date(date)),
        },
      },
    });

    if (existingRoute) {
      return NextResponse.json({
        message: "Rota já existe para este dia",
        routeId: existingRoute.id,
      });
    }

    // Busca cliente do cobrador com parcelas vencendo hoje ou atrasadas
    const clients = await prisma.client.findMany({
      where: {
        cobradorId: collectorId,
        active: true,
      },
      include: {
        carnes: {
          include: {
            installments: {
              where: {
                status: { in: ["PENDING", "LATE"] },
                dueDate: {
                  lte: addDays(new Date(date), 1), // Vencendo hoje ou já vencidas
                },
              },
            },
          },
        },
      },
    });

    // Filtra apenas clientes que têm parcelas pendentes
    const clientsWithPendingInstallments = clients.filter(
      (c) => c.carnes.some((carne) => carne.installments.length > 0)
    );

    if (clientsWithPendingInstallments.length === 0) {
      return NextResponse.json({
        message: "Nenhum cliente com parcelas pendentes encontrado",
        clients: [],
      });
    }

    // Cria a rota
    const route = await prisma.collectionRoute.create({
      data: {
        collectorId,
        date: new Date(date),
        status: "ACTIVE",
      },
    });

    // Cria as paradas da rota
    // Ordenação: primeiro os que estão em modo MANUAL com routeOrder definido
    const sortedClients = clientsWithPendingInstallments.sort((a, b) => {
      // Se ambos têm routeOrder, ordena por ele
      if (a.routeOrder !== null && b.routeOrder !== null) {
        return a.routeOrder - b.routeOrder;
      }
      // Se só um tem routeOrder, ele vem primeiro
      if (a.routeOrder !== null) return -1;
      if (b.routeOrder !== null) return 1;
      // Se nenhum tem, mantém ordem original
      return 0;
    });

    const stops = await Promise.all(
      sortedClients.map((client, index) =>
        prisma.collectionRouteStop.create({
          data: {
            routeId: route.id,
            clientId: client.id,
            order: index + 1,
            visited: false,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Rota gerada com ${stops.length} paradas`,
      route: {
        id: route.id,
        date: route.date,
        stops: stops.map((s, i) => ({
          order: s.order,
          client: sortedClients[i].name,
          neighborhood: sortedClients[i].neighborhood,
        })),
      },
    });

  } catch (error) {
    console.error("Erro ao gerar rota:", error);
    return NextResponse.json(
      { error: "Erro interno ao gerar rota" },
      { status: 500 }
    );
  }
}

// GET: Buscar rota do dia para um cobrador
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collectorId = searchParams.get("collectorId");
    const date = searchParams.get("date") || new Date().toISOString();

    if (!collectorId) {
      return NextResponse.json(
        { error: "ID do cobrador é obrigatório" },
        { status: 400 }
      );
    }

    const route = await prisma.collectionRoute.findFirst({
      where: {
        collectorId,
        date: {
          gte: startOfDay(new Date(date)),
          lte: endOfDay(new Date(date)),
        },
      },
      include: {
        stops: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                phone: true,
                address: true,
                neighborhood: true,
                lat: true,
                lng: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!route) {
      return NextResponse.json({
        message: "Nenhuma rota encontrada para este dia",
        route: null,
      });
    }

    // Busca parcelas pendentes de cada cliente
    const stopsWithInstallments = await Promise.all(
      route.stops.map(async (stop) => {
        const installments = await prisma.installment.findMany({
          where: {
            carne: { clientId: stop.client.id },
            status: { in: ["PENDING", "LATE"] },
          },
          select: {
            id: true,
            numero: true,
            valor: true,
            dueDate: true,
            status: true,
          },
        });

        return {
          ...stop,
          installments,
        };
      })
    );

    return NextResponse.json({
      route: {
        id: route.id,
        date: route.date,
        status: route.status,
        stops: stopsWithInstallments,
      },
    });

  } catch (error) {
    console.error("Erro ao buscar rota:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar rota" },
      { status: 500 }
    );
  }
}
