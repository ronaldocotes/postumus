import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "all";
  const type = searchParams.get("type") || "all";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  const where: any = {};

  if (status !== "all") {
    where.status = status;
  }
  if (type !== "all") {
    where.type = type;
  }

  if (search) {
    where.client = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { cpf: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const [plans, total] = await Promise.all([
    prisma.assuredPlan.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, cpf: true, phone: true, isAssured: true } },
        _count: { select: { coverages: true, usages: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.assuredPlan.count({ where }),
  ]);

  return NextResponse.json({ plans, total, pages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const {
    clientId,
    type,
    status,
    startDate,
    endDate,
    monthlyValue,
    coverageUrn,
    coverageCoffin,
    coverageService,
    coverageTransport,
    maxDependents,
    notes,
    coverages,
  } = body;

  if (!clientId || !startDate || !monthlyValue) {
    return NextResponse.json({ error: "Cliente, data início e valor mensal são obrigatórios" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  }

  // Verificar se cliente já tem plano
  const existing = await prisma.assuredPlan.findUnique({
    where: { clientId },
  });
  if (existing) {
    return NextResponse.json({ error: "Cliente já possui um plano vinculado" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const plan = await tx.assuredPlan.create({
      data: {
        clientId,
        type: type || "INDIVIDUAL",
        status: status || "ACTIVE",
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        monthlyValue: parseFloat(monthlyValue) || 0,
        coverageUrn: coverageUrn ?? true,
        coverageCoffin: coverageCoffin ?? true,
        coverageService: coverageService ?? true,
        coverageTransport: coverageTransport ?? true,
        maxDependents: parseInt(maxDependents) || 0,
        notes: notes || null,
      },
    });

    // Criar coberturas customizadas se houver
    if (Array.isArray(coverages) && coverages.length > 0) {
      await tx.planCoverage.createMany({
        data: coverages.map((c: any) => ({
          planId: plan.id,
          itemType: c.itemType || "OUTRO",
          itemName: c.itemName,
          quantity: parseInt(c.quantity) || 1,
          isUnlimited: c.isUnlimited || false,
          notes: c.notes || null,
        })),
      });
    }

    // Atualizar cliente como assegurado
    await tx.client.update({
      where: { id: clientId },
      data: { isAssured: true },
    });

    // Registrar histórico
    await tx.assuredPlanHistory.create({
      data: {
        planId: plan.id,
        action: "CRIACAO",
        newValue: JSON.stringify({ type, monthlyValue, startDate }),
        notes: "Plano criado",
      },
    });

    return plan;
  });

  const fullPlan = await prisma.assuredPlan.findUnique({
    where: { id: result.id },
    include: {
      client: { select: { id: true, name: true, cpf: true, phone: true } },
      coverages: true,
    },
  });

  return NextResponse.json(fullPlan, { status: 201 });
}
