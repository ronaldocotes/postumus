import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    const record = await prisma.fuelRecord.update({ where: { id }, data });
    return NextResponse.json(record);
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao atualizar abastecimento", message: error.message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.fuelRecord.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao remover abastecimento", message: error.message }, { status: 500 });
  }
}
