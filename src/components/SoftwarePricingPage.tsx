import React, { useMemo, useState } from 'react';
import { useWhatsAppContact } from '../hooks/useWhatsAppContact';
import { WhatsAppBotSimulatorModal } from './WhatsAppBotSimulatorModal';
import { InteractiveAppWebStudio } from './InteractiveAppWebStudio';
import {
  BotModulesShowcase,
  BASE_PLANS,
  MODULES_CATALOG,
  formatCop,
  type BasePlanId,
  type ModuleId
} from './BotModulesLandingPage';
import { Bot, Heart, MessageCircle, Film, Send } from 'lucide-react';
import { Shield, Sparkles, Server, Clock, Code, Award, CheckCircle2, MessageSquare, ArrowRight, Database, Settings, Zap, ArrowLeftRight, Check, ChevronLeft, ChevronRight, Laptop, Globe, Smartphone, ExternalLink } from 'lucide-react';

interface AiPlanRecommendation {
  planId: BasePlanId;
  addons: ModuleId[];
  reasoning: string;
  suggestAppWeb: boolean;
  originalPrompt: string;
}

const normalizePrompt = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

function buildAiRecommendation(rawText: string): AiPlanRecommendation {
  const clean = normalizePrompt(rawText.trim());
  const hasAny = (keywords: string[]) => keywords.some(k => clean.includes(k));

  const detectedAddons: ModuleId[] = [];
  if (hasAny(['pago', 'pagos', 'nequi', 'bancolombia', 'daviplata', 'comprobante', 'captura', 'transferencia', 'ocr', 'bre-v', 'brev', 'consignacion'])) {
    detectedAddons.push('ocr');
  }
  if (hasAny(['cobro', 'cobros', 'cobrar', 'recordatorio', 'vencimiento', 'cartera', 'mensualidad', 'renovacion', 'mora', 'cuota'])) {
    detectedAddons.push('billing');
  }
  if (hasAny(['asesor', 'asesores', 'equipo', 'turno', 'turnos', 'ticket', 'ticketera', 'soporte', 'vendedor', 'vendedores', 'multiagente', 'varios'])) {
    detectedAddons.push('tickets');
  }
  if (hasAny(['excel', 'base de datos', 'crm', 'cliente', 'clientes', 'inventario', 'stock', 'onedrive', 'sql', 'registro', 'planilla'])) {
    detectedAddons.push('crm');
  }
  if (hasAny(['contabilidad', 'caja', 'gasto', 'gastos', 'utilidad', 'ganancia', 'finanzas', 'balance', 'egreso', 'ingreso', 'flujo'])) {
    detectedAddons.push('accounting');
  }
  if (hasAny(['codigo', 'codigos', 'otp', '2fa', 'portal', 'rpa', 'correo', 'gmail', 'streaming', 'netflix', 'pin'])) {
    detectedAddons.push('rpa');
  }

  const suggestAppWeb = hasAny(['app', 'aplicacion', 'android', 'ios', 'web', 'pagina', 'landing', 'tienda online', 'sitio']);
  const isScaleSignal =
    detectedAddons.length >= 2 ||
    hasAny(['alto volumen', 'muchos', 'empresa', 'equipo', 'asesores', 'multiagente', '2000']);
  const isProSignal =
    detectedAddons.length === 1 ||
    hasAny(['audio', 'voz', 'imagen', 'foto', 'catalogo', 'semiautomatico', 'vender', 'ventas', 'tienda', 'negocio', 'bot']);
  const isStarterSignal =
    detectedAddons.length === 0 &&
    hasAny(['empezar', 'basico', 'economico', 'barato', 'personal', 'menu', 'horario', 'prueba', 'sencillo', 'pequeno']);

  let planId: BasePlanId = 'pro';
  if (isScaleSignal) {
    planId = 'scale';
  } else if (isStarterSignal || (!isProSignal && clean.length > 0 && clean.length < 22)) {
    planId = 'starter';
  }

  let reasoning = '';
  if (planId === 'scale') {
    reasoning =
      'Por tu volumen u operación multi-módulo te conviene el Plan Scale ($60k): incluye el Módulo Automejorable, Flujos Audio+Imagen, 2.000 mensajes IA y hasta 3 módulos avanzados a gusto incluidos ($0).';
  } else if (planId === 'pro') {
    reasoning =
      'El Plan Pro ($30k) encaja ideal contigo: ya incluye Módulo Automejorable, Flujos Audio+Imagen sin reenviado, Modo Semiautomático y 1 módulo avanzado a gusto sin costo extra ($0).';
  } else {
    reasoning =
      'Para arrancar ágil y económico te armamos el Plan Starter ($10k): incluye menús programables, 50 mensajes IA y el Módulo Automejorable con IA integrado (y puedes sumarle módulos cuando quieras).';
  }

  return {
    planId,
    addons: detectedAddons,
    reasoning,
    suggestAppWeb,
    originalPrompt: rawText.trim()
  };
}

