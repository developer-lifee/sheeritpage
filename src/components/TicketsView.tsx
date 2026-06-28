import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, User, CheckCircle, RefreshCw, AlertTriangle, ExternalLink, Users, Columns, LogOut, Lock, Search, Send, Smile, Key, Home, ArrowLeft, ShieldAlert, Bot, Unlock, ChevronDown, ChevronUp } from 'lucide-react';

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

const getApiUrl = () => {
  return window.location.hostname.includes('sheerit.com.co')
    ? 'https://bot.sheerit.com.co'
    : `http://${window.location.hostname}:3000`;
};

const logAuditAction = async (action: string, details: any) => {
  try {
    const email = localStorage.getItem('ticket_agent_email') || 'unknown';
    const name = localStorage.getItem('ticket_agent_name') || 'unknown';
    const apiUrl = getApiUrl();
    await fetch(`${apiUrl}/api/admin/audit-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentEmail: email, agentName: name, action, details })
    });
  } catch (e) {
    console.error("Failed to write frontend audit log:", e);
  }
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
  const [bulkSharedMessage, setBulkSharedMessage] = useState('');
  const [showBulkSharedInput, setShowBulkSharedInput] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);
  const [syncingChat, setSyncingChat] = useState(false);
  const [showShortcutsMenu, setShowShortcutsMenu] = useState(false);
  const [shortcutsFilter, setShortcutsFilter] = useState('');
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    me: true,
    unassigned: true,
    other: false,
    accounts: false,
    subjects: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const fetchSingleSend = async (phone: string, messageText: string) => {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/api/admin/chat-messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phone,
        message: messageText,
        emoji: advisorEmoji,
        agentName: agentName,
        password: 'admin123'
      })
    });
    return res.json();
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastActivePhoneRef = useRef<string>('');

  const fetchTickets = (isSilent = false) => {
    if (!agentEmail) return;
    if (!isSilent) setLoading(true);
    setError('');
    const apiUrl = getApiUrl();
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
    const container = chatContainerRef.current;
    if (!container) return;
    
    const currentPhone = activeChatTicket?.phone || '';
    const isNewChat = currentPhone !== lastActivePhoneRef.current;
    const isCloseToBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    
    if (isNewChat || isCloseToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: isNewChat ? 'auto' : 'smooth' });
      lastActivePhoneRef.current = currentPhone;
    }
  }, [chatMessages, activeChatTicket?.phone]);

  const fetchChatMessages = async (isSilent = false) => {
    if (!activeChatTicket) return;
    if (!isSilent) setLoadingChat(true);
    const apiUrl = getApiUrl();
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

  const handleSyncChatMessages = async () => {
    if (!activeChatTicket) return;
    setSyncingChat(true);
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/chat-messages/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: activeChatTicket.phone })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.messages) {
          setChatMessages(data.messages);
        }
      }
    } catch (e) {
      console.error("Error syncing chat messages:", e);
    } finally {
      setSyncingChat(false);
    }
  };

  const handleSendChatMessage = async (textToSend = newMsgText) => {
    if (!activeChatTicket || !textToSend.trim()) return;
    const apiUrl = getApiUrl();
    
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
        logAuditAction('SEND_MESSAGE', { ticketPhone: activeChatTicket.phone, textLength: textToSend.length });
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
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/tickets/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, agent: targetAgent, password: 'admin123' })
      });
      const result = await res.json();
      if (!result.success) {
        alert(`❌ Error: ${result.message}`);
      } else {
        logAuditAction('CLAIM_TICKET', { ticketPhone: phone, claimedBy: targetAgent || 'UNASSIGNED' });
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
    
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/tickets/update-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, mode: nextMode, password: 'admin123' })
      });
      const result = await res.json();
      if (!result.success) {
        alert(`❌ Error: ${result.message}`);
      } else {
        logAuditAction('TOGGLE_BOT_MODE', { ticketPhone: phone, nextMode });
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
    
    const apiUrl = getApiUrl();
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

    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/tickets/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: 'admin123', resolveAll })
      });
      const result = await res.json();
      if (!result.success) {
        alert(`❌ Error: ${result.message}`);
      } else {
        logAuditAction('RESOLVE_TICKET', { ticketPhone: phone, resolveAllShared: resolveAll });
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

  const getShortcuts = (t: Ticket) => {
    const list = [
      { key: 'nombre', label: '👤 Nombre del Cliente', description: 'Inserta el primer nombre del cliente', text: t.nombre ? t.nombre.split(' ')[0] : 'Cliente' },
      { key: 'hogar', label: '📺 Link Hogar Netflix', description: 'Inserta la plantilla de Hogar Netflix', text: `🤖 Para actualizar tu hogar de Netflix, abre este enlace desde tu celular o TV:\n👉 https://sheerit.com.co/verificar?tel=${t.phone}` },
      { key: 'cobro', label: '💰 Cobro / Renovación', description: 'Inserta la plantilla de cobro/renovación', text: `🤖 *Recordatorio de Pago / Renovación Sheerit Store* 💰\n\nPor favor realiza tu transferencia usando nuestra *Llave Bre-V:* \`0087387259\` (RECOMENDADO: entrega inmediata ⚡)\n\nValor: $` },
      { key: 'credenciales', label: '🔑 Credenciales de Cuenta (Todas)', description: 'Inserta credenciales de todas las cuentas', text: (() => {
          let text = `🤖 *Tus credenciales de ingreso de Sheerit Store* 🔑:\n\n`;
          if (t.accounts && t.accounts.length > 0) {
            t.accounts.forEach(a => {
              text += `📺 Plataforma: *${a.streaming}*\n📧 Correo: \`${a.correo}\`\n👤 Perfil: *${a.nombrePerfil}*\n\n`;
            });
          } else {
            text += `(No hay cuentas vinculadas en este ticket)\n\n`;
          }
          text += `_Por favor, ingresa con estos datos. Si te pide un código de verificación, escríbeme aquí la palabra *codigo*._`;
          return text;
        })()
      }
    ];

    if (t.accounts && t.accounts.length > 0) {
      t.accounts.forEach(acc => {
        list.push({
          key: `credenciales-${acc.streaming.toLowerCase()}`,
          label: `🔑 Credenciales ${acc.streaming}`,
          description: `Inserta credenciales de ${acc.streaming}`,
          text: `🤖 *Tus credenciales de ingreso de Sheerit Store* 🔑:\n\n📺 Plataforma: *${acc.streaming}*\n📧 Correo: \`${acc.correo}\`\n👤 Perfil: *${acc.nombrePerfil}*\n\n_Por favor, ingresa con estos datos. Si te pide un código de verificación, escríbeme aquí la palabra *codigo*._`
        });
      });
    }

    return list;
  };

  const handleInputChange = (val: string) => {
    setNewMsgText(val);
    const match = val.match(/\/(\w*)$/);
    if (match) {
      setShowShortcutsMenu(true);
      setShortcutsFilter(match[1].toLowerCase());
    } else {
      setShowShortcutsMenu(false);
    }
  };

  const selectShortcut = (shortcutText: string) => {
    const match = newMsgText.match(/\/(\w*)$/);
    if (match) {
      const prefix = newMsgText.slice(0, match.index);
      setNewMsgText(prefix + shortcutText);
    } else {
      setNewMsgText(prev => prev + shortcutText);
    }
    setShowShortcutsMenu(false);
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

  const getSidebarTickets = () => {
    switch (sidebarFilter) {
      case 'me':
        return myTickets;
      case 'unassigned':
        return unassignedTickets;
      case 'other':
        return otherTickets;
      case 'all':
      default:
        return filteredTickets;
    }
  };

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

  const renderCompactTicketItem = (t: Ticket) => {
    const isActive = activeChatTicket?.userId === t.userId;
    const isBotMode = t.waitingHumanMode === 'bot';
    const timeFormatted = formatTimeDiff(t.lastMessageTime);
    const sharedWithDetails = findSharedTicketsWithDetails(t);
    const hasShared = sharedWithDetails.length > 0;
    const cleanTicketAgent = (t.agent || '').toLowerCase().trim();

    return (
      <div
        key={t.userId}
        onClick={() => setActiveChatTicket(t)}
        className={`p-3 rounded-xl flex flex-col gap-1.5 cursor-pointer transition-all border ${
          isActive
            ? 'bg-brand-primary/10 border-brand-primary shadow-sm'
            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-750 hover:bg-gray-50 dark:hover:bg-gray-750'
        }`}
      >
        <div className="flex justify-between items-start gap-1">
          <div className="min-w-0 flex-1">
            <span className="font-bold text-xs text-gray-800 dark:text-white block truncate" title={t.nombre}>
              {t.nombre || 'Cliente WhatsApp'}
            </span>
            <span className="text-[10px] text-gray-450 font-mono">+{t.phone}</span>
          </div>
          <span className="text-[9px] text-gray-400 shrink-0 font-mono">
            {timeFormatted ? timeFormatted.replace('Hace ', '') : ''}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {t.queuePosition !== undefined && t.queuePosition !== null && (
            <span className="bg-amber-100 dark:bg-amber-950 text-amber-850 dark:text-amber-300 text-[8px] font-extrabold px-1 py-0.2 rounded border border-amber-200/50">
              #{t.queuePosition}
            </span>
          )}
          {isBotMode ? (
            <span className="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[8px] font-semibold px-1 py-0.2 rounded">
              🤖 Bot
            </span>
          ) : (
            <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-305 text-[8px] font-semibold px-1 py-0.2 rounded">
              👤 Asesor
            </span>
          )}
          {t.agent ? (
            <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full ${
              cleanTicketAgent === safeAgentName
                ? 'bg-emerald-55 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
            }`}>
              👤 {t.agent}
            </span>
          ) : (
            <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[8px] font-bold px-1.5 py-0.2 rounded-full">
              ⏳ Libre
            </span>
          )}
          {hasShared && (
            <span className="bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-[8px] font-bold px-1 py-0.2 rounded border border-red-100 dark:border-red-900/30 flex items-center gap-0.5">
              ⚠️ Compartido ({sharedWithDetails.length})
            </span>
          )}
        </div>

        {t.lastMessage && (
          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate italic">
            "{t.lastMessage}"
          </p>
        )}
      </div>
    );
  };

  const renderAccordionSection = (
    key: string,
    title: string,
    icon: React.ReactNode,
    count: number,
    content: React.ReactNode
  ) => {
    const isExpanded = !!expandedSections[key];
    return (
      <div className="border dark:border-gray-800 rounded-xl overflow-hidden shadow-sm bg-gray-50/30 dark:bg-gray-900/20">
        <button
          onClick={() => toggleSection(key)}
          className="w-full flex items-center justify-between p-3 text-xs font-bold text-gray-700 dark:text-gray-250 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span>{title}</span>
            <span className="bg-gray-200 dark:bg-gray-800 text-gray-650 dark:text-gray-400 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
              {count}
            </span>
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {isExpanded && (
          <div className="p-3 border-t dark:border-gray-800 bg-white dark:bg-gray-900/40 space-y-2 max-h-[350px] overflow-y-auto">
            {content}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border dark:border-gray-800 p-6 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b dark:border-gray-800 pb-5">
        <div>
          <h2 className="text-xl font-bold flex items-center dark:text-white gap-2">
            <MessageSquare className="text-brand-primary" /> Centro de Soporte y Mensajería
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

      {/* Unified Split-Screen Layout */}
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px] h-[calc(100vh-250px)] border dark:border-gray-850 rounded-2xl overflow-hidden bg-gray-50/20 dark:bg-gray-900/10">
          
          {/* LEFT COLUMN: Collapsible Categories (col-span-5) */}
          <div className="lg:col-span-5 border-r dark:border-gray-850 flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
            {/* Search Box */}
            <div className="p-4 border-b dark:border-gray-850 bg-gray-50/50 dark:bg-gray-900/50">
              <div className="relative shadow-sm rounded-xl">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, teléfono, cuenta o servicio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-750 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition-all duration-200"
                />
              </div>
            </div>

            {/* Accordion List */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {renderAccordionSection(
                'me',
                'Mis Tickets',
                <User className="w-4 h-4 text-emerald-500" />,
                myTickets.length,
                myTickets.length === 0 ? (
                  <p className="text-center py-4 text-xs text-gray-450 italic">No tienes tickets asignados.</p>
                ) : (
                  myTickets.map(renderCompactTicketItem)
                )
              )}

              {renderAccordionSection(
                'unassigned',
                'Tickets Libres',
                <RefreshCw className="w-4 h-4 text-amber-500" />,
                unassignedTickets.length,
                unassignedTickets.length === 0 ? (
                  <p className="text-center py-4 text-xs text-gray-450 italic">No hay tickets libres.</p>
                ) : (
                  unassignedTickets.map(renderCompactTicketItem)
                )
              )}

              {renderAccordionSection(
                'other',
                'Otros Asesores',
                <Users className="w-4 h-4 text-blue-500" />,
                otherTickets.length,
                otherTickets.length === 0 ? (
                  <p className="text-center py-4 text-xs text-gray-455 italic">No hay tickets de otros asesores.</p>
                ) : (
                  otherTickets.map(renderCompactTicketItem)
                )
              )}

              {(() => {
                const groupedAccounts = getGroupedByAccounts();
                const totalAccountTickets = Object.values(groupedAccounts).reduce((sum, list) => sum + list.length, 0);
                return renderAccordionSection(
                  'accounts',
                  'Agrupados por Cuenta',
                  <Columns className="w-4 h-4 text-brand-primary" />,
                  totalAccountTickets,
                  Object.keys(groupedAccounts).length === 0 ? (
                    <p className="text-center py-4 text-xs text-gray-450 italic">No hay tickets vinculados a cuentas.</p>
                  ) : (
                    Object.entries(groupedAccounts).map(([groupName, groupTickets]) => (
                      <div key={groupName} className="space-y-1.5 border-b last:border-b-0 pb-3 last:pb-0 border-gray-150 dark:border-gray-800">
                        <div className="text-[10px] font-bold text-brand-primary bg-brand-primary/5 px-2.5 py-1 rounded-lg flex justify-between items-center mb-1">
                          <span className="truncate max-w-[200px]" title={groupName}>📺 {groupName}</span>
                          <span className="shrink-0 text-[9px] bg-brand-primary/10 px-1.5 rounded">{groupTickets.length}</span>
                        </div>
                        <div className="space-y-2 pl-1.5 border-l-2 border-brand-primary/20">
                          {groupTickets.map(renderCompactTicketItem)}
                        </div>
                      </div>
                    ))
                  )
                );
              })()}

              {(() => {
                const groupedSubjects = getGroupedBySubjects();
                const totalSubjectTickets = Object.values(groupedSubjects).reduce((sum, list) => sum + list.length, 0);
                return renderAccordionSection(
                  'subjects',
                  'Agrupados por Asunto',
                  <MessageSquare className="w-4 h-4 text-purple-500" />,
                  totalSubjectTickets,
                  Object.keys(groupedSubjects).length === 0 ? (
                    <p className="text-center py-4 text-xs text-gray-450 italic">No hay tickets por asunto.</p>
                  ) : (
                    Object.entries(groupedSubjects).map(([groupName, groupTickets]) => (
                      <div key={groupName} className="space-y-1.5 border-b last:border-b-0 pb-3 last:pb-0 border-gray-150 dark:border-gray-800">
                        <div className="text-[10px] font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg flex justify-between items-center mb-1">
                          <span>🏷️ {groupName}</span>
                          <span className="text-[9px] bg-gray-200 dark:bg-gray-700 px-1.5 rounded">{groupTickets.length}</span>
                        </div>
                        <div className="space-y-2 pl-1.5 border-l-2 border-gray-200 dark:border-gray-700">
                          {groupTickets.map(renderCompactTicketItem)}
                        </div>
                      </div>
                    ))
                  )
                );
              })()}
            </div>
          </div>

          {/* RIGHT COLUMN: Chat Conversation & Details (col-span-7) */}
          <div className="lg:col-span-7 flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
            {activeChatTicket ? (
              <div className="flex flex-col h-full relative overflow-hidden">
                {/* Chat Panel top bar */}
                <div className="p-4 bg-gray-50 dark:bg-gray-950 border-b dark:border-gray-850 flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                      {activeChatTicket.nombre} 
                      {activeChatTicket.queuePosition !== undefined && activeChatTicket.queuePosition !== null && (
                        <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-305 text-[9px] font-extrabold px-1.5 py-0.2 rounded border">
                          Turno #{activeChatTicket.queuePosition}
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-gray-450 font-mono">+{activeChatTicket.phone}</span>
                  </div>

                  {/* Top Bar actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSyncChatMessages()}
                      disabled={syncingChat}
                      className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-650 dark:text-gray-300 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0"
                      title="Sincronizar mensajes desde el celular"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncingChat ? 'animate-spin text-brand-primary' : ''}`} />
                      <span>{syncingChat ? 'Sincronizando...' : 'Sincronizar Celular'}</span>
                    </button>
                    {!activeChatTicket.agent ? (
                      <button
                        onClick={() => handleClaim(activeChatTicket.phone, agentName)}
                        className="bg-brand-primary hover:bg-brand-dark text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        Reclamar Ticket
                      </button>
                    ) : activeChatTicket.agent.toLowerCase().trim() === safeAgentName ? (
                      <button
                        onClick={() => handleClaim(activeChatTicket.phone, '')}
                        className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        Liberar Ticket
                      </button>
                    ) : (
                      <button
                        onClick={() => handleClaim(activeChatTicket.phone, agentName)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        Asignarme a mí
                      </button>
                    )}

                    <button
                      onClick={() => handleResolveClick(activeChatTicket)}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" /> Resolver
                    </button>
                  </div>
                </div>

                {/* Sub-Header: Accounts list & Shared alert */}
                <div className="bg-gray-50/50 dark:bg-gray-950 border-b dark:border-gray-850 p-3 flex flex-col gap-2">
                  {/* Cuentas vinculadas */}
                  {activeChatTicket.accounts && activeChatTicket.accounts.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px] mr-1">Vínculos:</span>
                      {activeChatTicket.accounts.map((acc, idx) => (
                        <span
                          key={idx}
                          title={`${acc.correo} - Perfil: ${acc.nombrePerfil}`}
                          className="bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary text-[10px] font-medium px-2 py-0.5 rounded border border-brand-primary/20"
                        >
                          📺 {acc.streaming} ({acc.correo.split('@')[0]})
                        </span>
                      ))}
                    </div>
                  )}

                  {/* INTEGRACIÓN DE ENVÍO MASIVO / BOTÓN DE CUENTA COMPARTIDA */}
                  {(() => {
                    const sharedWith = findSharedTicketsWithDetails(activeChatTicket);
                    const hasShared = sharedWith.length > 0;
                    if (!hasShared) return null;

                    return (
                      <div className="flex flex-col gap-2 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-extrabold uppercase text-red-700 dark:text-red-300 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-red-500" /> Misma cuenta en otros tickets ({sharedWith.length})
                          </span>
                          <button
                            onClick={() => {
                              setShowBulkSharedInput(!showBulkSharedInput);
                              setBulkSharedMessage('');
                            }}
                            className="bg-red-600 hover:bg-red-705 text-white font-bold text-[9px] px-2.5 py-1 rounded-md transition-all active:scale-95"
                          >
                            📢 Mensaje Masivo a Todos
                          </button>
                        </div>

                        {showBulkSharedInput && (
                          <div className="mt-2 flex flex-col gap-2 bg-white dark:bg-gray-850 p-2.5 rounded-lg border dark:border-gray-700 animate-fadeIn">
                            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-450 uppercase">
                              Mensaje Masivo a Cuenta Compartida:
                            </label>
                            <textarea
                              rows={3}
                              value={bulkSharedMessage}
                              onChange={(e) => setBulkSharedMessage(e.target.value)}
                              placeholder="Escribe el mensaje que se enviará a todos los clientes vinculados a esta cuenta..."
                              className="w-full p-2 border dark:border-gray-700 dark:bg-gray-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-brand-primary dark:text-white"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setShowBulkSharedInput(false)}
                                className="px-2.5 py-1 text-[10px] text-gray-500 hover:underline"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={async () => {
                                  if (!bulkSharedMessage.trim()) return;
                                  setBulkSending(true);
                                  const targetPhones = [activeChatTicket.phone, ...sharedWith.map(s => s.ticket.phone)];
                                  let success = 0;
                                  
                                  for (const phone of targetPhones) {
                                    try {
                                      const res = await fetchSingleSend(phone, bulkSharedMessage);
                                      if (res.success) success++;
                                    } catch (e) {
                                      console.error("Error sending bulk shared:", e);
                                    }
                                  }
                                  
                                  alert(`✅ Difusión enviada con éxito a ${success} de ${targetPhones.length} clientes vinculados.`);
                                  setBulkSharedMessage('');
                                  setShowBulkSharedInput(false);
                                  setBulkSending(false);
                                  fetchChatMessages(true);
                                }}
                                disabled={bulkSending || !bulkSharedMessage.trim()}
                                className="bg-red-600 hover:bg-red-750 text-white font-bold text-[10px] px-3 py-1 rounded-md transition-all active:scale-95 disabled:opacity-50"
                              >
                                {bulkSending ? 'Enviando...' : 'Enviar Masivo 🚀'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Quick actions row */}
                <div className="bg-brand-primary/5 dark:bg-brand-primary/10 border-b dark:border-brand-primary/10 p-2.5 flex flex-wrap gap-2 justify-center items-center">
                  <button
                    onClick={sendHogarNetflixTemplate}
                    className="flex items-center gap-1 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-white text-[10px] font-bold py-1.2 px-2.5 rounded-lg border dark:border-gray-700 transition-all"
                  >
                    <Home className="w-3 h-3 text-amber-500" /> Hogar Netflix 📺
                  </button>
                  <button
                    onClick={insertCobroTemplate}
                    className="flex items-center gap-1 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-white text-[10px] font-bold py-1.2 px-2.5 rounded-lg border dark:border-gray-700 transition-all"
                  >
                    <Smile className="w-3 h-3 text-emerald-500" /> Cobrar 💰
                  </button>
                  {activeChatTicket.accounts && activeChatTicket.accounts.map((acc, idx) => (
                    <button
                      key={idx}
                      onClick={() => insertCredentials(acc)}
                      className="flex items-center gap-1 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-805 dark:text-white text-[10px] font-bold py-1.2 px-2.5 rounded-lg border dark:border-gray-700 transition-all"
                    >
                      <Key className="w-3 h-3 text-blue-500" /> Credenciales {acc.streaming} 🔑
                    </button>
                  ))}
                  <button
                    onClick={() => handleToggleMode(activeChatTicket.phone, activeChatTicket.waitingHumanMode || 'bot')}
                    className={`flex items-center gap-1 text-white text-[10px] font-bold py-1.2 px-2.5 rounded-lg transition-all ${
                      (activeChatTicket.waitingHumanMode || 'bot') === 'bot'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    {(activeChatTicket.waitingHumanMode || 'bot') === 'bot' ? 'Modo: Auto (Bot)' : 'Modo: Manual (Asesor)'}
                  </button>
                </div>

                {/* Conversation message list */}
                <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 bg-gray-50/50 dark:bg-gray-900/20 space-y-3 flex flex-col min-h-0">
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
                              : 'bg-white dark:bg-gray-800 dark:text-white rounded-tl-none border dark:border-gray-700'
                          }`}
                        >
                          <p className="whitespace-pre-wrap font-medium">{msg.body}</p>
                          {claudeLink && (
                            <a
                              href={claudeLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[10px] font-black transition-all w-fit uppercase"
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

                {/* Input area */}
                <div className="p-4 bg-white dark:bg-gray-900 border-t dark:border-gray-850 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b dark:border-gray-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Firma:</span>
                      <div className="relative">
                        <button
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="text-base px-2 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-850 rounded border dark:border-gray-700 flex items-center gap-1"
                        >
                          <span>{advisorEmoji}</span>
                          <Smile className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                        
                        {showEmojiPicker && (
                          <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-850 p-2.5 rounded-xl border dark:border-gray-750 shadow-2xl flex gap-1.5 flex-wrap z-50">
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

                  {/* Atajos Clickables */}
                  <div className="flex flex-wrap gap-1.5 pb-1 border-b dark:border-gray-800 items-center">
                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Atajos:</span>
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
                          className="text-[10px] bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 px-2 py-1 rounded-lg font-bold text-blue-700 dark:text-blue-300 transition-all active:scale-95"
                          title={`Insertar correo de ${acc.streaming}`}
                        >
                          📧 {acc.correo.split('@')[0]}
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewMsgText(prev => prev + (prev ? ' ' : '') + acc.streaming)}
                          className="text-[10px] bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 px-2 py-1 rounded-lg font-bold text-purple-700 dark:text-purple-300 transition-all active:scale-95"
                          title={`Insertar plataforma: ${acc.streaming}`}
                        >
                          🎬 {acc.streaming}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendChatMessage();
                    }}
                    className="flex gap-2 items-center"
                  >
                    <div className="relative flex-grow">
                      {showShortcutsMenu && (
                        <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-gray-850 rounded-xl border dark:border-gray-750 shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                          <div className="bg-gray-50 dark:bg-gray-800 px-3 py-1.5 border-b dark:border-gray-700 text-[10px] font-bold text-gray-500 uppercase">
                            Atajos disponibles (Filtrado: /{shortcutsFilter})
                          </div>
                          <div className="divide-y dark:divide-gray-800 animate-fadeIn">
                            {getShortcuts(activeChatTicket)
                              .filter(s => s.key.includes(shortcutsFilter) || s.label.toLowerCase().includes(shortcutsFilter))
                              .map(s => (
                                <button
                                  key={s.key}
                                  type="button"
                                  onClick={() => selectShortcut(s.text)}
                                  className="w-full text-left px-3 py-2 hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 flex flex-col gap-0.5 transition-colors"
                                >
                                  <span className="text-xs font-bold text-gray-800 dark:text-white flex justify-between">
                                    <span>{s.label}</span>
                                    <span className="text-[10px] text-brand-primary font-mono font-black">/{s.key}</span>
                                  </span>
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500">{s.description}</span>
                                </button>
                              ))}
                            {getShortcuts(activeChatTicket).filter(s => s.key.includes(shortcutsFilter) || s.label.toLowerCase().includes(shortcutsFilter)).length === 0 && (
                              <div className="p-3 text-xs text-gray-400 italic text-center">
                                No se encontraron atajos para "/{shortcutsFilter}"
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <input
                        type="text"
                        value={newMsgText}
                        onChange={(e) => handleInputChange(e.target.value)}
                        placeholder="Escribe un mensaje de respuesta (Usa / para atajos)..."
                        className="w-full px-4 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-855 border dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-1 focus:ring-brand-primary"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!newMsgText.trim()}
                      className="p-2.5 bg-brand-primary hover:bg-brand-dark text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-400 dark:text-gray-500 bg-gray-50/30 dark:bg-gray-900/10">
                <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4 animate-bounce" />
                <h3 className="font-bold text-lg dark:text-gray-300 font-sans">Bandeja de Conversaciones</h3>
                <p className="text-xs max-w-sm mt-2 text-gray-500 leading-relaxed">
                  Selecciona una conversación de las categorías expandibles de la izquierda para responder. Puedes reclamar tickets, enviar respuestas automáticas y ver detalles de la cuenta.
                </p>
              </div>
            )}
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
