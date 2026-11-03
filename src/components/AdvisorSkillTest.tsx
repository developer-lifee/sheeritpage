import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, ShieldAlert, Award, CheckCircle2, XCircle, AlertTriangle, 
  HelpCircle, Sparkles, Send, RefreshCw, Eye, BookOpen, Brain, 
  ThumbsUp, UserCheck, MessageSquare, AlertCircle, Play, Pause, 
  Volume2, VolumeX, ShieldCheck, EyeOff, Lock
} from 'lucide-react';

interface RealCase {
  id: string;
  category: string;
  clientName: string;
  isAudioCase: boolean;
  audioDuration: string;
  audioTranscript?: string; // Solo reproducido por voz, no mostrado en pantalla durante la prueba
  clientMessage?: string;   // Mostrado solo en casos de texto
  realContext: string;
  idealResponse: string;
  options: {
    label: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
}

const REAL_CASES: RealCase[] = [
  {
    id: 'case_audio_tony',
    category: 'Pagos & Cobros (Nota de Voz WhatsApp)',
    clientName: 'Tony (Renovación Claude 3.5 Sonnet)',
    isAudioCase: true,
    audioDuration: '0:13',
    audioTranscript: 'Qué más compa. Mira que ya te hice la transferencia de 20 mil pesos por Nequi a la llave Bre-V 0087387259 a nombre de Esteban Ávila Sheerit para renovar mi Claude de la fila 180. En el chat me sale un número raro con arroba 1422... ¿Me confirmas porfa si ya quedó activo?',
    realContext: 'Comprobante transferido a la llave oficial Bre-V 0087387259. En el bot sale como LID @142270875582521. Fila 180 de Claude.',
    idealResponse: 'Verificar en el extracto de cuenta bancaria que hayan entrado los $20.000 a la llave Bre-V y asentar la renovación con el comando @bot confirmar 142270875582521.',
    options: [
      {
        label: 'Verificar en los movimientos de Sheerit que ingresaron los $20.000 a la llave Bre-V 0087387259 y confirmar en el grupo con el comando "@bot confirmar 142270875582521" para actualizar la fila 180 de Claude.',
        isCorrect: true,
        explanation: '¡Correcto! Procedimiento exacto de Sheerit: validación bancaria real y asentamiento en Excel usando el LID del cliente.'
      },
      {
        label: 'Rechazar la transferencia diciendo que Bre-V no es un medio oficial de Sheerit y exigirle que consigne en efectivo en una sucursal física.',
        isCorrect: false,
        explanation: 'Grave error. 0087387259 es la Llave Bre-V oficial de Sheerit para recibir de Nequi, Daviplata, Bancolombia y todos los bancos.'
      },
      {
        label: 'Decirle al cliente que el identificador @1422... es un virus o un bot malicioso y bloquearlo inmediatamente de WhatsApp.',
        isCorrect: false,
        explanation: 'Falso. Es un identificador LID legítimo de privacidad de WhatsApp Web.'
      }
    ],
    difficulty: 'Medio'
  },
  {
    id: 'case_audio_sharay',
    category: 'Soporte Cuentas (Nota de Voz WhatsApp)',
    clientName: 'Sharay Manuel (Plan Familiar Microsoft 365)',
    isAudioCase: true,
    audioDuration: '0:11',
    audioTranscript: 'Hola buenas tardes, mira que compré la cuenta de Microsoft 365 con ustedes pero me dieron un correo que no me gusta. ¿Será que puedo cambiarlo por mi correo personal de Hotmail o me toca pagar una cuenta nueva?',
    realContext: 'Cliente activa con Microsoft 365 familiar compartido. Desea asociar su correo personal de Outlook/Hotmail.',
    idealResponse: 'Explicarle con amabilidad que al ser plan familiar se reasigna el cupo enviando una nueva invitación a su correo personal sin cobro extra.',
    options: [
      {
        label: 'Explicarle con amabilidad que en planes familiares Microsoft se puede reasignar el cupo; pedirle su correo personal de Hotmail/Outlook y enviarle la nueva invitación de inmediato sin ningún costo adicional.',
        isCorrect: true,
        explanation: '¡Excelente! Respuesta empática, rápida y apegada a la política de soporte de planes familiares.'
      },
      {
        label: 'Decirle que las licencias de Microsoft son totalmente fijas y que si cambia de correo pierde todos sus archivos y no hay nada que hacer.',
        isCorrect: false,
        explanation: 'Incorrecto. Microsoft 365 familiar permite cambiar miembros del grupo familiar cuando se requiera.'
      },
      {
        label: 'Exigirle el pago de una suscripción nueva completa de 1 año para poder cambiarle la dirección de correo.',
        isCorrect: false,
        explanation: 'Cobro indebido. El soporte de correo en planes vigentes es gratuito.'
      }
    ],
    difficulty: 'Fácil'
  },
  {
    id: 'case_audio_amazon_tv',
    category: '2FA & Códigos (Nota de Voz WhatsApp)',
    clientName: 'Cliente en Smart TV (Prime Video sheerstreaming@gmail.com)',
    isAudioCase: true,
    audioDuration: '0:12',
    audioTranscript: 'Hermano, buenas tardes. Estoy acá frente al televisor tratando de entrar a Prime Video y me sale un código en pantalla. La cuenta es sheerstreaming@gmail.com, ¿dónde saco ese código o ustedes me lo mandan?',
    realContext: 'La cuenta sheerstreaming@gmail.com tiene "Gmail API (Token Activo)" y "Extracción Activa" en el panel de cuentas.',
    idealResponse: 'Indicarle que presione Continuar en su TV y que el código se extrae al instante en sheerit.co/verificar o por el bot en segundos.',
    options: [
      {
        label: 'Indicarle que presione "Continuar" o "Reenviar código" en su TV y recordarle que puede ver su código al instante en sheerit.co/verificar o esperar 10 segundos la extracción automática del bot vía Gmail API.',
        isCorrect: true,
        explanation: '¡Impecable! Soluciona en tiempo récord usando el ecosistema de autogestión de códigos 2FA de Sheerit.'
      },
      {
        label: 'Entregarle la contraseña del correo Gmail de la empresa para que él mismo ingrese a revisar la bandeja de entrada.',
        isCorrect: false,
        explanation: 'Grave infracción de seguridad que compromete todas las cuentas asociadas a ese correo.'
      },
      {
        label: 'Decirle que Amazon bloqueó la cuenta y que intente ingresar mañana porque hoy no hay servicio de códigos.',
        isCorrect: false,
        explanation: 'Falso y perjudicial para la reputación de la empresa.'
      }
    ],
    difficulty: 'Medio'
  },
  {
    id: 'case_wiki_tarjeta_temporal',
    category: 'Reglas Operativas Wiki Sheerit (Confidencial)',
    clientName: 'Caso Interno de Inventario (Excel Maestro)',
    isAudioCase: false,
    clientMessage: 'Un cliente frecuente te escribe por WhatsApp diciendo: "Compa, me gustó mucho el servicio, quiero renovar de una vez por 6 meses completos por adelantado, hazme una rebajita". Al abrir el Excel maestro de Sheerit, ves que su cuenta asignada está con fondo ROJO y tiene la etiqueta "Tarjeta Temporal".',
    realContext: 'Según la Wiki interna de Sheerit: Las cuentas marcadas con fondo rojo y "Tarjeta Temporal" se pagan con tarjetas bancarias virtuales desechables que expiran en 30 días.',
    idealResponse: 'Explicarle con amabilidad que esa cuenta específica solo se puede renovar mes a mes porque el proveedor bancario rota los métodos de pago mensualmente; no se pueden vender paquetes largos en cuentas temporales.',
    options: [
      {
        label: 'Explicarle que esa cuenta solo puede renovarse mes a mes (máximo 30 días) porque opera con tarjeta bancaria temporal; está estrictamente prohibido vender paquetes largos de cuentas temporales según la Wiki de Sheerit.',
        isCorrect: true,
        explanation: '¡Excelente! Aplica la regla confidencial de Sheerit: las cuentas con tarjetas temporales no garantizan estabilidad a largo plazo y nunca deben venderse por periodos extendidos.'
      },
      {
        label: 'Aceptar el pago de los 6 meses de inmediato, aplicarle el descuento y cambiar el color de la celda de rojo a verde en Excel.',
        isCorrect: false,
        explanation: 'Grave falta operativa. Si la tarjeta temporal cae al mes 2, la empresa asume un reembolso o reposición no presupuestada.'
      },
      {
        label: 'Decirle que la cuenta está en rojo porque el cliente tiene un reporte negativo en Datacrédito.',
        isCorrect: false,
        explanation: 'Falso y absurdo. La etiqueta de tarjeta temporal es un estado del método de pago bancario de la cuenta.'
      }
    ],
    difficulty: 'Difícil'
  },
  {
    id: 'case_lid_whatsapp_protocol',
    category: 'Sistemas Internos Whatbot (Confidencial)',
    clientName: 'Protocolo de Identificadores LID WhatsApp',
    isAudioCase: false,
    clientMessage: 'En el chat de soporte de WhatsApp Web entra un comprobante de pago de un cliente recurrente. Al revisar el remitente, no se observa su número habitual +57... sino una cadena alfanumérica que inicia con "@142270875582521".',
    realContext: 'WhatsApp Web genera identificadores Linked Identity (LID) cuando los usuarios configuran privacidad avanzada o canales. El bot de Sheerit admite el comando @bot confirmar <LID>.',
    idealResponse: 'Reconocer que es un LID de WhatsApp válido, validar el pago en banco y usar @bot confirmar 142270875582521 para procesarlo.',
    options: [
      {
        label: 'Reconocer que es un LID (Linked Identity) legítimo de WhatsApp; verificar el dinero en la app bancaria y ejecutar el comando citando el LID ("@bot confirmar 142270875582521") para asentar la venta en Excel sin trabas.',
        isCorrect: true,
        explanation: '¡Totalmente acertado! Muestra comprensión técnica del sistema de bots y manejo de privacidad en WhatsApp Web.'
      },
      {
        label: 'Eliminar el chat y reportar el número como spam porque WhatsApp sólo permite números que empiecen por +57.',
        isCorrect: false,
        explanation: 'Error grave. El cliente ya pagó y perdería su servicio injustamente.'
      },
      {
        label: 'Decirle al cliente que el sistema está roto y que debe comprar un chip de teléfono nuevo para poder atenderlo.',
        isCorrect: false,
        explanation: 'Mala atención y falta de conocimiento técnico del ecosistema WhatsApp.'
      }
    ],
    difficulty: 'Medio'
  },
  {
    id: 'case_netflix_panini_hogar',
    category: 'Netflix & Hogar Sheerit (Confidencial)',
    clientName: 'Cristian Prieto (Netflix prime44544@gmail.com)',
    isAudioCase: false,
    clientMessage: 'El cliente Cristian Prieto escribe: "Hola compa, la clave rikoshe no me da en Netflix y además en mi Smart TV me sale un aviso rojo que dice: Este televisor no forma parte de tu Hogar con Netflix. ¿Qué hago para ver mis series?"',
    realContext: 'La clave actualizada en el sistema de Sheerit es "panini26col". El código de hogar se autogestiona en sheerit.co/actualizar/ o sheerit.co/verificar.',
    idealResponse: 'Entregar la clave vigente panini26col e indicarle que presione "Estoy de viaje" en el televisor para validar su código en sheerit.co/verificar al instante.',
    options: [
      {
        label: 'Entregarle la contraseña vigente "panini26col" e indicarle que en su televisor seleccione "Estoy de viaje / Ver temporalmente" y consulte su código de hogar al instante en sheerit.co/verificar.',
        isCorrect: true,
        explanation: '¡Impecable! Resuelve ambos problemas (clave desactualizada y bloqueo de hogar de Netflix) en una sola interacción.'
      },
      {
        label: 'Decirle que Netflix ya no funciona en televisores y que sólo puede ver desde un celular.',
        isCorrect: false,
        explanation: 'Falso. Las cuentas de Sheerit cuentan con soporte de código de hogar para Smart TV.'
      },
      {
        label: 'Pedirle que desinstale la aplicación de Netflix de su televisor y espere 7 días hábiles a que el sistema se reinicie solo.',
        isCorrect: false,
        explanation: 'Inadmisible.'
      }
    ],
    difficulty: 'Fácil'
  }
];

export const AdvisorSkillTest: React.FC = () => {
  // Estado de evaluación
  const [step, setStep] = useState<'profile' | 'test' | 'completed'>('profile');
  
  // Datos del postulante y condiciones especiales
  const [advisorName, setAdvisorName] = useState('');
  const [advisorEmail, setAdvisorEmail] = useState('');
  const [advisorPhone, setAdvisorPhone] = useState('');
  const [hasDyslexia, setHasDyslexia] = useState(false);
  const [hasADHD, setHasADHD] = useState(false);
  const [hasVisualFatigue, setHasVisualFatigue] = useState(false);
  const [medicalNotes, setMedicalNotes] = useState('');
  
  // Control Anti-Trampa (Detección de cambio de pestaña / Blur / IA externa)
  const [tabSwitchesCount, setTabSwitchesCount] = useState(0);
  const [showCheatingWarning, setShowCheatingWarning] = useState(false);

  // Reproductor de Audio
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPlaybackRate, setAudioPlaybackRate] = useState<number>(1.0);
  const [audioProgressSeconds, setAudioProgressSeconds] = useState(0);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Examen
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [answersTimeSpent, setAnswersTimeSpent] = useState<Record<number, number>>({});
  const [caseStartTime, setCaseStartTime] = useState<number>(Date.now());
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalAccuracy, setFinalAccuracy] = useState(0);
  const [passedCleanly, setPassedCleanly] = useState(false);

  // Ajuste de tiempo por dislexia/condición cognitiva (45s base vs 65s adaptado)
  const baseSecondsPerQuestion = hasDyslexia ? 65 : 45;

  // DETECCIÓN ANTI-TRAMPA: Escuchar pérdida de visibilidad o cambio de pestaña
  useEffect(() => {
    if (step !== 'test') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchesCount(prev => {
          const next = prev + 1;
          setShowCheatingWarning(true);
          return next;
        });
      }
    };

    const handleWindowBlur = () => {
      setTabSwitchesCount(prev => {
        const next = prev + 1;
        setShowCheatingWarning(true);
        return next;
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [step]);

  // CRONÓMETRO DE PREGUNTAS
  useEffect(() => {
    if (step !== 'test') return;

    // Detener cualquier audio previo al cambiar de caso
    stopSpeechAudio();

    setSecondsRemaining(baseSecondsPerQuestion);
    setCaseStartTime(Date.now());

    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          // Auto avance por tiempo agotado
          handleSelectOption(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      stopSpeechAudio();
    };
  }, [step, currentCaseIndex, baseSecondsPerQuestion]);

  // FUNCIÓN DE REPRODUCCIÓN POR VOZ (Web Speech API)
  const playSpeechAudio = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert("Tu navegador no soporta síntesis de voz. Por favor usa Google Chrome, Edge o Safari.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-CO'; // Español Colombia
    utterance.rate = audioPlaybackRate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setAudioProgressSeconds(0);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = setInterval(() => {
        setAudioProgressSeconds(p => p + 1);
      }, 1000);
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeechAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    setAudioProgressSeconds(0);
  };

  const toggleAudio = (transcript?: string) => {
    if (!transcript) return;
    if (isPlayingAudio) {
      stopSpeechAudio();
    } else {
      playSpeechAudio(transcript);
    }
  };

  const handleStartTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisorName.trim() || !advisorPhone.trim()) {
      alert("Por favor completa tu Nombre y WhatsApp/Celular para iniciar.");
      return;
    }
    setStep('test');
    setCurrentCaseIndex(0);
    setSelectedAnswers({});
    setAnswersTimeSpent({});
    setTabSwitchesCount(0);
    setShowCheatingWarning(false);
  };

  const handleSelectOption = (optionIndex: number) => {
    stopSpeechAudio();

    const timeSpent = Math.max(1, Math.round((Date.now() - caseStartTime) / 1000));
    const nextAnswers = { ...selectedAnswers, [currentCaseIndex]: optionIndex };
    const nextTimes = { ...answersTimeSpent, [currentCaseIndex]: timeSpent };

    setSelectedAnswers(nextAnswers);
    setAnswersTimeSpent(nextTimes);

    if (currentCaseIndex < REAL_CASES.length - 1) {
      setCurrentCaseIndex(prev => prev + 1);
    } else {
      // Finalizar examen y enviar a MySQL
      finishAndSubmitEvaluation(nextAnswers, nextTimes);
    }
  };

  const finishAndSubmitEvaluation = async (answers: Record<number, number>, times: Record<number, number>) => {
    setIsSubmitting(true);

    let correctCount = 0;
    let audioCorrectCount = 0;
    let totalTime = 0;

    REAL_CASES.forEach((c, idx) => {
      const selectedIdx = answers[idx];
      const isCorrect = selectedIdx !== undefined && selectedIdx !== -1 && c.options[selectedIdx]?.isCorrect;
      if (isCorrect) {
        correctCount++;
        if (c.isAudioCase) audioCorrectCount++;
      }
      totalTime += (times[idx] || 0);
    });

    const accuracy = Math.round((correctCount / REAL_CASES.length) * 100);
    const audioScore = Math.round((audioCorrectCount / 3) * 100);
    const avgTime = Math.round(totalTime / REAL_CASES.length);

    setFinalAccuracy(accuracy);
    setPassedCleanly(accuracy >= 80 && !hasDyslexia && tabSwitchesCount < 3);

    // Preparar payload para la base de datos de contratación
    const payload = {
      candidateName: advisorName,
      candidateEmail: advisorEmail,
      candidatePhone: advisorPhone,
      hasDyslexia,
      hasADHD,
      hasVisualFatigue,
      medicalNotes,
      totalScore: accuracy,
      accuracyRate: accuracy,
      totalTimeTaken: totalTime,
      averageTimePerCase: avgTime,
      tabSwitchesCount,
      audioCasesScore: audioScore,
      casesCount: REAL_CASES.length,
      answers: {
        raw: answers,
        timesSpent: times,
        cheatingTabSwitches: tabSwitchesCount
      }
    };

    try {
      const apiHost = window.location.hostname.includes('sheerit.co') 
        ? 'https://sheerit.co' 
        : 'http://localhost:3000';

      await fetch(`${apiHost}/api/public/advisor-test/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn("Error enviando evaluación a servidor:", e);
    } finally {
      setIsSubmitting(false);
      setStep('completed');
    }
  };

  const currentCase = REAL_CASES[currentCaseIndex];

  return (
    <div 
      className="max-w-4xl mx-auto px-4 py-8 select-none"
      onCopy={(e) => { e.preventDefault(); }}
      onContextMenu={(e) => { e.preventDefault(); }}
    >
      {/* Header Institucional de Selección */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-7 sm:p-8 rounded-3xl shadow-xl mb-6 border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Filtro de Selección de Talento Humano · Sheerit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Prueba Técnica de Contratación: Soporte & Chat en Vivo
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
            Evaluación cronometrada de escucha activa por notas de voz de WhatsApp, precisión en credenciales alfanuméricas y resolución de incidencias reales bajo presión.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ALERTA VISUAL ANTI-TRAMPA (Si el postulante cambia de pestaña o consulta IA) */}
      {showCheatingWarning && step === 'test' && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 text-rose-300 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-rose-200">
                ⚠️ Advertencia de Selección: Has cambiado de ventana o pestaña ({tabSwitchesCount} intento/s detectado/s).
              </p>
              <p className="text-[11px] text-rose-300/80">
                Las salidas de la prueba quedan registradas en tu perfil de postulación como sospecha de consulta externa con IA o terceros.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowCheatingWarning(false)}
            className="px-2.5 py-1 text-[11px] font-bold bg-rose-500/20 hover:bg-rose-500/40 rounded-lg text-rose-200"
          >
            Entendido
          </button>
        </div>
      )}

      {/* PASO 1: Formulario de Perfil y Declaración Médica */}
      {step === 'profile' && (
        <form onSubmit={handleStartTest} className="bg-white dark:bg-gray-800 p-7 sm:p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-md space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-500" />
              <span>1. Registro del Postulante</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Ingresa tus datos de contacto reales para que el equipo de Selección pueda comunicarse contigo si clasificas a entrevista.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Nombre y Apellido *
              </label>
              <input
                type="text"
                value={advisorName}
                onChange={e => setAdvisorName(e.target.value)}
                placeholder="Ej. Melissa Diagama"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                WhatsApp / Celular *
              </label>
              <input
                type="tel"
                value={advisorPhone}
                onChange={e => setAdvisorPhone(e.target.value)}
                placeholder="Ej. 3123456789"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={advisorEmail}
                onChange={e => setAdvisorEmail(e.target.value)}
                placeholder="postulante@gmail.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Sección de Declaración de Condiciones Médicas / Cognitivas */}
          <div className="pt-4 border-t border-gray-150 dark:border-gray-700 space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Declaración de Idoneidad para Chat en Vivo y Digitación
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              El rol requiere digitar contraseñas complejas, correos y llaves bancarias sin inversión de letras ni números bajo alta velocidad de chat.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                hasDyslexia 
                ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700' 
                : 'bg-gray-50 dark:bg-gray-750 border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800 dark:text-gray-200">Dislexia</span>
                  <input
                    type="checkbox"
                    checked={hasDyslexia}
                    onChange={e => setHasDyslexia(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                  Dificultad neurobiológica en procesamiento fonológico, reconocimiento preciso de palabras escritas, ortografía y decodificación de números o caracteres.
                </span>
              </label>

              <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                hasADHD 
                  ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700' 
                  : 'bg-gray-50 dark:bg-gray-750 border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800 dark:text-gray-200">TDAH / Atención</span>
                  <input
                    type="checkbox"
                    checked={hasADHD}
                    onChange={e => setHasADHD(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                  Sobrecarga de estímulos en situaciones de múltiples chats simultáneos.
                </span>
              </label>

              <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                hasVisualFatigue 
                  ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700' 
                  : 'bg-gray-50 dark:bg-gray-750 border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-800 dark:text-gray-200">Fatiga Visual</span>
                  <input
                    type="checkbox"
                    checked={hasVisualFatigue}
                    onChange={e => setHasVisualFatigue(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">
                  Sensibilidad a pantallas prolongadas o necesidad de alto contraste.
                </span>
              </label>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Instrucciones de Seguridad de la Prueba:</span>
            </p>
            <p>
              • La prueba contiene notas de voz de clientes reales que deberás escuchar con tus audífonos o parlantes.<br />
              • Cada pregunta tiene un límite estricto de {baseSecondsPerQuestion} segundos.<br />
              • Si cambias de pestaña o sales de la ventana para consultar herramientas externas, la plataforma registrará el evento para el evaluador.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <span>Comenzar Prueba de Selección ({REAL_CASES.length} Casos)</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* PASO 2: Examen en Vivo con Notas de Voz y Cronómetro */}
      {step === 'test' && (
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-lg space-y-6">
          {/* Barra Superior: Progreso y Cronómetro */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-150 dark:border-gray-700">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                Caso #{currentCaseIndex + 1} de {REAL_CASES.length} · {currentCase.category}
              </span>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                {currentCase.clientName}
              </h2>
            </div>

            {/* Cronómetro Visual */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-mono text-sm font-black border transition-colors ${
              secondsRemaining <= 10 
                ? 'bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800 animate-pulse' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600'
            }`}>
              <Clock className="w-4 h-4" />
              <span>00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}</span>
            </div>
          </div>

          {/* CUERPO DEL CASO: REPRODUCTOR DE NOTA DE VOZ WHATSAPP O TEXTO */}
          {currentCase.isAudioCase ? (
            <div className="p-6 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-800/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    🎧 Nota de Voz Entrante de WhatsApp
                  </span>
                </div>
                <span className="text-xs font-bold text-gray-500 font-mono">
                  Duración: {currentCase.audioDuration}
                </span>
              </div>

              {/* Reproductor de Audio Visual tipo WhatsApp */}
              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-emerald-300 dark:border-emerald-700/60 shadow-sm flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => toggleAudio(currentCase.audioTranscript)}
                  className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-md transition-transform active:scale-95 shrink-0"
                >
                  {isPlayingAudio ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </button>

                {/* Forma de onda animada */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1 h-8">
                    {[40, 70, 30, 90, 50, 80, 60, 100, 45, 85, 30, 95, 60, 40, 80, 50, 70, 90, 35, 65, 80, 50, 90].map((h, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-300 ${
                          isPlayingAudio 
                            ? 'bg-emerald-500 animate-pulse' 
                            : 'bg-gray-300 dark:bg-gray-650'
                        }`}
                        style={{ height: `${isPlayingAudio ? Math.min(100, h * 0.9) : Math.max(20, h * 0.4)}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-gray-500">
                    <span>{isPlayingAudio ? `0:0${audioProgressSeconds}` : '0:00'}</span>
                    <span>{currentCase.audioDuration}</span>
                  </div>
                </div>

                {/* Control de velocidad */}
                <button
                  type="button"
                  onClick={() => {
                    const nextRate = audioPlaybackRate === 1.0 ? 1.5 : 1.0;
                    setAudioPlaybackRate(nextRate);
                    if (isPlayingAudio) {
                      stopSpeechAudio();
                      playSpeechAudio(currentCase.audioTranscript || '');
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-bold font-mono rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"
                >
                  {audioPlaybackRate}x
                </button>
              </div>

              <p className="text-xs text-emerald-900/80 dark:text-emerald-300/80 font-medium text-center">
                Presiona <b>Reproducir</b> para escuchar la solicitud hablada del cliente y resolver el caso.
              </p>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                💬 Situación en Chat de Soporte
              </span>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-150 leading-relaxed">
                {currentCase.clientMessage}
              </p>
            </div>
          )}

          {/* PREGUNTA Y OPCIONES */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span>¿Cuál es el procedimiento operativo obligatorio para resolver esta solicitud?</span>
            </h3>

            <div className="space-y-2.5">
              {currentCase.options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(idx)}
                  className="w-full text-left p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-750 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 group-hover:border-indigo-500 group-hover:bg-indigo-500 group-hover:text-white flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 transition-colors shrink-0 mt-0.5">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">
                      {opt.label}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PASO 3: CONFIRMACIÓN DE ENTREGA AL POSTULANTE (100% CONFIDENCIAL / SIN SOLUCIONARIO) */}
      {step === 'completed' && (
        <div className="bg-white dark:bg-gray-800 p-8 sm:p-12 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              ¡Evaluación Técnica Registrada con Éxito!
            </h2>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Candidato: <span className="font-bold text-gray-900 dark:text-white">{advisorName}</span> · Celular: <span className="font-bold text-gray-900 dark:text-white">{advisorPhone}</span>
            </p>
          </div>

          {/* Tarjeta de Aprobación y Enlace de Contacto Inmediato */}
          {passedCleanly ? (
            <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-700 max-w-lg mx-auto space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-black">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>¡PUNTAJE DESTACADO: {finalAccuracy}% DE PRECISIÓN!</span>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed font-medium">
                Has superado con éxito todos los casos técnicos y notas de voz. Comunícate directamente con nuestro equipo de Talento Humano para continuar con tu proceso:
              </p>
              <a
                href={`https://wa.me/573118587974?text=${encodeURIComponent(
                  `¡Hola! Acabo de finalizar la prueba técnica de selección en sheerit.co/evaluacion con un puntaje del ${finalAccuracy}%. Mi nombre es ${advisorName} (+57 ${advisorPhone}). Quedo atento a la entrevista técnica.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition-transform active:scale-95"
              >
                <MessageSquare className="w-5 h-5 fill-current" />
                <span>Contactar a Selección por WhatsApp</span>
              </a>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-gray-600 dark:text-gray-300 text-left space-y-3 max-w-lg mx-auto">
              <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <span>Proceso de Selección Sheerit</span>
              </div>
              <p>
                Tus respuestas, tiempo de respuesta por nota de voz y precisión en credenciales han sido transmitidos de forma segura y confidencial a la base de datos del equipo evaluador.
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                Por políticas de seguridad y transparencia del proceso de selección, los resultados numéricos y auditoría de casos son de uso exclusivo del comité de contratación. Si tu perfil cumple con los estándares del cargo, te contactaremos directamente a tu WhatsApp.
              </p>
            </div>
          )}

          <div className="pt-2">
            <a
              href="https://sheerit.co"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-750 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs transition-all"
            >
              Volver al Portal Sheerit
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