export function SoftwarePricingPage({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const [activeTrack, setActiveTrack] = useState<'bot' | 'apps'>('bot');
  const [needInput, setNeedInput] = useState('');
  const [aiPlan, setAiPlan] = useState<AiPlanRecommendation | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<BasePlanId>('pro');
  const [selectedAddons, setSelectedAddons] = useState<ModuleId[]>(['ocr']);
  const [syncVersion, setSyncVersion] = useState(0);
  const { getWaLink } = useWhatsAppContact();

  const addonModules = useMemo(() => MODULES_CATALOG.filter(m => !m.includedInBase), []);

  const livePricing = useMemo(() => {
    const plan = BASE_PLANS.find(p => p.id === selectedPlanId) || BASE_PLANS[1];
    const picked = addonModules.filter(m => selectedAddons.includes(m.id));
    const freeSlots = plan.includedAddonSlots;
    const includedPicked = picked.slice(0, freeSlots);
    const extraPicked = picked.slice(freeSlots);
    const addonsSubtotal = extraPicked.reduce((acc, item) => acc + item.price, 0);
    const hasBundleDiscount = extraPicked.length >= 3;
    const discountAmount = hasBundleDiscount ? Math.round(addonsSubtotal * 0.15) : 0;
    const totalMonthly = plan.price + addonsSubtotal - discountAmount;
    const remainingFreeSlots = Math.max(0, freeSlots - picked.length);
    return {
      plan,
      picked,
      includedPicked,
      extraPicked,
      freeSlots,
      remainingFreeSlots,
      hasBundleDiscount,
      discountAmount,
      totalMonthly
    };
  }, [selectedPlanId, selectedAddons, addonModules]);

  const applySelection = (planId: BasePlanId, addons: ModuleId[]) => {
    setSelectedPlanId(planId);
    setSelectedAddons(addons);
    setSyncVersion(v => v + 1);
    setAiPlan(prev => (prev ? { ...prev, planId, addons } : prev));
  };

  const goToTrack = (track: 'bot' | 'apps', anchorId?: string) => {
    setActiveTrack(track);
    if (anchorId) {
      setTimeout(() => {
        document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  };

  const handleBuildAiPlan = (promptOverride?: string) => {
    const query = (promptOverride ?? needInput).trim();
    const effectiveQuery =
      query || 'Quiero automatizar mi WhatsApp para vender más y mejorar mis respuestas';
    if (!query) setNeedInput(effectiveQuery);
    else if (promptOverride) setNeedInput(promptOverride);

    const rec = buildAiRecommendation(effectiveQuery);
    setActiveTrack('bot');
    setAiPlan(rec);
    setSelectedPlanId(rec.planId);
    setSelectedAddons(rec.addons);
    setSyncVersion(v => v + 1);
  };

  const handleToggleAiAddon = (id: ModuleId) => {
    const exists = selectedAddons.includes(id);
    const next = exists ? selectedAddons.filter(x => x !== id) : [...selectedAddons, id];
    applySelection(selectedPlanId, next);
  };

  const handleActivateLiveConfig = () => {
    const includedLines = livePricing.includedPicked.map(a => `• ${a.shortTitle} (Incluido en plan — $0)`);
    const extraLines = livePricing.extraPicked.map(a => `• ${a.shortTitle} (+${formatCop(a.price)})`);
    const modulesSummary = [...includedLines, ...extraLines];
    const promptLine = aiPlan?.originalPrompt
      ? `💬 *Lo que necesito:* "${aiPlan.originalPrompt}"\n`
      : '';
    const msg =
      `¡Hola Sheerit! Configuré mi plan en https://sheerit.co/software:\n\n` +
      promptLine +
      `📦 *Plan elegido:* ${livePricing.plan.name} (${formatCop(livePricing.plan.price)}/mes)\n` +
      `🧩 *Módulos configurados:*\n${modulesSummary.length > 0 ? modulesSummary.join('\n') : '• Plan base + Módulo Automejorable con IA'}\n` +
      (livePricing.hasBundleDiscount ? `🏷️ *Descuento combo 3+ extras (15%):* -${formatCop(livePricing.discountAmount)}\n` : '') +
      `\n💰 *Total mensual estimado:* ${formatCop(livePricing.totalMonthly)} COP/mes`;
    window.open(getWaLink(msg), '_blank');
  };

  const handleOpenInInspector = () => {
    setActiveTrack('bot');
    setTimeout(() => {
      document.getElementById('modulos-bot')?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const handleContactWhatsApp = (planType: string) => {
    const message = `Hola Sheerit! Estoy interesado en sus servicios de desarrollo de software, apps móviles iOS/Android y automatización (Opción: ${planType}). Me gustaría agendar una asesoría para mi proyecto.`;
    window.open(getWaLink(message), '_blank');
  };

  const cases = [
    {
      title: "Centros de Atención Multicanal & Multiagente (Helpdesk)",
      badge: "Soporte & Ventas",
      desc: "Perfecto para empresas que gestionan un alto volumen de clientes por WhatsApp. Centraliza tu soporte en un panel web colaborativo:",
      steps: [
        "Múltiples asesores chatean desde un único número oficial de WhatsApp con distribución inteligente de chats.",
        "Integración nativa con inteligencia artificial (IA) para auto-responder consultas comunes y resolver soporte 24/7.",
        "Historial unificado de clientes, auditorías de asesores y métricas de rendimiento en tiempo real."
      ],
      metrics: [
        { label: "Tiempo de espera del cliente", value: "Reducido a segundos" },
        { label: "Tasa de auto-resolución (IA)", value: "70% de las consultas" },
        { label: "Colaboración del equipo", value: "Panel multiagente centralizado" }
      ]
    },
    {
      title: "Automatización de Procesos de Negocio (RPA & Bots Inteligentes)",
      badge: "Operaciones & Eficiencia",
      desc: "Bots de automatización robótica de procesos (RPA) que realizan tareas repetitivas imitando el comportamiento humano:",
      steps: [
        "Creación automática de cuentas, perfiles o accesos en plataformas SaaS sin intervención manual.",
        "Verificación en tiempo real y lectura automatizada de códigos de seguridad (2FA / OTP) de correos electrónicos.",
        "Sincronización masiva de bases de datos entre hojas de cálculo (Excel) y bases de datos relacionales SQL."
      ],
      metrics: [
        { label: "Tiempo de ejecución de tareas", value: "-95% más rápido que un humano" },
        { label: "Precisión operativa", value: "100% libre de errores manuales" },
        { label: "Disponibilidad del bot", value: "24 horas al día, 7 días a la semana" }
      ]
    },
    {
      title: "Portales de Autogestión Segura para Usuarios y Clientes",
      badge: "Experiencia del Cliente",
      desc: "Brinda a tus clientes o usuarios finales un canal web inmediato para consultar su estado sin tener que llamar o escribir:",
      steps: [
        "Acceso seguro e inmediato introduciendo un identificador único (cédula, código de cliente o número de registro).",
        "Consulta de credenciales activas, fechas de vencimiento de servicios y estado de facturación.",
        "Generación automática de archivos PDF de soporte y descarga de archivos planos de cobro."
      ],
      metrics: [
        { label: "Saturación del canal telefónico/chat", value: "-80% de consultas informativas" },
        { label: "Satisfacción de los clientes", value: "Acceso a sus datos en 2 clics" },
        { label: "Seguridad y privacidad", value: "Cumplimiento estricto de Habeas Data" }
      ]
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % cases.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + cases.length) % cases.length);
  };

  return (
    <div className="min-h-screen bg-[#050A12] text-slate-100 transition-colors duration-300 animate-fadeIn software-page-root">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24 border-b border-teal-500/15 bg-[#030710]">
        {/* 3D Architectural Liquid Obsidian Backdrop */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60 pointer-events-none scale-105"
          style={{ backgroundImage: "url('/assets/software_hero_bg.jpg')" }}
        />
        {/* Legibility Gradient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050A12]/70 via-[#050A12]/55 to-[#050A12] pointer-events-none software-hero-vignette" />
        {/* Subtle Cyber Grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-80"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(45, 212, 191, 0.08) 1px, transparent 0)',
            backgroundSize: '28px 28px'
          }}
        />

        <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 backdrop-blur-md border border-teal-500/30 mb-6">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-mono font-bold text-teal-300 uppercase tracking-wider">
              Ingeniería Web, Apps iOS/Android & Automatización IA
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight drop-shadow-lg">
            Desarrollo de Software, Apps Móviles <br />
            <span className="bg-gradient-to-r from-teal-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              & Automatizaciones a la Medida
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-200 max-w-3xl mx-auto mb-10 leading-relaxed drop-shadow">
            Diseñamos plataformas web de alto rendimiento, aplicaciones nativas para <strong className="text-white">iOS (App Store)</strong> y <strong className="text-white">Android (Google Play)</strong>, y bots modulares en WhatsApp Web real para escalar tu operación.
          </p>

          {/* Single Centered AI Command Bar */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleBuildAiPlan();
            }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-slate-900/85 backdrop-blur-xl border border-teal-400/40 focus-within:border-teal-300 shadow-[0_0_40px_-12px_rgba(20,184,166,0.45)] rounded-2xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 transition-all">
              <div className="flex items-center gap-2.5 flex-1 px-3 py-1.5">
                <Bot className="w-5 h-5 text-teal-400 shrink-0" />
                <input
                  type="text"
                  value={needInput}
                  onChange={e => setNeedInput(e.target.value)}
                  placeholder="¿Qué necesitas? Ej: Vendo por WhatsApp con audios, validar pagos Nequi y cobrar..."
                  className="w-full bg-transparent text-sm md:text-base text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-950/50 transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Armar mi Plan con IA</span>
              </button>
            </div>
          </form>

          {/* 4 Quick-Prompt Chips */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            {[
              'Vender con audios + validar Nequi',
              'Cobros automáticos + base de datos',
              'Equipo de asesores + contabilidad',
              'Bot básico económico para empezar'
            ].map(chip => (
              <button
                key={chip}
                type="button"
                onClick={() => handleBuildAiPlan(chip)}
                className="px-3 py-1.5 rounded-full bg-slate-900/75 hover:bg-slate-800/90 border border-slate-700/80 hover:border-teal-400/50 text-[11px] sm:text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                ✨ {chip}
              </button>
            ))}
          </div>

          {/* Interactive AI Plan Result Panel */}
          {aiPlan && (
            <div className="mt-6 max-w-4xl mx-auto text-left bg-slate-900/90 backdrop-blur-2xl border border-teal-400/45 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-teal-950/60 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/15 border border-teal-400/35 text-[11px] font-mono font-bold text-teal-300 uppercase">
                    <Sparkles className="w-3.5 h-3.5" /> Plan Armado por IA
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{aiPlan.reasoning}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase">Total mensual estimado</div>
                  <div className="text-2xl sm:text-3xl font-black text-teal-300">
                    {formatCop(livePricing.totalMonthly)}{' '}
                    <span className="text-xs font-semibold text-slate-400">COP/mes</span>
                  </div>
                </div>
              </div>

              {/* Plan Switcher Pills */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300">
                  1. Plan recomendado (cámbialo cuando quieras · todos incluyen Módulo Automejorable):
                </div>
                <div className="grid sm:grid-cols-3 gap-2.5">
                  {BASE_PLANS.map(p => {
                    const active = selectedPlanId === p.id;
                    const slotLabel =
                      p.includedAddonSlots === 0
                        ? '0 extras incluidos'
                        : p.includedAddonSlots === 1
                          ? '1 módulo a gusto GRATIS'
                          : `${p.includedAddonSlots} módulos a gusto GRATIS`;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applySelection(p.id, selectedAddons)}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                          active
                            ? 'bg-teal-500/20 border-teal-400 text-white shadow-lg'
                            : 'bg-slate-950/75 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black">{p.name}</span>
                          <span className="text-xs font-black text-teal-300">{formatCop(p.price)}</span>
                        </div>
                        <div className="text-[11px] text-emerald-300 font-semibold mt-1">{slotLabel}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6-Module Toggle Grid */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-300">
                    2. Agrega o quita módulos a tu medida:
                  </span>
                  {livePricing.freeSlots > 0 && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      Cupos gratis en {livePricing.plan.name}: {livePricing.includedPicked.length}/{livePricing.freeSlots}
                      {livePricing.remainingFreeSlots > 0 && ` · Elige ${livePricing.remainingFreeSlots} más sin costo`}
                    </span>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {addonModules.map(mod => {
                    const selected = selectedAddons.includes(mod.id);
                    const isIncludedFree = livePricing.includedPicked.some(i => i.id === mod.id);
                    const canTakeFree = !selected && livePricing.remainingFreeSlots > 0;
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => handleToggleAiAddon(mod.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 text-xs transition cursor-pointer ${
                          selected
                            ? 'bg-emerald-500/15 border-emerald-400/60 text-white'
                            : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                              selected
                                ? 'bg-emerald-400 border-emerald-400 text-slate-950'
                                : 'border-slate-600'
                            }`}
                          >
                            {selected && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          <span className="font-semibold truncate">{mod.shortTitle}</span>
                        </span>
                        {isIncludedFree ? (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
                            INCLUIDO ($0)
                          </span>
                        ) : canTakeFree ? (
                          <span className="text-[10px] font-mono text-teal-300 shrink-0">Gratis</span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">+{formatCop(mod.price)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleActivateLiveConfig}
                    className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Send className="w-4 h-4" /> Activar este Plan por WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenInInspector}
                    className="flex-1 sm:flex-initial px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-teal-400" /> Ver en Inspector de Módulos
                  </button>
                </div>
                {aiPlan.suggestAppWeb && (
                  <button
                    type="button"
                    onClick={() => goToTrack('apps', 'constructor-interactivo')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/35 text-xs font-bold text-cyan-300 hover:bg-cyan-500/25 transition cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" /> También vimos interés en App/Web ($200k / $79k) →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Minimal Centered Quick-Links Row */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-400">
            <button
              type="button"
              onClick={() => goToTrack('bot', 'bot-whatsapp')}
              className="hover:text-teal-300 transition font-medium cursor-pointer"
            >
              Planes Bot ($10k – $60k)
            </button>
            <span className="text-slate-700">·</span>
            <button
              type="button"
              onClick={() => goToTrack('bot', 'modulos-bot')}
              className="hover:text-teal-300 transition font-medium cursor-pointer"
            >
              Suite Modular IA & OCR
            </button>
            <span className="text-slate-700">·</span>
            <button
              type="button"
              onClick={() => goToTrack('apps', 'constructor-interactivo')}
              className="hover:text-teal-300 transition font-medium cursor-pointer"
            >
              Estudio App / Web ($200k / $79k)
            </button>
            <span className="text-slate-700">·</span>
            <button
              type="button"
              onClick={() => {
                if (onNavigate) {
                  onNavigate('portafolio');
                } else {
                  window.history.pushState({}, '', '/portafolio');
                  window.dispatchEvent(new Event('popstate'));
                }
              }}
              className="hover:text-teal-300 transition font-medium cursor-pointer"
            >
              Portafolio
            </button>
            <span className="text-slate-700">·</span>
            <button
              type="button"
              onClick={() => setIsBotModalOpen(true)}
              className="hover:text-teal-300 transition font-medium cursor-pointer"
            >
              Probar Demo Bot
            </button>
          </div>

          {/* Telemetry & Trust Strip */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 md:gap-6 text-xs text-slate-300">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/75 backdrop-blur-md border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-white">WhatsApp Web Anti-Bloqueo 24/7</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/75 backdrop-blur-md border border-slate-800">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-white">OCR + IA + Audios Nativos</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/75 backdrop-blur-md border border-slate-800">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-semibold text-white">Infraestructura Cloud Propia</span>
            </div>
          </div>
        </div>
        
        {/* Background shapes */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[420px] h-[420px] bg-teal-500/15 rounded-full blur-3xl z-0 pointer-events-none"></div>
        <div className="absolute top-1/3 right-1/4 -translate-y-1/2 translate-x-1/2 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl z-0 pointer-events-none"></div>
      </section>

      {/* Sticky Top Focus Switcher */}
      <div className="sticky top-0 z-30 bg-[#050A12]/90 backdrop-blur-xl border-b border-slate-800/90">
        <div className="max-w-xl mx-auto py-3 px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
            <button
              type="button"
              onClick={() => setActiveTrack('bot')}
              className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTrack === 'bot'
                  ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/20 border-teal-400/60 text-white shadow-sm'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Bot WhatsApp IA & Suite Modular</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTrack('apps')}
              className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTrack === 'apps'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border-cyan-400/60 text-white shadow-sm'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Apps ($200k), Web ($79k) & A Medida</span>
            </button>
          </div>
        </div>
      </div>

      {activeTrack === 'bot' ? (
        <>

      {/* Paso 1: Bot WhatsApp IA */}

      
      {/* SECCIÓN ESTRELLA: BOT DE WHATSAPP AUTOGESTIÓN CON IA */}
      <section id="bot-whatsapp" className="py-16 md:py-24 bg-[#070E1A] border-t border-teal-500/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-4 h-4" /> Paso 1 · Elige tu Plan Base WhatsApp IA
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white">
              Tu Asistente Personal & Negocio en WhatsApp
            </h2>
            <p className="text-sm md:text-base text-slate-300 mt-3 max-w-3xl mx-auto leading-relaxed">
              Diseñado para clientes reales: configura tu bot por audio o texto, pruébalo con <strong className="text-white">20 mensajes gratis en vivo</strong> y luego elige los módulos avanzados que quieras sumar abajo.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setIsBotModalOpen(true)}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 font-bold rounded-2xl transition-all text-sm flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> <span>Probar Demo Gratis (20 Mensajes IA)</span>
              </button>
            </div>
          </div>

          {/* 4 Modos Cotidianos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 hover:border-teal-500/35 transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center mb-3">
                  <Heart className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-base">Modo Pareja / Personal</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Respuestas cercanas si estás ocupado o manejando, recuerdos de fechas y mensajes programados.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/35 transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-base">Recordatorios & Citas</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  "Acuérdame pagar mañana a las 9am". Tu bot te manda un WhatsApp puntual con lo que tengas pendiente.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/35 transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-3">
                  <Film className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-base">Cinéfilo Sheerit</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Recomendaciones de películas y series en Netflix, Max o Disney+ según lo que tengas ganas de ver hoy.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/35 transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3">
                  <Bot className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-base">Ventas & Catálogo</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Entrega audios, imágenes y precios 24/7 sin etiqueta de reenviado ni dejar a nadie en visto.
                </p>
              </div>
            </div>
          </div>

          {/* Planes del Bot */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Starter */}
            <div
              className={`bg-slate-900/85 rounded-3xl p-8 shadow-xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                selectedPlanId === 'starter'
                  ? 'border-teal-400 ring-2 ring-teal-400 shadow-teal-950/50'
                  : 'border-slate-800 hover:border-emerald-500/40'
              }`}
            >
              <div>
                <span className="px-3 py-1 text-xs font-mono font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 rounded-full uppercase">
                  Plan Starter
                </span>
                <h3 className="text-2xl font-black text-white mt-3">Starter WhatsApp</h3>
                <p className="text-xs text-slate-400 mt-1 mb-6">
                  Ideal para empezar: mensajes programables y la cuota justa de inteligencia artificial.
                </p>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">$10.000 COP</span>
                    <span className="text-slate-400 text-sm">/ mes</span>
                  </div>
                  <p className="text-xs text-emerald-400 font-semibold mt-1">
                    *Prueba previa de 20 mensajes gratis incluida
                  </p>
                </div>
                <hr className="border-slate-800 my-6" />
                <ul className="space-y-3 mb-8 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Módulo Automejorable con IA:</strong> panel de Ajustes de Mejora para consultar decisiones del bot y revertir cambios en 1 clic</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">50 Mensajes con IA</strong> incluidos al mes</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Mensajes Programables Ilimitados:</strong> menús fijos, bienvenida y horarios</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>1 Número oficial de WhatsApp conectado</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>Entrevista interactiva con soporte de voz</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => {
                  applySelection('starter', selectedAddons);
                  document.getElementById('modulos-bot')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`w-full py-3.5 px-4 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer ${
                  selectedPlanId === 'starter'
                    ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-black shadow-lg'
                    : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white'
                }`}
              >
                {selectedPlanId === 'starter' ? (
                  <>✓ Plan Seleccionado (Ir a Módulos ↓)</>
                ) : (
                  <>Elegir Plan Starter ($10k)</>
                )}
              </button>
            </div>

            {/* Pro ($30.000) — Plan Estrella */}
            <div
              className={`bg-gradient-to-b from-teal-950/50 to-slate-900 rounded-3xl p-8 shadow-2xl border-2 transition-all flex flex-col justify-between relative overflow-hidden ${
                selectedPlanId === 'pro'
                  ? 'border-teal-400 ring-2 ring-teal-400 shadow-teal-950/60'
                  : 'border-teal-400/50 ring-1 ring-teal-500/20'
              }`}
            >
              <div className="absolute top-0 right-0 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                Más Elegido
              </div>
              <div>
                <span className="px-3 py-1 text-xs font-mono font-bold text-teal-300 bg-teal-500/15 border border-teal-500/35 rounded-full uppercase">
                  Plan Pro Negocio
                </span>
                <h3 className="text-2xl font-black text-white mt-3">Pro Asistente IA</h3>
                <p className="text-xs text-slate-300 mt-1 mb-6">
                  Para negocios con flujo constante que venden con audios naturales, cierres semiautomáticos y 1 módulo a gusto.
                </p>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-teal-300">$30.000 COP</span>
                    <span className="text-slate-400 text-sm">/ mes</span>
                  </div>
                  <p className="text-xs text-emerald-400 font-semibold mt-1">
                    *Listo para conectar hoy con QR o código de 8 dígitos
                  </p>
                </div>
                <hr className="border-slate-800 my-6" />
                <div className="mb-3 text-[11px] font-mono font-bold text-teal-300 bg-teal-500/10 border border-teal-500/25 rounded-xl px-3 py-1.5">
                  ✨ Todo lo del Plan Starter ($10k), más:
                </div>
                <ul className="space-y-3 mb-8 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">1 Módulo avanzado a gusto incluido ($0):</strong> elige libremente OCR Pagos, Cobros, Ticketera, CRM, Contabilidad o RPA</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">500 Mensajes con IA</strong> incluidos al mes</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Flujos Audio + Imagen + Texto:</strong> notas de voz naturales sin etiqueta de "Reenviado" + envío automático de fotos y texto</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Modo Semiautomático + 1 Clic:</strong> auto-pausa al intervenir tú y botones rápidos para disparar audios en vivo</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Conexión WhatsApp Web real anti-bloqueo</strong> (QR o código de 8 dígitos) y servidor 24/7</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => {
                  applySelection('pro', selectedAddons);
                  document.getElementById('modulos-bot')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`w-full py-3.5 px-4 font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer ${
                  selectedPlanId === 'pro'
                    ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-teal-950/50'
                    : 'bg-slate-800 hover:bg-slate-700 border border-teal-500/40 text-teal-300'
                }`}
              >
                {selectedPlanId === 'pro' ? (
                  <>✓ Plan Seleccionado (Ir a Módulos ↓)</>
                ) : (
                  <>Elegir Plan Pro ($30k)</>
                )}
              </button>
            </div>

            {/* Scale */}
            <div
              className={`bg-slate-900/85 rounded-3xl p-8 shadow-xl border transition-all flex flex-col justify-between ${
                selectedPlanId === 'scale'
                  ? 'border-cyan-400 ring-2 ring-cyan-400 shadow-cyan-950/50'
                  : 'border-slate-800 hover:border-cyan-500/40'
              }`}
            >
              <div>
                <span className="px-3 py-1 text-xs font-mono font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 rounded-full uppercase">
                  Plan Scale
                </span>
                <h3 className="text-2xl font-black text-white mt-3">Scale & Alto Volumen</h3>
                <p className="text-xs text-slate-400 mt-1 mb-6">
                  Para alto tráfico, 3 módulos avanzados a gusto incluidos y múltiples operadores.
                </p>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">$60.000 COP</span>
                    <span className="text-slate-400 text-sm">/ mes</span>
                  </div>
                  <p className="text-xs text-cyan-400 font-semibold mt-1">
                    *Máxima potencia para tu operación
                  </p>
                </div>
                <hr className="border-slate-800 my-6" />
                <div className="mb-3 text-[11px] font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 rounded-xl px-3 py-1.5">
                  🚀 Todo lo del Plan Pro ($30k), más:
                </div>
                <ul className="space-y-3 mb-8 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">3 Módulos avanzados a gusto incluidos ($0):</strong> combina libremente OCR Pagos, Cobros, Ticketera, Base de Datos CRM/Excel, Contabilidad o RPA 2FA</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">2.000 Mensajes con IA</strong> incluidos al mes (4x más capacidad)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Panel multiagente colaborativo:</strong> varios operadores en 1 solo WhatsApp</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Soporte prioritario directo por WhatsApp</strong> y monitoreo 24/7</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => {
                  applySelection('scale', selectedAddons);
                  document.getElementById('modulos-bot')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`w-full py-3.5 px-4 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer ${
                  selectedPlanId === 'scale'
                    ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-black shadow-lg'
                    : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white'
                }`}
              >
                {selectedPlanId === 'scale' ? (
                  <>✓ Plan Seleccionado (Ir a Módulos ↓)</>
                ) : (
                  <>Elegir Plan Scale ($60k)</>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Paso 2: SUITE MODULAR TECNOLÓGICA DE BOT WHATSAPP IA */}
      <BotModulesShowcase
        embedded
        onNavigate={onNavigate}
        externalPlanId={selectedPlanId}
        externalAddons={selectedAddons}
        syncVersion={syncVersion}
        onPlanChange={planId => {
          setSelectedPlanId(planId);
          setAiPlan(prev => (prev ? { ...prev, planId } : prev));
        }}
        onAddonsChange={addons => {
          setSelectedAddons(addons);
          setAiPlan(prev => (prev ? { ...prev, addons } : prev));
        }}
      />

      {/* Paso 3: Carrusel de Casos Reales en Operación */}
      <section id="cases" className="py-16 bg-[#050A12]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white">
              Casos Reales de Automatización
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Explora cómo ayudamos a las empresas a simplificar y agilizar sus flujos de trabajo diarios.
            </p>
          </div>

          <div className="relative bg-slate-900/85 rounded-3xl p-8 md:p-12 shadow-xl border border-slate-800 min-h-[400px] flex flex-col justify-between transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-fadeIn">
              <div>
                <span className="px-3 py-1 text-xs font-mono font-bold text-teal-300 bg-teal-500/15 border border-teal-500/30 rounded-full uppercase tracking-wider">
                  {cases[currentSlide].badge}
                </span>
                <h3 className="text-2xl md:text-3xl font-black text-white mt-4 mb-6">
                  {cases[currentSlide].title}
                </h3>
                <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                  {cases[currentSlide].desc}
                </p>
                <ul className="space-y-3 mb-8">
                  {cases[currentSlide].steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                <h4 className="font-mono font-bold text-xs text-slate-400 uppercase tracking-wider mb-4">
                  Impacto & Métricas Promedio
                </h4>
                <div className="space-y-4">
                  {cases[currentSlide].metrics.map((metric, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                      <span className="text-xs text-slate-400">{metric.label}</span>
                      <span className="font-bold text-emerald-400 text-sm">{metric.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-800">
              <div className="flex gap-2">
                {cases.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${currentSlide === idx ? 'bg-teal-400 w-6' : 'bg-slate-700'}`}
                    aria-label={`Ir al slide ${idx + 1}`}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={prevSlide}
                  className="p-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors"
                  aria-label="Caso anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="p-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors"
                  aria-label="Siguiente caso"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
        </>
      ) : (
        <>
      {/* CONSTRUCTOR & ESTUDIO INTERACTIVO (APP $200k / WEB $79k) */}
      <InteractiveAppWebStudio />

      {/* Pricing Comparison Section */}
      <section id="pricing-comparison" className="py-16 md:py-24 bg-[#070E1A] border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Opciones de Desarrollo & Esquemas de Inversión
            </h2>
            <p className="text-sm md:text-base text-slate-400 mt-2 max-w-3xl mx-auto">
              Elige el modelo que mejor se alinee con tu estrategia: aplicaciones nativas para celulares, páginas web ultra económicas por año, suscripciones SaaS o licenciamiento de software propio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            
            {/* Opción 1: Construcción Web Ultra Económica (Anual) */}
            <div className="bg-slate-900/85 rounded-3xl p-6 shadow-xl border border-slate-800 hover:border-teal-500/50 transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-teal-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                Ultra Económica
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="px-2.5 py-0.5 text-[10px] font-mono font-extrabold tracking-wider text-teal-300 bg-teal-500/15 border border-teal-500/30 rounded-full uppercase">
                      Web / Anual
                    </span>
                    <h3 className="text-xl font-black text-white mt-2">Página Web Básica</h3>
                  </div>
                  <div className="p-2.5 bg-teal-500/15 border border-teal-500/30 rounded-2xl text-teal-400">
                    <Globe className="w-6 h-6" />
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-6">
                  Tu sitio o landing page a medida con costo por año súper accesible. Todo listo para proyectar tu empresa en internet con control total.
                </p>

                <div className="mb-6">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-bold text-slate-500 line-through">$150.000 COP</span>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      🔥 -47% Promo
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-slate-400 text-xs font-bold">Desde</span>
                    <span className="text-3xl font-black text-teal-300">$79.000 COP</span>
                    <span className="text-slate-400 text-xs">/ año</span>
                  </div>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                    *Incluye Dominio .com.co + Hosting + Botón WhatsApp
                  </p>
                </div>

                <hr className="border-slate-800 my-4" />

                <ul className="space-y-3 mb-6 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Dominio .com.co Incluido:</strong> 1 año oficial.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Hosting Rápido:</strong> Alojamiento seguro por 1 año.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Accesos Totales:</strong> Credenciales 100% tuyas.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">WhatsApp Integrado:</strong> Botón directo a tu chat.</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleContactWhatsApp('Página Web Básica (Promoción $79k/año - Antes $150k)')}
                className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 text-xs"
              >
                Solicitar Web ($79k/año) <MessageSquare className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Opción 2: App Móvil Nativa (Android & iOS) */}
            <div className="bg-gradient-to-b from-cyan-950/35 to-slate-900 rounded-3xl p-6 shadow-2xl border-2 border-cyan-400/60 hover:border-cyan-300 transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                ⚡ -83% Promo
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="px-2.5 py-0.5 text-[10px] font-mono font-extrabold tracking-wider text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 rounded-full uppercase">
                      App Nativa iOS & Android
                    </span>
                    <h3 className="text-xl font-black text-white mt-2">App Móvil Nativa</h3>
                  </div>
                  <div className="p-2.5 bg-cyan-500/15 border border-cyan-500/30 rounded-2xl text-cyan-300">
                    <Smartphone className="w-6 h-6" />
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-6">
                  Construimos tu aplicación móvil nativa para instalar en teléfonos Android o iOS con catálogo, pedidos directos y panel.
                </p>

                <div className="mb-6">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-bold text-slate-500 line-through">$1.200.000 COP</span>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-mono">
                      🔥 Ahorras $1.000.000
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-slate-400 text-xs font-bold">Inversión:</span>
                    <span className="text-3xl font-black text-cyan-300">$200.000 COP</span>
                  </div>
                  <p className="text-[11px] text-cyan-300 font-bold mt-1">
                    *Pago único de lanzamiento con APK entregada
                  </p>
                </div>

                <hr className="border-slate-800 my-4" />

                <ul className="space-y-3 mb-6 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Android & iOS:</strong> APK instalable y compilación lista.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Catálogo Interactivo:</strong> Muestra productos y precios.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Pedidos a WhatsApp:</strong> Carrito conectado directo a tu chat.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Publicación Asistida:</strong> Te guiamos a Play Store / App Store.</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleContactWhatsApp('App Móvil Nativa Android/iOS (Promoción $200.000 COP)')}
                className="w-full py-3 px-4 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 text-xs"
              >
                Construir App ($200k) <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Opción 3: SaaS Suscripción Mensual */}
            <div className="bg-slate-900/85 rounded-3xl p-6 shadow-xl border border-slate-800 hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="px-2.5 py-0.5 text-[10px] font-mono font-extrabold tracking-wider text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 rounded-full uppercase">
                      SaaS / Mensual
                    </span>
                    <h3 className="text-xl font-black text-white mt-2">Suscripción SaaS</h3>
                  </div>
                  <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-400">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-6">
                  Paga solo una tarifa mensual económica mientras uses la plataforma. Ideal para iniciar sin inversión inicial de desarrollo.
                </p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-slate-400 text-xs font-bold">Desde</span>
                    <span className="text-3xl font-black text-white">$20.000 COP</span>
                    <span className="text-slate-400 text-xs">/ mes</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    *Mantenimiento y servidor 100% incluidos
                  </p>
                </div>

                <hr className="border-slate-800 my-4" />

                <ul className="space-y-3 mb-6 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Cero costo inicial:</strong> Sin inversión en desarrollo.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Actualizaciones Gratis:</strong> Todo correctivo incluido.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Puesta en Marcha:</strong> En tiempo récord.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Exportable:</strong> Datos a Excel cuando desees.</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleContactWhatsApp('Suscripción SaaS ($20.000 COP/mes)')}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-emerald-600 text-white font-bold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 text-xs"
              >
                Solicitar SaaS ($20k/mes) <MessageSquare className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Opción 4: Desarrollo a Medida / Licencia de Propiedad */}
            <div className="bg-slate-900/85 rounded-3xl p-6 shadow-xl border border-slate-800 hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1 relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="px-2.5 py-0.5 text-[10px] font-mono font-extrabold tracking-wider text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 rounded-full uppercase">
                      Software Propio
                    </span>
                    <h3 className="text-xl font-black text-white mt-2">Licencia Propia</h3>
                  </div>
                  <div className="p-2.5 bg-indigo-500/15 border border-indigo-500/30 rounded-2xl text-indigo-400">
                    <Code className="w-6 h-6" />
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-6">
                  El software es de ustedes para siempre. Se realiza cotización previa según el alcance. Puedes hospedarlo en tu servidor.
                </p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-slate-400 text-xs font-bold">Inversión:</span>
                    <span className="text-2xl font-black text-white">A convenir</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    *Entrega de código fuente y propiedad
                  </p>
                </div>

                <hr className="border-slate-800 my-4" />

                <ul className="space-y-3 mb-6 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Propiedad Intelectual:</strong> Activo 100% propio.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Personalización Total:</strong> Flujos bancarios y APIs.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Laptop className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Servidor Propio:</strong> Sin pagos de mensualidad obligatorios.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Autonomía Completa:</strong> Sin restricciones de uso.</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleContactWhatsApp('Desarrollo a Medida')}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 text-xs"
              >
                Solicitar Propio <MessageSquare className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Aplicaciones Móviles Publicadas */}
      <section id="mobile-apps" className="py-16 bg-[#070E1A] border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="px-3.5 py-1 text-xs font-mono font-bold text-teal-300 bg-teal-500/10 border border-teal-500/30 rounded-full uppercase tracking-wider">
              Ecosistema Móvil Oficial
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-3">
              Nuestras Aplicaciones Móviles (iOS & Android)
            </h2>
            <p className="text-sm md:text-base text-slate-400 mt-2 max-w-2xl mx-auto">
              Contamos con aplicaciones desarrolladas y publicadas para plataformas Apple iOS y Google Android con cumplimiento estricto de privacidad y rendimiento nativo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900/85 rounded-3xl p-8 shadow-xl border border-slate-800 hover:border-teal-500/40 flex flex-col justify-between transition-all">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-black shadow-md">
                      🏘️
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">PueblApp</h3>
                      <p className="text-xs text-emerald-400 font-semibold">Turismo & Comercio Local • iOS & Android</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full">
                    App Store / Play Store
                  </span>
                </div>
                <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                  Plataforma móvil integral para el descubrimiento de destinos turísticos, municipios colombianos, gastronomía, eventos culturales y directorio de negocios locales con geolocalización en tiempo real.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs">
                    <span className="text-slate-500 block">Tecnología:</span>
                    <strong className="text-slate-200">iOS (Swift) / Android (Kotlin)</strong>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500 block">Funciones:</span>
                    <strong className="text-slate-200">GPS, Mapas, Notificaciones</strong>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-800">
                <a
                  href="/support/pueblapp"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('pueblapp-support');
                    else { window.history.pushState({}, '', '/support/pueblapp'); window.dispatchEvent(new Event('popstate')); }
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Soporte PueblApp <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href="/support/pueblapp/privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('pueblapp-privacy');
                    else { window.history.pushState({}, '', '/support/pueblapp/privacy'); window.dispatchEvent(new Event('popstate')); }
                  }}
                  className="px-4 py-2 bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Privacidad & Términos <Shield className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="bg-slate-900/85 rounded-3xl p-8 shadow-xl border border-slate-800 hover:border-cyan-500/40 flex flex-col justify-between transition-all">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-md">
                      ✨
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">RayTracing 3D</h3>
                      <p className="text-xs text-cyan-400 font-semibold">Renderizado & Óptica 3D • iOS / iPadOS</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-[11px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-full">
                    App Store iOS
                  </span>
                </div>
                <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                  Aplicación interactiva de simulación de trazado de rayos (Ray Tracing) y visualización física de materiales, sombras suaves y reflexión óptica en tiempo real para dispositivos Apple con tecnología Metal.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="text-xs">
                    <span className="text-slate-500 block">Tecnología:</span>
                    <strong className="text-slate-200">SwiftUI / Metal Shader</strong>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-500 block">Compatibilidad:</span>
                    <strong className="text-slate-200">iPhone, iPad, Mac</strong>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-800">
                <a
                  href="/support/raytracing"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('raytracing-support');
                    else { window.history.pushState({}, '', '/support/raytracing'); window.dispatchEvent(new Event('popstate')); }
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Soporte RayTracing <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href="/support/raytracing/privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('raytracing-privacy');
                    else { window.history.pushState({}, '', '/support/raytracing/privacy'); window.dispatchEvent(new Event('popstate')); }
                  }}
                  className="px-4 py-2 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Privacidad & Términos <Shield className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Qué hacemos / Pilares */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white">
            ¿Cómo te ayudamos a escalar?
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Desarrollamos soluciones enfocadas en la eficiencia, seguridad y la total autonomía de tu operación.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/80 p-6 rounded-2xl shadow-lg border border-slate-800 hover:border-teal-500/40 transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-5">
                <Code className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Software & Web Apps</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Plataformas web intuitivas, paneles de control SaaS y herramientas a la medida con arquitecturas seguras y escalables.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/80 p-6 rounded-2xl shadow-lg border border-slate-800 hover:border-cyan-500/40 transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Apps Móviles (iOS & Android)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Desarrollo nativo e híbrido (Swift, Kotlin, React Native) con publicación oficial en <strong className="text-slate-200">App Store</strong> y <strong className="text-slate-200">Google Play</strong>.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/80 p-6 rounded-2xl shadow-lg border border-slate-800 hover:border-emerald-500/40 transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Automatización (RPA & Bots)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Conectamos tus sistemas (Excel, CRMs, WhatsApp, ERPs) con bots de IA para eliminar tareas repetitivas 24/7.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/80 p-6 rounded-2xl shadow-lg border border-slate-800 hover:border-indigo-500/40 transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-5">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Integración de Datos & APIs</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Consolidación de bases de datos, generación de reportes y pasarelas de pago automáticas (Bre-B, PSE, Bold).
              </p>
            </div>
          </div>
        </div>
      </section>
        </>
      )}

      {/* FAQ / Preguntas Frecuentes */}
      <section className="py-16 max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-white">
            Preguntas Frecuentes
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Resuelve tus dudas rápidas sobre el funcionamiento de nuestras soluciones.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-white mb-2">¿Cómo funciona la promoción de App Móvil Nativa en $200.000 COP?</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Es una oferta irresistible de lanzamiento con un 83% de descuento (precio habitual $1.200.000 COP). Construimos tu aplicación móvil nativa para Android y/o iOS con catálogo interactivo, módulo de pedidos a WhatsApp, pasarela PSE/Nequi opcional, te entregamos el paquete APK instalable y te asistimos en la publicación oficial en tiendas (Google Play y App Store).
            </p>
          </div>

          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-white mb-2">¿Qué incluye el plan de Construcción Web Básica en promoción de $79.000/año (precio regular $150.000)?</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Incluye el diseño y construcción a medida de tu sitio web (landing page o catálogo), el registro oficial de tu propio dominio .com.co por 1 año, hospedaje web en servidor de alta velocidad por 1 año, botón directo a WhatsApp y la entrega completa de credenciales y accesos (100% de tu propiedad).
            </p>
          </div>

          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-white mb-2">¿Cómo se realiza el levantamiento de requerimientos?</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Agendamos una breve sesión virtual donde revisamos el proceso manual que deseas digitalizar (tus planillas, formatos actuales, o flujos de comunicación). Con base en eso te proponemos un esquema óptimo y prototipo rápido.
            </p>
          </div>

          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-white mb-2">¿Ofrecen integraciones con software existente?</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Sí. Desarrollamos integraciones y APIs personalizadas para conectar tu nuevo software con plataformas de mensajería (WhatsApp), pasarelas de pago o sistemas contables.
            </p>
          </div>

          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-white mb-2">¿Quién se encarga del alojamiento y servidores?</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Nosotros nos encargamos del despliegue completo en la nube (ej. AWS, Supabase, Vercel) y su mantenimiento. Si eligen el modelo a medida con entrega de propiedad, opcionalmente podemos instalar el sistema en los servidores propios de tu empresa.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-gradient-to-r from-teal-950/60 via-slate-900 to-cyan-950/50 text-white pt-16 pb-28 text-center border-t border-teal-500/25 software-final-cta">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold mb-4 text-white">¿Tienes una idea o proceso que deseas automatizar?</h2>
          <p className="text-slate-300 mb-8 max-w-lg mx-auto text-sm md:text-base">
            Agenda una asesoría virtual de 10 minutos y te ayudamos a co-diseñar la solución tecnológica óptima para tu negocio.
          </p>
          <button 
            onClick={() => handleContactWhatsApp('Asesoría General')}
            className="px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-2xl transition-all shadow-lg shadow-teal-950/50 active:scale-95 text-sm md:text-base"
          >
            Quiero agendar una demo gratuita
          </button>
        </div>
      </section>

      {/* Persistent Fixed Bottom Purchase-Confirmation Bar */}
      {activeTrack === 'bot' && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-4xl bg-slate-950/35 backdrop-blur-2xl backdrop-saturate-150 border border-white/20 ring-1 ring-inset ring-white/10 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55)] rounded-2xl px-4 py-3 software-glass-bar">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-teal-300 font-bold tracking-wider">
                  Tu Configuración Activa
                </span>
                <span className="text-[11px] font-bold text-white">
                  · {livePricing.plan.name}
                </span>
              </div>
              <div className="text-xs text-slate-300 truncate">
                {livePricing.picked.length > 0 ? (
                  <span>
                    {livePricing.freeSlots > 0
                      ? `${livePricing.includedPicked.length}/${livePricing.freeSlots} gratis: `
                      : 'Módulos: '}
                    {livePricing.picked.map(m => m.shortTitle).join(' + ')}
                  </span>
                ) : (
                  <span className="text-slate-400">Plan base + Módulo Automejorable con IA</span>
                )}
                {livePricing.remainingFreeSlots > 0 && (
                  <button
                    type="button"
                    onClick={handleOpenInInspector}
                    className="ml-2 text-emerald-300 hover:text-emerald-200 underline font-semibold cursor-pointer"
                  >
                    Te queda{livePricing.remainingFreeSlots > 1 ? 'n' : ''} {livePricing.remainingFreeSlots} módulo{livePricing.remainingFreeSlots > 1 ? 's' : ''} gratis ↓
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              <div className="text-left sm:text-right">
                <div className="text-lg sm:text-xl font-black text-teal-300 leading-none">
                  {formatCop(livePricing.totalMonthly)}
                </div>
                <div className="text-[10px] text-slate-400 font-medium mt-0.5">COP / mes</div>
              </div>
              <button
                type="button"
                onClick={handleActivateLiveConfig}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-teal-950/50 transition-all active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Activar por WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Simulador Interactivo */}
      <WhatsAppBotSimulatorModal
        isOpen={isBotModalOpen}
        onClose={() => setIsBotModalOpen(false)}
        onSelectPlan={(plan, price) => handleContactWhatsApp()}
      />
    </div>
  );
}