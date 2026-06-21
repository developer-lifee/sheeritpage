import React, { useState, useEffect } from 'react';
import { Play, Upload, Code, HelpCircle, Save, CheckCircle, AlertTriangle, FileText, Settings2, Trash2 } from 'lucide-react';

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
  const [currentRecipe, setCurrentRecipe] = useState<Partial<RpaRecipe> | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dynamic inputs for running the recipe
  const [testEmail, setTestEmail] = useState('cliente_prueba@gmail.com');
  const [runResult, setRunResult] = useState<any>(null);

  const API_BASE = window.location.hostname.includes('sheerit.com.co')
    ? 'https://bot.sheerit.com.co'
    : `http://${window.location.hostname}:3000`;

  useEffect(() => {
    fetchRecipes();
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

      setCurrentRecipe({
        name: data.recipe.name || 'Nueva Receta Importada',
        platform: data.recipe.platform || 'desconocida',
        recipeJson: data.recipe,
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
        
        {/* Left sidebar: Import & Configurations (1 col) */}
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
                <Settings2 size={16} className="text-indigo-400" /> Probar Receta Activa
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
                    Seleccionar Receta para Ejecutar
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {recipes.map((rec) => (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs"
                      >
                        <span className="truncate font-medium text-slate-300 max-w-[130px]" title={rec.name}>
                          {rec.name}
                        </span>
                        <button
                          onClick={() => rec.id && handleRunTest(rec.id)}
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
                    onChange={(e) => setCurrentRecipe(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-transparent border-b border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:outline-none font-bold text-lg text-white pb-0.5 px-1 max-w-sm"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Plataforma:</span>
                    <input
                      type="text"
                      value={currentRecipe.platform || ''}
                      onChange={(e) => setCurrentRecipe(prev => ({ ...prev, platform: e.target.value }))}
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
                  {currentRecipe.recipeJson?.steps?.map((step, idx) => (
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
                  Sube un archivo PDF exportado desde Scribe para que Gemini lo analice y genere los pasos de automatización automáticamente.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
