// sheeritpage/src/components/ComboMenu.tsx (CORREGIDO)

import React, { useState, useEffect } from 'react';
import { useComboCart } from '../hooks/useComboCart';
import { X, ShoppingCart } from 'lucide-react';
import { CustomerFormModal } from './CustomerFormModal';
import { calculatePSEFee } from '../utils/fees';

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
  discountTier?: string;
}

interface PricingRules {
  discountPerPlatform: number;
  durationDiscounts: Record<string, Record<string, { duration: number; factor: number; label: string; name: string }>>;
}

const DEFAULT_RULES: PricingRules = {
  discountPerPlatform: 1000,
  durationDiscounts: {
    "A": {
      "1": { duration: 1, factor: 1.00, label: "mes", name: "mensual" },
      "3": { duration: 3, factor: 0.97, label: "trimestre", name: "trimestral" },
      "6": { duration: 6, factor: 0.93, label: "semestre", name: "semestral" },
      "12": { duration: 12, factor: 0.85, label: "año", name: "anual" }
    },
    "B": {
      "1": { duration: 1, factor: 1.00, label: "mes", name: "mensual" },
      "3": { duration: 3, factor: 0.98, label: "trimestre", name: "trimestral" },
      "6": { duration: 6, factor: 0.95, label: "semestre", name: "semestral" },
      "12": { duration: 12, factor: 0.90, label: "año", name: "anual" }
    },
    "C": {
      "1": { duration: 1, factor: 1.00, label: "mes", name: "mensual" },
      "3": { duration: 3, factor: 0.99, label: "trimestre", name: "trimestral" },
      "6": { duration: 6, factor: 0.97, label: "semestre", name: "semestral" },
      "12": { duration: 12, factor: 0.94, label: "año", name: "anual" }
    }
  }
};

