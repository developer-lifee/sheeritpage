import React from 'react';
import { useCurrency } from '../hooks/useCurrency';
import { Globe } from 'lucide-react';

export function CurrencyToggle() {
  const { currency, toggleCurrency } = useCurrency();

  return (
    <button
      onClick={toggleCurrency}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 bg-white/10 hover:bg-white/20 text-white border border-white/15 active:scale-95 shadow-sm"
      title={`Cambiar a ${currency === 'COP' ? 'Dólares (USD)' : 'Pesos Colombianos (COP)'}`}
    >
      <Globe className="w-3.5 h-3.5 text-brand-secondary animate-pulse" />
      <span className="tracking-wide">
        {currency === 'COP' ? '🇨🇴 COP' : '🌎 USD ($)'}
      </span>
    </button>
  );
}
