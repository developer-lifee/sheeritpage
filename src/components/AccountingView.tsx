import React, { useState, useEffect } from 'react';
import { Calculator, Save, Plus, Trash2, Edit2, TrendingUp, CreditCard, RefreshCcw, DollarSign, Calendar, Eye, EyeOff } from 'lucide-react';
import { isDemoMode, DEMO_ACCOUNTING } from '../utils/demoMode';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AccountingRow {
  platform: string;
  ingreso_total: number;
  egreso_total: number;
  ganancia_porcentaje: number;
  egreso_porcentaje: number;
  utilidad_total: number;
  indicador_gan: number;
  active_profiles: number;
}

interface AccountingTotals {
  ingreso_total: number;
  egreso_total: number;
  utilidad_total: number;
  porcentaje_utilidad: number;
  mensual_ingreso: number;
  mensual_egreso: number;
  mensual_utilidad: number;
}

interface RealCashFlowData {
  daily: Array<{ date: string; income: number; expense: number; profit: number }>;
  totals: { income: number; expense: number; profit: number };
  breakdown: {
    income: Array<{ name: string; value: number }>;
    expense: Array<{ name: string; value: number }>;
  };
}

interface PriceConfig {
  platform: string;
  normal_price: number;
}

interface CostConfig {
  id?: number;
  platform: string;
  email: string;
  total_cost: number;
  profile_slots: number;
  duration_days: number;
  expiration_date: string | null;
  payment_method?: string | null;
}

