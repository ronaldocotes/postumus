import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest) {
  try {
    const [
      totalVehicles,
      activeVehicles,
      maintenanceVehicles,
      totalDrivers,
      activeDrivers,
      totalFuelCost,
      totalMaintenanceCost,
      totalTicketsValue,
      pendingTicketsValue,
      upcomingDocuments,
      recentFuelRecords,
      recentMaintenances,
    ] = await Promise.all([
      prisma.vehicle.count({ where: { active: true } }),
      prisma.vehicle.count({ where: { active: true, status: "ACTIVE" } }),
      prisma.vehicle.count({ where: { active: true, status: "MAINTENANCE" } }),
      prisma.driver.count({ where: { active: true } }),
      prisma.driver.count({ where: { active: true, status: "ACTIVE" } }),
      prisma.fuelRecord.aggregate({ _sum: { totalValue: true } }).then((r) => r._sum.totalValue || 0),
      prisma.maintenance.aggregate({ _sum: { cost: true } }).then((r) => r._sum.cost || 0),
      prisma.ticket.aggregate({ _sum: { value: true } }).then((r) => r._sum.value || 0),
      prisma.ticket
        .aggregate({ _sum: { value: true }, where: { status: "PENDING" } })
        .then((r) => r._sum.value || 0),
      prisma.vehicleDocument.count({
        where: {
          status: { in: ["EXPIRING", "EXPIRED"] },
        },
      }),
      prisma.fuelRecord.findMany({
        take: 5,
        orderBy: { date: "desc" },
        include: { vehicle: { select: { plate: true, brand: true, model: true } } },
      }),
      prisma.maintenance.findMany({
        take: 5,
        orderBy: { date: "desc" },
        include: { vehicle: { select: { plate: true, brand: true, model: true } } },
      }),
    ]);

    return NextResponse.json({
      totalVehicles,
      activeVehicles,
      maintenanceVehicles,
      totalDrivers,
      activeDrivers,
      totalFuelCost,
      totalMaintenanceCost,
      totalTicketsValue,
      pendingTicketsValue,
      upcomingDocuments,
      recentFuelRecords,
      recentMaintenances,
    });
  } catch (error: any) {
    console.error("Erro ao buscar dashboard de frota:", error);
    return NextResponse.json({ error: "Erro ao buscar dashboard", message: error.message }, { status: 500 });
  }
}
