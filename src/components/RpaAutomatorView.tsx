import React, { useState, useEffect } from 'react';
import { Play, Upload, Code, HelpCircle, Save, CheckCircle, AlertTriangle, FileText, Settings2, Trash2, RefreshCw, Key, Plus } from 'lucide-react';
import { isDemoMode, DEMO_RPA_BOTS } from '../utils/demoMode';

interface RpaStep {
  action: string;
  url?: string;
  selector?: string;
  value?: string;
  save_as?: string;
  description?: string;
  timeout?: string;
}

interface RpaRecipe {
  id?: number;
  name: string;
  platform: string;
  recipeJson: {
    name: string;
    platform: string;
    steps: RpaStep[];
  };
  createdAt?: string;
}

export default function RpaAutomatorView() {
  const [recipes, setRecipes] = useState<RpaRecipe[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [currentRecipe, setCurrentRecipe] = useState<Partial<RpaRecipe> | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Provider credentials form state
  const [providerForm, setProviderForm] = useState({ id: null as number | null, platform: '', providerName: '', username: '', password: '', phone: '' });
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);

  // Dynamic inputs for running the recipe
  const [testEmail, setTestEmail] = useState('cliente_prueba@gmail.com');
  const [runResult, setRunResult] = useState<any>(null);

  const handleStepChange = (stepIdx: number, field: keyof RpaStep, value: string) => {
    if (!currentRecipe || !currentRecipe.recipeJson) return;
    
    setCurrentRecipe(prev => {
      if (!prev) return prev;
      
      let json = prev.recipeJson;
      if (typeof json === 'string') {
        try {
          json = JSON.parse(json);
        } catch (e) {
          return prev;
        }
      }
      
      let steps = Array.isArray(json) ? [...json] : (json.steps ? [...json.steps] : []);
      steps = steps.map((s, idx) => {
        if (idx === stepIdx) {
          return { ...s, [field]: value };
        }
        return s;
      });
      
      const newJson = Array.isArray(json) ? steps : { ...json, steps };
      return {
        ...prev,
        recipeJson: newJson as any
      };
    });
  };

  const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:3000'
    : window.location.origin;

  useEffect(() => {
    fetchRecipes();
    fetchProviders();
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    setError(null);
    if (isDemoMode()) {
      setRecipes([
        {
          id: 1,
          name: 'Bot Auto-Entrega Netflix (Demo)',
          platform: 'Netflix Ultra HD',
          recipeJson: {
            name: 'Auto-Entrega Netflix (Demo)',
            platform: 'Netflix Ultra HD',
            steps: [
              { action: 'navigate', url: 'https://netflix.com/login', description: 'Abrir portal Netflix Demo' },
              { action: 'type', selector: '#id_userLoginId', value: 'demo.netflix@sheerit.com', description: 'Ingresar correo demo' },
              { action: 'click', selector: '.btn-submit', description: 'Iniciar sesión automatizada' }
            ]
          }
        },
        {
          id: 2,
          name: 'Bot Verificador Nequi (Demo)',
          platform: 'Nequi',
          recipeJson: {
            name: 'Verificador Nequi (Demo)',
            platform: 'Nequi',
            steps: [
              { action: 'navigate', url: 'https://nequi.com/banca-personas', description: 'Conectar API Nequi' }
            ]
          }
        }
      ]);
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/admin/rpa/list`);
      if (!response.ok) throw new Error('Error al obtener el listado de recetas');
      const data = await response.json();
      setRecipes(data);
    } catch (err: any) {
      setError(err.message || 'Fallo de conexión al cargar recetas');
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    if (isDemoMode()) {
      setProviders([
        { id: 101, platform: 'Netflix', providerName: 'Proveedor Demo 1', username: 'proveedor.demo1@sheerit.com', phone: '+57 300 *** 1234' },
        { id: 102, platform: 'Disney+', providerName: 'Proveedor Demo 2', username: 'proveedor.demo2@sheerit.com', phone: '+57 310 *** 5678' }
      ]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/admin/rpa/providers`);
      if (response.ok) {
        const data = await response.json();
        setProviders(data);
      }
    } catch (e: any) {
      console.error('Error fetching providers:', e.message);
    }
  };

  const handleUploadScribePdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) return;

    setImporting(true);
    setError(null);
    setSuccess(null);
    setRunResult(null);

    const formData = new FormData();
    formData.append('pdf', pdfFile);
    formData.append('password', password);

    try {
      const response = await fetch(`${API_BASE}/api/admin/rpa/import-scribe`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al procesar el PDF de Scribe');
      }

      let recipeData = data.recipe;
      if (typeof recipeData === 'string') {
        try {
          recipeData = JSON.parse(recipeData);
        } catch (err) {}
      }

      if (!recipeData) {
        throw new Error('El análisis de Gemini no devolvió datos estructurados legibles.');
      }

      setCurrentRecipe({
        name: recipeData.name || 'Nueva Receta Importada',
        platform: recipeData.platform || 'desconocida',
        recipeJson: recipeData,
      });

      setSuccess('PDF de Scribe importado y analizado con éxito por Gemini. Revisa los pasos generados abajo.');
    } catch (err: any) {
      setError(err.message || 'Error al subir el archivo');
    } finally {
      setImporting(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!currentRecipe || !currentRecipe.recipeJson) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/rpa/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentRecipe.id,
          name: currentRecipe.name,
          platform: currentRecipe.platform,
          recipeJson: currentRecipe.recipeJson,
          password
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al guardar la receta en la base de datos');
      }

      setSuccess('Receta de automatización guardada correctamente en MariaDB.');
      fetchRecipes();
    } catch (err: any) {
      setError(err.message || 'Error de red');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProvider(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/rpa/providers/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...providerForm,
          adminPassword: password
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al guardar credenciales de proveedor');
      }

      setSuccess('Credenciales de proveedor guardadas con éxito.');
      setProviderForm({ id: null, platform: '', providerName: '', username: '', password: '', phone: '' });
      setShowProviderForm(false);
      fetchProviders();
    } catch (err: any) {
      setError(err.message || 'Error de red al guardar proveedor');
    } finally {
      setSavingProvider(false);
    }
  };

  const handleDeleteProvider = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar estas credenciales de proveedor?')) return;
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/rpa/providers/${id}?password=${password}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al eliminar credenciales');
      }

      setSuccess('Credenciales de proveedor eliminadas.');
      fetchProviders();
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
    }
  };

  const handleDeleteRecipe = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta receta de automatización?')) return;
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/rpa/delete/${id}?password=${password}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al eliminar la receta');
      }

      setSuccess('Receta de automatización eliminada con éxito.');
      if (currentRecipe?.id === id) {
        setCurrentRecipe(null);
      }
      fetchRecipes();
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
    }
  };

  const handleRunTest = async (recipeId: number) => {
    setRunning(true);
    setError(null);
    setSuccess(null);
    setRunResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/admin/rpa/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId,
          variables: {
            CUSTOMER_EMAIL: testEmail,
          },
          password
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error en la ejecución del navegador');
      }

      setRunResult(data);
      if (data.success) {
        setSuccess('Ejecución finalizada con éxito. Datos extraídos.');
      } else {
        setError(`La receta falló durante la navegación: ${data.error}`);
      }
    } catch (err: any) {
      setError(err.message || 'Error de ejecución');
    } finally {
      setRunning(false);
    }
  };

  const getRecipeSteps = (): RpaStep[] => {
    if (!currentRecipe || !currentRecipe.recipeJson) return [];
    let json = currentRecipe.recipeJson;
    if (typeof json === 'string') {
      try {
        json = JSON.parse(json);
      } catch (e) {
        return [];
      }
    }
    if (json && typeof json === 'object') {
      if (Array.isArray((json as any).steps)) {
        return (json as any).steps;
      }
      if (Array.isArray(json)) {
        return json;
      }
    }
    return [];
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 text-slate-800 dark:text-white">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            🤖 Automatizador <span className="text-indigo-600 dark:text-indigo-400">RPA (Scribe & Puppeteer)</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Importa PDFs de Scribe con IA de Gemini para generar scripts Puppeteer autoejecutables de proveedores.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left sidebar: Import, Recipes, Providers (1 col) */}
        <div className="space-y-6">
          {/* Uploader Card */}
          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-1.5">
              <Upload size={16} className="text-indigo-600 dark:text-indigo-400" /> Importar de Scribe
            </h3>
            
            <form onSubmit={handleUploadScribePdf} className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 rounded-xl p-4 text-center cursor-pointer transition-colors relative group">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <FileText className="mx-auto text-slate-450 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors" size={32} />
                  <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    {pdfFile ? pdfFile.name : 'Haz clic o arrastra un PDF de Scribe'}
                  </span>
                  <span className="block text-[10px] text-slate-400">Solo archivos .pdf</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Contraseña de Administrador
                </label>
                <input
                  type="password"
                  placeholder="admin123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500/50 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={importing || !pdfFile}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Procesando con Gemini...
                  </>
                ) : (
                  <>
                    <Code size={14} /> Analizar PDF e Importar
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Test Runner Controls */}
          {recipes.length > 0 && (
            <div className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-1.5">
                <Settings2 size={16} className="text-indigo-600 dark:text-indigo-400" /> Recetas de Automatización
              </h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Email de Prueba (`{"{{CUSTOMER_EMAIL}}"}`)
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500/50 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Selecciona una Receta para Editar / Probar
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {recipes.map((rec) => (
                      <div
                        key={rec.id}
                        onClick={() => {
                          setCurrentRecipe(rec);
                          setSuccess(null);
                          setError(null);
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                          currentRecipe?.id === rec.id
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-500/50'
                            : 'bg-slate-50/60 dark:bg-slate-950/60 border-slate-200 dark:border-slate-850 hover:border-slate-450 dark:hover:border-slate-700'
                        }`}
                      >
                        <span className="truncate font-medium text-slate-700 dark:text-slate-300 max-w-[130px]" title={rec.name}>
                          {rec.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              rec.id && handleRunTest(rec.id);
                            }}
                            disabled={running}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-650 hover:bg-emerald-600 text-white rounded-md text-[10px] font-semibold transition-colors disabled:opacity-40"
                          >
                            <Play size={10} /> Test
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              rec.id && handleDeleteRecipe(rec.id);
                            }}
                            disabled={running}
                            className="p-1 text-red-500 hover:bg-red-950/20 hover:text-red-300 rounded-md transition-colors disabled:opacity-40"
                            title="Eliminar Receta"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Provider Credentials Management Card */}
          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Key size={16} className="text-indigo-600 dark:text-indigo-400" /> Credenciales Proveedores
              </h3>
              <button
                type="button"
                onClick={() => {
                  setProviderForm({ id: null, platform: '', providerName: '', username: '', password: '' });
                  setShowProviderForm(!showProviderForm);
                }}
                className="p-1 hover:bg-indigo-50 dark:hover:bg-indigo-550/10 rounded-lg text-indigo-650 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                title="Agregar proveedor"
              >
                <Plus size={16} />
              </button>
            </div>

            {showProviderForm ? (
              <form onSubmit={handleSaveProvider} className="space-y-3 bg-slate-50 dark:bg-slate-950/45 p-4 rounded-xl border border-slate-200 dark:border-slate-850 animate-fadeIn">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  {providerForm.id ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </p>
                <div className="space-y-2 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="Plataforma (ej: netflix, disney)"
                    value={providerForm.platform}
                    onChange={(e) => setProviderForm(prev => ({ ...prev, platform: e.target.value.toLowerCase().trim() }))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-3 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500/50"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Nombre Proveedor (ej: NetPremium)"
                    value={providerForm.providerName}
                    onChange={(e) => setProviderForm(prev => ({ ...prev, providerName: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-3 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500/50"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Usuario / Correo de Acceso"
                    value={providerForm.username}
                    onChange={(e) => setProviderForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-3 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500/50"
                  />
                  <input
                    type="password"
                    required
                    placeholder="Contraseña"
                    value={providerForm.password}
                    onChange={(e) => setProviderForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-3 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div className="flex gap-2 justify-end text-[10px]">
                  <button
                    type="button"
                    onClick={() => setShowProviderForm(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingProvider}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg font-bold flex items-center gap-1"
                  >
                    {savingProvider ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {providers.length === 0 ? (
                  <p className="text-[10px] text-slate-500 text-center py-2">No hay proveedores guardados.</p>
                ) : (
                  providers.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850/80 text-[11px] space-y-1.5 relative group/prov"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 dark:text-slate-200 capitalize">{p.providerName}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 font-bold uppercase tracking-wider">
                          {p.platform}
                        </span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 font-mono text-[10px] truncate">
                        Usr: {p.username}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setProviderForm({
                              id: p.id,
                              platform: p.platform,
                              providerName: p.providerName,
                              username: p.username,
                              password: p.password
                            });
                            setShowProviderForm(true);
                          }}
                          className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProvider(p.id)}
                          className="text-[10px] text-rose-600 dark:text-rose-450 hover:underline font-semibold"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Editor & Results (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Notifications */}
          {(error || success) && (
            <div className="space-y-3">
              {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-650 dark:text-rose-400 text-xs shadow-sm">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Ocurrió un inconveniente</p>
                    <p className="text-rose-600 dark:text-rose-450/90 mt-0.5">{error}</p>
                  </div>
                </div>
              )}
              {success && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-650 dark:text-emerald-400 text-xs shadow-sm">
                  <CheckCircle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Éxito en la Operación</p>
                    <p className="text-emerald-600 dark:text-emerald-400/90 mt-0.5">{success}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Test results */}
          {runResult && (
            <div className={`bg-white dark:bg-slate-900/50 p-6 rounded-2xl border space-y-4 shadow-sm ${
              runResult.success ? 'border-emerald-200 dark:border-emerald-500/20' : 'border-rose-200 dark:border-rose-500/20'
            }`}>
              <div className="flex justify-between items-center">
                <h4 className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                  runResult.success ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  📊 Resultados de Ejecución Puppeteer (RPA)
                </h4>
                <button
                  onClick={() => setRunResult(null)}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-750 transition-colors"
                >
                  Cerrar
                </button>
              </div>
              
              {!runResult.success && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-650 dark:text-rose-300 text-xs font-semibold">
                  Error: {runResult.error || 'Falla de navegación o carga en la receta'}
                </div>
              )}

              {runResult.success && runResult.data && (
                <pre className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl text-xs text-slate-850 dark:text-slate-300 font-mono overflow-x-auto border border-slate-200 dark:border-slate-800">
                  {JSON.stringify(runResult.data, null, 2)}
                </pre>
              )}

              {/* Failure Screenshot */}
              {runResult.failureScreenshot && (
                <div className="space-y-2">
                  <span className="text-[10px] text-rose-550 dark:text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    🚨 Pantalla del Fallo (Último estado del navegador):
                  </span>
                  <div className="overflow-hidden rounded-xl border border-rose-200 dark:border-rose-500/30 max-w-2xl bg-slate-950">
                    <img 
                      src={runResult.failureScreenshot} 
                      alt="Captura del Fallo" 
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Step-by-Step Screenshots */}
              {runResult.screenshots && runResult.screenshots.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    📸 Secuencia de Pantallas (Paso a Paso):
                  </span>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-850">
                    {runResult.screenshots.map((shot: any, sIdx: number) => (
                      <div key={sIdx} className="flex-shrink-0 w-64 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 p-2.5 space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-450">
                          <span>Paso {shot.step} ({shot.action})</span>
                        </div>
                        <div className="relative aspect-video bg-slate-200 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-800">
                          <img 
                            src={shot.img} 
                            alt={`Paso ${shot.step}`}
                            className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => {
                              const w = window.open();
                              if (w) w.document.write(`<img src="${shot.img}" style="max-width:100%; height:auto;" />`);
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 truncate" title={shot.description}>
                          {shot.description || 'Ejecutando paso...'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recipe step builder */}
          {currentRecipe ? (
            <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm animate-fadeIn">
              <div className="bg-slate-50 dark:bg-slate-900/80 px-6 py-4 border-b border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <input
                    type="text"
                    value={currentRecipe.name || ''}
                    onChange={(e) => setCurrentRecipe(prev => {
                      if (!prev) return null;
                      const newJson = prev.recipeJson ? { ...prev.recipeJson, name: e.target.value } : { name: e.target.value, platform: prev.platform || '', steps: [] };
                      return { ...prev, name: e.target.value, recipeJson: newJson as any };
                    })}
                    className="bg-transparent border-b border-slate-300 dark:border-slate-800 hover:border-slate-400 focus:border-indigo-500 focus:outline-none font-bold text-lg text-slate-900 dark:text-white pb-0.5 px-1 max-w-sm"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plataforma:</span>
                    <input
                      type="text"
                      value={currentRecipe.platform || ''}
                      onChange={(e) => setCurrentRecipe(prev => {
                        if (!prev) return null;
                        const newJson = prev.recipeJson ? { ...prev.recipeJson, platform: e.target.value } : { name: prev.name || '', platform: e.target.value, steps: [] };
                        return { ...prev, platform: e.target.value, recipeJson: newJson as any };
                      })}
                      className="bg-transparent border-b border-slate-300 dark:border-slate-800 focus:outline-none text-xs text-indigo-650 dark:text-indigo-400 font-semibold px-1 w-24"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveRecipe}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/10 transition-colors text-white"
                >
                  <Save size={14} /> Guardar Receta
                </button>
              </div>

              {/* Steps List */}
              <div className="p-6 space-y-4">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Listado de Pasos Analizados
                </h4>

                <div className="space-y-3">
                  {getRecipeSteps().map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-800 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-2 flex-grow">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 font-bold font-mono">
                            Paso {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                            {step.action}
                          </span>
                        </div>
                        <p className="text-slate-550 dark:text-slate-400 text-xs">
                          {step.description || 'Sin descripción.'}
                        </p>
                        
                        {/* Selector / Value Details (Editable) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-slate-500 font-semibold">Descripción del paso:</label>
                            <input
                              type="text"
                              value={step.description || ''}
                              onChange={(e) => handleStepChange(idx, 'description', e.target.value)}
                              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-sans shadow-sm"
                              placeholder="Ej. Ingresar contraseña"
                            />
                          </div>

                          {step.action === 'navigate' && (
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-slate-500 font-semibold">URL de navegación:</label>
                              <input
                                type="text"
                                value={step.url || ''}
                                onChange={(e) => handleStepChange(idx, 'url', e.target.value)}
                                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-mono shadow-sm"
                                placeholder="https://..."
                              />
                            </div>
                          )}

                          {['type', 'click', 'wait_selector', 'extract_text'].includes(step.action) && (
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-slate-500 font-semibold">Selector CSS:</label>
                              <input
                                type="text"
                                value={step.selector || ''}
                                onChange={(e) => handleStepChange(idx, 'selector', e.target.value)}
                                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-mono shadow-sm"
                                placeholder="Ej. #input-pass, .btn-submit"
                              />
                            </div>
                          )}

                          {step.action === 'type' && (
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-slate-500 font-semibold">Valor a escribir:</label>
                              <input
                                type="text"
                                value={step.value || ''}
                                onChange={(e) => handleStepChange(idx, 'value', e.target.value)}
                                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-sans shadow-sm"
                                placeholder="Texto o {{CUSTOMER_EMAIL}}"
                              />
                            </div>
                          )}

                          {step.action === 'extract_text' && (
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-slate-500 font-semibold">Guardar resultado en variable:</label>
                              <input
                                type="text"
                                value={step.save_as || ''}
                                onChange={(e) => handleStepChange(idx, 'save_as', e.target.value)}
                                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-indigo-500 text-xs font-mono shadow-sm"
                                placeholder="Ej. otp_code"
                              />
                            </div>
                          )}

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-slate-500 font-semibold">Timeout (segundos, opcional):</label>
                            <input
                              type="number"
                              value={step.timeout || ''}
                              onChange={(e) => handleStepChange(idx, 'timeout', e.target.value)}
                              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-mono shadow-sm"
                              placeholder="Por defecto"
                            />
                          </div>
                        </div>

                        {/* Suggested Variables badges for 'type' steps */}
                        {step.action === 'type' && (
                          <div className="pt-3 flex flex-wrap gap-1.5 items-center">
                            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mr-1">Inyectar variable (Clic para aplicar):</span>
                            <span 
                              className="px-2 py-0.5 rounded-full bg-indigo-555/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-mono text-[10px] cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all select-none"
                              title="Asignar {{CUSTOMER_EMAIL}}"
                              onClick={() => {
                                handleStepChange(idx, 'value', '{{CUSTOMER_EMAIL}}');
                              }}
                            >
                              {"{{CUSTOMER_EMAIL}}"}
                            </span>
                            <span 
                              className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400 font-mono text-[10px] cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-all select-none"
                              title="Asignar {{PROVIDER_USER}}"
                              onClick={() => {
                                handleStepChange(idx, 'value', '{{PROVIDER_USER}}');
                              }}
                            >
                              {"{{PROVIDER_USER}}"}
                            </span>
                            <span 
                              className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400 font-mono text-[10px] cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-all select-none"
                              title="Asignar {{PROVIDER_PASSWORD}}"
                              onClick={() => {
                                handleStepChange(idx, 'value', '{{PROVIDER_PASSWORD}}');
                              }}
                            >
                              {"{{PROVIDER_PASSWORD}}"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-slate-200 dark:border-slate-800/50 p-12 text-center space-y-4 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900/60 flex items-center justify-center text-slate-500 border border-slate-200/80 dark:border-slate-800">
                <Code size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-300">Ninguna Receta Cargada</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                  Sube un archivo PDF exportado desde Scribe para que Gemini lo analice y genere los pasos de automatización automáticamente, o selecciona una receta existente a la izquierda.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
