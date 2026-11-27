import React, { useMemo, useState } from 'react';
import {
  Bot,
  Sparkles,
  Volume2,
  Sliders,
  Ticket,
  Database,
  Receipt,
  BarChart3,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Send,
  Zap,
  Check,
  Plus,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useWhatsAppContact } from '../hooks/useWhatsAppContact';

interface BotModulesLandingPageProps {
  onNavigate?: (view: any) => void;
}

interface BasePlan {
  id: 'basic' | 'growth' | 'scale';
  name: string;
  price: number;
  messages: string;
  badge?: string;
  desc: string;
}

interface AddonModule {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  tag: string;
  description: string;
  exampleTitle: string;
  exampleText: string;
  bullets: string[];
  iconName: 'ocr' | 'billing' | 'tickets' | 'crm' | 'accounting' | 'rpa';
}

const BASE_PLANS: BasePlan[] = [
  {
    id: 'basic',
    name: 'Plan Básico',
    price: 30000,
    messages: '500 mensajes IA / mes',
    desc: 'Ideal para empezar a automatizar respuestas con tus audios, texto e imágenes sin riesgo de bloqueo.'
  },
  {
    id: 'growth',
    name: 'Plan Crecimiento',
    price: 55000,
    messages: '1.500 mensajes IA / mes',
    badge: 'Más elegido',
    desc: 'Para negocios con flujo diario de consultas que combinan atención automática + cierres manuales.'
  },
  {
    id: 'scale',
    name: 'Plan Alto Volumen',
    price: 95000,
    messages: '4.000 mensajes IA / mes',
    desc: 'Pensado para tiendas con alta rotación diaria de pedidos, pauta activa o varios asesores.'
  }
];

const INCLUDED_CORE_MODULES = [
  {
    icon: Volume2,
    title: 'Flujos Audio + Imagen + Texto (Sin "Reenviado")',
    desc: 'Sube tus notas de voz, adjunta imágenes y texto complementario. El bot graba en tiempo real como humano y los envía sin etiqueta de reenviado.'
  },
  {
    icon: Sliders,
    title: 'Modo Semiautomático + Chats en Vivo 1 Clic',
    desc: 'Cuando tú escribes desde tu celular para cerrar una venta, el bot se pausa automáticamente en ese chat. Además puedes disparar flujos con un botón.'
  },
  {
    icon: Sparkles,
    title: 'Panel de Ajustes de Mejora con IA',
    desc: 'Pregunta por qué el bot eligió un audio o respuesta y aprueba mejoras en lenguaje práctico, con botón para deshacer cambios al instante.'
  }
];

