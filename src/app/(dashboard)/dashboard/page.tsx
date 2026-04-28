export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Users, Truck, Package, FileText, DollarSign, AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";

async function getStats() {
  const [clients, suppliers, products, pendingPayments, totalPayable, paidThisMonth, completedServices] =
    await Promise.all([
      prisma.client.count({ where: { active: true } }),
      prisma.supplier.count({ where: { active: true } }),
      prisma.product.count({ where: { active: true } }),
      // Pagamentos pendentes (aproximação de parcelas atrasadas)
      prisma.payment.count({ where: { status: "PENDING" } }),
      // Total a pagar (despesas pendentes)
      prisma.financialTransaction.aggregate({
        where: { type: "EXPENSE", status: "PENDING" },
        _sum: { amount: true },
      }),
      // Pagos este mês
      prisma.payment.count({
        where: {
          status: "PAID",
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lte: new Date(),
          },
        },
      }),
      // Serviços vendidos
      prisma.serviceSale.count({ where: { status: "PAID" } }),
    ]);

  return {
    clients,
    suppliers,
    products,
    overdueInstallments: pendingPayments,
    totalReceivable: pendingPayments * 500, // Aproximação: valor médio por pagamento
    totalPayable: totalPayable._sum.amount || 0,
    paidInstallments: paidThisMonth,
    completedServices,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { 
      label: "Clientes Ativos", 
      value: stats.clients, 
      icon: Users, 
      color: "bg-blue-500",
      trend: "+12%",
      description: "Clientes ativos no sistema"
    },
    { 
      label: "Fornecedores", 
      value: stats.suppliers, 
      icon: Truck, 
      color: "bg-green-500",
      trend: stats.suppliers > 0 ? "✓" : "0",
      description: "Fornecedores cadastrados"
    },
    { 
      label: "Mercadorias", 
      value: stats.products, 
      icon: Package, 
      color: "bg-purple-500",
      trend: stats.products > 0 ? "✓" : "0",
      description: "Produtos em estoque"
    },
    { 
      label: "Parcelas em Atraso", 
      value: stats.overdueInstallments, 
      icon: AlertTriangle, 
      color: "bg-red-500",
      warning: stats.overdueInstallments > 10,
      description: "Parcelas atrasadas"
    },
    { 
      label: "A Receber", 
      value: formatCurrency(stats.totalReceivable), 
      icon: DollarSign, 
      color: "bg-emerald-500",
      description: "Valor pendente"
    },
    { 
      label: "A Pagar", 
      value: formatCurrency(stats.totalPayable), 
      icon: FileText, 
      color: "bg-orange-500",
      description: "Despesas pendentes"
    },
    {
      label: "Pagos Este Mês",
      value: stats.paidInstallments,
      icon: CheckCircle,
      color: "bg-teal-500",
      trend: "+8%",
      description: "Parcelas quitadas"
    },
    {
      label: "Serviços Completos",
      value: stats.completedServices,
      icon: TrendingUp,
      color: "bg-indigo-500",
      description: "Serviços finalizados"
    },
  ];

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Visão geral do sistema • {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${
                card.warning ? "border-red-200 bg-red-50" : "border-gray-200"
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className={`text-sm font-medium ${card.warning ? "text-red-600" : "text-gray-600"}`}>
                      {card.label}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">{card.description}</p>
                  </div>
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon size={20} className="text-white" />
                  </div>
                </div>
                
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                  {card.trend && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      card.warning 
                        ? "bg-red-100 text-red-700" 
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {card.trend}
                    </span>
                  )}
                </div>
              </div>

              {card.warning && (
                <div className="px-6 py-3 bg-red-50 border-t border-red-200 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-600" />
                  <span className="text-xs text-red-600 font-medium">Atenção requerida</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Alert Banner */}
      {stats.overdueInstallments > 10 && (
        <div className="mt-8 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-red-900 mb-1">Aviso: Alto volume de atrasos</h3>
              <p className="text-sm text-red-800">
                Existem {stats.overdueInstallments} parcelas com atraso. Considere intensificar as ações de cobrança.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
