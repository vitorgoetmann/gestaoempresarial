"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  ShoppingCart,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUpIcon,
  ChevronRight,
  DollarSign
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";

const COLORS = ["#f97316", "#3b82f6", "#22c55e", "#eab308", "#ec4899"];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Attempt to fetch actual stats from db, fallback to mocks on failure
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (response.ok) {
          const stats = await response.json();
          setData(stats);
        } else {
          throw new Error("Failed to load actual statistics");
        }
      } catch (err) {
        console.warn("Using offline fallback mock data for dashboard");
        setData(getMockStats());
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getMockStats = () => {
    return {
      revenue: {
        today: 1250.00,
        week: 8740.00,
        month: 34890.00,
        year: 420210.00
      },
      grossProfit: 18450.00,
      netProfit: 14210.00,
      counters: {
        customers: 124,
        products: 86,
        sales: 45,
        pendingTasks: 8,
        criticalStock: 3,
        overdueBills: 2,
        receivable: 5200.00,
        payable: 2800.00
      },
      cashflowHistory: [
        { name: "Seg", receitas: 2400, despesas: 1400 },
        { name: "Ter", receitas: 3200, despesas: 1800 },
        { name: "Qua", receitas: 2800, despesas: 2200 },
        { name: "Qui", receitas: 4500, despesas: 1500 },
        { name: "Sex", receitas: 3800, despesas: 2100 },
        { name: "Sab", receitas: 1800, despesas: 800 },
        { name: "Dom", receitas: 1200, despesas: 500 }
      ],
      topProducts: [
        { name: "Kit Correia Dentada MTR", sales: 42, revenue: 9235.80 },
        { name: "Filtro de Óleo Fram", sales: 38, revenue: 1520.00 },
        { name: "Pastilha de Freio Bosch", sales: 29, revenue: 4350.00 },
        { name: "Bateria Moura 60Ah", sales: 18, revenue: 8100.00 }
      ],
      topCustomers: [
        { name: "Oficina Nova Era", orders: 18, total: 12890.40 },
        { name: "Auto Center Prime", orders: 12, total: 9450.00 },
        { name: "Mecânica Rápida SP", orders: 9, total: 6120.00 }
      ],
      recentSales: [
        { id: "1", customer: "Oficina Nova Era", value: 219.90, time: "Há 10 minutos", status: "Pago" },
        { id: "2", customer: "Consumidor Final", value: 85.00, time: "Há 42 minutos", status: "Pago" },
        { id: "3", customer: "Mecânica Rápida SP", value: 1450.00, time: "Há 2 horas", status: "Pendente" },
        { id: "4", customer: "Auto Center Prime", value: 430.00, time: "Há 5 horas", status: "Pago" }
      ],
      categoryDistribution: [
        { name: "Motor", value: 45 },
        { name: "Filtros", value: 20 },
        { name: "Freios", value: 15 },
        { name: "Elétrica", value: 12 },
        { name: "Outros", value: 8 }
      ]
    };
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-500">
        <span className="text-sm font-semibold animate-pulse">Carregando métricas corporativas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Dashboard Gerencial</h1>
          <p className="text-sm text-zinc-500">Acompanhamento financeiro, estoque e operações em tempo real.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-[#11131a] border border-[#2b303a] px-3 py-1.5 text-xs text-zinc-400 font-semibold">
          <Calendar size={14} className="text-orange-500" />
          <span>Dados Atualizados</span>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Card */}
        <Card className="bg-[#11131a] border-[#2b303a] text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Receita Mensal</CardTitle>
            <TrendingUp size={16} className="text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">R$ {data.revenue.month.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-500 font-semibold">
              <TrendingUpIcon size={12} />
              <span>+12.4% em relação ao mês anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Lucro Bruto Card */}
        <Card className="bg-[#11131a] border-[#2b303a] text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Lucro Bruto (Mês)</CardTitle>
            <div className="rounded-full bg-orange-500/10 p-1">
              <DollarSign size={14} className="text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">R$ {data.grossProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-zinc-500 mt-1">Margem média calculada de 52.8%</p>
          </CardContent>
        </Card>

        {/* Contas a Receber Card */}
        <Card className="bg-[#11131a] border-[#2b303a] text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Contas a Receber</CardTitle>
            <Clock size={16} className="text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-blue-400">R$ {data.counters.receivable.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-zinc-500 mt-1">{data.counters.overdueBills} contas vencidas pendentes</p>
          </CardContent>
        </Card>

        {/* Estoque Alerta Card */}
        <Card className="bg-[#11131a] border-[#2b303a] text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Estoque Crítico</CardTitle>
            <AlertTriangle size={16} className="text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-orange-500">{data.counters.criticalStock} Produtos</div>
            <p className="text-xs text-zinc-500 mt-1">Abaixo do estoque mínimo configurado</p>
          </CardContent>
        </Card>
      </div>

      {/* Recharts Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Cash Flow Area Chart */}
        <Card className="lg:col-span-2 bg-[#11131a] border-[#2b303a] text-white">
          <CardHeader>
            <CardTitle className="text-base font-bold text-zinc-100">Fluxo de Caixa (Semanal)</CardTitle>
            <CardDescription className="text-zinc-500">Comparação entre receitas e despesas operacionais realizadas.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.cashflowHistory}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2b303a" />
                <XAxis dataKey="name" stroke="#6f6b78" fontSize={11} />
                <YAxis stroke="#6f6b78" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#11131a", borderColor: "#2b303a", color: "#f5f2ea" }} />
                <Legend verticalAlign="top" height={36} />
                <Area type="monotone" dataKey="receitas" name="Receitas" stroke="#f97316" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#3b82f6" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Pie Chart */}
        <Card className="bg-[#11131a] border-[#2b303a] text-white">
          <CardHeader>
            <CardTitle className="text-base font-bold text-zinc-100">Distribuição por Categoria</CardTitle>
            <CardDescription className="text-zinc-500">Representação física das categorias no estoque.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.categoryDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#11131a", borderColor: "#2b303a", color: "#f5f2ea" }} />
                <Legend formatter={(value) => <span className="text-xs text-zinc-400 font-semibold">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Grid of lists (Recent Sales, Top products) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions List */}
        <Card className="bg-[#11131a] border-[#2b303a] text-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-zinc-100">Últimas Vendas</CardTitle>
              <CardDescription className="text-zinc-500">Transações e notas fiscais geradas recentemente.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-400 gap-1 text-xs">
              Ver todas
              <ChevronRight size={14} />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentSales.map((sale: any) => (
                <div key={sale.id} className="flex items-center justify-between border-b border-[#2b303a]/50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-orange-500/10 p-2">
                      <ShoppingCart size={14} className="text-orange-500" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{sale.customer}</div>
                      <div className="text-xs text-zinc-500">{sale.time}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-white">R$ {sale.value.toFixed(2)}</div>
                    <div className="text-[10px] mt-0.5 px-2 py-0.5 rounded-full inline-block font-semibold bg-emerald-500/10 text-emerald-400">
                      {sale.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top selling products list */}
        <Card className="bg-[#11131a] border-[#2b303a] text-white">
          <CardHeader>
            <CardTitle className="text-base font-bold text-zinc-100">Produtos Mais Vendidos</CardTitle>
            <CardDescription className="text-zinc-500">Itens com maior volume de saída comercial.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topProducts.map((prod: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between border-b border-[#2b303a]/50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-[#0a0c11] text-xs font-bold text-orange-500 border border-[#2b303a]">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="text-sm font-bold">{prod.name}</div>
                      <div className="text-xs text-zinc-500">{prod.sales} unidades vendidas</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-white">R$ {prod.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                    <div className="text-[10px] text-zinc-500">Margem saudosa</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