export function AccountingView() {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'excel' | 'projections' | 'real'>('excel');
  const [rows, setRows] = useState<AccountingRow[]>([]);
  const [totals, setTotals] = useState<AccountingTotals | null>(null);
  const [realData, setRealData] = useState<RealCashFlowData | null>(null);
  const [prices, setPrices] = useState<PriceConfig[]>([]);
  const [costs, setCosts] = useState<CostConfig[]>([]);

  // Form states
  const [editingPrice, setEditingPrice] = useState<Record<string, number>>({});
  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    platform: '',
    amount: '',
    description: '',
    entryDate: new Date().toISOString().slice(0, 10)
  });

  const [editingCostId, setEditingCostId] = useState<number | null>(null);

  const [newCost, setNewCost] = useState<CostConfig>({
    platform: '',
    email: '',
    total_cost: 0,
    profile_slots: 5,
    duration_days: 30,
    expiration_date: '',
    payment_method: ''
  });

  const getApiUrl = () => {
    return (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
      ? 'http://localhost:3000'
      : window.location.origin;
  };

  const adminPassword = localStorage.getItem('ticket_agent_password') || 'admin123';

  const handleEditCost = (cost: CostConfig) => {
    setEditingCostId(cost.id || null);
    setNewCost({
      id: cost.id,
      platform: cost.platform,
      email: cost.email || '',
      total_cost: cost.total_cost || 0,
      profile_slots: cost.profile_slots || 1,
      duration_days: cost.duration_days || 30,
      expiration_date: cost.expiration_date ? new Date(cost.expiration_date).toISOString().slice(0, 10) : '',
      payment_method: cost.payment_method || ''
    });
    // Scroll al formulario suavemente
    const formElement = document.getElementById('account-cost-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleCancelEditCost = () => {
    setEditingCostId(null);
    setNewCost({
      platform: '',
      email: '',
      total_cost: 0,
      profile_slots: 5,
      duration_days: 30,
      expiration_date: '',
      payment_method: ''
    });
  };

  const fetchData = async () => {
    setLoading(true);
    if (isDemoMode()) {
      setRows(DEMO_ACCOUNTING.rows as any);
      setTotals(DEMO_ACCOUNTING.totals as any);
      setLoading(false);
      return;
    }
    const apiUrl = getApiUrl();
    try {
      // 1. Fetch accounting data (projections)
      const accRes = await fetch(`${apiUrl}/api/admin/accounting/daily`);
      const accData = await accRes.json();
      if (accData.rows) {
        setRows(accData.rows);
        setTotals(accData.totals);
      }

      // 1b. Fetch real cash flow
      const realRes = await fetch(`${apiUrl}/api/admin/accounting/real`);
      const realJson = await realRes.json();
      setRealData(realJson);

      // 2. Fetch prices from admin prices catalog and sort A-Z
      const priceRes = await fetch(`${apiUrl}/api/admin/prices`);
      const priceData = await priceRes.json();
      const sortedPrices = Array.isArray(priceData)
        ? priceData.sort((a: any, b: any) => String(a.platform || '').localeCompare(String(b.platform || '')))
        : [];
      setPrices(sortedPrices);
      
      const priceMap: Record<string, number> = {};
      sortedPrices.forEach((p: PriceConfig) => {
        priceMap[p.platform] = p.normal_price;
      });
      setEditingPrice(priceMap);

      // 3. Fetch costs
      const costRes = await fetch(`${apiUrl}/api/admin/costs`);
      const costData = await costRes.json();
      setCosts(costData);
    } catch (e) {
      console.error('Error fetching accounting data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSavePrice = async (platform: string) => {
    const apiUrl = getApiUrl();
    const price = editingPrice[platform];
    try {
      const res = await fetch(`${apiUrl}/api/admin/prices/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, price, password: adminPassword })
      });
      const result = await res.json();
      if (result.success) {
        alert(`Precio de ${platform} actualizado a $${price.toLocaleString()}`);
        fetchData();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (e) {
      alert('Error de red al guardar el precio');
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/accounting/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTransaction,
          amount: parseFloat(newTransaction.amount),
          password: adminPassword
        })
      });
      const result = await res.json();
      if (result.success) {
        alert('Transacción registrada con éxito');
        setNewTransaction({
          type: 'expense',
          platform: '',
          amount: '',
          description: '',
          entryDate: new Date().toISOString().slice(0, 10)
        });
        fetchData();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (e) {
      alert('Error de red');
    }
  };

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault();
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/costs/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          costData: {
            ...newCost,
            id: editingCostId || undefined
          },
          password: adminPassword
        })
      });
      const result = await res.json();
      if (result.success) {
        alert(editingCostId ? '✅ Costo actualizado con éxito' : '✅ Costo guardado con éxito');
        handleCancelEditCost();
        fetchData();
      } else {
        alert('Error: ' + (result.message || result.error));
      }
    } catch (e) {
      alert('Error de red al guardar el costo');
    }
  };

  const handleDeleteCost = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este costo?')) return;
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/costs/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password: adminPassword })
      });
      const result = await res.json();
      if (result.success) {
        fetchData();
      }
    } catch (e) {
      alert('Error al eliminar');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCcw className="w-10 h-10 text-brand-primary animate-spin" />
        <p className="text-gray-500 font-medium">Cargando contabilidad en tiempo real...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold dark:text-white">Contabilidad y Configuración de Precios</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Control de ingresos, costos operativos y precios de venta.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="bg-gray-100 dark:bg-gray-750 p-1 rounded-xl flex">
            <button
              onClick={() => setViewMode('excel')}
              className={`px-3 py-1.5 rounded-lg text-xxs font-bold transition-all ${
                viewMode === 'excel'
                  ? 'bg-white dark:bg-gray-800 text-brand-primary shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
              }`}
            >
              📊 Cartera Excel (Mensual / Inventario)
            </button>
            <button
              onClick={() => setViewMode('projections')}
              className={`px-3 py-1.5 rounded-lg text-xxs font-bold transition-all ${
                viewMode === 'projections'
                  ? 'bg-white dark:bg-gray-800 text-brand-primary shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
              }`}
            >
              📈 Matriz Normalizada (Diaria)
            </button>
            <button
              onClick={() => setViewMode('real')}
              className={`px-3 py-1.5 rounded-lg text-xxs font-bold transition-all ${
                viewMode === 'real'
                  ? 'bg-white dark:bg-gray-800 text-brand-primary shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
              }`}
            >
              💵 Flujo de Caja Real (Mes)
            </button>
          </div>
          <button 
            onClick={fetchData}
            className="p-2 bg-gray-150 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 rounded-xl transition-all"
            title="Refrescar Datos"
          >
            <RefreshCcw className="w-4 h-4 dark:text-white" />
          </button>
        </div>
      </div>

      {/* Totales Resumen - Cartera Excel (Mensual) */}
      {viewMode === 'excel' && totals && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
            <span className="text-xs text-gray-400 font-semibold uppercase">Ingreso Total Cartera (Mensual)</span>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              ${Math.round(totals.mensual_ingreso).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Equivalente Diario: ${Math.round(totals.ingreso_total).toLocaleString()} / día
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
            <span className="text-xs text-gray-400 font-semibold uppercase">Egreso Total Cuentas Matriz (Mensual)</span>
            <div className="text-2xl font-bold text-red-650 dark:text-red-400 mt-1">
              ${Math.round(totals.mensual_egreso).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Costo Diario de Inventario: ${Math.round(totals.egreso_total).toLocaleString()} / día
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
            <span className="text-xs text-gray-400 font-semibold uppercase">Utilidad Mensual Neta (Inventario)</span>
            <div className="text-2xl font-bold text-brand-primary mt-1">
              ${Math.round(totals.mensual_utilidad).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Margen Neto: {totals.porcentaje_utilidad.toFixed(1)}% | Ganancia Diaria: ${Math.round(totals.utilidad_total).toLocaleString()} / día
            </div>
          </div>
        </div>
      )}

      {/* Totales Resumen - Normalizado Diario */}
      {viewMode === 'projections' && totals && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
            <span className="text-xs text-gray-400 font-semibold uppercase">Ingreso Diario (Normalizado)</span>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              ${Math.round(totals.ingreso_total).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Proyección Mensual: ${Math.round(totals.mensual_ingreso).toLocaleString()}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
            <span className="text-xs text-gray-400 font-semibold uppercase">Egreso Diario (Normalizado)</span>
            <div className="text-2xl font-bold text-red-650 dark:text-red-400 mt-1">
              ${Math.round(totals.egreso_total).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Costo Mensual Estimado: ${Math.round(totals.mensual_egreso).toLocaleString()}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
            <span className="text-xs text-gray-400 font-semibold uppercase">Utilidad Diaria (% Retorno)</span>
            <div className="text-2xl font-bold text-brand-primary mt-1">
              ${Math.round(totals.utilidad_total).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Margen Neto: {totals.porcentaje_utilidad.toFixed(1)}% | Mensual Proyectado: ${Math.round(totals.mensual_utilidad).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'real' && realData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
            <span className="text-xs text-gray-400 font-semibold uppercase">Ingresos Reales Cobrados (Mes)</span>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              ${Math.round(realData.totals.income).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Ventas web cobradas + ingresos manuales
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
            <span className="text-xs text-gray-400 font-semibold uppercase">Egresos Reales Pagados (Mes)</span>
            <div className="text-2xl font-bold text-red-650 dark:text-red-400 mt-1">
              ${Math.round(realData.totals.expense).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Renovación de cuentas + gastos manuales
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
            <span className="text-xs text-gray-400 font-semibold uppercase">Flujo Neto / Utilidad Real</span>
            <div className={`text-2xl font-bold mt-1 ${realData.totals.profit >= 0 ? 'text-brand-primary' : 'text-red-500'}`}>
              ${Math.round(realData.totals.profit).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Flujo de caja neto real acumulado del mes
            </div>
          </div>
        </div>
      )}

      {/* Main Table View */}
      {viewMode === 'excel' ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-bold dark:text-white text-sm">Contabilidad de Cartera Total (Modelo Excel)</h3>
            <span className="text-xs text-gray-400">Totales mensuales de compras de cuentas vs ventas a clientes</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 font-bold text-gray-500 uppercase">
                  <th className="px-6 py-3">Streaming</th>
                  <th className="px-6 py-3 text-center">Cupos Vendidos</th>
                  <th className="px-6 py-3 text-center">Cuentas Compradas</th>
                  <th className="px-6 py-3 text-right">Ingreso Mensual</th>
                  <th className="px-6 py-3 text-right">Egreso Cuentas (Mes)</th>
                  <th className="px-6 py-3 text-center">Margen %</th>
                  <th className="px-6 py-3 text-right">Utilidad Mensual</th>
                  <th className="px-6 py-3 text-right">Ganancia Diaria</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700 text-sm">
                {rows.map((row: any, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30 text-xs">
                    <td className="px-6 py-3.5 font-bold dark:text-white uppercase">{row.platform}</td>
                    <td className="px-6 py-3.5 text-center text-gray-500 font-semibold">{row.active_profiles}</td>
                    <td className="px-6 py-3.5 text-center text-indigo-400 font-bold">{row.accounts_needed || Math.ceil(row.active_profiles / 5)}</td>
                    <td className="px-6 py-3.5 text-right text-green-600 dark:text-green-400 font-semibold">
                      ${Math.round(row.ingreso_total * 30).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right text-red-650 dark:text-red-400 font-medium">
                      ${Math.round(row.monthly_inventory_cost || (row.egreso_total * 30)).toLocaleString()}
                    </td>
                    <td className={`px-6 py-3.5 text-center font-bold ${row.indicador_gan >= 30 ? 'text-green-500' : 'text-yellow-500'}`}>
                      {row.indicador_gan.toFixed(0)}%
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold text-brand-primary">
                      ${Math.round((row.ingreso_total * 30) - (row.monthly_inventory_cost || (row.egreso_total * 30))).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold dark:text-gray-300">
                      ${Math.round(row.utilidad_total).toLocaleString()} / día
                    </td>
                  </tr>
                ))}
              </tbody>
              {totals && (
                <tfoot>
                  <tr className="bg-gray-100 dark:bg-gray-900/60 font-bold border-t dark:border-gray-700 text-xs">
                    <td className="px-6 py-4 dark:text-white">TOTALES CARTERA</td>
                    <td className="px-6 py-4 text-center dark:text-white font-extrabold">
                      {rows.reduce((sum, r) => sum + r.active_profiles, 0)} cupos
                    </td>
                    <td className="px-6 py-4 text-center text-indigo-400 font-extrabold">
                      {rows.reduce((sum: number, r: any) => sum + (r.accounts_needed || Math.ceil(r.active_profiles / 5)), 0)} cuentas
                    </td>
                    <td className="px-6 py-4 text-right text-green-600 dark:text-green-400 font-extrabold">
                      ${Math.round(totals.mensual_ingreso).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-red-650 dark:text-red-400 font-extrabold">
                      ${Math.round(totals.mensual_egreso).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center text-brand-primary font-extrabold">
                      {totals.porcentaje_utilidad.toFixed(0)}%
                    </td>
                    <td className="px-6 py-4 text-right text-brand-primary font-extrabold">
                      ${Math.round(totals.mensual_utilidad).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-brand-primary font-extrabold">
                      ${Math.round(totals.utilidad_total).toLocaleString()} / día
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      ) : viewMode === 'projections' ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b dark:border-gray-700">
            <h3 className="font-bold dark:text-white text-sm">Matriz de Contabilidad Diaria (Normalizada)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 font-bold text-gray-500 uppercase">
                  <th className="px-6 py-3">Streaming</th>
                  <th className="px-6 py-3 text-center">Cupos Activos</th>
                  <th className="px-6 py-3 text-right">Ingreso Diario</th>
                  <th className="px-6 py-3 text-center">Ganancia %</th>
                  <th className="px-6 py-3 text-right">Egreso Diario</th>
                  <th className="px-6 py-3 text-center">Egreso %</th>
                  <th className="px-6 py-3 text-center">Margen Utilidad</th>
                  <th className="px-6 py-3 text-right">Utilidad Diaria</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700 text-sm">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30 text-xs">
                    <td className="px-6 py-3.5 font-bold dark:text-white uppercase">{row.platform}</td>
                    <td className="px-6 py-3.5 text-center text-gray-500">{row.active_profiles}</td>
                    <td className="px-6 py-3.5 text-right text-green-600 dark:text-green-400 font-semibold">
                      ${Math.round(row.ingreso_total).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-center text-gray-500">{row.ganancia_porcentaje.toFixed(1)}%</td>
                    <td className="px-6 py-3.5 text-right text-red-650 dark:text-red-400">
                      ${Math.round(row.egreso_total).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-center text-gray-500">{row.egreso_porcentaje.toFixed(1)}%</td>
                    <td className={`px-6 py-3.5 text-center font-bold ${row.indicador_gan >= 30 ? 'text-green-500' : 'text-yellow-500'}`}>
                      {row.indicador_gan.toFixed(0)}%
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold dark:text-white">
                      ${Math.round(row.utilidad_total).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              {totals && (
                <tfoot>
                  <tr className="bg-gray-100 dark:bg-gray-900/60 font-bold border-t dark:border-gray-700 text-xs">
                    <td className="px-6 py-4 dark:text-white">TOTAL PROYECTADO</td>
                    <td className="px-6 py-4 text-center dark:text-white">
                      {rows.reduce((sum, r) => sum + r.active_profiles, 0)} cupos
                    </td>
                    <td className="px-6 py-4 text-right text-green-600 dark:text-green-400 font-extrabold">
                      ${Math.round(totals.ingreso_total).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">-</td>
                    <td className="px-6 py-4 text-right text-red-650 dark:text-red-400 font-extrabold">
                      ${Math.round(totals.egreso_total).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">-</td>
                    <td className="px-6 py-4 text-center text-brand-primary font-extrabold">
                      {totals.porcentaje_utilidad.toFixed(0)}%
                    </td>
                    <td className="px-6 py-4 text-right text-brand-primary font-extrabold">
                      ${Math.round(totals.utilidad_total).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b dark:border-gray-700">
            <h3 className="font-bold dark:text-white text-sm">Flujo de Caja Real Diario (Mensualizado)</h3>
          </div>
          <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 font-bold text-gray-500 uppercase sticky top-0">
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3 text-right">Entradas Reales ($)</th>
                  <th className="px-6 py-3 text-right">Salidas Reales ($)</th>
                  <th className="px-6 py-3 text-right">Flujo Neto ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700 text-sm">
                {realData?.daily.filter(d => d.income > 0 || d.expense > 0).map((day, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30 text-xs">
                    <td className="px-6 py-3.5 font-semibold dark:text-white">
                      {new Date(day.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-3.5 text-right text-green-600 dark:text-green-400 font-bold">
                      ${day.income.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right text-red-600 dark:text-red-400">
                      ${day.expense.toLocaleString()}
                    </td>
                    <td className={`px-6 py-3.5 text-right font-extrabold ${day.profit >= 0 ? 'text-brand-primary' : 'text-rose-500'}`}>
                      ${day.profit.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              {realData && (
                <tfoot>
                  <tr className="bg-gray-150 dark:bg-gray-900/60 font-bold border-t dark:border-gray-705 text-xs text-gray-800 dark:text-gray-250">
                    <td className="px-6 py-3.5 dark:text-white font-bold">TOTAL MENSUAL</td>
                    <td className="px-6 py-3.5 text-right text-green-650 dark:text-green-400 font-extrabold">
                      ${Math.round(realData.totals.income).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right text-red-650 dark:text-red-400 font-extrabold">
                      ${Math.round(realData.totals.expense).toLocaleString()}
                    </td>
                    <td className={`px-6 py-3.5 text-right font-extrabold ${realData.totals.profit >= 0 ? 'text-brand-primary' : 'text-rose-500'}`}>
                      ${Math.round(realData.totals.profit).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-gray-100 dark:bg-gray-900/40 font-bold text-xxs uppercase tracking-wider text-gray-500 border-t dark:border-gray-750">
                    <td colSpan={3} className="px-6 py-3 text-right">Rentabilidad / Porcentaje Utilidad Real:</td>
                    <td className={`px-6 py-3 text-right font-extrabold ${realData.totals.profit >= 0 ? 'text-brand-primary' : 'text-rose-500'}`}>
                      {realData.totals.income > 0 ? ((realData.totals.profit / realData.totals.income) * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
      {viewMode === 'real' && realData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daily Trend Area Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
            <h3 className="font-bold dark:text-white text-sm mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1.5 text-brand-primary" /> Tendencia de Flujo de Caja Diario
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={realData.daily} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" className="dark:stroke-gray-700" />
                  <XAxis dataKey="date" tickFormatter={(val) => val.split('-')[2]} stroke="#9CA3AF" fontSize={10} />
                  <YAxis stroke="#9CA3AF" fontSize={10} />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="income" name="Entradas" stroke="#10B981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expense" name="Salidas" stroke="#EF4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Platform Performance Breakdowns */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 flex flex-col justify-between">
            <div>
              <h3 className="font-bold dark:text-white text-sm mb-4">¿Qué plataforma da más y qué quita más?</h3>
              <div className="grid grid-cols-2 gap-6">
                {/* Income Breakdown */}
                <div>
                  <h4 className="text-2xs font-extrabold text-gray-400 uppercase mb-3 flex items-center">
                    <DollarSign className="w-3.5 h-3.5 text-green-500 mr-1" /> Mayores Ingresos
                  </h4>
                  <div className="space-y-2.5">
                    {realData.breakdown.income.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs pb-1 border-b border-gray-50 dark:border-gray-700">
                        <span className="font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[90px]">{item.name}</span>
                        <span className="text-green-600 dark:text-green-400 font-mono font-bold">${item.value.toLocaleString()}</span>
                      </div>
                    ))}
                    {realData.breakdown.income.length === 0 && <span className="text-xxs text-gray-400 italic">Sin ingresos</span>}
                  </div>
                </div>

                {/* Expense Breakdown */}
                <div>
                  <h4 className="text-2xs font-extrabold text-gray-400 uppercase mb-3 flex items-center">
                    <CreditCard className="w-3.5 h-3.5 text-red-500 mr-1" /> Mayores Egresos
                  </h4>
                  <div className="space-y-2.5">
                    {realData.breakdown.expense.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs pb-1 border-b border-gray-50 dark:border-gray-700">
                        <span className="font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[90px]">{item.name}</span>
                        <span className="text-red-500 dark:text-red-400 font-mono font-bold">${item.value.toLocaleString()}</span>
                      </div>
                    ))}
                    {realData.breakdown.expense.length === 0 && <span className="text-xxs text-gray-400 italic">Sin egresos</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Visual indicators */}
            <div className="mt-6 pt-4 border-t dark:border-gray-700 grid grid-cols-2 gap-4 text-center">
              <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                <span className="text-3xs font-extrabold text-emerald-800 dark:text-emerald-350 uppercase tracking-wider block">Producto Estrella (Inflow)</span>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-405 mt-0.5 uppercase">
                  {realData.breakdown.income[0]?.name || 'N/A'}
                </div>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/20 p-3.5 rounded-xl border border-rose-100 dark:border-rose-900/30">
                <span className="text-3xs font-extrabold text-rose-800 dark:text-rose-350 uppercase tracking-wider block">Mayor Costo (Outflow)</span>
                <div className="text-sm font-bold text-rose-600 dark:text-rose-455 mt-0.5 uppercase">
                  {realData.breakdown.expense[0]?.name || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Prices Configurator */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
          <h3 className="font-bold dark:text-white text-sm mb-4">Configurar Precios de Venta</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {[...prices].sort((a, b) => String(a.platform || '').localeCompare(String(b.platform || ''))).map((p, index) => (
              <div key={index} className="flex items-center justify-between gap-4 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                <span className="font-bold text-xs uppercase dark:text-white">{p.platform}</span>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                    <input
                      type="number"
                      value={editingPrice[p.platform] || 0}
                      onChange={(e) => setEditingPrice({ ...editingPrice, [p.platform]: parseFloat(e.target.value) })}
                      className="w-28 pl-6 pr-2 py-1.5 border rounded-lg text-xs dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={() => handleSavePrice(p.platform)}
                    className="p-2 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition-colors"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real Cash Flow Manual Registration */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 h-fit">
          <h3 className="font-bold dark:text-white text-sm mb-4">Registrar Gasto o Ingreso Extra</h3>
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">Tipo</label>
                <select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl dark:bg-gray-700 dark:text-white dark:border-gray-600 text-xs"
                >
                  <option value="expense">Egreso / Gasto</option>
                  <option value="income">Ingreso</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2">Plataforma (Opcional)</label>
                <input
                  type="text"
                  placeholder="ej. Netflix"
                  value={newTransaction.platform}
                  onChange={(e) => setNewTransaction({ ...newTransaction, platform: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl dark:bg-gray-700 dark:text-white dark:border-gray-600 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2">Monto ($)</label>
              <input
                type="number"
                required
                placeholder="Monto de la transacción"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl dark:bg-gray-700 dark:text-white dark:border-gray-600 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2">Descripción</label>
              <textarea
                required
                placeholder="Detalle de la transacción"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl dark:bg-gray-700 dark:text-white dark:border-gray-600 text-xs h-16"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-primary hover:bg-brand-dark text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-2" /> Registrar Transacción
            </button>
          </form>
        </div>
      </div>

      {/* Account Cost configurations */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold dark:text-white text-sm">Administrar Costos de Cuentas (Costo Real Operativo)</h3>
            <p className="text-xs text-gray-400">Edita o ingresa los costos exactos pagados a proveedores para cada plataforma matriz.</p>
          </div>
          {editingCostId && (
            <span className="px-2.5 py-1 bg-brand-primary/20 text-brand-primary text-xs font-bold rounded-lg border border-brand-primary/40">
              ✏️ Modo Edición Activo
            </span>
          )}
        </div>
        
        {/* Form to add/edit Cost */}
        <form 
          id="account-cost-form"
          onSubmit={handleAddCost} 
          className={`grid grid-cols-2 md:grid-cols-8 gap-3 mb-6 p-4 rounded-2xl border transition-all ${
            editingCostId 
              ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-brand-primary shadow-sm' 
              : 'bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700'
          }`}
        >
          <div>
            <label className="block text-2xs text-gray-400 uppercase font-bold mb-1">Plataforma</label>
            <input
              type="text"
              required
              placeholder="NETFLIX, AMAZON, etc."
              value={newCost.platform}
              onChange={(e) => setNewCost({ ...newCost, platform: e.target.value.toUpperCase() })}
              className="w-full px-2 py-1.5 border rounded-lg text-xs dark:bg-gray-750 dark:text-white font-bold"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-2xs text-gray-400 uppercase font-bold mb-1">Correo/Cuenta (Opcional)</label>
            <input
              type="text"
              placeholder="Opcional o cuenta@correo.com"
              value={newCost.email}
              onChange={(e) => setNewCost({ ...newCost, email: e.target.value })}
              className="w-full px-2 py-1.5 border rounded-lg text-xs dark:bg-gray-750 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-2xs text-gray-400 uppercase font-bold mb-1">Costo Total ($)</label>
            <input
              type="number"
              required
              value={newCost.total_cost}
              onChange={(e) => setNewCost({ ...newCost, total_cost: parseFloat(e.target.value) || 0 })}
              className="w-full px-2 py-1.5 border rounded-lg text-xs dark:bg-gray-750 dark:text-white font-bold text-red-500"
            />
          </div>
          <div>
            <label className="block text-2xs text-gray-400 uppercase font-bold mb-1">Cupos / Perfiles</label>
            <input
              type="number"
              required
              value={newCost.profile_slots}
              onChange={(e) => setNewCost({ ...newCost, profile_slots: parseInt(e.target.value) || 1 })}
              className="w-full px-2 py-1.5 border rounded-lg text-xs dark:bg-gray-750 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-2xs text-gray-400 uppercase font-bold mb-1">Duración (Días)</label>
            <input
              type="number"
              required
              value={newCost.duration_days}
              onChange={(e) => setNewCost({ ...newCost, duration_days: parseInt(e.target.value) || 30 })}
              className="w-full px-2 py-1.5 border rounded-lg text-xs dark:bg-gray-750 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-2xs text-gray-400 uppercase font-bold mb-1">Vencimiento</label>
            <input
              type="date"
              value={newCost.expiration_date || ''}
              onChange={(e) => setNewCost({ ...newCost, expiration_date: e.target.value || null })}
              className="w-full px-2 py-1.5 border rounded-lg text-xs dark:bg-gray-750 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-2xs text-gray-400 uppercase font-bold mb-1">Método Pago</label>
            <input
              type="text"
              placeholder="ej. Tarjeta, Proveedor"
              value={newCost.payment_method || ''}
              onChange={(e) => setNewCost({ ...newCost, payment_method: e.target.value })}
              className="w-full px-2 py-1.5 border rounded-lg text-xs dark:bg-gray-750 dark:text-white"
            />
          </div>
          <div className="col-span-2 md:col-span-1 flex flex-col justify-end gap-1">
            {editingCostId ? (
              <>
                <button
                  type="submit"
                  className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-1.5 rounded-lg text-xs transition-colors"
                >
                  💾 Guardar
                </button>
                <button
                  type="button"
                  onClick={handleCancelEditCost}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-1 rounded-lg text-xxs transition-colors"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 rounded-lg text-xs transition-colors"
              >
                + Agregar
              </button>
            )}
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-150 dark:bg-gray-900/60 font-bold text-gray-500 uppercase">
                <th className="px-3 py-2">Plataforma</th>
                <th className="px-3 py-2">Correo Cuenta</th>
                <th className="px-3 py-2">Costo Cuenta</th>
                <th className="px-3 py-2">Cupos</th>
                <th className="px-3 py-2">Costo Perfil</th>
                <th className="px-3 py-2">Días</th>
                <th className="px-3 py-2">Vencimiento</th>
                <th className="px-3 py-2">Método Pago</th>
                <th className="px-3 py-2">Costo Diario</th>
                <th className="px-3 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {costs.map((cost, idx) => {
                const costPerProfile = cost.total_cost / (cost.profile_slots || 1);
                const dailyCost = costPerProfile / (cost.duration_days || 30);
                const isBeingEdited = editingCostId === cost.id;
                return (
                  <tr 
                    key={idx} 
                    className={`hover:bg-gray-50/50 dark:hover:bg-gray-750/30 transition-colors ${
                      isBeingEdited ? 'bg-indigo-50/60 dark:bg-indigo-950/40 font-semibold' : ''
                    }`}
                  >
                    <td className="px-3 py-2 font-bold dark:text-white uppercase">{cost.platform}</td>
                    <td className="px-3 py-2 text-gray-400">{cost.email}</td>
                    <td className="px-3 py-2 text-red-650 dark:text-red-400 font-semibold">
                      ${cost.total_cost.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-gray-500">{cost.profile_slots}</td>
                    <td className="px-3 py-2 text-gray-500">${costPerProfile.toFixed(0)}</td>
                    <td className="px-3 py-2 text-gray-500">{cost.duration_days} d</td>
                    <td className="px-3 py-2 text-gray-500">
                      {cost.expiration_date ? new Date(cost.expiration_date).toISOString().slice(0, 10) : 'Sin vencimiento'}
                    </td>
                    <td className="px-3 py-2 text-gray-500">{cost.payment_method || 'N/A'}</td>
                    <td className="px-3 py-2 text-gray-500">${dailyCost.toFixed(1)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleEditCost(cost)}
                          className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Editar costo y valores"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => cost.id && handleDeleteCost(cost.id)}
                          className="p-1.5 text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Eliminar costo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
