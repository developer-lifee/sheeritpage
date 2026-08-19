import React, { useState, useEffect } from 'react';
import { Key, Shield, Trash2, Plus, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface GptAccount {
  email: string;
  code: string;
  timeRemaining: number;
  service?: string;
}

const getServiceBadgeStyles = (srv?: string) => {
  const normalized = (srv || 'ChatGPT').toLowerCase();
  if (normalized.includes('amazon') || normalized.includes('prime')) {
    return 'bg-amber-100 text-amber-850 dark:bg-amber-950/45 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40';
  }
  if (normalized.includes('netflix')) {
    return 'bg-red-100 text-red-850 dark:bg-red-950/45 dark:text-red-300 border border-red-200 dark:border-red-900/40';
  }
  if (normalized.includes('disney')) {
    return 'bg-blue-100 text-blue-850 dark:bg-blue-950/45 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40';
  }
  if (normalized.includes('gpt') || normalized.includes('openai') || normalized.includes('chat')) {
    return 'bg-emerald-100 text-emerald-850 dark:bg-emerald-950/45 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40';
  }
  return 'bg-purple-100 text-purple-855 dark:bg-purple-950/45 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40';
};

export const GptAccountsView: React.FC = () => {
  const [accounts, setAccounts] = useState<GptAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [service, setService] = useState('ChatGPT');
  const [customService, setCustomService] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [seconds, setSeconds] = useState(30);

  const fetchAccounts = () => {
    setError('');
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
    fetch(`${apiUrl}/api/admin/gpt-accounts`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al obtener las cuentas');
        return res.json();
      })
      .then((data) => {
        setAccounts(Array.isArray(data) ? data : []);
        if (data.length > 0) {
          setSeconds(data[0].timeRemaining);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching GPT accounts:', err);
        setError('No se pudo conectar al bot. Verifica el estado del backend.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAccounts();
    const interval = setInterval(fetchAccounts, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          fetchAccounts();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !secret.trim()) {
      setError('El correo y el secreto TOTP son obligatorios.');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
    const serviceValue = service === 'Otro' ? customService : service;
    try {
      const res = await fetch(`${apiUrl}/api/admin/gpt-accounts/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, secret, service: serviceValue, password: 'admin123' })
      });
      const result = await res.json();
      if (result.success) {
        setSuccess('Cuenta 2FA guardada con éxito.');
        setEmail('');
        setSecret('');
        setService('ChatGPT');
        setCustomService('');
        fetchAccounts();
      } else {
        setError(`❌ Error: ${result.message}`);
      }
    } catch (err) {
      setError('❌ Error al conectar con el backend.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (targetEmail: string) => {
    const confirmDelete = window.confirm(`¿Estás seguro de eliminar la cuenta ${targetEmail}?`);
    if (!confirmDelete) return;

    setError('');
    setSuccess('');

    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
    try {
      const res = await fetch(`${apiUrl}/api/admin/gpt-accounts/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: 'admin123' })
      });
      const result = await res.json();
      if (result.success) {
        setSuccess(`Cuenta ${targetEmail} eliminada con éxito.`);
        fetchAccounts();
      } else {
        setError(`❌ Error: ${result.message}`);
      }
    } catch (err) {
      setError('❌ Error de red al eliminar la cuenta.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List of Accounts */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6 animate-fadeIn">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center dark:text-white">
                <Shield className="mr-2 text-brand-primary" /> Cuentas con 2FA (GPT/Amazon/etc.)
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Códigos de verificación en vivo para inicio de sesión seguro.
              </p>
            </div>
            <button
              onClick={fetchAccounts}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg transition-colors"
              title="Refrescar"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="flex items-center bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 rounded-xl mb-6 border border-red-200 dark:border-red-900/50">
              <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-4 rounded-xl mb-6 border border-green-200 dark:border-green-900/50">
              <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          {/* Global Progress Countdown Bar */}
          {accounts.length > 0 && (
            <div className="mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Clock className="w-4 h-4 text-brand-primary animate-spin" />
                <span>Los códigos expiran en: <b>{seconds}s</b></span>
              </div>
              <div className="w-32 bg-gray-250 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand-primary h-full transition-all duration-1000"
                  style={{ width: `${(seconds / 30) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Cargando llaves y códigos...</div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-750">
              <Key className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="font-bold text-gray-700 dark:text-gray-300">Sin cuentas configuradas</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configura tu primera cuenta de GPT/Amazon/Netflix con su semilla TOTP en el panel lateral.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {accounts.map((acct) => (
                <div
                  key={acct.email}
                  className="flex items-center justify-between p-4 border border-gray-150 dark:border-gray-750 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750/30 transition-all"
                >
                  <div className="flex-grow min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                        {acct.email}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${getServiceBadgeStyles(acct.service)}`}>
                        {acct.service || 'ChatGPT'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">2FA Activado</span>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="bg-brand-primary/10 text-brand-primary dark:text-brand-light px-4 py-2 rounded-lg font-mono text-xl font-bold tracking-widest">
                      {acct.code}
                    </div>
                    <button
                      onClick={() => handleDelete(acct.email)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                      title="Eliminar Cuenta"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Secret Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6 self-start">
          <h3 className="text-lg font-bold flex items-center mb-4 dark:text-white">
            <Plus className="mr-2 text-brand-primary" /> Agregar Semilla TOTP
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Correo de la Cuenta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@gmail.com"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Servicio / Plataforma</label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="ChatGPT">ChatGPT (OpenAI)</option>
                <option value="Amazon">Amazon Prime / AWS</option>
                <option value="Netflix">Netflix</option>
                <option value="Disney+">Disney+</option>
                <option value="Otro">Otro / Personalizado</option>
              </select>
            </div>
            {service === 'Otro' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre del Servicio Personalizado</label>
                <input
                  type="text"
                  placeholder="Ej: Star+ o Crunchyroll"
                  value={customService}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  onChange={(e) => setCustomService(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Clave Secreta / Semilla (Seed)</label>
              <input
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="JBSWY3DPEHPK3PXP"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-brand-primary"
                required
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Es la clave de 16-32 caracteres que proporciona el servicio al activar el autenticador.
              </p>
            </div>
            <button
              type="submit"
              disabled={actionLoading}
              className="w-full bg-brand-primary hover:bg-brand-dark text-white font-bold text-sm py-2 rounded-xl transition-all disabled:opacity-50"
            >
              {actionLoading ? 'Guardando...' : 'Guardar Cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
