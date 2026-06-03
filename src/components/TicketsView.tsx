import React, { useState, useEffect } from 'react';
import { MessageSquare, User, CheckCircle, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';

interface Ticket {
  userId: string;
  phone: string;
  nombre: string;
  state: string;
  lastHumanInteraction: number | null;
  agent: string | null;
  lastMessage: string;
  lastMessageTime: number | null;
}

export const TicketsView: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agentName, setAgentName] = useState(localStorage.getItem('ticket_agent_name') || '');

  const fetchTickets = (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError('');
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    fetch(`${apiUrl}/api/admin/tickets`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al obtener los tickets');
        return res.json();
      })
      .then((data) => {
        setTickets(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching tickets:', err);
        setError('No se pudo conectar con el bot. Asegúrate de que el backend esté encendido.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTickets(false);
    const interval = setInterval(() => fetchTickets(true), 15000); // Auto-refresh every 15s silently
    return () => clearInterval(interval);
  }, []);

  const handleAgentNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAgentName(val);
    localStorage.setItem('ticket_agent_name', val);
  };

  const handleClaim = async (phone: string) => {
    if (!agentName.trim()) {
      alert('Por favor escribe tu nombre de asesor antes de reclamar.');
      return;
    }
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/tickets/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, agent: agentName, password: 'admin123' })
      });
      const result = await res.json();
      if (result.success) {
        fetchTickets();
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (err) {
      alert('❌ Error al conectar con el backend.');
    }
  };

  const handleResolve = async (phone: string) => {
    const confirmRelease = window.confirm('¿Estás seguro de resolver este ticket? El bot volverá a responder automáticamente a este cliente.');
    if (!confirmRelease) return;

    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/tickets/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: 'admin123' })
      });
      const result = await res.json();
      if (result.success) {
        fetchTickets();
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (err) {
      alert('❌ Error al conectar con el backend.');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center dark:text-white">
            <MessageSquare className="mr-2 text-brand-primary" /> Tickets de Soporte Activos
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Clientes esperando atención humana (`waiting_human`). Reclama un ticket para evitar colisiones.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">Tu Nombre:</label>
          <input
            type="text"
            value={agentName}
            onChange={handleAgentNameChange}
            placeholder="Ej. Katherine"
            className="px-3 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
          />
          <button
            onClick={fetchTickets}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg transition-colors"
            title="Refrescar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-250 p-4 rounded-xl mb-6 border border-yellow-200 dark:border-yellow-900/50">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Cargando tickets de soporte...</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-750">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="font-bold text-gray-700 dark:text-gray-300">¡Bandeja Limpia!</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No hay clientes esperando soporte humano en este momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tickets.map((t) => {
            const timeDiff = t.lastMessageTime ? Math.round((Date.now() - t.lastMessageTime) / 60000) : null;
            const waLink = `https://web.whatsapp.com/send?phone=${t.phone}`;

            return (
              <div
                key={t.userId}
                className={`border rounded-2xl p-5 shadow-sm transition-all ${
                  t.agent
                    ? 'border-blue-200 bg-blue-50/10 dark:border-blue-900/30 dark:bg-blue-900/5'
                    : 'border-gray-200 bg-white dark:border-gray-750 dark:bg-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-lg text-gray-800 dark:text-white">{t.nombre || 'Cliente WhatsApp'}</h4>
                    <span className="text-sm font-mono text-gray-500 dark:text-gray-400">+{t.phone}</span>
                  </div>

                  {t.agent ? (
                    <span className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/50 text-blue-750 dark:text-blue-200 px-2.5 py-1 rounded-full text-xs font-bold">
                      <User className="w-3 h-3" /> Atendido por: {t.agent}
                    </span>
                  ) : (
                    <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse">
                      ⏳ Sin Asignar
                    </span>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl mb-4 border dark:border-gray-750">
                  <p className="text-xs text-gray-400 font-bold uppercase mb-1">Último Mensaje:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-350 italic line-clamp-3">
                    "{t.lastMessage || 'Mensaje de sistema / adjunto'}"
                  </p>
                  {timeDiff !== null && (
                    <p className="text-right text-[10px] text-gray-450 dark:text-gray-500 mt-2">
                      Hace {timeDiff} min{timeDiff > 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-brand-primary hover:underline"
                  >
                    Abrir Chat WA <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <div className="flex gap-2">
                    {!t.agent && (
                      <button
                        onClick={() => handleClaim(t.phone)}
                        className="bg-brand-primary hover:bg-brand-dark text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors"
                      >
                        Reclamar Ticket
                      </button>
                    )}
                    {t.agent && t.agent === agentName && (
                      <button
                        onClick={() => handleClaim(t.phone)}
                        className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-xs px-3.5 py-2 rounded-lg transition-colors"
                      >
                        Re-asignar
                      </button>
                    )}
                    <button
                      onClick={() => handleResolve(t.phone)}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Resolver
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
