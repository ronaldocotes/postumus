import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "clientes") {
    const clients = await prisma.client.findMany({
      where: { active: true },
      include: {
        carnes: { select: { id: true } },
        _count: { select: { carnes: true, dependents: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ title: "Relatório de Clientes", data: clients });
  }

  if (type === "contribuintes") {
    const clients = await prisma.client.findMany({
      where: {
        active: true,
        carnes: { some: {} },
      },
      include: {
        _count: { select: { carnes: true, dependents: true } },
        carnes: {
          orderBy: { year: "desc" },
          take: 1,
          include: {
            installments: {
              where: { status: { in: ["PENDING", "LATE"] } },
              select: { valor: true },
            },
          },
        },
        cobrador: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });

    const data = clients.map(c => {
      const lastCarne = c.carnes[0];
      const pendingAmount = lastCarne?.installments.reduce((s: number, i: any) => s + i.valor, 0) || 0;
      return {
        id: c.id,
        code: c.code,
        name: c.name,
        cpf: c.cpf,
        cellphone: c.cellphone,
        phone: c.phone,
        neighborhood: c.neighborhood,
        city: c.city,
        dueDay: c.dueDay,
        paymentLocation: c.paymentLocation,
        cobrador: c.cobrador?.name || null,
        totalCarnes: c._count.carnes,
        totalDependents: c._count.dependents,
        lastCarneYear: lastCarne?.year || null,
        pendingAmount,
        status: c.status,
      };
    });

    return NextResponse.json({
      title: "Relatório de Contribuintes (Carnê)",
      data,
      total: data.length,
    });
  }

  if (type === "compradores") {
    const transactions = await prisma.financialTransaction.findMany({
      where: {
        clientId: { not: null },
        type: "INCOME",
        category: { not: "CARNE" },
      },
      include: {
        client: { select: { name: true, cpf: true, cellphone: true, phone: true, city: true } },
      },
      orderBy: { date: "desc" },
    });

    // Group by client
    const grouped: Record<string, any> = {};
    for (const t of transactions) {
      if (!t.clientId || !t.client) continue;
      if (!grouped[t.clientId]) {
        grouped[t.clientId] = {
          client: t.client,
          purchases: [],
          totalSpent: 0,
        };
      }
      grouped[t.clientId].purchases.push({
        date: t.date,
        description: t.description,
        amount: t.amount,
      });
      grouped[t.clientId].totalSpent += t.amount;
    }

    const data = Object.values(grouped);
    const totalGeral = data.reduce((s: number, d: any) => s + d.totalSpent, 0);

    return NextResponse.json({
      title: "Relatório de Compradores de Mercadoria",
      data,
      totalGeral,
    });
  }

  if (type === "fornecedores") {
    const suppliers = await prisma.supplier.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ title: "Relatório de Fornecedores", data: suppliers });
  }

  if (type === "mercadorias") {
    const products = await prisma.product.findMany({
      where: { active: true },
      include: { supplier: { select: { name: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ title: "Relatório de Mercadorias", data: products });
  }

  if (type === "inadimplentes") {
    const today = new Date();
    // Busca parcelas atrasadas (LATE) ou pendentes com dueDate no passado
    const overdueInstallments = await prisma.installment.findMany({
      where: {
        status: { in: ["PENDING", "LATE"] },
        dueDate: { lt: today },
      },
      include: {
        carne: {
          include: { 
            client: { 
              select: { 
                id: true,
                name: true, 
                cpf: true, 
                cellphone: true, 
                phone: true, 
                address: true, 
                city: true 
              } 
            } 
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    // Atualiza status para LATE se ainda estiver PENDING
    const pendingIds = overdueInstallments
      .filter(i => i.status === "PENDING")
      .map(i => i.id);
    if (pendingIds.length > 0) {
      await prisma.installment.updateMany({
        where: { id: { in: pendingIds } },
        data: { status: "LATE" },
      });
    }

    // Agrupa por cliente
    const grouped: Record<string, any> = {};
    for (const inst of overdueInstallments) {
      const clientId = inst.carne.client.id;
      if (!grouped[clientId]) {
        grouped[clientId] = {
          client: inst.carne.client,
          payments: [],
          totalOverdue: 0,
        };
      }
      grouped[clientId].payments.push({
        installment: inst.numero,
        dueDate: inst.dueDate,
        amount: inst.valor,
        year: inst.carne.year,
      });
      grouped[clientId].totalOverdue += inst.valor;
    }

    return NextResponse.json({
      title: "Relatório de Inadimplentes",
      data: Object.values(grouped),
      totalGeral: overdueInstallments.reduce((s, i) => s + i.valor, 0),
    });
  }

  if (type === "financeiro") {
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await prisma.financialTransaction.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: {
        client: { select: { name: true } },
        supplier: { select: { name: true } },
      },
      orderBy: { date: "asc" },
    });

    const income = transactions.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

    return NextResponse.json({
      title: `Relatório Financeiro - ${String(month).padStart(2, "0")}/${year}`,
      data: transactions,
      resumo: { income, expense, balance: income - expense },
    });
  }

  if (type === "pagamentos") {
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const payments = await prisma.payment.findMany({
      where: { paidAt: { gte: startDate, lte: endDate } },
      include: {
        installment: {
          include: {
            carne: { include: { client: { select: { name: true, cpf: true } } } },
          },
        },
        receivedBy: { select: { name: true } },
      },
      orderBy: { paidAt: "asc" },
    });

    const total = payments.reduce((s, p) => s + p.paidAmount, 0);

    return NextResponse.json({
      title: `Relatório de Pagamentos Recebidos - ${String(month).padStart(2, "0")}/${year}`,
      data: payments,
      total,
    });
  }

  if (type === "servicos") {
    const sales = await prisma.serviceSale.findMany({
      include: {
        service: { select: { name: true, category: true } },
        client: { select: { name: true, cpf: true, cellphone: true, phone: true } },
      },
      orderBy: { date: "desc" },
    });

    // Group by service
    const grouped: Record<string, any> = {};
    for (const s of sales) {
      const svcId = s.serviceId;
      if (!grouped[svcId]) {
        grouped[svcId] = {
          service: s.service,
          sales: [],
          totalRevenue: 0,
          totalQty: 0,
        };
      }
      grouped[svcId].sales.push({
        date: s.date,
        client: s.client?.name || s.clientName || "Avulso",
        quantity: s.quantity,
        totalPrice: s.totalPrice,
        status: s.status,
        paymentMethod: s.paymentMethod,
      });
      grouped[svcId].totalRevenue += s.totalPrice;
      grouped[svcId].totalQty += s.quantity;
    }

    const data = Object.values(grouped);
    const totalGeral = sales.reduce((s, x) => s + x.totalPrice, 0);

    return NextResponse.json({
      title: "Relatório de Vendas de Serviços",
      data,
      totalGeral,
      totalVendas: sales.length,
    });
  }

  return NextResponse.json({ error: "Tipo de relatório inválido" }, { status: 400 });
}
