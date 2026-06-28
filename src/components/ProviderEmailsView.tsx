import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, RefreshCw, AlertTriangle, CheckCircle,
  Zap, Play, X, Database, ExternalLink, Calendar, Phone, CheckSquare, Square,
  ChevronLeft, ChevronRight, Eye
} from 'lucide-react';

interface Subscription {
  id: number;
  customer_phone: string;
  streaming_platform: string;
  account_email: string;
  expiration_date: string | null;
  status: 'active' | 'expired' | 'cancelled';
  is_provider: number;
  provider_name: string | null;
  rpa_recipe_id: number | null;
  recipe_name: string | null;
  fullname: string | null;
  notes: string | null;
}

interface RpaRecipe {
  id: number;
  name: string;
  platform: string;
}

interface SyncResult {
  inserted: number;
  updated: number;
  skipped: number;
  total: number;
}

interface TestSidebarState {
  email: string;
  platform: string;
  recipeName: string;
  loading: boolean;
  success?: boolean;
  resultMessage?: string;
  screenshots?: string[];
  errorDetail?: string;
}

const getApiUrl = () =>
  window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';

const PLATFORM_COLORS: Record<string, string> = {
  disney: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
  netflix: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',
  spotify: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300',
  max: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
  youtube: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300',
  amazon: 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300',
};

const getPlatformColor = (platform: string) => {
  const key = Object.keys(PLATFORM_COLORS).find(k => platform.toLowerCase().includes(k));
  return key ? PLATFORM_COLORS[key] : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
};

