import React, { useState, useRef, useEffect } from 'react';
import { Menu, User, HelpCircle, Home, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

// Removed ComboMenu import since we'll move it to Hero

interface NavbarProps {
  isDark: boolean;
  toggleDark: () => void;
}

export function Navbar({ isDark, toggleDark }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
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
            
            <div className="flex items-center ml-4">
              <img 
                src="/faviconsheerit.png" 
                alt="Sheerit Logo" 
                className="h-8 w-auto mr-1" 
              />
              <span className="text-xl font-bold">HEERIT</span>
            </div>
            
            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-20">
                <a href="/" className="flex items-center px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Home className="h-5 w-5 mr-3" />
                  <span>Inicio</span>
                </a>
                <a href="https://sheerit.com.co/aiuda/" target="_blank" rel="noopener noreferrer" className="flex items-center px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                  <HelpCircle className="h-5 w-5 mr-3" />
                  <span>Ayuda con mi cuenta</span>
                </a>
                <a href="#" className="flex items-center px-4 py-3 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                  <User className="h-5 w-5 mr-3" />
                  <span>Registro / Inicio de sesión</span>
                </a>
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
            
            {/* Right column - theme toggle */}
            <div className="flex items-center justify-end">
              <ThemeToggle isDark={isDark} toggle={toggleDark} />
            </div>
          </div>
          
          {/* Desktop Menu Items */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle isDark={isDark} toggle={toggleDark} />
            {/* Removed ComboMenu from here */}
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col space-y-3">
              <a href="/" className="flex items-center px-2 py-2 text-white hover:bg-white/10 rounded-md">
                <Home className="h-5 w-5 mr-3" />
                <span>Inicio</span>
              </a>
              <a href="https://sheerit.com.co/aiuda/" className="flex items-center px-2 py-2 text-white hover:bg-white/10 rounded-md">
                <HelpCircle className="h-5 w-5 mr-3" />
                <span>Ayuda con mi cuenta</span>
              </a>
              <a href="#" className="flex items-center px-2 py-2 text-white hover:bg-white/10 rounded-md">
                <User className="h-5 w-5 mr-3" />
                <span>Registro / Inicio de sesión</span>
              </a>
              {/* Removed ComboMenu from here */}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}