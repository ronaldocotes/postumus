import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  await prisma.dependent.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await request.json();

  const dependent = await prisma.dependent.update({
    where: { id },
    data: {
      name: data.name,
      relationship: data.relationship || "OUTRO",
      cpf: data.cpf || null,
      phone: data.phone || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      notes: data.notes || null,
    },
  });

  return NextResponse.json(dependent);
}
