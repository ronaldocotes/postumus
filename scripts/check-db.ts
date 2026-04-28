import { prisma } from "@/lib/prisma";

async function checkDatabase() {
  try {
    const clientCount = await prisma.client.count();
    const activeClients = await prisma.client.count({ where: { active: true } });
    
    console.log("Total de clientes:", clientCount);
    console.log("Clientes ativos:", activeClients);
    
    if (clientCount > 0) {
      const firstClients = await prisma.client.findMany({ take: 3 });
      console.log("\nPrimeiros clientes:");
      firstClients.forEach(c => console.log(`  - ${c.name} (${c.status})`));
    }
  } catch (error) {
    console.error("Erro ao consultar banco:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
