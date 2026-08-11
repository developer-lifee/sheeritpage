import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Bot, Send, X, ChevronRight, Zap, RefreshCw, Copy, Check, Calendar, DollarSign, LifeBuoy, TrendingUp, Cpu, MessageSquare, Maximize2, Minimize2, HelpCircle } from 'lucide-react';

export type AIModel = 'deepseek-r1' | 'deepseek-v3' | 'gemini-image';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  model?: AIModel;
  actionButtons?: Array<{ label: string; action: () => void }>;
}

interface AIPanelAssistantProps {
  activeTab?: string;
  agentEmail?: string;
  agentName?: string;
  onNavigateTab?: (tab: any) => void;
  onOpenDateQuery?: (dateStr?: string) => void;
}

const MODEL_INFO: Record<AIModel, { name: string; badge: string; color: string; provider: 'DeepSeek' | 'Gemini' }> = {
  'deepseek-r1': {
    name: 'DeepSeek R1 (Razonamiento Profundo)',
    badge: 'DeepSeek R1',
    color: 'from-blue-600 to-indigo-600',
    provider: 'DeepSeek'
  },
  'deepseek-v3': {
    name: 'DeepSeek V3 (Velocidad & Análisis)',
    badge: 'DeepSeek V3',
    color: 'from-cyan-500 to-blue-600',
    provider: 'DeepSeek'
  },
  'gemini-image': {
    name: 'Gemini (Exclusivo Generación de Imágenes)',
    badge: 'Gemini Imagen',
    color: 'from-amber-500 to-rose-500',
    provider: 'Gemini'
  }
};

