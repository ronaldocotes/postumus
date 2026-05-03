import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productId,
      type,
      quantity,
      reason,
      reference,
      unitCost,
      createdById,
      sourceId,
      sourceType,
      location,
    } = body;

    if (!productId || !type || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Campos obrigatórios: productId, type, quantity" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    if (type === "SAIDA" && product.stock < quantity) {
      return NextResponse.json(
        {
          error: `Estoque insuficiente. Disponível: ${product.stock}, solicitado: ${quantity}`,
        },
        { status: 400 }
      );
    }

    const balanceBefore = product.stock;
    let balanceAfter = balanceBefore;
    let newAverageCost = product.cost ?? 0;

    if (type === "ENTRADA") {
      balanceAfter = balanceBefore + quantity;
      // Custo Médio Ponderado (CMP)
      if (unitCost && balanceAfter > 0) {
        const currentTotal = balanceBefore * (product.cost ?? 0);
        const entryTotal = quantity * unitCost;
        newAverageCost = (currentTotal + entryTotal) / balanceAfter;
      }
    } else if (type === "SAIDA") {
      balanceAfter = balanceBefore - quantity;
      // CMP não muda na saída, mas podemos registrar o custo médio vigente
      newAverageCost = product.cost ?? 0;
    } else if (type === "AJUSTE") {
      // Ajuste como delta: quantity representa a diferença (+10 ou -5)
      balanceAfter = balanceBefore + quantity;
      if (balanceAfter < 0) {
        return NextResponse.json(
          { error: `Ajuste resultaria em estoque negativo: ${balanceAfter}` },
          { status: 400 }
        );
      }
      newAverageCost = product.cost ?? 0;
    }

    const [movement] = await prisma.$transaction([
      prisma.stockMovement.create({
        data: {
          productId,
          type,
          quantity: Math.abs(quantity),
          balanceBefore,
          balanceAfter,
          reason,
          reference,
          unitCost,
          averageCost: newAverageCost || null,
          sourceId,
          sourceType,
          location,
          createdById,
        },
      }),
      prisma.product.update({
        where: { id: productId },
        data: {
          stock: balanceAfter,
          ...(type === "ENTRADA" && newAverageCost > 0 ? { cost: newAverageCost } : {}),
        },
      }),
    ]);

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar movimentação:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
