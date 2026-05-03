import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  const [registers, total] = await Promise.all([
    prisma.cashRegister.findMany({
      include: {
        openedBy: { select: { name: true } },
        closedBy: { select: { name: true } },
        _count: { select: { sales: true, movements: true } },
      },
      orderBy: { openedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.cashRegister.count(),
  ]);

  return NextResponse.json({ registers, total, pages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const body = await request.json();
  const initialAmount = parseFloat(body.initialAmount) || 0;

  const existingOpen = await prisma.cashRegister.findFirst({
    where: { status: "OPEN" },
  });

  if (existingOpen) {
    return NextResponse.json({ error: "Já existe um caixa aberto" }, { status: 400 });
  }

  const register = await prisma.cashRegister.create({
    data: {
      openedById: userId,
      initialAmount,
      status: "OPEN",
    },
    include: {
      openedBy: { select: { name: true } },
    },
  });

  return NextResponse.json(register, { status: 201 });
}
