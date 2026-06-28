import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, RefreshCw, AlertTriangle, CheckCircle,
  Zap, Play, X, Database, ExternalLink, Calendar, Phone, CheckSquare, Square,
  ChevronLeft, ChevronRight, Eye, Tag, Edit3
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
  activeImageIndex?: number;
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
  
  // Inline edit state
  const [editingRecipe, setEditingRecipe] = useState<{ id: number; current: number | null } | null>(null);
  const [editingProvider, setEditingProvider] = useState<{ id: number; current: string } | null>(null);

  // Multiple active RPA runs indexed by email
  const [runs, setRuns] = useState<Record<string, TestSidebarState>>({});
  const [selectedRunEmail, setSelectedRunEmail] = useState<string | null>(null);

  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkRecipeId, setBulkRecipeId] = useState<string>('');
  const [bulkProviderName, setBulkProviderName] = useState<string>('');
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

  const handleSetProviderName = async (id: number, provider_name: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/subscriptions/set-provider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, provider_name, password: 'admin123' })
      });
      const result = await res.json();
      if (result.success) {
        setSuccess('Proveedor actualizado correctamente.');
        setEditingProvider(null);
        fetchSubscriptions();
      } else {
        setError(`❌ ${result.error}`);
      }
    } catch (e: any) {
      setError(`❌ Error: ${e.message}`);
    }
  };

  const handleBulkSetRecipeAndProvider = async () => {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    setError('');
    setSuccess('');
    try {
      // 1. Bulk Recipe if specified
      if (bulkRecipeId !== undefined) {
        await fetch(`${getApiUrl()}/api/admin/subscriptions/set-recipe-bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ids: selectedIds,
            rpa_recipe_id: bulkRecipeId ? parseInt(bulkRecipeId) : null,
            password: 'admin123'
          })
        });
      }

      // 2. Bulk Provider name if typed
      if (bulkProviderName.trim()) {
        await fetch(`${getApiUrl()}/api/admin/subscriptions/set-provider-bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ids: selectedIds,
            provider_name: bulkProviderName.trim(),
            password: 'admin123'
          })
        });
      }

      setSuccess(`✅ Se actualizaron las cuentas en lote (${selectedIds.length} modificadas).`);
      setSelectedIds([]);
      setBulkRecipeId('');
      setBulkProviderName('');
      fetchSubscriptions();
    } catch (e: any) {
      setError(`❌ Error de conexión en lote: ${e.message}`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleTestRecipe = async (sub: Subscription) => {
    if (!sub.rpa_recipe_id) return;
    const email = sub.account_email;

    setRuns(prev => ({
      ...prev,
      [email]: {
        email,
        platform: sub.streaming_platform,
        recipeName: sub.recipe_name || `Receta #${sub.rpa_recipe_id}`,
        loading: true,
        screenshots: [],
        activeImageIndex: 0
      }
    }));
    setSelectedRunEmail(email);

    try {
      const res = await fetch(`${getApiUrl()}/api/admin/rpa/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: sub.rpa_recipe_id,
          variables: { CUSTOMER_EMAIL: email },
          password: 'admin123'
        })
      });
      const result = await res.json();

      setRuns(prev => {
        if (!prev[email]) return prev;
        return {
          ...prev,
          [email]: {
            ...prev[email],
            loading: false,
            success: result.success,
            resultMessage: result.success
              ? (Object.values(result.data || {}).find((v: any) => v && v.toString().trim().length >= 4)
                  ? `Código extraído con éxito: ${Object.values(result.data).find((v: any) => v && v.toString().trim().length >= 4)}`
                  : 'Automatización completada pero no se pudo leer el código en pantalla.')
              : (result.error || 'La receta falló en su ejecución.'),
            screenshots: result.screenshots || [],
            activeImageIndex: 0
          }
        };
      });
    } catch (e: any) {
      setRuns(prev => {
        if (!prev[email]) return prev;
        return {
          ...prev,
          [email]: {
            ...prev[email],
            loading: false,
            success: false,
            resultMessage: 'Error de red o timeout. Sin embargo, puede que el bot siga ejecutándolo en el servidor.',
            errorDetail: e.message,
            screenshots: []
          }
        };
      });
    }
  };

  const removeRun = (email: string) => {
    setRuns(prev => {
      const copy = { ...prev };
      delete copy[email];
      return copy;
    });
    if (selectedRunEmail === email) {
      const remaining = Object.keys(runs).filter(e => e !== email);
      setSelectedRunEmail(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const filtered = subscriptions.filter(s =>
    s.account_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.streaming_platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.provider_name || '').toLowerCase().includes(searchTerm.toLowerCase())
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

  const activeRunList = Object.keys(runs);
  const currentRun = selectedRunEmail ? runs[selectedRunEmail] : null;

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative min-h-[85vh] pb-24">
      {/* Main Table */}
      <div className="flex-grow space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
                <Users className="text-brand-primary" /> Cuentas de Proveedores (Externas)
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Clasifica por proveedor y asocia recetas RPA en lote para automatizar la extracción de códigos.
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
                placeholder="Buscar por correo, proveedor, servicio..."
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
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Correo de la Cuenta</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Plataforma</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Proveedor</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Receta RPA</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-750">
                  {filtered.map(sub => {
                    const isEditingR = editingRecipe?.id === sub.id;
                    const isEditingP = editingProvider?.id === sub.id;
                    const isSelected = selectedIds.includes(sub.id);
                    const isRunning = runs[sub.account_email]?.loading;
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
                          <div className="font-semibold text-gray-800 dark:text-gray-100 text-xs font-mono">{sub.account_email}</div>
                          {sub.fullname && (
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              Asociado a: {sub.fullname.split(',')[0]}...
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${getPlatformColor(sub.streaming_platform)}`}>
                            {sub.streaming_platform}
                          </span>
                        </td>
                        {/* COLUMN: PROVIDER */}
                        <td className="px-4 py-3">
                          {isEditingP ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                defaultValue={editingProvider.current}
                                onBlur={e => handleSetProviderName(sub.id, e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSetProviderName(sub.id, e.currentTarget.value);
                                  if (e.key === 'Escape') setEditingProvider(null);
                                }}
                                className="text-xs px-2 py-0.5 border rounded-md dark:bg-gray-700 dark:text-white max-w-[120px]"
                                autoFocus
                              />
                            </div>
                          ) : sub.provider_name ? (
                            <div className="flex items-center gap-1.5 group">
                              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-750 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                                <Tag className="w-3 h-3 text-brand-primary" /> {sub.provider_name}
                              </span>
                              <button
                                onClick={() => setEditingProvider({ id: sub.id, current: sub.provider_name || '' })}
                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingProvider({ id: sub.id, current: '' })}
                              className="text-[11px] px-2 py-0.5 rounded-md border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex items-center gap-1"
                            >
                              + Asignar Proveedor
                            </button>
                          )}
                        </td>
                        {/* COLUMN: RECIPE */}
                        <td className="px-4 py-3">
                          {isEditingR ? (
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
                              disabled={isRunning}
                              className={`p-1.5 rounded-lg transition-all ${isRunning ? 'text-gray-400 bg-gray-100 dark:bg-gray-800' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'}`}
                              title={isRunning ? 'Ejecutando...' : 'Probar receta'}
                            >
                              {isRunning ? (
                                <div className="w-3.5 h-3.5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Play className="w-3.5 h-3.5" />
                              )}
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

      {/* MULTIPLE RUNS DEBUG SIDEBAR PANEL */}
      {activeRunList.length > 0 && (
        <div className="w-full lg:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border dark:border-gray-700 p-5 flex flex-col flex-shrink-0 animate-fadeIn h-fit max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b dark:border-gray-700 pb-3 mb-3">
            <h3 className="font-bold text-sm dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-500" /> Monitoreo RPA ({activeRunList.length})
            </h3>
            <button onClick={() => { setRuns({}); setSelectedRunEmail(null); }} className="text-xs text-red-500 hover:underline">
              Cerrar todos
            </button>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-2 mb-4 border-b dark:border-gray-750 scrollbar-thin">
            {activeRunList.map(email => {
              const run = runs[email];
              const isSelected = selectedRunEmail === email;
              return (
                <div
                  key={email}
                  onClick={() => setSelectedRunEmail(email)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap transition-colors ${isSelected ? 'bg-brand-primary text-white' : 'bg-gray-50 dark:bg-gray-900 text-gray-500 hover:bg-gray-100'}`}
                >
                  {run.loading && <div className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin" />}
                  <span className="max-w-[100px] truncate">{email.split('@')[0]}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeRun(email); }}
                    className="hover:bg-black/10 dark:hover:bg-white/10 p-0.5 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {currentRun && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl space-y-1.5 text-xs border dark:border-gray-750">
                <div className="flex justify-between"><span className="text-gray-400">Cuenta:</span><span className="font-mono font-bold dark:text-gray-200">{currentRun.email}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Plataforma:</span><span className="font-bold uppercase dark:text-gray-200">{currentRun.platform}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Receta:</span><span className="text-gray-500 dark:text-gray-300">{currentRun.recipeName}</span></div>
              </div>

              {currentRun.loading ? (
                <div className="p-4 border border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-3 dark:border-gray-700">
                  <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                  <div className="text-xs text-gray-500 font-medium">Ejecutando navegador en el servidor...<br />(Normalmente demora 30-45 seg)</div>
                </div>
              ) : (
                <div className={`p-4 rounded-xl text-xs space-y-2 border ${currentRun.success ? 'bg-green-50/55 dark:bg-green-950/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-900/30' : 'bg-red-50/50 dark:bg-red-950/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-900/30'}`}>
                  <div className="font-bold text-sm">
                    {currentRun.success ? '✅ Completado con Éxito' : '❌ Falló la Ejecución'}
                  </div>
                  <p className="font-medium whitespace-pre-wrap">{currentRun.resultMessage}</p>
                  {currentRun.errorDetail && (
                    <p className="mt-1 text-[10px] font-mono opacity-80 border-t pt-1.5 dark:border-red-900/20">{currentRun.errorDetail}</p>
                  )}
                </div>
              )}

              {currentRun.screenshots && currentRun.screenshots.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-gray-400" /> Secuencia del Navegador ({currentRun.screenshots.length} capturas)
                  </div>

                  <div className="relative group border dark:border-gray-700 rounded-xl overflow-hidden bg-black flex items-center justify-center h-48">
                    <img
                      src={currentRun.screenshots[currentRun.activeImageIndex || 0]}
                      alt="Paso de automatización"
                      className="max-h-full max-w-full object-contain"
                    />

                    {currentRun.screenshots.length > 1 && (
                      <>
                        <button
                          onClick={() => {
                            const max = currentRun.screenshots!.length;
                            setRuns(prev => ({
                              ...prev,
                              [currentRun.email]: {
                                ...prev[currentRun.email],
                                activeImageIndex: ((prev[currentRun.email].activeImageIndex || 0) === 0 ? max - 1 : (prev[currentRun.email].activeImageIndex || 0) - 1)
                              }
                            }));
                          }}
                          className="absolute left-2 p-1.5 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const max = currentRun.screenshots!.length;
                            setRuns(prev => ({
                              ...prev,
                              [currentRun.email]: {
                                ...prev[currentRun.email],
                                activeImageIndex: ((prev[currentRun.email].activeImageIndex || 0) === max - 1 ? 0 : (prev[currentRun.email].activeImageIndex || 0) + 1)
                              }
                            }));
                          }}
                          className="absolute right-2 p-1.5 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/75 text-white text-[10px] font-bold rounded-md">
                      Paso {(currentRun.activeImageIndex || 0) + 1} de {currentRun.screenshots.length}
                    </div>
                  </div>
                </div>
              ) : !currentRun.loading && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-xl text-center text-xs text-gray-400">
                  No hay capturas de pantalla de debug disponibles para esta ejecución.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating Action Bar for Bulk operations */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-white dark:bg-gray-800 shadow-2xl border dark:border-gray-700 rounded-2xl px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-2xl w-full mx-4 animate-fadeIn border-brand-primary/20">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-800 dark:text-white">
              {selectedIds.length} seleccionados
            </span>
            <span className="text-[11px] text-gray-400">
              Configura automatización y proveedor en lote
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Bulk Provider Input */}
            <input
              type="text"
              placeholder="Nombre Proveedor (Ej: Spotinet)"
              value={bulkProviderName}
              onChange={e => setBulkProviderName(e.target.value)}
              className="text-xs px-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white max-w-[150px]"
            />

            {/* Bulk Recipe Select */}
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
              onClick={handleBulkSetRecipeAndProvider}
              disabled={bulkActionLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {bulkActionLoading ? 'Aplicando...' : 'Aplicar'}
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
