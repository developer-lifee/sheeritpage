import { useState } from 'react';
import { X } from 'lucide-react';
import { platforms } from '../data/platforms';

const DISCOUNT_PER_PLATFORM = 1000; // Descuento de mil por cada plataforma adicional

export function ComboMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);

  const calculateTotal = () => {
    if (selectedPlatforms.length === 0) return 0;
    
    // Suma el precio base de todas las plataformas seleccionadas
    const baseTotal = selectedPlatforms.reduce(
      (total, id) => total + (platforms.find(p => p.id === id)?.price || 0), 
      0
    );
    
    // Aplica descuento de 1000 por cada plataforma adicional
    const discount = selectedPlatforms.length > 1 
      ? (selectedPlatforms.length - 1) * DISCOUNT_PER_PLATFORM 
      : 0;
    
    return baseTotal - discount;
  };

  const handleCheckboxChange = (platformId: number) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleWhatsAppClick = () => {
    if (selectedPlatforms.length === 0) return;
    
    const selectedPlatformNames = selectedPlatforms
      .map(id => platforms.find(p => p.id === id)?.name)
      .filter(Boolean)
      .join(", ");
    
    const total = calculateTotal();
    const message = `Hola, estoy interesado en una suscripción de: ${selectedPlatformNames}\nCosto Total: ${formatPrice(total)}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/+573118587974/?text=${encodedMessage}`, '_blank');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition-colors border border-transparent text-base font-medium"
      >
        Crear Combo
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Fondo semi-transparente */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Contenedor del modal - con estructura para header y footer fijos */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg w-full max-w-md mx-4 max-h-[95vh] flex flex-col">
            {/* Header fijo */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Crea tu Combo</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-300"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido con scroll */}
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Selecciona las plataformas que deseas para tu combo personalizado.
              </p>

              {/* Grid de plataformas */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mb-4">
                {platforms.map(platform => (
                  <div 
                    key={platform.id} 
                    className={`relative cursor-pointer transition-all ${
                      selectedPlatforms.includes(platform.id) ? 'ring-2 ring-brand-primary scale-105' : 'opacity-85 hover:opacity-100'
                    }`}
                    onClick={() => handleCheckboxChange(platform.id)}
                    data-nombre={platform.name}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full overflow-hidden mb-2 shadow-md">
                        <img 
                          src={platform.image} 
                          alt={platform.name}
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://via.placeholder.com/80?text=${platform.name}`;
                          }}
                        />
                      </div>
                      
                      <h4 className="font-medium text-center text-gray-800 dark:text-white">
                        {platform.name}
                      </h4>
                      <span className="text-sm text-brand-primary font-bold">
                        {formatPrice(platform.price)}/mes
                      </span>
                      
                      <input
                        type="checkbox"
                        id={`platform-${platform.id}`}
                        checked={selectedPlatforms.includes(platform.id)}
                        onChange={() => {}}
                        className="sr-only"
                        value={platform.price}
                      />
                      
                      {selectedPlatforms.includes(platform.id) && (
                        <div className="absolute -top-1 -right-1 bg-brand-primary text-white rounded-full w-6 h-6 flex items-center justify-center">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-4 w-4" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path 
                              fillRule="evenodd" 
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                              clipRule="evenodd" 
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedPlatforms.length > 1 && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ¡Ahorro aplicado! <span className="font-bold">-{formatPrice((selectedPlatforms.length - 1) * DISCOUNT_PER_PLATFORM)}</span> por {selectedPlatforms.length - 1} plataforma{selectedPlatforms.length > 2 ? 's' : ''} adicional{selectedPlatforms.length > 2 ? 'es' : ''}.
                  </p>
                </div>
              )}
            </div>

            {/* Footer fijo */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800 z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold text-gray-800 dark:text-white">Total:</span>
                <span className="text-xl font-bold text-brand-primary">
                  {formatPrice(calculateTotal())}/mes
                </span>
              </div>

              <button
                id="pedido"
                onClick={handleWhatsAppClick}
                disabled={selectedPlatforms.length === 0}
                className="w-full py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Solicitar este combo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}