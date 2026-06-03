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

  const loadRandomCombo = () => {
    if (platforms.length === 0) return;
    
    // Choose 2 or 3 random platforms
    const count = Math.floor(Math.random() * 2) + 2; 
    const shuffled = [...platforms].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    
    clearCombo();
    selected.forEach(p => {
      if (p.plans && p.plans.length > 0) {
        const randomPlan = p.plans[Math.floor(Math.random() * p.plans.length)];
        addToCombo(randomPlan.id);
      } else {
        addToCombo(p.id * 1000);
      }
    });
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
          <Hero onRandomCombo={loadRandomCombo} />
          
          <main id="platforms-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col items-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
                Busca y arma tu combinación ideal 🔍
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