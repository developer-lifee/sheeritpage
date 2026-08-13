import React, { useState, useEffect } from 'react';
import { Hero } from './Hero';
import { Features } from './Features';
import { ReviewsSection } from './ReviewsSection';
import { PlatformCard } from './PlatformCard';
import { 
  Laptop, 
  Smartphone, 
  Tablet, 
  ExternalLink, 
  Globe, 
  Sparkles, 
  Code, 
  Layers, 
  ShieldCheck, 
  CheckCircle, 
  MessageSquare, 
  ArrowRight, 
  Maximize2, 
  RefreshCw, 
  Zap, 
  Building2, 
  ShoppingBag, 
  Dices, 
  Bot, 
  Package,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Check,
  Plus,
  Clock,
  Shield,
  Calendar,
  Users,
  ShoppingCart,
  Truck,
  MapPin,
  Box,
  Utensils,
  Star
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  subtitle: string;
  category: 'saas' | 'ecommerce' | 'webapp' | 'automation';
  categoryLabel: string;
  description: string;
  tags: string[];
  features: string[];
  liveUrl?: string;
  demoIframeUrl?: string;
  fallbackGradient: string;
  icon: React.ElementType;
  metrics?: { label: string; value: string }[];
}

const PROJECTS: Project[] = [
  {
    id: 'sheerit-store',
    title: 'Sheerit Store - E-Commerce de Licencias',
    subtitle: 'Plataforma de Venta de Entretenimiento & Streaming',
    category: 'ecommerce',
    categoryLabel: 'E-Commerce & Digital',
    description: 'Tienda virtual con catálogo interactivo de suscripciones, carrito de compras dinámico, comprobación de verificación de hogar y pagos automatizados.',
    tags: ['React', 'Vite', 'Tailwind CSS', 'WhatsApp API', 'Nequi / Bancolombia'],
    features: [
      'Catálogo de combos y planes con actualización en vivo desde API',
      'Sistema de verificación de cuenta y hogar inteligente',
      'Carrito de compras dinámico con cálculo inmediato',
      'Integración fluida con WhatsApp para confirmación'
    ],
    liveUrl: 'https://sheerit.com.co',
    fallbackGradient: 'from-purple-600 via-brand-primary to-indigo-900',
    icon: ShoppingBag,
    metrics: [
      { label: 'Transacciones', value: 'Automatizadas' },
      { label: 'UX / UI', value: 'Glassmorphism Premium' }
    ]
  },
  {
    id: 'pickfost',
    title: 'Pickfost - Comida Sabrosa & Domicilios',
    subtitle: 'Plataforma Web de Menú Digital, Pedidos & Domicilios',
    category: 'ecommerce',
    categoryLabel: 'E-Commerce & Gastronomía',
    description: 'Plataforma web promocional y tienda de domicilios gastronómicos con catálogo interactivo de platillos, carrito de compras y planificador de alimentación semanal.',
    tags: ['HTML5', 'MDBootstrap', 'JavaScript', 'CSS3', 'SweetAlert2'],
    features: [
      'Menú virtual interactivo con catálogo de Salchipapas, Mazorcadas y Hamburguesas',
      'Sistema de pedidos a domicilio con múltiples puntos de distribución',
      'Módulo de planificación de alimentación semanal, quincenal y mensual',
      'Carrito de compras dinámico con inicio de sesión y registro de usuarios'
    ],
    liveUrl: 'https://github.com/developer-lifee/pickfost.com.co',
    fallbackGradient: 'from-amber-600 via-orange-700 to-slate-950',
    icon: Utensils,
    metrics: [
      { label: 'Menú Digital', value: 'Catálogo Interactivo' },
      { label: 'Envíos', value: 'Domicilios Rápidos' }
    ]
  },
  {
    id: 'consergeria',
    title: 'Conserjería Digital & Gestión de Edificios',
    subtitle: 'Plataforma para Administración de Propiedad Horizontal',
    category: 'webapp',
    categoryLabel: 'App Web Empresarial',
    description: 'Sistema completo para la gestión de residentes, citofonía digital, reservación de zonas comunes, control de acceso y conserjería sin restricciones.',
    tags: ['Next.js 14', 'React', 'Tailwind CSS', 'TypeScript', 'Node.js'],
    features: [
      'Reserva interactiva de áreas comunes y salones sociales',
      'Control de acceso de visitantes y paquetería',
      'Panel responsivo adaptable a celulares y tablets para conserjes',
      'Módulo de comunicados generales e incidencias'
    ],
    fallbackGradient: 'from-blue-600 via-indigo-700 to-slate-900',
    icon: Building2,
    metrics: [
      { label: 'Tiempo de Carga', value: '< 0.8s' },
      { label: 'Diseño Mobile', value: '100% Responsivo' }
    ]
  },
  {
    id: 'scratchup',
    title: 'ScratchUp Colombia',
    subtitle: 'Plataforma Web de Raspa y Gana Digital',
    category: 'webapp',
    categoryLabel: 'App Gamificada',
    description: 'Plataforma promocional para la ejecución de campañas de Raspa y Gana digital, fidelización de usuarios y premios interactivos en Colombia.',
    tags: ['React', 'HTML5 Canvas', 'Tailwind CSS', 'Node.js', 'Rest API'],
    features: [
      'Efecto táctil e interactivo de raspado en pantalla',
      'Motor de entrega aleatoria de premios y cupones',
      'Optimizado para dispositivos móviles y ráfagas de tráfico',
      'Panel de auditoría y validación de ganadores'
    ],
    liveUrl: 'https://scratchup.com.co',
    fallbackGradient: 'from-amber-500 via-rose-600 to-slate-900',
    icon: Dices,
    metrics: [
      { label: 'Interacción', value: 'Gamificada 100%' },
      { label: 'Compatibilidad', value: 'Multi-Dispositivo' }
    ]
  },
  {
    id: 'sheerit-saas',
    title: 'Sheerit Software - Panel SaaS & RPA',
    subtitle: 'Sistema de Gestión Administrativa & Bots Inteligentes',
    category: 'saas',
    categoryLabel: 'Plataforma SaaS & Bot',
    description: 'Suite empresarial de control operativo con gestión de cuadrantes de turnos, cálculo de nómina en tiempo real, ejecutor RPA y Asistente IA integrados.',
    tags: ['React', 'TypeScript', 'Express.js', 'MySQL', 'AI Assistant', 'RPA'],
    features: [
      'Gestor de horarios y restricción de equidad de turnos',
      'Buscador histórico por fecha con retención de contratos pasados',
      'Supervisión de ejecuciones de bots de WhatsApp en vivo',
      'Asistente conversacional omnipresente para consultas rápidas'
    ],
    liveUrl: 'https://bot.sheerit.com.co',
    fallbackGradient: 'from-emerald-600 via-teal-700 to-slate-900',
    icon: Bot,
    metrics: [
      { label: 'Ahorro de Tiempo', value: '95% Operativo' },
      { label: 'Automatización', value: 'Bots RPA Ininterrumpidos' }
    ]
  }
];

