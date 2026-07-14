import React from 'react';

export const RayTracingPrivacyPage: React.FC = () => {
  const lastUpdated = '14 de julio de 2026';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-purple-600/6 blur-[120px]" />
        <div className="absolute bottom-[-150px] right-[-150px] w-[500px] h-[500px] rounded-full bg-cyan-500/6 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
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
              <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Política de Privacidad</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="relative z-10 px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl border border-white/5 bg-white/[0.015] p-8 md:p-12 space-y-8">

            <div>
              <p className="text-xs text-gray-500 font-mono mb-6">Última actualización: {lastUpdated}</p>
              <p className="text-gray-300 text-base leading-relaxed">
                Esta política de privacidad describe cómo <strong className="text-white">Ray Tracing Game</strong> (la "App") maneja la información del usuario. 
                Ray Tracing Game es una aplicación de simulación de ray tracing en tiempo real disponible para dispositivos Apple con chip A17 Pro o superior.
              </p>
            </div>

            {/* Key Points */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-5 text-center">
                <div className="text-3xl mb-3">🚫</div>
                <h3 className="text-sm font-bold text-emerald-300 mb-1">No Rastrea</h3>
                <p className="text-xs text-gray-400 leading-relaxed">La App no rastrea tu actividad, ubicación ni comportamiento de uso.</p>
              </div>
              <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-5 text-center">
                <div className="text-3xl mb-3">🔒</div>
                <h3 className="text-sm font-bold text-cyan-300 mb-1">No Recoge Datos</h3>
                <p className="text-xs text-gray-400 leading-relaxed">No se recopilan datos personales, analíticas ni identificadores del dispositivo.</p>
              </div>
              <div className="rounded-2xl border border-purple-500/15 bg-purple-500/5 p-5 text-center">
                <div className="text-3xl mb-3">🤝</div>
                <h3 className="text-sm font-bold text-purple-300 mb-1">No Comparte Datos</h3>
                <p className="text-xs text-gray-400 leading-relaxed">No se comparten datos con terceros, socios ni redes publicitarias.</p>
              </div>
            </div>

            <hr className="border-white/5" />

            {/* Detailed Sections */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-2">1. Información que recopilamos</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  <strong className="text-gray-300">Ninguna.</strong> Ray Tracing Game no recopila, almacena, procesa ni transmite ningún tipo de información personal o no personal del usuario. 
                  La App funciona completamente de forma local en tu dispositivo sin necesidad de conexión a internet, registro de cuenta ni inicio de sesión.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white mb-2">2. Rastreo y analíticas</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  La App <strong className="text-gray-300">no utiliza</strong> herramientas de analíticas, SDKs de rastreo, cookies, pixels de seguimiento ni ningún otro mecanismo de monitoreo. 
                  No se utilizan servicios de terceros como Google Analytics, Firebase, Facebook SDK o similares.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white mb-2">3. Compartir datos con terceros</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Dado que no se recopilan datos, <strong className="text-gray-300">no se comparte información</strong> con terceros bajo ninguna circunstancia. 
                  No existen socios publicitarios ni acuerdos de intercambio de datos.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white mb-2">4. Compras dentro de la App</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Si la App ofrece compras dentro de la aplicación, estas se procesan exclusivamente a través de <strong className="text-gray-300">Apple App Store</strong>. 
                  No tenemos acceso a tu información de pago ni datos financieros. Las transacciones se rigen por los 
                  {' '}<a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">Términos de Servicio de Apple</a>.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white mb-2">5. Seguridad</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Al no recopilar ni almacenar datos, no existen riesgos de seguridad de datos asociados con el uso de esta App. 
                  Toda la información de juego se procesa y almacena localmente en tu dispositivo.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white mb-2">6. Privacidad de menores</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  La App no recopila información de ningún usuario, incluidos menores de edad. 
                  No se requiere edad mínima para usar la App más allá de lo que establezca la clasificación en la App Store.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white mb-2">7. Cambios a esta política</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Nos reservamos el derecho de actualizar esta política de privacidad. Cualquier cambio se publicará en esta página con una fecha de actualización revisada. 
                  Te recomendamos revisar esta política periódicamente.
                </p>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white mb-2">8. Contacto</h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Si tienes preguntas sobre esta política de privacidad, puedes contactarnos en:
                </p>
                <div className="mt-3 space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-500">📧 Email:</span>{' '}
                    <a href="mailto:estebanavila182@outlook.com" className="text-purple-400 hover:text-purple-300 font-mono">estebanavila182@outlook.com</a>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">💬 WhatsApp:</span>{' '}
                    <a href="https://wa.me/573118587974" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 font-mono">+57 311 858 7974</a>
                  </p>
                </div>
              </div>
            </div>

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
