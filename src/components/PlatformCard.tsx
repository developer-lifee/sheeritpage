// sheeritpage/src/components/PlatformCard.tsx
import { useState, useEffect } from 'react';
import { useComboCart } from '../hooks/useComboCart';

interface Plan { id: number; name: string; price: number; characteristics: string[]; }
interface PlatformCardProps {
  id: number;
  name: string;
  image: string;
  price?: number;
  characteristics?: string[];
  plans?: Plan[];
}

export function PlatformCard({ id, name, image, price, characteristics, plans }: PlatformCardProps) {
  const { addToCombo, setIsComboOpen } = useComboCart();
  const [activePlanIndex, setActivePlanIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const formatPrice = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(value);

  const safePlans: Plan[] = Array.isArray(plans) ? plans : [];
  const hasPlans = safePlans.length > 0;
  
  // Sort plans by price ascending (cheapest first)
  const sortedPlans = hasPlans ? [...safePlans].sort((a, b) => a.price - b.price) : [];
  
  // Auto-slide effect for multiple plans
  useEffect(() => {
    if (sortedPlans.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setActivePlanIndex((prev) => (prev + 1) % sortedPlans.length);
    }, 4500); // Transitions every 4.5 seconds
    return () => clearInterval(interval);
  }, [sortedPlans.length, isHovered]);

  const activePlan = hasPlans ? sortedPlans[activePlanIndex] : null;
  const currentPrice = activePlan ? activePlan.price : (price || 0);
  const currentCharacteristics = activePlan ? activePlan.characteristics : (characteristics || []);
  const currentPlanName = activePlan ? activePlan.name : '';
  const currentId = activePlan ? activePlan.id : (id * 1000);

  function calculatePSEFee(price: number) {
    return price * 0.03 + 2000;
  }

  const pseFee = currentPrice ? calculatePSEFee(currentPrice) : 0;
  const totalWithPSE = currentPrice + pseFee;

  const checkIsPersonalEmail = () => {
    const combinedPlanText = [
      currentPlanName,
      ...currentCharacteristics
    ].join(' ').toLowerCase();

    // 1. Negative override: If plan text mentions shared account / sheerit account / account provided by us
    const isExplicitlyShared = [
      'compartida', 
      'nuestro correo', 
      'proporcionada por nosotros', 
      'proporcionado por nosotros', 
      'login compartido',
      'correo de sheerit',
      'pantalla'
    ].some(kw => combinedPlanText.includes(kw));

    if (isExplicitlyShared && !combinedPlanText.includes('tu correo') && !combinedPlanText.includes('correo propio') && !combinedPlanText.includes('tu propia cuenta')) {
      return false;
    }

    // 2. Positive check: Check plan text and platform name for personal email indicators
    const isPersonal = [
      'tu correo', 
      'correo propio', 
      'tu cuenta', 
      'tu propio correo', 
      'mismo apple id', 
      'invitacion', 
      'invitación', 
      'familiar', 
      'family', 
      'owner'
    ].some(kw => combinedPlanText.includes(kw) || (name.toLowerCase().includes('youtube') && !isExplicitlyShared));

    return isPersonal;
  };

  const isPersonalEmail = checkIsPersonalEmail();

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative overflow-hidden rounded-2xl shadow-lg w-full max-w-sm bg-white dark:bg-gray-800 flex flex-col justify-between transition-all duration-300 hover:shadow-xl border border-gray-100 dark:border-gray-700 min-h-[580px] h-full"
    >
      {/* Type Badge (Correo Personal vs Correo Sheerit) */}
      <div className="absolute top-3 right-3 z-20">
        {isPersonalEmail ? (
          <span className="bg-emerald-600/95 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-lg border border-emerald-400/40 flex items-center gap-1 tracking-tight">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse"></span>
            ✉️ En Tu Correo Personal
          </span>
        ) : (
          <span className="bg-indigo-600/95 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-lg border border-indigo-400/40 flex items-center gap-1 tracking-tight">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-200"></span>
            🔑 Perfil (Correo Sheerit)
          </span>
        )}
      </div>

      {/* Header Banner Background */}
      <div className="relative h-32 bg-slate-900 flex-shrink-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm scale-110" 
          style={{ backgroundImage: image ? `url(${image})` : 'none' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-transparent" />
      </div>

      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <img src={image} alt={name} className="w-16 h-16 object-cover rounded-full border-4 border-white dark:border-gray-800 shadow-md bg-white" />
      </div>

      <div className="p-4 pt-10 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="text-xl font-bold mb-1 text-center dark:text-white line-clamp-1">{name}</h3>

          {/* Informative Sub-tag */}
          <div className="flex justify-center mb-2">
            {isPersonalEmail ? (
              <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                ✉️ Se activa en tu correo personal
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                🔑 Se entrega correo y clave asignados
              </span>
            )}
          </div>

          {/* Plan navigation slot (fixed height) */}
          <div className="h-8 mb-2 flex items-center justify-center">
            {sortedPlans.length > 1 && (
              <div className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 py-1 px-2 rounded-lg">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePlanIndex((prev) => (prev - 1 + sortedPlans.length) % sortedPlans.length);
                  }}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs font-semibold px-2 py-0.5 rounded text-brand-primary dark:text-brand-light text-center line-clamp-1 max-w-[160px]">
                  {currentPlanName}
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePlanIndex((prev) => (prev + 1) % sortedPlans.length);
                  }}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Price display */}
          <div className="text-center mb-2">
            <p className="text-2xl font-bold text-brand-primary dark:text-brand-light transition-all duration-300">
              {formatPrice(currentPrice)}/mes
            </p>
          </div>

          {/* Characteristics list container with fixed height */}
          <div key={activePlanIndex} className="h-[135px] overflow-y-auto space-y-1 text-gray-600 dark:text-gray-300 pr-1 scrollbar-thin">
            <ul className="space-y-1">
              {currentCharacteristics.map((feature, index) => (
                <li key={index} className="flex items-start text-xs">
                  <svg className="w-3.5 h-3.5 mr-1.5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 4 10.586l1.414-1.414L8.414 12l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="leading-tight">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section: PSE Fee + Dots + Button */}
        <div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 text-center">
            <p>Pagando por PSE aprox: <strong>{formatPrice(totalWithPSE)}</strong></p>
            <p className="opacity-70 text-[9.5px]">Incluye comisión estimada</p>
          </div>

          {/* Carousel indicators dots slot */}
          <div className="h-3 flex justify-center items-center gap-1.5 mb-3">
            {sortedPlans.length > 1 && sortedPlans.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePlanIndex(idx);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === activePlanIndex 
                    ? 'bg-brand-primary w-4' 
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 w-2'
                }`}
                aria-label={`Ir al plan ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => {
              addToCombo(currentId);
              setIsComboOpen(true);
            }}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Agregar al Combo
          </button>
        </div>
      </div>
    </div>
  );
}