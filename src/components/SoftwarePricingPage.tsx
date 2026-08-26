import React, { useState } from 'react';
import { Shield, Sparkles, Server, Clock, Code, Award, CheckCircle2, MessageSquare, ArrowRight, Database, Settings, Zap, ArrowLeftRight, Check, ChevronLeft, ChevronRight, Laptop, Globe, Smartphone, ExternalLink } from 'lucide-react';

export function SoftwarePricingPage({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleContactWhatsApp = (planType: string) => {
    const message = `Hola Sheerit! Estoy interesado en sus servicios de desarrollo de software, apps móviles iOS/Android y automatización (Opción: ${planType}). Me gustaría agendar una asesoría para mi proyecto.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/573107946794?text=${encodedMessage}`, '_blank');
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-300 animate-fadeIn">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24 bg-gradient-to-br from-brand-primary/10 via-transparent to-emerald-500/5 dark:from-brand-primary/20 dark:to-emerald-500/10">
        <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 dark:bg-brand-primary/25 border border-brand-primary/20 mb-6 animate-pulse">
            <Sparkles className="w-4 h-4 text-brand-primary dark:text-brand-light" />
            <span className="text-xs font-bold text-brand-primary dark:text-brand-light uppercase tracking-wider">
              Desarrollo Web, Móvil (iOS & Android) & Automatización
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-gray-950 dark:text-white mb-6">
            Desarrollo de Software, Apps Móviles <br />
            <span className="bg-gradient-to-r from-brand-primary via-indigo-500 to-emerald-500 bg-clip-text text-transparent">
              & Automatizaciones a la Medida
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            Diseñamos y programamos aplicaciones móviles nativas para <strong>iOS (App Store)</strong> y <strong>Android (Google Play)</strong>, plataformas web de alto rendimiento y bots de automatización para empresas.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate('portafolio');
                } else {
                  window.history.pushState({}, '', '/portafolio');
                  window.dispatchEvent(new Event('popstate'));
                }
              }}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm md:text-base flex items-center gap-2 cursor-pointer"
            >
              <span>🎨 Ver Portafolio de Trabajos</span> <ArrowRight className="w-4 h-4" />
            </button>
            <a 
              href="#mobile-apps"
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm md:text-base flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4" /> Apps iOS & Android
            </a>
            <a 
              href="#pricing-comparison"
              className="px-8 py-4 bg-brand-primary hover:bg-brand-dark text-white font-bold rounded-2xl shadow-lg hover:shadow-brand-primary/20 transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm md:text-base flex items-center gap-2"
            >
              Ver Planes de Inversión
            </a>
          </div>
        </div>
        
        {/* Background shapes */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute top-1/3 right-1/4 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
      </section>

      {/* Qué hacemos / Pilares */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-950 dark:text-white">
            ¿Cómo te ayudamos a escalar?
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Desarrollamos soluciones enfocadas en la eficiencia, seguridad y la total autonomía de tu operación.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-150 dark:border-gray-700 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-5">
                <Code className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold dark:text-white mb-2">Software & Web Apps</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Plataformas web intuitivas, paneles de control SaaS y herramientas a la medida con arquitecturas seguras y escalables.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-150 dark:border-gray-700 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-5">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold dark:text-white mb-2">Apps Móviles (iOS & Android)</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Desarrollo nativo e híbrido (Swift, Kotlin, React Native) con publicación oficial en <strong>App Store</strong> y <strong>Google Play</strong>.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-150 dark:border-gray-700 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-5">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold dark:text-white mb-2">Automatización (RPA & Bots)</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Conectamos tus sistemas (Excel, CRMs, WhatsApp, ERPs) con bots de IA para eliminar tareas repetitivas 24/7.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-150 dark:border-gray-700 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-5">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold dark:text-white mb-2">Integración de Datos & APIs</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Consolidación de bases de datos, generación de reportes y pasarelas de pago automáticas (Bre-B, PSE, Bold).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Destacada: Aplicaciones Móviles Publicadas */}
      <section id="mobile-apps" className="py-16 bg-gradient-to-br from-indigo-900/10 via-purple-900/5 to-brand-primary/10 border-y border-indigo-200/40 dark:border-indigo-900/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="px-3.5 py-1 text-xs font-bold text-indigo-600 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/40 rounded-full uppercase tracking-wider">
              Ecosistema Móvil Oficial
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-950 dark:text-white mt-3">
              Nuestras Aplicaciones Móviles (iOS & Android)
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mt-2 max-w-2xl mx-auto">
              Contamos con aplicaciones desarrolladas y publicadas para plataformas Apple iOS y Google Android con cumplimiento estricto de privacidad y rendimiento nativo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* PueblApp */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-indigo-100 dark:border-indigo-900/50 flex flex-col justify-between hover:shadow-2xl transition-all">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-black shadow-md">
                      🏘️
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-950 dark:text-white">PueblApp</h3>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Turismo & Comercio Local • iOS & Android</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-full">
                    App Store / Play Store
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Plataforma móvil integral para el descubrimiento de destinos turísticos, municipios colombianos, gastronomía, eventos culturales y directorio de negocios locales con geolocalización en tiempo real.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="text-xs">
                    <span className="text-gray-400 block">Tecnología:</span>
                    <strong className="text-gray-800 dark:text-gray-200">iOS (Swift) / Android (Kotlin)</strong>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-400 block">Funciones:</span>
                    <strong className="text-gray-800 dark:text-gray-200">GPS, Mapas, Notificaciones</strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <a
                  href="/support/pueblapp"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('pueblapp-support');
                    else { window.history.pushState({}, '', '/support/pueblapp'); window.dispatchEvent(new Event('popstate')); }
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
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
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Privacidad & Términos <Shield className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* RayTracing 3D Viewer */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-purple-100 dark:border-purple-900/50 flex flex-col justify-between hover:shadow-2xl transition-all">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-black shadow-md">
                      ✨
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-950 dark:text-white">RayTracing 3D</h3>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Renderizado & Óptica 3D • iOS / iPadOS</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-[11px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full">
                    App Store iOS
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Aplicación interactiva de simulación de trazado de rayos (Ray Tracing) y visualización física de materiales, sombras suaves y reflexión óptica en tiempo real para dispositivos Apple con tecnología Metal.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="text-xs">
                    <span className="text-gray-400 block">Tecnología:</span>
                    <strong className="text-gray-800 dark:text-gray-200">SwiftUI / Metal Shader</strong>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-400 block">Compatibilidad:</span>
                    <strong className="text-gray-800 dark:text-gray-200">iPhone, iPad, Mac</strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <a
                  href="/support/raytracing"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onNavigate) onNavigate('raytracing-support');
                    else { window.history.pushState({}, '', '/support/raytracing'); window.dispatchEvent(new Event('popstate')); }
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
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
                  className="px-4 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Privacidad & Términos <Shield className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Carrusel de Casos de Uso */}
      <section id="cases" className="py-16 bg-gray-100 dark:bg-gray-900/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-950 dark:text-white">
              Casos Reales de Automatización
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Explora cómo ayudamos a las empresas a simplificar y agilizar sus flujos de trabajo diarios.
            </p>
          </div>

          {/* Carrusel Container */}
          <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 shadow-lg border border-gray-200 dark:border-gray-700 min-h-[400px] flex flex-col justify-between transition-all duration-300">
            
            {/* Contenido Dinámico del Slide */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-fadeIn">
              <div>
                <span className="px-3 py-1 text-xs font-bold text-brand-primary bg-brand-primary/10 dark:text-brand-light dark:bg-brand-primary/20 rounded-full uppercase tracking-wider">
                  {cases[currentSlide].badge}
                </span>
                
                <h3 className="text-2xl md:text-3xl font-black text-gray-950 dark:text-white mt-4 mb-6">
                  {cases[currentSlide].title}
                </h3>
                
                <p className="text-sm text-gray-650 dark:text-gray-300 mb-6 leading-relaxed">
                  {cases[currentSlide].desc}
                </p>
                
                <ul className="space-y-3 mb-8">
                  {cases[currentSlide].steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                      <Check className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
                <h4 className="font-bold text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
                  Impacto & Métricas Promedio
                </h4>
                <div className="space-y-4">
                  {cases[currentSlide].metrics.map((metric, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-gray-250 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                      <span className="text-xs text-gray-650 dark:text-gray-400">{metric.label}</span>
                      <span className="font-bold text-emerald-500 text-sm">{metric.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Controles del Carrusel */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100 dark:border-gray-700">
              <div className="flex gap-2">
                {cases.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${currentSlide === idx ? 'bg-brand-primary w-6' : 'bg-gray-300 dark:bg-gray-600'}`}
                    aria-label={`Ir al slide ${idx + 1}`}
                  />
                ))}
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={prevSlide}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-550 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                  aria-label="Caso anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={nextSlide}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-550 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                  aria-label="Siguiente caso"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Comparison Section */}
      <section id="pricing-comparison" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-950 dark:text-white">
              Opciones de Desarrollo & Esquemas de Negocio
            </h2>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-2 max-w-3xl mx-auto">
              Elige el modelo que mejor se alinee con tu estrategia: desde páginas web a medida ultra económicas por año, hasta plataformas SaaS y licenciamiento de software propio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Opción 1: Construcción Web Básica (Anual) */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border-2 border-brand-primary/40 hover:border-brand-primary transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-brand-primary text-white text-[10px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">
                Recomendado para PYMEs
              </div>

              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="px-3 py-1 text-xs font-extrabold tracking-wider text-brand-primary dark:text-brand-light bg-brand-primary/10 dark:bg-brand-primary/25 rounded-full uppercase">
                      Desarrollo Web / Anual
                    </span>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-3">Construcción Web Básica</h3>
                  </div>
                  <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
                    <Globe className="w-8 h-8" />
                  </div>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                  Desarrollamos tu página o sitio web a medida con un costo por año súper económico. Todo listo para proyectar tu empresa en internet con control total.
                </p>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-gray-500 dark:text-gray-400 text-sm font-bold">Desde</span>
                    <span className="text-4xl font-black text-gray-950 dark:text-white">$150.000 COP</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">/ año</span>
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    *Incluye Dominio .com.co + Hosting + Accesos directos
                  </p>
                </div>

                <hr className="border-gray-150 dark:border-gray-700 my-6" />

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Dominio .com.co Incluido:</strong> Registro oficial de tu dominio propio por 1 año.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Hosting / Alojamiento Web:</strong> Servidor rápido y seguro incluido por 1 año.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Entrega de Accesos Totales:</strong> Te entregamos credenciales de hosting y dominio (100% tuyo).
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Diseño a Medida & WhatsApp:</strong> Diseño adaptado a móviles con enlace y botón directo a tu WhatsApp.
                    </span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleContactWhatsApp('Construcción Web Básica ($150k/año)')}
                className="w-full py-4 px-6 bg-brand-primary hover:bg-brand-dark text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Solicitar Página Web <MessageSquare className="w-4 h-4" />
              </button>
            </div>

            {/* Opción 2: SaaS Suscripción Mensual */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border-2 border-transparent hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="px-3 py-1 text-xs font-extrabold tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 rounded-full uppercase">
                      Modelo SaaS / Suscripción
                    </span>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-3">Suscripción Mensual</h3>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                    <Clock className="w-8 h-8" />
                  </div>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                  Paga solo una tarifa mensual económica mientras uses la plataforma. Ideal para iniciar sin inversión inicial de desarrollo y probar rápido el flujo.
                </p>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-gray-500 dark:text-gray-400 text-sm font-bold">Desde</span>
                    <span className="text-4xl font-black text-gray-950 dark:text-white">$20.000 COP</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">/ mes</span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    *Tarifa ajustada de acuerdo con el volumen de datos o usuarios del sistema.
                  </p>
                </div>

                <hr className="border-gray-150 dark:border-gray-700 my-6" />

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Cero costo inicial:</strong> No requieres inversión en desarrollo de software.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Soporte y actualizaciones gratis:</strong> Todo mantenimiento técnico y correctivos están 100% incluidos en la mensualidad.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Puesta en marcha veloz:</strong> Implementación e inicio de operaciones en tiempo récord.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Control de datos:</strong> Información propia exportable a Excel en cualquier momento.
                    </span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleContactWhatsApp('Suscripción SaaS')}
                className="w-full py-4 px-6 bg-gray-100 hover:bg-emerald-500 dark:bg-gray-700 dark:hover:bg-emerald-600 text-gray-800 dark:text-white hover:text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                Solicitar Modelo SaaS <MessageSquare className="w-4 h-4" />
              </button>
            </div>

            {/* Opción 3: Desarrollo a Medida / Licencia de Propiedad */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border-2 border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1 relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="px-3 py-1 text-xs font-extrabold tracking-wider text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/40 rounded-full uppercase">
                      Software Propio / A Medida
                    </span>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-3">Licencia de Propiedad</h3>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500">
                    <Code className="w-8 h-8" />
                  </div>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                  El software es de ustedes para siempre. Se realiza una cotización previa según el alcance del proyecto. Puedes hospedarlo en tu propio servidor.
                </p>

                <div className="mb-8">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-gray-500 dark:text-gray-400 text-sm font-bold">Inversión:</span>
                      <span className="text-3xl font-black text-gray-950 dark:text-white">A convenir</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-gray-500 dark:text-gray-400 text-xs font-bold">Servidor:</span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Cotización previa según requerimientos</span>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-150 dark:border-gray-700 my-6" />

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Propiedad Intelectual:</strong> El sistema se construye bajo especificaciones de su empresa y es un activo de su propiedad.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Personalización total:</strong> Ajustes exactos en el diseño, flujo de validación y formatos de exportación de tu banco y contabilidad.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Laptop className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Servidor Propio Opcional:</strong> Si lo deseas, instalamos el sistema en tus propios servidores (AWS, VPS, etc.). Una vez entregado, eres 100% autónomo y no pagas mensualidad.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Mantenimiento opcional:</strong> Si prefieres que nosotros administremos la nube, solo pagas el consumo mínimo de servidor.
                    </span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleContactWhatsApp('Desarrollo a Medida')}
                className="w-full py-4 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Solicitar Software Propio <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ / Preguntas Frecuentes */}
      <section className="py-16 max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-950 dark:text-white">
            Preguntas Frecuentes
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Resuelve tus dudas rápidas sobre el funcionamiento de nuestras soluciones.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">¿Qué incluye el plan de Construcción Web Básica de $150.000/año?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Incluye el diseño y construcción a medida de tu sitio web (landing page o sitio corporativo), el registro de tu propio dominio .com.co por 1 año completo, hospedaje/hosting en servidor rápido por 1 año, botón directo a WhatsApp y la entrega total de accesos al hosting y dominio sin ataduras.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">¿Cómo se realiza el levantamiento de requerimientos?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Agendamos una breve sesión virtual donde revisamos el proceso manual que deseas digitalizar (tus planillas, formatos actuales, o flujos de comunicación). Con base en eso te proponemos un esquema óptimo y prototipo rápido.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">¿Ofrecen integraciones con software existente?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Sí. Desarrollamos integraciones y APIs personalizadas para conectar tu nuevo software con plataformas de mensajería (WhatsApp), pasarelas de pago o sistemas contables.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">¿Quién se encarga del alojamiento y servidores?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Nosotros nos encargamos del despliegue completo en la nube (ej. AWS, Supabase, Vercel) y su mantenimiento. Si eligen el modelo a medida con entrega de propiedad, opcionalmente podemos instalar el sistema en los servidores propios de tu empresa.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-brand-primary dark:bg-gray-800 text-white py-16 text-center border-t dark:border-gray-750 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold mb-4 dark:text-white">¿Tienes una idea o proceso que deseas automatizar?</h2>
          <p className="text-brand-light/90 dark:text-gray-400 mb-8 max-w-lg mx-auto text-sm md:text-base">
            Agenda una asesoría virtual de 10 minutos y te ayudamos a co-diseñar la solución tecnológica óptima para tu negocio.
          </p>
          <button 
            onClick={() => handleContactWhatsApp('Asesoría General')}
            className="px-8 py-4 bg-white dark:bg-brand-primary text-brand-primary dark:text-white hover:bg-gray-100 dark:hover:bg-brand-dark font-extrabold rounded-2xl transition-all shadow-md active:scale-95 text-sm md:text-base"
          >
            Quiero agendar una demo gratuita
          </button>
        </div>
      </section>
    </div>
  );
}
