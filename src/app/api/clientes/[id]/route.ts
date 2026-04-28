import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      dependents: { where: { active: true }, orderBy: { name: "asc" } },
      cobrador: { select: { id: true, name: true } },
      carnes: {
        include: {
          installments: {
            orderBy: { numero: "asc" },
            include: { payment: true },
          },
        },
        orderBy: { year: "desc" },
      },
    },
  });
  if (!client) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await request.json();
  const client = await prisma.client.update({ where: { id }, data });
  return NextResponse.json(client);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.client.update({ where: { id }, data: { active: false, status: "CANCELLED", cancelDate: new Date() } });
  return NextResponse.json({ success: true });
}
