import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyType = 'COP' | 'USD';

interface CurrencyContextType {
  currency: CurrencyType;
  setCurrency: (c: CurrencyType) => void;
  toggleCurrency: () => void;
  formatPrice: (priceCOP: number) => string;
  calculateUSD: (priceCOP: number) => number;
  trm: number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const TRM = 4000; // Tasa representativa del mercado promedio

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyType>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sheerit_currency');
      if (stored === 'USD' || stored === 'COP') return stored;

      // Auto-detección por zona horaria
      try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        if (!timeZone.includes('Bogota') && !timeZone.includes('Colombia')) {
          // Si entra desde fuera de Colombia, por defecto USD
          return 'USD';
        }
      } catch (e) {}
    }
    return 'COP';
  });

  const setCurrency = (c: CurrencyType) => {
    setCurrencyState(c);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sheerit_currency', c);
    }
  };

  const toggleCurrency = () => {
    setCurrency(currency === 'COP' ? 'USD' : 'COP');
  };

  const calculateUSD = (priceCOP: number): number => {
    if (!priceCOP || isNaN(priceCOP)) return 0;
    // Fórmula de protección de comisión de pasarela Bold (3.49% + $900 + 19% IVA)
    const grossCOP = Math.ceil(((priceCOP + 1100) / 0.945) / 100) * 100;
    return Number((grossCOP / TRM).toFixed(2));
  };

  const formatPrice = (priceCOP: number): string => {
    if (!priceCOP || isNaN(priceCOP)) return currency === 'USD' ? '$0.00 USD' : '$0 COP';

    if (currency === 'USD') {
      const usdValue = calculateUSD(priceCOP);
      return `$${usdValue.toFixed(2)} USD`;
    }

    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(priceCOP);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        toggleCurrency,
        formatPrice,
        calculateUSD,
        trm: TRM
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
