import React, { useState, useEffect } from 'react';
import { 
  Clock, ShieldAlert, Award, CheckCircle2, XCircle, AlertTriangle, 
  HelpCircle, Sparkles, Send, RefreshCw, Eye, BookOpen, Brain, 
  ThumbsUp, UserCheck, MessageSquare, AlertCircle
} from 'lucide-react';

interface RealCase {
  id: string;
  category: 'Pagos & Cobros' | '2FA & Códigos' | 'Netflix & Hogar' | 'Soporte / Cambio Correo' | 'Mora & Corte';
  clientName: string;
  clientMessage: string;
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
    id: 'case_sharay',
    category: 'Soporte / Cambio Correo',
    clientName: 'Sharay Manuel (Cuenta Microsoft)',
    clientMessage: 'Hola puedo cambiar mi correo en lo de microsoft?',
    realContext: 'Cliente activa con Microsoft 365 familiar compartido. Quiere usar su propio correo personal en vez del asignado o migrarlo.',
    idealResponse: 'Explicarle con empatía que en planes familiares Microsoft se puede desvincular el correo anterior y mandarle una invitación fresca a su nuevo correo personal sin perder sus archivos.',
    options: [
      {
        label: 'Decirle: "No, las cuentas de Microsoft son fijas y no se pueden cambiar bajo ninguna circunstancia."',
        isCorrect: false,
        explanation: 'Incorrecto. Microsoft 365 se maneja mediante invitación familiar; sí se puede reasignar el cupo al nuevo correo de la clienta.'
      },
      {
        label: 'Responderle con amabilidad: "¡Hola Sharay! Sí claro, podemos cambiarlo. Por favor indícame tu nuevo correo de Outlook/Hotmail y te enviamos la nueva invitación de inmediato."',
        isCorrect: true,
        explanation: '¡Excelente! Respuesta rápida, personalizada con su nombre real (no "Puedo"), y orientada a la solución inmediata.'
      },
      {
        label: 'Decirle: "Tienes que pagar un mes nuevo para poder cambiar de correo."',
        isCorrect: false,
        explanation: 'Cobro indebido. El cambio de correo por soporte en planes vigentes es gratuito.'
      }
    ],
    difficulty: 'Fácil'
  },
  {
    id: 'case_tony',
    category: 'Pagos & Cobros',
    clientName: 'Tony (Renovación Claude)',
    clientMessage: 'Que más compa. Ya le hago la transferencia. Me confirma porfa el número [Envía comprobante de $20.000 por Nequi/Bre-V a 0087387259 SHEERIT ESTEBAN AVILA]',
    realContext: 'Comprobante transferido a la llave oficial Bre-V 0087387259. En el bot sale como LID @142270875582521. Fila 180 de Claude.',
    idealResponse: 'Validar inmediatamente en la app de Nequi/Bancolombia que hayan entrado los $20.000, y confirmar con el comando @bot confirmar 142270875582521 o 573023584637 para asentar la fecha en Excel.',
    options: [
      {
        label: 'Escribir en el grupo @bot confirmar 142270875582521 tras verificar que la plata ingresó a la cuenta de Sheerit.',
        isCorrect: true,
        explanation: '¡Correcto! Usar el comando del bot asienta la renovación en Excel en la fila de Claude y le manda confirmación automática al cliente.'
      },
      {
        label: 'Rechazar el comprobante diciendo que Bre-V no es válido y pedirle consignación física.',
        isCorrect: false,
        explanation: 'Grave error. 0087387259 es la Llave Bre-V oficial de Sheerit para Nequi, Daviplata y todos los bancos.'
      },
      {
        label: 'Dejar el mensaje sin contestar porque el cliente tiene un número raro (@142270875582521).',
        isCorrect: false,
        explanation: 'Es un LID de WhatsApp. Debe validarse normalmente con el comando @bot confirmar.'
      }
    ],
    difficulty: 'Medio'
  },
  {
    id: 'case_netflix_password',
    category: 'Netflix & Hogar',
    clientName: 'Cristian Prieto (Netflix prime44544@gmail.com)',
    clientMessage: 'Hola buenas tardes, me sale contraseña incorrecta en Netflix, me sale rikoshe',
    realContext: 'La clave en la cuenta fue rotada a "panini26col" por seguridad. El cliente está intentando ingresar en su Smart TV.',
    idealResponse: 'Entregar la clave vigente "panini26col", recordarle su perfil y pedirle que si le pide código de hogar ingrese al enlace sheerit.co/verificar.',
    options: [
      {
        label: 'Decirle: "Espere a mañana que el administrador revise la cuenta."',
        isCorrect: false,
        explanation: 'El cliente queda varado sin servicio. El asesor debe consultar la clave actualizada o entregar el reemplazo de inmediato.'
      },
      {
        label: 'Informarle: "¡Hola Cristian! La contraseña vigente actualizada es panini26col. Si te solicita código de hogar, puedes generarlo al instante en sheerit.co/verificar."',
        isCorrect: true,
        explanation: '¡Impecable! Soluciona el problema de contraseña y previene la siguiente duda sobre el código de hogar.'
      },
      {
        label: 'Pedirle su correo personal para crearle una cuenta nueva sin revisar la base de datos.',
        isCorrect: false,
        explanation: 'Causa desorden en el inventario y pérdida de perfiles asignados.'
      }
    ],
    difficulty: 'Fácil'
  },
  {
    id: 'case_disney_code',
    category: '2FA & Códigos',
    clientName: 'Cliente con Disney+ (sheerstreaming@gmail.com)',
    clientMessage: 'Buenas tardes necesito el código de Disney por favor',
    realContext: 'La cuenta sheerstreaming@gmail.com está automatizada con Gmail API. El bot suele extraer el código en segundos, pero a veces el cliente no le ha dado "Continuar" en la TV.',
    idealResponse: 'Pedirle que presione "Continuar" o "Enviar código" en su televisor para que el correo llegue a la bandeja y el bot (o el asesor) pueda leerlo.',
    options: [
      {
        label: 'Decirle: "¡Hola! Por favor dale clic a \'Continuar\' o \'Reenviar código\' en tu pantalla para que nos llegue el correo más reciente, y te lo entrego de inmediato."',
        isCorrect: true,
        explanation: '¡Exacto! El 90% de los retrasos en códigos ocurren porque el cliente no ha presionado enviar en su dispositivo.'
      },
      {
        label: 'Decirle que Disney está caído y que intente en 3 horas.',
        isCorrect: false,
        explanation: 'Mentirle al cliente deteriora la confianza en la tienda.'
      },
      {
        label: 'Pedirle foto de su cédula y tarjeta de crédito.',
        isCorrect: false,
        explanation: 'Totalmente prohibido e innecesario para un código de streaming.'
      }
    ],
    difficulty: 'Medio'
  },
  {
    id: 'case_overdue_fonseca',
    category: 'Mora & Corte',
    clientName: 'Jorge Fonseca (Renovado en Excel hasta 2027)',
    clientMessage: 'Oigan me llegó un mensaje que dice que debo pagar hoy o me cortan el servicio, pero yo pagué el plan anual hace 2 semanas!',
    realContext: 'En Excel el cliente ya tiene vencimiento en 2027, pero un recordatorio viejo o Columna4 tenía fecha vieja.',
    idealResponse: 'Verificar en el panel de Base de Datos o Excel que efectivamente tiene pago hasta 2027, pedirle disculpas por el aviso automático del sistema y asegurarle que su servicio está 100% blindado y activo.',
    options: [
      {
        label: 'Decirle que si el bot le cobró es porque debe pagar nuevamente.',
        isCorrect: false,
        explanation: 'Cobro indebido gravísimo. Siempre se debe cotejar la columna de vencimiento en Excel.'
      },
      {
        label: 'Decirle: "¡Hola Jorge, qué pena contigo! Acabo de revisar en nuestro sistema y efectivamente tu suscripción está activa y paga hasta 2027. Fue una notificación automática desactualizada, por favor haz caso omiso. ¡Tu servicio está perfecto!"',
        isCorrect: true,
        explanation: '¡Excelente gestión! Calma al cliente, valida los datos reales y corrige el error con transparencia.'
      },
      {
        label: 'Bloquear al cliente de WhatsApp para que no reclame.',
        isCorrect: false,
        explanation: 'Inadmisible.'
      }
    ],
    difficulty: 'Difícil'
  },
  {
    id: 'case_gemini_irene',
    category: 'Soporte / Cambio Correo',
    clientName: 'Irene Carlona (Consulta Gemini discoveryrelesbiana@gmail.com)',
    clientMessage: 'Hola buenas noches, quería saber hasta cuándo tengo activo mi Gemini con ustedes porfa',
    realContext: 'En la pestaña Base de Datos (Clientes) del panel web, el asesor debe buscar rápidamente la cuenta compartida de Gemini discoveryrelesbiana@gmail.com y localizar a Irene Carlona con su fecha de vencimiento.',
    idealResponse: 'Escribir "GEMINI" en el buscador tipeable de servicios, filtrar por "Irene" o el correo, verificar la fecha de vencimiento en el bloque de color de la cuenta y responderle con exactitud y calidez.',
    options: [
      {
        label: 'Tipear "GEMINI" en el buscador de servicios del panel, filtrar por "Irene" para ver su fecha exacta en el bloque de cuenta con borde de color, y confirmarle su vigencia con amabilidad.',
        isCorrect: true,
        explanation: '¡Impecable! Utiliza las herramientas de búsqueda tipeable y diferenciación por colores para responder en menos de 10 segundos con total certeza.'
      },
      {
        label: 'Decirle que no sabe porque hay muchos clientes y que vuelva a preguntar mañana.',
        isCorrect: false,
        explanation: 'Mala atención. El panel administrativo tiene búsqueda tipeable por cliente, correo o servicio instantánea.'
      },
      {
        label: 'Decirle que su servicio ya venció sin verificar en el panel.',
        isCorrect: false,
        explanation: 'Pésima práctica que genera reclamos injustificados y desconfianza.'
      }
    ],
    difficulty: 'Medio'
  },
  {
    id: 'case_venta_directa_nueva',
    category: 'Pagos & Cobros',
    clientName: 'Cliente Nuevo por Registrar (WhatsApp 57 313 3053081)',
    clientMessage: 'Hola amigo acabo de pagar por Nequi para una pantalla de Disney+, me das los datos por fa',
    realContext: 'El asesor abre "Registrar Venta Directa", escribe 57 313 3053081 y presiona "Verificar". El sistema responde: "No se encontraron servicios activos para este número. Procediendo como Venta Nueva".',
    idealResponse: 'Completar el nombre del cliente, seleccionar "Disney+ Premium" en el combobox tipeable, definir 1 mes y método Nequi con el monto recibido, y dejar asignación automática en stock.',
    options: [
      {
        label: 'Completar el nombre, seleccionar "Disney+ Premium" en el buscador de servicios, método Nequi, monto recibido y registrar la venta dejando asignación automática de cupo libre.',
        isCorrect: true,
        explanation: '¡Perfecto! Registra el cliente nuevo en la base de datos, asienta el ingreso en caja real y asigna el primer cupo disponible sin alterar otras cuentas.'
      },
      {
        label: 'Decirle al cliente que como el verificador dijo que no tiene servicios previos no le puede vender nada.',
        isCorrect: false,
        explanation: 'El mensaje de "Venta Nueva" es normal para clientes primerizos; no es un error ni un impedimento.'
      },
      {
        label: 'Darle una cuenta de un cliente viejo sin registrar la venta en el sistema.',
        isCorrect: false,
        explanation: 'Causa descuadre de inventario, pérdida de trazabilidad de dinero y sobrecupo en la cuenta.'
      }
    ],
    difficulty: 'Fácil'
  },
  {
    id: 'case_cuentas_2fa_gmail',
    category: '2FA & Códigos',
    clientName: 'Cliente Solicitando Código de Amazon Prime',
    clientMessage: 'Buenas tardes por favor me colaboran con el código de Amazon que me pide en el televisor',
    realContext: 'En la pestaña "Cuentas Streaming & 2FA", la cuenta sheerstreaming@gmail.com o alzap1479@gmail.com tiene estado "Gmail API (Token Activo)" y "Extracción Activa".',
    idealResponse: 'Explicarle que presione "Continuar" en la TV y que puede obtener su código de forma 100% instantánea entrando a sheerit.co/verificar o esperando 10 segundos la respuesta del bot.',
    options: [
      {
        label: 'Orientarlo: "¡Hola! Por favor dale continuar en tu televisor. Recuerda que puedes ver tu código al instante en sheerit.co/verificar o el bot te lo entrega aquí en segundos gracias a la extracción automática."',
        isCorrect: true,
        explanation: '¡Excelente! Enseña al cliente el canal de autogestión de códigos 24/7 y aprovecha las cuentas automatizadas con Gmail API.'
      },
      {
        label: 'Pasarle la contraseña del correo Gmail de la empresa para que él mismo entre a buscar el código.',
        isCorrect: false,
        explanation: 'Gravísimo fallo de seguridad que compromete todas las cuentas de streaming asociadas a ese correo.'
      },
      {
        label: 'Decirle que Amazon bloqueó la cuenta y que ya no se pueden sacar códigos.',
        isCorrect: false,
        explanation: 'Falso. Las cuentas con Gmail API tienen token activo y extraen códigos de Amazon de forma transparente.'
      }
    ],
    difficulty: 'Medio'
  }
];

