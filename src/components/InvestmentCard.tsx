import { useState } from 'react';

// Generar los pasos posibles para el slider
const generateSteps = () => {
  const steps = [25000];
  for (let i = 100000; i <= 10000000; i += 100000) {
    steps.push(i);
  }
  return steps;
};

const STEPS = generateSteps();

export function InvestmentCard() {
  const [sliderIndex, setSliderIndex] = useState(0);

  const totalAmount = STEPS[sliderIndex];
  
  // Lógica de Comisión
  const feePercentage = totalAmount > 1000000 ? 0.02 : 0.06;
  const commission = totalAmount * feePercentage;
  const scratchupAmount = totalAmount - commission;

  // Lógica de Equity
  const equityPercentage = (totalAmount / 70000000) * 100;

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getBenefits = () => {
    const benefits = [
      "Participación en beneficios del crecimiento de la empresa."
    ];

    if (totalAmount >= 100000) {
      benefits.push("☕ Un tinto GRATIS presencial en Scratchup.");
    }
    
    if (totalAmount >= 500000 && totalAmount < 1000000) {
      benefits.push("📦 Media libra de café a domicilio (Bogotá).");
    } else if (totalAmount === 1000000) {
      benefits.push("📦 Una libra entera de café a domicilio (Bogotá).");
    } else if (totalAmount > 1000000) {
    }

    return benefits;
  };

  const handleOpenWhatsApp = () => {
    let message = `Hola, estoy interesado en comprar participación de la franquicia de cafe por un monto de ${formatPrice(totalAmount)}.`;
    if (totalAmount >= 1000000) {
      message += ` Vi que esto corresponde al ${equityPercentage.toFixed(2)}% de equity.`;
    }
    const url = `https://api.whatsapp.com/send?phone=573107946794&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleOpenWhatsAppSheerit = () => {
    let message = `Hola Sheerit, quiero invertir en la franquicia de cafe por ${formatPrice(totalAmount)}.`;
    if (totalAmount >= 1000000) {
      message += ` Corresponde al ${equityPercentage.toFixed(2)}% de equity.`;
    }
    // Number of Sheerit (from PlatformCard)
    const url = `https://api.whatsapp.com/send?phone=573107946794&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const isBroken = totalAmount >= 10000000;

  return (
    <div className={`relative overflow-hidden rounded-xl shadow-2xl w-full bg-slate-900 border ${isBroken ? 'border-red-500 animate-pulse' : 'border-slate-700'} flex flex-col md:flex-row mb-12 transform hover:-translate-y-1 transition duration-300 mx-auto max-w-5xl mt-12`}>
      <div className="md:w-2/5 p-8 flex flex-col justify-center items-center overflow-hidden bg-black/40 border-r border-slate-700 relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-amber-600/10 to-transparent pointer-events-none"></div>
        <img 
          src="https://scratchup.com.co/images/design-mode/logo.png" 
          alt="Scratchup Logo" 
          className="w-40 h-auto z-10 filter drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] mb-6 mt-4" 
        />
        <h3 className="text-2xl font-bold text-white z-10 text-center uppercase tracking-wide">
          Membresía de Inversión
        </h3>
        <p className="text-amber-400 mt-2 z-10 text-center font-medium">Sé dueño de tu propia franquicia</p>
        
        {totalAmount >= 1000000 && (
          <div className="mt-8 bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 text-center animate-pulse-slow">
            <p className="text-xs text-amber-200 uppercase font-bold tracking-wider mb-1">Participación (Equity)</p>
            <p className="text-3xl font-black text-amber-400">
              {equityPercentage.toFixed(2)}%
            </p>
            <p className="text-[10px] text-amber-100/70 mt-1">Valuación post-money: $70M</p>
          </div>
        )}
      </div>
      
      <div className="md:w-3/5 p-8 flex flex-col bg-slate-800">
        <div className="mb-6">
          <h4 className="text-lg text-slate-300 font-semibold mb-2">Simulador de Membresía</h4>
          <p className="text-sm text-slate-400 mb-6">Ajusta la barra para conocer tus beneficios y calcular la repartición de los fondos transparentemente.</p>
          
          <div className="mb-4">
            <div className="flex justify-between items-end mb-2">
              <span className="text-slate-300 text-sm font-medium">Monto Total a Invertir:</span>
              <span className="text-3xl font-bold text-amber-500">{formatPrice(totalAmount)}</span>
            </div>
            
            <div className="relative">
              {isBroken && (
                <div className="absolute inset-0 z-20 flex items-center justify-center animate-bounce">
                  <div className="bg-red-600/90 text-white font-black text-xl px-6 py-2 rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.8)] transform -rotate-2 scale-110">
                    💥 ¡SLIDER ROTO! 💥
                  </div>
                </div>
              )}
              <input
                type="range"
                min={0}
                max={STEPS.length - 1}
                step={1}
                value={sliderIndex}
                onChange={(e) => setSliderIndex(Number(e.target.value))}
                className={`w-full h-3 rounded-lg appearance-none cursor-pointer transition-all duration-300 ${isBroken ? 'bg-red-900 accent-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-slate-700 accent-amber-500'}`}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
              <span>{formatPrice(STEPS[0])}</span>
              <span>{formatPrice(STEPS[STEPS.length - 1])}</span>
            </div>
          </div>
        </div>

        {/* Beneficios */}
        <div className="bg-slate-700/30 rounded-xl p-4 mb-6 border border-slate-600/50">
          <p className="text-xs text-amber-500 font-bold uppercase mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
            Beneficios por tu monto
          </p>
          <ul className="space-y-2">
            {getBenefits().map((benefit, idx) => (
              <li key={idx} className="text-sm text-slate-200 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
            <p className="text-xs text-slate-400 mb-1 font-semibold uppercase">Fondo Scratchup ({(100 - feePercentage * 100).toFixed(0)}%)</p>
            <p className="text-lg font-bold text-white">{formatPrice(scratchupAmount)}</p>
          </div>
          <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs text-slate-400 font-semibold uppercase">Fee Sheerit</p>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                {(feePercentage * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-lg font-bold text-emerald-400">{formatPrice(commission)}</p>
          </div>
        </div>

        <div className="mt-auto">
          {isBroken ? (
            <div className="animate-fade-in-up">
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-4 text-center">
                <p className="text-red-400 font-bold uppercase tracking-wide">🔥 ERES UN GRAN INVERSOR 🔥</p>
                <p className="text-sm text-red-200 mt-1">¿Quieres invertir más de 10 millones? Te recomendamos hablar directamente con Scratchup.</p>
              </div>
              <button
                onClick={handleOpenWhatsApp}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.6)] transition-all duration-300 flex items-center justify-center gap-3 text-lg animate-pulse"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 1.856.001 3.598.723 4.907 2.034 1.31 1.311 2.031 3.054 2.03 4.908-.001 3.825-3.113 6.938-6.937 6.938z" /></svg>
                Contactar Directamente con Scratchup
              </button>
            </div>
          ) : (
            <button
              onClick={handleOpenWhatsAppSheerit}
              className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all duration-300 flex items-center justify-center gap-3 text-lg"
            >
              Adquirir Membresía Inversionista
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
