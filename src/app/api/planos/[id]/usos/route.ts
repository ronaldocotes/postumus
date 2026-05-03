import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const usages = await prisma.planUsage.findMany({
    where: { planId: id },
    include: {
      product: { select: { name: true } },
      service: { select: { name: true } },
      sale: { select: { id: true, finalAmount: true, createdAt: true } },
    },
    orderBy: { usedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ usages });
}
