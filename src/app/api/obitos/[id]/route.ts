import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const record = await prisma.deathRecord.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, cpf: true, phone: true } },
      createdBy: { select: { name: true } },
      services: {
        include: {
          service: { select: { name: true } },
          product: { select: { name: true } },
        },
      },
      history: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!record) {
    return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
  }

  return NextResponse.json(record);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.deathRecord.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
  }

  const {
    deceasedName,
    deceasedBirthDate,
    deceasedCpf,
    deceasedRg,
    dateOfDeath,
    timeOfDeath,
    placeOfDeath,
    placeName,
    deathCertificate,
    causeOfDeath,
    doctorName,
    doctorCrm,
    releaseTime,
    arrivalTime,
    funeralDate,
    burialDate,
    burialType,
    cemeteryName,
    graveLocation,
    responsibleName,
    responsiblePhone,
    responsibleRelation,
    status,
    notes,
  } = body;

  const result = await prisma.$transaction(async (tx) => {
    const record = await tx.deathRecord.update({
      where: { id },
      data: {
        deceasedName: deceasedName || existing.deceasedName,
        deceasedBirthDate: deceasedBirthDate !== undefined
          ? (deceasedBirthDate ? new Date(deceasedBirthDate) : null)
          : existing.deceasedBirthDate,
        deceasedCpf: deceasedCpf !== undefined ? deceasedCpf : existing.deceasedCpf,
        deceasedRg: deceasedRg !== undefined ? deceasedRg : existing.deceasedRg,
        dateOfDeath: dateOfDeath ? new Date(dateOfDeath) : existing.dateOfDeath,
        timeOfDeath: timeOfDeath !== undefined ? timeOfDeath : existing.timeOfDeath,
        placeOfDeath: placeOfDeath || existing.placeOfDeath,
        placeName: placeName !== undefined ? placeName : existing.placeName,
        deathCertificate: deathCertificate !== undefined ? deathCertificate : existing.deathCertificate,
        causeOfDeath: causeOfDeath !== undefined ? causeOfDeath : existing.causeOfDeath,
        doctorName: doctorName !== undefined ? doctorName : existing.doctorName,
        doctorCrm: doctorCrm !== undefined ? doctorCrm : existing.doctorCrm,
        releaseTime: releaseTime !== undefined
          ? (releaseTime ? new Date(releaseTime) : null)
          : existing.releaseTime,
        arrivalTime: arrivalTime !== undefined
          ? (arrivalTime ? new Date(arrivalTime) : null)
          : existing.arrivalTime,
        funeralDate: funeralDate !== undefined
          ? (funeralDate ? new Date(funeralDate) : null)
          : existing.funeralDate,
        burialDate: burialDate !== undefined
          ? (burialDate ? new Date(burialDate) : null)
          : existing.burialDate,
        burialType: burialType !== undefined ? burialType : existing.burialType,
        cemeteryName: cemeteryName !== undefined ? cemeteryName : existing.cemeteryName,
        graveLocation: graveLocation !== undefined ? graveLocation : existing.graveLocation,
        responsibleName: responsibleName || existing.responsibleName,
        responsiblePhone: responsiblePhone !== undefined ? responsiblePhone : existing.responsiblePhone,
        responsibleRelation: responsibleRelation !== undefined ? responsibleRelation : existing.responsibleRelation,
        status: status || existing.status,
        notes: notes !== undefined ? notes : existing.notes,
      },
    });

    // Registrar histórico se status mudou
    if (status && status !== existing.status) {
      await tx.deathRecordHistory.create({
        data: {
          deathRecordId: id,
          action: "MUDANCA_STATUS",
          oldValue: existing.status,
          newValue: status,
          notes: `Status alterado de ${existing.status} para ${status}`,
        },
      });
    }

    return record;
  });

  const fullRecord = await prisma.deathRecord.findUnique({
    where: { id: result.id },
    include: {
      client: { select: { id: true, name: true, cpf: true, phone: true } },
      createdBy: { select: { name: true } },
      services: true,
      history: { orderBy: { createdAt: "desc" } },
    },
  });

  return NextResponse.json(fullRecord);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.deathRecord.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.deathRecordHistory.deleteMany({ where: { deathRecordId: id } });
    await tx.deathRecordService.deleteMany({ where: { deathRecordId: id } });
    await tx.deathRecord.delete({ where: { id } });
  });

  return NextResponse.json({ success: true });
}
