import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma-fixed";

// Asaas API configuration
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_ENV = process.env.ASAAS_ENV || "sandbox"; // sandbox or production
const ASAAS_BASE_URL =
  ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await request.json();
    const { installmentId, paymentMethod, latitude, longitude, notes } = data;

    if (!installmentId || !paymentMethod) {
      return NextResponse.json(
        { error: "installmentId e paymentMethod são obrigatórios" },
        { status: 400 }
      );
    }

    // Check if already paid
    const existing = await prisma.payment.findUnique({
      where: { installmentId },
    });
    if (existing) {
      return NextResponse.json({ error: "Parcela já paga" }, { status: 400 });
    }

    // Get installment details
    const installment = await prisma.installment.findUnique({
      where: { id: installmentId },
      include: {
        carne: {
          include: { client: { select: { id: true, name: true, cpf: true, email: true, phone: true } } },
        },
      },
    });

    if (!installment) {
      return NextResponse.json({ error: "Parcela não encontrada" }, { status: 404 });
    }

    const userId = (session.user as any).id;
    const client = installment.carne.client;

    // If PIX and Asaas is configured, create dynamic PIX
    let pixQrCode: string | null = null;
    let pixPayload: string | null = null;
    let asaasPaymentId: string | null = null;

    if (paymentMethod === "PIX" && ASAAS_API_KEY) {
      try {
        // Find or create Asaas customer
        let customerId = await findOrCreateAsaasCustomer(client);

        // Create PIX payment in Asaas
        const asaasPayment = await createAsaasPixPayment(
          customerId,
          installment.valor,
          `Parcela ${installment.numero} - ${client.name}`,
          installment.dueDate
        );

        asaasPaymentId = asaasPayment.id;
        pixQrCode = asaasPayment.qrCode?.encodedImage || null;
        pixPayload = asaasPayment.qrCode?.payload || null;
      } catch (asaasError: any) {
        console.error("Erro Asaas:", asaasError);
        // Continue without Asaas - will create local payment only
      }
    }

    // Create local payment record
    const payment = await prisma.payment.create({
      data: {
        installmentId,
        paidAmount: installment.valor,
        paidAt: new Date(),
        paymentMethod: paymentMethod,
        receivedById: userId,
        notes: notes || null,
        pixCode: pixPayload,
      },
    });

    // Update installment status
    await prisma.installment.update({
      where: { id: installmentId },
      data: { status: "PAID" },
    });

    // Create financial transaction
    try {
      await prisma.financialTransaction.create({
        data: {
          type: "INCOME",
          description: `Cobrador: ${client.name} - carnê ${installment.carne.year} parcela ${installment.numero}`,
          amount: installment.valor,
          date: new Date(),
          category: "Carnê",
          status: "PAID",
          clientId: installment.carne.clientId,
        },
      });
    } catch (e) {
      console.error("Erro ao criar transação financeira:", e);
    }

    // Log visit with geolocation
    if (latitude && longitude) {
      try {
        await prisma.visitLog.create({
          data: {
            clientId: installment.carne.clientId,
            collectorId: userId,
            type: "PAYMENT",
            lat: latitude,
            lng: longitude,
            notes: `Pagamento parcela ${installment.numero} - ${paymentMethod}`,
          },
        });
      } catch (e) {
        console.error("Erro ao registrar visita:", e);
      }
    }

    return NextResponse.json(
      {
        success: true,
        payment,
        clientName: client.name,
        valor: installment.valor,
        numero: installment.numero,
        pixQrCode,
        pixPayload,
        asaasPaymentId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erro ao registrar pagamento:", error);
    return NextResponse.json(
      { error: "Erro ao registrar pagamento", message: error.message },
      { status: 500 }
    );
  }
}

async function findOrCreateAsaasCustomer(client: {
  id: string;
  name: string;
  cpf: string | null;
  email: string | null;
  phone: string | null;
}): Promise<string> {
  if (!ASAAS_API_KEY) throw new Error("Asaas API key not configured");

  // Try to find existing customer by CPF or email
  const searchRes = await fetch(
    `${ASAAS_BASE_URL}/customers?cpfCnpj=${client.cpf || ""}`,
    {
      headers: {
        Authorization: `Bearer ${ASAAS_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.data?.length > 0) {
      return searchData.data[0].id;
    }
  }

  // Create new customer
  const createRes = await fetch(`${ASAAS_BASE_URL}/customers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ASAAS_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: client.name,
      cpfCnpj: client.cpf,
      email: client.email,
      phone: client.phone,
      externalReference: client.id,
    }),
  });

  if (!createRes.ok) {
    const error = await createRes.json();
    throw new Error(error.errors?.[0]?.description || "Erro ao criar cliente Asaas");
  }

  const customer = await createRes.json();
  return customer.id;
}

async function createAsaasPixPayment(
  customerId: string,
  value: number,
  description: string,
  dueDate: Date
) {
  if (!ASAAS_API_KEY) throw new Error("Asaas API key not configured");

  const res = await fetch(`${ASAAS_BASE_URL}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ASAAS_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer: customerId,
      billingType: "PIX",
      value,
      description,
      dueDate: dueDate.toISOString().split("T")[0],
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.errors?.[0]?.description || "Erro ao criar pagamento PIX");
  }

  const payment = await res.json();

  // Get QR Code
  const qrRes = await fetch(`${ASAAS_BASE_URL}/payments/${payment.id}/pixQrCode`, {
    headers: {
      Authorization: `Bearer ${ASAAS_API_KEY}`,
    },
  });

  if (qrRes.ok) {
    const qrData = await qrRes.json();
    payment.qrCode = qrData;
  }

  return payment;
}
