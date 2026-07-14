import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { Users, TrendingUp, Calendar, RefreshCcw, ArrowUpRight, ArrowDownRight, DollarSign, Award, Heart, ShoppingBag } from 'lucide-react';

interface Stats {
  totalClients: number;
  byPlatform: Record<string, number>;
  byStatus: { active: number, expired: number, warning: number };
  expirations: { next7Days: number, next15Days: number, next30Days: number };
  historyTrend?: Array<{ name: string; ventas: number }>;
  newsCount: number;
  renewalsCount: number;
  churnedCount: number;
  financials: {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    trend: Array<{ name: string; ingresos: number; egresos: number; ganancias: number }>;
  };
  loyalty: {
    topPurchasers: Array<{ phone: string; name: string; count: number }>;
    topRenewals: Array<{ phone: string; name: string; count: number }>;
    topSpenders: Array<{ phone: string; name: string; count: number }>;
  };
}

const COLORS = ['#6366f1', '#10b981', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ec4899', '#f43f5e', '#3b82f6'];

export const AnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<string>('all_time');

  const fetchStats = async () => {
    setLoading(true);
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/stats?timeframe=${timeframe}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeframe]);

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCcw className="w-10 h-10 text-brand-primary animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse">Analizando base de datos en tiempo real...</p>
      </div>
    );
  }

  const platformData = Object.entries(stats.byPlatform).map(([name, value]) => ({ name, value }));
  
  const expirationData = [
    { name: '7 días', vences: stats.expirations.next7Days },
    { name: '15 días', vences: stats.expirations.next15Days },
    { name: '30 días', vences: stats.expirations.next30Days },
  ];

  const statusData = [
    { name: 'Activos', value: stats.byStatus.active, color: '#10b981' },
    { name: 'Próximos', value: stats.byStatus.warning, color: '#f59e0b' },
    { name: 'Vencidos', value: stats.byStatus.expired, color: '#ef4444' },
  ];

  const acquisitionData = [
    { name: 'Nuevos', value: stats.newsCount, color: '#6366f1' },
    { name: 'Renovaciones', value: stats.renewalsCount, color: '#10b981' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border dark:border-gray-700 gap-4">
        <div>
          <h3 className="font-bold text-gray-800 dark:text-white text-base">Análisis de Desempeño General</h3>
          <p className="text-xs text-gray-400">Selecciona el periodo para filtrar las métricas y los indicadores financieros.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full sm:w-56 px-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm font-semibold"
          >
            <option value="all_time">Todo el histórico</option>
            <option value="this_month">Este Mes</option>
            <option value="last_30_days">Últimos 30 días</option>
            <option value="last_6_months">Últimos 6 meses</option>
          </select>
          <button
            onClick={fetchStats}
            className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 rounded-xl transition-all"
            title="Refrescar Estadísticas"
          >
            <RefreshCcw className="w-5 h-5 dark:text-white" />
          </button>
        </div>
      </div>

      {/* KPI Cards: General & Financial */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Clientes Activos</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold dark:text-white">{stats.totalClients}</div>
          <div className="text-xs text-green-500 mt-1 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Suscriptores vigentes
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Ingresos de Caja</span>
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ${stats.financials.totalIncome.toLocaleString('es-CO')}
          </div>
          <div className="text-xs text-emerald-500 mt-1 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Recaudo acumulado
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Costos / Egresos</span>
            <DollarSign className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            ${stats.financials.totalExpense.toLocaleString('es-CO')}
          </div>
          <div className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" /> Gastos del periodo
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Utilidad Neta</span>
            <DollarSign className="w-5 h-5 text-indigo-500" />
          </div>
          <div className={`text-2xl font-bold ${stats.financials.netProfit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
            ${stats.financials.netProfit.toLocaleString('es-CO')}
          </div>
          <div className="text-xs text-indigo-500 mt-1 font-medium flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Rendimiento de caja
          </div>
        </div>
      </div>

      {/* Financial Trend / Breakdown Chart */}
      {stats.financials.trend && stats.financials.trend.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
          <h3 className="text-base font-bold mb-4 dark:text-white">Flujo de Caja Mensual (Ingresos vs Egresos vs Ganancia Neta)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.financials.trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: any) => [`$${value.toLocaleString('es-CO')}`, '']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Legend />
                <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="egresos" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ganancias" name="Ganancia Neta" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Grid: Acquisition & Platforms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Customer Acquisition (New vs Renewal) Donut */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
          <h3 className="text-lg font-bold mb-6 dark:text-white">Adquisición vs. Retención (Nuevos vs. Renovaciones)</h3>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-around gap-4">
            <div className="w-full sm:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={acquisitionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {acquisitionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {acquisitionData.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                  <div>
                    <span className="block text-sm font-semibold text-gray-700 dark:text-white">{d.name}</span>
                    <span className="text-xs text-gray-400">{d.value} clientes ({Math.round((d.value / (stats.totalClients || 1)) * 100)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Platform Popularity Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
          <h3 className="text-lg font-bold mb-6 dark:text-white">Plataformas más Populares</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Grid: Expirations Forecast & Sales Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expirations Forecast */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
          <h3 className="text-lg font-bold mb-6 dark:text-white">Pronóstico de Vencimientos</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expirationData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="vences" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Trend Chart */}
        {stats.historyTrend && stats.historyTrend.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
            <h3 className="text-lg font-bold mb-6 dark:text-white">Tendencia Histórica de Ventas / Renovaciones</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.historyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Line type="monotone" dataKey="ventas" name="Ventas / Renovaciones" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* CLIENT FIDELITY / LOYALTY LEADERBOARDS */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 space-y-6">
        <div className="border-b dark:border-gray-700 pb-3">
          <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-brand-primary animate-pulse" /> Fidelización y Clientes Destacados
          </h3>
          <p className="text-xs text-gray-400">Identifica a tus mejores clientes históricos en base a compras, renovaciones y gasto total.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Most Platforms Purchased */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-indigo-500" /> Mayor Diversidad de Cuentas
            </h4>
            <div className="space-y-2">
              {stats.loyalty.topPurchasers.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Sin datos disponibles.</p>
              ) : (
                stats.loyalty.topPurchasers.map((user, idx) => (
                  <div key={user.phone} className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 dark:bg-gray-850/50 border dark:border-gray-750 text-xs">
                    <div>
                      <span className="font-extrabold text-gray-700 dark:text-gray-300 block">{idx + 1}. {user.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{user.phone}</span>
                    </div>
                    <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-extrabold px-2.5 py-1 rounded-lg">
                      {user.count} plts
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Most Renewals */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-emerald-500" /> Clientes más Recurrentes
            </h4>
            <div className="space-y-2">
              {stats.loyalty.topRenewals.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Sin datos disponibles.</p>
              ) : (
                stats.loyalty.topRenewals.map((user, idx) => (
                  <div key={user.phone} className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 dark:bg-gray-850/50 border dark:border-gray-750 text-xs">
                    <div>
                      <span className="font-extrabold text-gray-700 dark:text-gray-300 block">{idx + 1}. {user.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{user.phone}</span>
                    </div>
                    <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-extrabold px-2.5 py-1 rounded-lg">
                      {user.count} renov.
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Highest Investment */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-indigo-500" /> Clientes de Mayor Valor (VIP)
            </h4>
            <div className="space-y-2">
              {stats.loyalty.topSpenders.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Sin datos disponibles.</p>
              ) : (
                stats.loyalty.topSpenders.map((user, idx) => (
                  <div key={user.phone} className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 dark:bg-gray-850/50 border dark:border-gray-750 text-xs">
                    <div>
                      <span className="font-extrabold text-gray-700 dark:text-gray-300 block">{idx + 1}. {user.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{user.phone}</span>
                    </div>
                    <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-extrabold px-2.5 py-1 rounded-lg">
                      ${user.count.toLocaleString('es-CO')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Health Indicator */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
        <h3 className="text-lg font-bold mb-6 dark:text-white">Estado de Salud de la Suscripción</h3>
        <div className="flex flex-col sm:flex-row gap-6">
          {statusData.map((s, i) => (
            <div key={i} className="flex-grow">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{s.name}</span>
                <span className="text-sm font-bold dark:text-white">{s.value} clientes</span>
              </div>
              <div className="w-full bg-gray-150 dark:bg-gray-750 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-1000" 
                  style={{ width: `${(s.value / stats.totalClients) * 100}%`, backgroundColor: s.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
