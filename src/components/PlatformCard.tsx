import React, { useState } from 'react';

interface PlatformCardProps {
  name: string;
  price: number;
  image: string;
  characteristics?: string[];  // Make it optional to handle platforms without specific characteristics
}

// Default characteristics to show if a platform doesn't have specific ones
const DEFAULT_CHARACTERISTICS = [
  "Mantenga la misma suscripción",
  "Renueva todos sus favoritos y listas",
  "Entrega en tiempo real"
];

export function PlatformCard({ name, price, image, characteristics = [] }: PlatformCardProps) {
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  
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

  return (
    <>
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

          {/* Lista de características con checks - ahora flexible */}
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

          {/* Updated button to show payment options */}
          <button
            onClick={() => setShowPaymentOptions(true)}
            className="w-full py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark transition-colors"
          >
            Comprar Ahora
          </button>
        </div>
      </div>

      {/* Payment Options Modal */}
      {showPaymentOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowPaymentOptions(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Elige tu método de pago
            </h3>
            <div className="space-y-3">
              <button
                onClick={handlePSEClick}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <img 
                  src="/plataform/pse-logo.png" 
                  alt="PSE" 
                  className="h-6 w-auto mr-2"
                />
                Pagar con PSE
              </button>
              <button
                onClick={handleWhatsAppClick}
                className="w-full flex items-center justify-center px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  className="h-6 w-6 mr-2 fill-current"
                >
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 1.856.001 3.598.723 4.907 2.034 1.31 1.311 2.031 3.054 2.03 4.908-.001 3.825-3.113 6.938-6.937 6.938z"/>
                </svg>
                Pagar por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
