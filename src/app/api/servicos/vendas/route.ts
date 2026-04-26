import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("serviceId");
  const clientId = searchParams.get("clientId");

  const where: any = {};
  if (serviceId) where.serviceId = serviceId;
  if (clientId) where.clientId = clientId;

  const sales = await prisma.serviceSale.findMany({
    where,
    include: {
      service: { select: { name: true, category: true } },
      client: { select: { name: true, cpf: true } },
    },
    orderBy: { date: "desc" },
    take: 200,
  });
  return NextResponse.json(sales);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const service = await prisma.service.findUnique({ where: { id: body.serviceId } });
  if (!service) return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });

  const quantity = parseInt(body.quantity) || 1;
  const unitPrice = body.unitPrice ? parseFloat(body.unitPrice) : service.price;
  const discount = body.discount ? parseFloat(body.discount) : 0;
  const totalPrice = (unitPrice * quantity) - discount;

  const sale = await prisma.serviceSale.create({
    data: {
      serviceId: body.serviceId,
      clientId: body.clientId || null,
      clientName: body.clientName || null,
      quantity,
      unitPrice,
      totalPrice,
      discount: discount || null,
      date: body.date ? new Date(body.date) : new Date(),
      paymentMethod: body.paymentMethod || null,
      status: body.status || "PENDING",
      paidAt: body.status === "PAID" ? new Date() : null,
      notes: body.notes || null,
    },
    include: {
      service: { select: { name: true } },
      client: { select: { name: true } },
    },
  });
  return NextResponse.json(sale, { status: 201 });
}
