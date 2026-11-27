import React, { useState } from 'react';
import { useWhatsAppContact } from '../hooks/useWhatsAppContact';
import { WhatsAppBotSimulatorModal } from './WhatsAppBotSimulatorModal';
import { InteractiveAppWebStudio } from './InteractiveAppWebStudio';
import { BotModulesShowcase } from './BotModulesLandingPage';
import { Bot, Heart, MessageCircle, Film } from 'lucide-react';
import { Shield, Sparkles, Server, Clock, Code, Award, CheckCircle2, MessageSquare, ArrowRight, Database, Settings, Zap, ArrowLeftRight, Check, ChevronLeft, ChevronRight, Laptop, Globe, Smartphone, ExternalLink } from 'lucide-react';

export function SoftwarePricingPage({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);
  const { getWaLink } = useWhatsAppContact();

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
    <div className="min-h-screen bg-[#050A12] text-slate-100 transition-colors duration-300 animate-fadeIn">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24 border-b border-teal-500/15"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(45, 212, 191, 0.08) 1px, transparent 0)',
          backgroundSize: '28px 28px'
        }}
      >
        <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 mb-6">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-mono font-bold text-teal-300 uppercase tracking-wider">
              Ingeniería Web, Apps iOS/Android & Automatización IA
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            Desarrollo de Software, Apps Móviles <br />
            <span className="bg-gradient-to-r from-teal-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              & Automatizaciones a la Medida
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            Diseñamos plataformas web de alto rendimiento, aplicaciones nativas para <strong className="text-white">iOS (App Store)</strong> y <strong className="text-white">Android (Google Play)</strong>, y bots modulares en WhatsApp Web real para escalar tu operación.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setIsBotModalOpen(true)}
              className="px-7 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-teal-950/50 transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm md:text-base flex items-center gap-2 cursor-pointer"
            >
              <span>🤖 Bot WhatsApp IA ($10k - $60k)</span> <Sparkles className="w-4 h-4" />
            </button>
            <a
              href="#modulos-bot"
              className="px-7 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-teal-300 font-bold rounded-2xl shadow-lg border border-teal-500/40 transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm md:text-base flex items-center gap-2"
            >
              ⚡ Módulos IA & OCR
            </a>
            <a 
              href="#constructor-interactivo"
              className="px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold rounded-2xl border border-slate-700/80 hover:border-teal-500/40 transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm md:text-base flex items-center gap-2"
            >
              <span>🛠️ Diseña App / Web ($200k / $79k)</span>
            </a>
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate('portafolio');
                } else {
                  window.history.pushState({}, '', '/portafolio');
                  window.dispatchEvent(new Event('popstate'));
                }
              }}
              className="px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold rounded-2xl border border-slate-700/80 hover:border-teal-500/40 transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm md:text-base flex items-center gap-2 cursor-pointer"
            >
              <span>🎨 Portafolio</span> <ArrowRight className="w-4 h-4 text-teal-400" />
            </button>
            <a 
              href="#pricing-comparison"
              className="px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold rounded-2xl border border-slate-700/80 hover:border-teal-500/40 transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm md:text-base flex items-center gap-2"
            >
              Ver Planes
            </a>
          </div>
        </div>
        
        {/* Background shapes */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[420px] h-[420px] bg-teal-500/15 rounded-full blur-3xl -z-0 pointer-events-none"></div>
        <div className="absolute top-1/3 right-1/4 -translate-y-1/2 translate-x-1/2 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>
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

      {/* Sección Destacada: Aplicaciones Móviles Publicadas */}
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
            {/* PueblApp */}
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

            {/* RayTracing 3D Viewer */}
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

      {/* Carrusel de Casos de Uso */}
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

          {/* Carrusel Container */}
          <div className="relative bg-slate-900/85 rounded-3xl p-8 md:p-12 shadow-xl border border-slate-800 min-h-[400px] flex flex-col justify-between transition-all duration-300">
            
            {/* Contenido Dinámico del Slide */}
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

            {/* Controles del Carrusel */}
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

      
      {/* SECCIÓN ESTRELLA: BOT DE WHATSAPP AUTOGESTIÓN CON IA */}
      <section id="bot-whatsapp" className="py-16 md:py-24 bg-[#070E1A] border-t border-teal-500/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-4 h-4" /> Autogestión WhatsApp 24/7 • Con Inteligencia Artificial
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white">
              Tu Asistente Personal & Negocio en WhatsApp
            </h2>
            <p className="text-sm md:text-base text-slate-300 mt-3 max-w-3xl mx-auto leading-relaxed">
              Diseñado para clientes reales: no necesitas ser programador. Configura tu bot por audio o texto, dale personalidad y pruébalo con <strong className="text-white">20 mensajes gratis en vivo</strong> antes de pagar.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setIsBotModalOpen(true)}
                className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-950/50 transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm flex items-center gap-2 cursor-pointer"
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
            <div className="bg-slate-900/85 rounded-3xl p-8 shadow-xl border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between relative overflow-hidden">
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
                onClick={() => setIsBotModalOpen(true)}
                className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" /> Probar Demo / Activar ($10k)
              </button>
            </div>

            {/* Pro ($30.000) — Plan Estrella */}
            <div className="bg-gradient-to-b from-teal-950/50 to-slate-900 rounded-3xl p-8 shadow-2xl border-2 border-teal-400/80 ring-1 ring-teal-500/25 transition-all flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                Más Elegido
              </div>
              <div>
                <span className="px-3 py-1 text-xs font-mono font-bold text-teal-300 bg-teal-500/15 border border-teal-500/35 rounded-full uppercase">
                  Plan Pro Negocio
                </span>
                <h3 className="text-2xl font-black text-white mt-3">Pro Asistente IA</h3>
                <p className="text-xs text-slate-300 mt-1 mb-6">
                  Para negocios con flujo constante que venden con audios naturales y cierres semiautomáticos.
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
                    <span><strong className="text-white">Panel de Ajustes de Mejora con IA:</strong> consulta decisiones del bot y revierte cambios en 1 clic</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Conexión WhatsApp Web real anti-bloqueo</strong> (QR o código de 8 dígitos) y servidor 24/7</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => handleContactWhatsApp('Bot WhatsApp Plan Pro ($30.000 COP/mes)')}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-teal-950/50 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" /> Solicitar Plan Pro ($30k)
              </button>
            </div>

            {/* Scale */}
            <div className="bg-slate-900/85 rounded-3xl p-8 shadow-xl border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
              <div>
                <span className="px-3 py-1 text-xs font-mono font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 rounded-full uppercase">
                  Plan Scale
                </span>
                <h3 className="text-2xl font-black text-white mt-3">Scale & Alto Volumen</h3>
                <p className="text-xs text-slate-400 mt-1 mb-6">
                  Para alto tráfico, sincronización con hojas de cálculo y múltiples operadores.
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
                    <span><strong className="text-white">2.000 Mensajes con IA</strong> incluidos al mes (4x más capacidad)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">Base de Datos CRM + Sincronización Excel / OneDrive / SQL</strong> incluida</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-white">1 Módulo extra incluido a elección:</strong> Validación OCR de Pagos IA o Cobros Automáticos</span>
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
                onClick={() => handleContactWhatsApp('Bot WhatsApp Plan Scale ($60.000 COP/mes)')}
                className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-cyan-400" /> Solicitar Plan Scale ($60k)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SUITE MODULAR TECNOLÓGICA DE BOT WHATSAPP IA (OCR, TICKETERA, CRM, CONTABILIDAD, RPA) */}
      <BotModulesShowcase embedded onNavigate={onNavigate} />

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
      <section className="bg-gradient-to-r from-teal-950/60 via-slate-900 to-cyan-950/50 text-white py-16 text-center border-t border-teal-500/25">
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

      {/* Modal Simulador Interactivo */}
      <WhatsAppBotSimulatorModal
        isOpen={isBotModalOpen}
        onClose={() => setIsBotModalOpen(false)}
        onSelectPlan={(plan, price) => handleContactWhatsApp()}
      />
    </div>
  );
}