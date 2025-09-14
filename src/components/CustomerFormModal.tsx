

import React, { useState } from 'react';
import { X } from 'lucide-react';

// Cálculo de tarifa PSE y desglose
function calculatePSEFee(price: number): number {
  const boldFeePercentage = 3.49;
  const reteICAPercentage = 0.414;
  const fixedBoldFee = 900;
  const boldFeeDecimal = boldFeePercentage / 100;
  const reteICADecimal = reteICAPercentage / 100;
  const totalPercentageDecimal = boldFeeDecimal + reteICADecimal;
  const grossPriceNeeded = (price + fixedBoldFee) / (1 - totalPercentageDecimal);
  return Math.round(grossPriceNeeded - price);
}

interface CustomerFormModalProps {
  platform: {
    id: number;
    name: string;
    price: number;
  };
  onClose: () => void;
}

export function CustomerFormModal({ platform, onClose }: CustomerFormModalProps) {
  const [customer, setCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    whatsapp: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cálculo de desglose
  const pseFee = calculatePSEFee(platform.price);
  const totalPrice = platform.price + pseFee;
  const formatPrice = (value: number) => value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 });

  // Envío del formulario y generación del botón Bold
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('https://sheerit.com.co/pago/generar_token.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalPrice.toString().replace('.', ''),
          description: `Compra de ${platform.name}`,
          customerData: customer,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Error del servidor. Inténtalo de nuevo.');
      }
      const paymentConfig = await response.json();
      const container = document.getElementById('bold-button-container');
      if (container) {
        container.innerHTML = '';
        const boldScript = document.createElement('script');
        boldScript.src = "https://checkout.bold.co/library/boldPaymentButton.js";
        boldScript.setAttribute('data-bold-button', 'true');
        boldScript.setAttribute('data-api-key', 'YCJ9yFnOlrWiS9Mq4KZLfize2ApawYb8rqrj0pge6p');
        boldScript.setAttribute('data-order-id', paymentConfig.orderId);
        boldScript.setAttribute('data-amount', paymentConfig.amount);
        boldScript.setAttribute('data-integrity-signature', paymentConfig.integritySignature);
        boldScript.setAttribute('data-redirection-url', paymentConfig.redirectionUrl);
        boldScript.setAttribute('data-description', paymentConfig.description);
        boldScript.setAttribute('data-currency', paymentConfig.currency);
        boldScript.setAttribute('data-customer-data', paymentConfig.customerDataString);
        container.appendChild(boldScript);
        setPaymentReady(true);
      }
    } catch (error: any) {
      console.error("Error al preparar el pago:", error);
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

        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Completar Pedido
        </h3>

        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Plataforma: <span className="font-bold">{platform.name}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Precio base: <span className="font-bold">{formatPrice(platform.price)}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Tarifa PSE: <span className="font-bold">{formatPrice(pseFee)}</span>
          </p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-2">
            Total a pagar: <span className="font-bold">{formatPrice(totalPrice)}</span>
          </p>
        </div>

        {!paymentReady ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                name="firstName"
                placeholder="Nombre"
                value={customer.firstName}
                onChange={handleInputChange}
                className="w-full p-2 border rounded bg-white text-gray-800 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <input
                type="text"
                name="lastName"
                placeholder="Apellido"
                value={customer.lastName}
                onChange={handleInputChange}
                className="w-full p-2 border rounded bg-white text-gray-800 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={customer.email}
                onChange={handleInputChange}
                className="w-full p-2 border rounded bg-white text-gray-800 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <input
                type="tel"
                name="whatsapp"
                placeholder="WhatsApp"
                value={customer.whatsapp}
                onChange={handleInputChange}
                className="w-full p-2 border rounded bg-white text-gray-800 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark"
              disabled={isLoading}
            >
              {isLoading ? 'Preparando pago...' : 'Continuar con PSE'}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="mb-4 dark:text-gray-300">Casi listo. Haz clic en el botón para completar tu pago de forma segura.</p>
            <div id="bold-button-container" className="flex justify-center">
              {/* El script insertará el botón de Bold aquí */}
            </div>
          </div>
        )}

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
}
