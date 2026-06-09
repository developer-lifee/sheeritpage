import React, { useState, useEffect } from 'react';
import { RefreshCw, Play, Plus, Trash2, Key, Radio, Users, Copy, Check, Info } from 'lucide-react';

interface ActiveSession {
  ip: string;
  active: boolean;
  lastSeenSecondsAgo: number;
}

interface ActiveSessions {
  [token: string]: ActiveSession;
}

interface StreamingViewProps {
  adminPassword?: string;
}

export const StreamingView: React.FC<StreamingViewProps> = ({ adminPassword = 'admin123' }) => {
  const [tokens, setTokens] = useState<string[]>([]);
  const [sessions, setSessions] = useState<ActiveSessions>({});
  const [newToken, setNewToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const getApiUrl = () => {
    return window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
  };

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    const apiUrl = getApiUrl();

    try {
      // Fetch tokens
      const tokenRes = await fetch(`${apiUrl}/api/admin/streaming/tokens`);
      if (!tokenRes.ok) throw new Error('Error al obtener tokens de transmisión');
      const tokenData = await tokenRes.json();
      setTokens(Array.isArray(tokenData) ? tokenData : []);

      // Fetch active sessions
      const sessionRes = await fetch(`${apiUrl}/api/admin/streaming/sessions`);
      if (!sessionRes.ok) throw new Error('Error al obtener sesiones activas');
      const sessionData = await sessionRes.json();
      setSessions(sessionData || {});
    } catch (err: any) {
      console.error(err);
      setError('No se pudo conectar con el bot para obtener los datos de transmisión.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 10000); // silent reload every 10s
    return () => clearInterval(interval);
  }, []);

  const handleAddToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToken.trim()) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    const apiUrl = getApiUrl();

    try {
      const res = await fetch(`${apiUrl}/api/admin/streaming/tokens/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: newToken.trim(), password: adminPassword })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Token "${newToken.trim()}" agregado correctamente.`);
        setNewToken('');
        fetchData(true);
      } else {
        setError(data.message || 'Error al agregar el token.');
      }
    } catch (err) {
      setError('Error de conexión al agregar token.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteToken = async (token: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el token "${token}"? Se cortará la transmisión para quien lo use.`)) {
      return;
    }
    setActionLoading(true);
    setError('');
    setSuccess('');
    const apiUrl = getApiUrl();

    try {
      const res = await fetch(`${apiUrl}/api/admin/streaming/tokens/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: adminPassword })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Token "${token}" eliminado correctamente.`);
        fetchData(true);
      } else {
        setError(data.message || 'Error al eliminar el token.');
      }
    } catch (err) {
      setError('Error de conexión al eliminar token.');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (token: string) => {
    const playUrl = `http://bot.sheerit.com.co:8888/live/index.m3u8?token=${token}`;
    navigator.clipboard.writeText(playUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getStreamingServerUrl = () => {
    return 'rtmp://bot.sheerit.com.co/live';
  };

  const getStreamingKey = () => {
    return 'Gianmarco0504';
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border dark:border-gray-800 p-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b dark:border-gray-800 pb-5">
        <div>
          <h2 className="text-xl font-bold flex items-center dark:text-white gap-2">
            <Radio className="text-brand-primary animate-pulse" /> Servidor de Streaming (MediaMTX)
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Administra los tokens de acceso y visualiza el estado de la transmisión en tiempo real.
          </p>
        </div>

        <button
          onClick={() => fetchData()}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border dark:border-gray-700 self-end md:self-auto"
          title="Refrescar"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 p-4 rounded-xl mb-6 border border-red-100 dark:border-red-900/30">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 p-4 rounded-xl mb-6 border border-green-100 dark:border-green-900/30">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* OBS configuration details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-50 dark:bg-gray-850 p-5 rounded-2xl border dark:border-gray-750">
            <h3 className="font-bold text-sm text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
              <Play className="w-4 h-4 text-brand-primary" /> Datos para OBS Studio
            </h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Servidor (RTMP URL)</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getStreamingServerUrl()}
                    className="w-full bg-white dark:bg-gray-800 border dark:border-gray-700 p-2.5 rounded-lg font-mono dark:text-white select-all"
                  />
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Clave de Retransmisión</span>
                <input
                  type="text"
                  readOnly
                  value={getStreamingKey()}
                  className="w-full bg-white dark:bg-gray-800 border dark:border-gray-700 p-2.5 rounded-lg font-mono dark:text-white select-all"
                />
              </div>

              <div className="bg-blue-50/50 dark:bg-blue-950/10 p-3 rounded-lg border border-blue-100/30 flex gap-2 text-blue-800 dark:text-blue-300 text-[11px] leading-tight">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
                <p>
                  Transmite en <strong>OBS</strong> usando codificación x264/H.264, perfil <em>Main</em> o <em>Baseline</em>, y preset <em>Veryfast</em> o <em>Zerolatency</em> para la menor latencia posible (1-2s).
                </p>
              </div>
            </div>
          </div>

          {/* Add Token Form */}
          <div className="bg-gray-50 dark:bg-gray-850 p-5 rounded-2xl border dark:border-gray-750">
            <h3 className="font-bold text-sm text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand-primary" /> Crear Nuevo Token
            </h3>

            <form onSubmit={handleAddToken} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Identificador / Nombre cliente</label>
                <input
                  type="text"
                  required
                  placeholder="ej: cliente_hernandez"
                  value={newToken}
                  onChange={(e) => setNewToken(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border dark:border-gray-700 px-3 py-2 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading || !newToken.trim()}
                className="w-full bg-brand-primary hover:bg-brand-dark text-white font-bold text-xs py-2 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Generar y Autorizar
              </button>
            </form>
          </div>
        </div>

        {/* Tokens & active sessions list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-850 p-5 rounded-2xl border dark:border-gray-750">
            <h3 className="font-bold text-sm text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-brand-primary" /> Claves y Enlaces de Reproducción
            </h3>

            {loading ? (
              <div className="text-center py-8 text-sm text-gray-400">Cargando tokens de acceso...</div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400">No hay tokens de acceso creados. Genera uno al lado.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b dark:border-gray-700 text-gray-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="py-2.5">Token / Cliente</th>
                      <th className="py-2.5">Estado</th>
                      <th className="py-2.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokens.map((token) => {
                      const session = sessions[token];
                      const isActive = session && session.active;

                      return (
                        <tr key={token} className="border-b last:border-0 dark:border-gray-800">
                          <td className="py-3 font-mono font-bold dark:text-white">
                            {token}
                          </td>
                          <td className="py-3">
                            {isActive ? (
                              <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                                Transmitiendo ({session.ip})
                              </span>
                            ) : (
                              <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit">
                                Apagado / Libre
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => copyToClipboard(token)}
                                className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
                                  copiedToken === token
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/50'
                                    : 'hover:bg-gray-50 border-gray-200 dark:border-gray-700 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
                                }`}
                                title="Copiar enlace HLS de Smart TV"
                              >
                                {copiedToken === token ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" /> Copiado
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" /> Enlace
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handleDeleteToken(token)}
                                disabled={actionLoading}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg border border-transparent hover:border-red-100"
                                title="Eliminar token"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Sessions Panel */}
          <div className="bg-white dark:bg-gray-850 p-5 rounded-2xl border dark:border-gray-750">
            <h3 className="font-bold text-sm text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-primary" /> Visualizadores Conectados Activos
            </h3>

            {Object.keys(sessions).length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400">No hay dispositivos reproduciendo la transmisión actualmente.</div>
            ) : (
              <div className="space-y-3">
                {Object.entries(sessions).map(([token, session]) => {
                  if (!session.active) return null;
                  return (
                    <div
                      key={token}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border dark:border-gray-700 flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-bold font-mono dark:text-white">{token}</span>
                        <span className="block text-[10px] text-gray-400 mt-0.5">Dirección IP: {session.ip}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block">Última descarga de fragmento</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">Hace {session.lastSeenSecondsAgo} segundos</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
