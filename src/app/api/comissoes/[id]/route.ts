import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, notes } = body;

  const commission = await prisma.commission.findUnique({ where: { id } });
  if (!commission) {
    return NextResponse.json({ error: "Comissão não encontrada" }, { status: 404 });
  }

  const updated = await prisma.commission.update({
    where: { id },
    data: {
      status: status || commission.status,
      paidAt: status === "PAGA" ? new Date() : commission.paidAt,
      notes: notes !== undefined ? notes : commission.notes,
    },
  });

  return NextResponse.json(updated);
}
