import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-fixed";

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json();

    if (!pin || pin.length < 4) {
      return NextResponse.json(
        { error: "PIN inválido" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        pin,
        active: true,
        role: { in: ["COBRADOR", "ADMIN"] },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "PIN não encontrado" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error: any) {
    console.error("Erro no login por PIN:", error);
    return NextResponse.json(
      { error: "Erro interno", message: error.message },
      { status: 500 }
    );
  }
}
