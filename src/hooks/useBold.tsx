// src/hooks/useBold.ts

import { useState, useCallback } from 'react';

// Define la estructura de la configuración de pago que esperas de tu backend.
interface PaymentConfig {
  orderId: string;
  amount: string;
  integritySignature: string;
  redirectionUrl: string;
  description: string;
  currency: string;
}

// Extiende la interfaz global de Window para incluir el constructor de BoldCheckout.
declare global {
  interface Window {
    BoldCheckout: new (config: any) => {
      open: () => void;
    };
  }
}

/**
 * Hook para manejar la integración personalizada del checkout de Bold.
 */
export function useBold() {
  const [isScriptLoading, setIsScriptLoading] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);

  /**
   * Carga el script de Bold si no está presente y abre la pasarela de pago.
   */
  const loadAndOpenCheckout = useCallback((paymentConfig: PaymentConfig, apiKey: string) => {
    const scriptSrc = 'https://checkout.bold.co/library/boldPaymentButton.js';

    const executeCheckout = () => {
      if (window.BoldCheckout) {
        try {
          const checkout = new window.BoldCheckout({
            orderId: paymentConfig.orderId,
            currency: paymentConfig.currency,
            amount: paymentConfig.amount,
            apiKey: apiKey,
            integritySignature: paymentConfig.integritySignature,
            description: paymentConfig.description,
            redirectionUrl: paymentConfig.redirectionUrl,
          });
          checkout.open();
        } catch (error) {
          console.error("Error al crear la instancia de BoldCheckout:", error);
          setScriptError("Ocurrió un error al configurar el pago.");
        }
      } else {
        console.error('El constructor BoldCheckout no está disponible.');
        setScriptError("No se pudo cargar el componente de pago.");
      }
    };

    // Si el script ya existe, simplemente ejecuta el checkout
    if (document.querySelector(`script[src="${scriptSrc}"]`)) {
      if (window.BoldCheckout) {
        executeCheckout();
      } else {
        // Si el script está pero el objeto no, espera al evento personalizado
        window.addEventListener('boldCheckoutLoaded', executeCheckout, { once: true });
      }
      return;
    }

    // Si el script no existe, lo crea y lo carga
    setIsScriptLoading(true);
    setScriptError(null);
    const script = document.createElement('script');
    script.src = scriptSrc;

    script.onload = () => {
      setIsScriptLoading(false);
      window.dispatchEvent(new Event('boldCheckoutLoaded'));
      executeCheckout();
    };

    script.onerror = () => {
      setIsScriptLoading(false);
      setScriptError('No se pudo cargar el script de pago. Revisa tu conexión a internet.');
      window.dispatchEvent(new Event('boldCheckoutLoadFailed'));
    };
    
    document.head.appendChild(script);

  }, []);

  return { loadAndOpenCheckout, isScriptLoading, scriptError };
}