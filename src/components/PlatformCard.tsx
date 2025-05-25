import React from 'react';

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

  // Use platform-specific characteristics if available, otherwise use defaults
  const featuresToShow = characteristics.length > 0 ? characteristics : DEFAULT_CHARACTERISTICS;

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

        {/* Botón que ocupa todo el ancho y siempre se sitúa abajo */}
        <button
          onClick={handleWhatsAppClick}
          className="w-full py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark transition-colors"
        >
          Comprar Ahora
        </button>
      </div>
    </div>
  );
}
