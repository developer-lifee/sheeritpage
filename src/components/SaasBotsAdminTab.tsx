import React, { useEffect, useState } from 'react';
import { Bot, RefreshCcw, Send, CalendarPlus, CheckCircle2, AlertCircle, Database } from 'lucide-react';

interface SaasTenantAdminItem {
  id: number;
  slug: string;
  owner_name: string;
  business_name: string;
  email: string;
  plan_name: string;
  amount_paid?: number;
  expires_at?: string | null;
  messages_used_month: number;
  monthly_message_limit: number;
  is_bot_active: number | boolean;
  wa_status: string;
  wa_phone?: string | null;
  enabled_modules?: string[];
  store_slug?: string | null;
  liveSession?: {
    status: string;
    phone: string | null;
  };
}

interface SaasBotsAdminTabProps {
  adminPassword: string;
  onBalanceChanged?: () => void;
}

const getApiUrl = () =>
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : window.location.origin;

export const SaasBotsAdminTab: React.FC<SaasBotsAdminTabProps> = ({ adminPassword, onBalanceChanged }) => {
  const [tenants, setTenants] = useState<SaasTenantAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/saas-bots?password=${encodeURIComponent(adminPassword)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.tenants)) {
        setTenants(data.tenants);
      }
    } catch {
      setBanner({ type: 'err', text: 'No se pudo cargar la lista de Bots SaaS.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleToggleModule = async (tenant: SaasTenantAdminItem, modKey: string) => {
    const current = Array.isArray(tenant.enabled_modules) ? tenant.enabled_modules : [];
    const next = current.includes(modKey) ? current.filter(m => m !== modKey) : [...current, modKey];
    setBusyKey(`mod_${tenant.id}_${modKey}`);
    setBanner(null);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/saas-bots/${tenant.id}/modules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword, modules: next })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Error actualizando módulo');
      setTenants(prev => prev.map(t => (t.id === tenant.id ? { ...t, enabled_modules: data.enabled_modules } : t)));
      setBanner({
        type: 'ok',
        text: `Módulo "${modKey}" ${next.includes(modKey) ? 'activado' : 'bloqueado'} para ${tenant.business_name}.`
      });
    } catch (err: any) {
      setBanner({ type: 'err', text: err.message });
    } finally {
      setBusyKey(null);
    }
  };

  const handleRenewTenant = async (tenant: SaasTenantAdminItem) => {
    const defaultAmt = Number(tenant.amount_paid) > 0 ? Number(tenant.amount_paid) : 30000;
    const rawAmt = prompt(`¿Cuánto pagó ${tenant.business_name} por los +30 días (COP)?`, String(defaultAmt));
    if (rawAmt === null) return;
    const amountPaid = Number(String(rawAmt).replace(/[^\d]/g, '')) || 0;

    setBusyKey(`renew_${tenant.id}`);
    setBanner(null);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/saas-bots/${tenant.id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword, durationDays: 30, amountPaid, syncToCashFlow: true })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo renovar');
      setBanner({
        type: 'ok',
        text: `${tenant.business_name} renovado +30 días${data.cashFlowLogged ? ` (+$${amountPaid.toLocaleString('es-CO')} COP en Flujo de Caja)` : ''}.`
      });
      fetchTenants();
      onBalanceChanged?.();
    } catch (err: any) {
      setBanner({ type: 'err', text: err.message });
    } finally {
      setBusyKey(null);
    }
  };

  const handleSendBilling = async (tenant: SaasTenantAdminItem) => {
    const fallbackPhone = tenant.liveSession?.phone || tenant.wa_phone || '';
    const phone = fallbackPhone || prompt(`Ingresa el WhatsApp de ${tenant.owner_name} (${tenant.business_name}) para enviar el cobro:`) || '';
    if (!phone.trim()) return;

    setBusyKey(`bill_${tenant.id}`);
    setBanner(null);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/saas-bots/${tenant.id}/send-billing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword, phone: phone.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo enviar cobro por WhatsApp');
      setBanner({
        type: 'ok',
        text: `Aviso de cobro enviado por WhatsApp a ${data.sentTo} ($${Number(data.suggestedAmount || 0).toLocaleString('es-CO')} COP).`
      });
    } catch (err: any) {
      setBanner({ type: 'err', text: err.message });
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="space-y-4">
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

      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-teal-500" /> Clientes SaaS (/mi-bot) y Cobros Automáticos
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              El cron diario (10:00 AM) recuerda vencimientos 2 días antes y el día de corte; aquí puedes renovar +30 días, enviar cobro manual o prender módulos pagos.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchTenants}
            className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>

        {tenants.length === 0 ? (
          <div className="text-xs text-gray-400 py-8 text-center">No hay clientes de Bot Studio registrados aún.</div>
        ) : (
          <div className="space-y-3">
            {tenants.map(t => {
              const mods = Array.isArray(t.enabled_modules) ? t.enabled_modules : [];
              const hasCrm = mods.includes('crm_sheets');
              const expDate = t.expires_at ? new Date(t.expires_at) : null;
              const isExpired = expDate ? expDate.getTime() < Date.now() : false;
              const liveStatus = t.liveSession?.status || t.wa_status;
              const phoneShown = t.liveSession?.phone || t.wa_phone;

              return (
                <div
                  key={t.id}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                        #{t.id} · {t.business_name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-600 dark:text-teal-300 border border-teal-500/30">
                        {t.plan_name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          liveStatus === 'CONNECTED'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {liveStatus} {phoneShown ? `(+${phoneShown})` : ''}
                      </span>
                      {t.store_slug && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/15 text-indigo-500">
                          /tienda/{t.store_slug}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {t.owner_name} · {t.email} · Mensajes mes: <strong>{t.messages_used_month}/{t.monthly_message_limit}</strong>
                    </div>
                    {expDate && (
                      <div className={`text-[11px] font-semibold ${isExpired ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {isExpired ? '⚠️ Vencido el ' : 'Vigente hasta '}
                        {expDate.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={busyKey === `mod_${t.id}_crm_sheets`}
                      onClick={() => handleToggleModule(t, 'crm_sheets')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
                        hasCrm
                          ? 'bg-sky-500/15 border-sky-500/40 text-sky-600 dark:text-sky-300'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'
                      }`}
                    >
                      <Database className="w-3.5 h-3.5" />
                      {hasCrm ? 'Datos & Sheets: Activo' : 'Activar Datos & Sheets'}
                    </button>

                    <button
                      type="button"
                      disabled={busyKey === `bill_${t.id}`}
                      onClick={() => handleSendBilling(t)}
                      className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Enviar Cobro WA
                    </button>

                    <button
                      type="button"
                      disabled={busyKey === `renew_${t.id}`}
                      onClick={() => handleRenewTenant(t)}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      Renovar +30 días
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
