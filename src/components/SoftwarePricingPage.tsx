import React from 'react';
import { Shield, Sparkles, Server, Clock, Code, Award, CheckCircle2, MessageSquare, ArrowRight, Database, Settings, Zap, ArrowLeftRight, Check } from 'lucide-react';

export function SoftwarePricingPage() {
  const handleContactWhatsApp = (planType: string) => {
    const message = `Hola Sheerit! Estoy interesado en sus servicios de desarrollo de software y automatización (Opción: ${planType}). Me gustaría agendar una asesoría para mi proyecto.`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/57314615670?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24 bg-gradient-to-br from-brand-primary/10 via-transparent to-emerald-500/5 dark:from-brand-primary/20 dark:to-emerald-500/10">
        <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 dark:bg-brand-primary/25 border border-brand-primary/20 mb-6 animate-pulse">
            <Sparkles className="w-4 h-4 text-brand-primary dark:text-brand-light" />
            <span className="text-xs font-bold text-brand-primary dark:text-brand-light uppercase tracking-wider">
              Soluciones Tecnológicas & Automatización
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-gray-950 dark:text-white mb-6">
            Digitaliza y Automatiza <br />
            <span className="bg-gradient-to-r from-brand-primary to-emerald-500 bg-clip-text text-transparent">
              los Procesos de tu Empresa
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            Creamos software a la medida, integraciones de API, bots de mensajería y automatizaciones que eliminan las tareas manuales repetitivas en tu negocio.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a 
              href="#pricing-comparison"
              className="px-8 py-4 bg-brand-primary hover:bg-brand-dark text-white font-bold rounded-2xl shadow-lg hover:shadow-brand-primary/20 transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm md:text-base flex items-center gap-2"
            >
              Ver Planes de Inversión <ArrowRight className="w-4 h-4" />
            </a>
            <a 
              href="#cases"
              className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-250 hover:bg-gray-100 dark:hover:bg-gray-755 border border-gray-250 dark:border-gray-700 font-bold rounded-2xl transition-all text-sm md:text-base"
            >
              Ver Casos de Uso
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
            Desarrollamos soluciones enfocadas en la eficiencia, seguridad y escalabilidad de tu operación.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md border border-gray-150 dark:border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-6">
              <Code className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold dark:text-white mb-3">Software & Web Apps</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Plataformas web intuitivas y herramientas internas seguras hechas para las necesidades específicas de tu equipo y clientes.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md border border-gray-150 dark:border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold dark:text-white mb-3">Automatización (RPA & Bots)</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Conectamos tus sistemas existentes (Excel, CRMs, WhatsApp, ERPs) para automatizar flujos de trabajo sin intervención humana.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md border border-gray-150 dark:border-gray-700">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-6">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold dark:text-white mb-3">Integración de Datos</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Consolidación de bases de datos, generación de reportes automatizados y archivos planos listos para bancos y programas contables.
            </p>
          </div>
        </div>
      </section>

      {/* Caso Destacado: Cuentas de Cobro y Flujos Administrativos */}
      <section id="cases" className="py-16 bg-gray-100 dark:bg-gray-900/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 shadow-lg border border-gray-200 dark:border-gray-700 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="px-3 py-1 text-xs font-bold text-brand-primary bg-brand-primary/10 dark:text-brand-light dark:bg-brand-primary/20 rounded-full uppercase tracking-wider">
                Caso Destacado de Aplicación
              </span>
              <h2 className="text-3xl font-black text-gray-950 dark:text-white mt-4 mb-6">
                Automatización de Cuentas de Cobro & Dispersión de Pagos
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Ideal para empresas que manejan personal externo, contratistas o logísticos que pasan cuentas de cobro recurrentes:
              </p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  Carga una planilla consolidada de Excel en segundos.
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  El contratista entra con su cédula para validar y aprobar de forma segura.
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  El sistema genera archivos planos bancarios y contables de inmediato.
                </li>
              </ul>

              <a 
                href="#pricing-comparison"
                className="inline-flex items-center gap-2 font-bold text-brand-primary hover:text-brand-dark dark:text-brand-light text-sm"
              >
                Ver cotización para este tipo de software <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
              <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider mb-4">Métricas de impacto promedio</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-250 dark:border-gray-800 pb-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Tiempo de revisión manual</span>
                  <span className="font-bold text-red-500 text-sm">-90% de reducción</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-250 dark:border-gray-800 pb-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Errores en datos de pago bancarios</span>
                  <span className="font-bold text-emerald-500 text-sm">0% de incidencias</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Autogestión por logísticos</span>
                  <span className="font-bold text-gray-800 dark:text-white text-sm">100% digital e inmediato</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Comparison Section */}
      <section id="pricing-comparison" className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-950 dark:text-white">
              Dos Esquemas de Negocio para Tu Elección
            </h2>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
              Elige el modelo que mejor se alinee con tu estrategia financiera: pagar solo por el uso mensual de la plataforma o capitalizar la propiedad de tu software.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Opción 1: SaaS Suscripción Mensual */}
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
                    <span className="text-4xl font-black text-gray-950 dark:text-white">$100.000 COP</span>
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

            {/* Opción 2: Desarrollo a Medida / Licencia de Propiedad */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border-2 border-brand-primary/30 hover:border-brand-primary/60 transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-brand-primary text-white text-[10px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider">
                Recomendado para Empresas
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="px-3 py-1 text-xs font-extrabold tracking-wider text-brand-primary dark:text-brand-light bg-brand-primary/10 dark:bg-brand-primary/25 rounded-full uppercase">
                      Software Propio / A Medida
                    </span>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-3">Licencia de Propiedad</h3>
                  </div>
                  <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
                    <Code className="w-8 h-8" />
                  </div>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                  El software es de ustedes para siempre. Haz un pago único de desarrollo y paga solo almacenamiento y servidor en la nube de manera mensual.
                </p>

                <div className="mb-8">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-gray-500 dark:text-gray-400 text-sm font-bold">Pago Único:</span>
                      <span className="text-4xl font-black text-gray-950 dark:text-white">$3.000.000 COP</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-gray-500 dark:text-gray-400 text-xs font-bold">Servidor/Nube:</span>
                      <span className="text-lg font-bold text-emerald-500">$100.000 COP / mes</span>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-150 dark:border-gray-700 my-6" />

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Propiedad Intelectual:</strong> El sistema se construye bajo especificaciones de su empresa y es un activo de su propiedad.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Personalización total:</strong> Ajustes exactos en el diseño, flujo de validación y formatos de exportación de tu banco y contabilidad.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Mantenimiento Económico:</strong> Cero rentas de software, solo pagas el consumo de la infraestructura en la nube para mantenerlo en línea.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Seguridad Dedicada:</strong> Posibilidad de desplegar en tus propios servidores empresariales si así lo requieres.
                    </span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleContactWhatsApp('Desarrollo a Medida')}
                className="w-full py-4 px-6 bg-brand-primary hover:bg-brand-dark text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
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
            Resuelve tus dudas rápidas sobre el funcionamiento de nuestra plataforma.
          </p>
        </div>

        <div className="space-y-6">
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
      <section className="bg-brand-primary text-white py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold mb-4">¿Tienes una idea o proceso que deseas automatizar?</h2>
          <p className="text-brand-light/90 mb-8 max-w-lg mx-auto text-sm md:text-base">
            Agenda una asesoría virtual de 10 minutos y te ayudamos a co-diseñar la solución tecnológica óptima para tu negocio.
          </p>
          <button 
            onClick={() => handleContactWhatsApp('Asesoría General')}
            className="px-8 py-4 bg-white text-brand-primary hover:bg-gray-100 font-extrabold rounded-2xl transition-all shadow-md active:scale-95 text-sm md:text-base"
          >
            Quiero agendar una demo gratuita
          </button>
        </div>
      </section>
    </div>
  );
}
