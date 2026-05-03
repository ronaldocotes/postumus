import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const type = searchParams.get("type");

  const where: any = {};

  if (start && end) {
    where.startDate = {
      gte: new Date(start),
      lte: new Date(end),
    };
  }

  if (type && type !== "all") {
    where.type = type;
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      client: { select: { id: true, name: true } },
      deathRecord: { select: { id: true, deceasedName: true } },
      createdBy: { select: { name: true } },
      resources: {
        include: {
          resource: { select: { id: true, name: true, type: true } },
        },
      },
    },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const body = await request.json();
  const {
    title,
    type,
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

  if (!title || !startDate) {
    return NextResponse.json({ error: "Título e data de início são obrigatórios" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const event = await tx.event.create({
      data: {
        title,
        type: type || "VELORIO",
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        allDay: allDay || false,
        clientId: clientId || null,
        deathRecordId: deathRecordId || null,
        location: location || null,
        description: description || null,
        color: color || null,
        createdById: userId,
      },
    });

    if (Array.isArray(resourceIds) && resourceIds.length > 0) {
      await tx.eventResource.createMany({
        data: resourceIds.map((rid: string) => ({
          eventId: event.id,
          resourceId: rid,
        })),
      });
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

  return NextResponse.json(fullEvent, { status: 201 });
}
