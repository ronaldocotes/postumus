import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;

  const plan = await prisma.assuredPlan.findUnique({
    where: { clientId },
    include: {
      client: { select: { id: true, name: true, cpf: true, phone: true } },
      coverages: true,
      _count: { select: { usages: true } },
    },
  });

  if (!plan) {
    return NextResponse.json(null);
  }

  return NextResponse.json(plan);
}