const ADDON_MODULES: AddonModule[] = [
  {
    id: 'ocr',
    title: 'Validación Automática de Pagos (OCR IA)',
    subtitle: 'Lee comprobantes reales 24/7 sin que tengas que revisarlos a mano',
    price: 25000,
    tag: 'Ahorra horas diarias',
    description:
      'Nuestro motor visual lee comprobantes enviados por WhatsApp (Nequi, Bancolombia incluido modo oscuro, Daviplata, QR Bre-V y transferencias), valida monto, destino, fecha y evita comprobantes repetidos o falsos.',
    exampleTitle: 'Ejemplo real en operación:',
    exampleText:
      'Un cliente envía captura de transferencia de $89.900 a las 11:20 PM. El módulo verifica en segundos que el monto, fecha y destinatario coincidan, aprueba la entrega o registra el abono automáticamente y guarda respaldo de auditoría.',
    bullets: [
      'Detecta comprobantes de Bancolombia (modo claro y oscuro), Nequi, Daviplata y Bre-V',
      'Extrae valor exacto, fecha, hora y referencia de aprobación',
      'Si una imagen llega borrosa o dudosa, la escala a validación manual sin rechazar al cliente'
    ],
    iconName: 'ocr'
  },
  {
    id: 'billing',
    title: 'Cobros y Recordatorios Automáticos',
    subtitle: 'Cobra renovaciones o cuotas sin perseguir clientes manualmente',
    price: 20000,
    tag: 'Recupera cartera',
    description:
      'Automatiza avisos amigables antes del vencimiento, el día de corte y días después, incluyendo total a pagar, desglose y medios de pago exactos. Bloquea cobros si el cliente ya renovó.',
    exampleTitle: 'Ejemplo real en operación:',
    exampleText:
      'A las 9:00 AM el sistema revisa quién vence hoy o mañana y envía mensaje personalizado con el valor exacto y llave Bre-V o cuenta bancaria. Si el cliente ya pagó anoche, el bloqueo inteligente impide volverlo a molestar.',
    bullets: [
      'Programación por días antes/después del vencimiento',
      'Desglose automático si un cliente maneja varios productos o líneas',
      'Bloqueo de seguridad que cruza fechas reales para cero cobros indebidos'
    ],
    iconName: 'billing'
  },
  {
    id: 'tickets',
    title: 'Ticketera Multiasistente y Turnos',
    subtitle: 'Varios asesores atendiendo desde un mismo WhatsApp con orden',
    price: 35000,
    tag: 'Trabajo en equipo',
    description:
      'Organiza todas las conversaciones que requieren atención humana en una consola web colaborativa: asigna turnos consecutivos reales, reparte chats por asesor y mide resoluciones diarias.',
    exampleTitle: 'Ejemplo real en operación:',
    exampleText:
      'Cuando 15 clientes piden hablar con un asesor, cada uno recibe su Turno #1, #2, #3... Tus 2 o 5 vendedores entran desde su navegador a su bandeja asignada y cierran tickets sin pisarse entre ellos ni duplicar respuestas.',
    bullets: [
      'Número de turno automático en vivo para tus clientes',
      'Bandeja por asesor ("Mis Tickets"), reasignación y notas internas',
      'Métricas reales de chats resueltos por persona (sin inflar números)'
    ],
    iconName: 'tickets'
  },
  {
    id: 'crm',
    title: 'Base de Datos CRM y Control de Clientes',
    subtitle: 'Historial completo, vencimientos y búsquedas en milisegundos',
    price: 25000,
    tag: 'Orden total',
    description:
      'Centraliza clientes, teléfonos normalizados, productos activos, fechas de vencimiento, notas y stock disponible en un panel web rápido con opción de sincronizar hojas de Excel / OneDrive.',
    exampleTitle: 'Ejemplo real en operación:',
    exampleText:
      'Buscas a un cliente por nombre o por sus últimos dígitos (con o sin prefijo 57), ves qué compró, cuándo vence, qué mensajes recibió y puedes renovar o liberar su cupo con 1 clic.',
    bullets: [
      'Búsqueda instantánea flexible por teléfono, nombre o servicio',
      'Vista de stock y disponibilidad por producto en tiempo real',
      'Compatible con sincronización bidireccional Excel Online / OneDrive'
    ],
    iconName: 'crm'
  },
  {
    id: 'accounting',
    title: 'Contabilidad, Flujo de Caja y Analítica',
    subtitle: 'Descubre exactamente cuánto entra, cuánto sale y tu utilidad real',
    price: 30000,
    tag: 'Control financiero',
    description:
      'Registra ingresos automáticos por ventas/renovaciones, gastos por proveedor o pauta, costos reales y márgenes por producto en tableros diarios y mensuales listos para tomar decisiones.',
    exampleTitle: 'Ejemplo real en operación:',
    exampleText:
      'Cada pago validado suma automáticamente al flujo de caja del día. Al final de la semana ves tus ingresos brutos, egresos por envíos/inventario o pauta y la utilidad neta real en COP.',
    bullets: [
      'Libro diario automático de ingresos y egresos con categoría y medio de pago',
      'Alertas de rentabilidad negativa o productos con bajo margen',
      'Gráficos por día, mes y comparativa de plataformas o líneas de venta'
    ],
    iconName: 'accounting'
  },
  {
    id: 'rpa',
    title: 'Automatización RPA y Entrega de Códigos 2FA',
    subtitle: 'Robots web que inician sesión, consultan portales o entregan códigos solos',
    price: 40000,
    tag: 'Nivel Avanzado',
    description:
      'Automatizamos tareas repetitivas en portales externos o bandejas de correo: lectura de códigos OTP/2FA en vivo, creación de accesos o consultas en portales administrativos sin intervención humana.',
    exampleTitle: 'Ejemplo real en operación:',
    exampleText:
      'El cliente pide su código de acceso o consulta de guía en WhatsApp; el robot entra al correo o portal correspondiente en segundos, extrae el código exacto o estado y se lo entrega al cliente automáticamente.',
    bullets: [
      'Extracción automática de códigos de verificación / OTP por correo o web',
      'Navegación programada en portales sin API pública',
      'Trazabilidad completa de cada ejecución en logs'
    ],
    iconName: 'rpa'
  }
];

