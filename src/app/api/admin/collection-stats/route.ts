import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, eachDayOfInterval, format } from "date-fns";

// GET: Estatísticas de cobrança para administradores
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || format(new Date(), "yyyy-MM-dd");
    const endDate = searchParams.get("endDate") || format(new Date(), "yyyy-MM-dd");
    const collectorId = searchParams.get("collectorId") || "all";

    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));

    // Busca rotas no período
    const routes = await prisma.collectionRoute.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
        ...(collectorId !== "all" ? { collectorId } : {}),
      },
      include: {
        collector: {
          select: {
            id: true,
            name: true,
          },
        },
        stops: {
          include: {
            client: {
              include: {
                carnes: {
                  include: {
                    installments: {
                      where: {
                        status: "PAID",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Calcula estatísticas gerais
    const totalRoutes = routes.length;
    const totalStops = routes.reduce((sum, r) => sum + r.stops.length, 0);
    const visitedStops = routes.reduce(
      (sum, r) => sum + r.stops.filter((s) => s.visited).length,
      0
    );
    const pendingStops = totalStops - visitedStops;

    // Calcula valores cobrados
    let totalCollected = 0;
    let totalExpected = 0;

    routes.forEach((route) => {
      route.stops.forEach((stop) => {
        stop.client.carnes.forEach((carne) => {
          carne.installments.forEach((inst) => {
            totalExpected += inst.valor;
            if (inst.status === "PAID") {
              totalCollected += inst.valor;
            }
          });
        });
      });
    });

    const collectionRate = totalStops > 0 ? (visitedStops / totalStops) * 100 : 0;

    // Estatísticas por cobrador
    const collectorMap = new Map();
    routes.forEach((route) => {
      const collector = route.collector;
      if (!collectorMap.has(collector.id)) {
        collectorMap.set(collector.id, {
          id: collector.id,
          name: collector.name,
          totalStops: 0,
          visitedStops: 0,
          totalCollected: 0,
        });
      }

      const stats = collectorMap.get(collector.id);
      stats.totalStops += route.stops.length;
      stats.visitedStops += route.stops.filter((s) => s.visited).length;

      route.stops.forEach((stop) => {
        stop.client.carnes.forEach((carne) => {
          carne.installments.forEach((inst) => {
            if (inst.status === "PAID") {
              stats.totalCollected += inst.valor;
            }
          });
        });
      });
    });

    const collectors = Array.from(collectorMap.values()).map((c) => ({
      ...c,
      collectionRate: c.totalStops > 0 ? (c.visitedStops / c.totalStops) * 100 : 0,
    }));

    // Estatísticas diárias
    const days = eachDayOfInterval({ start, end });
    const dailyStats = days.map((day) => {
      const dayRoutes = routes.filter(
        (r) => format(r.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
      );

      const dayStops = dayRoutes.reduce((sum, r) => sum + r.stops.length, 0);
      const dayVisited = dayRoutes.reduce(
        (sum, r) => sum + r.stops.filter((s) => s.visited).length,
        0
      );

      let dayCollected = 0;
      dayRoutes.forEach((route) => {
        route.stops.forEach((stop) => {
          stop.client.carnes.forEach((carne) => {
            carne.installments.forEach((inst) => {
              if (inst.status === "PAID") {
                dayCollected += inst.valor;
              }
            });
          });
        });
      });

      return {
        date: format(day, "yyyy-MM-dd"),
        stops: dayStops,
        visited: dayVisited,
        collected: dayCollected,
      };
    });

    return NextResponse.json({
      stats: {
        totalRoutes,
        totalStops,
        visitedStops,
        pendingStops,
        totalCollected,
        totalExpected,
        collectionRate,
        collectors,
        dailyStats,
      },
    });

  } catch (error: any) {
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas", message: error.message },
      { status: 500 }
    );
  }
}
