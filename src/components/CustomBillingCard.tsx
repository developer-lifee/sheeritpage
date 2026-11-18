import React, { useEffect, useState } from 'react';
import { Scale, Plus, Trash2 } from 'lucide-react';

interface CustomBillingRule {
  id: number;
  phone: string;
  client_name: string | null;
  platform: string;
  account_email: string | null;
  mode: 'custom_price' | 'manual_only' | 'owner_settlement';
  custom_amount: number | null;
  notes: string | null;
}

interface CustomBillingCardProps {
  phone: string;
  clientName: string;
  defaultPlatform?: string;
  defaultAccountEmail?: string;
  initialRules: CustomBillingRule[];
}

export const CustomBillingCard: React.FC<CustomBillingCardProps> = ({
  phone,
  clientName,
  defaultPlatform = '',
  defaultAccountEmail = '',
  initialRules
}) => {
  const [rules, setRules] = useState<CustomBillingRule[]>(initialRules || []);
  const [showForm, setShowForm] = useState(false);
  const [platform, setPlatform] = useState(defaultPlatform);
  const [mode, setMode] = useState<'custom_price' | 'manual_only' | 'owner_settlement'>('custom_price');
  const [customAmount, setCustomAmount] = useState('');
  const [accountEmail, setAccountEmail] = useState(defaultAccountEmail);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

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
          custom_amount: mode === 'custom_price' && customAmount ? Number(customAmount) : null,
          notes: notes.trim() || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setRules(data.rules || []);
        setShowForm(false);
        setCustomAmount('');
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

  const modeLabel = (m: string) => {
    if (m === 'custom_price') return '💲 Precio Personalizado';
    if (m === 'owner_settlement') return '🤝 Propietario / Liquidación';
    return '✋ Cobro Manual (No enviar bot)';
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border dark:border-gray-700 shadow-sm flex flex-col mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-500" />
          Acuerdos Especiales de Cobro
        </h4>
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {showForm ? 'Cancelar' : 'Agregar Acuerdo'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="mb-4 p-3.5 bg-gray-50 dark:bg-gray-900/60 rounded-xl border dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Plataforma (o ALL)</label>
            <input
              type="text"
              required
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="Ej: APPLE TV, APPLE ONE, ALL"
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
              <option value="custom_price">💲 Precio Personalizado (Bot cobra este valor)</option>
              <option value="manual_only">✋ Cobro Manual (Bot NO envía cobro)</option>
              <option value="owner_settlement">🤝 Propietario / Liquidación (Calcula cupos)</option>
            </select>
          </div>

          {mode === 'custom_price' && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Valor Acordado (COP)</label>
              <input
                type="number"
                required
                min={1000}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Ej: 25000"
                className="w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600 dark:text-white outline-none"
              />
            </div>
          )}

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

          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Notas del Acuerdo</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Él paga la cuenta y nosotros le pasamos el restante"
              className="w-full px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600 dark:text-white outline-none"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs disabled:opacity-50"
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
                  {r.mode === 'custom_price' && r.custom_amount && (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ${Math.round(Number(r.custom_amount)).toLocaleString('es-CO')}
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
                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
