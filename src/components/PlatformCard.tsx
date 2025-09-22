// sheeritpage/src/components/PlatformCard.tsx (CORREGIDO)
import React, { useState } from 'react';
import { CustomerFormModal } from './CustomerFormModal';
import { calculatePSEFee } from '../utils/fees';

interface Plan { id: number; name: string; price: number; characteristics: string[]; }
interface PlatformCardProps {
  id: number;
  name: string;
  image: string;
  // Formato antiguo
  price?: number;
  characteristics?: string[];
  // Formato nuevo
  plans?: Plan[];
}

export function PlatformCard({ id, name, image, price, characteristics, plans }: PlatformCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  const formatPrice = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(value);

  const handleBuyClick = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowCustomerForm(true);
  };

  const safePlans: Plan[] = Array.isArray(plans) ? plans : [];
  const hasPlans = safePlans.length > 0;
  const basePrice = hasPlans ? Math.min(...safePlans.map(p => p.price)) : (price || 0);
  const defaultCharacteristics = hasPlans ? (safePlans[0]?.characteristics || []) : (characteristics || []);
  const pseFee = basePrice ? calculatePSEFee(basePrice) : 0;
  const totalWithPSE = basePrice + pseFee;

  return (
    <>
      {showCustomerForm && selectedPlan && (
        <CustomerFormModal
          onClose={() => setShowCustomerForm(false)}
          platformName={`${name} - ${selectedPlan.name}`}
          platformPrice={selectedPlan.price}
        />
      )}

      <div className="relative overflow-hidden rounded-xl shadow-lg w-full max-w-sm bg-white dark:bg-gray-800 flex flex-col">
        <div className="relative h-32 bg-cover bg-center bg-gray-200 dark:bg-gray-700" style={{ backgroundImage: image ? `url(${image})` : 'none' }}>
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
          <img src={image} alt={name} className="w-16 h-16 object-cover rounded-full border-4 border-white dark:border-gray-800" />
        </div>
        <div className="p-4 pt-10 flex flex-col flex-grow">
          <div className="text-center mb-4">
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {hasPlans && safePlans.length > 1 ? 'Desde' : ''}
            </span>
            <p className="text-xl font-bold text-brand-primary dark:text-brand-light">
              {formatPrice(basePrice)}/mes
            </p>
          </div>
          <h3 className="text-xl font-bold mb-4 text-center dark:text-white">{name}</h3>

          {!showOptions ? (
            <>
              <ul className="mb-4 space-y-1 text-gray-600 dark:text-gray-300 flex-grow">
                {defaultCharacteristics.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 4 10.586l1.414-1.414L8.414 12l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                <p>Pagando por PSE aprox: <strong>{formatPrice(totalWithPSE)}</strong></p>
                <p className="opacity-70">Incluye comisión estimada</p>
              </div>
              <button
                onClick={() => hasPlans && safePlans.length > 1 ? setShowOptions(true) : handleBuyClick(hasPlans ? safePlans[0] : { id: id * 1000, name: 'Suscripción', price: basePrice, characteristics: defaultCharacteristics })}
                className="w-full mt-auto py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark transition-colors"
              >
                {hasPlans && safePlans.length > 1 ? 'Ver Planes' : 'Comprar Ahora'}
              </button>
            </>
          ) : (
            <div className="space-y-3">
              {safePlans.map(plan => (
                <div key={plan.id} className="p-2 border rounded-md">
                  <p className="font-bold">{plan.name} - {formatPrice(plan.price)}</p>
                  <ul className="text-xs text-gray-500 mt-1">
                    {plan.characteristics.map(c => <li key={c}>- {c}</li>)}
                  </ul>
                  <button
                    onClick={() => handleBuyClick(plan)}
                    className="w-full mt-2 py-1 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white font-bold rounded-lg hover:bg-gray-300"
                  >
                    Seleccionar
                  </button>
                </div>
              ))}
              <button
                onClick={() => setShowOptions(false)}
                className="w-full text-center text-sm text-gray-500 hover:underline mt-2"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}