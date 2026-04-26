import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  const where: any = {};
  if (type) where.type = type;
  if (status) where.status = status;

  const [transactions, total] = await Promise.all([
    prisma.financialTransaction.findMany({
      where,
      include: {
        client: { select: { name: true } },
        supplier: { select: { name: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.financialTransaction.count({ where }),
  ]);

  return NextResponse.json({ transactions, total, pages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const transaction = await prisma.financialTransaction.create({ data });
  return NextResponse.json(transaction, { status: 201 });
}
