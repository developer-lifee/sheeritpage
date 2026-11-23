import React, { useEffect, useState } from 'react';
import { Scale, Plus, Trash2, Calendar, Calculator, Check, RefreshCw } from 'lucide-react';

interface CustomBillingRule {
  id: number;
  phone: string;
  client_name: string | null;
  platform: string;
  account_email: string | null;
  mode: 'custom_price' | 'manual_only' | 'owner_settlement' | 'fixed_date';
  custom_amount: number | null;
  fixed_billing_day?: number | null;
  notes: string | null;
}

interface UnifyBreakdownItem {
  rowNumber: number;
  streaming: string;
  accountEmail: string;
  currentDate: string;
  targetDate: string;
  diffDays: number;
  monthlyPrice: number;
  adjustmentAmount: number;
}

interface UnifyPreviewResult {
  targetDate: string;
  fixedDay: number;
  rowsCount: number;
  breakdown: UnifyBreakdownItem[];
  totalExtraCharge: number;
  totalCreditDiscount: number;
  netAdjustment: number;
  balanceStatus: 'charge_client' | 'client_credit' | 'even';
  updatedCount?: number;
}

interface CustomBillingCardProps {
  phone: string;
  clientName: string;
  defaultPlatform?: string;
  defaultAccountEmail?: string;
  initialRules: CustomBillingRule[];
  onDatesUnified?: (phone: string, newDate: string) => void;
}

