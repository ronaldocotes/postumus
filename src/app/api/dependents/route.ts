import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const data = await request.json();
  
  if (!data.clientId || !data.name) {
    return NextResponse.json({ error: "clientId e name são obrigatórios" }, { status: 400 });
  }

  const dependent = await prisma.dependent.create({
    data: {
      clientId: data.clientId,
      name: data.name,
      relationship: data.relationship || "OUTRO",
      cpf: data.cpf || null,
      phone: data.phone || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      notes: data.notes || null,
    },
  });

  return NextResponse.json(dependent, { status: 201 });
}
