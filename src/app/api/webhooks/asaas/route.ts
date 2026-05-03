import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-fixed";

// Asaas webhook for PIX payment confirmations
const ASAAS_WEBHOOK_SECRET = process.env.ASAAS_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    // 1. Validate webhook signature
    const signature = request.headers.get("asaas-signature");

    if (ASAAS_WEBHOOK_SECRET) {
      if (!signature || signature !== ASAAS_WEBHOOK_SECRET) {
        console.warn("Asaas webhook: assinatura inválida");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();
    console.log("Asaas webhook received:", body);

    // Asaas sends events like: PAYMENT_RECEIVED, PAYMENT_CONFIRMED, etc.
    const event = body.event;
    const paymentData = body.payment;

    if (!paymentData) {
      return NextResponse.json({ message: "No payment data" }, { status: 200 });
    }

    // Only process PIX payments
    if (paymentData.billingType !== "PIX") {
      return NextResponse.json({ message: "Not a PIX payment" }, { status: 200 });
    }

    if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
      console.log(`PIX payment ${paymentData.id} confirmed for value ${paymentData.value}`);

      // Find local payment by Asaas payment ID
      const localPayment = await prisma.payment.findFirst({
        where: { pixCode: paymentData.id },
        include: {
          installment: {
            include: {
              carne: {
                include: { client: { select: { name: true, id: true } } },
              },
            },
          },
          receivedBy: { select: { id: true, name: true } },
        },
      });

      if (localPayment) {
        // Update payment status if needed
        await prisma.payment.update({
          where: { id: localPayment.id },
          data: { notes: `${localPayment.notes || ""} | PIX confirmado Asaas em ${new Date().toISOString()}` },
        });

        // Send push notification to the collector
        await sendPushNotification(localPayment.receivedBy?.id, {
          title: "PIX Recebido!",
          body: `R$ ${paymentData.value} de ${localPayment.installment.carne.client.name}`,
          url: "/mobile/cobrador",
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Erro no webhook Asaas:", error);
    return NextResponse.json(
      { error: "Webhook error", message: error.message },
      { status: 500 }
    );
  }
}

// Asaas requires GET for webhook validation sometimes
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: "Webhook endpoint active" });
}

async function sendPushNotification(
  userId: string | undefined,
  data: { title: string; body: string; url: string }
) {
  if (!userId) return;

  try {
    const subs = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    for (const sub of subs) {
      try {
        await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // In production, use web-push library with VAPID keys
          },
          body: JSON.stringify({
            notification: {
              title: data.title,
              body: data.body,
              icon: "/icon-192x192.png",
              data: { url: data.url },
            },
          }),
        });
      } catch (e) {
        console.error("Erro ao enviar push:", e);
      }
    }
  } catch (e) {
    console.error("Erro ao buscar subscriptions:", e);
  }
}
