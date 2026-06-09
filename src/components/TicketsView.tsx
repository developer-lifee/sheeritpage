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

  // Drag and drop state
  const [draggedPhone, setDraggedPhone] = useState<string | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<'unassigned' | 'me' | 'other' | null>(null);

  // Custom resolve dialog state
  const [resolveDialog, setResolveDialog] = useState<{
    phone: string;
    nombre: string;
    sharedTickets: { ticket: Ticket; matchingAccounts: AccountInfo[] }[];
  } | null>(null);


  // Custom assign dialog state
  const [assignDialog, setAssignDialog] = useState<{
    phone: string;
  } | null>(null);

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

  const handleDragStart = (e: React.DragEvent, phone: string) => {
    e.dataTransfer.setData('text/plain', phone);
    setDraggedPhone(phone);
  };

  const handleDragOver = (e: React.DragEvent, column: 'unassigned' | 'me' | 'other') => {
    e.preventDefault();
    setDraggedOverColumn(column);
  };

  const handleDrop = async (e: React.DragEvent, targetColumn: 'unassigned' | 'me' | 'other') => {
    e.preventDefault();
    setDraggedOverColumn(null);
    const phone = e.dataTransfer.getData('text/plain') || draggedPhone;
    setDraggedPhone(null);
    if (!phone) return;

    if (targetColumn === 'unassigned') {
      // Optimistic update
      setTickets(prev => prev.map(t => t.phone === phone ? { ...t, agent: null } : t));
      await executeClaim(phone, '');
    } else if (targetColumn === 'me') {
      // Optimistic update
      setTickets(prev => prev.map(t => t.phone === phone ? { ...t, agent: agentName } : t));
      await executeClaim(phone, agentName);
    } else if (targetColumn === 'other') {
      setAssignDialog({ phone });
    }
  };

  const executeClaim = async (phone: string, targetAgent: string) => {
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
      if (!result.success) {
        alert(`❌ Error: ${result.message}`);
      }
      fetchTickets(true); // Silent reload to sync with backend
    } catch (err) {
      alert('❌ Error al conectar con el backend.');
      fetchTickets(true);
    }
  };

  const handleClaim = (phone: string, targetAgent: string) => {
    setTickets(prev => prev.map(t => t.phone === phone ? { ...t, agent: targetAgent || null } : t));
    executeClaim(phone, targetAgent);
  };

  const handleResolveClick = (t: Ticket) => {
    const sharedWithDetails = findSharedTicketsWithDetails(t);
    if (sharedWithDetails.length > 0) {
      setResolveDialog({
        phone: t.phone,
        nombre: t.nombre || 'Cliente WhatsApp',
        sharedTickets: sharedWithDetails
      });
    } else {
      if (window.confirm(`¿Estás seguro de resolver el ticket de ${t.nombre || t.phone}?`)) {
        executeResolve(t.phone, false);
      }
    }
  };

  const executeResolve = async (phone: string, resolveAll: boolean) => {
    setResolveDialog(null);
    
    // Optimistic update
    if (resolveAll) {
      const targetTicket = tickets.find(t => t.phone === phone);
      if (targetTicket) {
        const sharedWithDetails = findSharedTicketsWithDetails(targetTicket);
        const phonesToRemove = [phone, ...sharedWithDetails.map(s => s.ticket.phone)];
        setTickets(prev => prev.filter(t => !phonesToRemove.includes(t.phone)));
      }
    } else {
      setTickets(prev => prev.filter(t => t.phone !== phone));
    }

    const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:3000' 
      : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/tickets/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: 'admin123', resolveAll })
      });
      const result = await res.json();
      if (!result.success) {
        alert(`❌ Error: ${result.message}`);
      }
      fetchTickets(true); // Silent sync
    } catch (err) {
      alert('❌ Error al conectar con el backend.');
      fetchTickets(true);
    }
  };

  const findSharedTicketsWithDetails = (ticket: Ticket) => {
    if (!ticket.accounts || ticket.accounts.length === 0) return [];
    const ticketEmails = ticket.accounts.map(a => a.correo.toLowerCase().trim()).filter(Boolean);
    if (ticketEmails.length === 0) return [];

    return tickets
      .filter(t => t.userId !== ticket.userId)
      .map(t => {
        if (!t.accounts) return null;
        const matchingAccounts = t.accounts.filter(a => {
          const email = a.correo.toLowerCase().trim();
          return email && ticketEmails.includes(email);
        });
        if (matchingAccounts.length === 0) return null;
        return {
          ticket: t,
          matchingAccounts
        };
      })
      .filter(Boolean) as { ticket: Ticket; matchingAccounts: AccountInfo[] }[];
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
    const sharedWithDetails = findSharedTicketsWithDetails(t);
    const hasShared = sharedWithDetails.length > 0;
    const isBotMode = t.waitingHumanMode === 'bot';
    const cleanTicketAgent = (t.agent || '').toLowerCase().trim();

    return (
      <div
        key={t.userId}
        draggable
        onDragStart={(e) => handleDragStart(e, t.phone)}
        className={`bg-white dark:bg-gray-800 rounded-xl p-4 border transition-all duration-200 hover:shadow-md cursor-grab active:cursor-grabbing ${
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
            <div className="flex flex-col gap-1.5 pl-1.5 border-l-2 border-red-300 dark:border-red-800">
              {sharedWithDetails.map(({ ticket: s, matchingAccounts }) => (
                <div key={s.userId} className="text-[10px]">
                  <span className="font-bold">• {s.nombre} (+{s.phone})</span>
                  <div className="flex flex-wrap gap-1 mt-0.5 pl-2">
                    {matchingAccounts.map((acc, idx) => (
                      <span key={idx} className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200 text-[8px] font-mono px-1.5 py-0.2 rounded border border-red-200 dark:border-red-800/40">
                        📺 {acc.streaming}: {acc.correo}
                      </span>
                    ))}
                  </div>
                  {s.summary && (
                    <p className="text-[9px] text-gray-500 dark:text-gray-400 italic pl-2 mt-0.5">
                      Motivo: {s.summary}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <span className="text-[9px] text-red-500 dark:text-red-400 font-semibold italic mt-1">
              * Puedes elegir resolverlos en lote o por separado.
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
                type="button"
                onClick={() => handleClaim(t.phone, agentName)}
                className="bg-brand-primary hover:bg-brand-dark text-white font-bold text-[10px] px-2.5 py-1.5 rounded-md transition-colors"
              >
                Reclamar
              </button>
            )}
            {t.agent && cleanTicketAgent !== safeAgentName && (
              <button
                type="button"
                onClick={() => handleClaim(t.phone, agentName)}
                className="bg-gray-150 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 font-bold text-[10px] px-2.5 py-1.5 rounded-md transition-colors"
              >
                Re-asignar
              </button>
            )}
            {t.agent && cleanTicketAgent === safeAgentName && (
              <button
                type="button"
                onClick={() => handleClaim(t.phone, '')}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-600 dark:text-gray-300 font-bold text-[10px] px-2.5 py-1.5 rounded-md transition-colors"
              >
                Liberar
              </button>
            )}
            <button
              type="button"
              onClick={() => handleResolveClick(t)}
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
          <div 
            onDragOver={(e) => handleDragOver(e, 'unassigned')}
            onDragLeave={() => setDraggedOverColumn(null)}
            onDrop={(e) => handleDrop(e, 'unassigned')}
            className={`bg-amber-50/30 dark:bg-amber-950/5 rounded-xl p-4 border border-amber-100/50 dark:border-amber-950/20 flex flex-col min-h-[500px] transition-all duration-200 ${
              draggedOverColumn === 'unassigned' ? 'ring-2 ring-amber-500/50 bg-amber-100/10 dark:bg-amber-950/15 scale-[1.01]' : ''
            }`}
          >
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
                  No hay tickets sin asignar o suelta uno aquí
                </div>
              ) : (
                unassignedTickets.map(renderTicketCard)
              )}
            </div>
          </div>

          {/* Column 2: Assigned to Me */}
          <div 
            onDragOver={(e) => handleDragOver(e, 'me')}
            onDragLeave={() => setDraggedOverColumn(null)}
            onDrop={(e) => handleDrop(e, 'me')}
            className={`bg-emerald-50/20 dark:bg-emerald-950/5 rounded-xl p-4 border border-emerald-100/50 dark:border-emerald-950/20 flex flex-col min-h-[500px] transition-all duration-200 ${
              draggedOverColumn === 'me' ? 'ring-2 ring-emerald-500/50 bg-emerald-100/10 dark:bg-emerald-950/15 scale-[1.01]' : ''
            }`}
          >
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
                  No tienes tickets asignados o arrastra uno aquí
                </div>
              ) : (
                myTickets.map(renderTicketCard)
              )}
            </div>
          </div>

          {/* Column 3: Assigned to Others */}
          <div 
            onDragOver={(e) => handleDragOver(e, 'other')}
            onDragLeave={() => setDraggedOverColumn(null)}
            onDrop={(e) => handleDrop(e, 'other')}
            className={`bg-blue-50/20 dark:bg-blue-950/5 rounded-xl p-4 border border-blue-100/50 dark:border-blue-950/20 flex flex-col min-h-[500px] transition-all duration-200 ${
              draggedOverColumn === 'other' ? 'ring-2 ring-blue-500/50 bg-blue-100/10 dark:bg-blue-950/15 scale-[1.01]' : ''
            }`}
          >
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

      {/* Custom Resolve Dialog Modal */}
      {resolveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border dark:border-gray-750">
            <h3 className="text-lg font-bold text-gray-950 dark:text-white mb-2 flex items-center gap-1.5">
              ⚠️ Resolver Ticket en Lote
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              El cliente <strong>{resolveDialog.nombre}</strong> comparte cuenta con los siguientes clientes que también tienen tickets de soporte abiertos:
            </p>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-4 max-h-60 overflow-y-auto border dark:border-gray-750 flex flex-col gap-3">
              {resolveDialog.sharedTickets.map(({ ticket: s, matchingAccounts }) => (
                <div key={s.userId} className="text-xs pb-3 border-b last:border-0 last:pb-0 border-gray-150 dark:border-gray-800 flex flex-col gap-1 dark:text-gray-305">
                  <div className="flex justify-between items-center font-bold">
                    <span>👤 {s.nombre || 'Cliente WhatsApp'}</span>
                    <span className="font-mono text-gray-400">+{s.phone}</span>
                  </div>
                  
                  {/* Shared account details */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold mr-1">Cuentas compartidas:</span>
                    {matchingAccounts.map((acc, idx) => (
                      <span key={idx} className="bg-red-55 dark:bg-red-950 text-red-700 dark:text-red-300 text-[10px] px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900/30">
                        📺 {acc.streaming} ({acc.correo})
                      </span>
                    ))}
                  </div>

                  {/* Summary/Reason of ticket */}
                  {s.summary && (
                    <div className="mt-1 bg-gray-100 dark:bg-gray-800 p-2 rounded text-[11px] text-gray-600 dark:text-gray-400 italic">
                      <strong>Motivo:</strong> {s.summary}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-6 font-medium bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/20">
              💡 <strong>Nota:</strong> A veces la falla es individual (solo le falla a una persona la cuenta). Compara los motivos/resúmenes de arriba antes de decidir si los resuelves en lote o de forma individual.
            </p>
            
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => executeResolve(resolveDialog.phone, false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all"
              >
                Resolver SOLO el de {resolveDialog.nombre}
              </button>
              <button
                type="button"
                onClick={() => executeResolve(resolveDialog.phone, true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all"
              >
                Resolver TODOS en Lote
              </button>
              <button
                type="button"
                onClick={() => setResolveDialog(null)}
                className="w-full bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-650 hover:bg-gray-200 text-gray-750 dark:text-gray-200 font-bold py-2.5 rounded-xl text-sm transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Assign Dialog Modal */}
      {assignDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl border dark:border-gray-750">
            <h3 className="text-lg font-bold text-gray-950 dark:text-white mb-4 flex items-center gap-1.5">
              👤 Asignar Ticket a Asesor
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
              Selecciona el asesor al que deseas asignar este ticket:
            </p>
            
            <div className="space-y-2 mb-6">
              {['Camilo', 'Esclepiades', 'Esteban'].map(advisor => {
                const isCurrent = advisor.toLowerCase() === agentName.toLowerCase();
                return (
                  <button
                    type="button"
                    key={advisor}
                    onClick={async () => {
                      const phone = assignDialog.phone;
                      setAssignDialog(null);
                      setTickets(prev => prev.map(t => t.phone === phone ? { ...t, agent: advisor } : t));
                      await executeClaim(phone, advisor);
                    }}
                    className="w-full text-left bg-gray-50 dark:bg-gray-900/40 hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 hover:text-brand-primary p-3 rounded-xl border dark:border-gray-750 flex justify-between items-center text-sm font-semibold transition-all dark:text-white"
                  >
                    <span>{advisor} {isCurrent && '(Tú)'}</span>
                    <span className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-350 px-2 py-0.5 rounded-full font-bold">Asesor</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setAssignDialog(null)}
              className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-650 text-gray-750 dark:text-gray-200 font-bold py-2.5 rounded-xl text-sm transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


