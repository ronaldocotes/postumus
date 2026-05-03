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
        { name: { contains: search, mode: "insensitive" } },
        { cnh: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (status) where.status = status;

    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { tickets: true } } },
      }),
      prisma.driver.count({ where }),
    ]);

    return NextResponse.json({ drivers, total, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    console.error("Erro ao buscar motoristas:", error);
    return NextResponse.json({ error: "Erro ao buscar motoristas", message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    if (data.cnh) {
      const existing = await prisma.driver.findUnique({ where: { cnh: data.cnh } });
      if (existing) return NextResponse.json({ error: "CNH já cadastrada" }, { status: 400 });
    }
    Object.keys(data).forEach((key) => {
      if (data[key] === "" || data[key] === undefined) delete data[key];
    });
    const driver = await prisma.driver.create({ data });
    return NextResponse.json(driver, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar motorista:", error);
    return NextResponse.json({ error: "Erro ao criar motorista", message: error.message }, { status: 500 });
  }
}
