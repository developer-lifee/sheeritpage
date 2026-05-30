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
}

export const AddSaleForm: React.FC = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ platformId: string, planName: string }[]>([]);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [duration, setDuration] = useState<'1' | '3' | '6' | '12'>('1');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [rules, setRules] = useState<any>(null);

  useEffect(() => {
    fetch('/data/platforms.json')
      .then(res => res.json())
      .then(data => setPlatforms(data))
      .catch(err => console.error("Error loading platforms:", err));

    fetch('/data/rules.json')
      .then(res => res.json())
      .then(data => setRules(data))
      .catch(err => console.error("Error loading pricing rules:", err));
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [selectedItems, duration, rules, platforms]);

  const calculateTotal = () => {
    if (selectedItems.length === 0) {
      setTotal(0);
      return;
    }

    const activeRules = rules || {
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

    const numPlatforms = selectedItems.length;
    const discountPerItem = numPlatforms > 1 ? ((numPlatforms - 1) * activeRules.discountPerPlatform) / numPlatforms : 0;

    let finalTotal = 0;
    selectedItems.forEach(item => {
      const plat = platforms.find(p => p.id === item.platformId);
      const plan = plat?.plans.find(p => p.name === item.planName);
      if (!plan || !plat) return;
      
      const tier = (plat as any).discountTier || 'A';
      const tierRules = activeRules.durationDiscounts[tier] || activeRules.durationDiscounts['A'];
      const durationRule = tierRules[duration];
      const factor = durationRule ? durationRule.factor : 1.0;
      
      const itemMonthlyPrice = plan.price - discountPerItem;
      finalTotal += (itemMonthlyPrice * parseInt(duration)) * factor;
    });

    // Round to nearest 1000 using Math.ceil
    setTotal(Math.ceil(finalTotal / 1000) * 1000);
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
    if (!phone || !name || selectedItems.length === 0) return;
    
    setLoading(true);
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    
    try {
      const response = await fetch(`${apiUrl}/api/admin/sales/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          name,
          items: selectedItems.map(item => {
             const p = platforms.find(plt => plt.id === item.platformId);
             return { platformName: p?.name };
          }),
          duration,
          total,
          password: 'admin123'
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setMessage('✅ Venta registrada con éxito y cupos asignados.');
        setSelectedItems([]);
        setPhone('');
        setName('');
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
            <input 
              type="text" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej: 57313..."
              className="w-full px-4 py-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
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

        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-4">
            {(['1', '3', '6', '12'] as const).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${duration === d ? 'bg-brand-primary text-white scale-110 shadow-lg' : 'bg-white dark:bg-gray-700 dark:text-gray-300'}`}
              >
                {d === '1' ? '1 Mes' : d === '3' ? '3 Meses' : d === '6' ? '6 Meses' : '1 Año'}
              </button>
            ))}
          </div>

          <div className="text-right">
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
          disabled={loading || selectedItems.length === 0}
          className="w-full bg-brand-primary text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-brand-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center disabled:opacity-50"
        >
          <Send className="w-6 h-6 mr-2" />
          {loading ? 'Procesando registro...' : 'Registrar Venta y Notificar Client'}
        </button>
      </form>
    </div>
  );
};
