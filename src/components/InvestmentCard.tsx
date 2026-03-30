import { useState } from 'react';

export function InvestmentCard() {
  const [totalAmount, setTotalAmount] = useState(25000);

  const MAX_AMOUNT = 2000000;
  const MIN_AMOUNT = 25000;
  const STEP = 25000;

  const commission = totalAmount * 0.06;
  const scratchupAmount = totalAmount * 0.94;

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleOpenWhatsApp = () => {
    const message = "hola estoy interesado en comprar mas de un 4% de la franquicia de cafe";
    const url = `https://api.whatsapp.com/send?phone=573107946794&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="relative overflow-hidden rounded-xl shadow-2xl w-full bg-slate-900 border border-slate-700 flex flex-col md:flex-row mb-12 transform hover:-translate-y-1 transition duration-300 mx-auto max-w-5xl mt-12">
      <div className="md:w-2/5 p-8 flex flex-col justify-center items-center overflow-hidden bg-black/40 border-r border-slate-700">
        <img 
          src="https://scratchup.com.co/images/design-mode/logo.png" 
          alt="Scratchup Logo" 
          className="w-40 h-auto z-10 filter drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] mb-6 mt-4" 
        />
        <h3 className="text-2xl font-bold text-white z-10 text-center uppercase tracking-wide">
          Oportunidad de Inversión
        </h3>
        <p className="text-amber-400 mt-2 z-10 text-center font-medium">Sé dueño de tu propia franquicia</p>
      </div>
      
      <div className="md:w-3/5 p-8 flex flex-col bg-slate-800">
        <div className="mb-6">
          <h4 className="text-lg text-slate-300 font-semibold mb-2">Simulador de Inversión</h4>
          <p className="text-sm text-slate-400 mb-6">Ajusta la barra para calcular la repartición de los ingresos generados, con total transparencia.</p>
          
          <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <span className="text-slate-300 text-sm font-medium">Monto Total de Pago:</span>
              <span className="text-2xl font-bold text-amber-500">{formatPrice(totalAmount)}</span>
            </div>
            
            <input
              type="range"
              min={MIN_AMOUNT}
              max={MAX_AMOUNT}
              step={STEP}
              value={totalAmount}
              onChange={(e) => setTotalAmount(Number(e.target.value))}
              className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
              <span>{formatPrice(MIN_AMOUNT)}</span>
              <span>{formatPrice(MAX_AMOUNT)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
            <p className="text-xs text-slate-400 mb-1 font-semibold uppercase">Pasa a Scratchup (94%)</p>
            <p className="text-lg font-bold text-white">{formatPrice(scratchupAmount)}</p>
          </div>
          <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
            <p className="text-xs text-slate-400 mb-1 font-semibold uppercase">Comisión Sheerit (6%)</p>
            <p className="text-lg font-bold text-emerald-400">{formatPrice(commission)}</p>
          </div>
        </div>

        <div className="mt-auto">
          <button
            onClick={handleOpenWhatsApp}
            className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all duration-300 flex items-center justify-center gap-3 text-lg"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 1.856.001 3.598.723 4.907 2.034 1.31 1.311 2.031 3.054 2.03 4.908-.001 3.825-3.113 6.938-6.937 6.938z" />
            </svg>
            Contactar Directamente con Scratchup
          </button>
        </div>
      </div>
    </div>
  );
}
