import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST: autentica cliente por CPF + senha (últimos 4 dígitos do CPF como senha padrão)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cpf, senha } = body;

    if (!cpf || !senha) {
      return NextResponse.json(
        { error: "CPF e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Normaliza CPF (remove pontuação)
    const cpfClean = cpf.replace(/\D/g, "");

    if (cpfClean.length < 11) {
      return NextResponse.json(
        { error: "CPF inválido" },
        { status: 400 }
      );
    }

    const client = await prisma.client.findFirst({
      where: {
        cpf: { contains: cpfClean },
        active: true,
      },
      include: {
        carnes: {
          orderBy: { year: "desc" },
          take: 3,
          include: {
            installments: {
              orderBy: { numero: "asc" },
              include: {
                payment: {
                  select: { paidAt: true, paymentMethod: true, paidAmount: true },
                },
              },
            },
          },
        },
        dependents: {
          where: { active: true },
          select: { id: true, name: true, relationship: true, birthDate: true },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    // Valida senha: últimos 4 dígitos do CPF como senha padrão
    const senhaEsperada = cpfClean.slice(-4);
    if (senha !== senhaEsperada) {
      return NextResponse.json(
        { error: "Senha incorreta" },
        { status: 401 }
      );
    }

    // Sumariza parcelas
    const carnesData = client.carnes.map((carne) => {
      const parcelas = carne.installments.map((inst) => ({
        id: inst.id,
        numero: inst.numero,
        valor: inst.valor,
        dueDate: inst.dueDate,
        status: inst.status,
        paidAt: inst.payment?.paidAt || null,
        paymentMethod: inst.payment?.paymentMethod || null,
      }));

      const pagas = parcelas.filter((p) => p.status === "PAID").length;
      const pendentes = parcelas.filter((p) => p.status === "PENDING").length;
      const atrasadas = parcelas.filter((p) => p.status === "LATE").length;
      const proximaVencer =
        parcelas.find((p) => p.status === "PENDING" || p.status === "LATE") || null;

      return {
        id: carne.id,
        ano: carne.year,
        totalValue: carne.totalValue,
        descricao: carne.description,
        parcelas,
        resumo: { pagas, pendentes, atrasadas, total: parcelas.length },
        proximaVencer,
      };
    });

    return NextResponse.json({
      cliente: {
        id: client.id,
        name: client.name,
        cpf: client.cpf,
        phone: client.phone,
        cellphone: client.cellphone,
        address: client.address,
        neighborhood: client.neighborhood,
        city: client.city,
        dueDay: client.dueDay,
        monthlyValue: client.monthlyValue,
        status: client.status,
      },
      carnes: carnesData,
      dependentes: client.dependents,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[mobile/cliente-portal]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
