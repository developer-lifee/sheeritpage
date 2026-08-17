import React from 'react';
import { useWhatsAppContact } from '../hooks/useWhatsAppContact';
import { ShieldCheck, Lock, Trash2, Mail, MessageSquare, ArrowLeft } from 'lucide-react';

export const PueblappPrivacyPage: React.FC = () => {
  const { getWaLink, getFormattedPhone } = useWhatsAppContact();
  const lastUpdated = '16 de agosto de 2026';
  const SUPPORT_EMAIL = 'estebanavila182@outlook.com';

  return (
    <div className="min-h-screen bg-[#060b13] text-white relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-emerald-600/6 blur-[130px]" />
        <div className="absolute bottom-[-150px] right-[-150px] w-[500px] h-[500px] rounded-full bg-amber-500/6 blur-[110px]" />
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
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/support/pueblapp"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white">
                YaConecta <span className="text-emerald-400 font-medium text-sm">(PuebloApp)</span>
              </h1>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Política de Privacidad
              </p>
            </div>
          </div>
          <span className="text-xs text-gray-500 font-mono">Actualizado: {lastUpdated}</span>
        </div>
      </header>

      {/* Content */}
      <section className="relative z-10 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl border border-white/10 bg-white/[0.015] p-8 md:p-12 space-y-8">

            <div>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                Esta Política de Privacidad describe cómo <strong className="text-white">YaConecta (PuebloApp)</strong> recopila, utiliza y protege la información en la aplicación móvil para iOS y sus servicios web asociados. Respetamos plenamente la privacidad de nuestros usuarios, comerciantes y comunidades locales.
              </p>
            </div>

            {/* Core Privacy Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-center space-y-2">
                <div className="text-3xl">🚫</div>
                <h4 className="font-bold text-emerald-300 text-sm">Sin Venta de Datos</h4>
                <p className="text-xs text-gray-400">Nunca vendemos ni comercializamos tus datos ni tu historial a terceros.</p>
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-center space-y-2">
                <div className="text-3xl">🔑</div>
                <h4 className="font-bold text-amber-300 text-sm">Autenticación Privada</h4>
                <p className="text-xs text-gray-400">Soporte nativo con Sign in with Apple (Hide My Email) y Google OAuth.</p>
              </div>

              <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-5 text-center space-y-2">
                <div className="text-3xl">🗑️</div>
                <h4 className="font-bold text-teal-300 text-sm">Derecho al Borrado</h4>
                <p className="text-xs text-gray-400">Puedes eliminar tu cuenta e historial completo en cualquier momento.</p>
              </div>
            </div>

            <div className="space-y-6 text-xs md:text-sm text-gray-300 leading-relaxed border-t border-white/5 pt-8">

              <div className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  1. Información que Recopilamos
                </h3>
                <ul className="list-disc list-inside space-y-1 pl-2 text-gray-400">
                  <li><strong>Información de Cuenta:</strong> Nombre, correo electrónico e ID único asignado por Supabase Auth (vía Apple ID, Google o correo).</li>
                  <li><strong>Información Comercial:</strong> Nombre del negocio, catálogo de productos, precios, horario y teléfono de contacto para WhatsApp.</li>
                  <li><strong>Contenido Comunitario:</strong> Publicaciones de encargos, noticias locales y fotos/videos de evidencia adjuntados voluntariamente por los usuarios.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  2. Uso de la Información
                </h3>
                <p className="text-gray-400">
                  Utilizamos la información recopilada exclusivamente para permitir la conexión entre comerciantes, clientes y vecinos de la comunidad. No rastreamos tu ubicación en segundo plano ni almacenamos geolocalización continua.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  3. Almacenamiento y Seguridad (Supabase Storage & PostgreSQL)
                </h3>
                <p className="text-gray-400">
                  La base de datos utiliza políticas de seguridad de nivel de fila (Row Level Security - RLS). Las imágenes de productos, encargos y spots turísticos se almacenan en contenedores encriptados de Supabase Storage.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  4. Eliminación de Cuenta y Datos (App Store & Google Compliance)
                </h3>
                <p className="text-gray-400">
                  De acuerdo con las políticas de Apple App Store y Google Play, puedes solicitar la eliminación total e irreversible de tu usuario, productos registrados y publicaciones escribiendo a <strong className="text-white">{SUPPORT_EMAIL}</strong> o a través del botón de eliminación en la app.
                </p>
              </div>

            </div>

            {/* Contact Box */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
              <div>
                <h4 className="font-bold text-white text-sm">¿Dudas sobre la Política de Privacidad?</h4>
                <p className="text-xs text-gray-400">Contáctanos directamente por correo o WhatsApp.</p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=Privacidad%20YaConecta`}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span>Email</span>
                </a>
                <a
                  href={getWaLink('Consulta sobre Privacidad de YaConecta (PuebloApp).')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-all shadow-md flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 fill-black" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 border-t border-white/5 text-center text-xs text-gray-500">
        <p>© 2026 YaConecta (PuebloApp). Todos los derechos reservados. 🇨🇴</p>
      </footer>
    </div>
  );
};
