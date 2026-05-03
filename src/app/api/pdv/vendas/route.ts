import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cashRegisterId = searchParams.get("cashRegisterId");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  const where: any = {};
  if (cashRegisterId) where.cashRegisterId = cashRegisterId;
  if (status) where.status = status;

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        items: true,
        client: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.sale.count({ where }),
  ]);

  return NextResponse.json({ sales, total, pages: Math.ceil(total / limit) });
}
