import React, { useState } from 'react';
import {
  Store,
  Coffee,
  ShoppingBag,
  Laptop,
  Package,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Calculator,
  CreditCard,
  MessageSquare,
  Layers,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Flame,
  ExternalLink,
  Sliders,
  DollarSign,
  Smartphone,
  ChevronRight,
  HelpCircle,
  Clock,
  Zap
} from 'lucide-react';

interface StoreBuilderPageProps {
  onNavigateHome?: () => void;
}

interface RecipeIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
}

export function StoreBuilderPage({ onNavigateHome }: StoreBuilderPageProps) {
  const [step, setStep] = useState<number>(1);
  const [loadingPayment, setLoadingPayment] = useState<boolean>(false);

  // Paso 1: Identidad
  const [storeName, setStoreName] = useState<string>('Café de la Sierra');
  const [slug, setSlug] = useState<string>('cafe-de-la-sierra');
  const [businessType, setBusinessType] = useState<'coffee' | 'retail' | 'services' | 'general'>('coffee');
  const [ownerPhone, setOwnerPhone] = useState<string>('3118587974');
  const [city, setCity] = useState<string>('Bogotá');

  // Paso 2: Módulos activos
  const [modules, setModules] = useState({
    ecommerce: true,
    boldPayment: true,
    whatsappBot: true,
    posRecipes: true,
    shippingDelivery: true
  });

  // Paso 3: Simulador de Recetas e Ingredientes (Escandallo)
  const [sampleProductName, setSampleProductName] = useState<string>('Capuchino Especial 8oz');
  const [sampleSalePrice, setSampleSalePrice] = useState<number>(8000);
  const [dailySalesEstimate, setDailySalesEstimate] = useState<number>(45);

  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([
    { id: '1', name: 'Café Grano Especialidad (Huila)', quantity: 18, unit: 'g', unitCost: 50 },
    { id: '2', name: 'Leche Entera / Deslactosada', quantity: 150, unit: 'ml', unitCost: 4.5 },
    { id: '3', name: 'Vaso Polipapel Térmico 8oz', quantity: 1, unit: 'un', unitCost: 350 },
    { id: '4', name: 'Tapa Viajera Hermética', quantity: 1, unit: 'un', unitCost: 150 }
  ]);

  // Cálculos de receta
  const totalProductionCost = ingredients.reduce((sum, ing) => sum + (ing.quantity * ing.unitCost), 0);
  const netProfitPerUnit = Math.max(0, sampleSalePrice - totalProductionCost);
  const grossMarginPercentage = sampleSalePrice > 0 ? (netProfitPerUnit / sampleSalePrice) * 100 : 0;
  const projectedMonthlyNetProfit = netProfitPerUnit * dailySalesEstimate * 30;
  const projectedMonthlyRevenue = sampleSalePrice * dailySalesEstimate * 30;

  // Handlers
  const handleNameChange = (val: string) => {
    setStoreName(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generatedSlug || 'mi-tienda');
  };

  const handleAddIngredient = () => {
    const newIng: RecipeIngredient = {
      id: Date.now().toString(),
      name: 'Insumo adicional',
      quantity: 1,
      unit: 'un',
      unitCost: 200
    };
    setIngredients([...ingredients, newIng]);
  };

  const handleUpdateIngredient = (id: string, field: keyof RecipeIngredient, value: any) => {
    setIngredients(ingredients.map(ing => {
      if (ing.id === id) {
        return { ...ing, [field]: value };
      }
      return ing;
    }));
  };

  const handleRemoveIngredient = (id: string) => {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  const toggleModule = (key: keyof typeof modules) => {
    setModules({ ...modules, [key]: !modules[key] });
  };

  // Checkout con Pasarela Bold
  const handleInitiateActivation = async () => {
    setLoadingPayment(true);
    const apiUrl = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
      ? 'http://localhost:3000'
      : window.location.origin;

    try {
      const payload = {
        amount: 40000, // $40.000 COP (~$10 USD)
        description: `Suscripción Mensual Retailer OS: ${storeName} (${slug})`,
        customerPhone: ownerPhone,
        customerName: storeName,
        tenantSlug: slug,
        modules: modules,
        businessType: businessType
      };

      const res = await fetch(`${apiUrl}/api/bold/generate-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data && data.url) {
        window.location.href = data.url;
      } else {
        alert('Se generó la orden de activación. En modo prueba, tu tienda se encuentra registrada como borrador activo.');
      }
    } catch (err: any) {
      console.error('Error al generar checkout de Bold:', err.message);
      alert('Error conectando con la pasarela de pagos. Por favor intenta de nuevo.');
    } finally {
      setLoadingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors py-8 px-4 sm:px-6 lg:px-8">
      {/* Header Superior */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary rounded-2xl border border-brand-primary/30">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight">Sheerit Retailer OS</h1>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xxs font-black uppercase rounded-full border border-emerald-300 dark:border-emerald-800">
                  Multitenant
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Lanza tu tienda online, POS de mostrador, recetas y WhatsApp por solo <strong className="text-brand-primary">$10 USD/mes</strong> (Ahorra los $39 USD de Shopify).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="px-3.5 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                Volver a Sheerit
              </button>
            )}
          </div>
        </div>

        {/* Stepper Wizard */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 mt-6">
          {[
            { num: 1, title: '1. Tu Negocio', desc: 'Identidad y URL' },
            { num: 2, title: '2. Módulos', desc: 'Funciones activas' },
            { num: 3, title: '3. Simulador POS', desc: 'Costeo de Recetas' },
            { num: 4, title: '4. Activar', desc: 'Lanzar ($40k COP)' }
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`text-left p-3 rounded-2xl border transition-all ${step === s.num
                  ? 'bg-white dark:bg-gray-800 border-brand-primary ring-2 ring-brand-primary/20 shadow-sm'
                  : step > s.num
                    ? 'bg-gray-100/70 dark:bg-gray-850/60 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    : 'bg-transparent border-transparent opacity-60'
                }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step === s.num
                    ? 'bg-brand-primary text-white'
                    : step > s.num
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                  {step > s.num ? '✓' : s.num}
                </span>
                <span className="text-xs font-bold truncate">{s.title}</span>
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 hidden sm:block truncate">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido Principal por Pasos */}
      <div className="max-w-5xl mx-auto">
        {/* PASO 1: Identidad del Negocio */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-750 space-y-6 animate-in fade-in duration-300">
            <div>
              <span className="text-xxs font-extrabold uppercase tracking-wider text-brand-primary">Paso 1 de 4</span>
              <h2 className="text-2xl font-black mt-1">Configura la Identidad de tu Tienda</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Cada comercio tiene su propia dirección web, catálogo independiente y configuración personalizada.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold mb-1.5">Nombre Comercial de la Tienda *</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ej. Café de la Sierra, Urban Wear, Pizzería Bella"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-750 text-sm font-semibold focus:ring-2 focus:ring-brand-primary outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">Tu Enlace Web Exclusivo</label>
                <div className="flex items-center px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 font-mono">
                  <span>sheerit.co/tienda/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="bg-transparent text-brand-primary font-bold outline-hidden ml-0.5 flex-1"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">Este enlace será público para que tus clientes compren por internet.</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-2">Selecciona el Tipo de Negocio</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'coffee', label: 'Café & Alimentos', icon: Coffee, desc: 'Costeo por gramo/ml y recetas POS' },
                  { id: 'retail', label: 'Moda & Retail Físico', icon: ShoppingBag, desc: 'Tallas, colores y fletes' },
                  { id: 'services', label: 'Servicios & Digital', icon: Laptop, desc: 'Licencias y suscripciones' },
                  { id: 'general', label: 'Tienda General / Abarrotes', icon: Package, desc: 'Inventario simple por unidades' }
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = businessType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setBusinessType(t.id as any)}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${isSelected
                          ? 'border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10 ring-2 ring-brand-primary/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-brand-primary' : 'text-gray-400'}`} />
                      <div>
                        <div className="text-xs font-black">{t.label}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{t.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-xs font-bold mb-1.5">WhatsApp de Notificaciones y Pedidos *</label>
                <div className="flex items-center">
                  <span className="px-3 py-3 bg-gray-100 dark:bg-gray-700 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-xl text-xs font-bold text-gray-500">
                    +57
                  </span>
                  <input
                    type="tel"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="3118587974"
                    className="w-full px-4 py-3 rounded-r-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-750 text-sm font-semibold focus:ring-2 focus:ring-brand-primary outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">Ciudad de Operación Principal</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej. Bogotá, Medellín, Cali, Pereira"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-750 text-sm font-semibold focus:ring-2 focus:ring-brand-primary outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <span>Continuar a Módulos</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: Selección de Módulos */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-750 space-y-6 animate-in fade-in duration-300">
            <div>
              <span className="text-xxs font-extrabold uppercase tracking-wider text-brand-primary">Paso 2 de 4</span>
              <h2 className="text-2xl font-black mt-1">Elige los Módulos para tu Negocio</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Todo viene integrado en el mismo paquete de $10 USD. Activa lo que necesites y apaga lo que no aplique a tu modelo.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  key: 'ecommerce',
                  title: 'Catálogo E-commerce Web & Carrito',
                  desc: 'Página web responsive con tu logo, productos, fotos y selector de variantes (molienda, tamaño, etc.).',
                  icon: Store,
                  tag: 'Incluido'
                },
                {
                  key: 'boldPayment',
                  title: 'Pasarela de Pagos Bold Integrada (Nequi, Daviplata, PSE, Tarjetas)',
                  desc: 'Cobra en línea sin lidiar con certificaciones complejas ni comisiones fijas en dólares.',
                  icon: CreditCard,
                  tag: '0 Comisiones Fijas'
                },
                {
                  key: 'whatsappBot',
                  title: 'Bot de WhatsApp para Confirmación y Pedidos',
                  desc: 'Notifica al comprador automáticamente por WhatsApp al recibir el pago y le manda su comprobante.',
                  icon: MessageSquare,
                  tag: 'Exclusivo Sheerit'
                },
                {
                  key: 'posRecipes',
                  title: 'Sistema POS & Escandallo (Desagregación de Ingredientes / Recetas)',
                  desc: 'Vende un café o plato y descuenta automáticamente gramos de café, mililitros de leche y empaques en tiempo real.',
                  icon: Calculator,
                  tag: '🔥 Ideal Cafeterías & Alimentos'
                },
                {
                  key: 'shippingDelivery',
                  title: 'Módulo de Envíos, Direcciones y Guías de Transporte',
                  desc: 'Captura dirección exacta, barrio y genera el mensaje con el número de guía para despachos nacionales.',
                  icon: Package,
                  tag: 'Logística'
                }
              ].map((m) => {
                const Icon = m.icon;
                const isEnabled = (modules as any)[m.key];
                return (
                  <div
                    key={m.key}
                    onClick={() => toggleModule(m.key as any)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${isEnabled
                        ? 'border-brand-primary/40 bg-brand-primary/5 dark:bg-brand-primary/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 opacity-60'
                      }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`p-2.5 rounded-xl ${isEnabled ? 'bg-brand-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold">{m.title}</h3>
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-[10px] font-extrabold rounded-md text-gray-600 dark:text-gray-300">
                            {m.tag}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{m.desc}</p>
                      </div>
                    </div>

                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${isEnabled
                        ? 'bg-brand-primary border-brand-primary text-white'
                        : 'border-gray-300 dark:border-gray-600'
                      }`}>
                      {isEnabled && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-750 transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Atrás</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <span>Cacharrear en Simulador POS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: Simulador Cacharrero de Escandallo y Recetas */}
        {step === 3 && (
          <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-750 space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-700 pb-4">
              <div>
                <span className="text-xxs font-extrabold uppercase tracking-wider text-brand-primary">Paso 3 de 4</span>
                <h2 className="text-2xl font-black mt-1">Cacharrero en Vivo: Escandallo y Receta</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Prueba cómo el software calcula al instante el gasto de ingredientes y tu ganancia real por taza o producto vendido.
                </p>
              </div>

              <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400 text-xs font-extrabold flex items-center gap-1.5 self-start sm:self-auto">
                <Flame className="w-4 h-4 animate-bounce" />
                <span>Simulador de Escandallo</span>
              </div>
            </div>

            {/* Configuración de Producto de Muestra */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-750/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Nombre del Producto a la Venta</label>
                <input
                  type="text"
                  value={sampleProductName}
                  onChange={(e) => setSampleProductName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-bold outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Precio de Venta al Público ($ COP)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-gray-400 font-bold">$</span>
                  <input
                    type="number"
                    value={sampleSalePrice}
                    onChange={(e) => setSampleSalePrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-bold text-green-600 dark:text-green-400 outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Tabla de Desagregación de Ingredientes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-500">
                  Desglose de Ingredientes (Insumos que descuenta al vender 1 unidad)
                </h3>
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="px-2.5 py-1 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Insumo</span>
                </button>
              </div>

              <div className="space-y-2">
                {ingredients.map((ing) => {
                  const lineCost = ing.quantity * ing.unitCost;
                  return (
                    <div
                      key={ing.id}
                      className="p-3 bg-white dark:bg-gray-750 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 w-full sm:w-auto">
                        <input
                          type="text"
                          value={ing.name}
                          onChange={(e) => handleUpdateIngredient(ing.id, 'name', e.target.value)}
                          className="w-full bg-transparent font-bold text-gray-800 dark:text-gray-100 outline-hidden border-b border-transparent focus:border-brand-primary"
                        />
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={ing.quantity}
                            onChange={(e) => handleUpdateIngredient(ing.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-center font-bold"
                          />
                          <select
                            value={ing.unit}
                            onChange={(e) => handleUpdateIngredient(ing.id, 'unit', e.target.value)}
                            className="px-1.5 py-1 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 font-semibold"
                          >
                            <option value="g">g</option>
                            <option value="ml">ml</option>
                            <option value="un">un</option>
                            <option value="oz">oz</option>
                          </select>
                        </div>

                        <div className="text-right min-w-[90px]">
                          <span className="text-[10px] text-gray-400 block">Costo unitario</span>
                          <span className="font-semibold text-gray-500">${ing.unitCost}/{ing.unit}</span>
                        </div>

                        <div className="text-right min-w-[90px]">
                          <span className="text-[10px] text-gray-400 block">Total Insumo</span>
                          <span className="font-extrabold text-red-500">${Math.round(lineCost).toLocaleString()}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(ing.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          title="Eliminar insumo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dashboard de Rentabilidad en Tiempo Real */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-2xl border border-gray-200 dark:border-gray-700">
                <span className="text-[11px] font-bold text-gray-400 uppercase">Costo Producción (Taza)</span>
                <div className="text-xl font-black text-red-650 dark:text-red-400 mt-1">
                  ${Math.round(totalProductionCost).toLocaleString()} COP
                </div>
                <span className="text-[10px] text-gray-500 mt-0.5 block">Suma de todos los insumos base</span>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-2xl border border-gray-200 dark:border-gray-700">
                <span className="text-[11px] font-bold text-gray-400 uppercase">Ganancia Neta (Por Taza)</span>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  +${Math.round(netProfitPerUnit).toLocaleString()} COP
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 block">
                  Margen Bruto: {grossMarginPercentage.toFixed(1)}%
                </span>
              </div>

              <div className="p-4 bg-emerald-500/10 dark:bg-emerald-950/30 rounded-2xl border border-emerald-500/30">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Proyección Mes ({dailySalesEstimate}/día)</span>
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                  ${Math.round(projectedMonthlyNetProfit).toLocaleString()} COP
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  Utilidad pura libre de ingredientes
                </span>
              </div>
            </div>

            {/* Slider de estimación diaria */}
            <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-primary" />
                <span className="font-bold">Estimación de ventas diarias en tu mostrador:</span>
                <strong className="text-brand-primary text-sm">{dailySalesEstimate} unidades / día</strong>
              </div>
              <input
                type="range"
                min="5"
                max="250"
                value={dailySalesEstimate}
                onChange={(e) => setDailySalesEstimate(parseInt(e.target.value))}
                className="w-full sm:w-64 accent-brand-primary"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-750 transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Atrás</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <span>Revisar y Activar Tienda</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 4: Activación y Pago Confirmado */}
        {step === 4 && (
          <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-750 space-y-6 animate-in fade-in duration-300">
            <div>
              <span className="text-xxs font-extrabold uppercase tracking-wider text-brand-primary">Paso 4 de 4</span>
              <h2 className="text-2xl font-black mt-1">Activa tu Tienda Retailer OS</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tu plataforma se autogestiona. Tras confirmar el pago mensual por Bold, tu catálogo y POS quedan en línea al instante.
              </p>
            </div>

            {/* Comparativa Shopify vs Sheerit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 opacity-70">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-500">Con Shopify Tradicional</span>
                  <span className="text-xs font-black line-through text-red-500">$360.000 COP / mes</span>
                </div>
                <ul className="text-xs space-y-1.5 text-gray-500">
                  <li>❌ $39 USD/mes plan básico (~$160k)</li>
                  <li>❌ App externa de WhatsApp (~$120k)</li>
                  <li>❌ App de recetas / escandallo (~$80k)</li>
                  <li>❌ Comisiones extra por pasarela</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 relative overflow-hidden">
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-black rounded-full uppercase">
                  Ahorras $320k/mes
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200">Con Sheerit Retailer OS</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">$40.000 COP / mes</span>
                </div>
                <ul className="text-xs space-y-1.5 text-emerald-900 dark:text-emerald-200 font-medium">
                  <li>✅ Catálogo Web E-commerce en tu propio enlace</li>
                  <li>✅ Pasarela Bold nativa (Nequi, PSE, Tarjetas)</li>
                  <li>✅ Bot de WhatsApp para pedidos y confirmación</li>
                  <li>✅ Sistema POS y costeo de recetas en vivo</li>
                </ul>
              </div>
            </div>

            {/* Resumen de la Orden */}
            <div className="p-5 bg-gray-50 dark:bg-gray-750 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
              <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">Resumen de tu Configuración</h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block">Tienda</span>
                  <strong className="text-gray-900 dark:text-white">{storeName}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Enlace público</span>
                  <span className="text-brand-primary font-mono text-[11px] truncate block">sheerit.co/tienda/{slug}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Categoría</span>
                  <strong className="capitalize">{businessType}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">WhatsApp de Avisos</span>
                  <strong>+57 {ownerPhone}</strong>
                </div>
              </div>
            </div>

            {/* Botón de Pago con Bold */}
            <div className="pt-2 text-center space-y-3">
              <button
                type="button"
                onClick={handleInitiateActivation}
                disabled={loadingPayment}
                className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 mx-auto disabled:opacity-50"
              >
                {loadingPayment ? (
                  <>
                    <Zap className="w-5 h-5 animate-spin" />
                    <span>Conectando con Bold...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>🚀 Pagar $40.000 COP y Activar Tienda</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-gray-400 max-w-md mx-auto">
                🔒 Pago 100% seguro a través de <strong>Bold</strong> (Nequi, Daviplata, Bancolombia, PSE y Tarjetas). Tu tienda se habilita inmediatamente al confirmar el pago.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-750 transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Atrás al Simulador</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

