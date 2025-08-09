import React from 'react';
import { X } from 'lucide-react';

interface CustomerFormModalProps {
  onSubmit: (e: React.FormEvent) => void;
  customerData: {
    firstName: string;
    lastName: string;
    email: string;
    whatsapp: string;
  };
  onChange: (data: any) => void;
  onClose: () => void;
  platform: string;
  price: number;
}

function calculatePSEFee(price: number): number {
  // Define fee percentages and fixed fees
  const boldFeePercentage = 3.49; // 3.49%
  const reteICAPercentage = 0.414; // 0.414%
  const fixedBoldFee = 900; // $900 COP

  // Convert percentages to decimal
  const boldFeeDecimal = boldFeePercentage / 100;
  const reteICADecimal = reteICAPercentage / 100;

  // Calculate total percentage that will be deducted
  const totalPercentageDecimal = boldFeeDecimal + reteICADecimal;

  // Calculate the gross price needed
  const grossPriceNeeded = (price + fixedBoldFee) / (1 - totalPercentageDecimal);

  // Return the total fee
  return Math.round(grossPriceNeeded - price);
}

export function CustomerFormModal({
  onSubmit,
  customerData,
  onChange,
  onClose,
  platform,
  price
}: CustomerFormModalProps) {
  const pseFee = calculatePSEFee(price);
  const totalPrice = price + pseFee;

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
            Plataforma: <span className="font-bold">{platform}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Precio base: <span className="font-bold">{price.toLocaleString('es-CO', {
              style: 'currency',
              currency: 'COP'
            })}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Tarifa PSE: <span className="font-bold">{pseFee.toLocaleString('es-CO', {
              style: 'currency',
              currency: 'COP'
            })}</span>
          </p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-2">
            Total a pagar: <span className="font-bold">{totalPrice.toLocaleString('es-CO', {
              style: 'currency',
              currency: 'COP'
            })}</span>
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Nombre"
              value={customerData.firstName}
              onChange={(e) => onChange({ ...customerData, firstName: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Apellido"
              value={customerData.lastName}
              onChange={(e) => onChange({ ...customerData, lastName: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Email"
              value={customerData.email}
              onChange={(e) => onChange({ ...customerData, email: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>
          <div>
            <input
              type="tel"
              placeholder="WhatsApp"
              value={customerData.whatsapp}
              onChange={(e) => onChange({ ...customerData, whatsapp: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark"
          >
            Continuar con PSE
          </button>
        </form>
      </div>
    </div>
  );
}
