import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";

// POST: Registrar pagamento de parcelas com foto do comprovante
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const stopId = formData.get("stopId") as string;
    const clientId = formData.get("clientId") as string;
    const installmentIdsJson = formData.get("installmentIds") as string;
    const installmentIds = JSON.parse(installmentIdsJson);
    const paymentMethod = formData.get("paymentMethod") as string;
    const amountReceived = parseFloat(formData.get("amountReceived") as string) || 0;
    const changeAmount = parseFloat(formData.get("changeAmount") as string) || 0;
    const notes = formData.get("notes") as string;
    const latitude = formData.get("latitude") ? parseFloat(formData.get("latitude") as string) : null;
    const longitude = formData.get("longitude") ? parseFloat(formData.get("longitude") as string) : null;
    const receiptPhoto = formData.get("receiptPhoto") as File | null;

    // Validações
    if (!stopId || !clientId || !installmentIds || installmentIds.length === 0) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      );
    }

    // Busca as parcelas
    const installments = await prisma.installment.findMany({
      where: {
        id: { in: installmentIds },
        status: { in: ["PENDING", "LATE"] },
      },
      include: {
        carne: {
          include: {
            client: true,
          },
        },
      },
    });

    if (installments.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma parcela válida encontrada" },
        { status: 400 }
      );
    }

    // Calcula o valor total
    const totalAmount = installments.reduce((sum, inst) => sum + inst.valor, 0);

    // Processa foto do comprovante se enviada
    let receiptPhotoPath: string | null = null;
    if (receiptPhoto && receiptPhoto.size > 0) {
      const bytes = await receiptPhoto.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Cria pasta se não existir
      const uploadDir = join(process.cwd(), "public", "uploads", "receipts");
      await mkdir(uploadDir, { recursive: true });
      
      // Gera nome único
      const filename = `receipt_${Date.now()}_${receiptPhoto.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const filepath = join(uploadDir, filename);
      
      await writeFile(filepath, buffer);
      receiptPhotoPath = `/uploads/receipts/${filename}`;
    }

    // Cria os pagamentos e atualiza as parcelas em transação
    const payments = await prisma.$transaction(async (tx) => {
      const createdPayments = [];

      for (const installment of installments) {
        // Cria o pagamento
        const payment = await tx.payment.create({
          data: {
            installmentId: installment.id,
            paidAmount: installment.valor,
            paymentMethod: (paymentMethod as any) || "CASH",
            paymentLocation: "RESIDENCIA",
            latitude,
            longitude,
            notes: notes || null,
          },
        });

        // Se tem foto, salva na tabela PaymentReceipt
        if (receiptPhotoPath) {
          const collectorId = (await tx.collectionRouteStop.findUnique({
            where: { id: stopId },
            select: { route: { select: { collectorId: true } } },
          }))?.route?.collectorId || "";

          await tx.paymentReceipt.create({
            data: {
              paymentId: payment.id,
              url: receiptPhotoPath,
              filename: receiptPhotoPath.split("/").pop() || "receipt.jpg",
              mimeType: receiptPhoto?.type || "image/jpeg",
              size: receiptPhoto?.size || 0,
              uploadedBy: collectorId,
            },
          });
        }

        // Atualiza a parcela para paga
        await tx.installment.update({
          where: { id: installment.id },
          data: { status: "PAID" },
        });

        // Cria log de visita
        await tx.visitLog.create({
          data: {
            clientId,
            collectorId: (await tx.collectionRouteStop.findUnique({
              where: { id: stopId },
              select: { route: { select: { collectorId: true } } },
            }))?.route?.collectorId || "",
            type: "PAYMENT",
            notes: `Pagamento recebido: R$ ${installment.valor.toFixed(2)} - ${paymentMethod}${receiptPhotoPath ? " (com foto)" : ""}`,
            lat: latitude,
            lng: longitude,
          },
        });

        createdPayments.push(payment);
      }

      // Atualiza a parada como visitada
      await tx.collectionRouteStop.update({
        where: { id: stopId },
        data: {
          visited: true,
          visitedAt: new Date(),
          latitude,
          longitude,
        },
      });

      return createdPayments;
    });

    // Gera número do recibo
    const receiptNumber = `REC${Date.now()}`;

    return NextResponse.json({
      success: true,
      message: "Pagamento registrado com sucesso",
      receiptId: payments[0]?.id,
      receiptNumber,
      totalAmount,
      paymentsCount: payments.length,
      receiptPhotoPath,
    });

  } catch (error: any) {
    console.error("Erro ao registrar pagamento:", error);
    return NextResponse.json(
      { error: "Erro ao registrar pagamento", message: error.message },
      { status: 500 }
    );
  }
}
