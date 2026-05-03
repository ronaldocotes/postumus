import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  const services = await prisma.service.findMany({
    where: {
      active: true,
      OR: search
        ? [
            { name: { contains: search, mode: "insensitive" } },
            { category: { contains: search, mode: "insensitive" } },
          ]
        : undefined,
    },
    select: {
      id: true,
      name: true,
      category: true,
      price: true,
    },
    orderBy: { name: "asc" },
    take: 50,
  });

  return NextResponse.json({ services });
}
