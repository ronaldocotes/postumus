import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        fuelRecords: { orderBy: { date: "desc" }, take: 20 },
        maintenances: { orderBy: { date: "desc" }, take: 20 },
        tickets: { orderBy: { date: "desc" }, take: 20 },
        documents: { orderBy: { expiryDate: "asc" } },
      },
    });
    if (!vehicle) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    return NextResponse.json(vehicle);
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao buscar veículo", message: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.fuelRecords;
    delete data.maintenances;
    delete data.tickets;
    delete data.documents;

    const vehicle = await prisma.vehicle.update({ where: { id }, data });
    return NextResponse.json(vehicle);
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao atualizar veículo", message: error.message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.vehicle.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao remover veículo", message: error.message }, { status: 500 });
  }
}
