import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const stats = await prisma.$transaction([
    prisma.deathRecord.count(),
    prisma.deathRecord.count({ where: { status: "LIBERACAO_PENDENTE" } }),
    prisma.deathRecord.count({ where: { status: "EM_TRASLADO" } }),
    prisma.deathRecord.count({ where: { status: "VELORIO" } }),
    prisma.deathRecord.count({ where: { status: "CONCLUIDO" } }),
  ]);

  return NextResponse.json({
    total: stats[0],
    liberacaoPendente: stats[1],
    emTraslado: stats[2],
    emVelorio: stats[3],
    concluidos: stats[4],
  });
}
