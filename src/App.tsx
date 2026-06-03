import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ComboMenu } from './components/ComboMenu';
import { Features } from './components/Features';
import { PlatformCard } from './components/PlatformCard';
import { InvestmentCard } from './components/InvestmentCard';
import { ReviewsSection } from './components/ReviewsSection';
import { Footer } from './components/Footer';
import { WhatsAppButton } from './components/WhatsAppButton';
import { SupportSection } from './components/SupportSection';
import { AdminSupport } from './components/AdminSupport';
import { VerificationPage } from './components/VerificationPage';
import { useDarkMode } from './hooks/useDarkMode';
import { Search, ShoppingCart } from 'lucide-react';
import { ComboCartProvider, useComboCart } from './hooks/useComboCart';

interface Plan {
  id: number;
  name: string;
  price: number;
  characteristics: string[];
}

interface Platform {
  id: number;
  name: string;
  image: string;
  price: number;
  characteristics: string[];
  plans: Plan[];
}

export type ViewState = 'home' | 'support' | 'admin' | 'verificar';

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [isAdminAuth, setIsAdminAuth] = useState(false);

  useEffect(() => {
    // Handle initial route
    const rawPath = window.location.pathname;
    const path = rawPath === '/' ? '/' : rawPath.replace(/\/$/, '');
    
    if (path === '/aiuda') {
      setCurrentView('support');
    } else if (path === '/aiuda/admin') {
      setCurrentView('admin');
    } else if (path === '/verificar') {
      setCurrentView('verificar');
    } else {
      setCurrentView('home');
    }

    // Handle back/forward buttons
    const handlePopState = () => {
      const rawCurrentPath = window.location.pathname;
      const currentPath = rawCurrentPath === '/' ? '/' : rawCurrentPath.replace(/\/$/, '');
      
      if (currentPath === '/aiuda') {
        setCurrentView('support');
      } else if (currentPath === '/aiuda/admin') {
        setCurrentView('admin');
      } else if (currentPath === '/verificar') {
        setCurrentView('verificar');
      } else {
        setCurrentView('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view: ViewState) => {
    setCurrentView(view);
    const path = view === 'home' ? '/' : `/${view === 'support' ? 'aiuda' : (view === 'verificar' ? 'verificar' : 'aiuda/admin')}`;
    window.history.pushState({}, '', path);
    window.scrollTo(0, 0);
  };

  const [isDark, toggleDark] = useDarkMode();
  const [searchTerm, setSearchTerm] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/platforms.json')
      .then(response => response.json())
      .then(data => {
        setPlatforms(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error cargando precios:', error);
        setLoading(false);
      });
  }, []);
  
  // Filter platforms based on search term
  const filteredPlatforms = platforms.filter(platform => 
    platform.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { addToCombo, setIsComboOpen, clearCombo } = useComboCart();

  const handleLoadCombo = (planIds: number[]) => {
    clearCombo();
    planIds.forEach(id => addToCombo(id));
    setIsComboOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar 
        isDark={isDark} 
        toggleDark={() => toggleDark(!isDark)} 
        onNavigate={navigateTo}
      />
      
      {currentView === 'home' && (
        <>
          <Hero />

          {/* Sección de Combos Recomendados Prehechos */}
          <section id="combos-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-6">
            <div className="text-center mb-10">
              <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary dark:text-brand-light text-xs font-semibold rounded-full uppercase tracking-wider">
                Ahorro Asegurado 💎
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl mt-3">
                Combos Prehechos Recomendados
              </h2>
              <p className="mt-3 max-w-2xl mx-auto text-base text-gray-500 dark:text-gray-400">
                Lleva un combo preseleccionado para obtener descuentos inmediatos. Podrás editar, agregar o quitar plataformas a tu gusto desde el carrito.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Combo 1 */}
              <div className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg hover:shadow-xl p-6 border border-indigo-100/50 dark:border-gray-700 flex flex-col justify-between transform transition hover:-translate-y-1 duration-200">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 text-xs font-bold rounded-md">
                      CINE & DEPORTES 🍿
                    </span>
                    <span className="text-xs text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded">
                      Ahorro Mensual
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Combo Entretenimiento</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                    Las películas más taquilleras, series exclusivas y deportes en vivo (Champions y Libertadores) en un solo lugar.
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                      Netflix 4K
                    </div>
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                      Disney+ Premium (con ESPN)
                    </div>
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                      Prime Video
                    </div>
                  </div>
                </div>
                <div>
                  <div className="border-t pt-4 border-gray-100 dark:border-gray-700 mb-4 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-gray-400 line-through block">$37.000 COP</span>
                      <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">$35.000 COP</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">/mes</span>
                    </div>
                    <span className="text-xs text-green-700 dark:text-green-300 font-extrabold bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded">
                      Ahorras: $2.000 COP
                    </span>
                  </div>
                  <button
                    onClick={() => handleLoadCombo([101, 501, 401])}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
                  >
                    Llevar y Editar Combo
                  </button>
                </div>
              </div>

              {/* Combo 2 */}
              <div className="bg-gradient-to-br from-emerald-50/50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg hover:shadow-xl p-6 border border-emerald-100/50 dark:border-gray-700 flex flex-col justify-between transform transition hover:-translate-y-1 duration-200">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-md">
                      PRODUCTIVIDAD & IA 🚀
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
                      Más Elegido
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Combo Pro & Creativo</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                    Aumenta tu eficiencia de estudio o trabajo al máximo con inteligencia artificial y el mejor diseño original.
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      ChatGPT Compartida
                    </div>
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      Gemini Pro Compartida
                    </div>
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      Canva Pro Mensual
                    </div>
                  </div>
                </div>
                <div>
                  <div className="border-t pt-4 border-gray-100 dark:border-gray-700 mb-4 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-gray-400 line-through block">$37.000 COP</span>
                      <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">$35.000 COP</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">/mes</span>
                    </div>
                    <span className="text-xs text-green-700 dark:text-green-300 font-extrabold bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded">
                      Ahorras: $2.000 COP
                    </span>
                  </div>
                  <button
                    onClick={() => handleLoadCombo([601, 1901, 2101])}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
                  >
                    Llevar y Editar Combo
                  </button>
                </div>
              </div>

              {/* Combo 3 */}
              <div className="bg-gradient-to-br from-purple-50/50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg hover:shadow-xl p-6 border border-purple-100/50 dark:border-gray-700 flex flex-col justify-between transform transition hover:-translate-y-1 duration-200">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-2.5 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-xs font-bold rounded-md">
                      GAMER & AUDIO 🎮
                    </span>
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded">
                      Súper Ahorro
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Combo Gamer Max</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                    Cientos de juegos originales de consola y PC, junto con videos sin publicidad y música ilimitada.
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      Xbox Game Pass Ultimate
                    </div>
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      YouTube Premium
                    </div>
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      Spotify Nueva/Renovación
                    </div>
                  </div>
                </div>
                <div>
                  <div className="border-t pt-4 border-gray-100 dark:border-gray-700 mb-4 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-gray-400 line-through block">$35.000 COP</span>
                      <span className="text-xl font-extrabold text-purple-600 dark:text-purple-400">$33.000 COP</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">/mes</span>
                    </div>
                    <span className="text-xs text-green-700 dark:text-green-300 font-extrabold bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded">
                      Ahorras: $2.000 COP
                    </span>
                  </div>
                  <button
                    onClick={() => handleLoadCombo([1201, 801, 1001])}
                    className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
                  >
                    Llevar y Editar Combo
                  </button>
                </div>
              </div>
            </div>
          </section>
          
          <main id="platforms-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-150 dark:border-gray-800">
            <div className="flex flex-col items-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
                O busca y arma tu combinación ideal 🔍
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-lg">
                Agrega cuantas plataformas quieras. Recuerda que a mayor cantidad de plataformas o mayor tiempo contratado, ¡tu descuento automático aumenta!
              </p>
              
              {/* Prominent Search Box */}
              <div className="relative w-full max-w-md shadow-md rounded-xl">
                <Search className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar Netflix, Disney+, Canva..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary text-base transition-all duration-200"
                />
              </div>
            </div>
        
        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Cargando plataformas...
            </p>
          </div>
        ) : filteredPlatforms.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              No se encontraron plataformas que coincidan con tu búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPlatforms.map((platform) => (
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
        
        {/* <div className="mt-20 px-4 md:px-0">
          <InvestmentCard />
        </div> */}
      </main>
        </>
      )}
      
      {currentView === 'support' && (
        <SupportSection />
      )}

      {currentView === 'verificar' && (
        <VerificationPage />
      )}

      {currentView === 'admin' && (
        isAdminAuth ? <AdminSupport /> : (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow border border-gray-200 dark:border-gray-700 w-full max-w-sm">
              <h2 className="text-xl font-bold mb-4 text-center dark:text-white">Acceso Restringido</h2>
              <input 
                type="password" 
                placeholder="Contraseña"
                className="w-full mb-4 px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                onChange={(e) => {
                  if (e.target.value === 'Admin123') setIsAdminAuth(true);
                }}
              />
            </div>
          </div>
        )
      )}

      {currentView === 'home' && (
        <>
          <Features />
          <ReviewsSection />
        </>
      )}
      <Footer />
      <WhatsAppButton />
      
      {/* Floating Custom Combo Cart Button */}
      <FloatingCartButton />
      
      {/* Global Combo Cart Modal */}
      <ComboMenu />
    </div>
  );
}

function FloatingCartButton() {
  const { getTotalItems, setIsComboOpen } = useComboCart();
  const count = getTotalItems();

  if (count === 0) return null;

  return (
    <button
      onClick={() => setIsComboOpen(true)}
      className="fixed bottom-24 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-brand-primary text-white rounded-full shadow-2xl hover:bg-brand-dark transition-all duration-300 transform hover:scale-105 active:scale-95 animate-bounce-slow"
      title="Ver mi combo"
    >
      <div className="relative">
        <ShoppingCart className="h-6 w-6" />
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-extrabold rounded-full h-5 w-5 flex items-center justify-center border-2 border-brand-primary animate-pulse">
          {count}
        </span>
      </div>
      <span className="font-bold text-sm hidden sm:inline">Mi Combo</span>
    </button>
  );
}

export default function App() {
  return (
    <ComboCartProvider>
      <AppContent />
    </ComboCartProvider>
  );
}