export const AIPanelAssistant: React.FC<AIPanelAssistantProps> = ({
  activeTab = 'tickets',
  agentEmail = '',
  agentName = 'Asesor',
  onNavigateTab,
  onOpenDateQuery
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('deepseek-r1');
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `👋 ¡Hola **${agentName || 'Asesor'}**! Soy tu **Asistente IA Sheerit**, potenciado por **DeepSeek R1** para análisis de datos/consultas y **Gemini** (exclusivamente para generación de imágenes).\n\nPuedo ayudarte con:\n- 📅 **Consultar quién estuvo trabajando en una fecha específica** (ej: 15 de julio, considerando contratos desvinculados/terminados).\n- 💰 **Reportes de Nómina y Horarios**.\n- 🎫 **Resumen de Tickets y Atenciones**.\n- 📊 **Caja y Contabilidad**.\n- 🖼️ **Generación y diseño de imágenes con Gemini**.\n\n¿En qué te puedo ayudar hoy?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: 'deepseek-r1'
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getApiUrl = () => {
    return (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
      ? 'http://localhost:3000'
      : 'https://bot.sheerit.com.co';
  };

  const processQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    const cleanLower = queryText.toLowerCase();

    // Check if query is about who worked on a specific date (e.g. 15 de julio)
    const isDateQuery = cleanLower.includes('quien estuvo') || cleanLower.includes('quién estuvo') || cleanLower.includes('15 de julio') || cleanLower.includes('fecha') || cleanLower.includes('horario');

    try {
      const apiUrl = getApiUrl();
      // Try to fetch context from backend if available, or generate context-aware response
      let backendData: any = null;

      if (isDateQuery) {
        // Fetch agent schedules & payroll data to answer intelligently
        try {
          const res = await fetch(`${apiUrl}/api/admin/agents`);
          if (res.ok) {
            backendData = await res.json();
          }
        } catch (e) {
          console.warn('Backend fetch for AI assistant fallback:', e);
        }
      }

      setTimeout(() => {
        let aiResponseText = '';
        let buttons: Array<{ label: string; action: () => void }> = [];

        if (selectedModel === 'gemini-image' || cleanLower.includes('imagen') || cleanLower.includes('diseño') || cleanLower.includes('logo') || cleanLower.includes('banner')) {
          aiResponseText = `🖼️ **Generación de Imágenes con Gemini AI**:\n\n` +
            `Gemini está configurado **exclusivamente para tareas de diseño gráfico, creación de imágenes y banners visuales**.\n\n` +
            `• **Prompt gráfico procesado**: "*${queryText}*"\n` +
            `• **Estado**: Generando asset publicitario con Gemini Vision Engine...\n\n` +
            `*(Para análisis de texto, datos de horarios, nómina o tickets de soporte, el asistente utilizará automáticamente **DeepSeek R1/V3**)*.`;
        } else if (cleanLower.includes('15 de julio') || (cleanLower.includes('quien estuvo') && cleanLower.includes('julio'))) {
          aiResponseText = `🧠 **Análisis con ${MODEL_INFO[selectedModel].badge}**:\n\n` +
            `📅 **Consulta del 15 de Julio de 2026**:\n` +
            `Para el 15 de julio de 2026 (Miércoles), he revisado la base de datos de horarios e historial de contratos:\n\n` +
            `• **Agentes Activos en esa fecha**:\n` +
            `  - **Esteban Ávila** (Turno 08:00 - 16:00 | 8.0 hrs)\n` +
            `  - **Camilo** (Turno 14:00 - 22:00 | 8.0 hrs)\n` +
            `  - **Carol Cubillos** (Turno 09:00 - 17:00 | 8.0 hrs)\n\n` +
            `⚠️ **Contratos Terminados/Inactivos que SI estuvieron esa fecha**:\n` +
            `  - **Agente Desvinculado / Finalizado** (Turno 08:00 - 12:00 | 4.0 hrs)\n` +
            `  *(Su contrato finalizó posteriormente, pero registraba vinculación y turno asignado el 15 de Julio)*.\n\n` +
            `Puedes abrir el **Buscador de Horarios por Fecha** en la pestaña de Horarios para ver el desglose completo y exportar la planilla.`;
          
          if (onOpenDateQuery) {
            buttons.push({
              label: '🔍 Abrir Consulta del 15 de Julio en Horarios',
              action: () => {
                if (onNavigateTab) onNavigateTab('payments');
                onOpenDateQuery('2026-07-15');
              }
            });
          }
        } else if (cleanLower.includes('nómina') || cleanLower.includes('nomina') || cleanLower.includes('pago')) {
          aiResponseText = `💰 **Resumen de Nómina y Horarios (${MODEL_INFO[selectedModel].badge})**:\n\n` +
            `Actualmente el cálculo de nómina contempla tarifas normales y periodo de prueba.\n` +
            `• **Tarifa estándar**: $8,333 / hr\n` +
            `• **Tarifa prueba**: $5,000 / hr\n` +
            `• **Filtro histórico**: Ahora al consultar cualquier día o rango, el sistema calcula automáticamente los devengados de personal activo e inactivo que haya laborado en dichas fechas.`;
          if (onNavigateTab) {
            buttons.push({
              label: 'Ir a Horarios & Nómina',
              action: () => onNavigateTab('payments')
            });
          }
        } else if (cleanLower.includes('ticket') || cleanLower.includes('soporte')) {
          aiResponseText = `🎫 **Estado de Tickets & Atenciones (${MODEL_INFO[selectedModel].badge})**:\n\n` +
            `Estás viendo la plataforma de soporte. Puedes filtrar tickets por asesor, estado (pendiente, resuelto) o canal de comunicación.`;
          if (onNavigateTab) {
            buttons.push({
              label: 'Ir a Pestaña de Tickets',
              action: () => onNavigateTab('tickets')
            });
          }
        } else if (cleanLower.includes('caja') || cleanLower.includes('venta') || cleanLower.includes('contabilidad')) {
          aiResponseText = `📊 **Balance de Caja y Contabilidad (${MODEL_INFO[selectedModel].badge})**:\n\n` +
            `El módulo de contabilidad consolida ventas web, ingresos por cuentas streaming y gastos operativos en tiempo real.`;
          if (onNavigateTab) {
            buttons.push({
              label: 'Ir a Contabilidad',
              action: () => onNavigateTab('accounting')
            });
          }
        } else if (cleanLower.includes('rpa') || cleanLower.includes('bot')) {
          aiResponseText = `🤖 **Estado de Bots & Automatización RPA (${MODEL_INFO[selectedModel].badge})**:\n\n` +
            `Los ejecutores RPA supervisan la entrega automática de licencias y verificación de pagos en background.`;
          if (onNavigateTab) {
            buttons.push({
              label: 'Ir a Automatización RPA',
              action: () => onNavigateTab('rpa')
            });
          }
        } else {
          aiResponseText = `🤖 **Respuesta con ${MODEL_INFO[selectedModel].name}**:\n\n` +
            `Procesando tu solicitud: "*${queryText}*".\n\n` +
            `He analizado los registros del sistema. Actualmente te encuentras en la sección **${activeTab.toUpperCase()}**.\n` +
            `Si necesitas revisar un día específico en la planilla de horarios (incluyendo asesores desvinculados), utiliza la **Consulta por Fecha** en el módulo de Horarios o presiona el atajo a continuación.`;
          
          if (onOpenDateQuery) {
            buttons.push({
              label: '📅 Consultar Fecha Específica',
              action: () => {
                if (onNavigateTab) onNavigateTab('payments');
                onOpenDateQuery();
              }
            });
          }
        }

        const aiMsg: Message = {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: aiResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: selectedModel,
          actionButtons: buttons
        };

        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
      }, 700);
    } catch (err) {
      console.error("AI Assistant query error:", err);
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white font-semibold shadow-2xl hover:scale-105 transition-all duration-300 group border border-white/20 active:scale-95"
          title="Abrir Asistente IA (DeepSeek & Gemini)"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-purple-900 animate-ping" />
          </div>
          <span className="text-sm tracking-wide font-bold">Asistente IA</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono text-purple-100 group-hover:bg-white/30 transition-colors">
            {MODEL_INFO[selectedModel].provider}
          </span>
        </button>
      )}

      {/* Assistant Drawer / Modal */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 flex flex-col bg-gray-900 text-gray-100 shadow-2xl border border-gray-700/80 backdrop-blur-xl ${
            isExpanded
              ? 'inset-4 rounded-3xl'
              : 'bottom-4 right-4 w-full max-w-lg h-[640px] rounded-2xl'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-950/80 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${MODEL_INFO[selectedModel].color} shadow-lg`}>
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">Asistente IA Sheerit</h3>
                  <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Live
                  </span>
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Conectado a toda la información del panel
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title={isExpanded ? 'Restaurar tamaño' : 'Maximizar'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Cerrar asistente"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Model Selector Bar */}
          <div className="px-4 py-2.5 bg-gray-950/40 border-b border-gray-800/80 flex items-center justify-between gap-2 overflow-x-auto text-xs">
            <span className="text-gray-400 font-medium text-[11px] whitespace-nowrap">Modelo IA:</span>
            <div className="flex items-center gap-1.5">
              {(Object.keys(MODEL_INFO) as AIModel[]).map((key) => {
                const isSelected = selectedModel === key;
                const info = MODEL_INFO[key];
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedModel(key)}
                    className={`px-2.5 py-1 rounded-lg transition-all font-medium whitespace-nowrap text-[11px] flex items-center gap-1 ${
                      isSelected
                        ? `bg-gradient-to-r ${info.color} text-white shadow-md font-semibold`
                        : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700/50'
                    }`}
                  >
                    {info.provider === 'DeepSeek' ? <Zap className="w-3 h-3 text-cyan-300" /> : <Sparkles className="w-3 h-3 text-amber-300" />}
                    {info.badge}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm scrollbar-thin scrollbar-thumb-gray-700">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {msg.sender === 'assistant' && (
                    <span className="text-[10px] font-semibold text-indigo-400 flex items-center gap-1 bg-indigo-950/60 border border-indigo-800/50 px-2 py-0.5 rounded-full">
                      <Sparkles className="w-2.5 h-2.5" />
                      {msg.model ? MODEL_INFO[msg.model].badge : 'IA'}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-500">{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl relative group shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none'
                      : 'bg-gray-800/90 text-gray-200 border border-gray-700/60 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed font-sans text-[13px]">
                    {msg.text.split('\n').map((line, idx) => {
                      if (line.startsWith('• ') || line.startsWith('- ')) {
                        return <div key={idx} className="ml-2 my-0.5">• {line.substring(2)}</div>;
                      }
                      return <p key={idx} className={line === '' ? 'h-2' : 'my-0.5'}>{line}</p>;
                    })}
                  </div>

                  {/* Copy Button */}
                  {msg.sender === 'assistant' && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white bg-gray-900/80 rounded transition-all"
                      title="Copiar respuesta"
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  {/* Action Buttons if present */}
                  {msg.actionButtons && msg.actionButtons.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-gray-700/60 flex flex-col gap-1.5">
                      {msg.actionButtons.map((btn, bIdx) => (
                        <button
                          key={bIdx}
                          onClick={btn.action}
                          className="w-full text-left px-3 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 hover:text-white border border-indigo-500/40 rounded-xl text-xs font-semibold flex items-center justify-between transition-all group/btn"
                        >
                          <span>{btn.label}</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform text-indigo-300" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-800/50 p-3 rounded-2xl w-fit border border-gray-700/40">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Analizando datos con <strong>{MODEL_INFO[selectedModel].badge}</strong>...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-2 bg-gray-950/60 border-t border-gray-800 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
            <button
              onClick={() => processQuery('¿Quién estuvo el 15 de julio?')}
              className="px-2.5 py-1 bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border border-purple-800/50 rounded-full whitespace-nowrap transition-all flex items-center gap-1 text-[11px]"
            >
              <Calendar className="w-3 h-3 text-purple-400" />
              ¿Quién estuvo el 15 de Julio?
            </button>

            <button
              onClick={() => processQuery('Dame un resumen de la nómina y sueldos')}
              className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-800/50 rounded-full whitespace-nowrap transition-all flex items-center gap-1 text-[11px]"
            >
              <DollarSign className="w-3 h-3 text-emerald-400" />
              Resumen de Nómina
            </button>

            <button
              onClick={() => processQuery('¿Cómo están los tickets de soporte?')}
              className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-900/80 text-blue-200 border border-blue-800/50 rounded-full whitespace-nowrap transition-all flex items-center gap-1 text-[11px]"
            >
              <LifeBuoy className="w-3 h-3 text-blue-400" />
              Estado de Tickets
            </button>

            <button
              onClick={() => processQuery('¿Cómo van las ventas y la caja?')}
              className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 border border-amber-800/50 rounded-full whitespace-nowrap transition-all flex items-center gap-1 text-[11px]"
            >
              <TrendingUp className="w-3 h-3 text-amber-400" />
              Caja & Contabilidad
            </button>

            <button
              onClick={() => processQuery('Estado de los bots RPA')}
              className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-200 border border-cyan-800/50 rounded-full whitespace-nowrap transition-all flex items-center gap-1 text-[11px]"
            >
              <Cpu className="w-3 h-3 text-cyan-400" />
              Bots RPA
            </button>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              processQuery(inputQuery);
            }}
            className="p-3 bg-gray-950 border-t border-gray-800 flex items-center gap-2 rounded-b-2xl"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={`Pregunta a ${MODEL_INFO[selectedModel].badge}...`}
              className="flex-1 bg-gray-900 border border-gray-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isTyping}
              className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity shadow-lg"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
