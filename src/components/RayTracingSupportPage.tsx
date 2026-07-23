import React, { useState } from 'react';
import { useWhatsAppContact } from '../hooks/useWhatsAppContact';

export const RayTracingSupportPage: React.FC = () => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const { getWaLink } = useWhatsAppContact();

  const SUPPORT_EMAIL = 'estebanavila182@outlook.com';

  const faqItems = [
    {
      q: '¿Cómo restauro una compra dentro de la app?',
      a: 'Ve a Ajustes dentro de Ray Tracing Game y toca "Restaurar compras". Si no funciona, cierra y reabre la app. Si el problema persiste, contáctanos.'
    },
    {
      q: '¿La app funciona en mi dispositivo?',
      a: 'Ray Tracing Game requiere iOS 17 o superior y un dispositivo con chip A17 Pro o posterior (iPhone 15 Pro / iPhone 15 Pro Max en adelante) para la simulación de ray tracing en tiempo real con aceleración por hardware.'
    },
    {
      q: '¿Cómo reporto un bug o crash?',
      a: 'Envíanos un correo o WhatsApp con una descripción del problema, tu modelo de iPhone/iPad y la versión de iOS. Si es posible, adjunta una captura de pantalla.'
    },
    {
      q: '¿Puedo solicitar un reembolso?',
      a: 'Los reembolsos de compras in-app se gestionan directamente a través de Apple. Puedes solicitarlo en reportaproblem.apple.com o contactarnos para asistencia.'
    }
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-purple-600/8 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-150px] right-[-150px] w-[500px] h-[500px] rounded-full bg-cyan-500/8 blur-[100px]" style={{ animationDelay: '2s', animationDuration: '4s' }} />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-[80px]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 pt-12 pb-6 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-sm">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="rgba(255,255,255,0.9)" />
                <path d="M2 17l10 5 10-5" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12l10 5 10-5" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-100 to-cyan-200 bg-clip-text text-transparent">
                Ray Tracing Game
              </h1>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Centro de Soporte</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative z-10 px-6 pb-12">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-white/5 bg-gradient-to-br from-purple-950/40 via-[#12121a] to-cyan-950/30 p-8 md:p-12">
            {/* Decorative ray lines */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
              <div className="absolute top-0 left-[20%] w-px h-full bg-gradient-to-b from-purple-400/0 via-purple-400/40 to-purple-400/0" />
              <div className="absolute top-0 left-[50%] w-px h-full bg-gradient-to-b from-cyan-400/0 via-cyan-400/30 to-cyan-400/0" />
              <div className="absolute top-0 left-[80%] w-px h-full bg-gradient-to-b from-fuchsia-400/0 via-fuchsia-400/20 to-fuchsia-400/0" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Soporte Activo</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black leading-tight mb-4">
                ¿Necesitas ayuda con
                <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent"> Ray Tracing Game</span>?
              </h2>
              <p className="text-gray-400 text-base md:text-lg max-w-xl leading-relaxed">
                Nuestro equipo está listo para asistirte con errores, compras, rendimiento y cualquier duda sobre la app.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="relative z-10 px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Canales de Contacto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Card */}
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Soporte%20Ray%20Tracing%20Game`}
              className="group block"
              onMouseEnter={() => setHoveredCard('email')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`relative rounded-2xl border p-6 transition-all duration-300 ${
                hoveredCard === 'email'
                  ? 'border-purple-500/40 bg-purple-950/20 shadow-lg shadow-purple-500/5 scale-[1.02]'
                  : 'border-white/8 bg-white/[0.02] hover:border-white/15'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    hoveredCard === 'email' ? 'bg-purple-500/20' : 'bg-white/5'
                  }`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-colors ${hoveredCard === 'email' ? 'text-purple-400' : 'text-gray-500'}`}>
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm mb-1">Correo Electrónico</h4>
                    <p className="text-purple-300 text-sm font-mono truncate">{SUPPORT_EMAIL}</p>
                    <p className="text-gray-500 text-xs mt-2">Respuesta en menos de 24 horas</p>
                  </div>
                </div>
                <div className={`absolute top-4 right-4 transition-all ${hoveredCard === 'email' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-purple-400">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </a>

            {/* WhatsApp Card */}
            <a
              href={getWaLink('Hola, necesito ayuda con Ray Tracing Game')}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
              onMouseEnter={() => setHoveredCard('whatsapp')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`relative rounded-2xl border p-6 transition-all duration-300 ${
                hoveredCard === 'whatsapp'
                  ? 'border-emerald-500/40 bg-emerald-950/20 shadow-lg shadow-emerald-500/5 scale-[1.02]'
                  : 'border-white/8 bg-white/[0.02] hover:border-white/15'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    hoveredCard === 'whatsapp' ? 'bg-emerald-500/20' : 'bg-white/5'
                  }`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className={`transition-colors ${hoveredCard === 'whatsapp' ? 'text-emerald-400' : 'text-gray-500'}`}>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm mb-1">WhatsApp</h4>
                    <p className="text-emerald-300 text-sm font-mono">+57 311 858 7974</p>
                    <p className="text-gray-500 text-xs mt-2">Chat en vivo · Respuesta inmediata</p>
                  </div>
                </div>
                <div className={`absolute top-4 right-4 transition-all ${hoveredCard === 'whatsapp' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Topics We Help With */}
      <section className="relative z-10 px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Te ayudamos con</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: '🐛', label: 'Bugs & Crashes' },
              { icon: '💳', label: 'Compras In-App' },
              { icon: '⚡', label: 'Rendimiento' },
              { icon: '🔐', label: 'Cuenta & Datos' },
              { icon: '🎮', label: 'Gameplay' },
              { icon: '📱', label: 'Compatibilidad' },
              { icon: '🔄', label: 'Actualizaciones' },
              { icon: '❓', label: 'Preguntas Generales' },
            ].map((topic) => (
              <div
                key={topic.label}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center hover:bg-white/[0.04] hover:border-white/10 transition-all duration-200"
              >
                <span className="text-2xl block mb-2">{topic.icon}</span>
                <span className="text-xs font-semibold text-gray-400">{topic.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Preguntas Frecuentes</h3>
          <div className="space-y-2">
            {faqItems.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-200 pr-4">{item.q}</span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`text-gray-500 flex-shrink-0 transition-transform duration-200 ${openFaq === idx ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === idx ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="px-5 pb-4 text-sm text-gray-400 leading-relaxed">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy & Legal */}
      <section className="relative z-10 px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Privacidad</h3>
          <div className="rounded-2xl border border-white/5 bg-white/[0.015] p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 text-center">
                <span className="text-2xl block mb-1.5">🚫</span>
                <span className="text-xs font-bold text-emerald-300">No Rastrea</span>
              </div>
              <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/5 p-4 text-center">
                <span className="text-2xl block mb-1.5">🔒</span>
                <span className="text-xs font-bold text-cyan-300">No Recoge Datos</span>
              </div>
              <div className="rounded-xl border border-purple-500/10 bg-purple-500/5 p-4 text-center">
                <span className="text-2xl block mb-1.5">🤝</span>
                <span className="text-xs font-bold text-purple-300">No Comparte con Terceros</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Ray Tracing Game no recopila, almacena ni comparte datos personales del usuario. La app no requiere inicio de sesión, no utiliza servicios de analíticas y funciona completamente offline.
            </p>
            <a
              href="/support/raytracinggame/privacy"
              className="inline-flex items-center gap-2 text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors"
            >
              Leer Política de Privacidad Completa
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8">
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="rgba(255,255,255,0.9)" />
                <path d="M2 12l10 5 10-5" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" />
              </svg>
            </div>
            <span className="text-xs font-bold text-gray-500">Ray Tracing Game</span>
          </div>
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};
