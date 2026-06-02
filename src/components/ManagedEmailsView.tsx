import React, { useState, useEffect } from 'react';
import { Mail, Search, Trash2, PlusCircle, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

export const ManagedEmailsView: React.FC = () => {
  const [emails, setEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEmails = () => {
    setLoading(true);
    setError('');
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    fetch(`${apiUrl}/api/admin/managed-emails`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al obtener los correos');
        return res.json();
      })
      .then((data) => {
        setEmails(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching managed emails:', err);
        setError('No se pudo conectar al backend para listar los correos.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setActionLoading(true);
    setError('');
    setSuccess('');

    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/managed-emails/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: 'admin123' })
      });
      const result = await res.json();
      if (result.success) {
        setSuccess('Correo agregado con éxito.');
        setNewEmail('');
        fetchEmails();
      } else {
        setError(`❌ Error: ${result.message}`);
      }
    } catch (err) {
      setError('❌ Error de comunicación con el bot.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEmail = async (emailToDelete: string) => {
    const confirmDelete = window.confirm(`¿Estás seguro de eliminar el correo ${emailToDelete}?`);
    if (!confirmDelete) return;

    setError('');
    setSuccess('');

    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/managed-emails/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToDelete, password: 'admin123' })
      });
      const result = await res.json();
      if (result.success) {
        setSuccess('Correo eliminado con éxito.');
        fetchEmails();
      } else {
        setError(`❌ Error: ${result.message}`);
      }
    } catch (err) {
      setError('❌ Error de conexión al eliminar el correo.');
    }
  };

  const filteredEmails = emails.filter((email) =>
    email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Email List Dashboard */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center dark:text-white">
              <Mail className="mr-2 text-brand-primary" /> Correos Gestionados
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Listado de cuentas autorizadas en el sistema (`managed_emails.json`).
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-450" />
              <input
                type="text"
                placeholder="Buscar correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm w-full"
              />
            </div>
            <button
              onClick={fetchEmails}
              className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg transition-colors"
              title="Refrescar"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 rounded-xl mb-6 border border-red-200 dark:border-red-900/50">
            <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-4 rounded-xl mb-6 border border-green-200 dark:border-green-900/50">
            <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <p className="text-sm">{success}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">Cargando correos...</div>
        ) : filteredEmails.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-750">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-bold text-gray-700 dark:text-gray-300">No se encontraron correos</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {searchTerm ? 'Ningún correo coincide con tu búsqueda.' : 'Agrega tu primer correo autorizado en el panel de la derecha.'}
            </p>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto border border-gray-150 dark:border-gray-750 rounded-xl divide-y divide-gray-150 dark:divide-gray-750">
            {filteredEmails.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between p-3.5 hover:bg-gray-50 dark:hover:bg-gray-750/30 transition-all"
              >
                <span className="text-sm font-medium text-gray-800 dark:text-white truncate pr-4">
                  {email}
                </span>
                <button
                  onClick={() => handleDeleteEmail(email)}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all flex-shrink-0"
                  title="Eliminar Correo"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Email Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6 self-start">
        <h3 className="text-lg font-bold flex items-center mb-4 dark:text-white">
          <PlusCircle className="mr-2 text-brand-primary" /> Registrar Correo
        </h3>
        <form onSubmit={handleAddEmail} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Correo Electrónico</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="correo@sheerit.com"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={actionLoading}
            className="w-full bg-brand-primary hover:bg-brand-dark text-white font-bold text-sm py-2 rounded-xl transition-all disabled:opacity-50"
          >
            {actionLoading ? 'Agregando...' : 'Agregar Correo'}
          </button>
        </form>
      </div>
    </div>
  );
};