export const CustomBillingCard: React.FC<CustomBillingCardProps> = ({
  phone,
  clientName,
  defaultPlatform = '',
  defaultAccountEmail = '',
  initialRules,
  onDatesUnified
}) => {
  const [rules, setRules] = useState<CustomBillingRule[]>(initialRules || []);
  const [showForm, setShowForm] = useState(false);
  const [platform, setPlatform] = useState(defaultPlatform || 'ALL');
  const [mode, setMode] = useState<'custom_price' | 'manual_only' | 'owner_settlement' | 'fixed_date'>('custom_price');
  const [customAmount, setCustomAmount] = useState('');
  const [fixedBillingDay, setFixedBillingDay] = useState('');
  const [accountEmail, setAccountEmail] = useState(defaultAccountEmail);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Estados para Unificar Fechas + Prorrateo
  const [showUnify, setShowUnify] = useState(false);
  const [targetDate, setTargetDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [saveFixedDay, setSaveFixedDay] = useState(true);
  const [unifyLoading, setUnifyLoading] = useState(false);
  const [unifyApplying, setUnifyApplying] = useState(false);
  const [unifyPreview, setUnifyPreview] = useState<UnifyPreviewResult | null>(null);
  const [unifySuccessMsg, setUnifySuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setRules(initialRules || []);
  }, [initialRules]);

  const apiUrl =
    typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:3000'
      : window.location.origin;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform.trim()) return;
    if (mode === 'fixed_date' && !fixedBillingDay) {
      alert('Indica el día fijo del mes (1 a 31).');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/custom-billing/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          client_name: clientName,
          platform: platform.trim().toUpperCase(),
          account_email: accountEmail.trim() || null,
          mode,
          custom_amount: (mode === 'custom_price' || mode === 'owner_settlement') && customAmount ? Number(customAmount) : null,
          fixed_billing_day: fixedBillingDay ? Number(fixedBillingDay) : null,
          notes: notes.trim() || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setRules(data.rules || []);
        setShowForm(false);
        setCustomAmount('');
        setFixedBillingDay('');
        setNotes('');
      } else {
        alert(data.message || 'No se pudo guardar el acuerdo.');
      }
    } catch (err) {
      alert('Error de conexión al guardar acuerdo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este acuerdo especial de cobro?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/custom-billing/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        setRules(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      alert('Error eliminando acuerdo.');
    }
  };

  const handlePreviewUnify = async () => {
    if (!targetDate) return;
    setUnifyLoading(true);
    setUnifySuccessMsg(null);
    try {
      const res = await fetch(`${apiUrl}/api/admin/client/unify-expiration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          targetDate,
          previewOnly: true,
          clientName,
          password: 'admin123'
        })
      });
      const data = await res.json();
      if (data.success) {
        setUnifyPreview(data);
      } else {
        alert(data.message || 'No se pudo calcular la unificación.');
      }
    } catch (err) {
      alert('Error de conexión al calcular ajuste de fechas.');
    } finally {
      setUnifyLoading(false);
    }
  };

  const handleConfirmUnify = async () => {
    if (!targetDate) return;
    setUnifyApplying(true);
    setUnifySuccessMsg(null);
    try {
      const res = await fetch(`${apiUrl}/api/admin/client/unify-expiration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          targetDate,
          previewOnly: false,
          saveFixedDay,
          clientName,
          password: 'admin123'
        })
      });
      const data = await res.json();
      if (data.success) {
        setUnifyPreview(data);
        if (Array.isArray(data.rules)) {
          setRules(data.rules);
        }
        if (onDatesUnified) {
          onDatesUnified(phone, targetDate);
        }
        const netAbs = Math.abs(Number(data.netAdjustment || 0)).toLocaleString('es-CO');
        const balanceTxt =
          data.balanceStatus === 'charge_client'
            ? `Saldo en contra (a cobrar): $${netAbs} COP`
            : data.balanceStatus === 'client_credit'
              ? `Saldo a favor (descuento): $${netAbs} COP`
              : 'Sin diferencia de saldo ($0 COP)';
        setUnifySuccessMsg(
          `✅ ${data.updatedCount}/${data.rowsCount} servicios unificados al ${targetDate} en Excel. ${balanceTxt}.` +
          (saveFixedDay ? ` Día fijo ${data.fixedDay} guardado para futuras renovaciones.` : '')
        );
      } else {
        alert(data.message || 'No se pudieron unificar las fechas.');
      }
    } catch (err) {
      alert('Error de conexión al unificar fechas en Excel.');
    } finally {
      setUnifyApplying(false);
    }
  };

  const modeLabel = (m: string) => {
    if (m === 'custom_price') return '💲 Precio Personalizado';
    if (m === 'fixed_date') return '📅 Fecha Fija';
    if (m === 'owner_settlement') return '🤝 Propietario / Liquidación';
    return '✋ Cobro Manual (No enviar bot)';
  };

  const selectedDayPreview = targetDate && targetDate.includes('-') ? parseInt(targetDate.split('-')[2], 10) : null;

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border dark:border-gray-700 shadow-sm flex flex-col mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-500" />
          Acuerdos Especiales de Cobro y Fechas
        </h4>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowUnify(v => !v);
              setShowForm(false);
              setUnifySuccessMsg(null);
            }}
            className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            {showUnify ? 'Cerrar Unificador' : 'Unificar Fechas'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm(v => !v);
              setShowUnify(false);
            }}
            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {showForm ? 'Cancelar' : 'Agregar Acuerdo'}
          </button>
        </div>
      </div>

      {/* PANEL DE UNIFICACIÓN DE FECHAS CON PRORRATEO (SALDO A FAVOR / EN CONTRA) */}
      {showUnify && (
        <div className="mb-4 p-4 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800/60 space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase text-purple-700 dark:text-purple-300 mb-1">
                Nueva fecha unificada para TODOS los servicios del cliente:
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => {
                  setTargetDate(e.target.value);
                  setUnifyPreview(null);
                  setUnifySuccessMsg(null);
                }}
                className="w-full px-3 py-2 rounded-lg border border-purple-300 dark:bg-gray-800 dark:border-purple-700 dark:text-white font-mono outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              type="button"
              onClick={handlePreviewUnify}
              disabled={unifyLoading || !targetDate}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {unifyLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Calculator className="w-3.5 h-3.5" />}
              <span>{unifyLoading ? 'Calculando...' : 'Calcular ajuste'}</span>
            </button>
          </div>

          <label className="flex items-center gap-2 text-[11px] text-gray-700 dark:text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saveFixedDay}
              onChange={(e) => setSaveFixedDay(e.target.checked)}
              className="rounded border-purple-400 text-purple-600 focus:ring-purple-500"
            />
            <span>
              Fijar también el <strong>día {selectedDayPreview || '--'}</strong> de cada mes para futuras renovaciones automáticas del bot
            </span>
          </label>

          {unifyPreview && (
            <div className="space-y-3 pt-2 border-t border-purple-200/70 dark:border-purple-800/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-gray-500 dark:text-gray-400 border-b border-purple-200/60 dark:border-purple-800/40">
                      <th className="py-1.5 pr-2">Servicio</th>
                      <th className="py-1.5 pr-2">Actual → Nueva</th>
                      <th className="py-1.5 pr-2 text-center">Días</th>
                      <th className="py-1.5 pr-2 text-right">Tarifa/mes</th>
                      <th className="py-1.5 text-right">Ajuste</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100 dark:divide-purple-900/30">
                    {unifyPreview.breakdown.map((b) => (
                      <tr key={b.rowNumber}>
                        <td className="py-1.5 pr-2 font-bold text-gray-800 dark:text-gray-200">
                          {b.streaming} <span className="text-[10px] font-normal text-gray-400">(Fila {b.rowNumber})</span>
                        </td>
                        <td className="py-1.5 pr-2 font-mono text-gray-600 dark:text-gray-300">
                          {b.currentDate} → <span className="font-bold text-purple-700 dark:text-purple-300">{b.targetDate}</span>
                        </td>
                        <td className={`py-1.5 pr-2 text-center font-bold ${b.diffDays > 0 ? 'text-rose-600 dark:text-rose-400' : b.diffDays < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                          {b.diffDays > 0 ? `+${b.diffDays}d` : `${b.diffDays}d`}
                        </td>
                        <td className="py-1.5 pr-2 text-right font-mono text-gray-600 dark:text-gray-300">
                          ${b.monthlyPrice.toLocaleString('es-CO')}
                        </td>
                        <td className={`py-1.5 text-right font-mono font-bold ${b.adjustmentAmount > 0 ? 'text-rose-600 dark:text-rose-400' : b.adjustmentAmount < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                          {b.adjustmentAmount > 0
                            ? `+$${b.adjustmentAmount.toLocaleString('es-CO')}`
                            : b.adjustmentAmount < 0
                              ? `-$${Math.abs(b.adjustmentAmount).toLocaleString('es-CO')}`
                              : '$0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Resumen de Saldo a Favor / En Contra */}
              <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                unifyPreview.balanceStatus === 'charge_client'
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  : unifyPreview.balanceStatus === 'client_credit'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider">
                    {unifyPreview.balanceStatus === 'charge_client'
                      ? '🔴 Saldo en contra (Valor a cobrar al cliente por días extra)'
                      : unifyPreview.balanceStatus === 'client_credit'
                        ? '🟢 Saldo a favor del cliente (Descuento por días recortados)'
                        : '⚪ Sin diferencia de saldo'}
                  </div>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    Días adicionales: +${unifyPreview.totalExtraCharge.toLocaleString('es-CO')} · Días recortados (descuento): -${unifyPreview.totalCreditDiscount.toLocaleString('es-CO')}
                  </div>
                </div>
                <div className="text-lg font-extrabold font-mono whitespace-nowrap">
                  {unifyPreview.balanceStatus === 'client_credit' ? '-' : unifyPreview.balanceStatus === 'charge_client' ? '+' : ''}
                  ${Math.abs(unifyPreview.netAdjustment).toLocaleString('es-CO')} COP
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleConfirmUnify}
                  disabled={unifyApplying}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {unifyApplying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{unifyApplying ? 'Actualizando Excel...' : `Confirmar y unificar ${unifyPreview.rowsCount} servicio(s) en Excel`}</span>
                </button>
              </div>
            </div>
          )}

          {unifySuccessMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
              {unifySuccessMsg}
            </div>
          )}
        </div>
      )}

      {/* FORMULARIO DE ACUERDO ESPECIAL (VALOR Y/O DÍA FIJO A LA VEZ) */}
      {showForm && (
        <form onSubmit={handleSave} className="mb-4 p-3.5 bg-gray-50 dark:bg-gray-900/60 rounded-xl border dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Plataforma (o ALL para todas)</label>
            <input
              type="text"
              required
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="Ej: ALL, NETFLIX, APPLE ONE"
              className="w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Modo de Cobro</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600 dark:text-white outline-none"
            >
              <option value="custom_price">💲 Precio Personalizado (y/o Fecha Fija)</option>
              <option value="fixed_date">📅 Solo Fecha Fija de Cobro (Tarifa estándar)</option>
              <option value="manual_only">✋ Cobro Manual (Bot NO envía cobro)</option>
              <option value="owner_settlement">🤝 Propietario / Liquidación (Calcula cupos)</option>
            </select>
          </div>

          {(mode === 'custom_price' || mode === 'owner_settlement') && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                {mode === 'owner_settlement' ? 'Valor a Pagar / Liquidar (COP)' : '1. Valor Acordado a Cobrar (COP)'}
              </label>
              <input
                type="number"
                required={mode === 'custom_price' && !fixedBillingDay}
                min={1000}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder={mode === 'owner_settlement' ? 'Ej: 43900' : 'Ej: 25000 (opcional si solo fijas fecha)'}
                className="w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600 dark:text-white outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
              2. Día Fijo de Cobro al Mes (1–31, opcional)
            </label>
            <input
              type="number"
              required={mode === 'fixed_date'}
              min={1}
              max={31}
              value={fixedBillingDay}
              onChange={(e) => setFixedBillingDay(e.target.value)}
              placeholder="Ej: 26 (para que siempre venza el día 26)"
              className="w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Cuenta Asociada (Opcional)</label>
            <input
              type="text"
              value={accountEmail}
              onChange={(e) => setAccountEmail(e.target.value)}
              placeholder="Ej: hija de miguel botero / induavila"
              className="w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Notas del Acuerdo</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Paga el 26 de cada mes / valor especial"
              className="w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600 dark:text-white outline-none"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Guardando...' : 'Guardar Acuerdo'}
            </button>
          </div>
        </form>
      )}

      {rules.length === 0 ? (
        <span className="text-xxs text-gray-400 italic font-light">
          Sin acuerdos especiales. El bot aplica tarifas y cobros estándar del catálogo.
        </span>
      ) : (
        <div className="space-y-2 text-xs">
          {rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/70 dark:border-amber-800/40">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-800 dark:text-white uppercase">{r.platform}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    {modeLabel(r.mode)}
                  </span>
                  {(r.mode === 'custom_price' || r.mode === 'owner_settlement') && r.custom_amount && (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ${Math.round(Number(r.custom_amount)).toLocaleString('es-CO')}
                    </span>
                  )}
                  {r.fixed_billing_day && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                      📅 Día fijo: {r.fixed_billing_day}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">
                  {r.account_email ? `Cuenta: ${r.account_email}` : ''}
                  {r.account_email && r.notes ? ' · ' : ''}
                  {r.notes || ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(r.id)}
                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
                title="Eliminar acuerdo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
