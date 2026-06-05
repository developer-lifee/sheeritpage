import React, { useState, useEffect } from 'react';
import { Shield, ToggleLeft, ToggleRight, Search, Save, AlertTriangle, CheckCircle, RefreshCw, HelpCircle } from 'lucide-react';

interface Plan {
  id: number;
  name: string;
  price: number;
  characteristics: string[];
}

interface Platform {
  id: number;
  name: string;
  image: string;
  price: number;
  characteristics: string[];
  plans: Plan[];
}

interface AvailabilityOverride {
  immediate: boolean;
  reason?: string;
}

type OverridesConfig = Record<string, AvailabilityOverride>;

export const AvailabilityView: React.FC = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [overrides, setOverrides] = useState<OverridesConfig>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    
    try {
      // Load platforms catalog
      const platRes = await fetch('/data/platforms.json');
      const platData = await platRes.json();
      setPlatforms(Array.isArray(platData) ? platData : []);

      // Load availability overrides from backend
      const availRes = await fetch(`${apiUrl}/api/admin/availability`);
      if (!availRes.ok) throw new Error('Error al obtener la configuración de disponibilidad');
      const availData = await availRes.json();
      setOverrides(availData || {});
    } catch (err) {
      console.error('Error fetching availability data:', err);
      setError('No se pudo conectar con el bot. Se usarán datos de catálogo local.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = (key: string, currentVal: boolean) => {
    setOverrides(prev => {
      const updated = { ...prev };
      if (currentVal) {
        // Toggle from Available (true) to Not Available (false)
        updated[key] = { immediate: false, reason: prev[key]?.reason || 'Deshabilitado temporalmente.' };
      } else {
        // Toggle from Not Available (false) to Available (true)
        delete updated[key];
      }
      return updated;
    });
  };

  const handleReasonChange = (key: string, reason: string) => {
    setOverrides(prev => {
      if (prev[key]) {
        return {
          ...prev,
          [key]: { ...prev[key], reason }
        };
      }
      return prev;
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
        setSuccess('Configuración de disponibilidad guardada con éxito.');
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

  const filteredPlatforms = platforms.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center dark:text-white">
              <Shield className="mr-2 text-brand-primary" /> Disponibilidad de Stock y Entrega Inmediata
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Desactiva temporalmente la venta automática de plataformas o planes específicos cuando no haya stock o haya fallas de red.
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

        <div className="mb-6 flex gap-4">
          <div className="relative flex-grow">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar plataforma..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">Cargando catálogo y disponibilidad...</div>
        ) : filteredPlatforms.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No se encontraron plataformas.</div>
        ) : (
          <div className="space-y-6">
            {filteredPlatforms.map(platform => {
              // Platform key in overrides config
              const pKey = platform.name;
              const isPlatformAvailable = overrides[pKey]?.immediate !== false;
              const pReason = overrides[pKey]?.reason || '';

              return (
                <div key={platform.id} className="border border-gray-150 dark:border-gray-700 rounded-2xl p-5 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      {platform.image && (
                        <img src={platform.image} alt={platform.name} className="w-10 h-10 object-cover rounded-lg" />
                      )}
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">{platform.name}</h3>
                        <p className="text-xs text-gray-400">Restricción para todo el catálogo de esta plataforma</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggle(pKey, isPlatformAvailable)}
                        className="flex items-center"
                        title={isPlatformAvailable ? 'Habilitado' : 'Deshabilitado'}
                      >
                        {isPlatformAvailable ? (
                          <ToggleRight className="w-10 h-10 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-10 h-10 text-gray-400" />
                        )}
                      </button>
                      <span className={`text-sm font-bold ${isPlatformAvailable ? 'text-emerald-600 dark:text-emerald-450' : 'text-red-500'}`}>
                        {isPlatformAvailable ? 'Venta Inmediata' : 'Venta Manual'}
                      </span>
                    </div>
                  </div>

                  {!isPlatformAvailable && (
                    <div className="mb-4 bg-red-50/30 dark:bg-red-950/10 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                      <label className="block text-xs font-bold text-red-700 dark:text-red-300 mb-1">Motivo o Razón de la Indisponibilidad:</label>
                      <input
                        type="text"
                        value={pReason}
                        onChange={(e) => handleReasonChange(pKey, e.target.value)}
                        placeholder="Ej. Sin stock en hoja de cálculo"
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-red-200 dark:border-red-900/50 bg-white dark:bg-gray-850 dark:text-white"
                      />
                    </div>
                  )}

                  {/* Plans availability toggles */}
                  {platform.plans && platform.plans.length > 0 && (
                    <div className="ml-4 pl-4 border-l-2 border-gray-100 dark:border-gray-700 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Planes de {platform.name}</h4>
                      {platform.plans.map(plan => {
                        const planKey = `${platform.name} ${plan.name}`;
                        const isPlanAvailable = overrides[planKey]?.immediate !== false;
                        const planReason = overrides[planKey]?.reason || '';

                        return (
                          <div key={plan.id} className="bg-gray-50/50 dark:bg-gray-900/10 p-3 rounded-xl border dark:border-gray-750">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">{plan.name}</span>
                                <span className="text-xs text-gray-400 ml-2">(${plan.price.toLocaleString()})</span>
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleToggle(planKey, isPlanAvailable)}
                                  className="flex items-center"
                                >
                                  {isPlanAvailable ? (
                                    <ToggleRight className="w-8 h-8 text-emerald-500" />
                                  ) : (
                                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                                  )}
                                </button>
                                <span className={`text-xs font-bold ${isPlanAvailable ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {isPlanAvailable ? 'Inmediato' : 'Manual'}
                                </span>
                              </div>
                            </div>

                            {!isPlanAvailable && (
                              <div className="mt-2 pl-2 border-l-2 border-red-300 dark:border-red-800">
                                <input
                                  type="text"
                                  value={planReason}
                                  onChange={(e) => handleReasonChange(planKey, e.target.value)}
                                  placeholder="Ej. Proveedor sin cupos"
                                  className="w-full px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-650 bg-white dark:bg-gray-800 dark:text-white"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
