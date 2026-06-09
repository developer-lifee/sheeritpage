import React, { useState, useEffect } from 'react';
import { MessageSquare, User, CheckCircle, RefreshCw, AlertTriangle, ExternalLink, Users, Columns, LogOut, Lock, Search } from 'lucide-react';

interface AccountInfo {
  streaming: string;
  correo: string;
  nombrePerfil: string;
}

interface Ticket {
  userId: string;
  phone: string;
  nombre: string;
  state: string;
  lastHumanInteraction: number | null;
  agent: string | null;
  lastMessage: string;
  lastMessageTime: number | null;
  waitingHumanMode?: 'bot' | 'advisor';
  accounts?: AccountInfo[];
  summary?: string;
}

interface TicketsViewProps {
  agentEmail: string;
  agentName: string;
  onLogout: () => void;
}

export const TicketsView: React.FC<TicketsViewProps> = ({ agentEmail, agentName, onLogout }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTickets = (isSilent = false) => {
    if (!agentEmail) return;
    if (!isSilent) setLoading(true);
    setError('');
    const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:3000' 
      : 'https://bot.sheerit.com.co';
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
    if (agentEmail) {
      fetchTickets(false);
      const interval = setInterval(() => fetchTickets(true), 10000); // Silent refresh
      return () => clearInterval(interval);
    }
  }, [agentEmail]);

  const handleClaim = async (phone: string, targetAgent: string) => {
    const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:3000' 
      : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/tickets/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, agent: targetAgent, password: 'admin123' })
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

  const handleResolve = async (phone: string, sharedCount = 0) => {
    let confirmMsg = '¿Estás seguro de resolver este ticket? El bot volverá a responder automáticamente a este cliente.';
    if (sharedCount > 0) {
      confirmMsg = `⚠️ ¡ATENCIÓN! Este usuario comparte cuenta con otros ${sharedCount} cliente(s) que tienen tickets abiertos. ¿Estás seguro de resolver este ticket? Se cerrarán en conjunto automáticamente.`;
    }
    const confirmRelease = window.confirm(confirmMsg);
    if (!confirmRelease) return;

    const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:3000' 
      : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/tickets/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: 'admin123' })
      });
      const result = await res.json();
      if (result.success) {
        fetchTickets();
        if (sharedCount > 0) {
          alert(`✅ Exito: ${result.message}`);
        }
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (err) {
      alert('❌ Error al conectar con el backend.');
    }
  };

  const findSharedTickets = (ticket: Ticket) => {
    if (!ticket.accounts || ticket.accounts.length === 0) return [];
    const ticketEmails = ticket.accounts.map(a => a.correo.toLowerCase().trim()).filter(Boolean);
    if (ticketEmails.length === 0) return [];

    return tickets.filter(t => {
      if (t.userId === ticket.userId) return false;
      if (!t.accounts) return false;
      return t.accounts.some(a => {
        const email = a.correo.toLowerCase().trim();
        return email && ticketEmails.includes(email);
      });
    });
  };

  // Safe names helper for null safety
  const safeAgentName = (agentName || '').toLowerCase().trim();

  // Search filter
  const filteredTickets = tickets.filter(t => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const nameMatches = t.nombre?.toLowerCase().includes(term);
    const phoneMatches = t.phone?.includes(term);
    const summaryMatches = t.summary?.toLowerCase().includes(term);
    const accountMatches = t.accounts?.some(acc =>
      acc.correo?.toLowerCase().includes(term) ||
      acc.streaming?.toLowerCase().includes(term)
    );
    return nameMatches || phoneMatches || summaryMatches || accountMatches;
  });

  // Filter columns
  const unassignedTickets = filteredTickets.filter(t => !t.agent);
  const myTickets = filteredTickets.filter(t => t.agent && t.agent.toLowerCase().trim() === safeAgentName);
  const otherTickets = filteredTickets.filter(t => t.agent && t.agent.toLowerCase().trim() !== safeAgentName);

  const renderTicketCard = (t: Ticket) => {
    const timeDiff = t.lastMessageTime ? Math.round((Date.now() - t.lastMessageTime) / 60000) : null;
    const waLink = `https://web.whatsapp.com/send?phone=${t.phone}`;
    const shared = findSharedTickets(t);
    const hasShared = shared.length > 0;
    const isBotMode = t.waitingHumanMode === 'bot';
    const cleanTicketAgent = (t.agent || '').toLowerCase().trim();

    return (
      <div
        key={t.userId}
        className={`bg-white dark:bg-gray-800 rounded-xl p-4 border transition-all duration-200 hover:shadow-md ${
          t.agent
            ? cleanTicketAgent === safeAgentName
              ? 'border-emerald-250 dark:border-emerald-900/50 shadow-emerald-50/10'
              : 'border-blue-200 dark:border-blue-900/40 shadow-blue-50/10'
            : 'border-amber-250 dark:border-amber-900/30 hover:border-amber-300'
        }`}
      >
        <div className="flex justify-between items-start mb-2.5">
          <div>
            <h4 className="font-bold text-sm text-gray-855 dark:text-white flex items-center gap-1.5">
              {t.nombre || 'Cliente WhatsApp'}
            </h4>
            <span className="text-xs font-mono text-gray-400 dark:text-gray-500">+{t.phone}</span>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            {/* Bot vs Advisor Mode Badge */}
            {isBotMode ? (
              <span className="bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase border border-purple-200/50 dark:border-purple-900/40">
                🤖 Auto (Bot)
              </span>
            ) : (
              <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase border border-blue-200/50 dark:border-blue-900/40">
                👤 Manual (Asesor)
              </span>
            )}

            {t.agent ? (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                cleanTicketAgent === safeAgentName
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                  : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
              }`}>
                <User className="w-2.5 h-2.5" /> {t.agent}
              </span>
            ) : (
              <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                ⏳ Sin Asignar
              </span>
            )}
          </div>
        </div>

        {/* Resumen de Solicitud del Ticket */}
        {t.summary && (
          <div className="mb-2 bg-blue-50/70 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/30">
            <p className="text-[9px] text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wider mb-0.5">Resumen de Solicitud:</p>
            <p className="text-xs font-semibold whitespace-pre-line leading-snug">{t.summary}</p>
          </div>
        )}

        {/* Cuentas vinculadas */}
        {t.accounts && t.accounts.length > 0 && (
          <div className="mb-2 bg-gray-50 dark:bg-gray-900/30 p-2 rounded-lg border border-gray-100 dark:border-gray-750">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Cuentas vinculadas:</p>
            <div className="flex flex-wrap gap-1.5">
              {t.accounts.map((acc, idx) => (
                <span
                  key={idx}
                  title={`${acc.correo} - Perfil: ${acc.nombrePerfil}`}
                  className="bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary text-[10px] font-medium px-2 py-0.5 rounded border border-brand-primary/20"
                >
                  📺 {acc.streaming} ({acc.correo.split('@')[0]})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Cuenta compartida */}
        {hasShared && (
          <div className="mb-3 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30 flex flex-col gap-1">
            <span className="text-[10px] font-extrabold uppercase flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-red-500" /> ¡Misma Cuenta Detectada!
            </span>
            <p className="text-[11px] leading-tight">
              Comparte cuenta con:
            </p>
            <div className="flex flex-col gap-0.5 pl-1.5 border-l-2 border-red-300 dark:border-red-800">
              {shared.map(s => (
                <span key={s.userId} className="text-[10px] font-mono">
                  • {s.nombre} (+{s.phone})
                </span>
              ))}
            </div>
            <span className="text-[9px] text-red-500 dark:text-red-400 font-semibold italic mt-1">
              * Resolver este ticket resolverá los demás en lote.
            </span>
          </div>
        )}

        {/* Último Mensaje */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-lg mb-3 border dark:border-gray-750">
          <p className="text-[9px] text-gray-450 font-bold uppercase tracking-wider mb-0.5">Último Mensaje:</p>
          <p className="text-xs text-gray-650 dark:text-gray-300 italic line-clamp-2">
            "{t.lastMessage || 'Mensaje de sistema / adjunto'}"
          </p>
          {timeDiff !== null && (
            <p className="text-right text-[9px] text-gray-400 dark:text-gray-500 mt-1">
              Hace {timeDiff} min{timeDiff > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-between gap-2 border-t dark:border-gray-750 pt-2.5 mt-2">
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-0.5 text-[11px] font-semibold text-brand-primary hover:underline"
          >
            Chat WA <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex gap-1">
            {!t.agent && (
              <button
                onClick={() => handleClaim(t.phone, agentName)}
                className="bg-brand-primary hover:bg-brand-dark text-white font-bold text-[10px] px-2.5 py-1.5 rounded-md transition-colors"
              >
                Reclamar
              </button>
            )}
            {t.agent && cleanTicketAgent !== safeAgentName && (
              <button
                onClick={() => handleClaim(t.phone, agentName)}
                className="bg-gray-150 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 font-bold text-[10px] px-2.5 py-1.5 rounded-md transition-colors"
              >
                Re-asignar
              </button>
            )}
            {t.agent && cleanTicketAgent === safeAgentName && (
              <button
                onClick={() => handleClaim(t.phone, '')}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-600 dark:text-gray-300 font-bold text-[10px] px-2.5 py-1.5 rounded-md transition-colors"
              >
                Liberar
              </button>
            )}
            <button
              onClick={() => handleResolve(t.phone, shared.length)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-0.5"
            >
              <CheckCircle className="w-3 h-3" /> Resolver
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border dark:border-gray-800 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b dark:border-gray-800 pb-5">
        <div>
          <h2 className="text-xl font-bold flex items-center dark:text-white gap-2">
            <Columns className="text-brand-primary" /> Tablero Kanban de Soporte
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Conectado como: <span className="font-bold text-gray-700 dark:text-gray-200">{agentName} ({agentEmail})</span>
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => fetchTickets()}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border dark:border-gray-700"
            title="Refrescar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onLogout}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors border border-red-100 dark:border-red-900/30 flex items-center gap-1 text-xs font-bold"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/25 text-yellow-800 dark:text-yellow-200 p-4 rounded-xl mb-6 border border-yellow-100 dark:border-yellow-900/30">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Search Bar */}
      {!loading && (tickets.length > 0 || searchTerm) && (
        <div className="relative mb-6 max-w-md shadow-sm rounded-xl">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono, cuenta o servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition-all duration-200"
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400 font-medium">Cargando tickets de soporte...</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border-2 border-dashed border-gray-250 dark:border-gray-800 max-w-xl mx-auto">
          <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
          <h3 className="font-bold text-gray-800 dark:text-gray-250 text-lg">¡Tablero al Día!</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
            Todos los clientes han sido atendidos y no hay tickets pendientes en este momento.
          </p>
        </div>
      ) : (
        /* Columns Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: Unassigned */}
          <div className="bg-amber-50/30 dark:bg-amber-950/5 rounded-xl p-4 border border-amber-100/50 dark:border-amber-950/20 flex flex-col min-h-[500px]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-amber-100 dark:border-amber-900/20">
              <h3 className="font-bold text-gray-700 dark:text-gray-250 flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> Sin Asignar
              </h3>
              <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                {unassignedTickets.length}
              </span>
            </div>
            
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[600px] pr-1">
              {unassignedTickets.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400 dark:text-gray-500 font-medium">
                  No hay tickets sin asignar
                </div>
              ) : (
                unassignedTickets.map(renderTicketCard)
              )}
            </div>
          </div>

          {/* Column 2: Assigned to Me */}
          <div className="bg-emerald-50/20 dark:bg-emerald-950/5 rounded-xl p-4 border border-emerald-100/50 dark:border-emerald-950/20 flex flex-col min-h-[500px]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-emerald-100 dark:border-emerald-900/20">
              <h3 className="font-bold text-gray-700 dark:text-gray-250 flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> Mis Asignaciones
              </h3>
              <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                {myTickets.length}
              </span>
            </div>
            
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[600px] pr-1">
              {myTickets.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400 dark:text-gray-500 font-medium">
                  No tienes tickets asignados
                </div>
              ) : (
                myTickets.map(renderTicketCard)
              )}
            </div>
          </div>

          {/* Column 3: Assigned to Others */}
          <div className="bg-blue-50/20 dark:bg-blue-950/5 rounded-xl p-4 border border-blue-100/50 dark:border-blue-950/20 flex flex-col min-h-[500px]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-blue-100 dark:border-blue-900/20">
              <h3 className="font-bold text-gray-700 dark:text-gray-250 flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span> Otros Asesores
              </h3>
              <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                {otherTickets.length}
              </span>
            </div>
            
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[600px] pr-1">
              {otherTickets.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400 dark:text-gray-500 font-medium">
                  No hay tickets asignados a otros
                </div>
              ) : (
                otherTickets.map(renderTicketCard)
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
