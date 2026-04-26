import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST() {
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
    },
  });

  return NextResponse.json({ message: "Admin criado", user: { id: user.id, email: user.email } });
}
