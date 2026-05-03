import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const history = await prisma.assuredPlanHistory.findMany({
    where: { planId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ history });
}
