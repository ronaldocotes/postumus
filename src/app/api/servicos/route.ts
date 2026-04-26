import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const services = await prisma.service.findMany({
    where: { active: true },
    include: { _count: { select: { sales: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(services);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const service = await prisma.service.create({
    data: {
      name: body.name,
      description: body.description || null,
      price: parseFloat(body.price),
      cost: body.cost ? parseFloat(body.cost) : null,
      category: body.category || null,
    },
  });
  return NextResponse.json(service, { status: 201 });
}
