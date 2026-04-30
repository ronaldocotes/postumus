"use client";

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

interface DashboardChartsProps {
  stats: {
    clients: number;
    suppliers: number;
    products: number;
    overdueInstallments: number;
    totalReceivable: number;
    totalPayable: number;
    paidInstallments: number;
    completedServices: number;
  };
}

export default function DashboardCharts({ stats }: DashboardChartsProps) {
  // Dados para gráfico mensal (simulado baseado nos dados reais)
  const monthlyData = [
    { mes: "Jan", receitas: 2400, despesas: 1800 },
    { mes: "Fev", receitas: 3200, despesas: 2100 },
    { mes: "Mar", receitas: 2800, despesas: 1900 },
    { mes: "Abr", receitas: stats.totalReceivable || 1500, despesas: stats.totalPayable || 800 },
    { mes: "Mai", receitas: 0, despesas: 0 },
    { mes: "Jun", receitas: 0, despesas: 0 },
  ];

  // Dados para gráfico semanal
  const weeklyData = [
    { dia: "Seg", atendimentos: 5 },
    { dia: "Ter", atendimentos: 8 },
    { dia: "Qua", atendimentos: 12 },
    { dia: "Qui", atendimentos: 7 },
    { dia: "Sex", atendimentos: 15 },
    { dia: "Sáb", atendimentos: 3 },
  ];

  // Dados para gráfico de pizza - Status dos clientes
  const statusData = [
    { name: "Ativos", value: stats.clients, color: "#10b981" },
    { name: "Inadimplentes", value: stats.overdueInstallments || 1, color: "#ef4444" },
    { name: "Em dia", value: stats.paidInstallments || 1, color: "#3b82f6" },
  ];

  // Dados para gráfico de serviços
  const servicesData = [
    { tipo: "Funerais", quantidade: stats.completedServices || 8 },
    { tipo: "Cremação", quantidade: 3 },
    { tipo: "Traslado", quantidade: 5 },
    { tipo: "Velório", quantidade: stats.completedServices || 7 },
    { tipo: "Outros", quantidade: 2 },
  ];

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Gráfico de Área - Receitas vs Despesas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          Receitas vs Despesas — 2026
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#6b7280" }} />
            <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip 
              formatter={(value: any) => [`R$ ${Number(value).toLocaleString("pt-BR")}`, ""]}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
            <Area type="monotone" dataKey="receitas" stroke="#10b981" strokeWidth={2.5} fill="url(#colorReceitas)" name="Receitas" />
            <Area type="monotone" dataKey="despesas" stroke="#ef4444" strokeWidth={2.5} fill="url(#colorDespesas)" name="Despesas" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Barras - Atendimentos na Semana */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          Atendimentos na Semana
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "#6b7280" }} />
            <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
            <Tooltip 
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }}
            />
            <Bar dataKey="atendimentos" name="Atendimentos" radius={[6, 6, 0, 0]}>
              {weeklyData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={index === 4 ? "#f59e0b" : "#10b981"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Pizza - Situação dos Clientes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
          Situação dos Clientes
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => [value, ""]}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }}
            />
            <Legend 
              iconType="circle" 
              wrapperStyle={{ fontSize: "12px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Barras Horizontal - Serviços */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
          Serviços Realizados
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={servicesData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 12, fill: "#6b7280" }} />
            <YAxis dataKey="tipo" type="category" width={80} tick={{ fontSize: 12, fill: "#6b7280" }} />
            <Tooltip 
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }}
            />
            <Bar dataKey="quantidade" name="Quantidade" radius={[0, 6, 6, 0]}>
              {servicesData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
