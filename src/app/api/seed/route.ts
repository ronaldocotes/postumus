import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    const existing = await prisma.user.findUnique({ where: { email: "admin@funeraria.com" } });
    if (existing) {
      return NextResponse.json({ message: "Admin já existe" });
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);
    const user = await prisma.user.create({
      data: {
        name: "Administrador",
        email: "admin@funeraria.com",
        password: hashedPassword,
        role: "ADMIN",
        active: true,
      },
    });

    return NextResponse.json({ message: "Admin criado", user: { id: user.id, email: user.email } });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error("Seed error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
