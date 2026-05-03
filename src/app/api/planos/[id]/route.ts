import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const plan = await prisma.assuredPlan.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, cpf: true, phone: true, email: true, address: true } },
      coverages: true,
      _count: { select: { usages: true, history: true } },
    },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
  }

  return NextResponse.json(plan);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.assuredPlan.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
  }

  const {
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

  const result = await prisma.$transaction(async (tx) => {
    const plan = await tx.assuredPlan.update({
      where: { id },
      data: {
        type: type || existing.type,
        status: status || existing.status,
        startDate: startDate ? new Date(startDate) : existing.startDate,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate,
        monthlyValue: monthlyValue !== undefined ? parseFloat(monthlyValue) : existing.monthlyValue,
        coverageUrn: coverageUrn !== undefined ? coverageUrn : existing.coverageUrn,
        coverageCoffin: coverageCoffin !== undefined ? coverageCoffin : existing.coverageCoffin,
        coverageService: coverageService !== undefined ? coverageService : existing.coverageService,
        coverageTransport: coverageTransport !== undefined ? coverageTransport : existing.coverageTransport,
        maxDependents: maxDependents !== undefined ? parseInt(maxDependents) : existing.maxDependents,
        notes: notes !== undefined ? notes : existing.notes,
      },
    });

    // Atualizar coberturas: deletar e recriar
    if (Array.isArray(coverages)) {
      await tx.planCoverage.deleteMany({ where: { planId: id } });
      if (coverages.length > 0) {
        await tx.planCoverage.createMany({
          data: coverages.map((c: any) => ({
            planId: id,
            itemType: c.itemType || "OUTRO",
            itemName: c.itemName,
            quantity: parseInt(c.quantity) || 1,
            isUnlimited: c.isUnlimited || false,
            notes: c.notes || null,
          })),
        });
      }
    }

    // Registrar histórico se status mudou
    if (status && status !== existing.status) {
      await tx.assuredPlanHistory.create({
        data: {
          planId: id,
          action: "ALTERACAO_STATUS",
          oldValue: existing.status,
          newValue: status,
          notes: `Status alterado de ${existing.status} para ${status}`,
        },
      });
    }

    // Registrar histórico se valor mudou
    if (monthlyValue && parseFloat(monthlyValue) !== existing.monthlyValue) {
      await tx.assuredPlanHistory.create({
        data: {
          planId: id,
          action: "REAJUSTE",
          oldValue: String(existing.monthlyValue),
          newValue: String(monthlyValue),
          notes: "Reajuste de valor mensal",
        },
      });
    }

    return plan;
  });

  const fullPlan = await prisma.assuredPlan.findUnique({
    where: { id: result.id },
    include: {
      client: { select: { id: true, name: true, cpf: true, phone: true } },
      coverages: true,
    },
  });

  return NextResponse.json(fullPlan);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const plan = await prisma.assuredPlan.findUnique({
    where: { id },
    select: { clientId: true },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.assuredPlanHistory.deleteMany({ where: { planId: id } });
    await tx.planCoverage.deleteMany({ where: { planId: id } });
    await tx.planUsage.deleteMany({ where: { planId: id } });
    await tx.assuredPlan.delete({ where: { id } });

    // Verificar se cliente tem outros planos
    const otherPlans = await tx.assuredPlan.count({ where: { clientId: plan.clientId } });
    if (otherPlans === 0) {
      await tx.client.update({
        where: { id: plan.clientId },
        data: { isAssured: false },
      });
    }
  });

  return NextResponse.json({ success: true });
}
