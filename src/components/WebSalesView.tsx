import React, { useState, useEffect } from 'react';
import { Search, Trash2, RefreshCw, AlertTriangle, CheckCircle, Phone, Mail, ShoppingBag, Calendar, User, DollarSign, Clock } from 'lucide-react';

interface WebSale {
  orderId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  whatsapp?: string;
  platformName?: string;
  amount?: number;
  createdAt?: string;
  approvedAt?: string;
  numbersStr?: string;
}

export const WebSalesView: React.FC = () => {
  const [pendingSales, setPendingSales] = useState<WebSale[]>([]);
  const [approvedSales, setApprovedSales] = useState<WebSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'approved' | 'pending'>('approved');

  const fetchSales = async () => {
    setLoading(true);
    setError('');
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    
    try {
      // Fetch pending
      const pendingRes = await fetch(`${apiUrl}/api/admin/web-sales/pending`);
      if (!pendingRes.ok) throw new Error('Error al obtener ventas pendientes');
      const pendingData = await pendingRes.json();
      
      // Fetch approved
      const approvedRes = await fetch(`${apiUrl}/api/admin/web-sales/approved`);
      if (!approvedRes.ok) throw new Error('Error al obtener ventas aprobadas');
      const approvedData = await approvedRes.json();

      const mapSales = (sales: any[]) => sales.map(s => ({
        ...s,
        orderId: s.orderId || s.order_id
      }));

      setPendingSales(pendingData.success && Array.isArray(pendingData.sales) ? mapSales(pendingData.sales) : []);
      setApprovedSales(approvedData.success && Array.isArray(approvedData.sales) ? mapSales(approvedData.sales) : []);
    } catch (err: any) {
      console.error('Error fetching web sales:', err);
      setError('No se pudo conectar al servidor para listar las ventas de la página.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleDeletePending = async (orderId: string) => {
    const confirmDelete = window.confirm(`¿Estás seguro de eliminar el link de pago pendiente para la orden: ${orderId}?`);
    if (!confirmDelete) return;

    setError('');
    setSuccess('');
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    
    try {
      const res = await fetch(`${apiUrl}/api/admin/web-sales/pending/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      const result = await res.json();
      if (result.success) {
        setSuccess(`Orden pendiente ${orderId} eliminada correctamente.`);
        fetchSales();
      } else {
        setError(`Error: ${result.error || result.message}`);
      }
    } catch (err) {
      setError('Error al comunicarse con el servidor.');
    }
  };

  const salesToDisplay = activeSubTab === 'approved' ? approvedSales : pendingSales;

  const filteredSales = salesToDisplay.filter((sale) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${sale.firstName || ''} ${sale.lastName || ''}`.toLowerCase();
    return (
      (sale.orderId || '').toLowerCase().includes(searchLower) ||
      fullName.includes(searchLower) ||
      (sale.email || '').toLowerCase().includes(searchLower) ||
      (sale.whatsapp || '').includes(searchLower) ||
      (sale.platformName || '').toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-150 dark:border-gray-700 p-6 transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-100 dark:border-gray-700 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-brand-primary" />
            Transacciones de la Página Web (PSE / Bold)
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Valida los pagos confirmados y los intentos de compra abandonados desde la web.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSales}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-bold text-gray-700 dark:text-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 dark:border-gray-750 mb-6">
        <button
          onClick={() => { setActiveSubTab('approved'); setSearchTerm(''); }}
          className={`flex items-center gap-2 py-3 px-5 border-b-2 font-bold text-sm transition-colors ${
            activeSubTab === 'approved'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Aprobados y Pagados ({approvedSales.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('pending'); setSearchTerm(''); }}
          className={`flex items-center gap-2 py-3 px-5 border-b-2 font-bold text-sm transition-colors ${
            activeSubTab === 'pending'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          Temporales / Pendientes ({pendingSales.length})
        </button>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 p-4 rounded-xl border border-red-150 dark:border-red-900/30 mb-6 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 p-4 rounded-xl border border-green-150 dark:border-green-900/30 mb-6 text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-500" />
          <span className="font-semibold">{success}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="relative mb-6">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
          <Search className="w-5 h-5" />
        </span>
        <input
          type="text"
          placeholder="Buscar por cliente, correo, celular o ID de orden..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-650 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-850 focus:ring-2 focus:ring-brand-primary outline-none transition-all text-sm"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-brand-primary animate-spin mb-3" />
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Cargando transacciones...</p>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-150 dark:border-gray-700 rounded-2xl">
          <ShoppingBag className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-base font-bold text-gray-600 dark:text-gray-300">No se encontraron transacciones</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {searchTerm ? 'Prueba cambiando los términos de búsqueda.' : 'No hay datos registrados en esta lista en este momento.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-750">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-850 text-gray-700 dark:text-gray-300 uppercase text-xxs font-bold tracking-wider border-b border-gray-100 dark:border-gray-750">
                <th className="py-3 px-4">Orden ID</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Plataforma</th>
                <th className="py-3 px-4">Monto</th>
                <th className="py-3 px-4">
                  {activeSubTab === 'approved' ? 'Fecha de Pago' : 'Fecha de Intento'}
                </th>
                {activeSubTab === 'pending' && <th className="py-3 px-4 text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-750">
              {filteredSales.map((sale) => (
                <tr
                  key={sale.orderId}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30 text-gray-900 dark:text-gray-100 transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-bold text-xs text-brand-primary">
                    {sale.orderId}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {sale.firstName} {sale.lastName}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {sale.whatsapp || 'Sin WhatsApp'}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {sale.email || 'Sin correo'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-xs text-gray-800 dark:text-gray-200">
                    {sale.platformName || 'N/A'}
                  </td>
                  <td className="py-3 px-4 font-bold text-xs">
                    <span className="flex items-center text-green-600 dark:text-green-400">
                      <DollarSign className="w-3.5 h-3.5" />
                      {(sale.amount || 0).toLocaleString('es-CO')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {activeSubTab === 'approved' ? formatDate(sale.approvedAt) : formatDate(sale.createdAt)}
                    </div>
                  </td>
                  {activeSubTab === 'pending' && (
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeletePending(sale.orderId)}
                        className="p-1.5 rounded-lg border border-red-100 hover:border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all active:scale-95"
                        title="Eliminar intento de pago"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
