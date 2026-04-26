import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: "admin@funeraria.com" },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found", dbConnected: true });
    }

    const match = await bcrypt.compare("admin123", user.password);

    return NextResponse.json({
      dbConnected: true,
      userFound: true,
      email: user.email,
      role: user.role,
      active: user.active,
      passwordMatch: match,
      hashPrefix: user.password.substring(0, 10),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, dbConnected: false });
  }
}
