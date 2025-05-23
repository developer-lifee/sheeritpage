import React from 'react';
import { Facebook, Instagram, Linkedin, FileText } from 'lucide-react';
import { TikTok } from './icons/TikTok';

export function Footer() {
  return (
    <footer className="bg-brand-primary dark:bg-gray-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <img 
                src="/faviconsheerit.png" 
                alt="Sheerit Logo" 
                className="h-8 w-auto mr-1" 
              />
              <h3 className="text-xl font-bold">HEERIT</h3>
            </div>
            <p className="text-white/80">
              Tu destino único para todas las plataformas de streaming.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="https://www.facebook.com/sheer.it/" className="text-white/80 hover:text-white transition-colors" aria-label="Facebook">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="https://www.tiktok.com/@sharingconsheerit" className="text-white/80 hover:text-white transition-colors" aria-label="TikTok">
                <TikTok className="w-6 h-6" />
              </a>
              <a href="https://www.instagram.com/sheerit.com.co/" className="text-white/80 hover:text-white transition-colors" aria-label="Instagram">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="https://www.linkedin.com/company/sheerit/" className="text-white/80 hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-6 h-6" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-white/80 hover:text-white">Inicio</a></li>
              <li><a href="#platforms-section" className="text-white/80 hover:text-white">Plataformas</a></li>
              <li><a href="#" className="text-white/80 hover:text-white">Precios</a></li>
              <li><a href="#" className="text-white/80 hover:text-white">Contacto</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Soporte</h4>
            <ul className="space-y-2">
              <li><a href="https://sheerit.com.co/aiuda/" className="text-white/80 hover:text-white">Centro de ayuda</a></li>
              <li><a href="#" className="text-white/80 hover:text-white">Política de reembolso</a></li>
              <li>
                <a 
                  href="/T&C_sheerit.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white flex items-center"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  <span>Términos y Condiciones</span>
                </a>
              </li>
              <li><a href="#" className="text-white/80 hover:text-white">FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Contacto</h4>
            <ul className="space-y-2 text-white/80">
              <li>Email: soporte@sheerit.com.co</li>
              <li>WhatsApp: +57 3118587974</li>
              <li>Horario: 24/7</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-white/10 text-center text-white/80">
          <p>&copy; 2024 SHEERIT. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}