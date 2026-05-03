import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    const where: any = { active: true };
    if (search) {
      where.OR = [
        { plate: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { chassis: { contains: search } },
        { renavam: { contains: search } },
      ];
    }
    if (status) where.status = status;

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { fuelRecords: true, maintenances: true, tickets: true, documents: true } },
        },
      }),
      prisma.vehicle.count({ where }),
    ]);

    return NextResponse.json({ vehicles, total, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    console.error("Erro ao buscar veículos:", error);
    return NextResponse.json({ error: "Erro ao buscar veículos", message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (data.plate) {
      const existing = await prisma.vehicle.findUnique({ where: { plate: data.plate } });
      if (existing) return NextResponse.json({ error: "Placa já cadastrada" }, { status: 400 });
    }

    Object.keys(data).forEach((key) => {
      if (data[key] === "" || data[key] === undefined) delete data[key];
    });

    const vehicle = await prisma.vehicle.create({ data });
    return NextResponse.json(vehicle, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar veículo:", error);
    return NextResponse.json({ error: "Erro ao criar veículo", message: error.message }, { status: 500 });
  }
}
