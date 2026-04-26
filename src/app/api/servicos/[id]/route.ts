import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const service = await prisma.service.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description || null,
      price: parseFloat(body.price),
      cost: body.cost ? parseFloat(body.cost) : null,
      category: body.category || null,
    },
  });
  return NextResponse.json(service);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.service.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ success: true });
}
