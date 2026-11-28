import React, { useEffect, useMemo, useState } from 'react';
import { Receipt, Send, Trash2, RefreshCcw, CheckCircle2, AlertCircle } from 'lucide-react';

interface RefundRecord {
  id: number;
  customer_name: string;
  customer_phone: string | null;
  platform: string;
  original_amount: number;
  days_used: number;
  days_refunded: number;
  rule_applied: 'proportional' | 'full' | 'manual' | string;
  apply_4x1000: number | boolean;
  fee_4x1000: number;
  gross_refund_amount: number;
  net_refund_amount: number;
  reason: string;
  payment_method: string | null;
  registered_by: string | null;
  refund_date: string;
  whatsapp_notified: number | boolean;
  created_at: string;
}

interface RefundsTabProps {
  adminPassword: string;
  onRefundChanged?: () => void;
}

const getApiUrl = () =>
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : window.location.origin;

export const RefundsTab: React.FC<RefundsTabProps> = ({ adminPassword, onRefundChanged }) => {
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [platform, setPlatform] = useState('NETFLIX');
  const [originalAmount, setOriginalAmount] = useState('14000');
  const [ruleApplied, setRuleApplied] = useState<'proportional' | 'full' | 'manual'>('proportional');
  const [daysUsed, setDaysUsed] = useState('0');
  const [manualAmount, setManualAmount] = useState('');
  const [apply4x1000, setApply4x1000] = useState(true);
  const [reason, setReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Nequi / Bre-V');

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/accounting/refunds`);
      const data = await res.json();
      if (data.success && Array.isArray(data.refunds)) {
        setRefunds(data.refunds);
      }
    } catch {
      setBanner({ type: 'err', text: 'No se pudo cargar el historial de reembolsos.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const preview = useMemo(() => {
    const orig = Math.max(0, Number(String(originalAmount).replace(/[^\d]/g, '')) || 0);
    const used = Math.max(0, Math.min(30, Number(daysUsed) || 0));
    const daysRefunded = ruleApplied === 'full' ? 30 : Math.max(0, 30 - used);
    const gross =
      ruleApplied === 'full'
        ? Math.round(orig)
        : ruleApplied === 'manual'
          ? Math.max(0, Math.round(Number(String(manualAmount).replace(/[^\d]/g, '')) || 0))
          : Math.round(orig * (daysRefunded / 30));
    const fee = apply4x1000 ? Math.round(gross * 0.004) : 0;
    const net = Math.max(0, gross - fee);
    return { orig, used, daysRefunded, gross, fee, net };
  }, [originalAmount, daysUsed, ruleApplied, manualAmount, apply4x1000]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    if (!customerName.trim() || !platform.trim() || !reason.trim()) {
      setBanner({ type: 'err', text: 'Completa cliente, plataforma y razón del reembolso.' });
      return;
    }
    setSubmitting(true);
    try {
      const agentName = localStorage.getItem('ticket_agent_name') || 'Admin';
      const res = await fetch(`${getApiUrl()}/api/admin/accounting/refunds/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: adminPassword,
          refundData: {
            customer_name: customerName.trim(),
            customer_phone: customerPhone.trim(),
            platform: platform.trim().toUpperCase(),
            original_amount: preview.orig,
            days_used: preview.used,
            total_days: 30,
            rule_applied: ruleApplied,
            manual_amount: Number(String(manualAmount).replace(/[^\d]/g, '')) || 0,
            apply_4x1000: apply4x1000,
            reason: reason.trim(),
            payment_method: paymentMethod.trim(),
            registered_by: agentName
          }
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Error registrando reembolso');
      }
      setBanner({
        type: 'ok',
        text: `Reembolso #${data.refund?.id} guardado ($${preview.net.toLocaleString('es-CO')} COP) y ${
          data.whatsapp_notified ? 'reportado al grupo "reembolsos" ✅' : 'asentado en flujo de caja.'
        }`
      });
      setCustomerName('');
      setCustomerPhone('');
      setReason('');
      setDaysUsed('0');
      setManualAmount('');
      fetchRefunds();
      onRefundChanged?.();
    } catch (err: any) {
      setBanner({ type: 'err', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este reembolso? También se revertirá su egreso del flujo de caja real.')) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/accounting/refunds/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password: adminPassword })
      });
      const data = await res.json();
      if (data.success) {
        fetchRefunds();
        onRefundChanged?.();
      }
    } catch {}
  };

  const totalRefundedNet = refunds.reduce((sum, r) => sum + Number(r.net_refund_amount || 0), 0);

  return (
    <div className="space-y-6">
      {banner && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            banner.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          {banner.type === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{banner.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-500" /> Registrar Reembolso + Reportar a Grupo WhatsApp
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Descuenta automáticamente de Flujo de Caja Real y envía el formato completo al grupo <strong>reembolsos</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Cliente *</label>
              <input
                required
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Ej: Carlos Pérez"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">WhatsApp / Teléfono</label>
              <input
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="3001234567"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Plataforma *</label>
              <input
                required
                value={platform}
                onChange={e => setPlatform(e.target.value.toUpperCase())}
                placeholder="NETFLIX, GPT, DISNEY..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs dark:text-white font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Valor pagado (COP)</label>
              <input
                type="number"
                value={originalAmount}
                onChange={e => setOriginalAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Regla</label>
              <select
                value={ruleApplied}
                onChange={e => setRuleApplied(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs dark:text-white"
              >
                <option value="proportional">Proporcional por días</option>
                <option value="full">Total 100%</option>
                <option value="manual">Monto manual</option>
              </select>
            </div>
            {ruleApplied === 'manual' ? (
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Bruto manual (COP)</label>
                <input
                  type="number"
                  value={manualAmount}
                  onChange={e => setManualAmount(e.target.value)}
                  placeholder="Ej: 10000"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs dark:text-white font-mono"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Días usados (0–30)</label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  disabled={ruleApplied === 'full'}
                  value={ruleApplied === 'full' ? '0' : daysUsed}
                  onChange={e => setDaysUsed(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs dark:text-white font-mono disabled:opacity-50"
                />
              </div>
            )}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Medio devolución</label>
              <input
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                placeholder="Nequi / Bre-V / Bancolombia"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">Razón del reembolso *</label>
            <input
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ej: Caída recurrente de cuenta matriz / cliente no pudo activar en TV"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200 cursor-pointer">
              <input
                type="checkbox"
                checked={apply4x1000}
                onChange={e => setApply4x1000(e.target.checked)}
                className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
              />
              Descontar 4×1.000 (0.4%) del monto a devolver
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Registrando y reportando...' : 'Registrar y Reportar al Grupo Reembolsos'}
            </button>
          </div>
        </form>

        {/* Vista previa cálculo + KPI */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="space-y-3">
            <div className="text-xs font-extrabold uppercase text-gray-400 tracking-wider">Resumen del Cálculo</div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Días a reembolsar:</span>
                <strong>{preview.daysRefunded} días</strong>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Bruto reembolso:</span>
                <span className="font-mono">${preview.gross.toLocaleString('es-CO')} COP</span>
              </div>
              <div className="flex justify-between text-amber-600 dark:text-amber-400">
                <span>Descuento 4×1.000:</span>
                <span className="font-mono">-${preview.fee.toLocaleString('es-CO')} COP</span>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className="font-bold text-gray-900 dark:text-white">Neto a devolver:</span>
                <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
                  ${preview.net.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-900/50">
            <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300">Total Reembolsado Registrado</div>
            <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
              ${Math.round(totalRefundedNet).toLocaleString('es-CO')} COP
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">{refunds.length} reembolso(s) históricos</div>
          </div>
        </div>
      </div>

      {/* Historial de reembolsos */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Historial de Reembolsos
          </h4>
          <button
            type="button"
            onClick={fetchRefunds}
            className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-white flex items-center gap-1"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>

        {refunds.length === 0 ? (
          <div className="text-xs text-gray-400 py-6 text-center">No hay reembolsos registrados desde el panel todavía.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-[11px] uppercase text-gray-400">
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Cliente</th>
                  <th className="py-2 pr-3">Plataforma</th>
                  <th className="py-2 pr-3">Regla / Días</th>
                  <th className="py-2 pr-3">4×1000</th>
                  <th className="py-2 pr-3">Neto</th>
                  <th className="py-2 pr-3">Razón</th>
                  <th className="py-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {refunds.map(r => (
                  <tr key={r.id}>
                    <td className="py-2.5 pr-3 font-mono whitespace-nowrap">{String(r.refund_date).slice(0, 10)}</td>
                    <td className="py-2.5 pr-3">
                      <div className="font-bold text-gray-900 dark:text-white">{r.customer_name}</div>
                      {r.customer_phone && <div className="text-[10px] text-gray-400 font-mono">{r.customer_phone}</div>}
                    </td>
                    <td className="py-2.5 pr-3 font-semibold">{r.platform}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap">
                      {r.rule_applied} ({r.days_refunded}d)
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-amber-600">
                      {r.apply_4x1000 ? `-$${Number(r.fee_4x1000).toLocaleString('es-CO')}` : '$0'}
                    </td>
                    <td className="py-2.5 pr-3 font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      -${Number(r.net_refund_amount).toLocaleString('es-CO')}
                    </td>
                    <td className="py-2.5 pr-3 max-w-xs truncate text-gray-600 dark:text-gray-300" title={r.reason}>
                      {r.reason}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-500/10"
                        title="Eliminar y revertir flujo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
