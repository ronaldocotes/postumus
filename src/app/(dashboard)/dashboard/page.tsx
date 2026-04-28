export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Users, Truck, Package, FileText, DollarSign, AlertTriangle } from "lucide-react";

async function getStats() {
  const [clients, suppliers, products, overdueInstallments, pendingInstallments, totalPayable] =
    await Promise.all([
      prisma.client.count({ where: { active: true } }),
      prisma.supplier.count({ where: { active: true } }),
      prisma.product.count({ where: { active: true } }),
      // Parcelas atrasadas (Installment com status LATE)
      prisma.installment.count({ where: { status: "LATE" } }),
      // Total a receber (soma de parcelas pendentes)
      prisma.installment.aggregate({
        where: { status: { in: ["PENDING", "LATE"] } },
        _sum: { valor: true },
      }),
      // Total a pagar (despesas pendentes)
      prisma.financialTransaction.aggregate({
        where: { type: "EXPENSE", status: "PENDING" },
        _sum: { amount: true },
      }),
    ]);

  return {
    clients,
    suppliers,
    products,
    overdueInstallments,
    totalReceivable: pendingInstallments._sum.valor || 0,
    totalPayable: totalPayable._sum.amount || 0,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Clientes Ativos", value: stats.clients, icon: Users, color: "bg-blue-500" },
    { label: "Fornecedores", value: stats.suppliers, icon: Truck, color: "bg-green-500" },
    { label: "Mercadorias", value: stats.products, icon: Package, color: "bg-purple-500" },
    { label: "Carnês em Atraso", value: stats.overdueInstallments, icon: AlertTriangle, color: "bg-red-500" },
    { label: "A Receber", value: formatCurrency(stats.totalReceivable), icon: DollarSign, color: "bg-emerald-500" },
    { label: "A Pagar", value: formatCurrency(stats.totalPayable), icon: FileText, color: "bg-orange-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {card.value}
                  </p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
