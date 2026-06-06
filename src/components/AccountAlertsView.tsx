import React, { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, Save, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

interface AvailabilityOverride {
  immediate: boolean;
  reason?: string;
  incident?: string;
}

type OverridesConfig = Record<string, AvailabilityOverride>;

export const AccountAlertsView: React.FC = () => {
  const [overrides, setOverrides] = useState<OverridesConfig>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [newEmailKey, setNewEmailKey] = useState('');
  const [newEmailIncident, setNewEmailIncident] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    
    try {
      const availRes = await fetch(`${apiUrl}/api/admin/availability`);
      if (!availRes.ok) throw new Error('Error al obtener la configuración de disponibilidad');
      const availData = await availRes.json();
      setOverrides(availData || {});
    } catch (err) {
      console.error('Error fetching availability data:', err);
      setError('No se pudo conectar con el bot.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddEmailAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailKey.trim() || !newEmailIncident.trim()) return;
    
    const emailLower = newEmailKey.trim().toLowerCase();
    setOverrides(prev => ({
      ...prev,
      [emailLower]: {
        immediate: true,
        incident: newEmailIncident.trim()
      }
    }));
    
    setNewEmailKey('');
    setNewEmailIncident('');
  };

  const handleDeleteEmailAlert = (emailKey: string) => {
    setOverrides(prev => {
      const updated = { ...prev };
      delete updated[emailKey];
      return updated;
    });
  };

  const handleSave = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/availability/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: overrides, password: 'admin123' })
      });
      const result = await res.json();
      if (result.success) {
        setSuccess('Alertas de cuentas guardadas con éxito.');
        fetchData();
      } else {
        setError(`❌ Error: ${result.message}`);
      }
    } catch (err) {
      setError('❌ Error al conectar con el backend.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter existing email alerts from overrides
  const emailAlerts = Object.entries(overrides).filter(([key]) => key.includes('@'));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center dark:text-white">
            <Mail className="mr-2 text-brand-primary" /> Alertas de Cuentas / Emails Específicos
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configura advertencias para correos o cuentas específicas. El bot informará automáticamente a los clientes que tengan estos correos asignados.
          </p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={fetchData}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg transition-colors"
            title="Refrescar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleSave}
            disabled={actionLoading || loading}
            className="flex items-center justify-center bg-brand-primary hover:bg-brand-dark text-white font-bold text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {actionLoading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center bg-red-55/10 text-red-800 dark:text-red-200 p-4 rounded-xl mb-6 border border-red-200 dark:border-red-900/50">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center bg-green-55/10 text-green-800 dark:text-green-200 p-4 rounded-xl mb-6 border border-green-200 dark:border-green-900/50">
          <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 font-light">Cargando alertas de cuentas...</div>
      ) : (
        <>
          {/* Add alert form */}
          <form onSubmit={handleAddEmailAlert} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 dark:bg-gray-850 p-4 rounded-xl border dark:border-gray-750">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Correo Electrónico de la Cuenta</label>
              <input
                type="email"
                placeholder="Ej. weeddiagama@gmail.com"
                value={newEmailKey}
                onChange={(e) => setNewEmailKey(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border dark:border-gray-750 bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Descripción de la Falla / Situación</label>
              <input
                type="text"
                placeholder="Ej. Cuenta suspendida por violación de hogar. Estamos reasignando."
                value={newEmailIncident}
                onChange={(e) => setNewEmailIncident(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border dark:border-gray-750 bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full flex items-center justify-center bg-brand-primary hover:bg-brand-dark text-white font-bold text-sm py-2 rounded-xl transition-all"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Agregar Alerta
              </button>
            </div>
          </form>

          {/* Existing Alerts List */}
          {emailAlerts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-150 dark:border-gray-750 rounded-xl text-gray-500 dark:text-gray-400">
              <Mail className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No hay alertas específicas configuradas.</p>
              <p className="text-xs opacity-75 mt-0.5">Ingresa un correo arriba para reportar una falla de cuenta específica.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emailAlerts.map(([email, value]) => (
                <div key={email} className="flex justify-between items-center bg-amber-50/20 dark:bg-amber-950/10 p-3.5 rounded-xl border border-amber-100 dark:border-amber-900/30">
                  <div className="min-w-0 flex-grow pr-4">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300 font-mono block">{email}</span>
                    <p className="text-sm text-gray-755 dark:text-gray-250 mt-1">{value.incident}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteEmailAlert(email)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors flex-shrink-0"
                    title="Eliminar Alerta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
