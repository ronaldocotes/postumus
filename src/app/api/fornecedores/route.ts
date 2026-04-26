import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { cnpj: { contains: search } },
        ],
      }
    : {};

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({ where, orderBy: { name: "asc" }, skip: (page - 1) * limit, take: limit }),
    prisma.supplier.count({ where }),
  ]);

  return NextResponse.json({ suppliers, total, pages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  if (data.cnpj) {
    const existing = await prisma.supplier.findUnique({ where: { cnpj: data.cnpj } });
    if (existing) return NextResponse.json({ error: "CNPJ já cadastrado" }, { status: 400 });
  }
  const supplier = await prisma.supplier.create({ data });
  return NextResponse.json(supplier, { status: 201 });
}
