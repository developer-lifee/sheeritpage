import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Bot, Send, X, ChevronRight, RefreshCw, Copy, Check, Calendar, DollarSign, LifeBuoy, TrendingUp, Cpu, Maximize2, Minimize2, Image as ImageIcon, Globe } from 'lucide-react';
import { isDemoMode } from '../utils/demoMode';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionButtons?: Array<{ label: string; action: () => void }>;
}

interface AIPanelAssistantProps {
  activeTab?: string;
  agentEmail?: string;
  agentName?: string;
  onNavigateTab?: (tab: any) => void;
  onOpenDateQuery?: (dateStr?: string) => void;
}

export const AIPanelAssistant: React.FC<AIPanelAssistantProps> = ({
  activeTab = 'tickets',
  agentEmail = '',
  agentName = 'Asesor',
  onNavigateTab,
  onOpenDateQuery
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isDemo = isDemoMode();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: isDemo
        ? `🌐 ¡Bienvenido al **Modo Demo Comercial de Sheerit**!\n\nSoy tu **Asistente Virtual Sheerit**. En este entorno de presentación puedes probar:\n- ⚡ **Asistencia Conversacional Inteligente**.\n- 📅 **Consulta de Horarios Históricos & Nómina**.\n- 🤖 **Supervisión de Automatizaciones RPA**.\n- 📊 **Balances y Métricas Contables**.\n- 🖼️ **Generación de Contenido Gráfico con Gemini**.\n\nPrueba los atajos rápidos de presentación a continuación:`
        : `👋 ¡Hola **${agentName || 'Asesor'}**! Soy tu **Asistente Sheerit**.\n\nEstoy conectado en tiempo real a la plataforma para ayudarte con:\n- 📅 **Consultar quién estuvo trabajando en una fecha específica** (ej: 15 de julio, incluyendo contratos terminados).\n- 💰 **Reportes de Nómina y Horarios**.\n- 🎫 **Resumen de Tickets de Soporte**.\n- 📊 **Caja y Contabilidad**.\n- 🖼️ **Generación de imágenes y banners con Gemini**.\n\n¿En qué puedo ayudarte?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
      : window.location.origin;
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

    try {
      const apiUrl = getApiUrl();
      const currentEmail = localStorage.getItem('ticket_agent_email') || '';
      const currentName = agentName || localStorage.getItem('ticket_agent_name') || 'Asesor';

      const res = await fetch(`${apiUrl}/api/admin/ai-assistant/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          activeTab,
          agentName: currentName,
          agentEmail: currentEmail,
          history: messages.slice(-6).map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', text: m.text }))
        })
      });

      const data = await res.json();
      let aiResponseText = '';
      let buttons: Array<{ label: string; action: () => void }> = [];

      if (data && data.success && data.answer) {
        aiResponseText = data.answer;

        if (Array.isArray(data.buttons)) {
          buttons = data.buttons.map((btn: any) => ({
            label: btn.label,
            action: () => {
              if (btn.tab && onNavigateTab) onNavigateTab(btn.tab);
              if (btn.tab === 'payments' && onOpenDateQuery && (queryText.includes('15 de julio') || queryText.includes('julio'))) {
                onOpenDateQuery('2026-07-15');
              }
            }
          }));
        }
      } else {
        aiResponseText = `🤖 **Respuesta del Asistente**:\n\n` +
          `He procesado tu solicitud: "*${queryText}*".\n\n` +
          `No se pudo obtener una respuesta detallada del servidor de IA. Por favor, verifica la conexión con el bot.`;
      }

      const aiMsg: Message = {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionButtons: buttons
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    } catch (err) {
      console.error("AI Assistant query error:", err);
      const errorMsg: Message = {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Error de conexión con el Asistente AI**:\n\nNo fue posible comunicarse con el backend del bot para consultar el registro de auditoría y base de conocimiento.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button - Clean Elegant Slate Dark */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-slate-900 text-slate-100 font-semibold shadow-2xl hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all duration-300 group active:scale-95 text-xs"
          title="Abrir Asistente Sheerit"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-5 h-5 text-indigo-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-slate-900" />
          </div>
          <span className="font-bold tracking-wide text-slate-200">Asistente IA</span>
        </button>
      )}

      {/* Assistant Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 flex flex-col bg-slate-900 text-slate-100 shadow-2xl border border-slate-700/80 backdrop-blur-xl ${
            isExpanded
              ? 'inset-4 rounded-3xl'
              : 'bottom-4 right-4 w-full max-w-md h-[600px] rounded-2xl'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-slate-950/90 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Asistente Sheerit</h3>
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  En línea
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title={isExpanded ? 'Restaurar tamaño' : 'Maximizar'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Cerrar asistente"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-700">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-500 mb-1">{msg.timestamp}</span>

                <div
                  className={`max-w-[90%] p-3.5 rounded-2xl relative group shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none'
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
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white bg-slate-900/80 rounded transition-all"
                      title="Copiar respuesta"
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  {/* Action Buttons if present */}
                  {msg.actionButtons && msg.actionButtons.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-700/60 flex flex-col gap-1.5">
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
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 p-3 rounded-2xl w-fit border border-slate-700/40">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Analizando solicitud...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
            <button
              onClick={() => processQuery('¿Quién estuvo el 15 de julio?')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-full whitespace-nowrap transition-all flex items-center gap-1 text-[11px]"
            >
              <Calendar className="w-3 h-3 text-purple-400" />
              ¿Quién estuvo el 15 de Julio?
            </button>

            <button
              onClick={() => processQuery('Dame un resumen de la nómina')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-full whitespace-nowrap transition-all flex items-center gap-1 text-[11px]"
            >
              <DollarSign className="w-3 h-3 text-emerald-400" />
              Nómina
            </button>

            <button
              onClick={() => processQuery('Generar un banner publicitario en imagen')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-full whitespace-nowrap transition-all flex items-center gap-1 text-[11px]"
            >
              <ImageIcon className="w-3 h-3 text-amber-400" />
              Imagen Gemini
            </button>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              processQuery(inputQuery);
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 rounded-b-2xl"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Escribe tu consulta o pide una imagen..."
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isTyping}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-40 transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
