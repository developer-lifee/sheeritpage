import React, { useEffect, useState, useMemo } from 'react';
import {
  Store,
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  MessageCircle,
  MapPin,
  Settings,
  X,
  Save,
  Upload,
  Check,
  ArrowLeft,
  Package,
  RefreshCw,
} from 'lucide-react';

export interface StoreProduct {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  image?: string;
}

export interface TenantStoreData {
  slug: string;
  storeName: string;
  businessType: string;
  ownerPhone: string;
  city: string;
  logoUrl: string;
  accentColor: string;
  modules: Record<string, boolean>;
  products: StoreProduct[];
  status: string;
}

interface TenantStorefrontPageProps {
  slug: string;
  onNavigateHome?: () => void;
  onNavigateCreate?: () => void;
}

export const TenantStorefrontPage: React.FC<TenantStorefrontPageProps> = ({
  slug,
  onNavigateHome,
  onNavigateCreate,
}) => {
  const [store, setStore] = useState<TenantStoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [cart, setCart] = useState<Array<{ product: StoreProduct; qty: number }>>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Quick Catalog / JSON Editor Modal
  const [editorOpen, setEditorOpen] = useState(false);
  const [editProducts, setEditProducts] = useState<StoreProduct[]>([]);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [editAccentColor, setEditAccentColor] = useState('#0d9488');
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const getApiUrl = () =>
    typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:3000'
      : window.location.origin;

  const fetchStore = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await fetch(`${getApiUrl()}/api/public/stores/${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (res.ok && data.success && data.store) {
        setStore(data.store);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStore();
  }, [slug]);

  const categories = useMemo(() => {
    if (!store) return ['Todas'];
    const set = new Set<string>();
    (store.products || []).forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return ['Todas', ...Array.from(set)];
  }, [store]);

  const filteredProducts = useMemo(() => {
    if (!store) return [];
    const q = searchTerm.trim().toLowerCase();
    return (store.products || []).filter((p) => {
      const matchCat = selectedCategory === 'Todas' || (p.category || '').trim() === selectedCategory;
      const matchSearch =
        !q ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [store, searchTerm, selectedCategory]);

  const addToCart = (product: StoreProduct) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.product.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const cartTotal = cart.reduce((acc, item) => acc + Number(item.product.price || 0) * item.qty, 0);

  const handleWhatsAppCheckout = () => {
    if (!store || cart.length === 0) return;
    const cleanPhone = (store.ownerPhone || '3118587974').replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
    const lines = [
      `🛒 *Nuevo Pedido - ${store.storeName}*`,
      customerName.trim() ? `👤 *Cliente:* ${customerName.trim()}` : '',
      customerAddress.trim() ? `📍 *Dirección:* ${customerAddress.trim()}` : '',
      '',
      '*Detalle del pedido:*',
      ...cart.map(
        (i) =>
          `• ${i.qty}x ${i.product.name} — $${(Number(i.product.price || 0) * i.qty).toLocaleString('es-CO')}`
      ),
      '',
      `💰 *Total:* $${cartTotal.toLocaleString('es-CO')} COP`,
    ]
      .filter(Boolean)
      .join('\n');

    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(lines)}`, '_blank', 'noopener,noreferrer');
  };

  const openCatalogEditor = () => {
    if (!store) return;
    setEditProducts(store.products || []);
    setJsonText(JSON.stringify(store.products || [], null, 2));
    setEditLogoUrl(store.logoUrl || '');
    setEditAccentColor(store.accentColor || '#0d9488');
    setJsonMode(false);
    setEditorOpen(true);
  };

  const handleSaveCatalog = async () => {
    if (!store) return;
    let finalProducts = editProducts;
    if (jsonMode) {
      try {
        const parsed = JSON.parse(jsonText);
        if (!Array.isArray(parsed)) {
          alert('El JSON debe ser un arreglo [...] de productos.');
          return;
        }
        finalProducts = parsed.map((p: any, idx: number) => ({
          id: String(p.id || Date.now() + idx),
          name: String(p.name || p.nombre || 'Producto'),
          price: Number(p.price || p.precio || 0),
          category: String(p.category || p.categoria || 'General'),
          description: String(p.description || p.descripcion || ''),
          image: String(p.image || p.imagen || ''),
        }));
      } catch (e: any) {
        alert(`JSON inválido: ${e.message}`);
        return;
      }
    }

    setSavingCatalog(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/public/stores/${encodeURIComponent(store.slug)}/products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: finalProducts,
          logoUrl: editLogoUrl,
          accentColor: editAccentColor,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStore({
          ...store,
          products: finalProducts,
          logoUrl: editLogoUrl,
          accentColor: editAccentColor,
        });
        setEditorOpen(false);
        setSaveToast('✅ Catálogo y marca actualizados en vivo');
        setTimeout(() => setSaveToast(null), 3500);
      } else {
        alert(data.error || 'Error guardando cambios');
      }
    } catch (e: any) {
      alert(`Error de red: ${e.message}`);
    } finally {
      setSavingCatalog(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 font-bold">
          <RefreshCw className="w-5 h-5 animate-spin text-teal-500" />
          <span>Cargando tienda "{slug}"...</span>
        </div>
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center space-y-4 shadow-xl">
          <Store className="w-12 h-12 mx-auto text-gray-400" />
          <h2 className="text-xl font-black text-gray-900 dark:text-white">Tienda no encontrada</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No encontramos una tienda activa con el enlace <code className="font-mono">/tienda/{slug}</code>.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {onNavigateCreate && (
              <button
                onClick={onNavigateCreate}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
              >
                Crear esta tienda ahora
              </button>
            )}
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-200"
              >
                Ir al inicio
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const accent = store.accentColor || '#0d9488';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {store.logoUrl ? (
              <img
                src={store.logoUrl}
                alt={store.storeName}
                className="w-11 h-11 rounded-xl object-contain bg-white border border-gray-200 dark:border-gray-700 p-1 flex-shrink-0"
              />
            ) : (
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                style={{ backgroundColor: accent }}
              >
                {store.storeName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-black tracking-tight truncate">{store.storeName}</h1>
              <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                {store.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {store.city}
                  </span>
                )}
                <span className="capitalize">· {store.businessType}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCatalogEditor}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 text-xs font-bold"
              title="Editar productos, JSON o logo de esta tienda"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Editar Productos / JSON</span>
            </button>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-extrabold shadow-md transition-transform active:scale-95"
              style={{ backgroundColor: accent }}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Carrito</span>
              {cartCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white text-slate-900 text-[10px] font-black">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {saveToast && (
        <div className="max-w-6xl mx-auto px-4 pt-3">
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            {saveToast}
          </div>
        </div>
      )}

      {/* Search & Categories */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Buscar en ${store.storeName}...`}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }`}
                style={selectedCategory === cat ? { backgroundColor: accent } : undefined}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
            <Package className="w-10 h-10 mx-auto text-gray-400" />
            <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
              No hay productos para mostrar todavía.
            </p>
            <button
              type="button"
              onClick={openCatalogEditor}
              className="px-4 py-2 rounded-xl text-white text-xs font-bold"
              style={{ backgroundColor: accent }}
            >
              + Agregar productos o pegar JSON
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-44 object-cover bg-gray-100 dark:bg-gray-900"
                    />
                  ) : (
                    <div
                      className="w-full h-32 flex items-center justify-center text-white/90 font-black text-2xl"
                      style={{ background: `linear-gradient(135deg, ${accent}, #0f172a)` }}
                    >
                      {product.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="p-4 space-y-1.5">
                    {product.category && (
                      <span
                        className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: accent }}
                      >
                        {product.category}
                      </span>
                    )}
                    <h3 className="font-extrabold text-base text-gray-900 dark:text-white">{product.name}</h3>
                    {product.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{product.description}</p>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-4 pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-700/60">
                  <span className="text-lg font-black font-mono text-gray-900 dark:text-white">
                    ${Number(product.price || 0).toLocaleString('es-CO')}
                  </span>
                  <button
                    type="button"
                    onClick={() => addToCart(product)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-extrabold shadow-sm hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: accent }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 text-center text-[11px] text-gray-400 flex items-center justify-center gap-3">
          <span>Tienda creada con <strong>Sheerit Retailer OS</strong></span>
          {onNavigateHome && (
            <button onClick={onNavigateHome} className="underline hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Ir a Sheerit
            </button>
          )}
        </div>
      </main>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md h-full flex flex-col border-l border-gray-200 dark:border-gray-800 shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" style={{ color: accent }} /> Tu Pedido
              </h3>
              <button onClick={() => setCartOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cart.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-12">Tu carrito está vacío.</p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{item.product.name}</p>
                      <p className="text-xs font-mono text-gray-500">
                        ${Number(item.product.price || 0).toLocaleString('es-CO')} c/u
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateCartQty(item.product.id, -1)}
                        className="p-1 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-5 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateCartQty(item.product.id, 1)}
                        className="p-1 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}

              {cart.length > 0 && (
                <div className="pt-3 space-y-2.5 border-t border-gray-200 dark:border-gray-800">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Tu nombre (opcional)"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                  />
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Dirección o barrio de entrega (opcional)"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                  />
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-5 border-t border-gray-200 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between text-sm font-black">
                  <span>Total a pagar:</span>
                  <span className="font-mono text-lg">${cartTotal.toLocaleString('es-CO')} COP</span>
                </div>
                <button
                  type="button"
                  onClick={handleWhatsAppCheckout}
                  className="w-full py-3 rounded-xl text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg"
                  style={{ backgroundColor: accent }}
                >
                  <MessageCircle className="w-4 h-4" /> Enviar Pedido por WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Catalog / JSON Editor Modal */}
      {editorOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm">Editar Catálogo y Marca — {store.storeName}</h3>
                <p className="text-[11px] text-gray-500">Agrega productos o pega directamente un JSON para reemplazar el catálogo.</p>
              </div>
              <button onClick={() => setEditorOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="sm:col-span-2 flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 font-bold flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Logo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const r = new FileReader();
                        r.onload = () => typeof r.result === 'string' && setEditLogoUrl(r.result);
                        r.readAsDataURL(f);
                      }}
                    />
                  </label>
                  <input
                    type="text"
                    value={editLogoUrl.startsWith('data:') ? '' : editLogoUrl}
                    onChange={(e) => setEditLogoUrl(e.target.value)}
                    placeholder={editLogoUrl.startsWith('data:') ? 'Logo subido' : 'URL del logo...'}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold">Color:</span>
                  <input
                    type="color"
                    value={editAccentColor}
                    onChange={(e) => setEditAccentColor(e.target.value)}
                    className="w-9 h-8 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Mode switch */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (jsonMode) {
                        try {
                          const parsed = JSON.parse(jsonText);
                          if (Array.isArray(parsed)) setEditProducts(parsed);
                        } catch {}
                      }
                      setJsonMode(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold ${!jsonMode ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
                  >
                    Editor Visual
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setJsonText(JSON.stringify(editProducts, null, 2));
                      setJsonMode(true);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold ${jsonMode ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
                  >
                    Pegar / Editar JSON
                  </button>
                </div>

                {!jsonMode && (
                  <button
                    type="button"
                    onClick={() =>
                      setEditProducts([
                        ...editProducts,
                        { id: String(Date.now()), name: 'Nuevo Producto', price: 15000, category: 'General', description: '' },
                      ])
                    }
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Producto
                  </button>
                )}
              </div>

              {jsonMode ? (
                <textarea
                  rows={12}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 font-mono text-xs"
                />
              ) : (
                <div className="space-y-2.5">
                  {editProducts.map((p, idx) => (
                    <div
                      key={p.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 items-center"
                    >
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => {
                          const next = [...editProducts];
                          next[idx] = { ...p, name: e.target.value };
                          setEditProducts(next);
                        }}
                        placeholder="Nombre"
                        className="sm:col-span-4 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                      />
                      <input
                        type="number"
                        value={p.price}
                        onChange={(e) => {
                          const next = [...editProducts];
                          next[idx] = { ...p, price: Number(e.target.value) || 0 };
                          setEditProducts(next);
                        }}
                        placeholder="Precio"
                        className="sm:col-span-2 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 font-mono"
                      />
                      <input
                        type="text"
                        value={p.category || ''}
                        onChange={(e) => {
                          const next = [...editProducts];
                          next[idx] = { ...p, category: e.target.value };
                          setEditProducts(next);
                        }}
                        placeholder="Categoría"
                        className="sm:col-span-2 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                      />
                      <input
                        type="text"
                        value={p.description || ''}
                        onChange={(e) => {
                          const next = [...editProducts];
                          next[idx] = { ...p, description: e.target.value };
                          setEditProducts(next);
                        }}
                        placeholder="Descripción"
                        className="sm:col-span-3 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => setEditProducts(editProducts.filter((_, i) => i !== idx))}
                        className="sm:col-span-1 p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg justify-self-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-3.5 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={savingCatalog}
                onClick={handleSaveCatalog}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold disabled:opacity-50"
              >
                {savingCatalog ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
