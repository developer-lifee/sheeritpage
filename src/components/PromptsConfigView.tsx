import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, CheckCircle, AlertTriangle, Eye } from 'lucide-react';

export default function PromptsConfigView() {
  const [prompt, setPrompt] = useState('');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(false);

  const API_BASE = window.location.hostname.includes('sheerit.com.co')
    ? 'https://bot.sheerit.com.co'
    : `http://${window.location.hostname}:3000`;

  useEffect(() => {
    fetchPrompt();
  }, []);

  const fetchPrompt = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/config/prompts`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al obtener la plantilla de prompt');
      }
      setPrompt(data.prompt);
      setIsDefault(!!data.isDefault);
    } catch (err: any) {
      setError(err.message || 'Fallo de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE}/api/config/prompts/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          password
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al guardar la plantilla');
      }

      setSuccess('Plantilla de prompt guardada con éxito en la base de datos y caché del bot reiniciada.');
      setIsDefault(false);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con la API de guardado');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            ⚙️ Configuración de <span className="text-indigo-400">Prompts de IA</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Modifica y afina las reglas, tono y comportamiento del asistente virtual de Sheerit.
          </p>
        </div>
        <button
          onClick={fetchPrompt}
          disabled={loading || saving}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl transition-all duration-200 border border-slate-750"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Recargar
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 bg-slate-900/20 rounded-2xl border border-slate-800/50">
          <RefreshCw size={36} className="animate-spin text-indigo-400" />
          <span className="text-slate-400 text-sm">Cargando configuración de prompt...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main prompt editor (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800 overflow-hidden">
              <div className="bg-slate-900/80 px-5 py-3 border-b border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings size={14} className="text-indigo-400" /> Editor de Plantilla (fallback_template.txt)
                </span>
                {isDefault && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Cargado por defecto (Archivo)
                  </span>
                )}
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
                rows={22}
                className="w-full bg-slate-950/80 text-slate-200 font-mono text-sm p-5 focus:outline-none focus:ring-0 leading-relaxed resize-y min-h-[400px]"
                placeholder="Inserta aquí la plantilla del prompt del bot..."
              />
            </div>
          </div>

          {/* Prompt sidebar configs / save (Right 1 col) */}
          <div className="space-y-6">
            {/* Status alerts */}
            {(error || success) && (
              <div className="space-y-3">
                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Error al guardar</p>
                      <p className="text-rose-400/90 mt-0.5">{error}</p>
                    </div>
                  </div>
                )}
                {success && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                    <CheckCircle size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Éxito</p>
                      <p className="text-emerald-400/90 mt-0.5">{success}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Config & Security Card */}
            <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-slate-850 pb-2">
                🔑 Seguridad y Guardado
              </h3>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Contraseña de Administrador
                </label>
                <input
                  type="password"
                  placeholder="admin123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 px-3.5 text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Guardar Prompt
                  </>
                )}
              </button>
            </div>

            {/* Guidelines Card */}
            <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                💡 Consejos de Prompting
              </h4>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
                <li>Mantén las variables encerradas en llaves triples (ej: <code className="text-indigo-300 font-mono">{"{"}*nombre*{"}"}</code>) si las usa el reemplazo de strings.</li>
                <li>Sé preciso con el formato de WhatsApp (<code className="text-slate-300">*negrita*</code>, <code className="text-slate-300">_cursiva_</code>).</li>
                <li>Usa emojis amigables para el bot 🤖.</li>
                <li>Evita contradecir las directrices del negocio (ej. Métodos de pago permitidos).</li>
              </ul>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
