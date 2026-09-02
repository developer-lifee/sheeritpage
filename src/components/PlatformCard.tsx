// sheeritpage/src/components/PlatformCard.tsx
import { useState, useEffect } from 'react';
import { useComboCart } from '../hooks/useComboCart';
import { useCurrency } from '../hooks/useCurrency';

interface Plan { 
  id: number; 
  name: string; 
  price: number; 
  characteristics: string[]; 
  isPersonalEmail?: boolean; 
  isAvailable?: boolean;
  reason?: string;
  detalles?: string;
}

interface PlatformCardProps {
  id: number;
  name: string;
  image: string;
  price?: number;
  characteristics?: string[];
  plans?: Plan[];
  isPersonalEmail?: boolean;
  isAvailable?: boolean;
  reason?: string;
  incident?: string;
}

export function PlatformCard({ 
  id, 
  name, 
  image, 
  price, 
  characteristics, 
  plans, 
  isAvailable = true, 
  reason, 
  incident 
}: PlatformCardProps) {
  const { addToCombo, setIsComboOpen } = useComboCart();
  const { formatPrice } = useCurrency();
  const [activePlanIndex, setActivePlanIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

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

  // Stock availability check
  const isPlatformAvailable = isAvailable !== false;
  const isPlanAvailable = activePlan ? (activePlan.isAvailable !== false && isPlatformAvailable) : isPlatformAvailable;
  const outOfStockReason = activePlan?.reason || reason || 'Sin stock de momento';

  function calculatePSEFee(price: number) {
    return price * 0.03 + 2000;
  }

  const pseFee = currentPrice ? calculatePSEFee(currentPrice) : 0;
  const totalWithPSE = currentPrice + pseFee;

  const checkIsPersonalEmail = () => {
    const combinedPlanText = [
      name,
      currentPlanName,
      ...currentCharacteristics,
      activePlan?.detalles || ''
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

    if (isExplicitlyShared && !combinedPlanText.includes('tu correo') && !combinedPlanText.includes('correo propio') && !combinedPlanText.includes('tu propia cuenta') && !combinedPlanText.includes('extra') && !combinedPlanText.includes('one')) {
      return false;
    }

    // 2. Positive check: Check plan text and platform name for personal email indicators
    const isPersonal = [
      'tu correo', 
      'correo propio', 
      'tu cuenta', 
      'tu propio correo', 
      'mismo apple id', 
      'apple id',
      'apple one',
      'extra',
      'invitacion', 
      'invitación', 
      'familiar', 
      'family', 
      'owner',
      'personal'
    ].some(kw => combinedPlanText.includes(kw) || (name.toLowerCase().includes('youtube') && !isExplicitlyShared));

    return isPersonal;
  };

  const isPersonalEmail = activePlan && activePlan.isPersonalEmail !== undefined
    ? activePlan.isPersonalEmail
    : checkIsPersonalEmail();

  const getFallbackImage = (platformName: string, originalImage: string) => {
    const n = (platformName || '').toLowerCase();
    if (n.includes('claude')) return '/plataform/claude.svg';
    if (n.includes('netflix')) return '/plataform/netflix.webp';
    if (n.includes('disney')) return '/plataform/disney.webp';
    if (n.includes('prime') || n.includes('amazon')) return '/plataform/prime_video.png';
    if (n.includes('spotify')) return '/plataform/spotify.png';
    if (n.includes('youtube')) return '/plataform/youtube.webp';
    if (n.includes('crunchyroll') || n.includes('crunchy')) return '/plataform/crunchyroll.svg';
    if (n.includes('paramount')) return '/plataform/paramount.webp';
    if (n.includes('chatgpt') || n.includes('gpt')) return '/plataform/chatgpt-icon-logo.webp';
    if (n.includes('hbo') || n.includes('max platino') || n.includes('hbomax') || (n.includes('max') && !n.includes('claude'))) return '/plataform/hbo.webp';
    return originalImage || '/faviconsheerit.png';
  };

  const [imgSrc, setImgSrc] = useState(() => getFallbackImage(name, image));

  useEffect(() => {
    setImgSrc(getFallbackImage(name, image));
  }, [name, image]);

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-2xl shadow-lg w-full max-w-sm bg-white dark:bg-gray-800 flex flex-col justify-between transition-all duration-300 hover:shadow-xl border ${
        !isPlanAvailable ? 'border-red-300 dark:border-red-900/50 opacity-95' : 'border-gray-100 dark:border-gray-700'
      } min-h-[580px] h-full`}
    >
      {/* Stock Status Badge (Left) */}
      {!isPlanAvailable && (
        <div className="absolute top-3 left-3 z-20">
          <span className="bg-red-600/95 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg border border-red-400/50 flex items-center gap-1 tracking-tight animate-pulse">
            🚫 Sin Stock de Momento
          </span>
        </div>
      )}

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
          style={{ backgroundImage: imgSrc ? `url(${imgSrc})` : 'none' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-transparent" />
      </div>

      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <img 
          src={imgSrc} 
          alt={name} 
          onError={() => setImgSrc(getFallbackImage(name, ''))}
          className="w-16 h-16 object-contain p-2 rounded-full border-4 border-white dark:border-gray-800 shadow-md bg-white" 
        />
      </div>

      <div className="p-4 pt-10 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="text-xl font-bold mb-1 text-center dark:text-white line-clamp-1">{name}</h3>

          {/* Active Incident Warning chip */}
          {incident && (
            <div className="mb-2 mx-auto max-w-[280px] p-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg flex items-center justify-center gap-1 text-amber-800 dark:text-amber-200 text-[10.5px] font-bold text-center leading-tight">
              <span>⚠️</span>
              <span className="line-clamp-2">{incident}</span>
            </div>
          )}

          {/* Out of stock reason chip */}
          {!isPlanAvailable && (
            <div className="mb-2 mx-auto max-w-[280px] p-1.5 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-lg flex items-center justify-center gap-1 text-red-700 dark:text-red-300 text-[11px] font-extrabold text-center leading-tight">
              <span>🚫 {outOfStockReason}</span>
            </div>
          )}

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
                <div className="flex items-center gap-1 max-w-[170px]">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded text-center line-clamp-1 ${
                    activePlan?.isAvailable === false ? 'text-red-500 line-through' : 'text-brand-primary dark:text-brand-light'
                  }`}>
                    {currentPlanName}
                  </span>
                  {activePlan?.isAvailable === false && (
                    <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.2 rounded font-bold">Agotado</span>
                  )}
                </div>
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
            <p className={`text-2xl font-bold transition-all duration-300 ${
              !isPlanAvailable ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-brand-primary dark:text-brand-light'
            }`}>
              {formatPrice(currentPrice)}/mes
            </p>
          </div>

          {/* Characteristics list container with fixed height */}
          <div key={activePlanIndex} className="h-[135px] overflow-y-auto space-y-1 text-gray-600 dark:text-gray-300 pr-1 scrollbar-thin">
            <ul className="space-y-1">
              {currentCharacteristics.map((feature, index) => (
                <li key={index} className="flex items-start text-xs">
                  <svg className={`w-3.5 h-3.5 mr-1.5 flex-shrink-0 mt-0.5 ${!isPlanAvailable ? 'text-gray-400' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 4 10.586l1.414-1.414L8.414 12l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className={`leading-tight ${!isPlanAvailable ? 'text-gray-400 dark:text-gray-500' : ''}`}>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section: PSE Fee + Dots + Button */}
        <div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 text-center">
            <p>Pago electrónico aprox: <strong>{formatPrice(totalWithPSE)}</strong></p>
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

          {isPlanAvailable ? (
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
          ) : (
            <button
              disabled
              title={outOfStockReason}
              className="w-full py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 cursor-not-allowed shadow-none border border-gray-300 dark:border-gray-600"
            >
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              🚫 Sin Stock de Momento
            </button>
          )}
        </div>
      </div>
    </div>
  );
}