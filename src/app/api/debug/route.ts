import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    // Strip BOM if present
    let dbUrl = process.env.DATABASE_URL || "";
    dbUrl = dbUrl.replace(/^\uFEFF/, "").trim();

    const adapter = new PrismaNeon({ connectionString: dbUrl });
    const prisma = new PrismaClient({ adapter });

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
      passwordMatch: match,
      role: user.role,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, dbConnected: false });
  }
}
