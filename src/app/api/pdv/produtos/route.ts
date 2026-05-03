import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  const products = await prisma.product.findMany({
    where: {
      active: true,
      stock: { gt: 0 },
      OR: search
        ? [
            { name: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
          ]
        : undefined,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      stock: true,
    },
    orderBy: { name: "asc" },
    take: 50,
  });

  return NextResponse.json({ products });
}
