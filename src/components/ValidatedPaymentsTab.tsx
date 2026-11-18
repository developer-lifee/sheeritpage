import React, { useEffect, useState } from 'react';
import { RefreshCcw, Search, KeyRound, CheckCircle2, Repeat, ShoppingBag, Filter } from 'lucide-react';

interface ValidatedPayment {
  id: number;
  phone: string | null;
  user_id: string | null;
  client_name: string | null;
  payment_type: 'renewal' | 'new_sale' | 'mixed';
  platform: string;
  account_email: string | null;
  excel_row: number | null;
  amount: number;
  duration_months: number;
  payment_method: string | null;
  bank: string | null;
  destination_key: string | null;
  destination_name: string | null;
  transaction_reference: string | null;
  receipt_date: string | null;
  gmail_match_id: string | null;
  new_expiration: string | null;
  validation_source: string;
  details: string | null;
  created_at: string;
}

interface Summary {
  totalCount: number;
  totalAmount: number;
  renewalsCount: number;
  newSalesCount: number;
  autoValidatedCount: number;
  autoValidatedAmount: number;
}

export const ValidatedPaymentsTab: React.FC = () => {
  const [payments, setPayments] = useState<ValidatedPayment[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalCount: 0,
    totalAmount: 0,
    renewalsCount: 0,
    newSalesCount: 0,
    autoValidatedCount: 0,
    autoValidatedAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [search, setSearch] = useState('');

  const apiUrl =
    typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:3000'
      : window.location.origin;

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: typeFilter,
        source: sourceFilter,
        search: search.trim(),
        limit: '250'
      });
      const res = await fetch(`${apiUrl}/api/admin/payments/validated?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments || []);
        if (data.summary) setSummary(data.summary);
      }
    } catch (e) {
      console.error('Error cargando pagos validados:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments();
    }, 200);
    return () => clearTimeout(timer);
  }, [typeFilter, sourceFilter, search]);

  const sourceBadge = (src: string) => {
    switch (src) {
      case 'auto_ocr':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">⚡ Auto-OCR Llave</span>;
      case 'gmail_match':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">📧 Gmail Match</span>;
      case 'bold':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">💳 Bold</span>;
      case 'web_admin':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">🖥️ Web Admin</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">👤 Manual / Asesor</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase">
            <span>Total Validado</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ${Math.round(Number(summary.totalAmount || 0)).toLocaleString('es-CO')}
          </div>
          <div className="text-xs text-gray-500 mt-1">{summary.totalCount} transacciones registradas</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase">
            <span>Autovalidados (Llave / Gmail)</span>
            <KeyRound className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            ${Math.round(Number(summary.autoValidatedAmount || 0)).toLocaleString('es-CO')}
          </div>
          <div className="text-xs text-gray-500 mt-1">{summary.autoValidatedCount} pagos automáticos</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase">
            <span>Renovaciones</span>
            <Repeat className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
            {summary.renewalsCount || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">Cortes actualizados en Excel</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase">
            <span>Ventas Nuevas</span>
            <ShoppingBag className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
            {summary.newSalesCount || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">Cupos nuevos entregados</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border dark:border-gray-700 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, teléfono, referencia, cuenta o llave..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none"
          >
            <option value="all">Todos los tipos</option>
            <option value="renewal">🔄 Renovaciones</option>
            <option value="new_sale">🆕 Ventas Nuevas</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none"
          >
            <option value="all">Todos los orígenes</option>
            <option value="auto_ocr">⚡ Auto-OCR Llave</option>
            <option value="gmail_match">📧 Gmail Match</option>
            <option value="manual">👤 Asesor / Manual</option>
            <option value="web_admin">🖥️ Web Admin</option>
            <option value="bold">💳 Bold</option>
          </select>

          <button
            onClick={fetchPayments}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            title="Actualizar listado"
          >
            <RefreshCcw className={`w-4 h-4 dark:text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabla detallada */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/60 text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                <th className="px-4 py-3">Fecha / Hora</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Plataforma & Cuenta</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3">Origen / Llave / Banco</th>
                <th className="px-4 py-3">Referencia & Comprobante</th>
                <th className="px-4 py-3">Nuevo Corte</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-750">
              {loading && payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                    Cargando historial de pagos y renovaciones...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                    No hay pagos registrados con los filtros actuales. Los nuevos pagos y renovaciones autovalidadas aparecerán aquí automáticamente.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-750/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300 font-mono text-[11px]">
                      {new Date(p.created_at).toLocaleString('es-CO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-800 dark:text-white">{p.client_name || 'Sin nombre'}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{p.phone || p.user_id || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.payment_type === 'renewal' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          🔄 Renovación ({p.duration_months}m)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300">
                          🆕 Venta ({p.duration_months}m)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-brand-primary uppercase">{p.platform}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {p.account_email || 'Sin correo'} {p.excel_row ? `· Fila ${p.excel_row}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400">
                      ${Math.round(Number(p.amount || 0)).toLocaleString('es-CO')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div>{sourceBadge(p.validation_source)}</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          {p.bank || p.payment_method || 'N/A'}
                          {p.destination_key ? ` · Llave: ${p.destination_key}` : ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-[11px] text-gray-700 dark:text-gray-200">
                        {p.transaction_reference ? `Ref: ${p.transaction_reference}` : 'Sin ref.'}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {p.receipt_date ? `Comp: ${p.receipt_date}` : ''}
                        {p.gmail_match_id ? ` · Gmail: ${p.gmail_match_id.slice(0, 10)}...` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-gray-600 dark:text-gray-300">
                      {p.new_expiration || 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
