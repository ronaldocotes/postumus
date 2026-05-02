import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";

  const where: Record<string, unknown> = { active: true };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      supplier: { select: { name: true } },
      _count: { select: { movements: true } },
    },
    orderBy: { name: "asc" },
  });

  const filtered =
    status === "all"
      ? products
      : products.filter((p) => {
          if (status === "critical") return p.stock === 0 || (p.minStock > 0 && p.stock < p.minStock);
          if (status === "low") return p.minStock > 0 && p.stock >= p.minStock && p.stock <= p.minStock * 1.5;
          if (status === "normal") return p.minStock === 0 || p.stock > p.minStock * 1.5;
          return true;
        });

  const totalValue = products.reduce((acc, p) => acc + p.stock * (p.cost ?? p.price), 0);
  const lowStock = products.filter((p) => p.minStock > 0 && p.stock <= p.minStock).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const movementsToday = await prisma.stockMovement.count({
    where: { createdAt: { gte: today } },
  });

  return NextResponse.json({
    products: filtered,
    stats: {
      total: products.length,
      lowStock,
      totalValue,
      movementsToday,
    },
  });
}
