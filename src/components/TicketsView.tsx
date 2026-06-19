import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, User, CheckCircle, RefreshCw, AlertTriangle, ExternalLink, Users, Columns, LogOut, Lock, Search, Send, Smile, Key, Home, ArrowLeft, ShieldAlert, Bot, Unlock } from 'lucide-react';

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
  queuePosition?: number | null;
}

interface TicketsViewProps {
  agentEmail: string;
  agentName: string;
  onLogout: () => void;
}

interface ChatMessage {
  id: string | null;
  body: string;
  fromMe: boolean;
  timestamp: number;
  type: string;
  hasMedia: boolean;
}

const COMMON_EMOJIS = ['🦈', '🟦', '🍃'];

const detectClaudeLink = (text: string | null) => {
  if (!text) return null;
  const match = text.match(/https?:\/\/(?:www\.)?(?:claude\.ai|anthropic\.com|mail\.anthropic\.com)[^\s<>"']+/i);
  return match ? match[0] : null;
};

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

  // LIVE CHAT STATE
  const [activeChatTicket, setActiveChatTicket] = useState<Ticket | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [newMsgText, setNewMsgText] = useState('');
  const [advisorEmoji, setAdvisorEmoji] = useState(() => {
    const stored = localStorage.getItem('advisor_emoji');
    if (stored && ['🦈', '🟦', '🍃'].includes(stored)) return stored;
    
    const lower = (agentEmail || '').toLowerCase();
    if (lower.includes('camilo')) return '🦈';
    if (lower.includes('estebanavila182')) return '🟦';
    if (lower.includes('esclepiades') || lower.includes('esclapiades') || lower.includes('escle') || lower.includes('escla')) return '🍃';
    return '🦈'; // default fallback
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'grouped_accounts' | 'grouped_subjects'>('kanban');

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Poll for tickets
  useEffect(() => {
    if (agentEmail) {
      fetchTickets(false);
      const interval = setInterval(() => fetchTickets(true), 10000);
      return () => clearInterval(interval);
    }
  }, [agentEmail]);

  // Poll chat messages if a chat is active
  useEffect(() => {
    if (!activeChatTicket) return;
    
    fetchChatMessages(true);
    const interval = setInterval(() => fetchChatMessages(true), 4000);
    return () => clearInterval(interval);
  }, [activeChatTicket?.phone]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchChatMessages = async (isSilent = false) => {
    if (!activeChatTicket) return;
    if (!isSilent) setLoadingChat(true);
    const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:3000' 
      : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/chat-messages?phone=${activeChatTicket.phone}`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data);
      }
    } catch (e) {
      console.error("Error fetching chat messages:", e);
    } finally {
      if (!isSilent) setLoadingChat(false);
    }
  };

  const handleSendChatMessage = async (textToSend = newMsgText) => {
    if (!activeChatTicket || !textToSend.trim()) return;
    const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:3000' 
      : 'https://bot.sheerit.com.co';
    
    try {
      const res = await fetch(`${apiUrl}/api/admin/chat-messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: activeChatTicket.phone,
          message: textToSend,
          emoji: advisorEmoji,
          agentName: agentName,
          password: 'admin123'
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewMsgText('');
        fetchChatMessages(true);
        // auto-assign to me if unassigned
        if (!activeChatTicket.agent) {
          setActiveChatTicket(prev => prev ? { ...prev, agent: agentName } : null);
        }
        fetchTickets(true);
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("Error de conexión al enviar mensaje");
    }
  };



  const sendHogarNetflixTemplate = () => {
    if (!activeChatTicket) return;
    const text = `🤖 Para actualizar tu hogar de Netflix, abre este enlace desde tu celular o TV:\n👉 https://sheerit.com.co/verificar?tel=${activeChatTicket.phone}`;
    setNewMsgText(prev => (prev ? prev + "\n" + text : text));
  };

  const insertCredentials = (acc: AccountInfo | null) => {
    if (!activeChatTicket) return;
    let text = `🤖 *Tus credenciales de ingreso de Sheerit Store* 🔑:\n\n`;
    if (acc) {
      text += `📺 Plataforma: *${acc.streaming}*\n📧 Correo: \`${acc.correo}\`\n👤 Perfil: *${acc.nombrePerfil}*\n\n`;
    } else if (activeChatTicket.accounts) {
      activeChatTicket.accounts.forEach(a => {
        text += `📺 Plataforma: *${a.streaming}*\n📧 Correo: \`${a.correo}\`\n👤 Perfil: *${a.nombrePerfil}*\n\n`;
      });
    }
    text += `_Por favor, ingresa con estos datos. Si te pide un código de verificación, escríbeme aquí la palabra *codigo*._`;
    setNewMsgText(prev => (prev ? prev + "\n" + text : text));
  };

  const insertCobroTemplate = () => {
    if (!activeChatTicket) return;
    const text = `🤖 *Recordatorio de Pago / Renovación Sheerit Store* 💰\n\nPor favor realiza tu transferencia usando nuestra *Llave Bre-V:* \`0087387259\` (RECOMENDADO: entrega inmediata ⚡)\n\nValor: $`;
    setNewMsgText(prev => (prev ? prev + "\n" + text : text));
  };

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
      setTickets(prev => prev.map(t => t.phone === phone ? { ...t, agent: null } : t));
      await executeClaim(phone, '');
    } else if (targetColumn === 'me') {
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
      fetchTickets(true);
    } catch (err) {
      alert('❌ Error al conectar con el backend.');
      fetchTickets(true);
    }
  };

  const handleToggleMode = async (phone: string, currentMode: 'bot' | 'advisor') => {
    const nextMode = currentMode === 'bot' ? 'advisor' : 'bot';
    setTickets(prev => prev.map(t => t.phone === phone ? { ...t, waitingHumanMode: nextMode } : t));
    if (activeChatTicket && activeChatTicket.phone === phone) {
      setActiveChatTicket(prev => prev ? { ...prev, waitingHumanMode: nextMode } : null);
    }
    
    const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:3000' 
      : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/tickets/update-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, mode: nextMode, password: 'admin123' })
      });
      const result = await res.json();
      if (!result.success) {
        alert(`❌ Error: ${result.message}`);
      }
      fetchTickets(true);
    } catch (err) {
      alert('❌ Error al cambiar el modo.');
      fetchTickets(true);
    }
  };

  const handleReleaseBot = async (phone: string) => {
    if (activeChatTicket && activeChatTicket.phone === phone) {
      setActiveChatTicket(null);
    }
    setTickets(prev => prev.filter(t => t.phone !== phone));
    
    const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:3000' 
      : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/tickets/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: 'admin123' })
      });
      const result = await res.json();
      if (!result.success) {
        alert(`❌ Error: ${result.message}`);
      }
      fetchTickets(true);
    } catch (err) {
      alert('❌ Error al liberar el bot.');
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
      fetchTickets(true);
      if (activeChatTicket && activeChatTicket.phone === phone) {
        setActiveChatTicket(null);
      }
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

  const changeEmoji = (em: string) => {
    setAdvisorEmoji(em);
    localStorage.setItem('advisor_emoji', em);
    setShowEmojiPicker(false);
  };

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

  // Grouping by accounts (Streaming - Correo)
  const getGroupedByAccounts = () => {
    const groups: { [key: string]: Ticket[] } = {};
    
    filteredTickets.forEach(t => {
      if (t.accounts && t.accounts.length > 0) {
        t.accounts.forEach(acc => {
          const key = `${acc.streaming} - ${acc.correo}`;
          if (!groups[key]) groups[key] = [];
          if (!groups[key].some(existing => existing.userId === t.userId)) {
            groups[key].push(t);
          }
        });
      } else {
        const key = 'Sin Cuenta Vinculada';
        if (!groups[key]) groups[key] = [];
        groups[key].push(t);
      }
    });
    
    return groups;
  };

  // Grouping by subjects
  const getGroupedBySubjects = () => {
    const groups: { [key: string]: Ticket[] } = {
      'Validar Renovaciones / Pagos': [],
      'Solicitud de Código (2FA / Hogar)': [],
      'Soporte Técnico / Fallas': [],
      'Interés en Compra / Ventas': [],
      'Otros': []
    };

    filteredTickets.forEach(t => {
      const summaryText = (t.summary || '').toLowerCase();
      const lastMsgText = (t.lastMessage || '').toLowerCase();
      const stateStr = t.state;

      const isRenewalPayment = stateStr === 'awaiting_payment_confirmation' || 
                               summaryText.includes('pago') || 
                               summaryText.includes('renov') || 
                               lastMsgText.includes('pago') || 
                               lastMsgText.includes('comprobante') || 
                               lastMsgText.includes('transf');

      const isCodeRequest = summaryText.includes('codigo') || 
                            summaryText.includes('código') || 
                            summaryText.includes('hogar') || 
                            summaryText.includes('token') || 
                            summaryText.includes('2fa') ||
                            lastMsgText.includes('codigo') || 
                            lastMsgText.includes('código') || 
                            lastMsgText.includes('hogar') || 
                            lastMsgText.includes('token');

      const isSupport = summaryText.includes('soporte') || 
                        summaryText.includes('falla') || 
                        summaryText.includes('error') || 
                        summaryText.includes('caido') || 
                        summaryText.includes('caída') || 
                        summaryText.includes('problema') ||
                        lastMsgText.includes('falla') || 
                        lastMsgText.includes('error') || 
                        lastMsgText.includes('no funciona') || 
                        lastMsgText.includes('pantalla');

      const isPurchase = summaryText.includes('interés') || 
                         summaryText.includes('compra') || 
                         summaryText.includes('ventas') || 
                         summaryText.includes('adquirir') ||
                         lastMsgText.includes('precio') || 
                         lastMsgText.includes('comprar') || 
                         lastMsgText.includes('vender');

      if (isRenewalPayment) {
        groups['Validar Renovaciones / Pagos'].push(t);
      } else if (isCodeRequest) {
        groups['Solicitud de Código (2FA / Hogar)'].push(t);
      } else if (isSupport) {
        groups['Soporte Técnico / Fallas'].push(t);
      } else if (isPurchase) {
        groups['Interés en Compra / Ventas'].push(t);
      } else {
        groups['Otros'].push(t);
      }
    });

    const activeGroups: { [key: string]: Ticket[] } = {};
    for (const [key, val] of Object.entries(groups)) {
      if (val.length > 0) {
        activeGroups[key] = val;
      }
    }
    return activeGroups;
  };

  const formatTimeDiff = (timestamp: number | null) => {
    if (!timestamp) return null;
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min${diffMins > 1 ? 's' : ''}`;
    
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    if (diffHours < 24) {
      return `Hace ${diffHours} hr${diffHours > 1 ? 's' : ''}${remainingMins > 0 ? ` y ${remainingMins} min${remainingMins > 1 ? 's' : ''}` : ''}`;
    }
    
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}${remainingHours > 0 ? ` y ${remainingHours} hr${remainingHours > 1 ? 's' : ''}` : ''}`;
  };

  const renderTicketCard = (t: Ticket) => {
    const timeFormatted = formatTimeDiff(t.lastMessageTime);
    const sharedWithDetails = findSharedTicketsWithDetails(t);
    const hasShared = sharedWithDetails.length > 0;
    const isBotMode = t.waitingHumanMode === 'bot';
    const cleanTicketAgent = (t.agent || '').toLowerCase().trim();

    return (
      <div
        key={t.userId}
        draggable
        onDragStart={(e) => handleDragStart(e, t.phone)}
        onClick={() => {
          setActiveChatTicket(t);
        }}
        className={`bg-white dark:bg-gray-800 rounded-xl p-4 border transition-all duration-200 hover:shadow-md cursor-pointer ${
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
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-mono text-gray-400 dark:text-gray-500">+{t.phone}</span>
              {t.queuePosition !== undefined && t.queuePosition !== null && (
                <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold px-1.5 py-0.2 rounded border border-amber-200/50 dark:border-amber-900/40 shadow-sm">
                  Turno #{t.queuePosition}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5" onClick={(e) => e.stopPropagation()}>
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

        {t.summary && (
          <div className="mb-2 bg-blue-50/70 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900/30">
            <p className="text-[9px] text-blue-500 dark:text-blue-400 font-bold uppercase tracking-wider mb-0.5">Resumen de Solicitud:</p>
            <p className="text-xs font-semibold whitespace-pre-line leading-snug">{t.summary}</p>
          </div>
        )}

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

        {hasShared && (
          <div className="mb-3 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30 flex flex-col gap-1">
            <span className="text-[10px] font-extrabold uppercase flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-red-500" /> ¡Misma Cuenta Detectada!
            </span>
            <div className="flex flex-col gap-1.5 pl-1.5 border-l-2 border-red-300 dark:border-red-800">
              {sharedWithDetails.map(({ ticket: s }) => (
                <div key={s.userId} className="text-[10px]">
                  <span className="font-bold">• {s.nombre} (+{s.phone})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-lg mb-3 border dark:border-gray-750">
          <p className="text-[9px] text-gray-450 font-bold uppercase tracking-wider mb-0.5">Último Mensaje:</p>
          <p className="text-xs text-gray-650 dark:text-gray-300 italic line-clamp-2">
            "{t.lastMessage || 'Mensaje de sistema / adjunto'}"
          </p>
          {timeFormatted && (
            <p className="text-right text-[9px] text-gray-400 dark:text-gray-500 mt-1">
              {timeFormatted}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t dark:border-gray-750 pt-2.5 mt-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setActiveChatTicket(t)}
            className="flex items-center gap-0.5 text-[11px] font-bold text-brand-primary hover:underline"
          >
            Abrir Chat 💬
          </button>

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
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border dark:border-gray-800 p-6 relative">
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

      {/* Search Bar & View Mode Switcher */}
      {!loading && (tickets.length > 0 || searchTerm) && (
        <div className="flex flex-col gap-4 mb-6">
          <div className="relative max-w-md shadow-sm rounded-xl">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono, cuenta o servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition-all duration-200"
            />
          </div>

          <div className="flex gap-2 border-b dark:border-gray-800 pb-2 overflow-x-auto scrollbar-none whitespace-nowrap">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                viewMode === 'kanban'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-650 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-750'
              }`}
            >
              📋 Tablero Kanban
            </button>
            <button
              onClick={() => setViewMode('grouped_accounts')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                viewMode === 'grouped_accounts'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-650 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-750'
              }`}
            >
              🔍 Agrupado por Cuenta (Correo)
            </button>
            <button
              onClick={() => setViewMode('grouped_subjects')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                viewMode === 'grouped_subjects'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-650 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-750'
              }`}
            >
              🏷️ Agrupado por Asunto
            </button>
          </div>
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
      ) : viewMode === 'kanban' ? (
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
      ) : viewMode === 'grouped_accounts' ? (
        <div className="space-y-6 animate-fadeIn">
          {Object.keys(getGroupedByAccounts()).length === 0 ? (
            <div className="text-center py-20 text-gray-500 dark:text-gray-400 font-medium">No hay tickets para agrupar por cuenta.</div>
          ) : (
            Object.entries(getGroupedByAccounts()).map(([groupName, groupTickets]) => (
              <div key={groupName} className="bg-gray-50/30 dark:bg-gray-950/5 border border-gray-150 dark:border-gray-800 rounded-2xl p-5">
                <h3 className="font-bold text-gray-850 dark:text-white text-sm mb-4 flex items-center justify-between border-b dark:border-gray-800 pb-2">
                  <span className="flex items-center gap-2">
                    📺 {groupName}
                  </span>
                  <span className="bg-brand-primary/10 text-brand-primary text-xs px-2.5 py-0.5 rounded-full font-extrabold">
                    {groupTickets.length} {groupTickets.length === 1 ? 'ticket' : 'tickets'}
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupTickets.map(renderTicketCard)}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          {Object.keys(getGroupedBySubjects()).length === 0 ? (
            <div className="text-center py-20 text-gray-500 dark:text-gray-400 font-medium">No hay tickets para agrupar por asunto.</div>
          ) : (
            Object.entries(getGroupedBySubjects()).map(([groupName, groupTickets]) => (
              <div key={groupName} className="bg-gray-50/30 dark:bg-gray-950/5 border border-gray-150 dark:border-gray-800 rounded-2xl p-5">
                <h3 className="font-bold text-gray-850 dark:text-white text-sm mb-4 flex items-center justify-between border-b dark:border-gray-800 pb-2">
                  <span className="flex items-center gap-2">
                    🏷️ {groupName}
                  </span>
                  <span className="bg-brand-primary/10 text-brand-primary text-xs px-2.5 py-0.5 rounded-full font-extrabold">
                    {groupTickets.length} {groupTickets.length === 1 ? 'ticket' : 'tickets'}
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupTickets.map(renderTicketCard)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* LIVE CHAT OVERLAY SIDE PANEL */}
      {activeChatTicket && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] bg-white dark:bg-gray-800 shadow-2xl border-l dark:border-gray-750 flex flex-col animate-slideInRight">
          {/* Chat Header */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-750 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveChatTicket(null)}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-450"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">{activeChatTicket.nombre}</h3>
                <span className="text-xs text-gray-450 font-mono">+{activeChatTicket.phone}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchChatMessages()}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-450"
                title="Actualizar chat"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-brand-primary/5 dark:bg-brand-primary/10 border-b dark:border-brand-primary/10 p-3 flex flex-wrap gap-2 justify-center items-center">
            <span className="text-[10px] font-bold text-gray-450 uppercase tracking-wider w-full text-center">Acciones Rápidas</span>
            <button
              onClick={sendHogarNetflixTemplate}
              className="flex items-center gap-1 bg-white hover:bg-gray-50 dark:bg-gray-750 dark:hover:bg-gray-700 text-gray-800 dark:text-white text-[11px] font-bold py-1.5 px-3 rounded-lg border dark:border-gray-650 transition-all active:scale-95"
              title="Copiar plantilla de Hogar Netflix al mensaje"
            >
              <Home className="w-3.5 h-3.5 text-amber-500" /> Hogar Netflix 📺
            </button>
            
            <button
              onClick={insertCobroTemplate}
              className="flex items-center gap-1 bg-white hover:bg-gray-50 dark:bg-gray-750 dark:hover:bg-gray-700 text-gray-800 dark:text-white text-[11px] font-bold py-1.5 px-3 rounded-lg border dark:border-gray-650 transition-all active:scale-95"
              title="Copiar plantilla de Cobrar al mensaje"
            >
              <Smile className="w-3.5 h-3.5 text-emerald-500" /> Cobrar 💰
            </button>

            {activeChatTicket.accounts && activeChatTicket.accounts.length > 0 ? (
              <>
                {activeChatTicket.accounts.map((acc, idx) => (
                  <button
                    key={idx}
                    onClick={() => insertCredentials(acc)}
                    className="flex items-center gap-1 bg-white hover:bg-gray-50 dark:bg-gray-750 dark:hover:bg-gray-700 text-gray-800 dark:text-white text-[11px] font-bold py-1.5 px-3 rounded-lg border dark:border-gray-650 transition-all active:scale-95"
                    title={`Copiar credenciales de ${acc.streaming} al mensaje`}
                  >
                    <Key className="w-3.5 h-3.5 text-blue-500" /> Credenciales {acc.streaming} 🔑
                  </button>
                ))}
                {activeChatTicket.accounts.length > 1 && (
                  <button
                    onClick={() => insertCredentials(null)}
                    className="flex items-center gap-1 bg-white hover:bg-gray-50 dark:bg-gray-750 dark:hover:bg-gray-700 text-gray-800 dark:text-white text-[11px] font-bold py-1.5 px-3 rounded-lg border dark:border-gray-650 transition-all active:scale-95"
                    title="Copiar todas las credenciales al mensaje"
                  >
                    <Key className="w-3.5 h-3.5 text-indigo-500" /> Credenciales (Todas) 🔑
                  </button>
                )}
              </>
            ) : null}

            {(() => {
              const activeClaudeLink = chatMessages
                .map(m => detectClaudeLink(m.body))
                .find(Boolean);
              if (activeClaudeLink) {
                return (
                  <a
                    href={activeClaudeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg shadow-sm transition-all active:scale-95 animate-pulse"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Acceso Claude 🔗
                  </a>
                );
              }
              return null;
            })()}
            <button
              onClick={() => handleToggleMode(activeChatTicket.phone, activeChatTicket.waitingHumanMode || 'bot')}
              className={`flex items-center gap-1.5 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg transition-all active:scale-95 ${
                (activeChatTicket.waitingHumanMode || 'bot') === 'bot'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
              title="Alternar entre modo Automático (el bot responderá si detecta intenciones conocidas) y Manual (el bot se mantendrá totalmente callado)"
            >
              <Bot className="w-3.5 h-3.5" />
              {(activeChatTicket.waitingHumanMode || 'bot') === 'bot' ? 'Modo: Auto (Bot)' : 'Modo: Manual (Asesor)'}
            </button>

            <button
              onClick={() => handleReleaseBot(activeChatTicket.phone)}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg transition-all active:scale-95"
              title="Libera la conversación del estado de soporte técnico para que el bot vuelva a responder y procesar menús desde cero"
            >
              <Unlock className="w-3.5 h-3.5" /> Liberar Bot
            </button>

            <button
              onClick={() => handleResolveClick(activeChatTicket)}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg transition-all active:scale-95"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Resolver
            </button>
          </div>

          {/* Chat Body (Messages List) */}
          <div className="flex-grow overflow-y-auto p-4 bg-gray-50/50 dark:bg-gray-900/20 space-y-3 flex flex-col">
            {loadingChat ? (
              <div className="flex flex-col items-center justify-center my-auto text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin text-brand-primary mb-2" />
                <span className="text-xs">Cargando conversación...</span>
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="text-center my-auto text-xs text-gray-400 italic">
                No hay mensajes recientes. Escribe uno abajo para iniciar.
              </div>
            ) : (
              chatMessages.map((msg, idx) => {
                const isMe = msg.fromMe;
                const claudeLink = detectClaudeLink(msg.body);
                return (
                  <div
                    key={msg.id || idx}
                    className={`max-w-[75%] p-3 rounded-2xl text-xs flex flex-col gap-1 shadow-sm leading-relaxed ${
                      isMe
                        ? 'bg-brand-primary text-white ml-auto rounded-tr-none'
                        : 'bg-white dark:bg-gray-750 dark:text-white rounded-tl-none border dark:border-gray-700'
                    }`}
                  >
                    <p className="whitespace-pre-wrap font-medium">{msg.body}</p>
                    {claudeLink && (
                      <a
                        href={claudeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[10px] font-black transition-all w-fit uppercase"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Iniciar Sesión Claude <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <span className={`text-[9px] text-right block ${isMe ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input & Signature */}
          <div className="p-4 bg-white dark:bg-gray-900 border-t dark:border-gray-750 flex flex-col gap-3">
            {/* Signature configuration */}
            <div className="flex items-center justify-between border-b dark:border-gray-800 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Firma de Asesor:</span>
                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-base px-2 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded border dark:border-gray-700 flex items-center gap-1"
                  >
                    <span>{advisorEmoji}</span>
                    <Smile className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                  
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-850 p-2.5 rounded-xl border dark:border-gray-750 shadow-2xl flex gap-1.5 flex-wrap w-[180px] z-50">
                      {COMMON_EMOJIS.map(em => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => changeEmoji(em)}
                          className="hover:scale-125 transition-transform text-lg p-1"
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                Se enviará como: <strong className="dark:text-white">{advisorEmoji} [tu mensaje]</strong>
              </span>
            </div>

            {/* Quick Insertion Tags (Agregadores) */}
            {activeChatTicket && (
              <div className="flex flex-wrap gap-1.5 pb-1 border-b dark:border-gray-800 items-center">
                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Agregadores:</span>
                <button
                  type="button"
                  onClick={() => {
                    const firstName = activeChatTicket.nombre ? activeChatTicket.nombre.split(' ')[0] : 'Cliente';
                    setNewMsgText(prev => prev + (prev ? ' ' : '') + firstName);
                  }}
                  className="text-[10px] bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 px-2 py-1 rounded-lg font-bold text-gray-700 dark:text-gray-300 transition-all active:scale-95"
                  title="Insertar nombre del cliente"
                >
                  👤 {activeChatTicket.nombre ? activeChatTicket.nombre.split(' ')[0] : 'Cliente'}
                </button>
                <button
                  type="button"
                  onClick={() => setNewMsgText(prev => prev + (prev ? ' ' : '') + `https://sheerit.com.co/verificar?tel=${activeChatTicket.phone}`)}
                  className="text-[10px] bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 px-2 py-1 rounded-lg font-bold text-gray-700 dark:text-gray-300 transition-all active:scale-95"
                  title="Insertar link de verificación de hogar"
                >
                  📺 Link Hogar
                </button>
                <button
                  type="button"
                  onClick={() => setNewMsgText(prev => prev + (prev ? ' ' : '') + `0087387259`)}
                  className="text-[10px] bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 px-2 py-1 rounded-lg font-bold text-gray-700 dark:text-gray-300 transition-all active:scale-95"
                  title="Insertar número de Llave Bre-V"
                >
                  🔑 Llave Bre-V
                </button>
                {activeChatTicket.accounts && activeChatTicket.accounts.map((acc, idx) => (
                  <React.Fragment key={idx}>
                    <button
                      type="button"
                      onClick={() => setNewMsgText(prev => prev + (prev ? ' ' : '') + acc.correo)}
                      className="text-[10px] bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 px-2 py-1 rounded-lg font-bold text-blue-700 dark:text-blue-305 transition-all active:scale-95"
                      title={`Insertar correo de ${acc.streaming}`}
                    >
                      📧 {acc.correo.split('@')[0]}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMsgText(prev => prev + (prev ? ' ' : '') + acc.streaming)}
                      className="text-[10px] bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 px-2 py-1 rounded-lg font-bold text-purple-700 dark:text-purple-305 transition-all active:scale-95"
                      title={`Insertar plataforma: ${acc.streaming}`}
                    >
                      🎬 {acc.streaming}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Input field */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatMessage();
              }}
              className="flex gap-2 items-center"
            >
              <input
                type="text"
                value={newMsgText}
                onChange={(e) => setNewMsgText(e.target.value)}
                placeholder="Escribe un mensaje de respuesta..."
                className="flex-grow px-4 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-850 border dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-1 focus:ring-brand-primary"
              />
              <button
                type="submit"
                disabled={!newMsgText.trim()}
                className="p-2.5 bg-brand-primary hover:bg-brand-dark text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
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
                <div key={s.userId} className="text-xs pb-3 border-b last:border-0 last:pb-0 border-gray-150 dark:border-gray-800 flex flex-col gap-1 dark:text-gray-300">
                  <div className="flex justify-between items-center font-bold">
                    <span>👤 {s.nombre || 'Cliente WhatsApp'}</span>
                    <span className="font-mono text-gray-400">+{s.phone}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold mr-1">Cuentas compartidas:</span>
                    {matchingAccounts.map((acc, idx) => (
                      <span key={idx} className="bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-[10px] px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900/30">
                        📺 {acc.streaming} ({acc.correo})
                      </span>
                    ))}
                  </div>

                  {s.summary && (
                    <div className="mt-1 bg-gray-100 dark:bg-gray-800 p-2 rounded text-[11px] text-gray-655 dark:text-gray-400 italic">
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
