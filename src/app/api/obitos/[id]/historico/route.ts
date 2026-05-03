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
  const { action, oldValue, newValue, notes } = body;

  const entry = await prisma.deathRecordHistory.create({
    data: {
      deathRecordId: id,
      action,
      oldValue: oldValue || null,
      newValue: newValue || null,
      notes: notes || null,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
