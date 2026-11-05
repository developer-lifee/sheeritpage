import React, { useState } from 'react';
import { 
  Smartphone, Globe, Sparkles, Check, ArrowRight, MessageCircle, 
  ShoppingBag, Utensils, Calendar, Briefcase, Tag, CheckCircle2, 
  CreditCard, Bell, MapPin, ShieldCheck, Zap, Laptop, Sliders, 
  ExternalLink, Layers
} from 'lucide-react';
import { useWhatsAppContact } from '../hooks/useWhatsAppContact';

type ProjectType = 'app' | 'web';

interface NicheOption {
  id: string;
  name: string;
  icon: any;
  tagline: string;
  sampleItems: { title: string; price: string; desc: string; badge: string }[];
}

const NICHES: NicheOption[] = [
  {
    id: 'ecommerce',
    name: 'Tienda / E-commerce',
    icon: ShoppingBag,
    tagline: 'Venta de productos, catálogo y envíos',
    sampleItems: [
      { title: 'Producto Estrella VIP', price: '$49.900', desc: 'Edición limitada con envío gratis', badge: 'Más Vendido' },
      { title: 'Accesorio Premium', price: '$24.500', desc: 'Garantía oficial y entrega inmediata', badge: 'Nuevo' }
    ]
  },
  {
    id: 'restaurant',
    name: 'Restaurante / Comida',
    icon: Utensils,
    tagline: 'Menú digital, combos y domicilios directos',
    sampleItems: [
      { title: 'Combo Especial de la Casa', price: '$32.000', desc: 'Plato fuerte + bebida + acompañamiento', badge: 'Recomendado' },
      { title: 'Postre Artesanal', price: '$14.000', desc: 'Receta tradicional recién horneada', badge: 'Favorito' }
    ]
  },
  {
    id: 'appointments',
    name: 'Citas & Reservas',
    icon: Calendar,
    tagline: 'Barberías, spas, consultorios y clínicas',
    sampleItems: [
      { title: 'Consulta / Servicio Completo', price: '$60.000', desc: 'Agenda tu turno disponible en tiempo real', badge: 'Disponible Hoy' },
      { title: 'Sesión Especializada', price: '$90.000', desc: 'Atención personalizada y seguimiento', badge: 'Popular' }
    ]
  },
  {
    id: 'catalog',
    name: 'Catálogo de Servicios',
    icon: Tag,
    tagline: 'Muestra tus precios y productos sin intermediarios',
    sampleItems: [
      { title: 'Paquete de Servicios Pro', price: '$120.000', desc: 'Cotización inmediata y atención por WhatsApp', badge: 'Destacado' },
      { title: 'Mantenimiento Preventivo', price: '$45.000', desc: 'Diagnóstico express con garantía', badge: 'Garantizado' }
    ]
  },
  {
    id: 'professional',
    name: 'Servicios Profesionales',
    icon: Briefcase,
    tagline: 'Abogados, ingenieros, agencias y consultores',
    sampleItems: [
      { title: 'Asesoría Inicial 1 a 1', price: '$80.000', desc: 'Evaluación técnica y plan de acción claro', badge: '100% Online' },
      { title: 'Gestión y Representación', price: '$250.000', desc: 'Acompañamiento legal o corporativo continuo', badge: 'Corporativo' }
    ]
  }
];

const COLOR_PALETTES = [
  { id: 'indigo', name: 'Cyber Índigo', bg: 'bg-indigo-600', text: 'text-indigo-600', hex: '#4f46e5', ring: 'ring-indigo-500', gradient: 'from-indigo-600 to-purple-600' },
  { id: 'emerald', name: 'Esmeralda Neón', bg: 'bg-emerald-600', text: 'text-emerald-600', hex: '#059669', ring: 'ring-emerald-500', gradient: 'from-emerald-600 to-teal-600' },
  { id: 'cyan', name: 'Sheerit Cyan', bg: 'bg-cyan-500', text: 'text-cyan-500', hex: '#06b6d4', ring: 'ring-cyan-400', gradient: 'from-cyan-500 to-blue-600' },
  { id: 'rose', name: 'Carmesí Bold', bg: 'bg-rose-600', text: 'text-rose-600', hex: '#e11d48', ring: 'ring-rose-500', gradient: 'from-rose-600 to-pink-600' },
  { id: 'amber', name: 'Sunset Naranja', bg: 'bg-amber-500', text: 'text-amber-500', hex: '#d97706', ring: 'ring-amber-500', gradient: 'from-amber-500 to-orange-600' },
  { id: 'dark', name: 'Onyx Dark', bg: 'bg-gray-900', text: 'text-gray-900 dark:text-gray-100', hex: '#111827', ring: 'ring-gray-700', gradient: 'from-gray-900 to-slate-800' }
];

