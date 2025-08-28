import React, { useState } from 'react';
import { X } from 'lucide-react';
import { platforms } from '../data/platforms';
import { CustomerFormModal } from './CustomerFormModal';
import { calculatePSEFee } from '../utils/fees';

const DISCOUNT_PER_PLATFORM = 1000; // Descuento de mil por cada plataforma adicional

export function ComboMenu() {
  const [isOpen, setIsOpen] = useState(false);
  // selectedQuantities maps platformId -> quantity (allows multiple of same product)
  const [selectedQuantities, setSelectedQuantities] = useState<Record<number, number>>({});
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    whatsapp: '',
  });

  const getSelectedEntries = () =>
    (Object.entries(selectedQuantities) as [string, unknown][])
      .map(([id, qty]) => [id, Number(qty) || 0] as [string, number])
      .filter(([, qty]) => qty > 0);

  const calculateTotal = () => {
    const entries = getSelectedEntries();
    if (entries.length === 0) return 0;
    const baseTotal = entries.reduce((total, [idStr, qty]) => {
      const id = Number(idStr);
      const price = platforms.find(p => p.id === id)?.price || 0;
      return total + price * qty;
    }, 0);

    // Count total number of items (sum of quantities) to apply discount per additional platform
    const totalItems = entries.reduce((s, [, qty]) => s + qty, 0);
    const discount = totalItems > 1 ? (totalItems - 1) * DISCOUNT_PER_PLATFORM : 0;
    return baseTotal - discount;
  };

  const getTotalItems = () => getSelectedEntries().reduce((s, [, qty]) => s + qty, 0);

  const getSelectedPlatformNamesFlattened = () =>
    getSelectedEntries().flatMap(([idStr, qty]) => {
      const platform = platforms.find(p => p.id === Number(idStr));
      if (!platform || qty <= 0) return [] as string[];
      return Array.from({ length: qty }, () => platform.name);
    });
 

  const handleIncrement = (platformId: number) => {
    setSelectedQuantities((prev: Record<number, number>) => ({ ...prev, [platformId]: (prev[platformId] || 0) + 1 }));
  };

  const handleDecrement = (platformId: number) => {
    setSelectedQuantities((prev: Record<number, number>) => {
      const current = prev[platformId] || 0;
      if (current <= 1) {
        const { [platformId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [platformId]: current - 1 };
    });
  };

  const isSelected = (platformId: number) => !!(selectedQuantities[platformId] && selectedQuantities[platformId] > 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getPlatformSummary = () =>
    getSelectedEntries().map(([idStr, qty]) => {
      const platform = platforms.find(p => p.id === Number(idStr));
      return platform ? `${qty}× ${platform.name}` : '';
    }).filter(Boolean);

  const messagePreview = (() => {
    const items = getPlatformSummary();
    const total = calculateTotal();
    if (items.length === 0) return 'Aún no hay plataformas en el combo.';
    return `Hola, estoy interesado en el siguiente combo: ${items.join(', ')}. Precio total: ${formatPrice(total)}/mes`;
  })();

  const handlePSEClick = () => {
    setShowCustomerForm(true);
  };

  const handleWhatsAppClick = () => {
    const total = calculateTotal();
    const selectedPlatformNames = getSelectedPlatformNamesFlattened();

    const message = `Hola, estoy interesado en el siguiente combo: ${selectedPlatformNames.join(', ')}. Precio total: ${formatPrice(total)}/mes`;
    const encodedMessage = encodeURIComponent(message);
    try {
      window.open(`https://api.whatsapp.com/send?phone=573118587974&text=${encodedMessage}`, '_blank');
    } catch (err) {
      console.error('No se pudo abrir WhatsApp', err);
    }
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
  const selectedPlatformNames = getSelectedPlatformNamesFlattened();

  const total = calculateTotal();
    const pseFee = calculatePSEFee(total);
    const totalWithFee = total + pseFee;

    try {
      const response = await fetch('https://sheerit.com.co/pago/generar_token.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: customerData,
          platform: {
            name: selectedPlatformNames.length > 1 
              ? `Combo: ${selectedPlatformNames.join(', ')}` 
              : selectedPlatformNames[0],
            price: totalWithFee,
          },
          numbers: [selectedPlatformNames.length > 1 
            ? `Combo: ${selectedPlatformNames.join(', ')}` 
            : selectedPlatformNames[0]]
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Redirect to Bold's checkout page
      const boldCheckoutUrl = `https://checkout.bold.co/v2/checkout?apiKey=${data.apiKey}&orderId=${data.orderId}&amount=${data.amount}&currency=${data.currency}&description=${encodeURIComponent(data.description)}&tax=${data.tax}&integritySignature=${data.integritySignature}&redirectionUrl=${encodeURIComponent(data.redirectionUrl)}`;
      
      window.location.href = boldCheckoutUrl;
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error al procesar el pago. Por favor intente de nuevo.');
    }
  };

  // precompute totals for header display
  const preTotalItems = getTotalItems();
  const preSavings = preTotalItems > 1 ? (preTotalItems - 1) * DISCOUNT_PER_PLATFORM : 0;

  return (
    <>
      {/* Botón Crear Combo (tamaño fijo, igual que antes) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition-colors border border-transparent text-base font-medium"
      >
        Crear Combo
      </button>

  {showCustomerForm && (
        <CustomerFormModal
          onSubmit={handleCustomerSubmit}
          customerData={customerData}
          onChange={setCustomerData}
          onClose={() => setShowCustomerForm(false)}
          platform={`Combo: ${getSelectedPlatformNamesFlattened().join(', ')}`}
          price={calculateTotal()}
        />
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Fondo semi-transparente */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Contenedor del modal */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg w-full max-w-md mx-4 max-h-[95vh] flex flex-col">
            {/* Header fijo */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Crea tu Combo</h3>
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  {messagePreview}
                </div>
                {preSavings > 0 && (
                  <div className="mt-2 inline-block px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md text-sm font-medium">
                    Ahorro aplicado: -{formatPrice(preSavings)}
                  </div>
                )}
              </div>
              <div className="flex items-start">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-300"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenido con scroll */}
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Selecciona las plataformas que deseas para tu combo personalizado.
              </p>

              {/* Dynamic message preview for WhatsApp */}
              <div className="mb-4">
                <div className="w-full p-3 rounded-lg bg-brand-primary text-white text-sm">
                  {messagePreview}
                </div>
                {getPlatformSummary().length > 0 && (
                  <div className="mt-2 text-xs text-gray-700 dark:text-gray-300">
                    {getPlatformSummary().join(' • ')}
                  </div>
                )}
              </div>

              {/* Grid de plataformas */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {platforms.map(platform => (
                  <div 
                    key={platform.id} 
                    className={`relative transition-all ${
                      isSelected(platform.id) ? 'ring-2 ring-brand-primary scale-105' : 'opacity-85 hover:opacity-100'
                    }`}
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

                      {/* Quantity controls */}
                      <div className="mt-2 flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => handleDecrement(platform.id)}
                          className="px-2 py-1 bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-white rounded-md text-sm hover:bg-gray-400 dark:hover:bg-gray-500"
                          aria-label={`Disminuir ${platform.name}`}
                        >-
                        </button>

                        {/* Prominent quantity badge */}
                        <div className="text-sm font-medium px-3 py-1 bg-brand-primary text-white rounded-full shadow-sm">
                          {selectedQuantities[platform.id] || 0}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleIncrement(platform.id)}
                          className="px-2 py-1 bg-brand-primary text-white rounded-md text-sm hover:bg-brand-dark"
                          aria-label={`Aumentar ${platform.name}`}
                        >+
                        </button>
                      </div>

                      {isSelected(platform.id) && (
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

              {getTotalItems() > 1 && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {(() => {
                      const items = getTotalItems();
                      const savings = (items - 1) * DISCOUNT_PER_PLATFORM;
                      return `¡Ahorro aplicado! -${formatPrice(savings)} por ${items - 1} unidad${items - 1 > 1 ? 'es' : ''} adicional${items - 1 > 1 ? 'es' : ''}.`;
                    })()}
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
                type="button"
                onClick={() => setShowPaymentOptions(true)}
                disabled={getTotalItems() === 0}
                className="w-full py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {showPaymentOptions ? (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handlePSEClick}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-600 transition-colors text-sm"
                    >
                      <img 
                        src="https://chukuwata.org.co/wp-content/uploads/2019/01/Boton-Azul-PSE.png" 
                        alt="PSE" 
                        className="h-5 w-auto mr-2"
                      />
                      Pagar con PSE (+{formatPrice(calculatePSEFee(calculateTotal()))})
                    </button>
                    <button
                      type="button"
                      onClick={handleWhatsAppClick}
                      className="w-full flex items-center justify-center px-4 py-2 bg-green-500 dark:bg-green-500 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-600 transition-colors text-sm"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2 fill-current">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 1.856.001 3.598.723 4.907 2.034 1.31 1.311 2.031 3.054 2.03 4.908-.001 3.825-3.113 6.938-6.937 6.938z" />
                      </svg>
                      Pagar por WhatsApp
                    </button>
                  </div>
                ) : (
                  "Solicitar este combo"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
