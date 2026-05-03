import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const {
    title,
    type,
    status,
    startDate,
    endDate,
    allDay,
    clientId,
    deathRecordId,
    location,
    description,
    color,
    resourceIds,
  } = body;

  const result = await prisma.$transaction(async (tx) => {
    const event = await tx.event.update({
      where: { id },
      data: {
        title: title || existing.title,
        type: type || existing.type,
        status: status || existing.status,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate,
        allDay: allDay !== undefined ? allDay : existing.allDay,
        clientId: clientId !== undefined ? (clientId || null) : existing.clientId,
        deathRecordId: deathRecordId !== undefined ? (deathRecordId || null) : existing.deathRecordId,
        location: location !== undefined ? location : existing.location,
        description: description !== undefined ? description : existing.description,
        color: color !== undefined ? color : existing.color,
      },
    });

    if (Array.isArray(resourceIds)) {
      await tx.eventResource.deleteMany({ where: { eventId: id } });
      if (resourceIds.length > 0) {
        await tx.eventResource.createMany({
          data: resourceIds.map((rid: string) => ({
            eventId: id,
            resourceId: rid,
          })),
        });
      }
    }

    return event;
  });

  const fullEvent = await prisma.event.findUnique({
    where: { id: result.id },
    include: {
      client: { select: { id: true, name: true } },
      deathRecord: { select: { id: true, deceasedName: true } },
      resources: {
        include: {
          resource: { select: { id: true, name: true, type: true } },
        },
      },
    },
  });

  return NextResponse.json(fullEvent);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.$transaction(async (tx) => {
    await tx.eventResource.deleteMany({ where: { eventId: id } });
    await tx.event.delete({ where: { id } });
  });

  return NextResponse.json({ success: true });
}
