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
            payments: {
              where: { status: { in: ["PENDING", "OVERDUE"] } },
              select: { amount: true },
            },
          },
        },
        cobrador: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });

    const data = clients.map(c => {
      const lastCarne = c.carnes[0];
      const pendingAmount = lastCarne?.payments.reduce((s: number, p: any) => s + p.amount, 0) || 0;
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
    const overduePayments = await prisma.payment.findMany({
      where: {
        status: { in: ["PENDING", "OVERDUE"] },
        dueDate: { lt: today },
      },
      include: {
        carne: {
          include: { client: { select: { name: true, cpf: true, cellphone: true, phone: true, address: true, city: true } } },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    // Mark as overdue
    const overdueIds = overduePayments.filter(p => p.status === "PENDING").map(p => p.id);
    if (overdueIds.length > 0) {
      await prisma.payment.updateMany({
        where: { id: { in: overdueIds } },
        data: { status: "OVERDUE" },
      });
    }

    // Group by client
    const grouped: Record<string, any> = {};
    for (const p of overduePayments) {
      const clientId = p.carne.clientId;
      if (!grouped[clientId]) {
        grouped[clientId] = {
          client: p.carne.client,
          payments: [],
          totalOverdue: 0,
        };
      }
      grouped[clientId].payments.push({
        installment: p.installment,
        dueDate: p.dueDate,
        amount: p.amount,
        year: p.carne.year,
      });
      grouped[clientId].totalOverdue += p.amount;
    }

    return NextResponse.json({
      title: "Relatório de Inadimplentes",
      data: Object.values(grouped),
      totalGeral: overduePayments.reduce((s, p) => s + p.amount, 0),
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
      where: { status: "PAID", paidAt: { gte: startDate, lte: endDate } },
      include: {
        carne: { include: { client: { select: { name: true, cpf: true } } } },
        receivedBy: { select: { name: true } },
      },
      orderBy: { paidAt: "asc" },
    });

    const total = payments.reduce((s, p) => s + (p.paidAmount || p.amount), 0);

    return NextResponse.json({
      title: `Relatório de Pagamentos Recebidos - ${String(month).padStart(2, "0")}/${year}`,
      data: payments,
      total,
    });
  }

  return NextResponse.json({ error: "Tipo de relatório inválido" }, { status: 400 });
}
