import React, { useState, useEffect } from 'react';

// Move constants outside of component
const DEFAULT_CHARACTERISTICS = [
  "Mantenga la misma suscripción",
  "Renueva todos sus favoritos y listas",
  "Entrega en tiempo real"
];

/**
 * Calculates the total fee for a given price, including Bold's percentage + fixed fee
 * and ReteICA percentage.
 *
 * This function assumes the 'price' parameter is the *net* amount you desire to receive,
 * and it calculates the *additional* amount needed to cover the fees.
 *
 * @param {number} price The base price of the service (the net amount you want to get).
 * @returns {number} The total calculated fee (Bold + ReteICA + fixed).
 */
const calculatePSEFee = (price: number): number => {
    // Define fee percentages and fixed fees
    const boldFeePercentage = 3.49; // 3.49%
    const reteICAPercentage = 0.414; // 0.414%
    const fixedBoldFee = 900; // $900 COP

    // Convert percentages to decimal
    const boldFeeDecimal = boldFeePercentage / 100;
    const reteICADecimal = reteICAPercentage / 100;

    // Calculate total percentage that will be deducted from the *gross* price
    const totalPercentageDecimal = boldFeeDecimal + reteICADecimal; // 0.0349 + 0.00414 = 0.03904

    // This is the core logic: if 'price' is the *net* you want,
    // we need to find a 'gross' price (X) such that:
    // net = X - (X * totalPercentageDecimal) - fixedBoldFee
    // net + fixedBoldFee = X * (1 - totalPercentageDecimal)
    // X = (net + fixedBoldFee) / (1 - totalPercentageDecimal)

    // Calculate the gross price needed to achieve 'price' net
    const grossPriceNeeded = (price + fixedBoldFee) / (1 - totalPercentageDecimal);

    // The PSE fee to display is the difference between this gross price and the original net price,
    // which represents the total cost of the fees.
    const totalFee = grossPriceNeeded - price;

    return Math.round(totalFee);
};


interface PlatformCardProps {
  id: number;
  name: string;
  price: number;
  image: string;
  characteristics?: string[];
}

interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
}

// Add static variable to track currently open card
let currentOpenCard: number | null = null;

export function PlatformCard({ id, name, price, image, characteristics = [] }: PlatformCardProps) {
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData>({
    firstName: '',
    lastName: '',
    email: '',
    whatsapp: '',
  });

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

  const formatPrice = (value: number) => { // Renamed parameter to avoid conflict with prop 'price'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleWhatsAppClick = () => {
    const message = `Hola, estoy interesado en una suscripción de: ${name}. Precio: ${formatPrice(price)}/mes`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?phone=573107946794&text=${encodedMessage}`, '_blank');
  };

  const handlePSEClick = async () => {
    setShowCustomerForm(true);
  };

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('https://sheerit.com.co/pago/generar_token.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: customerData,
          platform: {
            name,
            price,
          },
          numbers: [1]
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // Redirect to Bold's checkout page
      const boldCheckoutUrl = `https://checkout.bold.co/v2/checkout?apiKey=${data.apiKey}&orderId=${data.orderId}&amount=${data.amount}&currency=${data.currency}&description=${encodeURIComponent(data.description)}&tax=${data.tax}&integritySignature=${data.integritySignature}&redirectionUrl=${encodeURIComponent(data.redirectionUrl)}`;
      
      window.location.href = boldCheckoutUrl;
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error al procesar el pago. Por favor intente de nuevo.');
    }
  };

  // Use platform-specific characteristics if available, otherwise use defaults
  const featuresToShow = characteristics.length > 0 ? characteristics : DEFAULT_CHARACTERISTICS;

  // Calculate the PSE fee based on the product's price (which is the desired net)
  const pseFee = calculatePSEFee(price);
  // The price to display for PSE will be the original price + the calculated fee
  const pseDisplayPrice = price + pseFee;

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
        ) : showCustomerForm ? (
          <form onSubmit={handleCustomerSubmit} className="space-y-3 p-4">
            <input
              type="text"
              placeholder="Nombre"
              value={customerData.firstName}
              onChange={(e) => setCustomerData({...customerData, firstName: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="text"
              placeholder="Apellido"
              value={customerData.lastName}
              onChange={(e) => setCustomerData({...customerData, lastName: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={customerData.email}
              onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="tel"
              placeholder="WhatsApp"
              value={customerData.whatsapp}
              onChange={(e) => setCustomerData({...customerData, whatsapp: e.target.value})}
              className="w-full p-2 border rounded"
              required
            />
            <button
              type="submit"
              className="w-full py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-600"
            >
              Continuar con PSE
            </button>
            <button
              type="button"
              onClick={() => setShowCustomerForm(false)}
              className="w-full py-2 bg-gray-300 text-gray-700 font-bold rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
          </form>
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
              Pagar con PSE (+{formatPrice(pseDisplayPrice)})
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