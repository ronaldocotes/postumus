import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const body = await request.json();
  const { clientId, clientName, paymentMethod, status, notes, items, isPlanUsage } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
  }

  // Verificar caixa aberto
  const openRegister = await prisma.cashRegister.findFirst({
    where: { status: "OPEN" },
  });
  if (!openRegister) {
    return NextResponse.json({ error: "Nenhum caixa aberto" }, { status: 400 });
  }

  // Verificar se cliente é assegurado (quando houver clientId)
  let clientIsAssured = false;
  if (clientId) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { isAssured: true },
    });
    clientIsAssured = client?.isAssured ?? false;
  }

  // Se houver itens cobertos pelo plano, o cliente DEVE ser assegurado
  const hasPlanCoveredItems = items.some((i: any) => i.isPlanCovered);
  if (hasPlanCoveredItems && !clientIsAssured) {
    return NextResponse.json(
      { error: "Apenas clientes assegurados podem ter itens cobertos pelo plano" },
      { status: 400 }
    );
  }

  // Validar itens e buscar preços atuais
  const productIds = items.filter((i: any) => i.productId).map((i: any) => i.productId);
  const serviceIds = items.filter((i: any) => i.serviceId).map((i: any) => i.serviceId);

  const [products, services] = await Promise.all([
    productIds.length > 0
      ? prisma.product.findMany({
          where: { id: { in: productIds }, active: true },
          select: { id: true, name: true, price: true, stock: true },
        })
      : Promise.resolve([]),
    serviceIds.length > 0
      ? prisma.service.findMany({
          where: { id: { in: serviceIds }, active: true },
          select: { id: true, name: true, price: true },
        })
      : Promise.resolve([]),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const serviceMap = new Map(services.map((s) => [s.id, s]));

  let totalAmount = 0;
  let planCoveredAmount = 0;
  const saleItemsData: any[] = [];
  const stockUpdates: { productId: string; quantity: number; currentStock: number }[] = [];

  for (const item of items) {
    const qty = parseInt(item.quantity) || 1;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    const isCovered = item.isPlanCovered === true;

    if (item.productId) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Produto ${item.productId} não encontrado` }, { status: 400 });
      }
      if (product.stock < qty) {
        return NextResponse.json(
          { error: `Estoque insuficiente para ${product.name}` },
          { status: 400 }
        );
      }
      const finalUnitPrice = unitPrice > 0 ? unitPrice : product.price;
      const totalPrice = finalUnitPrice * qty;
      totalAmount += totalPrice;
      if (isCovered) {
        planCoveredAmount += totalPrice;
      }
      saleItemsData.push({
        productId: item.productId,
        name: product.name,
        quantity: qty,
        unitPrice: finalUnitPrice,
        totalPrice,
        isPlanCovered: isCovered,
      });
      stockUpdates.push({ productId: item.productId, quantity: qty, currentStock: product.stock });
    } else if (item.serviceId) {
      const service = serviceMap.get(item.serviceId);
      if (!service) {
        return NextResponse.json({ error: `Serviço ${item.serviceId} não encontrado` }, { status: 400 });
      }
      const finalUnitPrice = unitPrice > 0 ? unitPrice : service.price;
      const totalPrice = finalUnitPrice * qty;
      totalAmount += totalPrice;
      if (isCovered) {
        planCoveredAmount += totalPrice;
      }
      saleItemsData.push({
        serviceId: item.serviceId,
        name: service.name,
        quantity: qty,
        unitPrice: finalUnitPrice,
        totalPrice,
        isPlanCovered: isCovered,
      });
    } else {
      return NextResponse.json({ error: "Item inválido: sem productId ou serviceId" }, { status: 400 });
    }
  }

  const discount = parseFloat(body.discount) || 0;
  const finalAmount = totalAmount - planCoveredAmount - discount;

  if (finalAmount < 0) {
    return NextResponse.json({ error: "Desconto maior que o total pago" }, { status: 400 });
  }

  const saleStatus = status === "PAID" ? "PAID" : "PENDING";

  const result = await prisma.$transaction(async (tx) => {
    // Criar venda
    const sale = await tx.sale.create({
      data: {
        cashRegisterId: openRegister.id,
        clientId: clientId || null,
        clientName: clientName || null,
        totalAmount,
        discount: discount || null,
        finalAmount,
        planCoveredAmount,
        isPlanUsage: isPlanUsage === true || hasPlanCoveredItems,
        paymentMethod: paymentMethod || null,
        status: saleStatus,
        paidAt: saleStatus === "PAID" ? new Date() : null,
        notes: notes || null,
        createdById: userId,
      },
    });

    // Criar itens
    await tx.saleItem.createMany({
      data: saleItemsData.map((item) => ({
        ...item,
        saleId: sale.id,
      })),
    });

    // Atualizar estoque e registrar movimentações
    for (const update of stockUpdates) {
      await tx.product.update({
        where: { id: update.productId },
        data: { stock: { decrement: update.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: update.productId,
          type: "SAIDA",
          quantity: update.quantity,
          balanceBefore: update.currentStock,
          balanceAfter: update.currentStock - update.quantity,
          reason: hasPlanCoveredItems ? "Atendimento Plano" : "Venda PDV",
          reference: sale.id,
          sourceId: sale.id,
          sourceType: "Sale",
          createdById: userId,
        },
      });
    }

    // Buscar plano do cliente se for assegurado
    let clientPlanId: string | null = null;
    if (clientId && clientIsAssured) {
      const plan = await tx.assuredPlan.findUnique({
        where: { clientId },
        select: { id: true },
      });
      if (plan) {
        clientPlanId = plan.id;
      }
    }

    // Criar transação financeira se houver valor pago (upgrade)
    if (saleStatus === "PAID" && finalAmount > 0) {
      await tx.financialTransaction.create({
        data: {
          type: "INCOME",
          description: hasPlanCoveredItems
            ? `Upgrade Plano #${sale.id.slice(-6)}`
            : `Venda PDV #${sale.id.slice(-6)}`,
          amount: finalAmount,
          date: new Date(),
          paidAt: new Date(),
          status: "PAID",
          paymentMethod: paymentMethod || null,
          category: hasPlanCoveredItems ? "Upgrade Plano" : "Venda PDV",
          clientId: clientId || null,
          notes: notes || null,
        },
      });
    }

    // Registrar uso do plano para itens cobertos
    if (clientPlanId && hasPlanCoveredItems) {
      for (const item of saleItemsData) {
        if (item.isPlanCovered) {
          await tx.planUsage.create({
            data: {
              planId: clientPlanId,
              saleId: sale.id,
              productId: item.productId || null,
              serviceId: item.serviceId || null,
              description: item.name,
              quantity: item.quantity,
              costToPlan: item.totalPrice,
              upgradeAmount: 0,
              usedAt: new Date(),
            },
          });
        }
      }
    }

    // Calcular e registrar comissões
    const activeRules = await tx.commissionRule.findMany({
      where: {
        active: true,
        targetType: "VENDEDOR",
        OR: [
          { basis: "VENDA_TOTAL" },
          { basis: hasPlanCoveredItems ? "UPGRADE_PLANO" : "VENDA_TOTAL" },
        ],
        startDate: { lte: new Date() },
        OR_endDate: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      },
    });

    for (const rule of activeRules) {
      let applicableAmount = 0;

      if (rule.basis === "VENDA_TOTAL") {
        applicableAmount = finalAmount;
      } else if (rule.basis === "UPGRADE_PLANO" && hasPlanCoveredItems) {
        applicableAmount = finalAmount;
      } else if (rule.basis === "VENDA_PRODUTO") {
        applicableAmount = saleItemsData
          .filter((i) => i.productId && !i.isPlanCovered)
          .reduce((sum, i) => sum + i.totalPrice, 0);
      } else if (rule.basis === "VENDA_SERVICO") {
        applicableAmount = saleItemsData
          .filter((i) => i.serviceId && !i.isPlanCovered)
          .reduce((sum, i) => sum + i.totalPrice, 0);
      }

      if (applicableAmount <= 0) continue;
      if (rule.minValue && applicableAmount < rule.minValue) continue;
      if (rule.maxValue && applicableAmount > rule.maxValue) continue;

      let commissionAmount = 0;
      if (rule.percentage && rule.percentage > 0) {
        commissionAmount += (applicableAmount * rule.percentage) / 100;
      }
      if (rule.fixedAmount && rule.fixedAmount > 0) {
        commissionAmount += rule.fixedAmount;
      }

      if (commissionAmount > 0) {
        await tx.commission.create({
          data: {
            userId,
            saleId: sale.id,
            ruleId: rule.id,
            basis: rule.basis,
            amount: commissionAmount,
            saleAmount: applicableAmount,
            percentage: rule.percentage,
            fixedAmount: rule.fixedAmount,
            status: "PENDENTE",
          },
        });
      }
    }

    return sale;
  });

  const fullSale = await prisma.sale.findUnique({
    where: { id: result.id },
    include: {
      items: true,
      client: { select: { name: true } },
      cashRegister: { select: { id: true, status: true } },
      createdBy: { select: { name: true } },
    },
  });

  return NextResponse.json(fullSale, { status: 201 });
}
