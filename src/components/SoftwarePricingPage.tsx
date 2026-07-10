import React from 'react';
import { Shield, Sparkles, Server, Clock, Code, Award, CheckCircle2, MessageSquare, ArrowRight, Database, Settings } from 'lucide-react';

export function SoftwarePricingPage() {
  const handleContactWhatsApp = (planType: string) => {
    const message = `Hola Sheerit! Estoy interesado en su propuesta de software para ${planType}. Me gustaría obtener más información y agendar una breve demostración.`;
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
              Automatización a Tu Medida
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-gray-950 dark:text-white mb-6">
            Automatiza tus Cuentas de Cobro <br />
            <span className="bg-gradient-to-r from-brand-primary to-emerald-500 bg-clip-text text-transparent">
              Sin Procesos Manuales
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            Pasa de la revisión manual en papel o chats a un flujo automatizado integrado con tus planillas de Excel y genera archivos listos para el pago bancario y tu software contable.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a 
              href="#pricing-comparison"
              className="px-8 py-4 bg-brand-primary hover:bg-brand-dark text-white font-bold rounded-2xl shadow-lg hover:shadow-brand-primary/20 transition-all transform hover:-translate-y-0.5 active:scale-95 text-sm md:text-base flex items-center gap-2"
            >
              Ver Planes de Inversión <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
        
        {/* Background shapes */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute top-1/3 right-1/4 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>
      </section>

      {/* Flujo de Trabajo / Cómo Funciona */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-950 dark:text-white">
            El Flujo Automatizado Ideal
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Tres simples pasos para erradicar el trabajo manual y los errores humanos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md border border-gray-150 dark:border-gray-700 relative">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-6">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold dark:text-white mb-3">1. Carga de Planilla</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              El administrador sube el Excel general con los datos consolidados de los logísticos, transportadores o contratistas.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md border border-gray-150 dark:border-gray-700 relative">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold dark:text-white mb-3">2. Autogestión Segura</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Cada contratista ingresa con su cédula, visualiza su pre-cuenta de cobro digitalmente, y la aprueba o solicita ajuste.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md border border-gray-150 dark:border-gray-700 relative">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-6">
              <Settings className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold dark:text-white mb-3">3. Archivos Planos Contables</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              El sistema genera automáticamente el archivo para dispersión bancaria y el archivo plano para cargue de soportes en tu software contable.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Comparison Section */}
      <section id="pricing-comparison" className="py-16 md:py-24 bg-gray-100 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-950 dark:text-white">
              Dos Esquemas de Negocio para Tu Elección
            </h2>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
              Elige el modelo que mejor se alinee con tu estrategia financiera: Capitalizar la propiedad de tu software o pagar solo por el uso mensual.
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
                  Paga solo una tarifa mensual económica mientras uses la plataforma. Ideal para iniciar sin inversión inicial de desarrollo.
                </p>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-gray-500 dark:text-gray-400 text-sm font-bold">Desde</span>
                    <span className="text-4xl font-black text-gray-950 dark:text-white">$100.000 COP</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">/ mes</span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    *Tarifa ajustada de acuerdo con el volumen de contratistas.
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
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">¿Cómo se garantiza que el archivo de banco no tenga errores?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Nosotros configuramos la plantilla con las reglas de validación precisas del banco (Bancolombia, Banco de Bogotá, Davivienda, etc.). El sistema rechaza inmediatamente números de cuenta inválidos o tipos de documento no correspondientes antes de generar el archivo definitivo.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">¿Qué pasa si cambian de software contable en el futuro?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Si eligen el modelo de Suscripción SaaS, la re-adaptación al nuevo software contable está cubierta por el soporte mensual. Si eligen el modelo de Propiedad, se realiza una pequeña cotización por horas de desarrollo para adaptar la salida al nuevo sistema.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-150 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">¿Los transportadores o logísticos deben pagar algo?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              No. El acceso para los logísticos o transportistas es 100% gratuito. Ellos ingresan mediante una página web segura optimizada para teléfonos móviles usando su cédula.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-brand-primary text-white py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold mb-4">¿Listo para modernizar tu logística y contabilidad?</h2>
          <p className="text-brand-light/90 mb-8 max-w-lg mx-auto text-sm md:text-base">
            Agenda una breve llamada y co-diseñemos el flujo óptimo para tu negocio. Ahorra hasta un 90% del tiempo de revisión.
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
