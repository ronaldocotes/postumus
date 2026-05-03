import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rankings = await prisma.commission.groupBy({
    by: ["userId"],
    where: { status: "PAGA" },
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 10,
  });

  const users = await prisma.user.findMany({
    where: { id: { in: rankings.map((r) => r.userId) } },
    select: { id: true, name: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u.name]));

  return NextResponse.json(
    rankings.map((r) => ({
      userId: r.userId,
      userName: userMap.get(r.userId) || "Desconhecido",
      totalAmount: r._sum.amount || 0,
      count: r._count.id,
    }))
  );
}
