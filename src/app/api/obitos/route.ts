import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  const where: any = {};

  if (status !== "all") {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { deceasedName: { contains: search, mode: "insensitive" } },
      { responsibleName: { contains: search, mode: "insensitive" } },
      { placeName: { contains: search, mode: "insensitive" } },
      { deathCertificate: { contains: search, mode: "insensitive" } },
    ];
  }

  const [records, total] = await Promise.all([
    prisma.deathRecord.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, cpf: true, phone: true } },
        createdBy: { select: { name: true } },
        _count: { select: { services: true, history: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.deathRecord.count({ where }),
  ]);

  return NextResponse.json({ records, total, pages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const body = await request.json();
  const {
    clientId,
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
    responsibleName,
    responsiblePhone,
    responsibleRelation,
    notes,
  } = body;

  if (!deceasedName || !dateOfDeath || !responsibleName) {
    return NextResponse.json(
      { error: "Nome do falecido, data do óbito e responsável são obrigatórios" },
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const record = await tx.deathRecord.create({
      data: {
        clientId: clientId || null,
        deceasedName,
        deceasedBirthDate: deceasedBirthDate ? new Date(deceasedBirthDate) : null,
        deceasedCpf: deceasedCpf || null,
        deceasedRg: deceasedRg || null,
        dateOfDeath: new Date(dateOfDeath),
        timeOfDeath: timeOfDeath || null,
        placeOfDeath: placeOfDeath || "HOSPITAL",
        placeName: placeName || null,
        deathCertificate: deathCertificate || null,
        causeOfDeath: causeOfDeath || null,
        doctorName: doctorName || null,
        doctorCrm: doctorCrm || null,
        responsibleName,
        responsiblePhone: responsiblePhone || null,
        responsibleRelation: responsibleRelation || null,
        notes: notes || null,
        createdById: userId,
      },
    });

    await tx.deathRecordHistory.create({
      data: {
        deathRecordId: record.id,
        action: "CRIACAO",
        newValue: "LIBERACAO_PENDENTE",
        notes: "Registro de óbito criado",
      },
    });

    return record;
  });

  const fullRecord = await prisma.deathRecord.findUnique({
    where: { id: result.id },
    include: {
      client: { select: { id: true, name: true, cpf: true, phone: true } },
      createdBy: { select: { name: true } },
    },
  });

  return NextResponse.json(fullRecord, { status: 201 });
}
