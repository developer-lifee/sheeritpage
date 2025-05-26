import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { PlatformCard } from './components/PlatformCard';
import { ReviewsSection } from './components/ReviewsSection';
import { Footer } from './components/Footer';
import { WhatsAppButton } from './components/WhatsAppButton';
import { platforms } from './data/platforms';
import { useDarkMode } from './hooks/useDarkMode';
import { Search } from 'lucide-react';

export default function App() {
  const [isDark, toggleDark] = useDarkMode();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter platforms based on search term
  const filteredPlatforms = platforms.filter(platform => 
    platform.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar isDark={isDark} toggleDark={() => toggleDark(!isDark)} />
      
      <Hero />
      
      <main id="platforms-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">
            Plataformas Destacadas
          </h2>
          
          {/* Search Box - Moved from navbar to here */}
          <div className="relative w-full md:w-64 lg:w-80">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar plataformas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
        </div>
        
        {filteredPlatforms.length === 0 ? (
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
                id={platform.id} // Add this line
                name={platform.name}
                price={platform.price}
                image={platform.image}
                characteristics={platform.characteristics}
              />
            ))}
          </div>
        )}
      </main>

      <Features />
      <ReviewsSection />
      <Footer />
      <WhatsAppButton />
    </div>
  );
}