import React, { createContext, useContext, useState, useEffect } from 'react';

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
}

interface ComboCartContextType {
  selectedPlans: Record<number, number>; // planId -> qty
  isComboOpen: boolean;
  setIsComboOpen: (open: boolean) => void;
  addToCombo: (planId: number) => void;
  removeFromCombo: (planId: number) => void;
  updatePlanQuantity: (planId: number, quantity: number) => void;
  getTotalItems: () => number;
  clearCombo: () => void;
  platforms: Platform[];
  loading: boolean;
}

const ComboCartContext = createContext<ComboCartContextType | undefined>(undefined);

export function ComboCartProvider({ children }: { children: React.ReactNode }) {
  const [selectedPlans, setSelectedPlans] = useState<Record<number, number>>({});
  const [isComboOpen, setIsComboOpen] = useState(false);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/platforms.json')
      .then(response => response.json())
      .then(data => {
        setPlatforms(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error cargando precios en context:', error);
        setLoading(false);
      });
  }, []);

  const addToCombo = (planId: number) => {
    setSelectedPlans(prev => ({
      ...prev,
      [planId]: (prev[planId] || 0) + 1
    }));
  };

  const removeFromCombo = (planId: number) => {
    setSelectedPlans(prev => {
      const next = { ...prev };
      if (next[planId] <= 1) {
        delete next[planId];
      } else {
        next[planId] -= 1;
      }
      return next;
    });
  };

  const updatePlanQuantity = (planId: number, quantity: number) => {
    setSelectedPlans(prev => {
      const next = { ...prev };
      if (quantity <= 0) {
        delete next[planId];
      } else {
        next[planId] = quantity;
      }
      return next;
    });
  };

  const getTotalItems = () => {
    return Object.values(selectedPlans).reduce((acc, qty) => acc + qty, 0);
  };

  const clearCombo = () => {
    setSelectedPlans({});
  };

  return (
    <ComboCartContext.Provider
      value={{
        selectedPlans,
        isComboOpen,
        setIsComboOpen,
        addToCombo,
        removeFromCombo,
        updatePlanQuantity,
        getTotalItems,
        clearCombo,
        platforms,
        loading
      }}
    >
      {children}
    </ComboCartContext.Provider>
  );
}

export function useComboCart() {
  const context = useContext(ComboCartContext);
  if (!context) {
    throw new Error('useComboCart must be used within a ComboCartProvider');
  }
  return context;
}
