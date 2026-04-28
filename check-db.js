const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const suppliers = await prisma.supplier.count();
  const products = await prisma.product.count();
  const clients = await prisma.client.count();
  const users = await prisma.user.count();
  
  console.log({
    suppliers,
    products,
    clients,
    users,
  });
  
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
