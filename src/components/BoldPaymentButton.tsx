// Archivo: BoldPaymentButton.tsx

import React, { useEffect, useRef } from 'react';

// Define la estructura de las props que el componente espera recibir.
interface BoldPaymentButtonProps {
  paymentConfig: {
    orderId: string;
    amount: string;
    integritySignature: string;
    redirectionUrl: string;
    description: string;
    currency: string;
  };
  apiKey: string;
}

export function BoldPaymentButton({ paymentConfig, apiKey }: BoldPaymentButtonProps) {
  // `useRef` crea una referencia directa al elemento div del DOM.
  const containerRef = useRef<HTMLDivElement>(null);

  // `useEffect` se ejecuta DESPUÉS de que el componente se renderiza en la pantalla.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return; // Si el contenedor no existe, no hacemos nada.

    // 1. Limpiamos el contenedor para evitar duplicados.
    container.innerHTML = '';

    // 2. Creamos el elemento <script> dinámicamente.
    const boldScript = document.createElement('script');
    boldScript.src = "https://checkout.bold.co/library/boldPaymentButton.js";

    // 3. Añadimos todos los atributos necesarios que el script de Bold espera.
    boldScript.setAttribute('data-bold-button', 'true');
    boldScript.setAttribute('data-api-key', apiKey);
    boldScript.setAttribute('data-order-id', paymentConfig.orderId);
    boldScript.setAttribute('data-amount', paymentConfig.amount);
    boldScript.setAttribute('data-integrity-signature', paymentConfig.integritySignature);
    boldScript.setAttribute('data-redirection-url', paymentConfig.redirectionUrl);
    boldScript.setAttribute('data-description', paymentConfig.description);
    boldScript.setAttribute('data-currency', paymentConfig.currency);
    boldScript.setAttribute('data-render-mode', 'embedded'); // Clave para que se muestre en tu modal.

    // 4. Inyectamos el script en nuestro div contenedor.
    container.appendChild(boldScript);

    // 5. (Opcional pero recomendado) Función de limpieza.
    // Se ejecuta si el componente se desmonta (ej: el usuario cierra el modal).
    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [paymentConfig, apiKey]); // El efecto se vuelve a ejecutar si estas props cambian.

  // El componente solo renderiza un div vacío que servirá como ancla para el script.
  return <div ref={containerRef} className="flex justify-center"></div>;
}