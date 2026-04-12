import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { Users, TrendingUp, AlertTriangle, Calendar, RefreshCcw } from 'lucide-react';

interface Stats {
  totalClients: number;
  byPlatform: Record<string, number>;
  byStatus: { active: number, expired: number, warning: number };
  expirations: { next7Days: number, next15Days: number, next30Days: number };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const AnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/stats`);
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
  }, []);

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Clientes</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold dark:text-white">{stats.totalClients}</div>
          <div className="text-xs text-green-500 mt-1 font-medium">Crecimiento orgánico</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cuentas Activas</span>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold dark:text-white">{stats.byStatus.active}</div>
          <div className="text-xs text-gray-400 mt-1">Servicios funcionando</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Por Cobrar (7d)</span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold dark:text-white">{stats.expirations.next7Days}</div>
          <div className="text-xs text-amber-500 mt-1 font-medium">Acción requerida</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cuentas Vencidas</span>
            <Calendar className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-2xl font-bold dark:text-white">{stats.byStatus.expired}</div>
          <div className="text-xs text-red-400 mt-1">Requiere depuración</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

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
      </div>

      {/* Health Indicator */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
        <h3 className="text-lg font-bold mb-6 dark:text-white">Estado de Salud de la Suscripción</h3>
        <div className="flex items-center gap-4">
          {statusData.map((s, i) => (
            <div key={i} className="flex-grow">
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{s.name}</span>
                <span className="text-sm font-bold dark:text-white">{s.value}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
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
