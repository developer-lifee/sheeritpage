import { useState } from 'react';
import { X } from 'lucide-react';
import { platforms } from '../data/platforms';

const DISCOUNT_PER_PLATFORM = 1000;

export function ComboMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);

  const calculateTotal = () => {
    const baseTotal = selectedPlatforms.reduce(
      (sum, id) => sum + (platforms.find(p => p.id === id)?.price || 0),
      0
    );
    const discount = selectedPlatforms.length > 1
      ? (selectedPlatforms.length - 1) * DISCOUNT_PER_PLATFORM
      : 0;
    return baseTotal - discount;
  };

  const handleCheckboxChange = (id: number) =>
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const formatPrice = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

  const handleWhatsAppClick = () => {
    if (!selectedPlatforms.length) return;
    const names = selectedPlatforms
      .map(id => platforms.find(p => p.id === id)?.name)
      .filter(Boolean)
      .join(', ');
    const total = calculateTotal();
    const msg = `Hola, estoy interesado en una suscripción de: ${names}\nCosto Total: ${formatPrice(total)}`;
    window.open(`https://wa.me/+573118587974/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <>
      {/* BOTÓN: full-width en móvil, auto en sm+ */}
      <button
        onClick={() => setIsOpen(true)}
        className="
          w-full sm:w-auto
          inline-flex items-center
          px-4 py-2 sm:px-6 sm:py-3
          bg-brand-primary text-white
          rounded-lg hover:bg-brand-dark
          transition-colors
          font-medium
        "
      >
        Crear Combo
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" />

          {/* MODAL: width full en móvil, max-w-md a partir de sm */}
          <div className="
            relative bg-white dark:bg-gray-800
            rounded-lg
            w-full sm:max-w-md
            mx-2 sm:mx-auto
            max-h-[95vh]
            flex flex-col
          ">
            {/* HEADER */}
            <div className="p-6 border-b sticky top-0 bg-white dark:bg-gray-800 z-10 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Crea tu Combo</h3>
              <button onClick={() => setIsOpen(false)} title="Cerrar" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5 text-gray-500 dark:text-gray-300"/>
              </button>
            </div>

            {/* CONTENIDO */}
            <div className="p-6 overflow-y-auto flex-1">
              <p className="mb-4 text-gray-600 dark:text-gray-300">
                Selecciona las plataformas para tu combo.
              </p>

              {/* GRID: 1 col por defecto, 2 cols en sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {platforms.map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleCheckboxChange(p.id)}
                    className={`
                      relative flex flex-col items-center
                      cursor-pointer transition-transform
                      ${selectedPlatforms.includes(p.id)
                        ? 'ring-2 ring-brand-primary scale-105'
                        : 'opacity-85 hover:opacity-100'}
                    `}
                  >
                    {/* ...imagen, nombre, precio, checkbox, icono seleccionado */}
                  </div>
                ))}
              </div>

              {selectedPlatforms.length > 1 && (
                <div className="p-3 mb-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ¡Ahorro! <strong>-{formatPrice((selectedPlatforms.length - 1) * DISCOUNT_PER_PLATFORM)}</strong> por {selectedPlatforms.length - 1} adicional{selectedPlatforms.length > 2 && 'es'}.
                  </p>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="p-6 border-t sticky bottom-0 bg-white dark:bg-gray-800 z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold text-gray-800 dark:text-white">Total:</span>
                <span className="text-xl font-bold text-brand-primary">{formatPrice(calculateTotal())}/mes</span>
              </div>
              <button
                onClick={handleWhatsAppClick}
                disabled={!selectedPlatforms.length}
                className="w-full py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Solicitar este combo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
