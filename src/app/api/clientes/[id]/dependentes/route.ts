import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params;
  const dependents = await prisma.dependent.findMany({
    where: { clientId, active: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ dependents });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params;
  const data = await request.json();
  const dependent = await prisma.dependent.create({
    data: { ...data, clientId },
  });
  return NextResponse.json(dependent, { status: 201 });
}