// Nuevo estado: selecciona planes específicos
export function ComboMenu() {
  const {
    selectedPlans,
    isComboOpen,
    setIsComboOpen,
    updatePlanQuantity,
    platforms
  } = useComboCart();

  const [duration, setDuration] = useState<'1' | '3' | '6' | '12'>('1');
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  // Selección de planes
  const handlePlanSelection = (planId: number, quantity: number) => {
    updatePlanQuantity(planId, quantity);
  };

  // Obtiene los planes seleccionados y su cantidad
  const getSelectedEntries = (): Array<[number, number]> =>
    Object.entries(selectedPlans).map(([id, qty]) => [Number(id), Number(qty)] as [number, number]);

  const isFixedPlan = (planName: string): boolean => {
    const name = planName.toLowerCase();
    return name.includes('anual') || name.includes('trimestral') || name.includes('semestral') || name.includes('12 meses') || name.includes('3 meses');
  };

  // Calcula el total del combo
  const calculateTotal = (): number => {
    const entries = getSelectedEntries();
    if (entries.length === 0) return 0;
    
    let totalItems = 0;
    let fixedTotal = 0;
    
    entries.forEach(([planId, qty]) => {
      const platform = platforms.find(p => p.plans.some(plan => plan.id === planId));
      const plan = platform?.plans.find(p => p.id === planId);
      if (!plan) return;
      
      if (isFixedPlan(plan.name)) {
        fixedTotal += plan.price * qty;
      } else {
        totalItems += qty;
      }
    });
    
    const discountPerItem = totalItems > 1 ? ((totalItems - 1) * DEFAULT_RULES.discountPerPlatform) / totalItems : 0;
    
    let monthlyFinalTotal = 0;
    entries.forEach(([planId, qty]) => {
      const platform = platforms.find(p => p.plans.some(plan => plan.id === planId));
      const plan = platform?.plans.find(p => p.id === planId);
      if (!plan || !platform) return;
      
      if (!isFixedPlan(plan.name)) {
        const tier = (platform as any).discountTier || 'A';
        const tierRules = DEFAULT_RULES.durationDiscounts[tier] || DEFAULT_RULES.durationDiscounts['A'];
        const durationRule = tierRules[duration];
        const factor = durationRule ? durationRule.factor : 1.0;
        
        // Poner el precio unitario base mensual descontando la parte proporcional del combo
        const itemMonthlyPrice = plan.price - discountPerItem;
        monthlyFinalTotal += (itemMonthlyPrice * qty * parseInt(duration)) * factor;
      }
    });
    
    const finalTotal = Math.max(0, monthlyFinalTotal) + fixedTotal;
    
    return Math.ceil(finalTotal / 1000) * 1000;
  };

  const getTotalItems = (): number => getSelectedEntries().reduce((s, [, qty]) => s + qty, 0);

  // Obtiene nombres de los planes seleccionados
  const getSelectedPlanNamesFlattened = (): string[] =>
    getSelectedEntries().flatMap(([planId, qty]) => {
      const platform = platforms.find(p => p.plans.some(plan => plan.id === planId));
      const plan = platform?.plans.find(p => p.id === planId);
      if (!plan || qty <= 0) return [];
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
  const getComboSummary = (): string[] =>
    getSelectedEntries()
      .map(([planId, qty]) => {
        const platform = platforms.find(p => p.plans.some(plan => plan.id === planId));
        const plan = platform?.plans.find(p => p.id === planId);
        return plan ? `${qty}× ${platform?.name} - ${plan.name}` : '';
      })
      .filter(Boolean) as string[];

  const messagePreview = (() => {
    const items = getComboSummary();
    const total = calculateTotal();
    if (items.length === 0) return 'Aún no hay planes en el combo.';
    const mesStr = duration === '1' ? '1 mes' : `${duration} meses`;
    return `Hola, estoy interesado en el siguiente combo por ${mesStr}: ${items.join(', ')}. Precio total: ${formatPrice(total)}`;
  })();

  const handlePSEClick = () => {
    setShowCustomerForm(true);
  };

  const handleWhatsAppClick = () => {
    const total = calculateTotal();
    const selectedPlanNames = getSelectedPlanNamesFlattened();
    const mesStr = duration === '1' ? '1 mes' : `${duration} meses`;
    const message = `Hola, estoy interesado en el siguiente combo por ${mesStr}: ${selectedPlanNames.join(', ')}. Precio total: ${formatPrice(total)}`;
    const encodedMessage = encodeURIComponent(message);
    try {
      window.open(`https://api.whatsapp.com/send?phone=573118587974&text=${encodedMessage}`, '_blank');
    } catch (err) {
      console.error('No se pudo abrir WhatsApp', err);
    }
  };

  const preTotalItems = getTotalItems();
  const getBaseTotalSum = (): number => {
    const entries = getSelectedEntries();
    return entries.reduce((total, [planId, qty]) => {
      const platform = platforms.find(p => p.plans.some(plan => plan.id === planId));
      const plan = platform?.plans.find(p => p.id === planId);
      if (!plan) return total;
      
      const multiplier = isFixedPlan(plan.name) ? 1 : parseInt(duration);
      return total + (plan.price * qty * multiplier);
    }, 0);
  };
  const preSavings = (() => {
    const standardCost = getBaseTotalSum();
    if (standardCost === 0) return 0;
    const actualCost = calculateTotal();
    const savings = standardCost - actualCost;
    return savings > 0 ? savings : 0;
  })();

  return (
    <>

      {/* La llamada al modal ahora es mucho más simple */}

      {showCustomerForm && (
        <CustomerFormModal
          onClose={() => setShowCustomerForm(false)}
          platformName={`Combo (${duration} mes${duration === '1' ? '' : 'es'}): ${getSelectedPlanNamesFlattened().join(', ')}`}
          platformPrice={calculateTotal()}
        />
      )}

      {isComboOpen && (
        <div className="fixed inset-0 md:inset-y-0 md:right-0 md:left-auto md:w-96 z-50">
          {/* Fondo semi-transparente */}
          <div className="absolute inset-0 bg-black/50 md:hidden" onClick={() => setIsComboOpen(false)} />

          {/* Contenedor del drawer */}
          <div className="absolute bg-white dark:bg-gray-800 flex flex-col shadow-2xl transition-all duration-300
            top-0 left-0 right-0 max-h-[80vh] rounded-b-2xl border-b border-gray-200 dark:border-gray-700
            md:bottom-0 md:h-full md:w-full md:max-h-full md:rounded-none md:border-l md:border-b-0 md:right-0"
          >
            {/* Header fijo: título + equis inline, preview y ahorro debajo */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              {/* Top row: title + close */}
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Crea tu Combo</h3>
                <button
                  type="button"
                  onClick={() => setIsComboOpen(false)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-300 transition-colors"
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
              {preTotalItems === 0 ? (
                <div className="text-center py-10 flex flex-col items-center justify-center">
                  <ShoppingCart className="w-16 h-16 text-gray-400 mb-4 animate-pulse" />
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Tu combo está vacío</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs text-center">¡Agrega plataformas desde la página principal para armar tu combo y obtener descuentos!</p>
                  <button
                    onClick={() => setIsComboOpen(false)}
                    className="px-6 py-2 bg-brand-primary hover:bg-brand-dark text-white font-bold rounded-lg transition-colors"
                  >
                    Ver plataformas
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 font-semibold text-sm border-b pb-2">
                    Plataformas en tu Combo:
                  </p>

                  {/* Grid de plataformas y planes seleccionados */}
                  <div className="space-y-4">
                    {platforms
                      .filter(platform => platform.plans.some(plan => (selectedPlans[plan.id] || 0) > 0))
                      .map(platform => (
                        <div key={platform.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                              {platform.image ? (
                                <img
                                  src={platform.image}
                                  alt={platform.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                              ) : (
                                <span className="text-xs text-gray-500">N/A</span>
                              )}
                            </div>
                            <h4 className="font-bold dark:text-white flex-1">{platform.name}</h4>
                          </div>
                          <div className="mt-2 space-y-2">
                            {platform.plans
                              .filter(plan => (selectedPlans[plan.id] || 0) > 0)
                              .map(plan => (
                                <div key={plan.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
                                  <div>
                                    <p className="text-sm font-medium">{plan.name}</p>
                                    <p className="text-xs text-brand-primary font-semibold">{formatPrice(plan.price)}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handlePlanSelection(plan.id, (selectedPlans[plan.id] || 0) - 1)}
                                      className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-sm font-bold transition-colors"
                                    >-</button>
                                    <span className="text-sm w-5 text-center font-semibold">{selectedPlans[plan.id] || 0}</span>
                                    <button
                                      onClick={() => handlePlanSelection(plan.id, (selectedPlans[plan.id] || 0) + 1)}
                                      className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-sm font-bold transition-colors"
                                    >+</button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="mt-6 text-center border-t pt-4 border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => setIsComboOpen(false)}
                      className="text-brand-primary hover:text-brand-dark font-bold hover:underline text-sm transition-colors"
                    >
                      + Agregar más plataformas al combo
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800 z-10">
              <div className="flex gap-2 mb-4 justify-center">
                {[
                  { d: '1', label: '1 Mes', desc: '' },
                  { d: '3', label: '3 Meses', desc: '3% dto' },
                  { d: '6', label: '6 Meses', desc: '7% dto' },
                  { d: '12', label: '12 Meses', desc: '15% dto' }
                ].map(({ d, label, desc }) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d as any)}
                    className={`px-2 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex flex-col items-center justify-center min-w-[70px] ${duration === d ? 'bg-brand-primary text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-300'}`}
                  >
                    <span>{label}</span>
                    {desc && (
                      <span className={`text-[10px] ${duration === d ? 'text-white/80' : 'text-green-600 dark:text-green-400 font-medium'}`}>
                        {desc}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold text-gray-800 dark:text-white">Total:</span>
                <span className="text-xl font-bold text-brand-primary">
                  {formatPrice(calculateTotal())}
                </span>
              </div>

              {!showPaymentOptions ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentOptions(true)}
                    disabled={getTotalItems() === 0}
                    className="w-full py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Pasar al Pago
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsComboOpen(false)}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-lg transition-colors text-sm text-center md:hidden"
                  >
                    Seguir Comprando
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handlePSEClick}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    <img 
                      src="https://chukuwata.org.co/wp-content/uploads/2019/01/Boton-Azul-PSE.png" 
                      alt="PSE" 
                      className="h-5 w-auto"
                    />
                    Pagar con PSE (+{formatPrice(calculatePSEFee(calculateTotal()))})
                  </button>
                  <button
                    type="button"
                    onClick={handleWhatsAppClick}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 1.856.001 3.598.723 4.907 2.034 1.31 1.311 2.031 3.054 2.03 4.908-.001 3.825-3.113 6.938-6.937 6.938z" />
                    </svg>
                    Pagar por WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentOptions(false)}
                    className="w-full py-2 text-sm text-gray-500 hover:underline"
                  >
                    Regresar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}