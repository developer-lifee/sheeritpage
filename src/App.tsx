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
import { SoftwarePricingPage } from './components/SoftwarePricingPage';
import { RayTracingSupportPage } from './components/RayTracingSupportPage';
import { RayTracingPrivacyPage } from './components/RayTracingPrivacyPage';
import { PueblappSupportPage } from './components/PueblappSupportPage';
import { PueblappPrivacyPage } from './components/PueblappPrivacyPage';
import PortfolioShowcasePage from './components/PortfolioShowcasePage';
import ErrorBoundary from './components/ErrorBoundary';
import ClientLoginView from './components/ClientLoginView';
import { useDarkMode } from './hooks/useDarkMode';
import { Search, ShoppingCart, Lock, AlertCircle, Globe } from 'lucide-react';
import { ComboCartProvider, useComboCart } from './hooks/useComboCart';
import { enableDemoMode, isDemoMode } from './utils/demoMode';

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

export type ViewState = 'home' | 'support' | 'admin' | 'verificar' | 'servicios' | 'software' | 'raytracing-support' | 'raytracing-privacy' | 'pueblapp-support' | 'pueblapp-privacy' | 'portafolio';

const AUTHORIZED_ADVISORS: { [email: string]: string } = {
  'esclepiades@hotmail.com': 'Esclepiades',
  'camco08@hotmail.com': 'Camilo',
  'estebanavila182@outlook.com': 'Esteban',
  'carolcubillos03@outlook.es': 'Carol Cubillos',
  'yaristizabal948@gmail.com': 'melissa'
};