// Componente que renderiza LA PÁGINA REAL DE SHEERIT STORE (Hero + Buscador + Cards + Features + Reviews)
const SheeritStorePreview: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://bot.sheerit.com.co/api/public/platforms')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPlatforms(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredPlatforms = platforms.filter((platform: any) =>
    platform.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
      {/* Componente Hero Real de Sheerit */}
      <Hero onRandomCombo={() => {}} />

      {/* Catálogo Real de Plataformas de Sheerit */}
      <main id="platforms-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-4 text-center">
            Busca y arma tu combinación ideal 🔍
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-lg">
            Agrega cuantas plataformas quieras. Recuerda que a mayor cantidad de plataformas o mayor tiempo contratado, ¡tu descuento automático aumenta!
          </p>

          <div className="relative w-full max-w-md shadow-md rounded-xl">
            <Search className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar Netflix, Disney+, Canva..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Cargando catálogo real de Sheerit Store...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlatforms.map((platform: any) => (
              <PlatformCard
                key={platform.id}
                id={platform.id}
                name={platform.name}
                image={platform.image}
                price={platform.price}
                characteristics={platform.characteristics}
                plans={platform.plans}
              />
            ))}
          </div>
        )}
      </main>

      {/* Componentes Reales Features & Reviews */}
      <Features />
      <ReviewsSection />
    </div>
  );
};

