import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // 1. Busca todos os cobradores ativos com zona definida
    const collectors = await prisma.user.findMany({
      where: {
        role: "COBRADOR",
        zone: { not: null },
        active: true,
      },
      select: { id: true, zone: true, name: true },
    });

    if (collectors.length === 0) {
      return NextResponse.json(
        { error: "Nenhum cobrador com zona definida encontrado." },
        { status: 400 }
      );
    }

    // Cria mapa de zona -> cobrador
    const collectorZoneMap = new Map<string, { id: string; name: string }>();
    collectors.forEach((c) => {
      if (c.zone) collectorZoneMap.set(c.zone, { id: c.id, name: c.name });
    });

    // 2. Busca clientes sem cobrador mas com zona definida
    const clientsWithoutCollector = await prisma.client.findMany({
      where: {
        cobradorId: null,
        zone: { not: null },
        active: true,
      },
      select: { id: true, zone: true, name: true },
    });

    if (clientsWithoutCollector.length === 0) {
      return NextResponse.json({ 
        message: "Nenhum cliente precisando de atribuição.",
        stats: { totalProcessed: 0, assigned: 0, noMatchingZone: 0 }
      });
    }

    let assignedCount = 0;
    let notAssignedCount = 0;
    const assignments: { client: string; collector: string; zone: string }[] = [];

    // 3. Processa atribuição cruzando zonas
    const updatePromises = clientsWithoutCollector.map(async (client) => {
      const matchedCollector = collectorZoneMap.get(client.zone as string);

      if (matchedCollector) {
        assignedCount++;
        assignments.push({
          client: client.name,
          collector: matchedCollector.name,
          zone: client.zone as string,
        });

        return prisma.client.update({
          where: { id: client.id },
          data: { cobradorId: matchedCollector.id },
        });
      } else {
        notAssignedCount++;
        return Promise.resolve(null);
      }
    });

    // Executa todas as atualizações
    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: "Atribuição concluída com sucesso.",
      stats: {
        totalProcessed: clientsWithoutCollector.length,
        assigned: assignedCount,
        noMatchingZone: notAssignedCount,
      },
      assignments: assignments.slice(0, 10), // Mostra primeiras 10 atribuições
    });

  } catch (error) {
    console.error("Erro ao atribuir cobradores:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar atribuições." },
      { status: 500 }
    );
  }
}

// GET: Listar cobradores e clientes por zona (para visualização)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zone = searchParams.get("zone");

    // Lista cobradores por zona
    const collectorsByZone = await prisma.user.groupBy({
      by: ["zone"],
      where: {
        role: "COBRADOR",
        zone: { not: null },
      },
      _count: { id: true },
    });

    // Lista clientes sem cobrador por zona
    const unassignedClientsByZone = await prisma.client.groupBy({
      by: ["zone"],
      where: {
        cobradorId: null,
        zone: { not: null },
      },
      _count: { id: true },
    });

    // Se solicitou zona específica, retorna detalhes
    if (zone) {
      const collectors = await prisma.user.findMany({
        where: {
          role: "COBRADOR",
          zone,
        },
        select: { id: true, name: true },
      });

      const clients = await prisma.client.findMany({
        where: {
          zone,
          cobradorId: null,
        },
        select: { id: true, name: true, neighborhood: true },
      });

      return NextResponse.json({
        zone,
        collectors,
        unassignedClients: clients,
      });
    }

    return NextResponse.json({
      summary: {
        collectorsByZone,
        unassignedClientsByZone,
      },
    });

  } catch (error) {
    console.error("Erro ao buscar dados de zonas:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar dados." },
      { status: 500 }
    );
  }
}
