import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, type, quantity, reason, reference, unitCost, createdBy } = body;

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

    let newStock = product.stock;
    if (type === "ENTRADA") {
      newStock = product.stock + quantity;
    } else if (type === "SAIDA") {
      newStock = product.stock - quantity;
    } else if (type === "AJUSTE") {
      newStock = quantity; // ajuste define o valor absoluto
    }

    const [movement] = await prisma.$transaction([
      prisma.stockMovement.create({
        data: { productId, type, quantity, reason, reference, unitCost, createdBy },
      }),
      prisma.product.update({
        where: { id: productId },
        data: {
          stock: newStock,
          ...(type === "ENTRADA" && unitCost ? { cost: unitCost } : {}),
        },
      }),
    ]);

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar movimentação:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
