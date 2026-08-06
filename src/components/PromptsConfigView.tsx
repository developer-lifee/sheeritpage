import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, CheckCircle, AlertTriangle, HelpCircle, Code, Plus, Trash2, Eye, Sliders } from 'lucide-react';

const PROMPT_INFO = {
  fallback_template: {
    name: 'Asistente de Charla General (Fallback)',
    description: 'Controla el tono, respuestas generales, políticas de la empresa y derivación a soporte del chatbot.',
    variables: [
      { name: '{{ASSISTANT_NAME}}', desc: 'Nombre del asistente virtual' },
      { name: '{{COMPANY_NAME}}', desc: 'Nombre de la tienda' },
      { name: '{{WISDOM_CONTEXT}}', desc: 'Información general y políticas' },
      { name: '{{PLATFORM_CONTEXT}}', desc: 'Precios y catálogo' },
      { name: '{{ACCOUNT_SUMMARY}}', desc: 'Suscripciones activas del usuario' },
      { name: '{{SUPPORT_CONTEXT}}', desc: 'Guías de soporte técnico' },
      { name: '{{CHAT_HISTORY}}', desc: 'Historial de mensajes previos' },
      { name: '{{MESSAGE_CONTENT}}', desc: 'Mensaje actual enviado por el usuario' },
      { name: '{{MEDIA_STATUS}}', desc: 'Información si envió una imagen' },
    ],
    examples: [
      'Usa siempre emojis amigables como 🤖, 🚀 o 😊.',
      'Si el usuario pregunta por sus cuentas, guíalo a que escriba "2" para recibirlas en automático.',
      'Nunca digas claves de ejemplo inventadas, sé transparente y pídele esperar al sistema.'
    ]
  },
  payment_receipt_prompt: {
    name: 'Validador de Recibos de Pago (OCR)',
    description: 'Configura las reglas e instrucciones para que la IA extraiga montos, banco y número de cuenta de las fotos de los comprobantes.',
    variables: [
      { name: '{{CHAT_HISTORY}}', desc: 'Historial del chat reciente' },
      { name: '{{IMAGE_DESCRIPTION}}', desc: 'Descripción textual extraída por OCR' }
    ],
    examples: [
      'Establece que solo valide comprobantes de éxito.',
      'Insiste en que debe extraer el monto exacto sin puntos ni comas.',
      'Dile que busque con precisión el alias o titular de cuenta de Sheerit.'
    ]
  },
  plan_selection_prompt: {
    name: 'Clasificador de Planes y Combos (Sub-Intents)',
    description: 'Controla cómo el bot interpreta la elección de planes y responde cuando el usuario tiene dudas o confusión (Espíritu de Vendedor).',
    variables: [
      { name: '{{PLATFORM_NAME}}', desc: 'Nombre del servicio en curso (ej: Netflix)' },
      { name: '{{PLANS_LIST}}', desc: 'Planes y precios disponibles' },
      { name: '{{CART_LIST}}', desc: 'Plataformas ya agregadas en el carrito' },
      { name: '{{MESSAGE_CONTENT}}', desc: 'Mensaje actual del cliente' }
    ],
    examples: [
      'Explícale al cliente de forma persuasiva que estamos configurando un plan a la vez.',
      'Recuérdale que al agregar más servicios su descuento automático por combo aumenta.',
      'Sé claro al separar el plan actual de los otros servicios que ya tiene en su lista.'
    ]
  },
  initial_intent_prompt: {
    name: 'Clasificador de Intenciones Iniciales',
    description: 'Controla cómo la IA identifica qué acción inicial desea realizar el cliente al mandar un mensaje (comprar, renovar, credenciales, soporte, etc.).',
    variables: [
      { name: '{{MEDIA_DESCRIPTION}}', desc: 'Descripción visual/OCR si envió una imagen' },
      { name: '{{PLATFORM_CONTEXT}}', desc: 'Guías de funcionamiento y precios' },
      { name: '{{ACCOUNT_SUMMARY}}', desc: 'Cuentas y servicios actuales del usuario' },
      { name: '{{CHAT_HISTORY}}', desc: 'Historial del chat reciente' },
      { name: '{{MESSAGE_CONTENT}}', desc: 'Mensaje actual del cliente' }
    ],
    examples: [
      'Clasifica como "comprar" cuando el cliente consulte disponibilidad o stock de cuentas.',
      'Si el usuario envía un recibo de pago, pon intent: "pagar" de forma prioritaria.',
      'Identifica correctamente la frustración del usuario en una escala del 0 al 10.'
    ]
  },
  credentials_delivery_prompt: {
    name: 'Formateador de Entrega de Credenciales',
    description: 'Instrucciones para dar respuesta al cliente cuando solicita sus contraseñas, correos, pines o vencimientos de streaming.',
    variables: [
      { name: '{{CREDENTIALS_LIST}}', desc: 'Lista formateada con las cuentas del usuario y alertas de fallas' },
      { name: '{{CHAT_HISTORY}}', desc: 'Historial del chat reciente' },
      { name: '{{MESSAGE_CONTENT}}', desc: 'Mensaje actual del cliente' }
    ],
    examples: [
      'Transcribe exactamente los correos y claves sin inventar datos ficticios.',
      'Explica amablemente qué hacer si una cuenta es de acceso por invitación (ej. YouTube Familiar).',
      'Incluye el emoji de robot 🤖 al final de tu mensaje.'
    ]
  },
  reactivation_prompt: {
    name: 'Saludo de Reactivación de Bot',
    description: 'Personaliza el saludo y análisis inicial que el bot envía inmediatamente después de que un agente humano lo reactive.',
    variables: [
      { name: '{{CHAT_HISTORY}}', desc: 'Historial de mensajes previos con el asesor' }
    ],
    examples: [
      'Saluda amistosamente diciendo que has vuelto para ayudarle.',
      'Aborda de inmediato lo último que el cliente estaba consultando en el chat.',
      'Mantén el saludo conciso, servicial y usa emojis 🤖.'
    ]
  }
};

