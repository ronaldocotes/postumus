import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get("vehicleId") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;

    const [records, total] = await Promise.all([
      prisma.fuelRecord.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { vehicle: { select: { plate: true, brand: true, model: true } } },
      }),
      prisma.fuelRecord.count({ where }),
    ]);

    return NextResponse.json({ records, total, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    console.error("Erro ao buscar abastecimentos:", error);
    return NextResponse.json({ error: "Erro ao buscar abastecimentos", message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const record = await prisma.fuelRecord.create({ data });
    // Atualizar quilometragem do veículo se for maior
    if (data.mileage && data.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
      if (vehicle && data.mileage > vehicle.mileage) {
        await prisma.vehicle.update({ where: { id: data.vehicleId }, data: { mileage: data.mileage } });
      }
    }
    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar abastecimento:", error);
    return NextResponse.json({ error: "Erro ao criar abastecimento", message: error.message }, { status: 500 });
  }
}
