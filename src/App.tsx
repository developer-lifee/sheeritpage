import React, { useState, useEffect } from 'react';
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
import { Search, ShoppingCart, Lock, AlertCircle } from 'lucide-react';
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

const AUTHORIZED_ADVISORS: { [email: string]: string } = {
  'esclepiades@hotmail.com': 'Esclepiades',
  'camco08@hotmail.com': 'Camilo',
  'estebanavila182@outlook.com': 'Esteban'
};

function AdminLoginOnApp({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim().toLowerCase();

    if (!AUTHORIZED_ADVISORS[cleanEmail]) {
      setError('El correo ingresado no corresponde a un asesor autorizado.');
      return;
    }

    if (cleanPass !== 'admin123') {
      setError('Contraseña incorrecta.');
      return;
    }

    // Guardar credenciales
    localStorage.setItem('ticket_agent_email', cleanEmail);
    localStorage.setItem('ticket_agent_name', AUTHORIZED_ADVISORS[cleanEmail]);
    localStorage.setItem('ticket_agent_password', password.trim());
    onSuccess();
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-755 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-brand-primary/10 rounded-full mb-3 text-brand-primary">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold dark:text-white text-center">Panel de Control - Acceso</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
            Ingresa tu correo autorizado y contraseña admin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              placeholder="ejemplo@outlook.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-brand-primary transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-brand-primary transition-all text-sm"
            />
          </div>

          {error && (
            <div className="flex items-start bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 p-3 rounded-xl border border-red-100 dark:border-red-900/30 gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-brand-primary hover:bg-brand-dark text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-98 text-sm"
          >
            Ingresar al Panel
          </button>
        </form>
      </div>
    </div>
  );
}

function AppContent() {
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    const rawPath = window.location.pathname;
    const path = rawPath === '/' ? '/' : rawPath.replace(/\/$/, '');
    if (path === '/aiuda') return 'support';
    if (path === '/aiuda/admin') return 'admin';
    if (path === '/verificar') return 'verificar';
    return 'home';
  });
  const [isAdminAuth, setIsAdminAuth] = useState(() => {
    const email = localStorage.getItem('ticket_agent_email') || '';
    const pass = localStorage.getItem('ticket_agent_password') || '';
    const cleanEmail = email.trim().toLowerCase();
    const hasValidEmail = !!AUTHORIZED_ADVISORS[cleanEmail];
    const hasValidPass = pass.toLowerCase() === 'admin123';
    
    if (hasValidEmail && hasValidPass) {
      if (!localStorage.getItem('ticket_agent_name')) {
        localStorage.setItem('ticket_agent_name', AUTHORIZED_ADVISORS[cleanEmail]);
      }
      return true;
    }
    return false;
  });

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

  const { addToCombo, setIsComboOpen, clearCombo, isComboOpen } = useComboCart();

  const loadRandomCombo = async () => {
    if (platforms.length === 0) return;
    
    let selected: Platform[] = [];
    
    try {
      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
      const response = await fetch(`${apiUrl}/api/public/recommended-combo`);
      const data = await response.json();
      
      if (data && data.success && Array.isArray(data.sortedPlatforms) && data.sortedPlatforms.length > 0) {
        // Take up to 3 platforms with the most free quota
        const topPlatforms = data.sortedPlatforms.slice(0, 3);
        
        // Map backend streaming names back to our local platform objects (case-insensitive substring match)
        selected = topPlatforms.map(name => {
          return platforms.find(p => p.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(p.name.toLowerCase()));
        }).filter(Boolean) as Platform[];
      }
    } catch (e) {
      console.warn("Failed to fetch recommended combos from backend, falling back to random:", e);
    }
    
    // Fallback: If fetch failed or returned empty, pick 2 or 3 random platforms
    if (selected.length === 0) {
      const count = Math.floor(Math.random() * 2) + 2; 
      const shuffled = [...platforms].sort(() => 0.5 - Math.random());
      selected = shuffled.slice(0, count);
    }
    
    clearCombo();
    selected.forEach(p => {
      if (p.plans && p.plans.length > 0) {
        const standardPlan = p.plans.find(pl => pl.name.toLowerCase().includes('estándar') || pl.name.toLowerCase().includes('suscripción') || pl.name.toLowerCase().includes('compartida')) || p.plans[0];
        addToCombo(standardPlan.id);
      } else {
        addToCombo(p.id * 1000);
      }
    });
    setIsComboOpen(true);
  };


  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-300 ${isComboOpen ? 'md:pr-96' : ''}`}>
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
        isAdminAuth ? (
          <AdminSupport 
            agentEmail={localStorage.getItem('ticket_agent_email') || ''}
            agentName={localStorage.getItem('ticket_agent_name') || ''}
            adminPassword={localStorage.getItem('ticket_agent_password') || ''}
            onLogout={() => {
              localStorage.removeItem('ticket_agent_email');
              localStorage.removeItem('ticket_agent_name');
              localStorage.removeItem('ticket_agent_password');
              setIsAdminAuth(false);
            }}
          />
        ) : (
          <AdminLoginOnApp onSuccess={() => setIsAdminAuth(true)} />
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
      className="fixed bottom-24 right-6 z-40 flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white rounded-full shadow-2xl hover:bg-emerald-600 transition-all duration-300 transform hover:scale-105 active:scale-95 animate-bounce-slow"
      title="Ver mi combo y pagar"
    >
      <div className="relative">
        <ShoppingCart className="h-5 w-5" />
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-extrabold rounded-full h-4 w-4 flex items-center justify-center border border-emerald-500 animate-pulse">
          {count}
        </span>
      </div>
      <span className="font-bold text-xs sm:text-sm tracking-wide">Pagar Combo ({count})</span>
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