export function InteractiveAppWebStudio() {
  const { getWaLink } = useWhatsAppContact();
  const [projectType, setProjectType] = useState<ProjectType>('app');
  const [brandName, setBrandName] = useState<string>('Mi Negocio VIP');
  const [selectedNiche, setSelectedNiche] = useState<string>('ecommerce');
  const [selectedColor, setSelectedColor] = useState<string>('indigo');

  // Módulos
  const [features, setFeatures] = useState<{ [key: string]: boolean }>({
    whatsapp: true,
    cart: true,
    payments: true,
    push: true,
    gps: false,
    admin: true
  });

  const toggleFeature = (id: string) => {
    setFeatures(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const currentNiche = NICHES.find(n => n.id === selectedNiche) || NICHES[0];
  const currentColor = COLOR_PALETTES.find(c => c.id === selectedColor) || COLOR_PALETTES[0];

  const price = projectType === 'app' ? '$200.000 COP' : '$79.000 COP';
  const originalPrice = projectType === 'app' ? '$1.200.000 COP' : '$150.000 COP';
  const priceFrequency = projectType === 'app' ? 'pago único de lanzamiento' : '/ año (Hosting + Dominio incluido)';
  const discountLabel = projectType === 'app' ? '83% de DESCUENTO' : '47% de DESCUENTO';

  const handleLaunchWhatsApp = () => {
    const activeFeatureNames = [
      features.whatsapp && 'Botón WhatsApp',
      features.cart && 'Carrito de Compras',
      features.payments && 'Pasarela PSE/Nequi',
      features.push && (projectType === 'app' ? 'Notificaciones Push' : 'Avisos Web'),
      features.gps && 'Ubicación GPS',
      features.admin && 'Panel de Administración'
    ].filter(Boolean).join(', ');

    const projectLabel = projectType === 'app' ? 'Aplicación Móvil Nativa (Android & iOS)' : 'Página Web / Landing Page';

    const text = `¡Hola Sheerit! Diseñé mi proyecto en el Constructor Interactivo:\n\n` +
      `📌 Tipo: ${projectLabel}\n` +
      `🏷️ Marca/Nombre: "${brandName || 'Mi Proyecto'}"\n` +
      `🎯 Nicho: ${currentNiche.name}\n` +
      `🎨 Color: ${currentColor.name}\n` +
      `🧩 Funciones activas: ${activeFeatureNames}\n` +
      `💰 Promoción seleccionada: ${price} (${discountLabel})\n\n` +
      `¿Cómo podemos iniciar la construcción y entrega de mi proyecto?`;

    window.open(getWaLink(text), '_blank');
  };

  return (
    <section id="constructor-interactivo" className="py-16 md:py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-850 dark:to-gray-900 border-y border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Encabezado Principal */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider mb-4 animate-pulse">
            <Sparkles className="w-4 h-4" /> Promoción Irresistible • Diseña tu Proyecto en Vivo
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-gray-950 dark:text-white tracking-tight">
            Estudio Interactivo: <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-brand-primary via-indigo-500 to-emerald-500 bg-clip-text text-transparent">
              Diseña tu App Móvil o Página Web
            </span>
          </h2>
          <p className="text-sm md:text-base text-gray-650 dark:text-gray-300 mt-4 leading-relaxed">
            Personaliza en segundos el nombre, nicho, colores y módulos. Construimos tu <strong>Aplicación Nativa (Android & iOS)</strong> por solo <strong>$200.000 COP</strong>, o tu <strong>Página Web completa</strong> con dominio y hosting por solo <strong>$79.000 COP/año</strong>.
          </p>
        </div>

        {/* Selector de Tipo de Proyecto (Tabs Principales) */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-inner">
            
            {/* Opción 1: App Móvil Nativa ($200k) */}
            <button
              type="button"
              onClick={() => setProjectType('app')}
              className={`relative p-5 rounded-2xl text-left transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                projectType === 'app'
                  ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-xl scale-[1.02]'
                  : 'bg-white dark:bg-gray-750 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  projectType === 'app' ? 'bg-amber-400 text-gray-950 animate-bounce' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  ⚡ OFERTA IRRESISTIBLE (-83%)
                </span>
                <Smartphone className={`w-5 h-5 ${projectType === 'app' ? 'text-amber-300' : 'text-indigo-500'}`} />
              </div>
              <div>
                <h3 className="text-lg font-black leading-tight">App Nativa iOS & Android</h3>
                <p className={`text-xs mt-1 ${projectType === 'app' ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  Instalable en celulares, rápida y publicada
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/20 dark:border-gray-700 flex items-baseline gap-2">
                <span className={`text-xs line-through ${projectType === 'app' ? 'text-indigo-200' : 'text-gray-400'}`}>$1.200.000</span>
                <span className="text-2xl font-black text-amber-300">$200.000 COP</span>
                <span className={`text-[10px] ${projectType === 'app' ? 'text-indigo-100' : 'text-gray-400'}`}>único</span>
              </div>
            </button>

            {/* Opción 2: Página Web Ultra Económica ($79k/año) */}
            <button
              type="button"
              onClick={() => setProjectType('web')}
              className={`relative p-5 rounded-2xl text-left transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                projectType === 'web'
                  ? 'bg-gradient-to-br from-brand-primary via-emerald-600 to-teal-700 text-white shadow-xl scale-[1.02]'
                  : 'bg-white dark:bg-gray-750 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  projectType === 'web' ? 'bg-amber-300 text-gray-950 animate-bounce' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  🔥 ULTRA ECONÓMICA (-47%)
                </span>
                <Globe className={`w-5 h-5 ${projectType === 'web' ? 'text-emerald-200' : 'text-emerald-500'}`} />
              </div>
              <div>
                <h3 className="text-lg font-black leading-tight">Página Web / Landing</h3>
                <p className={`text-xs mt-1 ${projectType === 'web' ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  Dominio .com.co + Hosting rápido incluido
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/20 dark:border-gray-700 flex items-baseline gap-2">
                <span className={`text-xs line-through ${projectType === 'web' ? 'text-emerald-200' : 'text-gray-400'}`}>$150.000</span>
                <span className="text-2xl font-black text-amber-200">$79.000 COP</span>
                <span className={`text-[10px] ${projectType === 'web' ? 'text-emerald-100' : 'text-gray-400'}`}>/ año</span>
              </div>
            </button>

          </div>
        </div>

        {/* Grid Principal: Configuración a la izquierda / Mockup en vivo a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* COLUMNA IZQUIERDA: CONTROLES DEL CONSTRUCTOR (7 COLS) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Control 1: Nombre de la Marca */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-md">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-black">1</span>
                <span>Nombre de tu Negocio, App o Marca:</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={30}
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Ej: Tienda Express, Barbería El Rey, Café Gourmet..."
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
                  {brandName.length}/30
                </span>
              </div>
            </div>

            {/* Control 2: Tipo de Negocio / Nicho */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-md">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-4">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">2</span>
                <span>Elige la categoría o tipo de negocio:</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {NICHES.map((niche) => {
                  const Icon = niche.icon;
                  const isSelected = selectedNiche === niche.id;
                  return (
                    <button
                      key={niche.id}
                      type="button"
                      onClick={() => setSelectedNiche(niche.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-brand-primary bg-brand-primary/10 dark:bg-brand-primary/20 shadow-sm ring-1 ring-brand-primary'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-brand-primary text-gray-950 font-bold' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {niche.name}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                          {niche.tagline}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Control 3: Estilo de Color */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-md">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-4">
                <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-black">3</span>
                <span>Estilo Visual & Paleta de Color:</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {COLOR_PALETTES.map((palette) => {
                  const isSelected = selectedColor === palette.id;
                  return (
                    <button
                      key={palette.id}
                      type="button"
                      onClick={() => setSelectedColor(palette.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-gray-900 dark:border-white bg-gray-100 dark:bg-gray-700 shadow-sm scale-105'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${palette.bg} shadow-inner flex items-center justify-center`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                      </span>
                      <span className="text-gray-800 dark:text-gray-200">{palette.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Control 4: Módulos y Funcionalidades */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-black">4</span>
                  <span>Módulos y Funcionalidades Incluidas:</span>
                </label>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                  Sin costo extra
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* WhatsApp */}
                <div 
                  onClick={() => toggleFeature('whatsapp')}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    features.whatsapp ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-gray-200 dark:border-gray-700 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Botón WhatsApp Flotante</span>
                  </div>
                  <input type="checkbox" checked={features.whatsapp} readOnly className="w-4 h-4 text-emerald-600 rounded cursor-pointer" />
                </div>

                {/* Carrito */}
                <div 
                  onClick={() => toggleFeature('cart')}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    features.cart ? 'border-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-950/20' : 'border-gray-200 dark:border-gray-700 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Carrito / Pedidos Online</span>
                  </div>
                  <input type="checkbox" checked={features.cart} readOnly className="w-4 h-4 text-indigo-600 rounded cursor-pointer" />
                </div>

                {/* Pagos */}
                <div 
                  onClick={() => toggleFeature('payments')}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    features.payments ? 'border-purple-500/50 bg-purple-50/50 dark:bg-purple-950/20' : 'border-gray-200 dark:border-gray-700 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Pasarela PSE / Nequi / Bold</span>
                  </div>
                  <input type="checkbox" checked={features.payments} readOnly className="w-4 h-4 text-purple-600 rounded cursor-pointer" />
                </div>

                {/* Push / Avisos */}
                <div 
                  onClick={() => toggleFeature('push')}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    features.push ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20' : 'border-gray-200 dark:border-gray-700 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {projectType === 'app' ? 'Notificaciones Push Celular' : 'Avisos & Banners'}
                    </span>
                  </div>
                  <input type="checkbox" checked={features.push} readOnly className="w-4 h-4 text-amber-600 rounded cursor-pointer" />
                </div>

                {/* GPS */}
                <div 
                  onClick={() => toggleFeature('gps')}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    features.gps ? 'border-rose-500/50 bg-rose-50/50 dark:bg-rose-950/20' : 'border-gray-200 dark:border-gray-700 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Mapa GPS / Local Físico</span>
                  </div>
                  <input type="checkbox" checked={features.gps} readOnly className="w-4 h-4 text-rose-600 rounded cursor-pointer" />
                </div>

                {/* Panel de Administración */}
                <div 
                  onClick={() => toggleFeature('admin')}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    features.admin ? 'border-cyan-500/50 bg-cyan-50/50 dark:bg-cyan-950/20' : 'border-gray-200 dark:border-gray-700 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Panel para Cambiar Precios</span>
                  </div>
                  <input type="checkbox" checked={features.admin} readOnly className="w-4 h-4 text-cyan-600 rounded cursor-pointer" />
                </div>

              </div>
            </div>

            {/* Resumen & Botón de Pedido Directo */}
            <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 text-white shadow-2xl border border-gray-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
                    ⚡ {discountLabel}
                  </div>
                  <h4 className="text-xl md:text-2xl font-black text-white">
                    {projectType === 'app' ? 'Tu App Móvil Nativa Lista' : 'Tu Sitio Web Oficial Listo'}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm">
                    {projectType === 'app' 
                      ? 'Código nativo para Android & iOS, APK instalable y entrega garantizada.' 
                      : 'Incluye Dominio .com.co propio + Hosting rápido por 1 año + Accesos totales.'}
                  </p>
                  <div className="flex items-baseline gap-2.5 mt-3">
                    <span className="text-sm line-through text-gray-500 font-bold">{originalPrice}</span>
                    <span className="text-3xl md:text-4xl font-black text-amber-300">{price}</span>
                    <span className="text-xs text-gray-300 font-medium">{priceFrequency}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLaunchWhatsApp}
                  className="w-full md:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-gray-950 font-black shadow-xl shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2.5 text-sm md:text-base cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>¡Construir Mi {projectType === 'app' ? 'App' : 'Web'} Ahora!</span>
                </button>
              </div>
            </div>

          </div>

          {/* COLUMNA DERECHA: MOCKUP INTERACTIVO EN VIVO (5 COLS) */}
          <div className="lg:col-span-5 sticky top-24">
            
            <div className="text-center mb-3">
              <span className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Vista Previa Interactiva en Tiempo Real
              </span>
            </div>

            {/* IF APP MÓVIL: RENDER SMARTPHONE MOCKUP */}
            {projectType === 'app' ? (
              <div className="mx-auto w-[310px] sm:w-[330px] rounded-[48px] bg-gray-950 p-4 shadow-2xl ring-12 ring-gray-900 border-4 border-gray-800 text-gray-900 relative">
                
                {/* Dynamic Island / Notch */}
                <div className="w-28 h-5 bg-gray-900 rounded-full mx-auto mb-3 flex items-center justify-between px-3">
                  <div className="w-2.5 h-2.5 bg-gray-950 rounded-full"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-900/60"></div>
                </div>

                {/* Inner Screen */}
                <div className="bg-gray-100 dark:bg-gray-900 rounded-[36px] overflow-hidden shadow-inner flex flex-col h-[520px] relative text-gray-800 dark:text-gray-100">
                  
                  {/* Status Bar */}
                  <div className="px-5 pt-2 pb-1 flex justify-between items-center text-[10px] font-bold text-gray-500">
                    <span>9:41</span>
                    <div className="flex items-center gap-1">
                      <span>5G</span>
                      <div className="w-4 h-2 bg-gray-400 rounded-xs"></div>
                    </div>
                  </div>

                  {/* App Header with Brand Name & Selected Color */}
                  <div className={`p-4 ${currentColor.bg} text-white shadow-md transition-colors duration-300`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-xs">
                          {brandName ? brandName.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <h5 className="font-black text-xs tracking-tight truncate max-w-[150px]">
                            {brandName || 'Mi Negocio'}
                          </h5>
                          <p className="text-[9px] text-white/80 font-medium">
                            {currentNiche.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {features.cart && (
                          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs">
                            🛒
                          </div>
                        )}
                        {features.push && (
                          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs">
                            🔔
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scrollable App Feed */}
                  <div className="p-3.5 space-y-3 overflow-y-auto flex-1">
                    
                    {/* Hero Promo Banner inside App */}
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-black uppercase text-amber-300">¡Bienvenido!</span>
                          <h6 className="text-xs font-black mt-0.5">App Oficial {brandName || ''}</h6>
                          <p className="text-[10px] text-gray-300 mt-0.5">Ordena fácil desde tu celular</p>
                        </div>
                        <span className="text-xl">✨</span>
                      </div>
                    </div>

                    {/* Active Feature Badges */}
                    <div className="flex flex-wrap gap-1">
                      {features.payments && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          💳 Nequi & PSE
                        </span>
                      )}
                      {features.gps && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          📍 GPS Local
                        </span>
                      )}
                      {features.push && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          🔔 Push Activo
                        </span>
                      )}
                    </div>

                    {/* Sample Items for the selected Niche */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                        Destacados del Catálogo
                      </div>
                      
                      {currentNiche.sampleItems.map((item, idx) => (
                        <div key={idx} className="p-2.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xs flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              {item.badge}
                            </span>
                            <div className="text-xs font-bold text-gray-900 dark:text-white truncate mt-1">
                              {item.title}
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                              {item.desc}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                              {item.price}
                            </div>
                            <button className={`mt-1 px-2 py-0.5 rounded-lg text-[9px] font-bold text-white ${currentColor.bg}`}>
                              Agregar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>

                  {/* Floating WhatsApp Button inside App Mockup */}
                  {features.whatsapp && (
                    <div className="absolute bottom-16 right-3 z-20">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg animate-bounce">
                        <MessageCircle className="w-5 h-5 fill-current" />
                      </div>
                    </div>
                  )}

                  {/* Bottom Navigation Bar */}
                  <div className="p-2.5 bg-white dark:bg-gray-850 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center text-gray-400">
                    <div className={`flex flex-col items-center text-[9px] font-bold ${currentColor.text}`}>
                      <span className="text-xs">🏠</span>
                      <span>Inicio</span>
                    </div>
                    <div className="flex flex-col items-center text-[9px]">
                      <span className="text-xs">🔍</span>
                      <span>Buscar</span>
                    </div>
                    {features.cart && (
                      <div className="flex flex-col items-center text-[9px]">
                        <span className="text-xs">🛒</span>
                        <span>Carrito</span>
                      </div>
                    )}
                    <div className="flex flex-col items-center text-[9px]">
                      <span className="text-xs">👤</span>
                      <span>Perfil</span>
                    </div>
                  </div>

                  {/* Home Indicator */}
                  <div className="w-24 h-1 bg-gray-400 dark:bg-gray-600 rounded-full mx-auto my-1"></div>
                </div>
              </div>
            ) : (
              /* IF PÁGINA WEB: RENDER BROWSER WINDOW MOCKUP */
              <div className="mx-auto rounded-3xl bg-gray-900 p-2 shadow-2xl border border-gray-700 text-gray-900 relative overflow-hidden">
                
                {/* Browser Top Bar with Dots and URL */}
                <div className="px-4 py-2.5 bg-gray-800 rounded-t-2xl flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  </div>
                  <div className="flex-1 bg-gray-900 rounded-lg px-3 py-1 text-[11px] font-mono text-gray-300 flex items-center gap-1.5">
                    <span className="text-emerald-400">🔒</span>
                    <span className="text-gray-400">https://www.</span>
                    <span className="font-bold text-white truncate">
                      {brandName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'tunegocio'}.com.co
                    </span>
                  </div>
                </div>

                {/* Inner Web Page Screen */}
                <div className="bg-white dark:bg-gray-900 rounded-b-2xl h-[480px] overflow-y-auto flex flex-col text-gray-800 dark:text-gray-100 relative">
                  
                  {/* Website Nav */}
                  <div className="px-5 py-3 border-b border-gray-150 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-xl ${currentColor.bg} text-white flex items-center justify-center font-black text-xs`}>
                        {brandName ? brandName.charAt(0).toUpperCase() : 'W'}
                      </div>
                      <span className="font-black text-xs tracking-tight text-gray-900 dark:text-white truncate max-w-[140px]">
                        {brandName || 'Mi Web'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                      <span>Inicio</span>
                      <span>Servicios</span>
                      <button className={`px-2.5 py-1 rounded-lg text-white font-bold text-[10px] ${currentColor.bg}`}>
                        Contacto
                      </button>
                    </div>
                  </div>

                  {/* Web Hero Banner */}
                  <div className={`p-6 ${currentColor.bg} text-white text-center`}>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-black uppercase tracking-wider">
                      {currentNiche.name}
                    </span>
                    <h5 className="text-lg font-black mt-2 leading-tight">
                      Bienvenido a {brandName || 'Tu Sitio Web'}
                    </h5>
                    <p className="text-xs text-white/90 mt-1 max-w-xs mx-auto">
                      {currentNiche.tagline}
                    </p>
                    <div className="mt-3 flex justify-center gap-2">
                      <button className="px-3 py-1.5 bg-white text-gray-950 rounded-xl font-bold text-[11px] shadow-sm">
                        Ver Catálogo
                      </button>
                      {features.whatsapp && (
                        <button className="px-3 py-1.5 bg-emerald-500 text-white rounded-xl font-bold text-[11px] shadow-sm flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" /> WhatsApp
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Web Content Grid */}
                  <div className="p-4 space-y-3 flex-1">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">
                      Nuestros Productos / Servicios
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {currentNiche.sampleItems.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                          <div>
                            <span className="text-[8px] font-bold uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1 py-0.5 rounded">
                              {item.badge}
                            </span>
                            <div className="text-xs font-bold text-gray-900 dark:text-white mt-1">
                              {item.title}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">
                              {item.desc}
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{item.price}</span>
                            <button className={`px-2 py-0.5 rounded-md text-[9px] text-white ${currentColor.bg}`}>
                              Comprar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Web Modules Footprint */}
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] text-gray-600 dark:text-gray-300 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Hosting y Dominio .com.co activo por 1 año</span>
                      </div>
                      <span className="font-bold text-emerald-600">100% Tuyo</span>
                    </div>
                  </div>

                  {/* Floating WhatsApp button on Web */}
                  {features.whatsapp && (
                    <div className="absolute bottom-4 right-4 z-20">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg animate-bounce">
                        <MessageCircle className="w-5 h-5 fill-current" />
                      </div>
                    </div>
                  )}

                  {/* Footer Web */}
                  <div className="p-2 text-center text-[9px] text-gray-400 bg-gray-100 dark:bg-gray-850 border-t border-gray-200 dark:border-gray-800">
                    © 2026 {brandName} · Desarrollado con Sheerit
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
