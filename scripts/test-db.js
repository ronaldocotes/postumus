// Script para testar a API de clientes localmente
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  try {
    console.log("Testando conexão com o banco...");
    
    const count = await prisma.client.count();
    console.log("Total de clientes no banco:", count);
    
    const clients = await prisma.client.findMany({
      take: 5,
      include: {
        cobrador: { select: { name: true } },
        _count: { select: { dependents: true } },
      },
    });
    
    console.log("\nClientes encontrados:");
    clients.forEach(c => {
      console.log(`  - ${c.name} (status: ${c.status}, ativo: ${c.active})`);
    });
    
  } catch (error) {
    console.error("Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
