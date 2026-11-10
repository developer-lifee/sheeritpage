import React, { useState, useEffect } from 'react';
import { Key, RefreshCw, X, Search, CheckCircle, AlertTriangle, ShieldAlert, Smartphone, Globe, ExternalLink, Clock } from 'lucide-react';

interface OtpLog {
  id: number;
  phone: string;
  client_name?: string;
  platform: string;
  account_email?: string;
  request_source?: string;
  status: 'success' | 'not_found' | 'limit_reached' | 'manual_required' | 'unautomated' | 'error' | string;
  code_or_link?: string;
  message?: string;
  created_at: string;
}

interface OtpLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OtpLogsModal: React.FC<OtpLogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<OtpLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const getApiUrl = () => {
    return (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
      ? 'http://localhost:3000'
      : window.location.origin;
  };

  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/client-2fa-logs?limit=150`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      }
    } catch (e) {
      console.error('Error fetching 2FA logs:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      if (autoRefresh) {
        const interval = setInterval(() => fetchLogs(true), 10000);
        return () => clearInterval(interval);
      }
    }
  }, [isOpen, autoRefresh]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(log => {
    if (filterStatus === 'success' && log.status !== 'success') return false;
    if (filterStatus === 'not_found' && log.status !== 'not_found') return false;
    if (filterStatus === 'issues' && !['limit_reached', 'manual_required', 'unautomated', 'error'].includes(log.status)) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const phone = (log.phone || '').replace(/\D/g, '');
    const cleanSearch = q.replace(/\D/g, '');
    return (
      (log.client_name || '').toLowerCase().includes(q) ||
      (log.platform || '').toLowerCase().includes(q) ||
      (log.account_email || '').toLowerCase().includes(q) ||
      (log.code_or_link || '').toLowerCase().includes(q) ||
      (cleanSearch.length >= 4 && phone.includes(cleanSearch)) ||
      (log.phone || '').includes(q)
    );
  });

  const formatLogDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' (' + d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) + ')';
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                Monitor de Códigos 2FA en Vivo
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  En tiempo real
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Historial de clientes que solicitaron códigos en la web o WhatsApp, errores de buzón y estados de entrega.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs()}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-gray-200 dark:border-gray-700 flex items-center gap-1.5 text-xs font-bold"
              title="Refrescar lista ahora"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refrescar</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FILTROS Y BUSCADOR */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-grow max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, teléfono, cuenta o servicio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-750 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'all' ? 'bg-brand-primary text-white shadow-xs' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
            >
              Todos ({logs.length})
            </button>
            <button
              onClick={() => setFilterStatus('success')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'success' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-gray-100 dark:bg-gray-800 text-emerald-600 dark:text-emerald-400'}`}
            >
              🟢 Entregados ({logs.filter(l => l.status === 'success').length})
            </button>
            <button
              onClick={() => setFilterStatus('not_found')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'not_found' ? 'bg-rose-600 text-white shadow-xs' : 'bg-gray-100 dark:bg-gray-800 text-rose-600 dark:text-rose-400'}`}
            >
              🔴 No Encontrado ({logs.filter(l => l.status === 'not_found').length})
            </button>
            <button
              onClick={() => setFilterStatus('issues')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'issues' ? 'bg-amber-600 text-white shadow-xs' : 'bg-gray-100 dark:bg-gray-800 text-amber-600 dark:text-amber-400'}`}
            >
              ⚠️ Límites / Asesor ({logs.filter(l => ['limit_reached', 'manual_required', 'unautomated', 'error'].includes(l.status)).length})
            </button>
          </div>
        </div>

        {/* TABLA DE LOGS */}
        <div className="flex-grow overflow-y-auto p-4">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-gray-400 dark:text-gray-500">
              <Key className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">No se encontraron solicitudes 2FA registradas con estos filtros.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200 dark:border-gray-750">
                    <th className="py-3 px-4">Hora</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Servicio / Buzón</th>
                    <th className="py-3 px-4">Canal</th>
                    <th className="py-3 px-4">Resultado / Código</th>
                    <th className="py-3 px-4">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                  {filteredLogs.map(log => {
                    const cleanPhone = (log.phone || '').replace(/\D/g, '');
                    const isSuccess = log.status === 'success';
                    const isNotFound = log.status === 'not_found';
                    const isLimit = log.status === 'limit_reached';

                    return (
                      <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-gray-400" />
                            {formatLogDate(log.created_at)}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {log.client_name || 'Cliente'}
                          </div>
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-mono inline-flex items-center gap-1"
                          >
                            +{cleanPhone}
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-black text-gray-800 dark:text-gray-200 uppercase tracking-wide block">
                            {log.platform}
                          </span>
                          <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 block truncate max-w-[200px]" title={log.account_email}>
                            {log.account_email || 'Sin correo'}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {log.request_source === 'web' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              <Globe className="w-3 h-3" /> Web
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <Smartphone className="w-3 h-3" /> WhatsApp
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {isSuccess ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40 font-mono font-bold text-xs">
                              <CheckCircle className="w-3.5 h-3.5" />
                              {log.code_or_link ? `Código: ${log.code_or_link}` : 'Entregado'}
                            </span>
                          ) : isNotFound ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300/40 font-bold text-[11px]">
                              🔴 Buzón Vacío (Sin códigos)
                            </span>
                          ) : isLimit ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300/40 font-bold text-[11px]">
                              <ShieldAlert className="w-3.5 h-3.5" /> Límite 3 Dispositivos
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-[11px]">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> {log.status}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-[11px] max-w-xs truncate" title={log.message}>
                          {log.message || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Mostrando {filteredLogs.length} de {logs.length} solicitudes recientes.</span>
          <label className="flex items-center gap-2 cursor-pointer font-bold">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-brand-primary focus:ring-brand-primary w-3.5 h-3.5 cursor-pointer"
            />
            <span>Auto-refrescar cada 10s</span>
          </label>
        </div>

      </div>
    </div>
  );
};