const formatCop = (val: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(val);

export function BotModulesLandingPage({ onNavigate }: BotModulesLandingPageProps) {
  const { getWaLink } = useWhatsAppContact();
  const [selectedPlanId, setSelectedPlanId] = useState<'basic' | 'growth' | 'scale'>('basic');
  const [selectedAddons, setSelectedAddons] = useState<string[]>(['ocr']);

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const selectedPlan = BASE_PLANS.find(p => p.id === selectedPlanId) || BASE_PLANS[0];

  const pricing = useMemo(() => {
    const picked = ADDON_MODULES.filter(m => selectedAddons.includes(m.id));
    const addonsSubtotal = picked.reduce((acc, item) => acc + item.price, 0);
    const hasBundleDiscount = picked.length >= 3;
    const discountAmount = hasBundleDiscount ? Math.round(addonsSubtotal * 0.15) : 0;
    const totalMonthly = selectedPlan.price + addonsSubtotal - discountAmount;
    return { picked, addonsSubtotal, hasBundleDiscount, discountAmount, totalMonthly };
  }, [selectedPlan, selectedAddons]);

  const handleRequestQuote = () => {
    const addonNames = pricing.picked.length > 0
      ? pricing.picked.map(a => `• ${a.title} (+${formatCop(a.price)})`).join('\n')
      : '• Solo Plan Base (sin módulos extra por ahora)';

    const msg =
      `Hola Sheerit! Vengo de https://sheerit.co/modulos y quiero cotizar/activar mi suite:\n\n` +
      `📦 *Plan Base:* ${selectedPlan.name} (${selectedPlan.messages}) — ${formatCop(selectedPlan.price)}/mes\n` +
      `🧩 *Módulos seleccionados:*\n${addonNames}\n` +
      (pricing.hasBundleDiscount ? `🏷️ *Descuento combo 3+ módulos (15%):* -${formatCop(pricing.discountAmount)}\n` : '') +
      `\n💰 *Total mensual estimado:* ${formatCop(pricing.totalMonthly)} COP/mes`;

    window.open(getWaLink(msg), '_blank');
  };

  const renderIcon = (name: AddonModule['iconName']) => {
    switch (name) {
      case 'ocr':
        return <Receipt className="w-6 h-6 text-emerald-400" />;
      case 'billing':
        return <Clock className="w-6 h-6 text-teal-400" />;
      case 'tickets':
        return <Ticket className="w-6 h-6 text-cyan-400" />;
      case 'crm':
        return <Database className="w-6 h-6 text-sky-400" />;
      case 'accounting':
        return <BarChart3 className="w-6 h-6 text-emerald-400" />;
      case 'rpa':
        return <Cpu className="w-6 h-6 text-indigo-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Topbar */}
      <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight text-white">Sheerit Bot Studio & Suite</div>
              <div className="text-[11px] text-slate-400">Ecosistema modular sobre WhatsApp Web real</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="#calculadora"
              className="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 text-xs font-semibold text-slate-200"
            >
              Calcular Plan
            </a>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('mibot')}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white"
            >
              Ir a Mi Bot
            </button>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('home')}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:text-white text-xs text-slate-400 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Inicio
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-14 pb-16 border-b border-slate-900">
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[11px] font-bold tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4" /> Misma tecnología anti-bloqueo de Sheerit • Activa solo lo que uses
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Empieza con tu Bot de Audios desde{' '}
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              $30.000/mes
            </span>{' '}
            y escala por módulos
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto leading-relaxed">
            No pagues software costoso por funciones que todavía no necesitas. Conectas tu propio WhatsApp Web real con comportamiento humano, y a medida que creces activas <strong>validación OCR de pagos</strong>, <strong>ticketera multiasistente</strong>, <strong>cobros automáticos</strong>, <strong>CRM</strong> o <strong>contabilidad</strong> sobre la misma línea.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#modulos"
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-sm font-bold text-white flex items-center gap-2 shadow-lg shadow-teal-950/50"
            >
              Ver módulos y ejemplos <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#calculadora"
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sm font-semibold text-slate-100 flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-emerald-400" /> Armar mi plan en vivo
            </a>
          </div>
        </div>
      </section>

      {/* Core Included + Base Plans */}
      <section className="max-w-6xl mx-auto px-4 py-14 space-y-10">
        <div className="space-y-3 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Paso 1 • Incluido desde el día 1</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Todo plan base ya incluye el motor completo de WhatsApp IA</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {INCLUDED_CORE_MODULES.map(item => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="bg-slate-900/90 border border-emerald-500/25 rounded-2xl p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Incluido
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* 3 Base Plans */}
        <div className="grid md:grid-cols-3 gap-4 pt-2">
          {BASE_PLANS.map(plan => {
            const active = selectedPlanId === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`cursor-pointer rounded-2xl p-5 border transition flex flex-col justify-between gap-4 ${
                  active
                    ? 'bg-teal-950/40 border-teal-400 shadow-lg shadow-teal-950/40'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    {plan.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-white">{formatCop(plan.price)}</span>
                    <span className="text-xs text-slate-400">/ mes</span>
                  </div>
                  <div className="text-xs font-semibold text-teal-300">{plan.messages}</div>
                  <p className="text-xs text-slate-400 leading-relaxed pt-1">{plan.desc}</p>
                </div>

                <div className={`text-xs font-semibold py-2 px-3 rounded-xl text-center border ${
                  active
                    ? 'bg-teal-600 border-teal-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}>
                  {active ? 'Plan Base Seleccionado ✓' : 'Elegir como Plan Base'}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Detailed Add-on Modules */}
      <section id="modulos" className="max-w-6xl mx-auto px-4 py-12 space-y-8 border-t border-slate-900">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Paso 2 • Módulos Activables Bajo Demanda</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Explora cada módulo con ejemplos reales y precios claros</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
            Activa uno o combina 3 o más para recibir automáticamente <strong className="text-emerald-300">15% de descuento</strong> en todos los módulos extra.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {ADDON_MODULES.map(mod => {
            const isPicked = selectedAddons.includes(mod.id);
            return (
              <div
                key={mod.id}
                className={`rounded-2xl p-6 border transition flex flex-col justify-between gap-5 ${
                  isPicked
                    ? 'bg-slate-900 border-teal-500/60 shadow-lg shadow-teal-950/30'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                        {renderIcon(mod.iconName)}
                      </div>
                      <div>
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 mb-1">
                          {mod.tag}
                        </span>
                        <h3 className="text-lg font-bold text-white leading-snug">{mod.title}</h3>
                        <p className="text-xs text-slate-400">{mod.subtitle}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-lg font-black text-emerald-300">+{formatCop(mod.price)}</div>
                      <div className="text-[11px] text-slate-500">/ mes</div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{mod.description}</p>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-teal-500/20 space-y-1">
                    <div className="text-[11px] font-bold text-teal-300">{mod.exampleTitle}</div>
                    <p className="text-xs text-slate-300 leading-relaxed">{mod.exampleText}</p>
                  </div>

                  <ul className="space-y-1.5">
                    {mod.bullets.map(b => (
                      <li key={b} className="text-xs text-slate-300 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => toggleAddon(mod.id)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border ${
                    isPicked
                      ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-slate-200'
                  }`}
                >
                  {isPicked ? (
                    <>
                      <Check className="w-4 h-4" /> Agregado a mi cotización
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Agregar módulo (+{formatCop(mod.price)}/mes)
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Interactive Calculator & CTA */}
      <section id="calculadora" className="max-w-5xl mx-auto px-4 py-14 border-t border-slate-900">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 border border-teal-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="grid md:grid-cols-5 gap-6 items-start">
            <div className="md:col-span-3 space-y-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-300 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Arma tu Suite a la Medida
              </div>
              <h2 className="text-2xl font-extrabold text-white">Calcula tu mensualidad exacta</h2>
              <p className="text-xs text-slate-400">
                Marca los módulos que quieres activar sobre tu número de WhatsApp. Si eliges 3 o más módulos adicionales se aplica 15% de descuento automático en los módulos.
              </p>

              <div className="space-y-2 pt-1">
                <div className="text-xs font-semibold text-slate-300">1. Elige capacidad de mensajes IA:</div>
                <div className="grid grid-cols-3 gap-2">
                  {BASE_PLANS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        selectedPlanId === p.id
                          ? 'bg-teal-600/25 border-teal-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold">{p.name}</div>
                      <div className="text-[11px] text-teal-300 font-semibold">{formatCop(p.price)}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="text-xs font-semibold text-slate-300">2. Módulos adicionales activables:</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {ADDON_MODULES.map(m => {
                    const checked = selectedAddons.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border cursor-pointer text-xs transition ${
                          checked
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAddon(m.id)}
                            className="accent-teal-500 w-4 h-4 shrink-0"
                          />
                          <span className="truncate font-medium">{m.title.split('(')[0].trim()}</span>
                        </span>
                        <span className="font-mono text-[11px] text-emerald-300 shrink-0">+{formatCop(m.price)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Summary box */}
            <div className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="text-sm font-bold text-white border-b border-slate-800 pb-2.5">Resumen de tu configuración</div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>{selectedPlan.name} ({selectedPlan.messages})</span>
                  <span className="font-mono font-semibold text-white">{formatCop(selectedPlan.price)}</span>
                </div>

                {pricing.picked.map(item => (
                  <div key={item.id} className="flex justify-between text-slate-400">
                    <span className="truncate pr-2">+ {item.title.split('(')[0].trim()}</span>
                    <span className="font-mono shrink-0">{formatCop(item.price)}</span>
                  </div>
                ))}

                {pricing.hasBundleDiscount && (
                  <div className="flex justify-between text-emerald-400 font-semibold pt-1 border-t border-slate-800">
                    <span>Descuento combo 3+ módulos (15%)</span>
                    <span className="font-mono">-{formatCop(pricing.discountAmount)}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-baseline justify-between">
                <span className="text-xs font-semibold text-slate-400">Total mensual</span>
                <div className="text-right">
                  <div className="text-2xl font-black text-teal-300">{formatCop(pricing.totalMonthly)}</div>
                  <div className="text-[11px] text-slate-500">COP / mes • Sin cláusulas de permanencia</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRequestQuote}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
              >
                <Send className="w-4 h-4" /> Activar esta configuración por WhatsApp
              </button>

              <p className="text-[11px] text-slate-500 text-center">
                ¿Ya tienes cuenta? Los módulos extras se activan sin perder tus audios ni tu sesión actual de WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Anti-ban & Tech reassurance */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="grid sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5">
            <div className="font-bold text-teal-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Sesión Real WhatsApp Web
            </div>
            <p className="text-slate-400 leading-relaxed">
              Usamos sesión aislada en navegador real (la misma arquitectura probada en Sheerit) con pausas humanas y notas de voz frescas sin etiqueta de reenviado.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5">
            <div className="font-bold text-teal-300 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" /> Control Semiautomático
            </div>
            <p className="text-slate-400 leading-relaxed">
              Nunca pierdes el control de tus ventas: si escribes desde tu celular, el bot cede el turno automáticamente y solo retoma cuando tú decidas.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5">
            <div className="font-bold text-teal-300 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" /> Crecimiento sin Migrar
            </div>
            <p className="text-slate-400 leading-relaxed">
              Puedes empezar hoy con el Plan de $30.000/mes e ir encendiendo OCR, Cobros o Ticketera cuando tu negocio lo pida.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
