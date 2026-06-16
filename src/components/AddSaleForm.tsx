import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, Send, CheckCircle2 } from 'lucide-react';

interface Plan {
  name: string;
  price: number;
}

interface Platform {
  id: string;
  name: string;
  plans: Plan[];
  discountTier?: string;
}

const DEFAULT_RULES = {
  discountPerPlatform: 1000,
  durationDiscounts: {
    "A": {
      "1": { factor: 1.00 },
      "3": { factor: 0.97 },
      "6": { factor: 0.93 },
      "12": { factor: 0.85 }
    },
    "B": {
      "1": { factor: 1.00 },
      "3": { factor: 0.98 },
      "6": { factor: 0.95 },
      "12": { factor: 0.90 }
    },
    "C": {
      "1": { factor: 1.00 },
      "3": { factor: 0.99 },
      "6": { factor: 0.97 },
      "12": { factor: 0.94 }
    }
  }
};

export const AddSaleForm: React.FC = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ platformId: string, planName: string }[]>([]);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [duration, setDuration] = useState<string>('1');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Client verification / Renewal state
  const [customerServices, setCustomerServices] = useState<any[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRenewal, setIsRenewal] = useState(false);
  const [selectedServiceToRenew, setSelectedServiceToRenew] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Nequi');

  useEffect(() => {
    fetch('/data/platforms.json')
      .then(res => res.json())
      .then(data => setPlatforms(data))
      .catch(err => console.error("Error loading platforms:", err));
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [selectedItems, duration, platforms]);

  const calculateTotal = () => {
    if (selectedItems.length === 0) {
      setTotal(0);
      return;
    }

    const numPlatforms = selectedItems.length;
    const discountPerItem = numPlatforms > 1 ? ((numPlatforms - 1) * DEFAULT_RULES.discountPerPlatform) / numPlatforms : 0;

    let finalTotal = 0;
    selectedItems.forEach(item => {
      const plat = platforms.find(p => p.id === item.platformId);
      const plan = plat?.plans.find(p => p.name === item.planName);
      if (!plan || !plat) return;
      
      const tier = plat.discountTier || 'A';
      const tierRules = DEFAULT_RULES.durationDiscounts[tier as keyof typeof DEFAULT_RULES.durationDiscounts] || DEFAULT_RULES.durationDiscounts['A'];
      
      // Fallback in case of custom months
      const durationKey = ['1', '3', '6', '12'].includes(duration) ? duration : '1';
      const durationRule = tierRules[durationKey as keyof typeof tierRules];
      const factor = durationRule ? durationRule.factor : 1.0;
      
      const itemMonthlyPrice = plan.price - discountPerItem;
      finalTotal += (itemMonthlyPrice * parseInt(duration)) * factor;
    });

    // Round to nearest 1000 using Math.ceil
    setTotal(Math.ceil(finalTotal / 1000) * 1000);
  };

  const handleVerifyClient = async () => {
    if (!phone) {
      setMessage('⚠️ Por favor ingresa el número de WhatsApp.');
      return;
    }
    setIsVerifying(true);
    setMessage('');
    
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    try {
      const response = await fetch(`${apiUrl}/api/admin/clients`);
      const allClients = await response.json();
      
      const cleanSearchPhone = phone.replace(/\D/g, '');
      if (!cleanSearchPhone) {
        setMessage('⚠️ Número de WhatsApp no válido.');
        setIsVerifying(false);
        return;
      }
      
      const filtered = allClients.filter((c: any) => {
        const cPhone = String(c.whatsapp || c.numero || '').replace(/\D/g, '');
        return cPhone && cPhone.includes(cleanSearchPhone);
      });
      
      setCustomerServices(filtered);
      if (filtered.length > 0) {
        setName(filtered[0].Nombre || filtered[0].nombre || '');
        setMessage(`🔍 Encontrado cliente con ${filtered.length} servicio(s) activo(s).`);
      } else {
        setMessage('ℹ️ No se encontraron servicios activos para este número. Procediendo como Venta Nueva.');
        setCustomerServices([]);
        setIsRenewal(false);
        setSelectedServiceToRenew(null);
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ Error al conectar con el servidor de clientes.');
    } finally {
      setIsVerifying(false);
    }
  };

  const addItem = () => {
    setSelectedItems([...selectedItems, { platformId: platforms[0]?.id || '', planName: platforms[0]?.plans[0]?.name || '' }]);
  };

  const removeItem = (index: number) => {
    const newItems = [...selectedItems];
    newItems.splice(index, 1);
    setSelectedItems(newItems);
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...selectedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setSelectedItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !name || (selectedItems.length === 0 && !isRenewal)) return;
    
    setLoading(true);
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    
    // Prepare items based on mode
    let requestItems = [];
    if (isRenewal && selectedServiceToRenew) {
      requestItems = [{
        platformName: selectedServiceToRenew.Streaming,
        _rowNumber: selectedServiceToRenew._rowNumber || selectedServiceToRenew.rowNumber,
        correo: selectedServiceToRenew.correo,
        contraseña: selectedServiceToRenew.contraseña,
        pin: selectedServiceToRenew['pin perfil'] || selectedServiceToRenew.pin || null,
        deben: selectedServiceToRenew.deben || selectedServiceToRenew.vencimiento || null
      }];
    } else {
      requestItems = selectedItems.map(item => {
        const p = platforms.find(plt => plt.id === item.platformId);
        return { platformName: p?.name };
      });
    }

    try {
      const response = await fetch(`${apiUrl}/api/admin/sales/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          name,
          items: requestItems,
          duration,
          total,
          isRenewal,
          paymentMethod,
          password: 'admin123'
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setMessage(isRenewal ? '✅ Renovación registrada con éxito en Excel.' : '✅ Venta registrada con éxito y cupos asignados.');
        setSelectedItems([]);
        setPhone('');
        setName('');
        setCustomerServices([]);
        setIsRenewal(false);
        setSelectedServiceToRenew(null);
      } else {
        setMessage('❌ Error: ' + result.message);
      }
    } catch (err) {
      setMessage('❌ Error de conexión con el backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
          <Calculator className="text-blue-600 w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Nueva Venta Directa</h2>
          <p className="text-gray-500 text-sm">Registra clientes y asigna cupos automáticamente.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold mb-2 dark:text-gray-300">WhatsApp del Cliente</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 57313..."
                className="flex-grow px-4 py-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
              <button
                type="button"
                onClick={handleVerifyClient}
                disabled={isVerifying}
                className="px-4 py-3 bg-brand-primary hover:bg-brand-dark text-white rounded-xl font-bold transition-all disabled:opacity-50 text-sm whitespace-nowrap"
              >
                {isVerifying ? 'Verificando...' : 'Verificar'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 dark:text-gray-300">Nombre del Cliente</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre Completo"
              className="w-full px-4 py-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
        </div>

        {/* Customer Active Services (for Renewals) */}
        {customerServices.length > 0 && (
          <div className="bg-blue-50/40 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 space-y-3">
            <h3 className="text-sm font-black text-blue-900 dark:text-blue-200">Servicios Activos Encontrados (Selecciona uno para Renovar)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {customerServices.map((service, index) => {
                const serviceRow = service._rowNumber || service.rowNumber;
                const isSelected = (selectedServiceToRenew?._rowNumber || selectedServiceToRenew?.rowNumber) === serviceRow && isRenewal;
                return (
                  <div key={index} className={`flex justify-between items-center p-3 rounded-xl border transition-all ${
                    isSelected 
                      ? 'bg-green-50 border-green-300 dark:bg-green-950/20 dark:border-green-900/50' 
                      : 'bg-white border-gray-150 dark:bg-gray-750 dark:border-gray-700'
                  }`}>
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] font-black text-brand-primary uppercase tracking-wider block">{service.Streaming}</span>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-250 truncate">{service.correo}</p>
                      <span className="text-[10px] text-gray-400 block mt-0.5">Vence: {service.deben || service.vencimiento}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRenewal(true);
                        setSelectedServiceToRenew(service);
                        // Try matching platform id if available to compute totals
                        const cleanPlatName = String(service.Streaming).split(' ')[0].toLowerCase();
                        const matchedPlat = platforms.find(p => p.name.toLowerCase().includes(cleanPlatName));
                        if (matchedPlat) {
                          setSelectedItems([{ platformId: matchedPlat.id, planName: matchedPlat.plans[0]?.name || '' }]);
                        }
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all ${
                        isSelected
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/25'
                      }`}
                    >
                      {isSelected ? '✓ Activo' : 'Renovar'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Renewal Banner */}
        {isRenewal && selectedServiceToRenew && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 p-4 rounded-xl flex justify-between items-center text-xs">
            <span className="text-green-800 dark:text-green-300 font-medium">
              <b>Modo Renovación Activo:</b> Se renovará el servicio <b>{selectedServiceToRenew.Streaming}</b> ({selectedServiceToRenew.correo}).
            </span>
            <button
              type="button"
              onClick={() => {
                setIsRenewal(false);
                setSelectedServiceToRenew(null);
                setSelectedItems([]);
              }}
              className="text-red-500 hover:underline font-bold"
            >
              Cambiar a Venta Nueva
            </button>
          </div>
        )}

        {/* Services Selection: Hide or show depending on renewal mode */}
        {!isRenewal && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold dark:text-white">Servicios Seleccionados</h3>
              <button 
                type="button" 
                onClick={addItem}
                className="flex items-center text-sm font-bold text-brand-primary"
              >
                <Plus className="w-4 h-4 mr-1" /> Agregar Servicio
              </button>
            </div>

            {selectedItems.map((item, index) => (
              <div key={index} className="flex gap-4 items-end animate-in slide-in-from-left duration-300">
                <div className="flex-grow">
                  <select 
                    value={item.platformId}
                    onChange={(e) => updateItem(index, 'platformId', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <button 
                  type="button" 
                  onClick={() => removeItem(index)}
                  className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pricing, payment method and custom months selectors */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold text-gray-450 tracking-wider">Duración (Meses)</span>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="px-4 py-2 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white font-bold"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={String(m)}>
                    {m === 1 ? '1 Mes' : `${m} Meses`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold text-gray-450 tracking-wider">Método de Pago</span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="px-4 py-2 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white font-bold"
              >
                <option value="Nequi">Nequi</option>
                <option value="Daviplata">Daviplata</option>
                <option value="Bancolombia">Bancolombia</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Bold Pagos">Bold Pagos</option>
              </select>
            </div>
          </div>

          <div className="text-right flex flex-col justify-center">
            <div className="text-sm text-gray-500 font-medium tracking-wide">TOTAL ESTIMADO</div>
            <div className="text-3xl font-black text-brand-primary tracking-tight">
              ${total.toLocaleString()} COP
            </div>
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" /> {message}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading || (selectedItems.length === 0 && !isRenewal)}
          className="w-full bg-brand-primary text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-brand-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center disabled:opacity-50"
        >
          <Send className="w-6 h-6 mr-2" />
          {loading ? 'Procesando registro...' : isRenewal ? 'Registrar Renovación en Excel' : 'Registrar Venta y Notificar Cliente'}
        </button>
      </form>
    </div>
  );
};
