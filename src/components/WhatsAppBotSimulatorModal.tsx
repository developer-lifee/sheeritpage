import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Mic, MicOff, Send, Sparkles, Check, CheckCheck, 
  MessageSquare, Heart, Clock, Film, Briefcase, ChevronRight, 
  RefreshCw, ArrowLeft, ShieldCheck, Zap
} from 'lucide-react';

interface PersonaConfig {
  name: string;
  type: 'negocio' | 'pareja' | 'recordatorios' | 'cine';
  instructions: string;
  tone: string;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

interface WhatsAppBotSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan?: (planName: string, price: string) => void;
}

export const WhatsAppBotSimulatorModal: React.FC<WhatsAppBotSimulatorModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan
}) => {
  // Pasos: 'interview' | 'chat' | 'limit-reached'
  const [step, setStep] = useState<'interview' | 'chat'>('interview');
  const [interviewStep, setInterviewStep] = useState<number>(1);
  
  // Configuración de la Persona
  const [persona, setPersona] = useState<PersonaConfig>({
    name: 'Mi Asistente Sheerit',
    type: 'negocio',
    instructions: '',
    tone: 'Amable y cercano'
  });

  // Grabación de audio
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Estado del Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState<number>(20);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  if (!isOpen) return null;

  // Manejo de grabación de audio con MediaRecorder y SpeechRecognition fallback
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioUpload(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.warn("No se pudo acceder al micrófono:", err);
      alert("No se pudo acceder al micrófono. Por favor escribe tu respuesta en el campo de texto.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioUpload = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const res = await fetch('/api/public/bot-demo/transcribe-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64: base64Audio, mimeType: 'audio/webm' })
        });
        const data = await res.json();
        if (data.success && data.text) {
          setPersona(prev => ({
            ...prev,
            instructions: prev.instructions ? `${prev.instructions} ${data.text}` : data.text
          }));
        }
        setIsTranscribing(false);
      };
    } catch (e) {
      console.error("Error transcribiendo audio:", e);
      setIsTranscribing(false);
    }
  };

  // Iniciar la simulación de chat
  const startChatSimulation = () => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let greeting = "¡Hola! Estoy listo para ayudarte. Escríbeme cualquier consulta para probar cómo respondería tu bot.";
    
    if (persona.type === 'pareja') {
      greeting = "¡Hola amor! ❤️ Estoy un poquito ocupado(a) pero aquí te respondo de una. ¿Qué tal tu día?";
    } else if (persona.type === 'recordatorios') {
      greeting = "¡Hola! ⏰ Soy tu asistente personal de WhatsApp. ¿Qué tarea, cobro o cita quieres que agende o te recuerde?";
    } else if (persona.type === 'cine') {
      greeting = "¡Hola! 🎬 Tu recomendador de streaming está listo. ¿Qué tipo de película o serie quieres ver hoy en Netflix o Max?";
    } else if (persona.type === 'negocio') {
      greeting = `¡Hola! Bienvenido a ${persona.name}. ¿En qué producto o servicio te gustaría que te asesoremos hoy?`;
    }

    setMessages([
      {
        id: 'msg-init',
        sender: 'bot',
        text: greeting,
        time: now
      }
    ]);
    setStep('chat');
  };

  // Enviar mensaje al bot
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userText = inputText.trim();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      time: now
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const historyPayload = messages.slice(-5).map(m => ({
        role: m.sender === 'user' ? 'user' : 'bot',
        text: m.text
      }));

      const res = await fetch('/api/public/bot-demo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          personaConfig: persona,
          history: historyPayload,
          remaining: remainingMessages
        })
      });

      const data = await res.json();
      setIsTyping(false);

      if (data.success) {
        setRemainingMessages(data.remaining ?? Math.max(0, remainingMessages - 1));
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        const errMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.reply || "Lo siento, tuve un problema de conexión temporal. Intenta de nuevo.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errMsg]);
      }
    } catch (err) {
      console.error(err);
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: "¡Ups! No pude contactar al servidor. Revisa tu conexión.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const handleCheckoutStarter = () => {
    if (onSelectPlan) {
      onSelectPlan('Plan Starter Bot WhatsApp', '$10.000 COP');
    } else {
      const msg = encodeURIComponent("¡Hola Sheerit! Probé el demo del Bot de WhatsApp y quiero activar el Plan Starter de $10.000 COP/mes para mi número.");
      window.open(`https://wa.me/573107946794?text=${msg}`, '_blank');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg md:max-w-xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col h-[90vh] max-h-[720px]">
        
        {/* Encabezado Principal */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-600 text-white shadow-md">
          <div className="flex items-center gap-3">
            {step === 'chat' && (
              <button 
                onClick={() => setStep('interview')}
                className="p-1 hover:bg-emerald-700 rounded-full transition-colors"
                title="Volver a configurar"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
              {persona.type === 'pareja' ? '❤️' : persona.type === 'recordatorios' ? '⏰' : persona.type === 'cine' ? '🎬' : '🤖'}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                {step === 'interview' ? 'Configura tu Bot de WhatsApp' : persona.name}
              </h3>
              <p className="text-xs text-emerald-100 flex items-center gap-1.5">
                {step === 'interview' 
                  ? 'Entrevista interactiva con IA' 
                  : isTyping ? 'escribiendo...' : 'en línea • Simulación oficial'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === 'chat' && (
              <div className="px-2.5 py-1 rounded-full bg-emerald-800/80 text-[11px] font-bold tracking-wide">
                {remainingMessages} msgs gratis
              </div>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-emerald-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CUERPO: PASO 1 - ENTREVISTA INTERACTIVA */}
        {step === 'interview' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {interviewStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="text-center">
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider">
                    Paso 1 de 2: ¿Para qué lo quieres?
                  </span>
                  <h4 className="text-xl font-black text-gray-900 dark:text-white mt-2">
                    Elige el propósito de tu Bot
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Diseñado para la gente real de Sheerit: tus clientes, tu pareja o tus tareas del día.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      setPersona(p => ({ ...p, type: 'negocio', name: 'Mi Tienda / Negocio' }));
                      setInterviewStep(2);
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      persona.type === 'negocio' 
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30' 
                        : 'border-gray-200 dark:border-gray-800 hover:border-emerald-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-2">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white">Mi Negocio / Ventas</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Atiende clientes, entrega precios y catálogos sin dejar a nadie en visto.
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setPersona(p => ({ ...p, type: 'pareja', name: 'Modo Amor ❤️' }));
                      setInterviewStep(2);
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      persona.type === 'pareja' 
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30' 
                        : 'border-gray-200 dark:border-gray-800 hover:border-emerald-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center mb-2">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white">Modo Novia / Pareja</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Respuestas cariñosas si estás ocupado o manejando, aniversarios y fechas.
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setPersona(p => ({ ...p, type: 'recordatorios', name: 'Mi Asistente Personal' }));
                      setInterviewStep(2);
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      persona.type === 'recordatorios' 
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30' 
                        : 'border-gray-200 dark:border-gray-800 hover:border-emerald-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-2">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white">Asistente & Alarmas</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      "Acuérdame pagar mañana", agendamiento de citas y recordatorios al chat.
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setPersona(p => ({ ...p, type: 'cine', name: 'Experto en Streaming' }));
                      setInterviewStep(2);
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      persona.type === 'cine' 
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30' 
                        : 'border-gray-200 dark:border-gray-800 hover:border-emerald-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-2">
                      <Film className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white">Recomendador Cinefilo</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Te recomienda qué ver en Netflix, Max o Disney+ según tu estado de ánimo.
                    </div>
                  </button>
                </div>
              </div>
            )}

            {interviewStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setInterviewStep(1)}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Cambiar propósito
                  </button>
                  <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider">
                    Paso 2 de 2: Personalización
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Nombre de tu Bot o Asistente
                  </label>
                  <input
                    type="text"
                    value={persona.name}
                    onChange={(e) => setPersona({ ...persona, name: e.target.value })}
                    placeholder="Ej. Tienda Rápida / Mi Asistente / Amor"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                    Tono de las respuestas
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Amable y cercano', 'Súper dulce y cariñoso', 'Rápido y al grano', 'Experto y profesional'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setPersona({ ...persona, tone: t })}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left ${
                          persona.tone === t
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                      ¿Qué debe saber tu bot? (Precios, reglas o gustos)
                    </label>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Puedes hablar por audio 🎤
                    </span>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={4}
                      value={persona.instructions}
                      onChange={(e) => setPersona({ ...persona, instructions: e.target.value })}
                      placeholder={
                        persona.type === 'negocio' 
                          ? "Ej: Vendemos zapatillas deportivas a $120.000 COP, tallas 37 a 42. Envíos gratis a todo el país. Métodos de pago Nequi y Bancolombia."
                          : persona.type === 'pareja'
                          ? "Ej: Mi pareja se llama Andrea. Si me escribe cuando estoy ocupado, dile que la amo, que estoy en reunión y salgo a las 6pm para vernos."
                          : persona.type === 'recordatorios'
                          ? "Ej: Ayúdame a agendar pagos, citas y recordarme hacer ejercicio. Sé muy organizado con la hora."
                          : "Ej: Me gustan las series de misterio y ciencia ficción en Netflix y Max. No me gusta el romance empalagoso."
                      }
                      className="w-full p-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                    />

                    {/* Botón de Audio */}
                    <div className="absolute right-2.5 bottom-3 flex items-center">
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-2.5 rounded-full transition-all shadow-md ${
                          isRecording 
                            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        }`}
                        title={isRecording ? "Detener grabación" : "Grabar audio para configurar"}
                      >
                        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isTranscribing && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5 animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Transcribiendo tu audio con Gemini IA...
                    </p>
                  )}
                  {isRecording && (
                    <p className="text-xs text-red-500 font-bold mt-1 flex items-center gap-1.5">
                      🔴 Grabando tu voz... Habla con naturalidad y presiona el micro para terminar.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={startChatSimulation}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm mt-4 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" /> Probar Simulador en Vivo (20 Msgs Gratis)
                </button>
              </div>
            )}
          </div>
        )}

        {/* CUERPO: PASO 2 - CHAT SIMULADOR WHATSAPP */}
        {step === 'chat' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#efeae2] dark:bg-[#0b141a] relative">
            
            {/* Fondo con marcas sutiles estilo WhatsApp */}
            <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

            {/* Aviso Superior de Prueba */}
            <div className="bg-amber-100 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-900/40 px-4 py-1.5 flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300 z-10">
              <span className="flex items-center gap-1">
                🔒 <strong>Simulación en vivo:</strong> Este mismo comportamiento responderá en tu WhatsApp oficial.
              </span>
              <button
                onClick={handleCheckoutStarter}
                className="font-bold underline hover:text-amber-950 dark:hover:text-amber-100"
              >
                Vincular a $10.000/mes
              </button>
            </div>

            {/* Mensajes del Chat */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm shadow-sm relative ${
                      msg.sender === 'user'
                        ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-900 dark:text-gray-100 rounded-tr-none'
                        : 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                      <span>{msg.time}</span>
                      {msg.sender === 'user' && (
                        <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-white dark:bg-[#202c33] rounded-2xl rounded-tl-none px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
                    <span className="ml-1 text-[11px] font-medium">{persona.name} está respondiendo...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Input Bar Estilo WhatsApp */}
            <form 
              onSubmit={handleSendMessage}
              className="p-2 sm:p-3 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-gray-200 dark:border-gray-800 flex items-center gap-2 relative z-10"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={remainingMessages > 0 ? "Escribe un mensaje para probar al bot..." : "Límite de prueba alcanzado"}
                disabled={remainingMessages <= 0 || isTyping}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#2a3942] text-gray-900 dark:text-white placeholder-gray-400 text-xs sm:text-sm outline-none focus:ring-1 focus:ring-emerald-500 border border-transparent shadow-sm"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isTyping || remainingMessages <= 0}
                className="p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-all shadow-md flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Banner de Cierre / Conversión cuando quedan pocos mensajes o 0 */}
            {remainingMessages <= 5 && (
              <div className="bg-emerald-900 text-white p-3 flex flex-wrap items-center justify-between gap-2 z-20 shadow-lg">
                <div className="text-xs">
                  <strong>¿Te gustó cómo responde?</strong> Activa tu bot oficial en tu número de WhatsApp.
                </div>
                <button
                  onClick={handleCheckoutStarter}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl text-xs transition-all shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" /> Plan Starter ($10.000 COP)
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
