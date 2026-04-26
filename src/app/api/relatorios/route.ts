import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "clientes") {
    const clients = await prisma.client.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ title: "Relatório de Clientes", data: clients });
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
