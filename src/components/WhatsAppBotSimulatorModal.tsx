import React, { useState, useRef, useEffect } from 'react';
import { useWhatsAppContact } from '../hooks/useWhatsAppContact';
import { 
  X, Mic, MicOff, Send, Sparkles, CheckCheck, 
  MessageSquare, Heart, Clock, Film, Briefcase, ChevronRight, 
  RefreshCw, ArrowLeft, ShieldCheck, Zap, ArrowRight, CornerDownLeft
} from 'lucide-react';

interface PersonaConfig {
  phone?: string;
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
  const { getWaLink } = useWhatsAppContact();

  // Estados generales: 'interview' | 'chat'
  const [step, setStep] = useState<'interview' | 'chat'>('interview');
  
  // Preguntas Typeform: 1 -> 2 -> 3 -> 4
  const [currentQuestion, setCurrentQuestion] = useState<number>(1);
  const totalQuestions = 4;
  
  // Configuración de la Persona
  const [persona, setPersona] = useState<PersonaConfig>({
    name: '',
    type: 'negocio',
    instructions: '',
    tone: 'Amable y cercano'
  });

  // Grabación de audio
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  if (!isOpen) return null;

  // Grabación de audio
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
      alert("No se pudo acceder al micrófono. Puedes escribir las instrucciones en el recuadro.");
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
  const startChatSimulation = async () => {
    const finalName = persona.name.trim() || (
      persona.type === 'negocio' ? 'Mi Tienda' :
      persona.type === 'pareja' ? 'Amor ❤️' :
      persona.type === 'recordatorios' ? 'Asistente Personal' : 'Cine Sheerit'
    );

    // Guardar lead de una vez en backend
    try {
      fetch('/api/public/bot-demo/save-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: persona.phone || '',
          name: finalName,
          type: persona.type,
          instructions: persona.instructions || 'Sin instrucciones adicionales',
          remaining: 20
        })
      }).catch(err => console.warn('Lead save background note:', err));
    } catch (e) {
      // Ignorar fallo no bloqueante
    }

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let greeting = "¡Hola! Estoy listo para ayudarte. Escríbeme cualquier consulta para probar cómo respondería tu bot.";
    
    if (persona.type === 'pareja') {
      greeting = "¡Hola amor! ❤️ Estoy un poquito ocupado(a) pero aquí te respondo de una. ¿Qué tal tu día?";
    } else if (persona.type === 'recordatorios') {
      greeting = "¡Hola! ⏰ Soy tu asistente personal de WhatsApp. ¿Qué tarea, cobro o cita quieres que agende o te recuerde?";
    } else if (persona.type === 'cine') {
      greeting = "¡Hola! 🎬 Tu recomendador de películas está listo. ¿Qué tipo de película o serie quieres ver hoy en Netflix o Max?";
    } else if (persona.type === 'negocio') {
      greeting = `¡Hola! Bienvenido a ${finalName}. ¿En qué producto o servicio te gustaría que te asesoremos hoy?`;
    }

    setPersona(prev => ({ ...prev, name: finalName }));
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
          remaining: remainingMessages,
          userPhone: persona.phone || ''
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
      const msg = "¡Hola Sheerit! Probé el demo del Bot de WhatsApp y quiero activar el Plan Starter de $10.000 COP/mes para mi número.";
      window.open(getWaLink(msg), '_blank');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl h-[92vh] sm:h-[85vh] max-h-[720px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-emerald-500/20">
        
        {/* HEADER DECORATIVO WHATSAPP */}
        <div className="px-5 py-3.5 bg-emerald-600 dark:bg-emerald-800 text-white flex items-center justify-between shrink-0 shadow-md">
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
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg shrink-0">
              {persona.type === 'pareja' ? '❤️' : persona.type === 'recordatorios' ? '⏰' : persona.type === 'cine' ? '🎬' : '💼'}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                {step === 'interview' ? 'Configura tu Bot de WhatsApp' : (persona.name || 'Mi Bot')}
              </h3>
              <p className="text-xs text-emerald-100 flex items-center gap-1.5">
                {step === 'interview' 
                  ? `Pregunta ${currentQuestion} de ${totalQuestions}`
                  : isTyping ? 'escribiendo...' : 'en línea • Simulación activa'}
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

        {/* BARRA DE PROGRESO TYPEFORM */}
        {step === 'interview' && (
          <div className="w-full bg-emerald-950/20 h-1.5 shrink-0">
            <div 
              className="bg-emerald-500 h-1.5 transition-all duration-300"
              style={{ width: `${(currentQuestion / totalQuestions) * 100}%` }}
            />
          </div>
        )}

        {/* CUERPO: PASO 1 - TYPEFORM QUESTION FLOW */}
        {step === 'interview' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 flex flex-col justify-between">
            
            {/* PREGUNTA 1: ¿A quién quieres que le conteste? */}
            {currentQuestion === 1 && (
              <div className="space-y-6 animate-fadeIn my-auto">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-3">
                    <Sparkles className="w-3.5 h-3.5" /> 1 → Propósito clave
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    ¿A quién quieres que tu bot le conteste hoy?
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Selecciona a quién estará dirigido para que adaptemos su inteligencia y estilo:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {[
                    {
                      key: 'A',
                      type: 'negocio',
                      title: 'Mis Clientes / Ventas',
                      desc: 'Precios, catálogos y resolver dudas 24/7 sin dejar a nadie en visto.',
                      icon: <Briefcase className="w-5 h-5 text-emerald-500" />,
                      defaultName: 'Mi Tienda Sheerit'
                    },
                    {
                      key: 'B',
                      type: 'pareja',
                      title: 'Mi Pareja / Novia',
                      desc: 'Modo cariñoso: responder con amor cuando ando ocupado o manejando.',
                      icon: <Heart className="w-5 h-5 text-pink-500" />,
                      defaultName: 'Modo Amor ❤️'
                    },
                    {
                      key: 'C',
                      type: 'recordatorios',
                      title: 'A mí mismo (Asistente & Alarmas)',
                      desc: 'Recordatorios de pagos, citas, tareas y apuntes rápidos por WhatsApp.',
                      icon: <Clock className="w-5 h-5 text-amber-500" />,
                      defaultName: 'Mi Asistente Personal'
                    },
                    {
                      key: 'D',
                      type: 'cine',
                      title: 'Amigos / Grupo (Cine & Streaming)',
                      desc: 'Recomendar qué ver en Netflix o Max según tu ánimo o el de tus amigos.',
                      icon: <Film className="w-5 h-5 text-purple-500" />,
                      defaultName: 'Experto en Streaming'
                    }
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setPersona(p => ({ 
                          ...p, 
                          type: item.type as any, 
                          name: p.name || item.defaultName 
                        }));
                        setCurrentQuestion(2);
                      }}
                      className="group p-4 rounded-2xl border-2 text-left transition-all border-gray-200 dark:border-gray-800 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 active:scale-[0.98] flex items-start gap-3.5"
                    >
                      <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-extrabold text-xs flex items-center justify-center border border-gray-200 dark:border-gray-700 group-hover:border-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0">
                        {item.key}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {item.icon}
                          <span className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                            {item.title}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PREGUNTA 2: Nombre del Bot o Negocio */}
            {currentQuestion === 2 && (
              <div className="space-y-6 animate-fadeIn my-auto">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-3">
                    2 → Identidad
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    ¿Cómo se llama tu bot o tu negocio?
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Así se presentará ante las personas cuando inicien una conversación en WhatsApp.
                  </p>
                </div>

                <div className="pt-2">
                  <input
                    type="text"
                    autoFocus
                    value={persona.name}
                    onChange={(e) => setPersona({ ...persona, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && persona.name.trim()) {
                        setCurrentQuestion(3);
                      }
                    }}
                    placeholder={
                      persona.type === 'negocio' ? "Ej: Tienda Sheerit / Mi Joyería" :
                      persona.type === 'pareja' ? "Ej: Amor ❤️ / Mi Corazón" :
                      persona.type === 'recordatorios' ? "Ej: Mi Asistente / Recordatorios" : "Ej: Cine Sheerit"
                    }
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-emerald-500/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base sm:text-lg focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all shadow-inner"
                  />
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                    <CornerDownLeft className="w-3.5 h-3.5" /> Presiona Continuar o la tecla Enter para avanzar
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentQuestion(1)}
                    className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Atrás
                  </button>

                  <button
                    type="button"
                    disabled={!persona.name.trim()}
                    onClick={() => setCurrentQuestion(3)}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    Continuar <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* PREGUNTA 3: Instrucciones y Nota de Voz */}
            {currentQuestion === 3 && (
              <div className="space-y-5 animate-fadeIn my-auto">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-3">
                    3 → Personalidad e Instrucciones
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    ¿Qué debe saber tu bot para responder como tú quieres?
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Cuéntale en tus palabras qué vendes, cómo debe hablar o qué no debe decir:
                  </p>
                </div>

                <div className="space-y-3">
                  <textarea
                    rows={4}
                    value={persona.instructions}
                    onChange={(e) => setPersona({ ...persona, instructions: e.target.value })}
                    placeholder={
                      persona.type === 'negocio' 
                        ? "Ej: Vendemos suscripciones y cuentas premium. Los pagos son por Nequi o Bancolombia. Trata a la gente de tú y pide siempre el comprobante..."
                        : persona.type === 'pareja'
                        ? "Ej: Si me escriben, di que estoy en una reunión importante pero que la amo con todo el corazón y le respondo apenas salga a las 6pm..."
                        : persona.type === 'recordatorios'
                        ? "Ej: Ayúdame a agendar pagos, alarmas y reuniones. Confírmame siempre la hora exacta y el recordatorio..."
                        : "Ej: Me gustan las películas de suspenso, drama y ciencia ficción. Pregúntame qué plataformas tengo activas..."
                    }
                    className="w-full p-4 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none leading-relaxed shadow-sm"
                  />

                  {/* Grabación de Audio con IA */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isRecording ? 'bg-red-500 text-white animate-ping' : 'bg-emerald-500/10 text-emerald-600'
                      }`}>
                        <Mic className="w-4 h-4" />
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-gray-800 dark:text-gray-200 block">
                          {isRecording ? `Grabando audio... 0:0${recordingSeconds}` : '¿Prefieres no escribir?'}
                        </span>
                        <span className="text-gray-500 text-[11px]">
                          {isRecording ? 'Habla con tranquilidad, transcribiremos con IA' : 'Graba un audio y lo transcribimos automáticamente'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isTranscribing}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                        isRecording
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isTranscribing ? (
                        <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Transcribiendo...</>
                      ) : isRecording ? (
                        <><MicOff className="w-3.5 h-3.5" /> Detener y Guardar</>
                      ) : (
                        <><Mic className="w-3.5 h-3.5" /> Grabar Nota de Voz</>
                      )}
                    </button>
                  </div>

                  {/* Chips de sugerencias rápidas */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      'Tratar de tú y con amabilidad',
                      'Precios y entrega inmediata',
                      'Pedir comprobante de pago',
                      'Responder corto y al grano'
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          setPersona(prev => ({
                            ...prev,
                            instructions: prev.instructions ? `${prev.instructions}. ${chip}` : chip
                          }));
                        }}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-[11px] text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 transition-colors border border-gray-200 dark:border-gray-700"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentQuestion(2)}
                    className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Atrás
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentQuestion(4)}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    Continuar <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* PREGUNTA 4: Teléfono para 20 créditos & Venta cruzada */}
            {currentQuestion === 4 && (
              <div className="space-y-6 animate-fadeIn my-auto">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-3">
                    4 → Activación Gratuita
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    ¿A qué número de WhatsApp vincularemos tus 20 créditos?
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Guardaremos esta configuración oficial para que pruebes tu bot ahora y un asesor pueda activártelo en tu número real.
                  </p>
                </div>

                <div className="pt-2 space-y-3">
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 flex items-center gap-1 text-xs font-black text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-700 pr-2.5">
                      🇨🇴 +57
                    </span>
                    <input
                      type="tel"
                      autoFocus
                      required
                      value={persona.phone || ''}
                      onChange={(e) => setPersona({ ...persona, phone: e.target.value.replace(/[^0-9+]/g, '') })}
                      placeholder="310 123 4567"
                      className="w-full pl-24 pr-4 py-3.5 rounded-2xl border-2 border-emerald-500/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base sm:text-lg focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all shadow-inner font-mono font-bold"
                    />
                  </div>
                  
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-snug">
                      <strong>Prueba 100% gratuita:</strong> Cuentas con 20 mensajes con IA para interactuar libremente. No te pediremos tarjeta de crédito.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentQuestion(3)}
                    className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Atrás
                  </button>

                  <button
                    type="button"
                    disabled={!persona.phone || persona.phone.length < 7}
                    onClick={startChatSimulation}
                    className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-black rounded-2xl text-xs sm:text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" /> Iniciar Simulación en Vivo (20 Msgs) →
                  </button>
                </div>
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
                className="font-bold underline hover:text-amber-950 dark:hover:text-amber-100 shrink-0 ml-2"
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
                placeholder={remainingMessages > 0 ? "Escribe un mensaje para probar al bot..." : "Límite de 20 mensajes completado"}
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
