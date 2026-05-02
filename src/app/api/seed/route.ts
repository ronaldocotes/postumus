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

    // Create a default company
    const company = await prisma.company.create({
      data: {
        name: "Funerária Posthumous",
        tradeName: "Posthumous",
        cnpj: "12.345.678/0001-90",
        phone: "(11) 1234-5678",
        email: "contato@posthumous.com",
        address: "Rua das Flores, 123",
        city: "São Paulo",
        state: "SP",
        zipCode: "01001-000",
        pixKeyType: "CNPJ",
        pixKey: "12345678000190",
        pixName: "Funeraria Posthumous",
        pixCity: "SAO PAULO",
        active: true,
      },
    });

    return NextResponse.json({ 
      message: "Admin e empresa criados", 
      user: { id: user.id, email: user.email },
      company: { id: company.id, name: company.name }
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    console.error("Seed error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
