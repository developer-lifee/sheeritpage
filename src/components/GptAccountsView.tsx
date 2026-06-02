import React, { useState, useEffect } from 'react';
import { Key, Shield, Trash2, Plus, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface GptAccount {
  email: string;
  code: string;
  timeRemaining: number;
}

export const GptAccountsView: React.FC = () => {
  const [accounts, setAccounts] = useState<GptAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [seconds, setSeconds] = useState(30);

  const fetchAccounts = () => {
    setError('');
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    fetch(`${apiUrl}/api/admin/gpt-accounts`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al obtener las cuentas');
        return res.json();
      })
      .then((data) => {
        setAccounts(Array.isArray(data) ? data : []);
        if (data.length > 0) {
          // Sync local countdown with backend timeRemaining
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
    const interval = setInterval(fetchAccounts, 30000); // Fetch new codes from server every 30s
    return () => clearInterval(interval);
  }, []);

  // Micro-countdown in frontend for smooth progress bar
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          // When countdown hits 0, trigger fetch to get fresh codes
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

    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/gpt-accounts/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, secret, password: 'admin123' })
      });
      const result = await res.json();
      if (result.success) {
        setSuccess('Cuenta GPT guardada con éxito.');
        setEmail('');
        setSecret('');
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

    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* List of Accounts */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center dark:text-white">
              <Shield className="mr-2 text-brand-primary" /> Cuentas GPT con 2FA (TOTP)
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configura tu primera cuenta de Netflix/GPT con su semilla TOTP en el panel lateral.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((acct) => (
              <div
                key={acct.email}
                className="flex items-center justify-between p-4 border border-gray-150 dark:border-gray-750 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750/30 transition-all"
              >
                <div className="flex-grow">
                  <span className="text-sm font-semibold text-gray-800 dark:text-white block truncate max-w-xs sm:max-w-md">
                    {acct.email}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">2FA Activado</span>
                </div>
                <div className="flex items-center gap-4">
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
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Clave Secreta / Semilla (Seed)</label>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="JBSWY3DPEHPK3PXP"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white text-sm font-mono"
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
  );
};