// Componente Interactivo Auténtico para Pickfost Gastronomía & Domicilios
const PickfostPreview: React.FC = () => {
  const [cartCount, setCartCount] = useState<number>(0);
  const [addedDishes, setAddedDishes] = useState<number[]>([]);

  const toggleDish = (id: number) => {
    setAddedDishes(prev => {
      const next = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      setCartCount(next.length);
      return next;
    });
  };

  const dishes = [
    { id: 1, name: 'Salchipapas Especiales', price: '$6.000 - $26.000', badge: 'Más Vendido', icon: '🍟', desc: 'Salchicha suiza, papas a la francesa crujientes, queso derretido y salsas de la casa.' },
    { id: 2, name: 'Mazorcadas Mixtas', price: '$12.000 - $25.000', badge: 'Sabor Criollo', icon: '🌽', desc: 'Maíz tierno desgranado, carne desmechada, pollo, ripio de papa y doble queso.' },
    { id: 3, name: 'Hamburguesas Artesanales', price: '$8.000 - $25.000', badge: 'Recomendado', icon: '🍔', desc: '150g de carne 100% res, tocineta ahumada, queso cheddar y pan brioche horneado.' }
  ];

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-4 sm:p-6 overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-slate-700">
      {/* Pickfost Real Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-slate-950 p-5 rounded-2xl border border-orange-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-white tracking-wider">PICKFOST</span>
            <span className="bg-amber-400/20 text-amber-200 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-amber-400/30">
              Gastronomía & Domicilios
            </span>
          </div>
          <p className="text-xs text-amber-100 max-w-md">
            Comida del pueblo sabrosa con su paladar y bolsillo. ¡Los mejores platillos en tu puerta!
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-amber-500/30 text-xs">
          <ShoppingBag className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-white">Carrito ({cartCount})</span>
        </div>
      </div>

      {/* Servicios Principales de Pickfost */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center space-y-1">
          <Truck className="w-5 h-5 text-amber-400 mx-auto" />
          <span className="font-bold text-xs text-white block">Domicilios Rápidos</span>
          <span className="text-[10px] text-slate-400 block">Comida caliente a tiempo</span>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center space-y-1">
          <Utensils className="w-5 h-5 text-orange-400 mx-auto" />
          <span className="font-bold text-xs text-white block">Sazón & Sabor</span>
          <span className="text-[10px] text-slate-400 block">Sabor único colombiano</span>
        </div>

        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center space-y-1">
          <Calendar className="w-5 h-5 text-emerald-400 mx-auto" />
          <span className="font-bold text-xs text-white block">Planes de Alimentación</span>
          <span className="text-[10px] text-slate-400 block">Semanales & Mensuales</span>
        </div>
      </div>

      {/* Menú de Platillos Populares */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <span>Nuestros Platillos Más Populares</span>
          <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {dishes.map(dish => {
            const isAdded = addedDishes.includes(dish.id);
            return (
              <div key={dish.id} className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-3 shadow-lg">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{dish.icon}</span>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {dish.badge}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{dish.name}</h4>
                    <span className="text-xs font-extrabold text-amber-400 block pt-0.5">{dish.price}</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed pt-1">{dish.desc}</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleDish(dish.id)}
                  className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold shadow'
                  }`}
                >
                  {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isAdded ? 'Agregado al Pedido' : 'Agregar al Pedido'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Componente Interactivo de Previsualización Real de Conserjería Digital
const ConsergeriaPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'access' | 'booking'>('access');

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-4 sm:p-6 overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-slate-700">
      {/* Header Conserjería */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Torres de la Castellana - Conserjería Digital</h3>
            <p className="text-xs text-slate-400">Sistema de Gestión de Propiedad Horizontal & Acceso</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs text-emerald-400 font-semibold">Guardia Activo</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
          <span className="text-xs text-slate-400 block">Residentes</span>
          <span className="text-base font-extrabold text-white">142 Activos</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
          <span className="text-xs text-slate-400 block">Visitas Hoy</span>
          <span className="text-base font-extrabold text-blue-400">8 Registros</span>
        </div>
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
          <span className="text-xs text-slate-400 block">Zonas Reservadas</span>
          <span className="text-base font-extrabold text-emerald-400">3 Salones</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('access')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            activeTab === 'access' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          🚪 Control de Accesos
        </button>
        <button
          onClick={() => setActiveTab('booking')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            activeTab === 'booking' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          📅 Reserva Zonas Comunes
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs space-y-3">
        {activeTab === 'access' ? (
          <>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white">Registro de Entrada Reciente</span>
              <span className="text-[10px] text-slate-400">Hoy 15:42</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div>
                  <span className="font-bold text-white block">Apto 402 - Entregas Rápidas</span>
                  <span className="text-[11px] text-slate-400">Domiciliario Paquetería</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  Ingreso Autorizado
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div>
                  <span className="font-bold text-white block">Apto 101 - Visita Familiar</span>
                  <span className="text-[11px] text-slate-400">Carlos Gómez (Visitante)</span>
                </div>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                  En Propiedad
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white">Próximas Reservaciones</span>
              <span className="text-[10px] text-slate-400">Calendario Activo</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <div>
                  <span className="font-bold text-white block">Salón Social Principal</span>
                  <span className="text-[11px] text-slate-400">Sábado 15 Ago | 18:00 - 23:00</span>
                </div>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                  Apto 305
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const PortfolioShowcasePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeProject, setActiveProject] = useState<Project>(PROJECTS[0]);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [iframeKey, setIframeKey] = useState<number>(0);

  const filteredProjects = selectedCategory === 'all' 
    ? PROJECTS 
    : PROJECTS.filter(p => p.category === selectedCategory);

  const currentProject = activeProject || PROJECTS[0];
  const IconComp = currentProject?.icon || Building2;

  const handleNextProject = () => {
    if (!filteredProjects || filteredProjects.length === 0) return;
    const currentIndex = filteredProjects.findIndex(p => p.id === currentProject.id);
    const nextIndex = (currentIndex + 1) % filteredProjects.length;
    setActiveProject(filteredProjects[nextIndex]);
  };

  const handlePrevProject = () => {
    if (!filteredProjects || filteredProjects.length === 0) return;
    const currentIndex = filteredProjects.findIndex(p => p.id === currentProject.id);
    const prevIndex = (currentIndex - 1 + filteredProjects.length) % filteredProjects.length;
    setActiveProject(filteredProjects[prevIndex]);
  };

  const handleRefreshIframe = () => {
    setIframeKey(prev => prev + 1);
  };

  const getDeviceWidthClass = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'max-w-[385px] h-[680px] rounded-[36px] border-[10px] border-slate-800 shadow-2xl';
      case 'tablet':
        return 'max-w-[768px] h-[650px] rounded-[24px] border-[8px] border-slate-800 shadow-2xl';
      case 'desktop':
      default:
        return 'w-full h-[620px] rounded-2xl border border-slate-700/80 shadow-2xl';
    }
  };

  const isSameOriginProject = currentProject.liveUrl && (
    currentProject.liveUrl.includes('sheerit.com.co') && typeof window !== 'undefined' && window.location.hostname.includes('sheerit.com.co')
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header Principal */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Portafolio de Desarrollos Realizados</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Nuestros Trabajos & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Proyectos Web Completados
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Explora las plataformas web, tiendas virtuales y sistemas SaaS desarrollados con tecnología de vanguardia, máximo rendimiento y diseño interactivo para nuestros clientes.
          </p>
        </div>

        {/* Categorías de Filtro */}
        <div className="flex items-center justify-center gap-2 flex-wrap text-xs font-medium">
          {[
            { id: 'all', label: 'Todos los Proyectos' },
            { id: 'webapp', label: '🏢 Apps Web' },
            { id: 'ecommerce', label: '🛍️ E-Commerce' },
            { id: 'saas', label: '⚡ SaaS & Bots' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl transition-all border ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-lg shadow-indigo-600/25'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Visualizador Interactivo de Dispositivo */}
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-4 sm:p-6 shadow-2xl backdrop-blur-xl space-y-4">
          
          {/* Top Bar de Visualización */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              {/* Botones de Navegación Anterior/Siguiente */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={handlePrevProject}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
                  title="Ver proyecto anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] text-slate-400 font-mono px-1 font-bold">
                  {filteredProjects.findIndex(p => p.id === currentProject.id) + 1}/{filteredProjects.length}
                </span>
                <button
                  onClick={handleNextProject}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
                  title="Ver siguiente proyecto"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                <IconComp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{currentProject.title}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {currentProject.categoryLabel}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">{currentProject.subtitle}</p>
              </div>
            </div>

            {/* Selector de Tamaño de Pantalla (Desktop, Tablet, Mobile) */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setDeviceMode('desktop')}
                className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold ${
                  deviceMode === 'desktop' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Vista Escritorio / Laptop"
              >
                <Laptop className="w-4 h-4" />
                <span className="hidden sm:inline">Laptop</span>
              </button>

              <button
                onClick={() => setDeviceMode('tablet')}
                className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold ${
                  deviceMode === 'tablet' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Vista Tablet"
              >
                <Tablet className="w-4 h-4" />
                <span className="hidden sm:inline">Tablet</span>
              </button>

              <button
                onClick={() => setDeviceMode('mobile')}
                className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold ${
                  deviceMode === 'mobile' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Vista Móvil"
              >
                <Smartphone className="w-4 h-4" />
                <span className="hidden sm:inline">Móvil</span>
              </button>

              <div className="w-px h-5 bg-slate-800 mx-1" />

              <button
                onClick={handleRefreshIframe}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Recargar vista previa"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {currentProject.liveUrl && (
                <a
                  href={currentProject.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Abrir Sitio</span>
                </a>
              )}
            </div>
          </div>

          {/* Contenedor del Marco del Dispositivo */}
          <div className="flex justify-center items-center py-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 min-h-[500px] overflow-hidden">
            <div className={`transition-all duration-500 overflow-hidden relative flex flex-col ${getDeviceWidthClass()}`}>
              
              {/* Fake Browser Address Bar */}
              <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>

                <div className="flex-1 bg-slate-950 text-slate-400 text-[11px] font-mono px-3 py-1 rounded-lg border border-slate-800 flex items-center gap-2 truncate">
                  <Globe className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="truncate">{currentProject.liveUrl || 'https://demo.sheerit.com.co'}</span>
                </div>
              </div>

              {/* Contenido Visual Interactivo / Componentes de Presentación Real */}
              <div className="flex-1 bg-slate-900 relative flex flex-col overflow-hidden">
                {currentProject.id === 'sheerit-store' ? (
                  <SheeritStorePreview />
                ) : currentProject.id === 'pickfost' ? (
                  <PickfostPreview />
                ) : currentProject.id === 'consergeria' ? (
                  <ConsergeriaPreview />
                ) : currentProject.liveUrl && !isSameOriginProject ? (
                  <iframe
                    key={iframeKey}
                    src={currentProject.liveUrl}
                    title={currentProject.title}
                    className="w-full h-full border-0 bg-white"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    loading="lazy"
                  />
                ) : (
                  <div className={`flex-1 bg-gradient-to-br ${currentProject.fallbackGradient} p-8 flex flex-col justify-between text-white relative overflow-hidden`}>
                    <div className="absolute -right-10 -bottom-10 opacity-15">
                      <IconComp className="w-80 h-80 text-white" />
                    </div>

                    <div className="space-y-4 relative z-10">
                      <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold">
                        {currentProject.categoryLabel}
                      </span>
                      <h2 className="text-3xl font-extrabold">{currentProject.title}</h2>
                      <p className="text-slate-200 text-sm max-w-lg leading-relaxed">{currentProject.description}</p>
                    </div>

                    <div className="relative z-10 flex flex-wrap gap-2 pt-4">
                      {currentProject.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Barra Inferior de Navegación entre Proyectos */}
          <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
            <button
              onClick={handlePrevProject}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
            >
              <ChevronLeft className="w-4 h-4 text-indigo-400" />
              <span>Proyecto Anterior</span>
            </button>

            <div className="text-center hidden sm:block">
              <span className="text-xs text-slate-400">
                Viendo <strong className="text-white">{currentProject.title}</strong>
              </span>
            </div>

            <button
              onClick={handleNextProject}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl border border-indigo-500/40 text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <span>Siguiente Proyecto</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Galería de Tarjetas de Proyectos */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>Explorar Todos los Trabajos ({filteredProjects.length})</span>
            </h2>
            <span className="text-xs text-slate-400">Selecciona un proyecto para probarlo en el marco</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProjects.map((project) => {
              const IconComp = project.icon;
              const isSelected = currentProject.id === project.id;

              return (
                <div
                  key={project.id}
                  onClick={() => setActiveProject(project)}
                  className={`cursor-pointer rounded-2xl p-6 transition-all duration-300 border flex flex-col justify-between space-y-4 group relative overflow-hidden ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500/80 shadow-xl ring-2 ring-indigo-500/40'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl border transition-colors ${
                          isSelected ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          <IconComp className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">
                            {project.title}
                          </h3>
                          <p className="text-xs text-slate-400">{project.subtitle}</p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {project.categoryLabel}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {project.description}
                    </p>

                    {/* Features Chips */}
                    <div className="space-y-1.5 pt-1">
                      {project.features.slice(0, 3).map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer & Badges */}
                  <div className="pt-4 border-t border-slate-800/80 flex flex-col space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="px-2 py-0.5 bg-slate-950 text-slate-400 border border-slate-800 rounded-md text-[10px] font-mono">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        <span>{isSelected ? '▶️ Viendo en pantalla' : 'Probar este proyecto'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </span>

                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-white flex items-center gap-1 underline font-medium"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Abrir Enlace</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tarjeta de Cotización Directa para Nuevos Clientes */}
        <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-950 p-8 rounded-3xl border border-indigo-500/40 shadow-2xl text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 max-w-xl z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Desarrollo Web & Software a la Medida</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              ¿Quieres desarrollar una página web o sistema para tu empresa?
            </h3>
            <p className="text-indigo-200 text-xs sm:text-sm leading-relaxed">
              Creamos aplicaciones web, plataformas e-commerce, bots de automatización y software administrativo a la medida con tecnología premium y soporte continuo.
            </p>
          </div>

          <a
            href="https://wa.me/573118587974?text=Hola,%20me%20interesa%20cotizar%20un%20desarrollo%20web%20o%20sistema%20software%20con%20Sheerit"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-2xl transition-all shadow-xl hover:shadow-emerald-500/25 flex items-center gap-2 text-sm shrink-0 active:scale-95 z-10"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
            <span>Cotizar Proyecto por WhatsApp</span>
          </a>
        </div>

      </div>
    </div>
  );
};

export default PortfolioShowcasePage;
