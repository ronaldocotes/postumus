import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import webpush from "web-push";

// POST: Envia notificação push
export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, data, actions } = await request.json();

    if (!userId || !title) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      );
    }

    // Configura VAPID
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        { error: "VAPID não configurado" },
        { status: 500 }
      );
    }

    webpush.setVapidDetails(
      "mailto:admin@funeraria.com",
      vapidPublicKey,
      vapidPrivateKey
    );

    // Busca subscriptions do usuário
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: "Usuário não tem subscriptions" },
        { status: 404 }
      );
    }

    // Envia notificação para cada subscription
    const payload = JSON.stringify({
      title,
      body,
      data: data || {},
      actions: actions || [],
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        )
      )
    );

    // Remove subscriptions inválidas
    const invalidSubs = subscriptions.filter((_, i) =>
      results[i].status === "rejected"
    );

    if (invalidSubs.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: {
          endpoint: {
            in: invalidSubs.map((s) => s.endpoint),
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      sent: results.filter((r) => r.status === "fulfilled").length,
      failed: invalidSubs.length,
    });

  } catch (error: any) {
    console.error("Erro ao enviar notificação:", error);
    return NextResponse.json(
      { error: "Erro ao enviar notificação" },
      { status: 500 }
    );
  }
}
