const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Test direct query
    const count = await prisma.product.count();
    console.log('Product count:', count);
    
    const products = await prisma.product.findMany({ take: 5 });
    console.log('First 5 products:', JSON.stringify(products, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