interface PromptBlock {
  id: string;
  type: 'text' | 'variable';
  value: string;
}

const parsePromptToBlocks = (promptText: string): PromptBlock[] => {
  if (!promptText) return [];
  const regex = /(\{\{[A-Z0-9_]+\}\})/g;
  const parts = promptText.split(regex);
  const result: PromptBlock[] = [];

  parts.forEach((part, index) => {
    if (part.startsWith('{{') && part.endsWith('}}')) {
      result.push({
        id: `var-${index}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'variable',
        value: part
      });
    } else {
      result.push({
        id: `txt-${index}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'text',
        value: part
      });
    }
  });

  return result;
};

const serializeBlocksToPrompt = (blocksList: PromptBlock[]): string => {
  return blocksList.map(b => b.value).join('');
};

export default function PromptsConfigView() {
  const [selectedKey, setSelectedKey] = useState<keyof typeof PROMPT_INFO>('fallback_template');
  const [prompt, setPrompt] = useState('');
  const [blocks, setBlocks] = useState<PromptBlock[]>([]);
  const [editMode, setEditMode] = useState<'visual' | 'raw'>('visual');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(false);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);

  const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:3000'
    : 'https://bot.sheerit.com.co';

  useEffect(() => {
    fetchPrompt();
  }, [selectedKey]);

  const fetchPrompt = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`${API_BASE}/api/config/prompts?key=${selectedKey}`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al obtener la plantilla de prompt');
      }
      setPrompt(data.prompt);
      setBlocks(parsePromptToBlocks(data.prompt));
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

    const finalPrompt = editMode === 'visual' ? serializeBlocksToPrompt(blocks) : prompt;

    try {
      const response = await fetch(`${API_BASE}/api/config/prompts/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: selectedKey,
          prompt: finalPrompt,
          password
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al guardar la plantilla');
      }

      setSuccess('Plantilla de prompt guardada con éxito en la base de datos.');
      setIsDefault(false);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con la API de guardado');
    } finally {
      setSaving(false);
    }
  };

  // Raw editor helper
  const insertVariableRaw = (variable: string) => {
    const textarea = document.getElementById('prompt-textarea') as HTMLTextAreaElement;
    if (!textarea) {
      setPrompt(prev => prev + ' ' + variable);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const newPrompt = before + variable + after;
    setPrompt(newPrompt);
    setBlocks(parsePromptToBlocks(newPrompt));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 50);
  };

  // Block editor helpers
  const updateTextBlock = (id: string, newValue: string) => {
    const updated = blocks.map(b => b.id === id ? { ...b, value: newValue } : b);
    setBlocks(updated);
    setPrompt(serializeBlocksToPrompt(updated));
  };

  const deleteBlock = (id: string) => {
    const updated = blocks.filter(b => b.id !== id);
    const serialized = serializeBlocksToPrompt(updated);
    setPrompt(serialized);
    setBlocks(parsePromptToBlocks(serialized));
  };

  const insertVariableAtIndex = (variableName: string, index: number) => {
    const newBlocks = [...blocks];
    newBlocks.splice(index, 0, {
      id: `var-inserted-${Math.random()}`,
      type: 'variable',
      value: variableName
    });
    const serialized = serializeBlocksToPrompt(newBlocks);
    setPrompt(serialized);
    setBlocks(parsePromptToBlocks(serialized));
  };

  const currentInfo = PROMPT_INFO[selectedKey];

  const renderPlusButton = (insertIndex: number) => {
    return (
      <div className="relative flex items-center justify-center h-6 my-1 group/plus z-10">
        <div className="absolute w-full h-[1px] bg-slate-200 dark:bg-slate-800 group-hover/plus:bg-indigo-500/40 transition-colors" />
        <button
          type="button"
          onClick={() => setActiveDropdownIndex(activeDropdownIndex === insertIndex ? null : insertIndex)}
          className="absolute p-1 bg-white dark:bg-slate-950 hover:bg-indigo-600 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-full text-slate-400 hover:text-white transition-all transform scale-90 group-hover/plus:scale-100 shadow-lg"
          title="Insertar variable aquí"
        >
          <Plus size={14} />
        </button>
        
        {activeDropdownIndex === insertIndex && (
          <div className="absolute top-8 w-64 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-3 space-y-2 z-50 animate-fadeIn">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Insertar Variable</p>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {currentInfo.variables.map(v => (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => {
                    insertVariableAtIndex(v.name, insertIndex);
                    setActiveDropdownIndex(null);
                  }}
                  className="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-xs font-mono text-indigo-650 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex flex-col"
                >
                  <span className="font-bold">{v.name}</span>
                  <span className="text-[10px] text-slate-400 font-sans mt-0.5">{v.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 text-slate-800 dark:text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm animate-fadeIn">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            ⚙️ Personalización del <span className="text-indigo-600 dark:text-indigo-400">Comportamiento del Bot</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Configura y edita los prompts de las distintas Inteligencias Artificiales del sistema de forma segura.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value as any)}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 outline-none focus:border-indigo-500 font-semibold cursor-pointer shadow-sm"
          >
            {Object.keys(PROMPT_INFO).map((k) => (
              <option key={k} value={k}>
                {PROMPT_INFO[k as keyof typeof PROMPT_INFO].name}
              </option>
            ))}
          </select>
          <button
            onClick={fetchPrompt}
            disabled={loading || saving}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 rounded-xl transition-all duration-200 border border-slate-200 dark:border-slate-750 font-bold"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Recargar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 bg-slate-100/50 dark:bg-slate-900/20 rounded-2xl border border-slate-200 dark:border-slate-800/50">
          <RefreshCw size={36} className="animate-spin text-indigo-600 dark:text-indigo-400" />
          <span className="text-slate-500 dark:text-slate-400 text-sm">Cargando plantilla del prompt...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor View */}
          <div className="lg:col-span-2 space-y-4">
            {/* View Mode Switches */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 self-start w-fit shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setBlocks(parsePromptToBlocks(prompt));
                  setEditMode('visual');
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${editMode === 'visual' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'}`}
              >
                <Sliders size={14} />
                🧩 Modo Visual (Bloques)
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditMode('raw');
                }}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${editMode === 'raw' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'}`}
              >
                <Eye size={14} />
                📝 Texto Plano (Avanzado)
              </button>
            </div>

            {/* Prompt Editor Panel */}
            <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-5 space-y-4 min-h-[400px] shadow-sm">
              <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Code size={14} className="text-indigo-600 dark:text-indigo-400" /> {currentInfo.name}
                </span>
                {isDefault && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                    Cargado por defecto
                  </span>
                )}
              </div>
              
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{currentInfo.description}</p>

              {editMode === 'raw' ? (
                <textarea
                  id="prompt-textarea"
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    setBlocks(parsePromptToBlocks(e.target.value));
                  }}
                  required
                  rows={22}
                  className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 font-mono text-sm p-5 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y min-h-[400px]"
                  placeholder="Inserta aquí la plantilla del prompt..."
                />
              ) : (
                <div className="space-y-1">
                  {renderPlusButton(0)}
                  {blocks.map((block, index) => {
                    if (block.type === 'variable') {
                      const varInfo = currentInfo.variables.find(v => v.name === block.value);
                      return (
                        <div key={block.id} className="relative group/var">
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50/60 to-slate-50/60 dark:from-indigo-950/40 dark:to-slate-900/40 border border-indigo-200 dark:border-indigo-500/20 hover:border-indigo-300 dark:hover:border-indigo-500/40 rounded-xl transition-all duration-200 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-650 dark:text-indigo-400 border border-indigo-500/20">
                                <Code size={14} />
                              </div>
                              <div>
                                <span className="font-mono text-indigo-700 dark:text-indigo-300 font-bold text-sm bg-indigo-100 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/20">
                                  {block.value}
                                </span>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                  {varInfo ? varInfo.desc : 'Variable dinámica del sistema'}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteBlock(block.id)}
                              className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-550 transition-colors"
                              title="Eliminar variable"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          {renderPlusButton(index + 1)}
                        </div>
                      );
                    } else {
                      return (
                        <div key={block.id} className="relative group/text">
                          <div className="bg-slate-50/80 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/60 focus-within:border-slate-300 dark:focus-within:border-slate-700/80 transition-all overflow-hidden shadow-inner">
                            <div className="bg-slate-100/50 dark:bg-slate-900/30 px-4 py-1.5 border-b border-slate-200 dark:border-slate-850 flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                              <span>📝 Bloque de Texto</span>
                            </div>
                            <textarea
                              value={block.value}
                              onChange={(e) => updateTextBlock(block.id, e.target.value)}
                              rows={Math.max(2, block.value.split('\n').length)}
                              placeholder="Escribe aquí las instrucciones de este fragmento..."
                              className="w-full bg-transparent text-slate-800 dark:text-slate-200 font-sans text-sm p-4 focus:outline-none focus:ring-0 leading-relaxed resize-y border-0"
                            />
                          </div>
                          {renderPlusButton(index + 1)}
                        </div>
                      );
                    }
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Prompt sidebar configs / save (Right 1 col) */}
          <div className="space-y-6">
            {/* Status alerts */}
            {(error || success) && (
              <div className="space-y-3">
                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-650 dark:text-rose-400 text-xs animate-fadeIn">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Error al guardar</p>
                      <p className="text-rose-600 dark:text-rose-400/90 mt-0.5">{error}</p>
                    </div>
                  </div>
                )}
                {success && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs animate-fadeIn">
                    <CheckCircle size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Éxito</p>
                      <p className="text-emerald-600 dark:text-emerald-400/90 mt-0.5">{success}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* In-Context Sidebar Variables (Only for raw editor mode) */}
            {editMode === 'raw' && (
              <div className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-1.5">
                  <HelpCircle size={16} className="text-indigo-600 dark:text-indigo-400" /> Insertar Variables
                </h3>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 leading-normal">
                  Haz clic en cualquier variable para insertarla en el editor de texto en tu posición de cursor.
                </p>
                <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                  {currentInfo.variables.map((v) => (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => insertVariableRaw(v.name)}
                      className="flex flex-col items-start text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all text-xs group"
                    >
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-550 dark:group-hover:text-indigo-300 font-bold mb-0.5">
                        {v.name}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                        {v.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Config & Security Card */}
            <div className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2">
                🔑 Seguridad y Guardado
              </h3>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Contraseña de Administrador
                </label>
                <input
                  type="password"
                  placeholder="admin123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/50 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 font-bold"
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

            {/* Examples & Guidelines Card */}
            <div className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <h4 className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                💡 Directrices y Ejemplos
              </h4>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 list-disc list-inside leading-relaxed">
                {currentInfo.examples.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
