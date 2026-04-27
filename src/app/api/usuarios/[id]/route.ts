import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await request.json();

  const updateData: any = {
    name: data.name,
    email: data.email,
    role: data.role,
  };

  if (data.hasOwnProperty('active')) {
    updateData.active = data.active;
  }

  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, active: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.user.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ success: true });
}