function AdminLoginOnApp({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim().toLowerCase();

    try {
      const apiUrl = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
        ? 'http://localhost:3000'
        : window.location.origin;
      
      const res = await fetch(`${apiUrl}/api/admin/agents`);
      const data = await res.json();
      
      let agentObj = null;
      if (data.success && Array.isArray(data.agents)) {
        agentObj = data.agents.find((a: any) => a.email && a.email.trim().toLowerCase() === cleanEmail);
      }

      const fallbackName = AUTHORIZED_ADVISORS[cleanEmail];
      
      if (!agentObj && !fallbackName) {
        setError('El correo ingresado no corresponde a un asesor autorizado.');
        setLoading(false);
        return;
      }

      if (agentObj && agentObj.status === 'inactive') {
        setError('Este contrato se encuentra terminado/inactivo. Contacta al administrador.');
        setLoading(false);
        return;
      }

      if (cleanPass !== 'admin123') {
        setError('Contraseña incorrecta.');
        setLoading(false);
        return;
      }

      const agentName = agentObj ? agentObj.fullname : (fallbackName || cleanEmail.split('@')[0]);
      localStorage.setItem('ticket_agent_email', cleanEmail);
      localStorage.setItem('ticket_agent_name', agentName);
      localStorage.setItem('ticket_agent_password', cleanPass);
      onSuccess();
    } catch (err) {
      const fallbackName = AUTHORIZED_ADVISORS[cleanEmail];
      if (!fallbackName) {
        setError('El correo ingresado no corresponde a un asesor autorizado.');
      } else if (cleanPass !== 'admin123') {
        setError('Contraseña incorrecta.');
      } else {
        localStorage.setItem('ticket_agent_email', cleanEmail);
        localStorage.setItem('ticket_agent_name', fallbackName);
        localStorage.setItem('ticket_agent_password', cleanPass);
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-750 w-full max-w-md">
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
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Ingresar al Panel'}
          </button>
        </form>

        <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              enableDemoMode();
              onSuccess();
            }}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm active:scale-95"
          >
            <Globe className="w-4 h-4 text-purple-200" />
            <span>🌐 Probar Modo Demo Comercial</span>
          </button>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center font-medium">
            Entorno de presentación interactivo con datos sanitizados de muestra.
          </p>
        </div>
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
    if (path === '/mis-servicios') return 'servicios';
    if (path === '/software') return 'software';
    if (path === '/portafolio' || path === '/portfolio' || path === '/proyectos' || path === '/trabajos') return 'portafolio';
    if (path === '/support/raytracinggame') return 'raytracing-support';
    if (path === '/support/raytracinggame/privacy') return 'raytracing-privacy';
    if (path === '/support/pueblapp' || path === '/support/puebloapp' || path === '/support/yaconecta') return 'pueblapp-support';
    if (path === '/support/pueblapp/privacy' || path === '/support/puebloapp/privacy' || path === '/support/yaconecta/privacy') return 'pueblapp-privacy';
    return 'home';
  });
  const [isAdminAuth, setIsAdminAuth] = useState(() => {
    const email = localStorage.getItem('ticket_agent_email') || '';
    const pass = localStorage.getItem('ticket_agent_password') || '';
    const cleanEmail = email.trim().toLowerCase();
    const hasValidEmail = !!cleanEmail;
    const isDemo = isDemoMode() || cleanEmail === 'demo@sheerit.com.co';
    const hasValidPass = pass.toLowerCase() === 'admin123' || pass.toLowerCase() === 'demo123' || isDemo;
    
    if (hasValidEmail && hasValidPass) {
      if (!localStorage.getItem('ticket_agent_name')) {
        const fallbackName = isDemo ? 'Asesor Demo Comercial' : (AUTHORIZED_ADVISORS[cleanEmail] || cleanEmail.split('@')[0]);
        localStorage.setItem('ticket_agent_name', fallbackName);
      }
      return true;
    }
    return false;
  });

  useEffect(() => {
    // Validar en segundo plano si la cuenta almacenada localmente fue desactivada/terminada
    const checkActiveSession = async () => {
      const email = localStorage.getItem('ticket_agent_email');
      if (!email) return;
      try {
        const apiUrl = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
          ? 'http://localhost:3000'
          : window.location.origin;
        const res = await fetch(`${apiUrl}/api/admin/agents`);
        const data = await res.json();
        if (data.success && Array.isArray(data.agents)) {
          const found = data.agents.find((a: any) => a.email && a.email.trim().toLowerCase() === email.trim().toLowerCase());
          if (found && found.status === 'inactive') {
            // Contrato terminado: forzar cierre de sesión inmediato
            localStorage.removeItem('ticket_agent_email');
            localStorage.removeItem('ticket_agent_name');
            localStorage.removeItem('ticket_agent_password');
            setIsAdminAuth(false);
          }
        }
      } catch (e) {}
    };
    checkActiveSession();
  }, []);

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
    } else if (path === '/mis-servicios') {
      setCurrentView('servicios');
    } else if (path === '/software') {
      setCurrentView('software');
    } else if (path === '/portafolio' || path === '/portfolio' || path === '/proyectos' || path === '/trabajos') {
      setCurrentView('portafolio');
    } else if (path === '/support/raytracinggame') {
      setCurrentView('raytracing-support');
    } else if (path === '/support/raytracinggame/privacy') {
      setCurrentView('raytracing-privacy');
    } else if (path === '/support/pueblapp' || path === '/support/puebloapp' || path === '/support/yaconecta') {
      setCurrentView('pueblapp-support');
    } else if (path === '/support/pueblapp/privacy' || path === '/support/puebloapp/privacy' || path === '/support/yaconecta/privacy') {
      setCurrentView('pueblapp-privacy');
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
      } else if (currentPath === '/mis-servicios') {
        setCurrentView('servicios');
      } else if (currentPath === '/software') {
        setCurrentView('software');
      } else if (currentPath === '/portafolio' || currentPath === '/portfolio' || currentPath === '/proyectos' || currentPath === '/trabajos') {
        setCurrentView('portafolio');
      } else if (currentPath === '/support/raytracinggame') {
        setCurrentView('raytracing-support');
      } else if (currentPath === '/support/raytracinggame/privacy') {
        setCurrentView('raytracing-privacy');
      } else if (currentPath === '/support/pueblapp' || currentPath === '/support/puebloapp' || currentPath === '/support/yaconecta') {
        setCurrentView('pueblapp-support');
      } else if (currentPath === '/support/pueblapp/privacy' || currentPath === '/support/puebloapp/privacy' || currentPath === '/support/yaconecta/privacy') {
        setCurrentView('pueblapp-privacy');
      } else {
        setCurrentView('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view: ViewState) => {
    setCurrentView(view);
    let path = '/';
    if (view === 'support') path = '/aiuda';
    else if (view === 'admin') path = '/aiuda/admin';
    else if (view === 'verificar') path = '/verificar';
    else if (view === 'servicios') path = '/mis-servicios';
    else if (view === 'software') path = '/software';
    else if (view === 'portafolio') path = '/portafolio';
    else if (view === 'raytracing-support') path = '/support/raytracinggame';
    else if (view === 'raytracing-privacy') path = '/support/raytracinggame/privacy';
    else if (view === 'pueblapp-support') path = '/support/pueblapp';
    else if (view === 'pueblapp-privacy') path = '/support/pueblapp/privacy';
    window.history.pushState({}, '', path);
    window.scrollTo(0, 0);
  };

  // --- TRAFFIC & CLICK TRACKING ---
  useEffect(() => {
    if (currentView === 'admin') return;

    const getDeviceType = () => {
      const width = window.innerWidth;
      const ua = navigator.userAgent.toLowerCase();
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return 'tablet';
      }
      if (/mobile|iphone|ipod|android|blackberry|iemobile|kindle|silk-accelerated|(hpw|web)os|opera m(obi|ini)/.test(ua) || width < 768) {
        return 'mobile';
      }
      return 'desktop';
    };

    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
    const deviceType = getDeviceType();

    // Detección e inicio de validación inmediata al retornar de la pasarela Bold / PSE
    const urlParams = new URLSearchParams(window.location.search);
    const redirectedOrderId = urlParams.get('orderId') || urlParams.get('order_id') || urlParams.get('bold-order-id') || urlParams.get('reference');

    if (redirectedOrderId) {
      const paymentParam = urlParams.get('payment') || urlParams.get('status') || 'success';
      fetch(`${apiUrl}/api/bold/check-status/${redirectedOrderId}?payment=${paymentParam}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.status === 'APPROVED') {
            console.log(`[Redirection Validation] ✅ Orden ${redirectedOrderId} aprobada y procesada al instante.`);
            if (data.sale && data.sale.whatsapp) {
              const tel = data.sale.whatsapp.replace(/\D/g, '');
              window.history.replaceState(null, '', `/?tel=${tel}`);
              setCurrentView('verificar');
            }
          }
        })
        .catch(err => console.error("Error al validar orden por redirección:", err));
    }

    fetch(`${apiUrl}/api/public/track-visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pagePath: window.location.pathname,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        deviceType
      })
    }).catch(err => console.warn('Failed to track visit:', err));

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const path = window.location.pathname;
      const docWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth, window.innerWidth);
      const docHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, window.innerHeight);

      const xPx = e.pageX;
      const yPx = e.pageY;

      const xPct = parseFloat(((xPx / (docWidth || 1)) * 100).toFixed(2));
      const yPct = parseFloat(((yPx / (docHeight || 1)) * 100).toFixed(2));

      let selector = target.tagName.toLowerCase();
      if (target.id) {
        selector += `#${target.id}`;
      } else if (target.className && typeof target.className === 'string') {
        const firstClass = target.className.trim().split(/\s+/)[0];
        if (firstClass) selector += `.${firstClass}`;
      }

      fetch(`${apiUrl}/api/public/track-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pagePath: path,
          xPct,
          yPct,
          elementSelector: selector.substring(0, 100),
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight
        })
      }).catch(err => console.warn('Failed to track click:', err));
    };

    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [currentView]);

  const [isDark, toggleDark] = useDarkMode();
  const [searchTerm, setSearchTerm] = useState('');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
    fetch(`${apiUrl}/api/public/platforms`)
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
      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
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
        currentView={currentView}
        agentEmail={isAdminAuth ? (localStorage.getItem('ticket_agent_email') || '') : undefined}
        agentName={isAdminAuth ? (localStorage.getItem('ticket_agent_name') || '') : undefined}
        onLogout={isAdminAuth ? () => {
          localStorage.removeItem('ticket_agent_email');
          localStorage.removeItem('ticket_agent_name');
          localStorage.removeItem('ticket_agent_password');
          setIsAdminAuth(false);
        } : undefined}
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

      {currentView === 'servicios' && (
        <ClientLoginView />
      )}

      {currentView === 'software' && (
        <SoftwarePricingPage onNavigate={navigateTo} />
      )}

      {currentView === 'raytracing-support' && (
        <RayTracingSupportPage />
      )}

      {currentView === 'raytracing-privacy' && (
        <RayTracingPrivacyPage />
      )}

      {currentView === 'pueblapp-support' && (
        <PueblappSupportPage />
      )}

      {currentView === 'pueblapp-privacy' && (
        <PueblappPrivacyPage />
      )}

      {currentView === 'portafolio' && (
        <ErrorBoundary fallbackTitle="Portafolio de Desarrollos">
          <PortfolioShowcasePage />
        </ErrorBoundary>
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
      {currentView !== 'admin' && <Footer />}
      {currentView !== 'admin' && <WhatsAppButton />}
      
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