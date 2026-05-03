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
  if (status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { clientName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [budgets, total] = await Promise.all([
    prisma.budget.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, cpf: true } },
        createdBy: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.budget.count({ where }),
  ]);

  return NextResponse.json({ budgets, total, pages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const body = await request.json();
  const { clientId, clientName, title, description, validUntil, notes, items } = body;

  if (!title || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Título e itens são obrigatórios" }, { status: 400 });
  }

  let subtotal = 0;
  const budgetItemsData = items.map((item: any) => {
    const qty = parseInt(item.quantity) || 1;
    const price = parseFloat(item.unitPrice) || 0;
    const total = qty * price;
    subtotal += total;
    return {
      productId: item.productId || null,
      serviceId: item.serviceId || null,
      name: item.name,
      quantity: qty,
      unitPrice: price,
      totalPrice: total,
      notes: item.notes || null,
    };
  });

  const discount = parseFloat(body.discount) || 0;
  const total = Math.max(0, subtotal - discount);

  const result = await prisma.$transaction(async (tx) => {
    const budget = await tx.budget.create({
      data: {
        clientId: clientId || null,
        clientName: clientName || null,
        title,
        description: description || null,
        subtotal,
        discount: discount || null,
        total,
        validUntil: validUntil ? new Date(validUntil) : null,
        notes: notes || null,
        createdById: userId,
      },
    });

    await tx.budgetItem.createMany({
      data: budgetItemsData.map((i: any) => ({ ...i, budgetId: budget.id })),
    });

    return budget;
  });

  const fullBudget = await prisma.budget.findUnique({
    where: { id: result.id },
    include: {
      client: { select: { id: true, name: true } },
      items: true,
      createdBy: { select: { name: true } },
    },
  });

  return NextResponse.json(fullBudget, { status: 201 });
}
