require('dotenv').config();
const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando conexão com o banco...');
  
  try {
    const [suppliers, products, clients, users] = await Promise.all([
      prisma.supplier.count(),
      prisma.product.count(),
      prisma.client.count(),
      prisma.user.count()
    ]);
    
    console.log('✅ Banco conectado com sucesso!');
    console.log({
      suppliers,
      products,
      clients,
      users,
    });
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro ao conectar com o banco de dados.');
    console.error('Detalhes do erro:', err);
    process.exit(1);
  }
}

main();
