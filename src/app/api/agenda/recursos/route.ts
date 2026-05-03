import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const resources = await prisma.resource.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ resources });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { name, type, description, capacity } = body;

  if (!name || !type) {
    return NextResponse.json({ error: "Nome e tipo são obrigatórios" }, { status: 400 });
  }

  const resource = await prisma.resource.create({
    data: {
      name,
      type,
      description: description || null,
      capacity: capacity ? parseInt(capacity) : null,
    },
  });

  return NextResponse.json(resource, { status: 201 });
}
