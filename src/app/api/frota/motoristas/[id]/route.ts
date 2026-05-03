import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const driver = await prisma.driver.findUnique({ where: { id }, include: { tickets: true } });
    if (!driver) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    return NextResponse.json(driver);
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao buscar motorista", message: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.tickets;
    const driver = await prisma.driver.update({ where: { id }, data });
    return NextResponse.json(driver);
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao atualizar motorista", message: error.message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.driver.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao remover motorista", message: error.message }, { status: 500 });
  }
}
