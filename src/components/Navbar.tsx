import { useState, useRef, useEffect } from 'react';
import { Menu, User, HelpCircle, Home, X, ShoppingCart, Code, Layers } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useComboCart } from '../hooks/useComboCart';

// Removed ComboMenu import since we'll move it to Hero
import { ViewState } from '../App';

interface NavbarProps {
  isDark: boolean;
  toggleDark: () => void;
  onNavigate: (view: ViewState) => void;
  currentView?: ViewState;
  agentName?: string;
  agentEmail?: string;
  onLogout?: () => void;
}

export function Navbar({ isDark, toggleDark, onNavigate, currentView, agentName, agentEmail, onLogout }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { getTotalItems, setIsComboOpen } = useComboCart();
  const cartCount = getTotalItems();
  
  // Close the menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (currentView === 'admin' && agentEmail) {
    return (
      <nav className="bg-brand-primary dark:bg-gray-800 text-white shadow-lg animate-fadeIn">
        <div className="max-w-[96%] mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Title / Logo */}
            <div className="flex items-center gap-3">
              <img 
                src="/faviconsheerit.png" 
                alt="Sheerit Logo" 
                className="h-8 w-auto cursor-pointer"
                onClick={() => onNavigate('home')} 
              />
              <span className="text-lg font-extrabold tracking-wide uppercase hidden sm:inline cursor-pointer" onClick={() => onNavigate('home')}>Sheerit</span>
              <span className="h-4 w-px bg-white/20 hidden sm:inline"></span>
              <span className="text-sm font-semibold text-white/95">Panel de Control Ayuda</span>
            </div>

            {/* Asesor info */}
            <div className="hidden md:flex items-center">
              <span className="text-xs bg-white/10 px-3.5 py-1.5 rounded-xl font-bold border border-white/5 tracking-wide text-white/90">
                👤 Asesor: {agentName} ({agentEmail})
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <ThemeToggle isDark={isDark} toggle={toggleDark} />
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center bg-red-650 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border border-red-500/20 active:scale-95 shadow-md"
                >
                  Salir
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-brand-primary dark:bg-gray-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Desktop: Logo & Menu Button */}
          <div className="hidden md:flex items-center relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Menu"
            >
              <Menu className="h-6 w-6 cursor-pointer" />
            </button>
            
            <div className="flex items-center ml-4 cursor-pointer" onClick={() => onNavigate('home')}>
              <img 
                src="/faviconsheerit.png" 
                alt="Sheerit Logo" 
                className="h-8 w-auto mr-1" 
              />
              <span className="text-xl font-bold">HEERIT</span>
            </div>
            
            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-60 bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden z-30 border border-gray-100 dark:border-gray-700">
                <button 
                  onClick={() => { onNavigate('home'); setIsMenuOpen(false); }}
                  className="w-full flex items-center px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-semibold transition-colors"
                >
                  <Home className="h-4 w-4 mr-3 text-brand-primary" />
                  <span>Inicio</span>
                </button>
                <button 
                  onClick={() => { onNavigate('support'); setIsMenuOpen(false); }}
                  className="w-full flex items-center px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-semibold transition-colors"
                >
                  <HelpCircle className="h-4 w-4 mr-3 text-emerald-500" />
                  <span>Ayuda con mi cuenta</span>
                </button>
                <button 
                  onClick={() => { onNavigate('servicios'); setIsMenuOpen(false); }}
                  className="w-full flex items-center px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-semibold transition-colors"
                >
                  <User className="h-4 w-4 mr-3 text-blue-500" />
                  <span>Mis Servicios (Inicio de Sesión)</span>
                </button>
                <button 
                  onClick={() => { onNavigate('software'); setIsMenuOpen(false); }}
                  className="w-full flex items-center px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-semibold transition-colors"
                >
                  <Code className="h-4 w-4 mr-3 text-amber-500" />
                  <span>Desarrollo de Software</span>
                </button>
              </div>
            )}
          </div>
          
          {/* Mobile: Three-column layout for better centering */}
          <div className="md:hidden grid grid-cols-3 w-full">
            {/* Left column - empty or minimal spacer */}
            <div className="flex items-center justify-start">
              {isMobileMenuOpen ? (
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              ) : (
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
              )}
            </div>
            
            {/* Middle column - centered logo */}
            <div className="flex items-center justify-center">
              <div className="flex items-center">
                <img 
                  src="/faviconsheerit.png" 
                  alt="Sheerit Logo" 
                  className="h-8 w-auto mr-1" 
                />
                <span className="text-xl font-bold">HEERIT</span>
              </div>
            </div>
            
            {/* Right column - theme toggle & cart */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsComboOpen(true)}
                className="relative p-2 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center"
                title="Ver mi combo"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full h-4.5 w-4.5 flex items-center justify-center border border-brand-primary animate-pulse">
                    {cartCount}
                  </span>
                )}
              </button>
              <ThemeToggle isDark={isDark} toggle={toggleDark} />
            </div>
          </div>
          
          {/* Desktop Menu Items */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle isDark={isDark} toggle={toggleDark} />
            <button
              onClick={() => setIsComboOpen(true)}
              className="relative p-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1.5"
              title="Ver mi combo"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-brand-primary animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => { onNavigate('home'); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center px-2 py-2 text-white hover:bg-white/10 rounded-md"
              >
                <Home className="h-5 w-5 mr-3" />
                <span>Inicio</span>
              </button>
              <button 
                onClick={() => { onNavigate('support'); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center px-2 py-2 text-white hover:bg-white/10 rounded-md"
              >
                <HelpCircle className="h-5 w-5 mr-3" />
                <span>Ayuda con mi cuenta</span>
              </button>
              <button 
                onClick={() => { onNavigate('servicios'); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center px-2 py-2 text-white hover:bg-white/10 rounded-md"
              >
                <User className="h-5 w-5 mr-3" />
                <span>Mis Servicios (Inicio de Sesión)</span>
              </button>
              {/* Removed ComboMenu from here */}
              <button 
                onClick={() => { onNavigate('software'); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center px-2 py-2 text-white hover:bg-white/10 rounded-md"
              >
                <Code className="h-5 w-5 mr-3" />
                <span>Desarrollo de Software</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}