import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get("vehicleId") || "";
    const driverId = searchParams.get("driverId") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (driverId) where.driverId = driverId;
    if (status) where.status = status;

    const [records, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          vehicle: { select: { plate: true, brand: true, model: true } },
          driver: { select: { name: true } },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    return NextResponse.json({ records, total, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    console.error("Erro ao buscar multas:", error);
    return NextResponse.json({ error: "Erro ao buscar multas", message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const record = await prisma.ticket.create({ data });
    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar multa:", error);
    return NextResponse.json({ error: "Erro ao criar multa", message: error.message }, { status: 500 });
  }
}
