import React, { useState, useEffect } from 'react';
import { CreditCard, Save, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';

interface SubMethod {
  id: string;
  label: string;
  value: string;
  enabled: boolean;
}

interface PaymentMethod {
  enabled: boolean;
  automatic: boolean;
  label: string;
  description: string;
  sub_methods?: SubMethod[];
}

interface PaymentConfig {
  [key: string]: PaymentMethod;
}

export const PaymentConfigView: React.FC = () => {
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/payment-config`);
      const data = await res.json();
      setConfig(data);
    } catch (e) {
      console.error("Error fetching payment config:", e);
      setMessage({ type: 'error', text: 'Error al conectar con el servidor para obtener configuración.' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: string) => {
    if (!config) return;
    setConfig({
      ...config,
      [key]: {
        ...config[key],
        enabled: !config[key].enabled
      }
    });
  };

  const handleSubToggle = (key: string, subId: string) => {
    if (!config) return;
    const subMethods = config[key].sub_methods;
    if (!subMethods) return;
    const updatedSubs = subMethods.map(sub => {
      if (sub.id === subId) {
        return { ...sub, enabled: !sub.enabled };
      }
      return sub;
    });
    setConfig({
      ...config,
      [key]: {
        ...config[key],
        sub_methods: updatedSubs
      }
    });
  };

  const handleSubValueChange = (key: string, subId: string, value: string) => {
    if (!config) return;
    const subMethods = config[key].sub_methods;
    if (!subMethods) return;
    const updatedSubs = subMethods.map(sub => {
      if (sub.id === subId) {
        return { ...sub, value };
      }
      return sub;
    });
    setConfig({
      ...config,
      [key]: {
        ...config[key],
        sub_methods: updatedSubs
      }
    });
  };

  const handleDescChange = (key: string, val: string) => {
    if (!config) return;
    setConfig({
      ...config,
      [key]: {
        ...config[key],
        description: val
      }
    });
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setMessage(null);
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/payment-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, password: 'admin123' })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Configuración guardada correctamente. El bot ya utiliza estas recomendaciones.' });
      } else {
        setMessage({ type: 'error', text: 'Error: ' + data.message });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Error de comunicación con el servidor.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 dark:text-gray-400">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-primary mb-3" />
        <p>Cargando configuración de métodos de pago...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center dark:text-white">
            <CreditCard className="mr-2 text-brand-primary" /> Recomendaciones y Métodos de Pago
          </h2>
          <p className="text-xs text-gray-400 mt-1">Activa o desactiva las recomendaciones de pago del Bot de WhatsApp en tiempo real.</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center bg-brand-primary hover:bg-brand-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-55 w-full md:w-auto"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-6 flex items-start gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800' : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800'}`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {config && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.keys(config).map((key) => {
            const method = config[key];
            return (
              <div key={key} className="p-5 rounded-2xl border border-gray-150 dark:border-gray-750 bg-gray-50/50 dark:bg-gray-900/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 dark:text-white text-base">
                        {method.label}
                      </span>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 w-fit ${method.automatic ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'}`}>
                        {method.automatic ? '⚡ Automatización Activa' : '⚠️ Validación Manual'}
                      </span>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggle(key)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${method.enabled ? 'bg-brand-primary' : 'bg-gray-200 dark:bg-gray-700'}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${method.enabled ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>

                  <div className="mt-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mensaje e Instrucciones de Pago</label>
                    <textarea
                      rows={4}
                      value={method.description}
                      onChange={(e) => handleDescChange(key, e.target.value)}
                      className="w-full text-xs font-mono p-3 bg-white dark:bg-gray-750 border dark:border-gray-600 rounded-xl dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>

                  {method.sub_methods && (
                    <div className="mt-4 p-4 bg-white dark:bg-gray-750 border dark:border-gray-700 rounded-xl space-y-3">
                      <span className="block text-[10px] font-bold text-gray-450 uppercase tracking-wider">Sub-métodos / Llaves individuales</span>
                      {method.sub_methods.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between border-b dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                          <div className="flex flex-col flex-grow pr-4">
                            <span className="text-xs font-bold text-gray-800 dark:text-white">{sub.label}</span>
                            <input
                              type="text"
                              value={sub.value}
                              onChange={(e) => handleSubValueChange(key, sub.id, e.target.value)}
                              className="mt-1 text-[11px] font-mono px-2 py-1 border rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-650 dark:text-white"
                            />
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleSubToggle(key, sub.id)}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${sub.enabled ? 'bg-brand-primary' : 'bg-gray-200 dark:bg-gray-700'}`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${sub.enabled ? 'translate-x-4' : 'translate-x-0'}`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
