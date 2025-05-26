import React, { useState, useEffect } from 'react';

// Move constants outside of component
const DEFAULT_CHARACTERISTICS = [
  "Mantenga la misma suscripción",
  "Renueva todos sus favoritos y listas",
  "Entrega en tiempo real"
];

// Add PSE fee calculation function
const calculatePSEFee = (price: number): number => {
  const percentage = price * 0.0349; // 3.49%
  const flatFee = 900; // $900 COP
  return Math.round(percentage + flatFee);
};

interface PlatformCardProps {
  id: number;
  name: string;
  price: number;
  image: string;
  characteristics?: string[];
}

// Add static variable to track currently open card
let currentOpenCard: number | null = null;

export function PlatformCard({ id, name, price, image, characteristics = [] }: PlatformCardProps) {
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  
  // Reset payment options when a different card is opened
  useEffect(() => {
    if (!showPaymentOptions) return;
    
    currentOpenCard = id;
    return () => {
      if (currentOpenCard === id) {
        currentOpenCard = null;
      }
    };
  }, [showPaymentOptions, id]);

  const handleShowPaymentOptions = () => {
    // Reset other cards when opening this one
    if (currentOpenCard && currentOpenCard !== id) {
      const event = new CustomEvent('resetPaymentOptions', { detail: currentOpenCard });
      window.dispatchEvent(event);
    }
    setShowPaymentOptions(true);
  };

  // Listen for reset events
  useEffect(() => {
    const handleReset = (event: CustomEvent<number>) => {
      if (event.detail === id) {
        setShowPaymentOptions(false);
      }
    };

    window.addEventListener('resetPaymentOptions', handleReset as EventListener);
    return () => {
      window.removeEventListener('resetPaymentOptions', handleReset as EventListener);
    };
  }, [id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleWhatsAppClick = () => {
    const message = `Hola, estoy interesado en una suscripción de: ${name}. Precio: ${formatPrice(price)}/mes`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?phone=573118587974&text=${encodedMessage}`, '_blank');
  };

  const handlePSEClick = () => {
    // Aquí irá la integración con PSE
    window.open('https://checkout.wompi.co/l/VPOS_TEST', '_blank');
  };

  // Use platform-specific characteristics if available, otherwise use defaults
  const featuresToShow = characteristics.length > 0 ? characteristics : DEFAULT_CHARACTERISTICS;
  const pseFee = calculatePSEFee(price);

  return (
    <div className="relative overflow-hidden rounded-xl shadow-lg w-full max-w-sm bg-white dark:bg-gray-800 flex flex-col">
      {/* Sección superior con la imagen de fondo */}
      <div 
        className="relative h-32 bg-cover bg-center bg-gray-200 dark:bg-gray-700" 
        style={{ backgroundImage: image ? `url(${image})` : 'none' }}
      >
        {/* Overlay oscuro para mejorar visibilidad */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Imagen centrada en la parte superior */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
        <img
          src={image}
          alt={name}
          className="w-16 h-16 object-cover rounded-full border-4 border-white dark:border-gray-800"
        />
      </div>

      {/* Contenido principal */}
      <div className="p-4 pt-10 flex flex-col flex-grow">
        {/* Precio */}
        <div className="text-center mb-4">
          <p className="text-xl font-bold text-brand-primary dark:text-brand-light">
            {formatPrice(price)}/mes
          </p>
        </div>

        <h3 className="text-xl font-bold mb-4 text-center dark:text-white">{name}</h3>

        {/* Lista de características con checks */}
        <ul className="mb-4 space-y-1 text-gray-600 dark:text-gray-300 flex-grow">
          {featuresToShow.map((feature, index) => (
            <li key={index} className="flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-green-500 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414L8.414 15 4 10.586l1.414-1.414L8.414 12l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* Payment section - toggles between button and payment options */}
        {!showPaymentOptions ? (
          <button
            onClick={handleShowPaymentOptions}
            className="w-full py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark transition-colors"
          >
            Comprar Ahora
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handlePSEClick}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              <img 
                src="https://chukuwata.org.co/wp-content/uploads/2019/01/Boton-Azul-PSE.png" 
                alt="PSE" 
                className="h-5 w-auto mr-2"
              />
              Pagar con PSE (+{formatPrice(pseFee)})
            </button>
            <button
              onClick={handleWhatsAppClick}
              className="w-full flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              <svg 
                viewBox="0 0 24 24" 
                className="h-5 w-5 mr-2 fill-current"
              >
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 1.856.001 3.598.723 4.907 2.034 1.31 1.311 2.031 3.054 2.03 4.908-.001 3.825-3.113 6.938-6.937 6.938z" />
              </svg>
              Pagar por WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
