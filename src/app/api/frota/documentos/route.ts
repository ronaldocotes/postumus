import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get("vehicleId") || "";
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (type) where.type = type;
    if (status) where.status = status;

    const [records, total] = await Promise.all([
      prisma.vehicleDocument.findMany({
        where,
        orderBy: { expiryDate: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { vehicle: { select: { plate: true, brand: true, model: true } } },
      }),
      prisma.vehicleDocument.count({ where }),
    ]);

    return NextResponse.json({ records, total, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    console.error("Erro ao buscar documentos:", error);
    return NextResponse.json({ error: "Erro ao buscar documentos", message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const record = await prisma.vehicleDocument.create({ data });
    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar documento:", error);
    return NextResponse.json({ error: "Erro ao criar documento", message: error.message }, { status: 500 });
  }
}
