import React, { useState } from 'react';
import { Database, AlertTriangle, CheckCircle } from 'lucide-react';

export const InventoryAccountsView: React.FC = () => {
  const [invStreaming, setInvStreaming] = useState('Netflix');
  const [invCorreo, setInvCorreo] = useState('');
  const [invClave, setInvClave] = useState('');
  const [invPerfiles, setInvPerfiles] = useState(5);
  const [invLoading, setInvLoading] = useState(false);
  const [invError, setInvError] = useState('');
  const [invSuccess, setInvSuccess] = useState('');

  const handleAddInventoryAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invCorreo.trim() || !invClave.trim()) {
      setInvError('El correo y la contraseña son obligatorios.');
      return;
    }
    setInvLoading(true);
    setInvError('');
    setInvSuccess('');

    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
    try {
      const res = await fetch(`${apiUrl}/api/admin/accounts/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streaming: invStreaming,
          correo: invCorreo,
          contraseña: invClave,
          perfiles: invPerfiles,
          password: 'admin123'
        })
      });
      const result = await res.json();
      if (result.success) {
        setInvSuccess(result.message);
        setInvCorreo('');
        setInvClave('');
      } else {
        setInvError(`❌ Error: ${result.message}`);
      }
    } catch (err) {
      setInvError('❌ Error de comunicación con el backend.');
    } finally {
      setInvLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6 animate-fadeIn">
      <h3 className="text-lg font-bold flex items-center mb-4 dark:text-white">
        <Database className="mr-2 text-brand-primary" /> Agregar Cuentas al Inventario (Excel)
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
        Esto creará múltiples filas vacías en tu inventario de Excel con el correo y contraseña provistos, permitiendo que el bot asigne perfiles ("libre") a los clientes automáticamente.
      </p>

      {invError && (
        <div className="flex items-center bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 rounded-xl mb-6 border border-red-200 dark:border-red-900/50">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p className="text-sm">{invError}</p>
        </div>
      )}

      {invSuccess && (
        <div className="flex items-center bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-4 rounded-xl mb-6 border border-green-200 dark:border-green-900/50">
          <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p className="text-sm">{invSuccess}</p>
        </div>
      )}

      <form onSubmit={handleAddInventoryAccount} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Streaming / Plataforma</label>
          <select
            value={invStreaming}
            onChange={(e) => setInvStreaming(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white text-sm"
          >
            <option value="Netflix">Netflix</option>
            <option value="Disney+">Disney+</option>
            <option value="Max (HBO)">Max (HBO)</option>
            <option value="Prime Video">Prime Video</option>
            <option value="Spotify">Spotify</option>
            <option value="YouTube">YouTube</option>
            <option value="Paramount+">Paramount+</option>
            <option value="Crunchyroll">Crunchyroll</option>
            <option value="Gamepass">Gamepass</option>
            <option value="ViX">ViX</option>
            <option value="ChatGPT (GPT)">ChatGPT (GPT)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Correo de la Cuenta</label>
          <input
            type="email"
            value={invCorreo}
            onChange={(e) => setInvCorreo(e.target.value)}
            placeholder="correo@cuentacompartida.com"
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Contraseña de la Cuenta</label>
          <input
            type="text"
            value={invClave}
            onChange={(e) => setInvClave(e.target.value)}
            placeholder="Contraseña123"
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white text-sm"
            required
          />
        </div>
        <div className="flex gap-4 items-end">
          <div className="flex-grow">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Perfiles (Cantidad de Filas)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={invPerfiles}
              onChange={(e) => setInvPerfiles(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={invLoading}
            className="bg-brand-primary hover:bg-brand-dark text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {invLoading ? 'Registrando...' : 'Registrar Stock'}
          </button>
        </div>
      </form>
    </div>
  );
};
