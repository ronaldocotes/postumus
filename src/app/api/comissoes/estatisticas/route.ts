import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const stats = await prisma.$transaction([
    prisma.commission.count(),
    prisma.commission.count({ where: { status: "PENDENTE" } }),
    prisma.commission.count({ where: { status: "APROVADA" } }),
    prisma.commission.count({ where: { status: "PAGA" } }),
    prisma.commission.aggregate({ where: { status: "PENDENTE" }, _sum: { amount: true } }),
    prisma.commission.aggregate({ where: { status: "PAGA" }, _sum: { amount: true } }),
  ]);

  return NextResponse.json({
    total: stats[0],
    pendentes: stats[1],
    aprovadas: stats[2],
    pagas: stats[3],
    valorPendente: stats[4]._sum.amount || 0,
    valorPago: stats[5]._sum.amount || 0,
  });
}
