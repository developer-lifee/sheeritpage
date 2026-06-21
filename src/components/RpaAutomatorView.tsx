import React, { useState, useEffect } from 'react';
import { Play, Upload, Code, HelpCircle, Save, CheckCircle, AlertTriangle, FileText, Settings2, Trash2, RefreshCw, Key, Plus } from 'lucide-react';

interface RpaStep {
  action: string;
  url?: string;
  selector?: string;
  value?: string;
  save_as?: string;
  description?: string;
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
  const [providerForm, setProviderForm] = useState({ id: null as number | null, platform: '', providerName: '', username: '', password: '' });
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);

  // Dynamic inputs for running the recipe
  const [testEmail, setTestEmail] = useState('cliente_prueba@gmail.com');
  const [runResult, setRunResult] = useState<any>(null);

  const API_BASE = window.location.hostname.includes('sheerit.com.co')
    ? 'https://bot.sheerit.com.co'
    : `http://${window.location.hostname}:3000`;

  useEffect(() => {
    fetchRecipes();
    fetchProviders();
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    setError(null);
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
    try {
      const response = await fetch(`${API_BASE}/api/admin/rpa/providers`);
      if (response.ok) {
        const data = await response.json();
        setProviders(data);
      }
    } catch (e) {
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
      setProviderForm({ id: null, platform: '', providerName: '', username: '', password: '' });
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
    <div className="max-w-6xl mx-auto p-6 space-y-6 text-white">
      
      {/* Header */}
      <div className="bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            🤖 Automatizador <span className="text-indigo-400">RPA (Scribe & Puppeteer)</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Importa PDFs de Scribe con IA de Gemini para generar scripts Puppeteer autoejecutables de proveedores.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left sidebar: Import, Recipes, Providers (1 col) */}
        <div className="space-y-6">
          {/* Uploader Card */}
          <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-slate-850 pb-2 flex items-center gap-1.5">
              <Upload size={16} className="text-indigo-400" /> Importar de Scribe
            </h3>
            
            <form onSubmit={handleUploadScribePdf} className="space-y-4">
              <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/40 rounded-xl p-4 text-center cursor-pointer transition-colors relative group">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <FileText className="mx-auto text-slate-500 group-hover:text-indigo-400 transition-colors" size={32} />
                  <span className="block text-xs font-medium text-slate-300">
                    {pdfFile ? pdfFile.name : 'Haz clic o arrastra un PDF de Scribe'}
                  </span>
                  <span className="block text-[10px] text-slate-500">Solo archivos .pdf</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Contraseña de Administrador
                </label>
                <input
                  type="password"
                  placeholder="admin123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500/50 text-xs"
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
            <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-slate-850 pb-2 flex items-center gap-1.5">
                <Settings2 size={16} className="text-indigo-400" /> Recetas de Automatización
              </h3>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Email de Prueba (`{"{{CUSTOMER_EMAIL}}"}`)
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500/50 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
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
                            ? 'bg-indigo-950/40 border-indigo-500/50'
                            : 'bg-slate-950/60 border-slate-850 hover:border-slate-700'
                        }`}
                      >
                        <span className="truncate font-medium text-slate-300 max-w-[130px]" title={rec.name}>
                          {rec.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            rec.id && handleRunTest(rec.id);
                          }}
                          disabled={running}
                          className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[10px] font-semibold transition-colors disabled:opacity-40"
                        >
                          <Play size={10} /> Test
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Provider Credentials Management Card */}
          <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Key size={16} className="text-indigo-400" /> Credenciales Proveedores
              </h3>
              <button
                type="button"
                onClick={() => {
                  setProviderForm({ id: null, platform: '', providerName: '', username: '', password: '' });
                  setShowProviderForm(!showProviderForm);
                }}
                className="p-1 hover:bg-indigo-550/10 rounded-lg text-indigo-400 hover:text-indigo-300 transition-colors"
                title="Agregar proveedor"
              >
                <Plus size={16} />
              </button>
            </div>

            {showProviderForm ? (
              <form onSubmit={handleSaveProvider} className="space-y-3 bg-slate-950/45 p-4 rounded-xl border border-slate-850 animate-fadeIn">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {providerForm.id ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </p>
                <div className="space-y-2 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="Plataforma (ej: netflix, disney)"
                    value={providerForm.platform}
                    onChange={(e) => setProviderForm(prev => ({ ...prev, platform: e.target.value.toLowerCase().trim() }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-white focus:outline-none focus:border-indigo-500/50"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Nombre Proveedor (ej: NetPremium)"
                    value={providerForm.providerName}
                    onChange={(e) => setProviderForm(prev => ({ ...prev, providerName: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-white focus:outline-none focus:border-indigo-500/50"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Usuario / Correo de Acceso"
                    value={providerForm.username}
                    onChange={(e) => setProviderForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-white focus:outline-none focus:border-indigo-500/50"
                  />
                  <input
                    type="password"
                    required
                    placeholder="Contraseña"
                    value={providerForm.password}
                    onChange={(e) => setProviderForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-white focus:outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div className="flex gap-2 justify-end text-[10px]">
                  <button
                    type="button"
                    onClick={() => setShowProviderForm(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingProvider}
                    className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-40 rounded-lg font-bold flex items-center gap-1"
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
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-850/80 text-[11px] space-y-1.5 relative group/prov"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 capitalize">{p.providerName}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase tracking-wider">
                          {p.platform}
                        </span>
                      </div>
                      <div className="text-slate-400 font-mono text-[10px] truncate">
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
                          className="text-[10px] text-indigo-400 hover:underline font-semibold"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProvider(p.id)}
                          className="text-[10px] text-rose-450 hover:underline font-semibold"
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
                <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Ocurrió un inconveniente</p>
                    <p className="text-rose-400/90 mt-0.5">{error}</p>
                  </div>
                </div>
              )}
              {success && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                  <CheckCircle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Éxito en la Operación</p>
                    <p className="text-emerald-400/90 mt-0.5">{success}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Test results */}
          {runResult && (
            <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-emerald-500/20 space-y-3">
              <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                📊 Resultados de Ejecución Puppeteer (RPA)
              </h4>
              <pre className="bg-slate-950 p-4 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto max-h-48 border border-slate-800">
                {JSON.stringify(runResult, null, 2)}
              </pre>
            </div>
          )}

          {/* Recipe step builder */}
          {currentRecipe ? (
            <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden">
              <div className="bg-slate-900/80 px-6 py-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <input
                    type="text"
                    value={currentRecipe.name || ''}
                    onChange={(e) => setCurrentRecipe(prev => {
                      if (!prev) return null;
                      const newJson = prev.recipeJson ? { ...prev.recipeJson, name: e.target.value } : { name: e.target.value, platform: prev.platform || '', steps: [] };
                      return { ...prev, name: e.target.value, recipeJson: newJson as any };
                    })}
                    className="bg-transparent border-b border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:outline-none font-bold text-lg text-white pb-0.5 px-1 max-w-sm"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Plataforma:</span>
                    <input
                      type="text"
                      value={currentRecipe.platform || ''}
                      onChange={(e) => setCurrentRecipe(prev => {
                        if (!prev) return null;
                        const newJson = prev.recipeJson ? { ...prev.recipeJson, platform: e.target.value } : { name: prev.name || '', platform: e.target.value, steps: [] };
                        return { ...prev, platform: e.target.value, recipeJson: newJson as any };
                      })}
                      className="bg-transparent border-b border-slate-800 focus:outline-none text-xs text-indigo-400 font-semibold px-1 w-24"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveRecipe}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/10 transition-colors"
                >
                  <Save size={14} /> Guardar Receta
                </button>
              </div>

              {/* Steps List */}
              <div className="p-6 space-y-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Listado de Pasos Analizados
                </h4>

                <div className="space-y-3">
                  {getRecipeSteps().map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 hover:border-slate-800 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-2 flex-grow">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold font-mono">
                            Paso {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-200 capitalize">
                            {step.action}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs">
                          {step.description || 'Sin descripción.'}
                        </p>
                        
                        {/* Selector / Value Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                          {step.selector && (
                            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/60 font-mono text-[10px] text-slate-300">
                              <span className="text-slate-500 mr-1 font-sans font-semibold">Selector:</span> {step.selector}
                            </div>
                          )}
                          {step.url && (
                            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/60 font-mono text-[10px] text-slate-300 truncate" title={step.url}>
                              <span className="text-slate-500 mr-1 font-sans font-semibold">URL:</span> {step.url}
                            </div>
                          )}
                          {step.value && (
                            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800/60 font-mono text-[10px] text-slate-300">
                              <span className="text-slate-500 mr-1 font-sans font-semibold">Valor:</span> {step.value}
                            </div>
                          )}
                          {step.save_as && (
                            <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-850 font-mono text-[10px] text-emerald-400">
                              <span className="text-slate-500 mr-1 font-sans font-semibold">Guardar en:</span> {step.save_as}
                            </div>
                          )}
                        </div>

                        {/* Suggested Variables badges for 'type' steps */}
                        {step.action === 'type' && (
                          <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mr-1">Variables de inyección:</span>
                            <span 
                              className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-[10px] cursor-pointer hover:bg-indigo-550/20 transition-all"
                              title="Copiar variable"
                              onClick={() => {
                                navigator.clipboard.writeText('{{CUSTOMER_EMAIL}}');
                                alert('Copiado: {{CUSTOMER_EMAIL}}');
                              }}
                            >
                              {"{{CUSTOMER_EMAIL}}"}
                            </span>
                            <span 
                              className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-[10px] cursor-pointer hover:bg-purple-550/20 transition-all"
                              title="Copiar variable"
                              onClick={() => {
                                navigator.clipboard.writeText('{{PROVIDER_USER}}');
                                alert('Copiado: {{PROVIDER_USER}}');
                              }}
                            >
                              {"{{PROVIDER_USER}}"}
                            </span>
                            <span 
                              className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-[10px] cursor-pointer hover:bg-purple-550/20 transition-all"
                              title="Copiar variable"
                              onClick={() => {
                                navigator.clipboard.writeText('{{PROVIDER_PASSWORD}}');
                                alert('Copiado: {{PROVIDER_PASSWORD}}');
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
            <div className="bg-slate-900/20 rounded-2xl border border-slate-800/50 p-12 text-center space-y-4 flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-slate-900/60 flex items-center justify-center text-slate-500">
                <Code size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-slate-300">Ninguna Receta Cargada</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">
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
