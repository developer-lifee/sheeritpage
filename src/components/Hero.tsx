import React from 'react';
import { Play } from 'lucide-react';
import { ComboMenu } from './ComboMenu';

export function Hero() {
  const scrollToPlatforms = () => {
    const platformsSection = document.getElementById('platforms-section');
    if (platformsSection) {
      platformsSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };
  
  return (
    <div className="relative bg-brand-primary dark:bg-gray-800 text-white">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&q=80"
          alt="Streaming Background"
          className="w-full h-full object-cover opacity-20"
        />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Todo el entretenimiento en un solo lugar
          </h1>
          <p className="mt-6 text-xl max-w-3xl mx-auto">
            Descubre las mejores plataformas de streaming y encuentra la combinación perfecta para tu entretenimiento.
          </p>
          <div className="mt-10 space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <button 
              onClick={scrollToPlatforms}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-brand-primary bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 transition-colors"
            >
              <Play className="h-5 w-5 mr-2" />
              Explorar plataformas
            </button>
            
            {/* Added ComboMenu here */}
            <ComboMenu />
          </div>
        </div>
      </div>
    </div>
  );
}