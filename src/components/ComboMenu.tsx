// sheeritpage/src/components/ComboMenu.tsx (CORREGIDO)

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { platforms } from '../data/platforms';
import { CustomerFormModal } from './CustomerFormModal';
import { calculatePSEFee } from '../utils/fees';


const DISCOUNT_PER_PLATFORM = 1000;

// Nuevo estado: selecciona planes específicos
export function ComboMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlans, setSelectedPlans] = useState<Record<number, number>>({}); // planId -> cantidad
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  // Selección de planes
  const handlePlanSelection = (planId: number, quantity: number) => {
    setSelectedPlans(prev => {
      const newPlans = { ...prev };
      if (quantity <= 0) {
        delete newPlans[planId];
      } else {
        newPlans[planId] = quantity;
      }
      return newPlans;
    });
  };

  // Obtiene los planes seleccionados y su cantidad
  const getSelectedEntries = () => Object.entries(selectedPlans).map(([id, qty]) => [Number(id), qty]);

  // Calcula el total del combo
  const calculateTotal = () => {
    const entries = getSelectedEntries();
    if (entries.length === 0) return 0;
    let totalItems = 0;
    const baseTotal = entries.reduce((total, [planId, qty]) => {
      const platform = platforms.find(p => p.plans.some(plan => plan.id === planId));
      const plan = platform?.plans.find(p => p.id === planId);
      if (!plan) return total;
      totalItems += qty;
      return total + (plan.price * qty);
    }, 0);
    const discount = totalItems > 1 ? (totalItems - 1) * DISCOUNT_PER_PLATFORM : 0;
    return baseTotal - discount;
  };

  const getTotalItems = () => getSelectedEntries().reduce((s, [, qty]) => s + qty, 0);

  // Obtiene nombres de los planes seleccionados
  const getSelectedPlanNamesFlattened = () =>
    getSelectedEntries().flatMap(([planId, qty]) => {
      const platform = platforms.find(p => p.plans.some(plan => plan.id === planId));
      const plan = platform?.plans.find(p => p.id === planId);
      if (!plan || qty <= 0) return [] as string[];
      return Array.from({ length: qty }, () => `${platform?.name} - ${plan.name}`);
    });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Mensaje resumen para WhatsApp
  const getComboSummary = () =>
    getSelectedEntries().map(([planId, qty]) => {
      const platform = platforms.find(p => p.plans.some(plan => plan.id === planId));
      const plan = platform?.plans.find(p => p.id === planId);
      return plan ? `${qty}× ${platform?.name} - ${plan.name}` : '';
    }).filter(Boolean);

  const messagePreview = (() => {
    const items = getComboSummary();
    const total = calculateTotal();
    if (items.length === 0) return 'Aún no hay planes en el combo.';
    return `Hola, estoy interesado en el siguiente combo: ${items.join(', ')}. Precio total: ${formatPrice(total)}/mes`;
  })();

  const handlePSEClick = () => {
    setShowCustomerForm(true);
  };

  const handleWhatsAppClick = () => {
    const total = calculateTotal();
    const selectedPlanNames = getSelectedPlanNamesFlattened();
    const message = `Hola, estoy interesado en el siguiente combo: ${selectedPlanNames.join(', ')}. Precio total: ${formatPrice(total)}/mes`;
    const encodedMessage = encodeURIComponent(message);
    try {
      window.open(`https://api.whatsapp.com/send?phone=573118587974&text=${encodedMessage}`, '_blank');
    } catch (err) {
      console.error('No se pudo abrir WhatsApp', err);
    }
  };

  const preTotalItems = getTotalItems();
  const preSavings = preTotalItems > 1 ? (preTotalItems - 1) * DISCOUNT_PER_PLATFORM : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-6 py-3 bg-brand-primary text-white rounded-lg hover:bg-brand-dark transition-colors border border-transparent text-base font-medium"
      >
        Crear Combo
      </button>

      {/* La llamada al modal ahora es mucho más simple */}

      {showCustomerForm && (
        <CustomerFormModal
          onClose={() => setShowCustomerForm(false)}
          platformName={`Combo: ${getSelectedPlanNamesFlattened().join(', ')}`}
          platformPrice={calculateTotal()}
        />
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Fondo semi-transparente */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Contenedor del modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg w-full max-w-md mx-4 max-h-[95vh] flex flex-col">
          {/* Header fijo: título + equis inline, preview y ahorro debajo */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            {/* Top row: title + close (placed immediately next to title for better mobile UX) */}
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Crea tu Combo</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-300"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview y ahorro debajo del título */}
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              {messagePreview}
            </div>
            {preSavings > 0 && (
              <div className="mt-2 inline-block px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md text-sm font-medium">
                Ahorro aplicado: -{formatPrice(preSavings)}
              </div>
            )}
          </div>

          {/* Contenido con scroll */}
          <div className="p-6 overflow-y-auto flex-1">
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Selecciona las plataformas que deseas para tu combo personalizado.
            </p>

            {/* (Preview and savings shown in header) */}

            {/* Grid de plataformas y planes */}
            <div className="space-y-4">
              {platforms.map(platform => (
                <div key={platform.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-bold dark:text-white">{platform.name}</h4>
                  <div className="mt-2 space-y-2">
                    {platform.plans.map(plan => (
                      <div key={plan.id} className="flex items-center justify-between">
                        <div>
                          <p>{plan.name}</p>
                          <p className="text-sm text-brand-primary font-semibold">{formatPrice(plan.price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handlePlanSelection(plan.id, (selectedPlans[plan.id] || 0) - 1)} className="px-2 py-1 rounded bg-gray-200">-</button>
                          <span>{selectedPlans[plan.id] || 0}</span>
                          <button onClick={() => handlePlanSelection(plan.id, (selectedPlans[plan.id] || 0) + 1)} className="px-2 py-1 rounded bg-gray-200">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
                      className="w-full flex items-center justify-center px-4 py-2 bg-sky-400 dark:bg-blue-500 text-white rounded-lg hover:bg-sky-500 dark:hover:bg-blue-600 transition-colors text-sm"
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
                      className="w-full flex items-center justify-center px-4 py-2 bg-emerald-400 dark:bg-green-500 text-white rounded-lg hover:bg-emerald-500 dark:hover:bg-green-600 transition-colors text-sm"
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