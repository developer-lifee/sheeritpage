// sheeritpage/src/components/PlatformCard.tsx (CORREGIDO)
import { useState } from 'react';
import { CustomerFormModal } from './CustomerFormModal';
import { XboxScheduleModal } from './XboxScheduleModal';
import { calculatePSEFee } from '../utils/fees';
import { useComboCart } from '../hooks/useComboCart';

interface Plan { id: number; name: string; price: number; characteristics: string[]; }
interface PlatformCardProps {
  id: number;
  name: string;
  image: string;
  // Formato antiguo
  price?: number;
  characteristics?: string[];
  // Formato nuevo
  plans?: Plan[];
}

export function PlatformCard({ id, name, image, price, characteristics, plans }: PlatformCardProps) {
  const [showOptions, setShowOptions] = useState(false); // ver lista de planes
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null); // plan elegido
  const [showCustomerForm, setShowCustomerForm] = useState(false); // modal PSE
  const [showPaymentChoice, setShowPaymentChoice] = useState(false); // elegir método pago
  const [showXboxModal, setShowXboxModal] = useState(false); // Modal de horarios Xbox
  const [xboxSchedule, setXboxSchedule] = useState(''); // Text format con selección
  const { addToCombo, getTotalItems, setIsComboOpen } = useComboCart();

  const formatPrice = (value: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(value);

  const handlePlanChosen = (plan: Plan) => {
    setSelectedPlan(plan);
    if (id === 12) {
      setShowXboxModal(true);
    } else {
      setShowPaymentChoice(true);
    }
  };

  const handleXboxConfirm = (schedule: string) => {
    setXboxSchedule(schedule);
    setShowXboxModal(false);
    setShowPaymentChoice(true);
  };

  const handleDirectBuy = () => {
    // Crear un pseudo plan cuando sólo existe formato antiguo
    const pseudo: Plan = { id: id * 1000, name: 'Suscripción', price: basePrice, characteristics: defaultCharacteristics };
    handlePlanChosen(pseudo);
  };

  const openPSE = () => {
    setShowPaymentChoice(false);
    setShowCustomerForm(true);
  };

  const openWhatsApp = () => {
    if (!selectedPlan) return;
    let message = `Hola, estoy interesado en ${name} - ${selectedPlan.name} por ${formatPrice(selectedPlan.price)}/mes`;
    if (id === 12 && xboxSchedule) {
      message += `\nMis horarios elegidos son: ${xboxSchedule}`;
    }
    const url = `https://api.whatsapp.com/send?phone=573118587974&text=${encodeURIComponent(message)}`;
    try { window.open(url, '_blank'); } catch (e) { console.error('No se pudo abrir WhatsApp', e); }
    setShowPaymentChoice(false);
  };

  const safePlans: Plan[] = Array.isArray(plans) ? plans : [];
  const hasPlans = safePlans.length > 0;
  const basePrice = hasPlans ? Math.min(...safePlans.map(p => p.price)) : (price || 0);
  const defaultCharacteristics = hasPlans ? (safePlans[0]?.characteristics || []) : (characteristics || []);
  const pseFee = basePrice ? calculatePSEFee(basePrice) : 0;
  const totalWithPSE = basePrice + pseFee;

  return (
    <>
      {showCustomerForm && selectedPlan && (
        <CustomerFormModal
          onClose={() => setShowCustomerForm(false)}
          platformName={`${name} - ${selectedPlan.name}${id === 12 && xboxSchedule ? ' (Horarios específicos)' : ''}`}
          platformPrice={selectedPlan.price}
        />
      )}
      
      {showXboxModal && selectedPlan && (
        <XboxScheduleModal 
          onClose={() => setShowXboxModal(false)}
          onConfirm={handleXboxConfirm}
        />
      )}
      
      {/* Selector de método de pago */}
      {showPaymentChoice && selectedPlan && !showCustomerForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPaymentChoice(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg w-full max-w-sm p-6 shadow-xl">
            <h4 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Elegir método de pago</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{name} - {selectedPlan.name} ({formatPrice(selectedPlan.price)})</p>
            <div className="space-y-3">
              <button onClick={openPSE} className="w-full flex items-center justify-center gap-2 py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg transition-colors text-sm">
                <img src="https://chukuwata.org.co/wp-content/uploads/2019/01/Boton-Azul-PSE.png" alt="PSE" className="h-5 w-auto" />
                Pagar con PSE (+{formatPrice(pseFee)})
              </button>
              <button onClick={openWhatsApp} className="w-full flex items-center justify-center gap-2 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors text-sm">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 1.856.001 3.598.723 4.907 2.034 1.31 1.311 2.031 3.054 2.03 4.908-.001 3.825-3.113 6.938-6.937 6.938z" /></svg>
                Pagar por WhatsApp
              </button>
              <button onClick={() => setShowPaymentChoice(false)} className="w-full py-2 text-sm text-gray-500 hover:underline">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-xl shadow-lg w-full max-w-sm bg-white dark:bg-gray-800 flex flex-col">
        <div className="relative h-32 bg-cover bg-center bg-gray-200 dark:bg-gray-700" style={{ backgroundImage: image ? `url(${image})` : 'none' }}>
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
          <img src={image} alt={name} className="w-16 h-16 object-cover rounded-full border-4 border-white dark:border-gray-800" />
        </div>
        <div className="p-4 pt-10 flex flex-col flex-grow">
          <div className="text-center mb-4">
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {hasPlans && safePlans.length > 1 ? 'Desde' : ''}
            </span>
            <p className="text-xl font-bold text-brand-primary dark:text-brand-light">
              {formatPrice(basePrice)}/mes
            </p>
          </div>
          <h3 className="text-xl font-bold mb-4 text-center dark:text-white">{name}</h3>

          {!showOptions ? (
            <>
              <ul className="mb-4 space-y-1 text-gray-600 dark:text-gray-300 flex-grow">
                {defaultCharacteristics.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 4 10.586l1.414-1.414L8.414 12l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                <p>Pagando por PSE aprox: <strong>{formatPrice(totalWithPSE)}</strong></p>
                <p className="opacity-70">Incluye comisión estimada</p>
              </div>
              {hasPlans && safePlans.length > 1 ? (
                <button
                  onClick={() => setShowOptions(true)}
                  className="w-full mt-auto py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark transition-colors"
                >
                  Ver Planes
                </button>
              ) : (
                <div className="flex gap-2 mt-auto">
                  {getTotalItems() > 0 ? (
                    <button
                      onClick={() => {
                        const targetPlanId = hasPlans ? safePlans[0].id : (id * 1000);
                        addToCombo(targetPlanId);
                        setIsComboOpen(true);
                      }}
                      className="flex-grow py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Agregar y Pagar
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => hasPlans ? handlePlanChosen(safePlans[0]) : handleDirectBuy()}
                        className="flex-grow py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-dark transition-colors text-sm"
                      >
                        Comprar Ahora
                      </button>
                      <button
                        onClick={() => {
                          const targetPlanId = hasPlans ? safePlans[0].id : (id * 1000);
                          addToCombo(targetPlanId);
                        }}
                        className="py-2 px-3 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1 text-sm"
                        title="Agregar a mi combo"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Combo
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              {safePlans.map(plan => (
                <div key={plan.id} className="p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                  <p className="font-bold text-gray-900 dark:text-white">{plan.name} - {formatPrice(plan.price)}</p>
                  <ul className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                    {plan.characteristics.map(c => <li key={c}>- {c}</li>)}
                  </ul>
                  <div className="flex gap-2 mt-2">
                    {getTotalItems() > 0 ? (
                      <button
                        onClick={() => {
                          addToCombo(plan.id);
                          setIsComboOpen(true);
                        }}
                        className="w-full py-1.5 px-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-all duration-200 flex items-center justify-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Agregar y Pagar
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handlePlanChosen(plan)}
                          className="flex-grow py-1 px-2 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-dark transition-all duration-200"
                        >
                          Pagar Directo
                        </button>
                        <button
                          onClick={() => addToCombo(plan.id)}
                          className="py-1 px-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-all duration-200 flex items-center justify-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Combo
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={() => setShowOptions(false)}
                className="w-full text-center text-sm text-gray-500 dark:text-gray-300 hover:underline mt-2"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}