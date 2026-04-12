// src/components/CustomerFormModal.tsx (CORREGIDO)

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { calculatePSEFee } from '../utils/fees';
import { useBold } from '../hooks/useBold'; // RUTA CORREGIDA

// Interfaz para las props que el modal necesita
interface CustomerFormModalProps {
  platformName: string;
  platformPrice: number;
  onClose: () => void;
}

// Tipo para la configuración del pago
type PaymentConfig = {
  orderId: string;
  amount: string;
  integritySignature: string;
  redirectionUrl: string;
  description: string;
  currency: string;
};

export function CustomerFormModal({ platformName, platformPrice, onClose }: CustomerFormModalProps) {
  // Manejo de estado interno
  const [customer, setCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    whatsapp: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { loadAndOpenCheckout, isScriptLoading, scriptError } = useBold();

  // Lógica de precios
  const pseFee = calculatePSEFee(platformPrice);
  const totalPrice = platformPrice + pseFee;
  const formatPrice = (value: number) => value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // Lógica de envío actualizada
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
      const response = await fetch(`${apiUrl}/api/bold/generate-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: {
            name: platformName,
            price: totalPrice.toString().replace('.', ''),
          },
          customer: customer,
          numbers: [`Suscripción a ${platformName}`],
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error del servidor. Inténtalo de nuevo.');
      }
      
      const config: PaymentConfig = await response.json();
      
      // Llamamos a la función del hook para cargar y abrir el checkout
      loadAndOpenCheckout(config, "1y0D48xaDriWO_CNz7oXUopfkKx5VjiExsdDW0gj2eA");

    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomer(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg w-full max-w-md mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Completar Pedido</h3>

        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <p className="text-sm text-gray-600 dark:text-gray-300">Producto: <span className="font-bold">{platformName}</span></p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Precio base: <span className="font-bold">{formatPrice(platformPrice)}</span></p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Tarifa PSE: <span className="font-bold">{formatPrice(pseFee)}</span></p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-2">Total a pagar: <span className="font-bold">{formatPrice(totalPrice)}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="firstName" placeholder="Nombre" value={customer.firstName} onChange={handleInputChange} className="w-full p-2 border rounded bg-white text-gray-800 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
            <input type="text" name="lastName" placeholder="Apellido" value={customer.lastName} onChange={handleInputChange} className="w-full p-2 border rounded bg-white text-gray-800 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
            <input type="email" name="email" placeholder="Email" value={customer.email} onChange={handleInputChange} className="w-full p-2 border rounded bg-white text-gray-800 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
            <input type="tel" name="whatsapp" placeholder="WhatsApp" value={customer.whatsapp} onChange={handleInputChange} className="w-full p-2 border rounded bg-white text-gray-800 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
            <button 
                type="submit" 
                className="w-full py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark disabled:opacity-50" 
                disabled={isLoading || isScriptLoading}>
                {isLoading ? 'Preparando pago...' : isScriptLoading ? 'Cargando...' : 'Continuar con PSE'}
            </button>
        </form>

        {(error || scriptError) && <p className="text-red-500 mt-4 text-center">{error || scriptError}</p>}
      </div>
    </div>
  );
}