import React, { useState, useEffect } from 'react';
import { Users, Mail, Search, Trash2, PlusCircle, RefreshCw, AlertTriangle, CheckCircle, Phone, FileText, Zap, Play, X } from 'lucide-react';

interface ProviderEmail {
  email: string;
  providerNumber: string;
  notes?: string;
  rpaRecipeId?: number | null;
}

interface RpaRecipe {
  id: number;
  name: string;
  platform: string;
}

const getApiUrl = () =>
  window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';

export const ProviderEmailsView: React.FC = () => {
  const [emails, setEmails] = useState<ProviderEmail[]>([]);
  const [recipes, setRecipes] = useState<RpaRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [providerNumber, setProviderNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [rpaRecipeId, setRpaRecipeId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [testModal, setTestModal] = useState<{ email: string; result: string; loading: boolean } | null>(null);

  const fetchProviderEmails = () => {
    setLoading(true);
    setError('');
    fetch(`${getApiUrl()}/api/admin/provider-emails`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al obtener los correos de proveedores');
        return res.json();
      })
      .then((data) => {
        setEmails(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching provider emails:', err);
        setError('No se pudo conectar al backend para listar las cuentas de proveedores.');
        setLoading(false);
      });
  };

  const fetchRecipes = () => {
    fetch(`${getApiUrl()}/api/admin/rpa/recipes`)
      .then((res) => res.json())
      .then((data) => setRecipes(Array.isArray(data) ? data : []))
      .catch(() => setRecipes([]));
  };

  useEffect(() => {
    fetchProviderEmails();
    fetchRecipes();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@') || !providerNumber.trim()) {
      setError('Por favor ingresa un correo electrónico válido y el número del proveedor.');
      return;
    }
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/provider-emails/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          providerNumber,
          notes,
          rpaRecipeId: rpaRecipeId ? parseInt(rpaRecipeId) : null,
          password: 'admin123'
        })
      });
      const result = await res.json();
      if (result.success) {
        setSuccess(`Cuenta ${newEmail} vinculada con éxito.`);
        setNewEmail('');
        setProviderNumber('');
        setNotes('');
        setRpaRecipeId('');
        fetchProviderEmails();
      } else {
        setError(`❌ Error: ${result.message || result.error}`);
      }
    } catch (err) {
      setError('❌ Error al comunicarse con el bot.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (emailToDelete: string) => {
    if (!window.confirm(`¿Estás seguro de desvincular: ${emailToDelete}?`)) return;
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/provider-emails/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToDelete, password: 'admin123' })
      });
      const result = await res.json();
      if (result.success) {
        setSuccess('Cuenta de proveedor desvinculada con éxito.');
        fetchProviderEmails();
      } else {
        setError(`❌ Error: ${result.message || result.error}`);
      }
    } catch (err) {
      setError('❌ Error de conexión al desvincular el correo.');
    }
  };

  const handleTestRecipe = async (item: ProviderEmail) => {
    if (!item.rpaRecipeId) return;
    setTestModal({ email: item.email, result: '', loading: true });
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/rpa/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: item.rpaRecipeId,
          variables: { CUSTOMER_EMAIL: item.email },
          password: 'admin123'
        })
      });
      const result = await res.json();
      if (result.success && result.data) {
        const code = Object.values(result.data).find((v: any) => v && v.toString().trim().length >= 4);
        setTestModal({
          email: item.email,
          result: code ? `✅ Código extraído: ${code}` : '⚠️ La receta no devolvió un código válido.',
          loading: false
        });
      } else {
        setTestModal({ email: item.email, result: `❌ Error: ${result.error || 'La receta falló'}`, loading: false });
      }
    } catch (e: any) {
      setTestModal({ email: item.email, result: `❌ Error de conexión: ${e.message}`, loading: false });
    }
  };

  const filteredEmails = emails.filter((item) =>
    item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.providerNumber.includes(searchTerm) ||
    (item.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRecipeName = (id: number | null | undefined) => {
    if (!id) return null;
    return recipes.find((r) => r.id === id)?.name ?? `Receta #${id}`;
  };

  return (
    <div className="space-y-6">
      {/* Test result modal */}
      {testModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border dark:border-gray-700 p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-primary" /> Prueba de Receta RPA
              </h3>
              <button onClick={() => setTestModal(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Correo: <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{testModal.email}</span>
            </p>
            {testModal.loading ? (
              <div className="flex items-center gap-3 py-4 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                Ejecutando automatización... (30-60 seg)
              </div>
            ) : (
              <div className={`p-3 rounded-xl text-sm font-medium ${testModal.result.startsWith('✅') ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
                {testModal.result}
              </div>
            )}
            {!testModal.loading && (
              <button onClick={() => setTestModal(null)} className="mt-4 w-full py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 transition-colors">
                Cerrar
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center dark:text-white">
                <Users className="mr-2 text-brand-primary" /> Cuentas de Proveedores (Externas)
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Correos que no son nuestros. Vincula una receta RPA para extraer códigos automáticamente.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por correo o cel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm w-full"
                />
              </div>
              <button onClick={fetchProviderEmails} className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg transition-colors" title="Refrescar">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 rounded-xl mb-6 border border-red-200 dark:border-red-900/50">
              <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" /><p className="text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-4 rounded-xl mb-6 border border-green-200 dark:border-green-900/50">
              <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" /><p className="text-sm">{success}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Cargando cuentas de proveedores...</div>
          ) : filteredEmails.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-750">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="font-bold text-gray-700 dark:text-gray-300">No hay cuentas registradas</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {searchTerm ? 'Ningún registro coincide con tu búsqueda.' : 'Registra la primera cuenta externa usando el panel lateral.'}
              </p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto border border-gray-150 dark:border-gray-750 rounded-xl divide-y divide-gray-150 dark:divide-gray-750 animate-fadeIn">
              {filteredEmails.map((item) => {
                const recipeName = getRecipeName(item.rpaRecipeId);
                return (
                  <div key={item.email} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750/30 transition-all gap-3">
                    <div className="min-w-0 flex-grow">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-bold text-gray-800 dark:text-white truncate">{item.email}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900/30 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" /> {item.providerNumber}
                        </span>
                        {recipeName ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/30 flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" /> {recipeName}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                            Manual
                          </span>
                        )}
                      </div>
                      {item.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                          <FileText className="w-3.5 h-3.5 text-gray-400" /> {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {item.rpaRecipeId && (
                        <button
                          onClick={() => handleTestRecipe(item)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-all"
                          title="Probar receta RPA — extraer código ahora"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.email)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                        title="Desvincular Cuenta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6 self-start">
          <h3 className="text-lg font-bold flex items-center mb-4 dark:text-white">
            <PlusCircle className="mr-2 text-brand-primary" /> Agregar Cuenta de Proveedor
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Correo Electrónico</label>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                placeholder="proveedor@gmail.com"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Número de Proveedor (WhatsApp)</label>
              <input type="text" value={providerNumber} onChange={(e) => setProviderNumber(e.target.value)}
                placeholder="573027892574"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white text-sm" required />
              <p className="text-[10px] text-gray-400 mt-1">Número completo con código de país. Para filtrar alertas de renovación.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Notas / Referencias</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Disney / Cuentas de Spotinet"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-500" /> Receta RPA para Códigos Automáticos
              </label>
              <select value={rpaRecipeId} onChange={(e) => setRpaRecipeId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white text-sm">
                <option value="">Sin automatización (manual)</option>
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} [{r.platform}]</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1">
                El bot ejecutará esta receta cuando el cliente pida su código de acceso.
              </p>
            </div>
            <button type="submit" disabled={actionLoading}
              className="w-full bg-brand-primary hover:bg-brand-dark text-white font-bold text-sm py-2.5 rounded-xl transition-all disabled:opacity-50">
              {actionLoading ? 'Registrando...' : 'Registrar Cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
