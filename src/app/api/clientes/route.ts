import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { cpf: { contains: search } },
      { code: { contains: search } },
      { cellphone: { contains: search } },
    ];
  }
  if (status) where.status = status;

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        cobrador: { select: { name: true } },
        _count: { select: { dependents: true } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.client.count({ where }),
  ]);

  return NextResponse.json({ clients, total, pages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const data = await request.json();

  if (data.cpf) {
    const existing = await prisma.client.findUnique({ where: { cpf: data.cpf } });
    if (existing) {
      return NextResponse.json({ error: "CPF já cadastrado" }, { status: 400 });
    }
  }

  const client = await prisma.client.create({ data });
  return NextResponse.json(client, { status: 201 });
}
