import React from 'react';
import { useCurrency } from '../hooks/useCurrency';
import { Globe } from 'lucide-react';

export function CurrencyToggle() {
  const { currency, toggleCurrency } = useCurrency();

  return (
    <button
      onClick={toggleCurrency}
      className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-200 bg-white/10 hover:bg-white/20 text-white border border-white/15 active:scale-95 shadow-sm shrink-0 whitespace-nowrap"
      title={`Cambiar a ${currency === 'COP' ? 'Dólares (USD)' : 'Pesos Colombianos (COP)'}`}
    >
      <Globe className="w-3 h-3 text-brand-secondary shrink-0 hidden sm:inline" />
      <span className="tracking-tight sm:tracking-wide">
        {currency === 'COP' ? '🇨🇴 COP' : '🌎 USD'}
      </span>
    </button>
  );
}
