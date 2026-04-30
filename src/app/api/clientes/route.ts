import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 1000);

    // Busca simples sem filtros complexos
    const clients = await prisma.client.findMany({
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.client.count();

    return NextResponse.json({ clients, total, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    console.error("Erro ao buscar clientes:", error);
    return NextResponse.json(
      { error: "Erro ao buscar clientes", message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (data.cpf) {
      const existing = await prisma.client.findUnique({ where: { cpf: data.cpf } });
      if (existing) {
        return NextResponse.json({ error: "CPF já cadastrado" }, { status: 400 });
      }
    }

    // Remover campos que não são do modelo Client
    delete data.dependents;
    delete data.billingAddressSame;
    
    // Remover campos vazios para evitar erros
    Object.keys(data).forEach(key => {
      if (data[key] === "" || data[key] === undefined) {
        delete data[key];
      }
    });

    const client = await prisma.client.create({ data });
    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar cliente:", error);
    return NextResponse.json(
      { error: "Erro ao criar cliente", message: error.message },
      { status: 500 }
    );
  }
}
