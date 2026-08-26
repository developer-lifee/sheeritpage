import React, { useState } from 'react';
import { useWhatsAppContact } from '../hooks/useWhatsAppContact';
import { 
  Store, 
  Megaphone, 
  Newspaper, 
  Camera, 
  ShieldCheck, 
  Apple, 
  Globe, 
  Mail, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  MapPin,
  CheckCircle2,
  FileText
} from 'lucide-react';

export const PueblappSupportPage: React.FC = () => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const { getWaLink, getFormattedPhone } = useWhatsAppContact();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const SUPPORT_EMAIL = 'estebanavila182@outlook.com';

  const faqItems = [
    {
      q: '¿Cómo registro mi comercio o negocio en PueblApp?',
      a: 'Inicia sesión con tu Apple ID, Google o correo. Dirígete a la pestaña "Mi Negocio", completa la información comercial (logo, horario, tarifa de envío) y agrega tus productos manualmente o con el cargador masivo en Excel/CSV.'
    },
    {
      q: '¿PueblApp cobra alguna comisión por venta, carrera o envío?',
      a: 'No. PueblApp opera bajo un modelo libre de intermediarios y comisiones (GobiernoFree). El 100% de la venta es del comerciante o trabajador local, acordando el pago directamente en efectivo, Nequi o Daviplata.'
    },
    {
      q: '¿Cómo funciona la verificación de noticias comunitarias?',
      a: 'Los vecinos publican reportes viales, ambientales o alertas locales adjuntando fotografías o videos reales del lugar. Cuando 3 vecinos confirman la información, la noticia recibe la insignia de "Confirmada por vecinos".'
    },
    {
      q: '¿Cómo uso el Importador Masivo de Inventarios (Excel / CSV)?',
      a: 'En el Dashboard "Mi Negocio", toca en "Importar Excel". Sube un archivo con las columnas (Nombre, Descripción, Precio) y tus productos se subirán automáticamente a tu estantería digital en segundos.'
    },
    {
      q: '¿Cómo solicito la eliminación de mi cuenta o datos personales?',
      a: 'Puedes solicitar la eliminación completa de tu cuenta, perfil comercial o publicaciones enviando un correo a estebanavila182@outlook.com o directamente por nuestro canal de soporte técnico en WhatsApp.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#060b13] text-white relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-emerald-600/10 blur-[130px] animate-pulse" />
        <div className="absolute bottom-[-150px] right-[-150px] w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[110px]" />
        <div className="absolute top-[40%] left-[50%] w-[450px] h-[450px] rounded-full bg-sky-500/5 blur-[90px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 pt-12 pb-6 px-6 border-b border-white/5">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-amber-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-2xl font-black">🇨🇴</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-white">
                  PueblApp
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  iOS 17+
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Plataforma Comunitaria & Comercial Nativa para el Campo Colombiano
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/support/pueblapp/privacy"
              className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold transition-all flex items-center gap-2"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Privacidad</span>
            </a>
            <a
              href={getWaLink('Hola, necesito asistencia técnica con PueblApp.')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-black" />
              <span>Soporte WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-12 pb-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Modelo Libre de Comisiones & Autonomía Local</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
            El poder del comercio y la información <br className="hidden md:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-200 to-amber-300 bg-clip-text text-transparent">
              directamente en las manos del pueblo.
            </span>
          </h2>
          <p className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Diseñada especialmente para municipios, campesinos, tenderos y transportadores de la Colombia rural (Cubarral, Guamal, Lejanías, San Martín y más).
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-6 py-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-emerald-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Store className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-white">1. Dashboard "Mi Negocio" & Estantería Digital</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Métricas en tiempo real, horario, catálogo, tarifa de domicilio y cargador masivo de inventarios desde archivos Excel / CSV para ferreterías, misceláneas y tiendas de abarrotes.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-amber-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-white">2. Solicitudes y Encargos de Vecinos</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Publicación rápida de ofertas y necesidades locales (carreras a veredas, productos del campo, repuestos). Conexión directa por WhatsApp sin intermediarios.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-teal-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Newspaper className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-white">3. Noticias Comunitarias Verificadas</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Alertas climáticas, estado de vías y eventos con evidencia fotográfica/videográfica subida por los mismos vecinos y distintivo de confirmación ciudadana.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-sky-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-white">4. Spots del Pueblo & Rincones Turísticos</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Guía colaborativa de miradores, charcos de río, fincas agroturísticas y panaderías tradicionales recomendadas por los locales.
            </p>
          </div>

        </div>
      </section>

      {/* Tech & Auth Badge */}
      <section className="relative z-10 px-6 py-6">
        <div className="max-w-4xl mx-auto p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-bold text-emerald-300 text-sm flex items-center justify-center md:justify-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Autenticación Segura Integrada</span>
            </h4>
            <p className="text-xs text-gray-300">
              Soporta Sign in with Apple, Google Sign-In (OAuth 2.0) y correo electrónico protegido con Supabase Auth.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/10 text-xs font-bold flex items-center gap-2">
              <Apple className="w-4 h-4 text-white" />
              <span>Apple ID</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/10 text-xs font-bold flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>Google</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 px-6 py-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-extrabold text-white">Preguntas Frecuentes (FAQ)</h3>
            <p className="text-xs text-gray-400">Todo lo que necesitas saber sobre el uso de PueblApp</p>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-gray-200 hover:text-white"
                >
                  <span>{item.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="relative z-10 px-6 pb-16">
        <div className="max-w-4xl mx-auto p-8 rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] text-center space-y-4">
          <h3 className="text-xl font-bold text-white">¿Necesitas ayuda adicional o soporte para tu negocio?</h3>
          <p className="text-xs text-gray-300 max-w-lg mx-auto leading-relaxed">
            Nuestro equipo está disponible para ayudarte a configurar tu tienda, importar tus inventarios o resolver cualquier inquietud sobre la aplicación.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Soporte%20PueblApp`}
              className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 text-xs font-bold transition-all flex items-center gap-2"
            >
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>{SUPPORT_EMAIL}</span>
            </a>
            <a
              href={getWaLink('Hola, necesito asistencia con PueblApp.')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 fill-black" />
              <span>WhatsApp Directo ({getFormattedPhone()})</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 border-t border-white/5 text-center text-xs text-gray-500 space-y-2">
        <p>© 2026 PueblApp. Todos los derechos reservados. Construido para la Colombia Real. 🇨🇴</p>
        <div className="flex items-center justify-center gap-4 text-[11px]">
          <a href="/support/pueblapp/privacy" className="hover:text-emerald-400 transition-colors">
            Política de Privacidad
          </a>
          <span>•</span>
          <a href="/portafolio" className="hover:text-emerald-400 transition-colors">
            Portafolio Sheerit
          </a>
        </div>
      </footer>
    </div>
  );
};
