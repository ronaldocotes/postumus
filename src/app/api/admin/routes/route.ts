import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

// GET: Listar todas as rotas ativas do dia (para admin)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString();
    const collectorId = searchParams.get("collectorId");

    const where: any = {
      date: {
        gte: startOfDay(new Date(date)),
        lte: endOfDay(new Date(date)),
      },
    };

    if (collectorId) {
      where.collectorId = collectorId;
    }

    const routes = await prisma.collectionRoute.findMany({
      where,
      include: {
        collector: {
          select: { id: true, name: true, zone: true },
        },
        stops: {
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
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calcula estatísticas para cada rota
    const routesWithStats = routes.map((route) => {
      const total = route.stops.length;
      const visited = route.stops.filter((s) => s.visited).length;
      const pending = total - visited;
      const progress = total > 0 ? Math.round((visited / total) * 100) : 0;

      return {
        ...route,
        stats: { total, visited, pending, progress },
      };
    });

    return NextResponse.json({ routes: routesWithStats });
  } catch (error) {
    console.error("Erro ao buscar rotas:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar rotas" },
      { status: 500 }
    );
  }
}
