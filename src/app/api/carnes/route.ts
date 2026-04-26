import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const year = searchParams.get("year");
  const limit = 20;

  const where: any = {};
  if (search) {
    where.client = { name: { contains: search, mode: "insensitive" } };
  }
  if (year) {
    where.year = parseInt(year);
  }

  const [carnes, total] = await Promise.all([
    prisma.carne.findMany({
      where,
      include: {
        client: { select: { name: true, cpf: true } },
        payments: { orderBy: { installment: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.carne.count({ where }),
  ]);

  return NextResponse.json({ carnes, total, pages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const { clientId, year, totalValue, installments = 12, description } = data;

  const installmentValue = totalValue / installments;

  const carne = await prisma.carne.create({
    data: {
      clientId,
      year,
      totalValue,
      installments,
      description,
      payments: {
        create: Array.from({ length: installments }, (_, i) => ({
          installment: i + 1,
          dueDate: new Date(year, i, 10),
          amount: Math.round(installmentValue * 100) / 100,
          status: "PENDING",
        })),
      },
    },
    include: { payments: true },
  });

  return NextResponse.json(carne, { status: 201 });
}
