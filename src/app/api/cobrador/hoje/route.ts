import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma-fixed";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const today = new Date();
    const dayOfMonth = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // Build where clause - admins see all, cobradores see their clients
    const clientWhere: any = {
      active: true,
      status: "ACTIVE",
      dueDay: dayOfMonth,
    };

    if (userRole === "COBRADOR") {
      clientWhere.cobradorId = userId;
    }

    const clients = await prisma.client.findMany({
      where: clientWhere,
      select: {
        id: true,
        name: true,
        address: true,
        number: true,
        neighborhood: true,
        city: true,
        cellphone: true,
        phone: true,
        dueDay: true,
        monthlyValue: true,
        latitude: true,
        longitude: true,
        billingAddress: true,
        billingNeighborhood: true,
        billingLatitude: true,
        billingLongitude: true,
        billingAddressSame: true,
        routeOrder: true,
        carnes: {
          select: {
            id: true,
            year: true,
            installments: {
              where: {
                status: { in: ["PENDING", "LATE"] },
              },
              orderBy: { numero: "asc" },
              take: 1,
              select: {
                id: true,
                numero: true,
                valor: true,
                dueDate: true,
                status: true,
                payment: { select: { id: true } },
              },
            },
          },
          where: {
            year: currentYear,
          },
        },
      },
      orderBy: [
        { neighborhood: "asc" },
        { routeOrder: "asc" },
        { name: "asc" },
      ],
    });

    // Flatten to include installment info
    const result = clients
      .map((client) => {
        const pendingInstallments = client.carnes.flatMap((c) =>
          c.installments.filter((i) => !i.payment)
        );
        if (pendingInstallments.length === 0) return null;

        const installment = pendingInstallments[0];
        const dueDate = new Date(installment.dueDate);
        const isOverdue =
          dueDate < today &&
          !(
            dueDate.getMonth() === currentMonth &&
            dueDate.getFullYear() === currentYear
          );

        const effectiveLat = client.billingAddressSame
          ? client.latitude
          : client.billingLatitude ?? client.latitude;
        const effectiveLng = client.billingAddressSame
          ? client.longitude
          : client.billingLongitude ?? client.longitude;
        const effectiveAddress = client.billingAddressSame
          ? `${client.address ?? ""} ${client.number ?? ""}`.trim()
          : `${client.billingAddress ?? client.address ?? ""} ${client.number ?? ""}`.trim();
        const effectiveNeighborhood = client.billingAddressSame
          ? client.neighborhood
          : client.billingNeighborhood ?? client.neighborhood;

        return {
          clientId: client.id,
          clientName: client.name,
          address: effectiveAddress,
          neighborhood: effectiveNeighborhood,
          city: client.city,
          cellphone: client.cellphone,
          phone: client.phone,
          latitude: effectiveLat,
          longitude: effectiveLng,
          routeOrder: client.routeOrder,
          installmentId: installment.id,
          installmentNumber: installment.numero,
          installmentValue: installment.valor,
          dueDate: installment.dueDate,
          status: isOverdue ? "OVERDUE" : "PENDING",
        };
      })
      .filter(Boolean);

    return NextResponse.json({ clients: result, total: result.length });
  } catch (error: any) {
    console.error("Erro na API cobrador/hoje:", error);
    return NextResponse.json(
      { error: "Erro interno", message: error.message },
      { status: 500 }
    );
  }
}
