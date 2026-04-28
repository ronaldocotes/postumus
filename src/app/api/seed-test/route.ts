import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let suppliersCreated = 0;
    let productsCreated = 0;

    // Verificar e criar fornecedores de teste
    const suppliersCount = await prisma.supplier.count();
    
    if (suppliersCount === 0) {
      const result = await prisma.supplier.createMany({
        data: [
          {
            name: "Distribuidor Regional Ltda",
            cnpj: "12.345.678/0001-90",
            phone: "(11) 3000-0000",
            city: "São Paulo",
            state: "SP",
            active: true,
          },
          {
            name: "Fornecedora Nacional S/A",
            cnpj: "98.765.432/0001-10",
            phone: "(21) 3001-0001",
            city: "Rio de Janeiro",
            state: "RJ",
            active: true,
          },
          {
            name: "Importadora Express",
            cnpj: "56.789.012/0001-30",
            phone: "(31) 3002-0002",
            city: "Belo Horizonte",
            state: "MG",
            active: true,
          },
        ],
        skipDuplicates: true,
      });
      suppliersCreated = result.count;
    }

    // Verificar e criar produtos de teste
    const productsCount = await prisma.product.count();
    
    if (productsCount === 0) {
      const result = await prisma.product.createMany({
        data: [
          { name: "Urna Simples", description: "Urna de madeira simples", price: 500.00, active: true },
          { name: "Urna Premium", description: "Urna de madeira premium com acabamento", price: 1500.00, active: true },
          { name: "Caixão Importado", description: "Caixão de importação", price: 3000.00, active: true },
          { name: "Flores Decorativas", description: "Arranjo de flores", price: 150.00, active: true },
          { name: "Velas Perfumadas", description: "Kit com 5 velas", price: 80.00, active: true },
        ],
        skipDuplicates: true,
      });
      productsCreated = result.count;
    }

    return new Response(
      JSON.stringify({
        message: "Dados de teste carregados",
        suppliersCreated,
        productsCreated,
        totalSuppliers: suppliersCount + suppliersCreated,
        totalProducts: productsCount + productsCreated,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Seed error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}
