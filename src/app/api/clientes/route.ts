import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 1000);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { cpf: { contains: search } },
        { code: { contains: search } },
        { cellphone: { contains: search } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [rawClients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { dependents: true } },
          carnes: {
            select: {
              id: true,
              installments: { select: { id: true, status: true, payment: { select: { id: true } } } },
            },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    // Enrich with hasActiveCarne flag
    const clients = rawClients.map((c) => {
      const hasActiveCarne = c.carnes.some((carne) =>
        carne.installments.some((inst) => !inst.payment && inst.status !== "PAID")
      );
      const { carnes, ...rest } = c;
      return { ...rest, hasActiveCarne };
    });

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