export const ProviderEmailsView: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [recipes, setRecipes] = useState<RpaRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRecipe, setEditingRecipe] = useState<{ id: number; current: number | null } | null>(null);

  // Sidebar panel state for RPA testing (non-blocking!)
  const [sidebar, setSidebar] = useState<TestSidebarState | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkRecipeId, setBulkRecipeId] = useState<string>('');
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const fetchSubscriptions = useCallback(() => {
    setLoading(true);
    setError('');
    fetch(`${getApiUrl()}/api/admin/subscriptions?is_provider=1`)
      .then(r => r.json())
      .then(data => {
        setSubscriptions(Array.isArray(data.data) ? data.data : []);
        setLoading(false);
        setSelectedIds([]);
      })
      .catch(() => {
        setError('No se pudo conectar al backend.');
        setLoading(false);
      });
  }, []);

  const fetchRecipes = useCallback(() => {
    fetch(`${getApiUrl()}/api/admin/rpa/recipes`)
      .then(r => r.json())
      .then(data => setRecipes(Array.isArray(data) ? data : []))
      .catch(() => setRecipes([]));
  }, []);

  useEffect(() => {
    fetchSubscriptions();
    fetchRecipes();
  }, [fetchSubscriptions, fetchRecipes]);

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    setSuccess('');
    setSyncResult(null);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/subscriptions/sync-excel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'admin123' })
      });
      const result = await res.json();
      if (result.success) {
        setSyncResult({ inserted: result.inserted, updated: result.updated, skipped: result.skipped, total: result.total });
        setSuccess(`✅ Sincronización completada desde Excel.`);
        fetchSubscriptions();
      } else {
        setError(`❌ Error: ${result.error}`);
      }
    } catch (e: any) {
      setError(`❌ Error de conexión: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleSetRecipe = async (id: number, rpa_recipe_id: number | null) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/subscriptions/set-recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, rpa_recipe_id, password: 'admin123' })
      });
      const result = await res.json();
      if (result.success) {
        setSuccess('Receta vinculada correctamente.');
        setEditingRecipe(null);
        fetchSubscriptions();
      } else {
        setError(`❌ ${result.error}`);
      }
    } catch (e: any) {
      setError(`❌ Error: ${e.message}`);
    }
  };

  const handleBulkSetRecipe = async () => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/subscriptions/set-recipe-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          rpa_recipe_id: bulkRecipeId ? parseInt(bulkRecipeId) : null,
          password: 'admin123'
        })
      });
      const result = await res.json();
      if (result.success) {
        setSuccess(`✅ Se actualizó la receta para ${selectedIds.length} cuentas en lote.`);
        setSelectedIds([]);
        setBulkRecipeId('');
        fetchSubscriptions();
      } else {
        setError(`❌ Error en lote: ${result.error}`);
      }
    } catch (e: any) {
      setError(`❌ Error de conexión: ${e.message}`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Run recipe and populate non-blocking sidebar
  const handleTestRecipe = async (sub: Subscription) => {
    if (!sub.rpa_recipe_id) return;
    setSidebar({
      email: sub.account_email,
      platform: sub.streaming_platform,
      recipeName: sub.recipe_name || `Receta #${sub.rpa_recipe_id}`,
      loading: true,
      screenshots: []
    });
    setActiveImageIndex(0);

    try {
      const res = await fetch(`${getApiUrl()}/api/admin/rpa/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: sub.rpa_recipe_id,
          variables: { CUSTOMER_EMAIL: sub.account_email },
          password: 'admin123'
        })
      });
      const result = await res.json();
      
      if (result.success) {
        const code = Object.values(result.data || {}).find((v: any) => v && v.toString().trim().length >= 4);
        setSidebar(prev => prev ? {
          ...prev,
          loading: false,
          success: true,
          resultMessage: code ? `Código extraído con éxito: ${code}` : 'La automatización finalizó pero no detectó un código.',
          screenshots: result.screenshots || []
        } : null);
      } else {
        setSidebar(prev => prev ? {
          ...prev,
          loading: false,
          success: false,
          resultMessage: result.error || 'La receta falló en su ejecución.',
          screenshots: result.screenshots || []
        } : null);
      }
    } catch (e: any) {
      setSidebar(prev => prev ? {
        ...prev,
        loading: false,
        success: false,
        resultMessage: 'Error de red o timeout del proxy (Failed to fetch). Sin embargo, verifica si el navegador web del bot finalizó el flujo o revisa el estado del celular.',
        errorDetail: e.message
      } : null);
    }
  };

  const filtered = subscriptions.filter(s =>
    s.account_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.streaming_platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.fullname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.customer_phone.includes(searchTerm)
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(s => s.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative min-h-[85vh] pb-24">
      {/* Main content area */}
      <div className="flex-grow space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
                <Users className="text-brand-primary" /> Cuentas de Proveedores (Externas)
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Selecciona múltiples cuentas para asignar una automatización de proveedor. Prueba recetas individualmente en segundo plano.
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={fetchSubscriptions} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors" title="Refrescar lista">
                <RefreshCw className="w-5 h-5" />
              </button>
              <button onClick={handleSync} disabled={syncing} className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-dark text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60">
                <Database className={`w-4 h-4 ${syncing ? 'animate-pulse' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Sincronizar desde Excel'}
              </button>
            </div>
          </div>

          {syncResult && (
            <div className="mt-4 p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-xl text-sm flex flex-wrap gap-4 animate-fadeIn">
              <span className="font-bold text-brand-primary">✅ Sync completo</span>
              <span className="text-gray-600 dark:text-gray-300">📥 {syncResult.inserted} nuevas</span>
              <span className="text-gray-600 dark:text-gray-300">🔄 {syncResult.updated} actualizadas</span>
              <span className="text-gray-600 dark:text-gray-300">⏭ {syncResult.skipped} omitidas</span>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-3 rounded-xl border border-red-200 dark:border-red-900/50">
              <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" /><p className="text-sm">{error}</p>
            </div>
          )}
          {success && !syncResult && (
            <div className="mt-4 flex items-center bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-3 rounded-xl border border-green-200 dark:border-green-900/50">
              <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" /><p className="text-sm">{success}</p>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="relative flex-grow max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por correo, plataforma, cliente..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm w-full"
              />
            </div>
            <span className="text-sm text-gray-400 font-medium">
              {selectedIds.length > 0 ? `${selectedIds.length} seleccionados de ` : ''} {filtered.length} cuentas
            </span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400">
              <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Cargando cuentas...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-750">
              <Database className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h3 className="font-bold text-gray-700 dark:text-gray-300">Sin cuentas de proveedores</h3>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-150 dark:border-gray-750">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 text-left">
                    <th className="px-4 py-3 w-10 text-center">
                      <button onClick={toggleSelectAll} className="text-gray-500 hover:text-brand-primary transition-colors">
                        {selectedIds.length === filtered.length ? (
                          <CheckSquare className="w-5 h-5 text-brand-primary" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Correo / Clientes</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Plataforma</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Vencimiento</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Receta RPA</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-750">
                  {filtered.map(sub => {
                    const isEditing = editingRecipe?.id === sub.id;
                    const isSelected = selectedIds.includes(sub.id);
                    return (
                      <tr key={sub.id} className={`hover:bg-gray-50/80 dark:hover:bg-gray-750/30 transition-colors ${isSelected ? 'bg-brand-primary/5 dark:bg-brand-primary/10' : ''}`}>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => toggleSelectOne(sub.id)} className="text-gray-500 hover:text-brand-primary transition-colors">
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-brand-primary" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800 dark:text-gray-100 text-xs font-mono">{sub.account_email}</div>
                          {sub.fullname && (
                            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-gray-400">
                              <Phone className="w-2.5 h-2.5" /> {sub.customer_phone} · {sub.fullname}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${getPlatformColor(sub.streaming_platform)}`}>
                            {sub.streaming_platform}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">
                          {sub.expiration_date ? new Date(sub.expiration_date).toLocaleDateString('es-CO') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <select
                                defaultValue={editingRecipe.current ?? ''}
                                onChange={e => handleSetRecipe(sub.id, e.target.value ? parseInt(e.target.value) : null)}
                                className="text-xs px-2 py-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                autoFocus
                              >
                                <option value="">Sin receta (manual)</option>
                                {recipes.map(r => (
                                  <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                              </select>
                              <button onClick={() => setEditingRecipe(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : sub.recipe_name ? (
                            <button
                              onClick={() => setEditingRecipe({ id: sub.id, current: sub.rpa_recipe_id })}
                              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/30 hover:opacity-80 transition-opacity"
                            >
                              <Zap className="w-2.5 h-2.5" /> {sub.recipe_name}
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingRecipe({ id: sub.id, current: null })}
                              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-650 transition-colors"
                            >
                              <ExternalLink className="w-2.5 h-2.5" /> Asignar receta
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {sub.rpa_recipe_id && (
                            <button
                              onClick={() => handleTestRecipe(sub)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-all"
                              title="Probar receta"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* NON-BLOCKING DEBUG PANEL (RIGHT SIDEBAR) */}
      {sidebar && (
        <div className="w-full lg:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border dark:border-gray-700 p-5 flex flex-col flex-shrink-0 animate-fadeIn h-fit max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b dark:border-gray-700 pb-3 mb-4">
            <h3 className="font-bold text-sm dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-500" /> Monitoreo y Debug RPA
            </h3>
            <button onClick={() => setSidebar(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Account Metadata */}
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-gray-400">Cuenta:</span><span className="font-mono font-bold dark:text-gray-200">{sidebar.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Plataforma:</span><span className="font-bold uppercase dark:text-gray-200">{sidebar.platform}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Receta:</span><span className="text-gray-500 dark:text-gray-300">{sidebar.recipeName}</span></div>
            </div>

            {/* Status / Output Section */}
            {sidebar.loading ? (
              <div className="p-4 border border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-3 dark:border-gray-700">
                <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                <div className="text-xs text-gray-500">Ejecutando navegador en el servidor...<br />(Normalmente demora 30-45 seg)</div>
              </div>
            ) : (
              <div className={`p-4 rounded-xl text-xs space-y-2 border ${sidebar.success ? 'bg-green-50/55 dark:bg-green-950/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-900/30' : 'bg-red-50/50 dark:bg-red-950/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-900/30'}`}>
                <div className="font-bold text-sm flex items-center gap-1.5">
                  {sidebar.success ? '✅ Completado' : '❌ Falló la Ejecución'}
                </div>
                <p className="font-medium whitespace-pre-wrap">{sidebar.resultMessage}</p>
                {sidebar.errorDetail && (
                  <p className="mt-1 text-[10px] font-mono opacity-80 border-t pt-1.5 dark:border-red-900/20">{sidebar.errorDetail}</p>
                )}
              </div>
            )}

            {/* SCREENSHOTS CAROUSEL (DEBUG) */}
            {sidebar.screenshots && sidebar.screenshots.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-gray-400" /> Historial de Pantalla ({sidebar.screenshots.length} pasos)
                </div>

                <div className="relative group border dark:border-gray-700 rounded-xl overflow-hidden bg-black flex items-center justify-center h-48">
                  <img
                    src={sidebar.screenshots[activeImageIndex]}
                    alt={`Paso de automatización ${activeImageIndex + 1}`}
                    className="max-h-full max-w-full object-contain"
                  />
                  
                  {/* Prev / Next buttons */}
                  {sidebar.screenshots.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImageIndex(prev => (prev === 0 ? sidebar.screenshots!.length - 1 : prev - 1))}
                        className="absolute left-2 p-1.5 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setActiveImageIndex(prev => (prev === sidebar.screenshots!.length - 1 ? 0 : prev + 1))}
                        className="absolute right-2 p-1.5 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  
                  {/* Index badge */}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/75 text-white text-[10px] font-bold rounded-md">
                    Paso {activeImageIndex + 1} de {sidebar.screenshots.length}
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 italic text-center">
                  Usa las flechas para navegar en la secuencia de ejecución del navegador del Bot.
                </p>
              </div>
            ) : !sidebar.loading && (
              <div className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-xl text-center text-xs text-gray-400">
                No hay capturas de pantalla de debug disponibles para esta ejecución.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Bar for Bulk operations */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-white dark:bg-gray-800 shadow-2xl border dark:border-gray-700 rounded-2xl px-6 py-4 flex items-center justify-between gap-6 max-w-xl w-full mx-4 animate-fadeIn border-brand-primary/20">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-800 dark:text-white">
              {selectedIds.length} seleccionados
            </span>
            <span className="text-[11px] text-gray-400">
              Aplicar automatización en lote
            </span>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={bulkRecipeId}
              onChange={e => setBulkRecipeId(e.target.value)}
              className="text-xs px-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Quitar receta (manual)</option>
              {recipes.map(r => (
                <option key={r.id} value={r.id}>{r.name} [{r.platform}]</option>
              ))}
            </select>
            <button
              onClick={handleBulkSetRecipe}
              disabled={bulkActionLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {bulkActionLoading ? 'Aplicando...' : 'Aplicar'}
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
              title="Cancelar selección"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