export const AdvisorSkillTest: React.FC = () => {
  // Estado de evaluación
  const [step, setStep] = useState<'profile' | 'test' | 'results'>('profile');
  
  // Datos del asesor y condiciones especiales
  const [advisorName, setAdvisorName] = useState('');
  const [advisorEmail, setAdvisorEmail] = useState('');
  const [advisorPhone, setAdvisorPhone] = useState('');
  const [hasDyslexia, setHasDyslexia] = useState(false);
  const [hasADHD, setHasADHD] = useState(false);
  const [hasVisualFatigue, setHasVisualFatigue] = useState(false);
  const [medicalNotes, setMedicalNotes] = useState('');
  
  // Examen
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [answersTimeSpent, setAnswersTimeSpent] = useState<Record<number, number>>({});
  const [caseStartTime, setCaseStartTime] = useState<number>(Date.now());
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  
  // Métricas finales y veredicto de selección
  const [finalScore, setFinalScore] = useState(0);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [accuracyRate, setAccuracyRate] = useState(0);
  const [hiringVerdict, setHiringVerdict] = useState<{ recommendation: string; rejectionReasons: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ajuste de tiempo por dislexia/condición (50% más de tiempo para lectura cómoda)
  const baseSecondsPerQuestion = hasDyslexia ? 90 : 60;

  useEffect(() => {
    if (step !== 'test') return;

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

    return () => clearInterval(interval);
  }, [step, currentCaseIndex, hasDyslexia]);

  const handleStartTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisorName.trim()) return;
    setStep('test');
    setCurrentCaseIndex(0);
    setSelectedAnswers({});
    setAnswersTimeSpent({});
  };

  const handleSelectOption = (optionIndex: number) => {
    const elapsed = Math.round((Date.now() - caseStartTime) / 1000);
    setSelectedAnswers(prev => ({ ...prev, [currentCaseIndex]: optionIndex }));
    setAnswersTimeSpent(prev => ({ ...prev, [currentCaseIndex]: elapsed }));

    if (currentCaseIndex < REAL_CASES.length - 1) {
      setCurrentCaseIndex(prev => prev + 1);
    } else {
      // Finalizar examen y calcular puntaje
      calculateFinalResults({
        ...selectedAnswers,
        [currentCaseIndex]: optionIndex
      }, {
        ...answersTimeSpent,
        [currentCaseIndex]: elapsed
      });
    }
  };

  const calculateFinalResults = (
    answers: Record<number, number>, 
    times: Record<number, number>
  ) => {
    let correctCount = 0;
    let totalTime = 0;

    REAL_CASES.forEach((c, idx) => {
      const chosenOpt = answers[idx];
      if (chosenOpt !== undefined && chosenOpt !== -1 && c.options[chosenOpt]?.isCorrect) {
        correctCount++;
      }
      totalTime += times[idx] || baseSecondsPerQuestion;
    });

    const score = Math.round((correctCount / REAL_CASES.length) * 100);
    const accuracy = Math.round((correctCount / REAL_CASES.length) * 100);
    setFinalScore(score);
    setTotalTimeTaken(totalTime);
    setAccuracyRate(accuracy);
    setStep('results');

    // Enviar a la base de datos (Backend whatbot / MySQL)
    const apiUrl = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
      ? 'http://localhost:3000'
      : window.location.origin;

    setIsSubmitting(true);
    fetch(`${apiUrl}/api/public/advisor-test/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateName: advisorName,
        candidateEmail: advisorEmail,
        candidatePhone: advisorPhone,
        hasDyslexia,
        hasADHD,
        hasVisualFatigue,
        medicalNotes,
        totalScore: score,
        accuracyRate: accuracy,
        totalTimeTaken: totalTime,
        casesCount: REAL_CASES.length,
        answers: times
      })
    })
    .then(res => res.json())
    .then(data => {
      setIsSubmitting(false);
      if (data && data.success) {
        setHiringVerdict({
          recommendation: data.recommendation,
          rejectionReasons: data.rejectionReasons
        });
      }
    })
    .catch(err => {
      console.warn("Error enviando evaluación a BD:", err);
      setIsSubmitting(false);
    });
  };

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto transition-all ${
      hasDyslexia ? 'font-sans tracking-wide leading-relaxed' : ''
    }`}>
      {/* Encabezado Principal */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-8 rounded-3xl shadow-xl mb-8 border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulador de Habilidades & Gestión Sheerit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Evaluación Operativa de Asesores de Soporte
          </h1>
          <p className="text-slate-300 text-sm mt-2 max-w-2xl">
            Prueba de casos reales (LIDs, cambios de correo, cobros indebidos, validación de pagos y códigos 2FA) con tiempo cronometrado y adaptación especial para dislexia o condiciones visuales.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* PASO 1: Formulario de Perfil y Condiciones Médicas/Especiales */}
      {step === 'profile' && (
        <form onSubmit={handleStartTest} className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-md space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-500" />
              <span>1. Registro del Asesor</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Ingresa tus datos antes de comenzar. Si tienes alguna condición cognitiva o visual, indícala para calibrar el tiempo y formato de la prueba.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={advisorName}
                onChange={e => setAdvisorName(e.target.value)}
                placeholder="Ej. Melissa Diagama / Camilo / Esteban"
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
                placeholder="asesor@sheerit.co"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Sección de Inclusión y Condiciones Especiales */}
          <div className="pt-4 border-t border-gray-150 dark:border-gray-700 space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Condiciones de Salud, Dislexia o Lectura
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Evaluación técnica y operativa. La digitación precisa de credenciales alfanuméricas, cuentas y fechas es un requisito indispensable del cargo.
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
                  Dificultad neurobiológica en procesamiento fonológico, reconocimiento preciso de palabras, ortografía y decodificación de secuencias numéricas y alfanuméricas.
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
                  Sobrecarga de estímulos en situaciones simultáneas de chat.
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
                  Sensibilidad al brillo o necesidad de contraste aumentado.
                </span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                Observaciones adicionales del asesor (opcional):
              </label>
              <textarea
                value={medicalNotes}
                onChange={e => setMedicalNotes(e.target.value)}
                placeholder="Si tienes alguna condición particular que la empresa deba considerar durante tu turno de atención..."
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <span>Comenzar Prueba Cronometrada ({REAL_CASES.length} Casos Reales)</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* PASO 2: Examen en Vivo con Cronómetro */}
      {step === 'test' && (
        <div className="space-y-6">
          {/* Barra de progreso y temporizador */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Caso {currentCaseIndex + 1} de {REAL_CASES.length}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                {REAL_CASES[currentCaseIndex].category}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${secondsRemaining <= 15 ? 'text-rose-500 animate-pulse' : 'text-gray-400'}`} />
              <span className={`font-mono font-bold text-sm ${
                secondsRemaining <= 15 ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {secondsRemaining}s
              </span>
              {hasDyslexia && (
                <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold" title="Tiempo extendido por dislexia activo">
                  +50% Tiempo
                </span>
              )}
            </div>
          </div>

          {/* Tarjeta del Caso Real */}
          <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-md space-y-6">
            <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
              <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">Cliente de WhatsApp</span>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                {REAL_CASES[currentCaseIndex].clientName}
              </h2>
            </div>

            {/* Burbuja simulada de WhatsApp */}
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Mensaje recibido en WhatsApp:</span>
              </div>
              <p className="text-gray-800 dark:text-gray-200 text-sm italic font-medium bg-white/70 dark:bg-gray-900/60 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                "{REAL_CASES[currentCaseIndex].clientMessage}"
              </p>
            </div>

            {/* Contexto interno que el asesor ve en el sistema */}
            <div className="bg-slate-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 text-xs space-y-1">
              <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block">
                Contexto en Excel / Base de Datos:
              </span>
              <p className="text-gray-700 dark:text-gray-300">
                {REAL_CASES[currentCaseIndex].realContext}
              </p>
            </div>

            {/* Opciones de respuesta para el Asesor */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 block">
                ¿Cuál es la respuesta o acción correcta que debes realizar?
              </span>

              {REAL_CASES[currentCaseIndex].options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => handleSelectOption(oIdx)}
                  className="w-full text-left p-4 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all flex items-start gap-3 group"
                >
                  <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 transition-colors flex-shrink-0 mt-0.5">
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PASO 3: Resultados, Tiempos y Calificación Adaptada */}
      {step === 'results' && (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl space-y-8">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              Evaluación Completada: {advisorName}
            </h2>
            {hasDyslexia && (
              <span className="inline-block bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs px-3 py-1 rounded-full font-bold">
                Evaluación con Adaptación para Dislexia / Condición Cognitiva
              </span>
            )}
          </div>

          {/* Grid de Resultados */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-center">
              <span className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400">Puntaje Final</span>
              <p className="text-3xl font-black text-indigo-700 dark:text-indigo-300 mt-1">{finalScore}%</p>
              <span className="text-[11px] text-gray-500 mt-0.5 block">
                {finalScore >= 80 ? 'Aprobado con Excelencia' : (finalScore >= 60 ? 'Aprobado - Requiere Refuerzo' : 'No Aprobado')}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-center">
              <span className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">Precisión Operativa</span>
              <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{accuracyRate}%</p>
              <span className="text-[11px] text-gray-500 mt-0.5 block">Respuestas sin error técnico</span>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-center">
              <span className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400">Tiempo Total</span>
              <p className="text-3xl font-black text-blue-700 dark:text-blue-300 mt-1">{totalTimeTaken}s</p>
              <span className="text-[11px] text-gray-500 mt-0.5 block">
                Promedio: {Math.round(totalTimeTaken / REAL_CASES.length)}s por caso
              </span>
            </div>
          </div>

          {/* Veredicto de Filtro de Selección / Contratación */}
          {hiringVerdict && (
            <div className={`p-6 rounded-3xl border ${
              hiringVerdict.recommendation === 'APTO_CONTRATAR'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700'
                : (hiringVerdict.recommendation === 'OBSERVACION_PRUEBA'
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700')
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className={`w-5 h-5 ${
                  hiringVerdict.recommendation === 'APTO_CONTRATAR' ? 'text-emerald-600' : 'text-rose-600'
                }`} />
                <h4 className="font-black text-sm uppercase tracking-wider text-gray-900 dark:text-white">
                  Diagnóstico del Filtro de Selección de Personal
                </h4>
              </div>
              <p className="font-bold text-base mb-2 text-gray-800 dark:text-gray-100">
                {hiringVerdict.recommendation === 'APTO_CONTRATAR' && '🟢 APTO: Perfil compatible para atención al cliente y gestión de credenciales'}
                {hiringVerdict.recommendation === 'OBSERVACION_PRUEBA' && '🟡 EN OBSERVACIÓN: Requiere prueba técnica adicional y evaluación de velocidad'}
                {hiringVerdict.recommendation === 'NO_RECOMENDADO_CHAT' && '🔴 NO RECOMENDADO PARA CHAT: Alto riesgo de errores en credenciales y cuentas'}
                {hiringVerdict.recommendation === 'DESCARTADO_BAJA_PRECISION' && '🔴 DESCARTADO: Baja precisión técnica en resolución de incidencias'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                {hiringVerdict.rejectionReasons}
              </p>
            </div>
          )}

          {/* Análisis Detallado Caso por Caso */}
          <div className="space-y-4 pt-4 border-t border-gray-150 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">
              Auditoría y Retroalimentación de los Casos Reales
            </h3>

            {REAL_CASES.map((c, idx) => {
              const selectedIdx = selectedAnswers[idx];
              const isCorrect = selectedIdx !== undefined && selectedIdx !== -1 && c.options[selectedIdx]?.isCorrect;
              const timeSpent = answersTimeSpent[idx] || 0;

              return (
                <div key={c.id} className={`p-5 rounded-2xl border transition-all ${
                  isCorrect 
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40' 
                    : 'bg-rose-50/40 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-500">
                      Caso #{idx + 1}: {c.category} ({c.clientName})
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400 font-mono">{timeSpent}s</span>
                      {isCorrect ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correcto
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded-md">
                          <XCircle className="w-3.5 h-3.5" /> Incorrecto / Tiempo
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    Mensaje del cliente: "{c.clientMessage}"
                  </p>

                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 bg-white/70 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-150 dark:border-gray-750">
                    <span className="font-bold block text-gray-700 dark:text-gray-200 mb-0.5">
                      💡 Explicación del Estándar Sheerit:
                    </span>
                    {c.options.find(o => o.isCorrect)?.explanation}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setStep('profile')}
              className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Realizar Otra Evaluación</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow hover:opacity-90 transition-all"
            >
              Imprimir / Guardar Certificado
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
