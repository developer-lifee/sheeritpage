import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, User, CheckCircle, RefreshCw, AlertTriangle, ExternalLink, Users, Columns, LogOut, Lock, Search, Send, Smile, Key, Home, ArrowLeft, ShieldAlert, Bot, Unlock, ChevronDown, ChevronUp, Maximize2, Minimize2, Archive, TrendingUp, Keyboard, Mic, Square, Trash2, Plus, History } from 'lucide-react';

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
  lastMessageFromMe?: boolean;
  isProbablyFinished?: boolean;
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
  mediaPath?: string | null;
  mediaMime?: string | null;
}

const COMMON_EMOJIS = ['🦈', '🟦', '🍃'];

const detectClaudeLink = (text: string | null) => {
  if (!text) return null;
  const match = text.match(/https:\/\/claude\.ai\/login\S+/);
  return match ? match[0] : null;
};

function formatExcelDate(excelDate: any): string {
  if (!excelDate) return '-';
  const str = excelDate.toString().trim();
  if (isNaN(str)) {
    return str;
  }
  try {
    const serial = parseFloat(str);
    const date = new Date((serial - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {}
  return str;
}

const formatMessageDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hoy';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Ayer';
  } else {
    return date.toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' });
  }
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
  const [chatFilter, setChatFilter] = useState<'my' | 'all_tickets' | 'all_chats'>('all_tickets');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Metrics state
  const [showMetricsModal, setShowMetricsModal] = useState(false);
   const [metricsData, setMetricsData] = useState<{
     summary: { agent: string; count: number }[];
     summaryToday?: { agent: string; count: number }[];
     recent: { phone: string; customerName: string; agent: string; resolvedAt: string }[];
     weeklyFlow?: { day_label: string; agent: string; count: number }[];
   } | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [hiddenChartAgents, setHiddenChartAgents] = useState<Set<string>>(new Set());

  // Account History state
  const [showAccountHistoryModal, setShowAccountHistoryModal] = useState(false);
  const [accountHistoryEmail, setAccountHistoryEmail] = useState('');
  const [accountHistoryData, setAccountHistoryData] = useState<any[]>([]);
  const [loadingAccountHistory, setLoadingAccountHistory] = useState(false);

  const handleViewAccountHistory = async (email: string) => {
    setAccountHistoryEmail(email);
    setLoadingAccountHistory(true);
    setShowAccountHistoryModal(true);
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/account-history?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setAccountHistoryData(data);
      } else {
        setAccountHistoryData([]);
      }
    } catch (e) {
      console.error("Error fetching account history:", e);
      setAccountHistoryData([]);
    } finally {
      setLoadingAccountHistory(false);
    }
  };

  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/tickets/metrics`);
      if (res.ok) {
        const data = await res.json();
        setMetricsData(data);
      }
    } catch (e) {
      console.error("Error fetching metrics:", e);
    } finally {
      setLoadingMetrics(false);
    }
  };

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
  const [rpaRecipesMap, setRpaRecipesMap] = useState<Record<string, { recipeId: number; name: string } | null>>({});
  const [rpaRunningMap, setRpaRunningMap] = useState<Record<string, { loading: boolean; progress: string }>>({});
  const [selectedAccountAlert, setSelectedAccountAlert] = useState<{ correo: string; streaming: string; nombrePerfil: string } | null>(null);
  const [availabilityOverrides, setAvailabilityOverrides] = useState<Record<string, { immediate: boolean; incident?: string; reason?: string }>>({});
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
  const [showVinculosPanel, setShowVinculosPanel] = useState(false);
  const [showShortcutsBar, setShowShortcutsBar] = useState(false);
  const [bulkSharedMessage, setBulkSharedMessage] = useState('');
  const [showBulkSharedInput, setShowBulkSharedInput] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);
  const [syncingChat, setSyncingChat] = useState(false);
  const [showShortcutsMenu, setShowShortcutsMenu] = useState(false);
  const [shortcutsFilter, setShortcutsFilter] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, messageId: string, messageBody: string, isFromMe: boolean } | null>(null);
  const [editingMessage, setEditingMessage] = useState<{ id: string, body: string } | null>(null);

  // Create ticket states
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [newTicketPhone, setNewTicketPhone] = useState('');
  const [newTicketName, setNewTicketName] = useState('');
  const [newTicketReason, setNewTicketReason] = useState('');

  // Client Profile states
  const [showClientProfileModal, setShowClientProfileModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileEditing, setProfileEditing] = useState<{
    phone: string;
    fullname: string;
    email: string;
    notes: string;
  } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [ticketTotal, setTicketTotal] = useState<number | null>(null);
  const [ticketSaldo, setTicketSaldo] = useState<number | null>(null);
  const [updatingTicketState, setUpdatingTicketState] = useState(false);

  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [failedMessages, setFailedMessages] = useState<Array<{
    id: string;
    body: string;
    type: 'text' | 'audio';
    mediaPath?: string;
    mediaMime?: string;
    base64Audio?: string;
    timestamp: number;
    phone: string;
  }>>([]);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    me: true,
    unassigned: true,
    other: false,
    probablyFinished: false,
    archived: false,
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

  const fetchTickets = (isSilent = false, currentFilter = chatFilter) => {
    if (!agentEmail) return;
    if (!isSilent) setLoading(true);
    setError('');
    const apiUrl = getApiUrl();
    const queryParam = currentFilter === 'all_chats' ? '?allChats=true' : '';
    fetch(`${apiUrl}/api/admin/tickets${queryParam}`)
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

  const fetchAvailabilityOverrides = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/availability`);
      if (res.ok) {
        const data = await res.json();
        setAvailabilityOverrides(data || {});
      }
    } catch (e) {
      console.error('[Availability] Error al cargar overrides:', e);
    }
  };

  // Reset ticket-specific UI states when changing active ticket
  useEffect(() => {
    setSelectedAccountAlert(null);
    setShowBulkSharedInput(false);
    setBulkSharedMessage('');
    setShowVinculosPanel(false);
    setNewMsgText('');
    setChatMessages([]); // Limpiar mensajes del chat anterior de inmediato
  }, [activeChatTicket?.userId]);

  // Poll for tickets and load overrides
  useEffect(() => {
    if (agentEmail) {
      fetchAvailabilityOverrides();
    }
  }, [agentEmail, activeChatTicket?.phone]);

  // Poll for tickets
  useEffect(() => {
    if (agentEmail) {
      fetchTickets(false, chatFilter);
      const interval = setInterval(() => fetchTickets(true, chatFilter), 10000);
      return () => clearInterval(interval);
    }
  }, [agentEmail, chatFilter]);

  // Poll chat messages if a chat is active
  useEffect(() => {
    if (!activeChatTicket) return;
    
    fetchChatMessages(false); // Carga inicial no silenciosa para mostrar el spinner de carga
    const interval = setInterval(() => fetchChatMessages(true), 4000); // Polling silencioso
    return () => clearInterval(interval);
  }, [activeChatTicket?.phone]);

  // Check which accounts of the active ticket have RPA recipes configured
  useEffect(() => {
    if (!activeChatTicket || !activeChatTicket.accounts || activeChatTicket.accounts.length === 0) {
      setRpaRecipesMap({});
      return;
    }

    const checkRpaRecipes = async () => {
      const newMap: Record<string, { recipeId: number; name: string } | null> = {};
      const promises = activeChatTicket.accounts!.map(async (acc) => {
        if (!acc.correo) return;
        try {
          const res = await fetch(`${getApiUrl()}/api/admin/rpa/check-recipe?email=${encodeURIComponent(acc.correo)}`);
          const data = await res.json();
          if (data.success && data.hasRecipe) {
            newMap[acc.correo] = { recipeId: data.recipeId, name: data.recipeName };
          } else {
            newMap[acc.correo] = null;
          }
        } catch (e) {
          console.error('[RPA Check] Error buscando receta:', e);
          newMap[acc.correo] = null;
        }
      });

      await Promise.all(promises);
      setRpaRecipesMap(newMap);
    };

    checkRpaRecipes();
  }, [activeChatTicket?.phone]);

  // Scroll to bottom on new messages
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    
    const currentPhone = activeChatTicket?.phone || '';
    const isNewChat = currentPhone !== lastActivePhoneRef.current;
    const isCloseToBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    
    if (isNewChat || isCloseToBottom) {
      container.scrollTo({ top: container.scrollHeight, behavior: isNewChat ? 'auto' : 'smooth' });
      lastActivePhoneRef.current = currentPhone;
    }
  }, [chatMessages, activeChatTicket?.phone]);

  const fetchChatMessages = async (isSilent = false) => {
    if (!activeChatTicket) return;
    if (!isSilent) setLoadingChat(true);
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/chat-messages?phone=${activeChatTicket.userId}`);
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
        body: JSON.stringify({ phone: activeChatTicket.userId })
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

  const fetchClientProfile = async (phone: string, force = false) => {
    setProfileLoading(true);
    setShowClientProfileModal(true);
    setProfileData(null);
    setProfileEditing(null);
    if (activeChatTicket) {
      setTicketTotal(activeChatTicket.total !== undefined && activeChatTicket.total !== null ? activeChatTicket.total : null);
      setTicketSaldo(activeChatTicket.saldo !== undefined && activeChatTicket.saldo !== null ? activeChatTicket.saldo : null);
    } else {
      setTicketTotal(null);
      setTicketSaldo(null);
    }
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/client-history?phone=${phone}${force ? '&force=true' : ''}`);
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        setProfileEditing({
          phone: data.phone || phone,
          fullname: data.fullname || '',
          email: data.email || '',
          notes: data.notes || ''
        });
      }
    } catch (e) {
      console.error("Error fetching client profile:", e);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveProfileNotes = async () => {
    if (!profileEditing) return;
    setProfileSaving(true);
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/client-history/save-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileEditing)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProfileData((prev: any) => prev ? { ...prev, fullname: profileEditing.fullname, email: profileEditing.email, notes: profileEditing.notes } : null);
          
          // Update activeChatTicket
          if (activeChatTicket && (activeChatTicket.phone === profileEditing.phone || activeChatTicket.userId === profileEditing.phone)) {
            setActiveChatTicket((prev: any) => prev ? { ...prev, name: profileEditing.fullname, fullname: profileEditing.fullname } : null);
          }
          
          // Update tickets list
          setTickets((prev: any[]) => prev.map(t => {
            const cleanT = t.phone ? t.phone.replace(/\D/g, '') : '';
            const cleanP = profileEditing.phone.replace(/\D/g, '');
            if (cleanT.endsWith(cleanP.slice(-10))) {
              return { ...t, name: profileEditing.fullname, fullname: profileEditing.fullname };
            }
            return t;
          }));
        }
      }
    } catch (e) {
      console.error("Error saving profile notes:", e);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSaveTicketState = async () => {
    if (!activeChatTicket) return;
    setUpdatingTicketState(true);
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/tickets/update-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: activeChatTicket.phone,
          total: ticketTotal,
          saldo: ticketSaldo,
          password: 'admin123'
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Actualizar en el estado local de activeChatTicket
          setActiveChatTicket((prev: any) => prev ? { ...prev, total: ticketTotal, saldo: ticketSaldo } : null);
          
          // Actualizar en la lista de tickets
          setTickets((prev: any[]) => prev.map(t => {
            if (t.phone === activeChatTicket.phone || t.userId === activeChatTicket.userId) {
              return { ...t, total: ticketTotal, saldo: ticketSaldo };
            }
            return t;
          }));
          alert('Cobro del ticket actualizado correctamente en la memoria del bot.');
        }
      }
    } catch (e) {
      console.error("Error updating ticket state:", e);
      alert('Error al actualizar el cobro.');
    } finally {
      setUpdatingTicketState(false);
    }
  };

  const handleSendChatMessage = async (textToSend = newMsgText) => {
    if (!activeChatTicket || !textToSend.trim() || sendingMsg) return;
    setSendingMsg(true);
    const apiUrl = getApiUrl();
    
    // Add optimistic message immediately to the UI
    const tempId = `optimistic_${Date.now()}`;
    const tempMsg = {
      id: tempId,
      body: textToSend,
      fromMe: true,
      timestamp: Date.now(),
      type: 'text' as const,
      hasMedia: false,
      mediaPath: '',
      mediaMime: '',
      failed: false,
      sending: true
    };
    
    setChatMessages(prev => [...prev, tempMsg]);
    setNewMsgText(''); // Clear input immediately
    
    try {
      const res = await fetch(`${apiUrl}/api/admin/chat-messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: activeChatTicket.userId,
          message: textToSend,
          emoji: advisorEmoji,
          agentName: agentName,
          password: 'admin123'
        })
      });
      const data = await res.json();
      if (data.success) {
        // Fetch fresh chat messages list
        fetchChatMessages(true);
        logAuditAction('SEND_MESSAGE', { ticketPhone: activeChatTicket.phone, textLength: textToSend.length });
        if (!activeChatTicket.agent) {
          setActiveChatTicket(prev => prev ? { ...prev, agent: agentName } : null);
        }
        setTickets(prev => prev.map(t => t.userId === activeChatTicket.userId ? { ...t, lastMessage: textToSend, lastMessageTime: Date.now(), agent: t.agent || agentName } : t));
      } else {
        throw new Error(data.message || "Error al enviar");
      }
    } catch (err) {
      // Remove optimistic message on failure
      setChatMessages(prev => prev.filter(m => m.id !== tempId));
      
      const failedMsg = {
        id: `failed_${Date.now()}`,
        body: textToSend,
        type: 'text' as const,
        timestamp: Date.now(),
        phone: activeChatTicket.userId
      };
      setFailedMessages(prev => [...prev, failedMsg]);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicketPhone.trim()) {
      alert("Por favor ingresa un número de teléfono.");
      return;
    }
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/tickets/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: newTicketPhone,
          name: newTicketName || undefined,
          reason: newTicketReason || undefined,
          agentName: agentName,
          password: 'admin123'
        })
      });
      const data = await res.json();
      if (data.success && data.ticket) {
        setTickets(prev => {
          const filtered = prev.filter(t => t.userId !== data.ticket.userId);
          return [data.ticket, ...filtered];
        });
        setActiveChatTicket(data.ticket);
        setShowCreateTicketModal(false);
        setNewTicketPhone('');
        setNewTicketName('');
        setNewTicketReason('');
        setTimeout(() => fetchChatMessages(true), 300);
      } else {
        alert(data.message || "Error al crear el ticket");
      }
    } catch (e: any) {
      console.error(e);
      alert("Error de conexión al servidor: " + e.message);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error al iniciar grabación de audio:", err);
      alert("No se pudo acceder al micrófono. Por favor verifica los permisos del navegador.");
    }
  };

  const stopRecording = async (shouldSend: boolean) => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      setIsRecording(false);
      return;
    }

    setIsRecording(false);

    const processRecording = new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        const stream = recorder.stream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        if (shouldSend && audioChunksRef.current.length > 0 && activeChatTicket) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg; codecs=opus' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            const apiUrl = getApiUrl();
            try {
              const res = await fetch(`${apiUrl}/api/admin/chat-messages/send-audio`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  phone: activeChatTicket.userId,
                  audio: base64Audio,
                  mimetype: 'audio/ogg',
                  agentName: agentName,
                  password: 'admin123'
                })
              });
              const data = await res.json();
              if (data.success) {
                fetchChatMessages(true);
                logAuditAction('SEND_VOICE_NOTE', { ticketPhone: activeChatTicket.phone });
                if (!activeChatTicket.agent) {
                  setActiveChatTicket(prev => prev ? { ...prev, agent: agentName } : null);
                }
                fetchTickets(true);
              } else {
                throw new Error(data.message || "Error al enviar audio");
              }
            } catch (err) {
              console.error("Error connection sending audio", err);
              const failedAudio = {
                id: `failed_${Date.now()}`,
                body: '',
                type: 'audio' as const,
                mediaPath: '',
                mediaMime: 'audio/ogg',
                base64Audio: base64Audio,
                timestamp: Date.now(),
                phone: activeChatTicket.userId
              };
              setFailedMessages(prev => [...prev, failedAudio]);
            }
          };
        }
        resolve();
      };
    });

    recorder.stop();
    await processRecording;
  };

  const formatDuration = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleRetryMessage = async (failedMsg: typeof failedMessages[0]) => {
    if (!activeChatTicket) return;
    const apiUrl = getApiUrl();

    try {
      if (failedMsg.type === 'text') {
        const res = await fetch(`${apiUrl}/api/admin/chat-messages/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: failedMsg.phone,
            message: failedMsg.body,
            emoji: advisorEmoji,
            agentName: agentName,
            password: 'admin123'
          })
        });
        const data = await res.json();
        if (data.success) {
          setFailedMessages(prev => prev.filter(m => m.id !== failedMsg.id));
          fetchChatMessages(true);
          logAuditAction('SEND_MESSAGE', { ticketPhone: activeChatTicket.phone, textLength: failedMsg.body.length });
          if (!activeChatTicket.agent) {
            setActiveChatTicket(prev => prev ? { ...prev, agent: agentName } : null);
          }
          fetchTickets(true);
        } else {
          alert(`Error al reintentar: ${data.message}`);
        }
      } else if (failedMsg.type === 'audio' && failedMsg.base64Audio) {
        const res = await fetch(`${apiUrl}/api/admin/chat-messages/send-audio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: failedMsg.phone,
            audio: failedMsg.base64Audio,
            mimetype: 'audio/ogg',
            agentName: agentName,
            password: 'admin123'
          })
        });
        const data = await res.json();
        if (data.success) {
          setFailedMessages(prev => prev.filter(m => m.id !== failedMsg.id));
          fetchChatMessages(true);
          logAuditAction('SEND_VOICE_NOTE', { ticketPhone: activeChatTicket.phone });
          if (!activeChatTicket.agent) {
            setActiveChatTicket(prev => prev ? { ...prev, agent: agentName } : null);
          }
          fetchTickets(true);
        } else {
          alert(`Error al reintentar envío de audio: ${data.message}`);
        }
      }
    } catch (err) {
      alert("Error de conexión al reintentar envío.");
    }
  };

  const handleDismissFailedMessage = (id: string) => {
    setFailedMessages(prev => prev.filter(m => m.id !== id));
  };

  const handleExecuteRpaFromChat = async (email: string, recipeId: number) => {
    // Prevent running multiple times for the same account concurrently
    if (rpaRunningMap[email]?.loading) return;

    setRpaRunningMap(prev => ({
      ...prev,
      [email]: { loading: true, progress: 'Iniciando navegador en el servidor...' }
    }));

    try {
      const res = await fetch(`${getApiUrl()}/api/admin/rpa/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId,
          variables: { CUSTOMER_EMAIL: email },
          password: 'admin123'
        })
      });
      const data = await res.json();

      if (data.success && data.jobId) {
        const jobId = data.jobId;
        
        // Start polling the job status
        const interval = setInterval(async () => {
          try {
            const statusRes = await fetch(`${getApiUrl()}/api/admin/rpa/job-status/${jobId}`);
            const statusData = await statusRes.json();

            if (statusData.success && statusData.job) {
              const job = statusData.job;
              const isFinished = job.status !== 'running';

              setRpaRunningMap(prev => ({
                ...prev,
                [email]: {
                  loading: !isFinished,
                  progress: job.progress || 'Procesando en segundo plano...'
                }
              }));

              if (isFinished) {
                clearInterval(interval);
                
                if (job.status === 'success') {
                  const code = Object.values(job.result || {}).find((v: any) => v && v.toString().trim().length >= 4);
                  if (code) {
                    setNewMsgText(prev => prev + (prev ? ' ' : '') + code);
                  } else {
                    setNewMsgText(prev => prev + (prev ? '\n' : '') + 'Automatización completada. No se pudo leer el código en pantalla.');
                  }
                } else {
                  // If it failed or has a warning (like the 20 minutes expiration warning)
                  const errorMsg = job.error || 'La receta falló en su ejecución.';
                  setNewMsgText(prev => prev + (prev ? '\n' : '') + errorMsg);
                }
              }
            }
          } catch (pollErr) {
            console.error('[RPA Poll Chat Error]', pollErr);
          }
        }, 3000);

      } else {
        setRpaRunningMap(prev => ({
          ...prev,
          [email]: { loading: false, progress: '' }
        }));
        alert(data.error || 'No se pudo iniciar la tarea RPA.');
      }
    } catch (err: any) {
      setRpaRunningMap(prev => ({
        ...prev,
        [email]: { loading: false, progress: '' }
      }));
      alert('Error de red al intentar ejecutar la receta RPA: ' + err.message);
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

  const handleForceBotReply = async (phone: string) => {
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/tickets/force-bot-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: 'admin123' })
      });
      const result = await res.json();
      if (!result.success) {
        alert(`❌ Error: ${result.message}`);
      } else {
        // Cambiar el modo visual a bot ya que fue liberado
        setTickets(prev => prev.map(t => t.phone === phone ? { ...t, waitingHumanMode: 'bot' } : t));
        if (activeChatTicket && activeChatTicket.phone === phone) {
          setActiveChatTicket(prev => prev ? { ...prev, waitingHumanMode: 'bot' } : null);
        }
      }
      fetchTickets(true);
    } catch (err) {
      alert('❌ Error al forzar respuesta del bot.');
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
        body: JSON.stringify({ phone, password: 'admin123', resolveAll, agentName })
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

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este mensaje de WhatsApp (para todos) y de la base de datos?')) return;
    const apiUrl = getApiUrl();
    try {
      // Optimistic delete
      setChatMessages(prev => prev.filter(m => m.id !== messageId));

      const res = await fetch(`${apiUrl}/api/admin/chat-messages/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, password: 'admin123' })
      });
      const result = await res.json();
      if (result.success) {
        logAuditAction('DELETE_MESSAGE', { ticketPhone: activeChatTicket?.phone, messageId });
        fetchChatMessages(true);
      } else {
        alert(`❌ Error: ${result.message}`);
        fetchChatMessages(true);
      }
    } catch (e) {
      alert('❌ Error al conectar con el backend.');
      fetchChatMessages(true);
    }
  };

  const handleSaveEditMessage = async () => {
    if (!editingMessage) return;
    const { id, body } = editingMessage;
    const apiUrl = getApiUrl();
    try {
      // Optimistic edit
      setChatMessages(prev => prev.map(m => m.id === id ? { ...m, body } : m));
      setEditingMessage(null);

      const res = await fetch(`${apiUrl}/api/admin/chat-messages/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: id, newBody: body, password: 'admin123' })
      });
      const result = await res.json();
      if (result.success) {
        logAuditAction('EDIT_MESSAGE', { ticketPhone: activeChatTicket?.phone, messageId: id });
        fetchChatMessages(true);
      } else {
        alert(`❌ Error: ${result.message}`);
        fetchChatMessages(true);
      }
    } catch (e) {
      alert('❌ Error al conectar con el backend.');
      fetchChatMessages(true);
    }
  };

  const handleArchiveTicket = async (phone: string) => {
    if (!window.confirm("¿Deseas archivar y quitar este ticket de la lista de resueltos?")) return;
    
    // Optimistic UI update
    setTickets(prev => prev.filter(t => t.phone !== phone));
    
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/tickets/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: 'admin123' })
      });
      const result = await res.json();
      if (!result.success) {
        alert(`❌ Error: ${result.message}`);
      }
      fetchTickets(true);
    } catch (e) {
      console.error("Error archiving ticket:", e);
      fetchTickets(true);
    }
  };

  const findSharedTicketsWithDetails = (ticket: Ticket) => {
    if (!ticket.accounts || ticket.accounts.length === 0) return [];
    
    // Create strict keys combining platform and email to identify shared accounts correctly
    const ticketAccountKeys = ticket.accounts
      .map(a => `${String(a.streaming || '').toLowerCase().trim()}|${String(a.correo || '').toLowerCase().trim()}`)
      .filter(Boolean);

    if (ticketAccountKeys.length === 0) return [];

    return tickets
      .filter(t => t.userId !== ticket.userId)
      .map(t => {
        if (!t.accounts) return null;
        const matchingAccounts = t.accounts.filter(a => {
          const key = `${String(a.streaming || '').toLowerCase().trim()}|${String(a.correo || '').toLowerCase().trim()}`;
          return key && ticketAccountKeys.includes(key);
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
    const nameMatches = String(t.nombre || '').toLowerCase().includes(term);
    const phoneMatches = String(t.phone || '').includes(term);
    const summaryMatches = String(t.summary || '').toLowerCase().includes(term);
    const accountMatches = t.accounts?.some(acc =>
      String(acc.correo || '').toLowerCase().includes(term) ||
      String(acc.streaming || '').toLowerCase().includes(term)
    );
    return nameMatches || phoneMatches || summaryMatches || accountMatches;
  });

  // Filter columns
  const activeTickets = filteredTickets.filter(t => t.state !== 'resolved' && !t.isProbablyFinished);
  const probablyFinishedTickets = filteredTickets.filter(t => t.isProbablyFinished && t.state !== 'resolved');
  const archivedTickets = filteredTickets.filter(t => t.state === 'resolved');

  const unassignedTickets = activeTickets.filter(t => !t.agent).sort((a, b) => {
    if (a.queuePosition != null && b.queuePosition != null) {
      return a.queuePosition - b.queuePosition;
    }
    if (a.queuePosition != null) return -1;
    if (b.queuePosition != null) return 1;
    const timeA = a.lastMessageTime || 0;
    const timeB = b.lastMessageTime || 0;
    return timeB - timeA;
  });
  const myTickets = activeTickets.filter(t => t.agent && String(t.agent).toLowerCase().trim() === safeAgentName);
  const otherTickets = activeTickets.filter(t => t.agent && String(t.agent).toLowerCase().trim() !== safeAgentName);

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

  const renderCompactTicketItem = (t: Ticket, prefix = 'ticket') => {
    const isActive = activeChatTicket?.userId === t.userId;
    const isBotMode = t.waitingHumanMode === 'bot';
    const timeFormatted = formatTimeDiff(t.lastMessageTime);
    const sharedWithDetails = findSharedTicketsWithDetails(t);
    const hasShared = sharedWithDetails.length > 0;
    const cleanTicketAgent = (t.agent || '').toLowerCase().trim();

    return (
      <div
        key={`${prefix}_${t.userId}`}
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
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[9px] text-gray-400 font-mono">
              {timeFormatted ? timeFormatted.replace('Hace ', '') : ''}
            </span>
            {t.state === 'resolved' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleArchiveTicket(t.phone);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-450 hover:text-red-500 rounded transition-colors"
                title="Archivar / Ocultar"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {t.state === 'resolved' && (
            <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[8px] font-bold px-1.5 py-0.2 rounded">
              ✅ Resuelto {t.agent ? `por ${t.agent}` : ''}
            </span>
          )}
          {t.isProbablyFinished && t.state !== 'resolved' && (
            <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-755 dark:text-blue-305 text-[8px] font-bold px-1.5 py-0.2 rounded" title="La Inteligencia Artificial determinó que este chat no requiere atención inmediata o ya finalizó">
              ✓ Terminado (IA)
            </span>
          )}
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
    <div className={isFullscreen ? "fixed inset-0 z-[9999] w-screen h-screen max-w-none m-0 p-6 bg-white dark:bg-gray-900 flex flex-col overflow-hidden" : "bg-white dark:bg-gray-900 rounded-2xl shadow-md border dark:border-gray-800 p-6 relative"}>
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
            onClick={() => {
              setShowMetricsModal(true);
              fetchMetrics();
            }}
            className="p-2 text-gray-660 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border dark:border-gray-700 flex items-center gap-1.5 text-xs font-bold"
            title="Ver Métricas de Desempeño"
          >
            <TrendingUp className="w-4 h-4 text-brand-primary" /> Métricas
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-660 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border dark:border-gray-700 flex items-center gap-1 text-xs font-bold"
            title={isFullscreen ? "Restaurar Pantalla" : "Pantalla Completa"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-brand-primary" /> Restaurar
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-brand-primary" /> Pantalla Completa
              </>
            )}
          </button>
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
      ) : (
        <div className={isFullscreen ? "grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow min-h-0 border dark:border-gray-850 rounded-2xl overflow-hidden bg-gray-50/20 dark:bg-gray-900/10" : "grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px] h-[calc(100vh-250px)] border dark:border-gray-850 rounded-2xl overflow-hidden bg-gray-50/20 dark:bg-gray-900/10"}>
          
          {/* LEFT COLUMN: Collapsible Categories (col-span-5) */}
          <div className="lg:col-span-5 border-r dark:border-gray-850 flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
            {/* Search Box */}
            <div className="p-4 border-b dark:border-gray-850 bg-gray-50/50 dark:bg-gray-900/50 flex gap-2">
              <div className="relative shadow-sm rounded-xl flex-grow">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, teléfono, cuenta o servicio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-750 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition-all duration-200"
                />
              </div>
              <button
                onClick={() => setShowCreateTicketModal(true)}
                className="p-2.5 bg-brand-primary hover:bg-brand-dark text-white rounded-xl flex items-center justify-center shadow-sm transition-all duration-200 active:scale-95"
                title="Iniciar nuevo chat / ticket"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="px-4 py-2 border-b dark:border-gray-850 bg-gray-50/30 dark:bg-gray-900/30 flex gap-1 text-xs">
              <button
                onClick={() => setChatFilter('my')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-center transition-all ${
                  chatFilter === 'my'
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Mis Tickets
              </button>
              <button
                onClick={() => setChatFilter('all_tickets')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-center transition-all ${
                  chatFilter === 'all_tickets'
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Tickets Activos
              </button>
              <button
                onClick={() => setChatFilter('all_chats')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-center transition-all ${
                  chatFilter === 'all_chats'
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Todos los Chats
              </button>
            </div>

            {/* Accordion / Flat List */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {chatFilter === 'my' && (
                <div className="space-y-2">
                  {myTickets.length === 0 ? (
                    <p className="text-center py-8 text-xs text-gray-450 italic">No tienes tickets asignados en este momento.</p>
                  ) : (
                    myTickets.map(t => renderCompactTicketItem(t, 'my'))
                  )}
                </div>
              )}

              {chatFilter === 'all_chats' && (
                <div className="space-y-2">
                  {filteredTickets.length === 0 ? (
                    <p className="text-center py-8 text-xs text-gray-450 italic">No se encontraron chats.</p>
                  ) : (
                    filteredTickets.map(t => renderCompactTicketItem(t, 'chat'))
                  )}
                </div>
              )}

              {chatFilter === 'all_tickets' && (
                <>
                  {renderAccordionSection(
                    'me',
                    'Mis Tickets',
                    <User className="w-4 h-4 text-emerald-500" />,
                    myTickets.length,
                    myTickets.length === 0 ? (
                      <p className="text-center py-4 text-xs text-gray-450 italic">No tienes tickets asignados.</p>
                    ) : (
                      myTickets.map(t => renderCompactTicketItem(t, 'my'))
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
                      unassignedTickets.map(t => renderCompactTicketItem(t, 'free'))
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
                      otherTickets.map(t => renderCompactTicketItem(t, 'other'))
                    )
                  )}

                  {renderAccordionSection(
                    'probablyFinished',
                    'Por Salir / Probablemente Terminados (IA)',
                    <CheckCircle className="w-4 h-4 text-blue-500" />,
                    probablyFinishedTickets.length,
                    probablyFinishedTickets.length === 0 ? (
                      <p className="text-center py-4 text-xs text-gray-450 italic">No hay chats probablemente terminados.</p>
                    ) : (
                      probablyFinishedTickets.map(t => renderCompactTicketItem(t, 'probablyFinished'))
                    )
                  )}

                  {renderAccordionSection(
                    'archived',
                    'Archivados / Resueltos',
                    <Archive className="w-4 h-4 text-emerald-600" />,
                    archivedTickets.length,
                    archivedTickets.length === 0 ? (
                      <p className="text-center py-4 text-xs text-gray-450 italic">No hay tickets archivados.</p>
                    ) : (
                      archivedTickets.map(t => renderCompactTicketItem(t, 'archived'))
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
                              {groupTickets.map(t => renderCompactTicketItem(t, `account_${groupName}`))}
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
                              {groupTickets.map(t => renderCompactTicketItem(t, `subject_${groupName}`))}
                            </div>
                          </div>
                        ))
                      )
                    );
                  })()}
                </>
              )}
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
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-450 font-mono">+{activeChatTicket.phone}</span>
                      <button
                        type="button"
                        onClick={() => fetchClientProfile(activeChatTicket.phone)}
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-brand-primary/10 text-brand-primary border-brand-primary/20 hover:bg-brand-primary/20 transition-all flex items-center gap-1 active:scale-95"
                        title="Ver Perfil y Detalles del Cliente"
                      >
                        <User className="w-2.5 h-2.5" />
                        <span>Ver Perfil</span>
                      </button>
                      {activeChatTicket.accounts && activeChatTicket.accounts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowVinculosPanel(!showVinculosPanel)}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all active:scale-95 flex items-center gap-1 ${
                            showVinculosPanel
                              ? 'bg-brand-primary text-white border-brand-primary'
                              : 'bg-brand-primary/10 text-brand-primary border-brand-primary/20 hover:bg-brand-primary/20'
                          }`}
                          title="Mostrar/Ocultar Vínculos y Mensaje Masivo"
                        >
                          <span>🔗 Vínculos ({activeChatTicket.accounts.length})</span>
                        </button>
                      )}
                    </div>
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
                    ) : String(activeChatTicket.agent || '').toLowerCase().trim() === safeAgentName ? (
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

                    <button
                      onClick={() => handleToggleMode(activeChatTicket.phone, activeChatTicket.waitingHumanMode || 'bot')}
                      className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all active:scale-95 flex items-center gap-1 text-white ${
                        (activeChatTicket.waitingHumanMode || 'bot') === 'bot'
                          ? 'bg-purple-600 hover:bg-purple-705'
                          : 'bg-indigo-600 hover:bg-indigo-705'
                      }`}
                      title={(activeChatTicket.waitingHumanMode || 'bot') === 'bot' ? 'El bot responderá automáticamente. Haz clic para pasar a modo manual.' : 'Modo manual activo. El bot está silenciado. Haz clic para reactivar el bot.'}
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>
                        {(activeChatTicket.waitingHumanMode || 'bot') === 'bot' ? 'Modo: Bot' : 'Modo: Asesor'}
                      </span>
                    </button>
                    {(activeChatTicket.waitingHumanMode || 'bot') === 'advisor' && (
                      <button
                        onClick={() => handleForceBotReply(activeChatTicket.phone)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 active:scale-95 animate-fadeIn"
                        title="Fuerza al bot a responder de inmediato al último mensaje del cliente"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>Forzar Respuesta Bot</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-Header: Accounts list & Shared alert (Collapsible) */}
                {showVinculosPanel && (
                  <div className="bg-gray-50/50 dark:bg-gray-950 border-b dark:border-gray-850 p-3 flex flex-col gap-2 animate-fadeIn">
                  {/* Cuentas vinculadas */}
                  {activeChatTicket.accounts && activeChatTicket.accounts.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px] mr-1">Vínculos:</span>
                      {activeChatTicket.accounts.map((acc, idx) => {
                        const emailKey = String(acc.correo || '').toLowerCase().trim();
                        const override = availabilityOverrides[emailKey];
                        const isDown = override && override.immediate === false;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedAccountAlert(acc)}
                            title={`${acc.correo} - Perfil: ${acc.nombrePerfil} (Haz clic para ver alertas y detalles)`}
                            className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all active:scale-95 ${
                              isDown
                                ? 'bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 animate-pulse'
                                : 'bg-brand-primary/10 hover:bg-brand-primary/20 dark:bg-brand-primary/20 text-brand-primary border-brand-primary/20'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isDown ? 'bg-red-500' : 'bg-emerald-500'}`} />
                            <span>📺 {acc.streaming} ({acc.correo.split('@')[0]})</span>
                            {isDown && <span className="text-[8px] bg-red-600 text-white px-1.5 rounded uppercase font-extrabold tracking-wider">Caída</span>}
                          </button>
                        );
                      })}
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
                )}



                {/* Conversation message list */}
                <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 bg-[#efeae2] dark:bg-[#0b0f19] space-y-3 flex flex-col min-h-0">
                  {loadingChat ? (
                    <div className="flex flex-col items-center justify-center my-auto text-gray-400">
                      <RefreshCw className="w-6 h-6 animate-spin text-brand-primary mb-2" />
                      <span className="text-xs">Cargando conversación...</span>
                    </div>
                  ) : (chatMessages.length === 0 && failedMessages.filter(fm => fm.phone === activeChatTicket.userId).length === 0) ? (
                    <div className="text-center my-auto text-xs text-gray-450 italic">
                      No hay mensajes recientes. Escribe uno abajo para iniciar.
                    </div>
                  ) : (
                    (() => {
                      const allMsgs = [
                        ...chatMessages.map(m => ({ ...m, failed: false, base64Audio: '' })),
                        ...failedMessages
                          .filter(fm => fm.phone === activeChatTicket.userId)
                          .map(m => ({
                            id: m.id,
                            body: m.body,
                            fromMe: true,
                            timestamp: m.timestamp,
                            type: m.type,
                            hasMedia: m.type === 'audio',
                            mediaPath: m.mediaPath || '',
                            mediaMime: m.mediaMime || '',
                            base64Audio: m.base64Audio || '',
                            failed: true,
                            phone: m.phone
                          }))
                      ].sort((a, b) => a.timestamp - b.timestamp);

                      return allMsgs.map((msg, idx) => {
                        const isMe = msg.fromMe;
                        const claudeLink = detectClaudeLink(msg.body);
                      
                      const prevMsg = chatMessages[idx - 1];
                      const showDateSeparator = !prevMsg || 
                        new Date(msg.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString();

                      return (
                        <React.Fragment key={msg.id || idx}>
                          {showDateSeparator && (
                            <div className="flex justify-center my-3 w-full">
                              <span className="bg-white/90 dark:bg-gray-850 text-gray-600 dark:text-gray-400 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm border dark:border-gray-750">
                                {formatMessageDate(msg.timestamp)}
                              </span>
                            </div>
                          )}
                          <div
                            onContextMenu={(e) => {
                              if (msg.failed || msg.id?.startsWith('optimistic_') || msg.sending) return;
                              e.preventDefault();
                              setContextMenu({
                                x: e.clientX,
                                y: e.clientY,
                                messageId: msg.id,
                                messageBody: msg.body || '',
                                isFromMe: isMe
                              });
                            }}
                            className={`max-w-[75%] p-3 rounded-2xl text-xs flex flex-col gap-1 shadow-sm leading-relaxed select-none cursor-context-menu group ${
                              isMe
                                ? 'bg-brand-primary/10 border border-brand-primary/20 dark:border-brand-primary/30 text-gray-850 dark:text-brand-light ml-auto rounded-tr-none'
                                : 'bg-white dark:bg-gray-850 dark:text-gray-150 rounded-tl-none border border-gray-200/80 dark:border-gray-750'
                            }`}
                          >
                            <p className="whitespace-pre-wrap font-medium">
                              {msg.body || (msg.hasMedia ? '📷 Foto' : '')}
                            </p>

                            {msg.hasMedia && (msg.mediaPath || msg.base64Audio) && (
                              <div className="mt-1.5 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-750 bg-gray-50 dark:bg-gray-900 w-fit max-w-full">
                                {msg.mediaMime?.startsWith('image/') ? (
                                  <img
                                    src={`${getApiUrl()}/${msg.mediaPath}`}
                                    alt="Imagen de chat"
                                    className="max-w-full h-auto object-cover max-h-60 rounded cursor-pointer hover:opacity-95 transition-opacity"
                                    onClick={() => window.open(`${getApiUrl()}/${msg.mediaPath}`, '_blank')}
                                  />
                                ) : msg.mediaMime?.startsWith('audio/') ? (
                                  <div className="p-2.5 flex flex-col gap-1 min-w-[240px]">
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">🎙️ Nota de Voz</span>
                                    <audio
                                      src={msg.failed ? msg.base64Audio : `${getApiUrl()}/${msg.mediaPath}`}
                                      controls
                                      className="max-w-full h-8 outline-none"
                                    />
                                  </div>
                                ) : (
                                  <a
                                    href={`${getApiUrl()}/${msg.mediaPath}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 p-2.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    📁 Descargar archivo ({msg.mediaMime || 'documento'})
                                  </a>
                                )}
                              </div>
                            )}

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
                            {msg.failed && (
                              <div className="mt-1 flex items-center justify-end gap-1.5 text-[9px] text-red-500 font-bold border-t dark:border-gray-800/40 pt-1.5">
                                <span>⚠️ No enviado</span>
                                <button
                                  type="button"
                                  onClick={() => handleRetryMessage(msg)}
                                  className="underline hover:text-red-700 active:scale-95"
                                >
                                  Reintentar
                                </button>
                                <span>•</span>
                                <button
                                  type="button"
                                  onClick={() => handleDismissFailedMessage(msg.id)}
                                  className="underline hover:text-red-700 active:scale-95"
                                >
                                  Descartar
                                </button>
                              </div>
                            )}
                            <span className={`text-[9px] text-right block ml-auto ${isMe ? 'text-gray-500 dark:text-brand-dark/70' : 'text-gray-400 dark:text-gray-500'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </React.Fragment>
                      );
                    });
                  })()
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="p-4 bg-white dark:bg-gray-900 border-t dark:border-gray-850 flex flex-col gap-3">


                  {/* Atajos Clickables (Collapsible) */}
                  {showShortcutsBar && (
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
                        {rpaRecipesMap[acc.correo] && (
                          <button
                            type="button"
                            disabled={rpaRunningMap[acc.correo]?.loading}
                            onClick={() => handleExecuteRpaFromChat(acc.correo, rpaRecipesMap[acc.correo]!.recipeId)}
                            className={`text-[10px] px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-all active:scale-95 ${
                              rpaRunningMap[acc.correo]?.loading
                                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 animate-pulse cursor-wait'
                                : 'bg-emerald-100 hover:bg-emerald-250 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/30'
                            }`}
                            title={rpaRunningMap[acc.correo]?.loading ? rpaRunningMap[acc.correo].progress : `Ejecutar Receta RPA: ${rpaRecipesMap[acc.correo]!.name}`}
                          >
                            {rpaRunningMap[acc.correo]?.loading ? (
                              <>
                                <div className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                                <span>{rpaRunningMap[acc.correo].progress.split(':')[0]}</span>
                              </>
                            ) : (
                              <>
                                <span>⚡ RPA</span>
                              </>
                            )}
                          </button>
                        )}
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
                  )}

                  {isRecording ? (
                    <div className="flex gap-2 items-center bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 p-2 rounded-xl w-full animate-fadeIn">
                      <div className="flex items-center gap-2 flex-grow pl-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
                        <span className="text-xs font-bold text-red-600 dark:text-red-400 font-mono">
                          Grabando nota de voz: {formatDuration(recordingDuration)}
                        </span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => stopRecording(false)}
                        className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-red-650 rounded-xl transition-all active:scale-95 flex items-center justify-center shrink-0"
                        title="Cancelar grabación"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => stopRecording(true)}
                        className="p-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all active:scale-95 flex items-center justify-center shrink-0"
                        title="Enviar nota de voz"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendChatMessage();
                      }}
                      className="flex gap-2 items-center"
                    >
                      <button
                        type="button"
                        onClick={() => setShowShortcutsBar(!showShortcutsBar)}
                        className={`p-2.5 rounded-xl border transition-all active:scale-95 flex items-center justify-center shrink-0 ${
                          showShortcutsBar
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-500 border-gray-250 dark:border-gray-700'
                        }`}
                        title="Mostrar/Ocultar barra de atajos rápidos"
                      >
                        <Keyboard className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={startRecording}
                        className="p-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-550 border border-gray-250 dark:border-gray-700 rounded-xl transition-all active:scale-95 flex items-center justify-center shrink-0"
                        title="Grabar nota de voz"
                      >
                        <Mic className="w-4 h-4 text-brand-primary" />
                      </button>

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
                          placeholder={sendingMsg ? "Enviando mensaje..." : "Escribe un mensaje de respuesta (Usa / para atajos)..."}
                          disabled={sendingMsg}
                          className="w-full px-4 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border dark:border-gray-750 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-60"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!newMsgText.trim() || sendingMsg}
                        className="p-2.5 bg-brand-primary hover:bg-brand-dark text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  )}
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

      {/* Account Details & Availability Alerts Modal (Unified Menu) */}
      {selectedAccountAlert && (() => {
        const emailKey = String(selectedAccountAlert.correo || '').toLowerCase().trim();
        const override = availabilityOverrides[emailKey];
        const isDown = override && override.immediate === false;
        
        // Find other active tickets sharing this account strictly (matching platform + email)
        const sharedTickets = tickets.filter(t => {
          if (t.userId === activeChatTicket?.userId || !t.accounts) return false;
          // Filter to tickets in waiting_human / awaiting states
          const pendingStates = ['waiting_human', 'awaiting_payment_confirmation', 'waiting_admin_confirmation'];
          if (!pendingStates.includes(t.state)) return false;

          return t.accounts.some(a => 
            String(a.correo || '').toLowerCase().trim() === emailKey &&
            String(a.streaming || '').toLowerCase().trim() === String(selectedAccountAlert.streaming || '').toLowerCase().trim()
          );
        });

        // Calculate days elapsed if reported
        let daysElapsedText = "N/A";
        if (isDown && override.reason) {
          const reportDate = new Date(override.reason);
          if (!isNaN(reportDate.getTime())) {
            const diffTime = Math.abs(Date.now() - reportDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;
            daysElapsedText = diffDays <= 0 ? "Hoy mismo" : `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
          }
        }

        const handleSaveAvailability = async (immediate: boolean, incidentMsg: string) => {
          const updatedOverrides = { ...availabilityOverrides };
          if (immediate) {
            delete updatedOverrides[emailKey];
          } else {
            // Store the current date as ISO string in the reason field to track days elapsed
            updatedOverrides[emailKey] = {
              immediate: false,
              incident: incidentMsg || 'Falla técnica general',
              reason: new Date().toISOString()
            };
          }

          try {
            const res = await fetch(`${getApiUrl()}/api/admin/availability/save`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ config: updatedOverrides, password: 'admin123' })
            });
            const data = await res.json();
            if (data.success) {
              setAvailabilityOverrides(updatedOverrides);
              setSelectedAccountAlert(null);
            } else {
              alert("Error al guardar estado: " + data.message);
            }
          } catch (err) {
            alert("Error al comunicar con el servidor.");
          }
        };

        return (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border dark:border-gray-800 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-5 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    📺 Detalle de Cuenta Vinculada
                  </h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">{selectedAccountAlert.correo}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAccountAlert(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-sm p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto space-y-5 flex-grow">
                {/* Info Card */}
                <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border dark:border-gray-850">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase block">Plataforma</span>
                    <span className="text-xs font-bold text-gray-800 dark:text-white capitalize">{selectedAccountAlert.streaming}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase block">Perfil del Cliente</span>
                    <span className="text-xs font-bold text-gray-850 dark:text-white">{selectedAccountAlert.nombrePerfil || 'N/A'}</span>
                  </div>
                </div>

                {/* Availability State Banner */}
                <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${
                  isDown 
                    ? 'bg-red-50/70 border-red-200 dark:bg-red-950/20 dark:border-red-900/30' 
                    : 'bg-emerald-50/70 border-emerald-250 dark:bg-emerald-950/20 dark:border-emerald-900/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${isDown ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
                      <span className={`text-xs font-extrabold uppercase ${isDown ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                        {isDown ? '⚠️ Cuenta Caída / Inhabilitada' : '🟢 Cuenta Activa (OK)'}
                      </span>
                    </div>
                  </div>

                  {isDown && (
                    <div className="text-xs text-red-650 dark:text-red-350/90 font-medium space-y-1 bg-white dark:bg-gray-900/60 p-3 rounded-xl border dark:border-gray-800">
                      <p><strong>Motivo:</strong> "{override.incident || 'Falla técnica general'}"</p>
                      <p><strong>Tiempo de espera:</strong> {daysElapsedText} ({override.reason ? new Date(override.reason).toLocaleDateString() : 'N/A'})</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-1">
                    {isDown ? (
                      <button
                        type="button"
                        onClick={() => handleSaveAvailability(true, '')}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-500/20 hover:scale-[1.02] active:scale-95"
                      >
                        ✅ Resolver / Activar Cuenta
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const reason = prompt("Ingresa el motivo/incidencia de la caída de la cuenta (ej. Caída de hogar, error contraseña):");
                          if (reason !== null) {
                            handleSaveAvailability(false, reason);
                          }
                        }}
                        className="px-3.5 py-2 bg-red-600 hover:bg-red-505 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-red-500/20 hover:scale-[1.02] active:scale-95"
                      >
                        ⚠️ Reportar Falla (Inhabilitar)
                      </button>
                    )}
                  </div>
                </div>

                {/* Shared Clients / Batch support list */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-brand-primary" /> Clientes con Tickets Abiertos en esta Cuenta ({sharedTickets.length})
                  </h4>

                  {sharedTickets.length === 0 ? (
                    <p className="text-xs text-gray-400 italic bg-gray-50 dark:bg-gray-950 p-4 rounded-xl text-center">
                      Ningún otro cliente de soporte comparte esta cuenta en este momento.
                    </p>
                  ) : (
                    <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                      {sharedTickets.map((t, sIdx) => {
                        const matchedAcc = t.accounts?.find(a => String(a.correo || '').toLowerCase().trim() === emailKey);
                        return (
                          <div 
                            key={sIdx}
                            className="p-3 bg-white dark:bg-gray-850 rounded-xl border dark:border-gray-800 flex justify-between items-center text-xs"
                          >
                            <div>
                              <span className="font-bold text-gray-800 dark:text-white block">{t.nombre}</span>
                              <span className="text-[10px] text-gray-400 font-mono">+{t.phone}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-semibold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded capitalize">
                                Perfil: {matchedAcc?.nombrePerfil || 'N/A'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedAccountAlert(null)}
                  className="px-4 py-2 bg-gray-250 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs transition-all active:scale-95"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Metrics Modal */}
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
              className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-650 text-gray-755 dark:text-gray-200 font-bold py-2.5 rounded-xl text-sm transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Metrics Modal */}
      {showMetricsModal && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-primary" /> Métricas de Desempeño y Resoluciones
              </h3>
              <button
                onClick={() => setShowMetricsModal(false)}
                className="text-gray-450 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-semibold p-1.5 hover:bg-gray-150 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              {loadingMetrics ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <RefreshCw className="w-8 h-8 animate-spin text-brand-primary mb-2" />
                  <span className="text-xs">Cargando métricas de resolución...</span>
                </div>
              ) : !metricsData ? (
                <p className="text-center text-sm text-gray-500 italic py-10">No se pudieron cargar los datos.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Weekly Flow Chart - Stacked by Agent with Toggle Filters */}
                  {metricsData.weeklyFlow && metricsData.weeklyFlow.length > 0 && (() => {
                    const AGENT_COLORS: Record<string, string> = {};
                    const palette = ['#2dd4bf', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#f43f5e', '#8b5cf6'];
                    const uniqueAgents: string[] = [];
                    metricsData.weeklyFlow.forEach((r: any) => {
                      if (r.agent && !uniqueAgents.includes(r.agent)) uniqueAgents.push(r.agent);
                    });
                    uniqueAgents.forEach((a, i) => { AGENT_COLORS[a] = palette[i % palette.length]; });

                    const visibleAgents = uniqueAgents.filter(a => !hiddenChartAgents.has(a));

                    const toggleAgent = (agent: string) => {
                      setHiddenChartAgents(prev => {
                        const next = new Set(prev);
                        if (next.has(agent)) next.delete(agent); else next.add(agent);
                        return next;
                      });
                    };

                    // Group by day_label — only visible agents
                    const dayMap: Record<string, Record<string, number>> = {};
                    metricsData.weeklyFlow.forEach((r: any) => {
                      if (hiddenChartAgents.has(r.agent)) return;
                      if (!dayMap[r.day_label]) dayMap[r.day_label] = {};
                      dayMap[r.day_label][r.agent || 'Desconocido'] = (dayMap[r.day_label][r.agent || 'Desconocido'] || 0) + r.count;
                    });

                    // Maintain all day_labels even if a day has 0 after filter
                    const allDayLabels: string[] = [];
                    metricsData.weeklyFlow.forEach((r: any) => {
                      if (!allDayLabels.includes(r.day_label)) allDayLabels.push(r.day_label);
                    });

                    const maxDayTotal = Math.max(...allDayLabels.map(d => {
                      if (!dayMap[d]) return 0;
                      return Object.values(dayMap[d]).reduce((s, v) => s + v, 0);
                    }), 1);

                    return (
                      <div className="md:col-span-12 border-b dark:border-gray-800 pb-6 mb-2">
                        <h4 className="text-xs font-bold text-gray-450 uppercase tracking-wider mb-3">
                          📈 Flujo de Resoluciones Semanal (Últimos 7 Días) — por Asesor
                        </h4>
                        {/* Clickable Legend Toggles */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {uniqueAgents.map(a => {
                            const isHidden = hiddenChartAgents.has(a);
                            return (
                              <button
                                key={a}
                                onClick={() => toggleAgent(a)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                  isHidden
                                    ? 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 bg-transparent opacity-50'
                                    : 'border-transparent text-white'
                                }`}
                                style={!isHidden ? { backgroundColor: AGENT_COLORS[a] } : undefined}
                              >
                                <div
                                  className={`w-2.5 h-2.5 rounded-sm border ${isHidden ? 'border-gray-300 dark:border-gray-600' : 'border-white/30'}`}
                                  style={!isHidden ? { backgroundColor: 'rgba(255,255,255,0.3)' } : undefined}
                                />
                                {a}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex items-end justify-between gap-2 h-36 bg-gray-50/50 dark:bg-gray-850/50 p-4 rounded-2xl border dark:border-gray-800">
                          {allDayLabels.map((dayLabel, idx) => {
                            const agents = dayMap[dayLabel] || {};
                            const dayTotal = Object.values(agents).reduce((s, v) => s + v, 0);
                            const pct = maxDayTotal > 0 ? (dayTotal / maxDayTotal) * 100 : 0;
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 font-mono">{dayTotal}</span>
                                <div 
                                  style={{ height: `${Math.max(pct, dayTotal > 0 ? 5 : 2)}%` }} 
                                  className="w-full max-w-[32px] rounded-t-lg overflow-hidden flex flex-col-reverse relative group"
                                  title={Object.entries(agents).map(([a, c]) => `${a}: ${c}`).join(' | ')}
                                >
                                  {visibleAgents.map(agent => {
                                    const agentCount = agents[agent] || 0;
                                    if (agentCount === 0) return null;
                                    const agentPct = dayTotal > 0 ? (agentCount / dayTotal) * 100 : 0;
                                    return (
                                      <div
                                        key={agent}
                                        style={{ height: `${agentPct}%`, backgroundColor: AGENT_COLORS[agent] }}
                                        className="w-full transition-all duration-300 hover:brightness-110"
                                      />
                                    );
                                  })}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-850 text-white text-[9px] px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                    {Object.entries(agents).map(([a, c]) => `${a}: ${c}`).join(' · ')}
                                  </div>
                                </div>
                                <span className="text-[9px] text-gray-400 dark:text-gray-500 font-semibold">{dayLabel}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Summary Leaderboard */}
                  <div className="md:col-span-5 space-y-6">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        ⚡ Resoluciones de Hoy
                      </h4>
                      <div className="space-y-2">
                        {!metricsData.summaryToday || metricsData.summaryToday.length === 0 ? (
                          <p className="text-xs text-gray-450 italic">Ningún asesor ha resuelto tickets hoy.</p>
                        ) : (
                          metricsData.summaryToday.map((row) => (
                            <div key={row.agent} className="flex justify-between items-center p-2.5 rounded-xl bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 text-xs">
                              <span className="font-bold text-gray-700 dark:text-gray-300">👤 {row.agent}</span>
                              <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-black px-2.5 py-0.5 rounded-full">{row.count} hoy</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 border-t dark:border-gray-800 pt-4">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Historial Acumulado
                      </h4>
                      <div className="space-y-2">
                        {metricsData.summary.length === 0 ? (
                          <p className="text-xs text-gray-450 italic">Sin registros de resoluciones aún.</p>
                        ) : (
                          metricsData.summary.map((row) => (
                            <div key={row.agent} className="flex justify-between items-center p-2.5 rounded-xl bg-gray-50 dark:bg-gray-850 border dark:border-gray-800 text-xs">
                              <span className="font-bold text-gray-700 dark:text-gray-300">👤 {row.agent}</span>
                              <span className="bg-brand-primary/10 text-brand-primary font-black px-2.5 py-0.5 rounded-full">{row.count} resueltos</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recent Resolutions */}
                  <div className="md:col-span-7 space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Últimos 100 tickets resueltos</h4>
                    <div className="border dark:border-gray-800 rounded-xl overflow-hidden text-xs max-h-[300px] overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-850 border-b dark:border-gray-800 text-[10px] text-gray-400 uppercase font-extrabold">
                            <th className="p-3">Cliente</th>
                            <th className="p-3">Asesor</th>
                            <th className="p-3">Fecha</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {metricsData.recent.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="p-4 text-center text-gray-450 italic">No hay tickets resueltos recientes.</td>
                            </tr>
                          ) : (
                            metricsData.recent.map((rec, i) => (
                              <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/30">
                                <td className="p-3 font-semibold text-gray-800 dark:text-gray-200">
                                  <div className="truncate max-w-[150px]">{rec.customerName}</div>
                                  <div className="text-[9px] text-gray-450">+{rec.phone}</div>
                                </td>
                                <td className="p-3 text-gray-650 dark:text-gray-300 font-medium">{rec.agent}</td>
                                <td className="p-3 text-gray-400 text-[10px] whitespace-nowrap">
                                  {new Date(rec.resolvedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                                  {new Date(rec.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t dark:border-gray-800 flex justify-end bg-gray-50/30 dark:bg-gray-900/10">
              <button
                onClick={() => setShowMetricsModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu Overlay */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-800 border dark:border-gray-750 shadow-xl rounded-xl py-1 z-50 text-xs w-44"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              handleDeleteMessage(contextMenu.messageId);
              setContextMenu(null);
            }}
            className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 font-semibold"
          >
            🗑️ Eliminar para todos
          </button>
          {contextMenu.isFromMe && (
            <button
              onClick={() => {
                setEditingMessage({ id: contextMenu.messageId, body: contextMenu.messageBody });
                setContextMenu(null);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium border-t dark:border-gray-750"
            >
              ✏️ Editar mensaje
            </button>
          )}
        </div>
      )}

      {/* Editing Message Modal */}
      {editingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-5 shadow-2xl border dark:border-gray-750">
            <h3 className="text-sm font-bold text-gray-950 dark:text-white mb-3">✏️ Editar Mensaje</h3>
            <textarea
              value={editingMessage.body}
              onChange={(e) => setEditingMessage(prev => prev ? { ...prev, body: e.target.value } : null)}
              className="w-full p-3 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-primary h-28 resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditingMessage(null)}
                className="px-3.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditMessage}
                className="px-4 py-1.5 text-xs bg-brand-primary hover:bg-brand-dark text-white rounded-xl font-bold transition-all"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket / Start Chat Modal */}
      {showCreateTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-5 shadow-2xl border dark:border-gray-750">
            <h3 className="text-sm font-bold text-gray-950 dark:text-white mb-4">💬 Iniciar nuevo chat / ticket</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                  Número de Teléfono (con código de país, ej: 57311...)
                </label>
                <input
                  type="text"
                  placeholder="57311..."
                  value={newTicketPhone}
                  onChange={(e) => setNewTicketPhone(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border dark:border-gray-750 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                  Nombre del Cliente (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Luis Ovalles"
                  value={newTicketName}
                  onChange={(e) => setNewTicketName(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border dark:border-gray-750 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                  Motivo de contacto / Asunto (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Dudas renovación"
                  value={newTicketReason}
                  onChange={(e) => setNewTicketReason(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border dark:border-gray-750 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => {
                  setShowCreateTicketModal(false);
                  setNewTicketPhone('');
                  setNewTicketName('');
                  setNewTicketReason('');
                }}
                className="px-3.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTicket}
                className="px-4 py-1.5 text-xs bg-brand-primary hover:bg-brand-dark text-white rounded-xl font-bold transition-all shadow-sm active:scale-95"
              >
                Iniciar Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Profile Modal */}
      {showClientProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border dark:border-gray-850 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-gray-50 dark:bg-gray-950 border-b dark:border-gray-850 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-xl text-brand-primary">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-950 dark:text-white leading-tight">
                    Perfil del Cliente: {profileEditing?.fullname || 'Cliente'}
                  </h3>
                  <span className="text-[10px] text-gray-400 font-mono">+{profileEditing?.phone}</span>
                </div>
              </div>
              <button
                onClick={() => setShowClientProfileModal(false)}
                className="p-1.5 hover:bg-gray-150 dark:hover:bg-gray-805 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 bg-gray-50/50 dark:bg-gray-900/50">
              {profileLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-brand-primary" />
                  <span className="text-xs text-gray-450 font-bold">Cargando perfil del cliente...</span>
                </div>
              ) : !profileData ? (
                <div className="text-center py-20 text-xs text-gray-400">
                  No se pudo cargar la información del perfil.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left Column: Editable Profile info (col-span-4) */}
                  <div className="md:col-span-4 flex flex-col gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border dark:border-gray-750 shadow-sm flex flex-col gap-3.5">
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-455 uppercase tracking-wider">
                        📝 Datos Personales
                      </h4>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                          Nombre Completo
                        </label>
                        <input
                          type="text"
                          value={profileEditing?.fullname || ''}
                          onChange={(e) => setProfileEditing(prev => prev ? { ...prev, fullname: e.target.value } : null)}
                          className="w-full p-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-850 border dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                          Correo Electrónico
                        </label>
                        <input
                          type="text"
                          value={profileEditing?.email || ''}
                          onChange={(e) => setProfileEditing(prev => prev ? { ...prev, email: e.target.value } : null)}
                          className="w-full p-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-855 border dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                          Notas Internas del Asesor
                        </label>
                        <textarea
                          rows={6}
                          value={profileEditing?.notes || ''}
                          onChange={(e) => setProfileEditing(prev => prev ? { ...prev, notes: e.target.value } : null)}
                          placeholder="Agrega notas sobre este cliente (ej. preferencias, acuerdos, incidentes pasados)..."
                          className="w-full p-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-850 border dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-primary resize-none h-36"
                        />
                      </div>
                      <button
                        onClick={handleSaveProfileNotes}
                        disabled={profileSaving}
                        className="bg-brand-primary hover:bg-brand-dark text-white w-full py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 mt-1 flex justify-center items-center gap-1 shadow-sm active:scale-95"
                      >
                        {profileSaving ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Guardando...</span>
                          </>
                        ) : (
                          <span>💾 Guardar Cambios</span>
                        )}
                      </button>
                    </div>

                    {activeChatTicket && (
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border dark:border-gray-750 shadow-sm flex flex-col gap-3 mt-4">
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-455 uppercase tracking-wider">
                          🤖 Cobro y Saldo del Bot
                        </h4>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                            Monto Total del Pedido ($)
                          </label>
                          <input
                            type="number"
                            value={ticketTotal !== null ? ticketTotal : ''}
                            onChange={(e) => setTicketTotal(e.target.value === '' ? null : parseInt(e.target.value))}
                            placeholder="Ej. 8000"
                            className="w-full p-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-850 border dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                            Saldo a Favor Aplicado ($)
                          </label>
                          <input
                            type="number"
                            value={ticketSaldo !== null ? ticketSaldo : ''}
                            onChange={(e) => setTicketSaldo(e.target.value === '' ? null : parseInt(e.target.value))}
                            placeholder="Ej. 2000"
                            className="w-full p-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-850 border dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-primary"
                          />
                        </div>
                        {ticketTotal !== null && (
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-850 p-2.5 rounded-xl border dark:border-gray-750 font-semibold">
                            <span>Total Restante a Transferir: </span>
                            <span className="font-extrabold text-brand-primary">
                              ${(Math.max(0, (ticketTotal || 0) - (ticketSaldo || 0))).toLocaleString('es-CO')} COP
                            </span>
                          </div>
                        )}
                        <button
                          onClick={handleSaveTicketState}
                          disabled={updatingTicketState}
                          className="bg-purple-600 hover:bg-purple-700 text-white w-full py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex justify-center items-center gap-1 shadow-sm active:scale-95"
                        >
                          {updatingTicketState ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Actualizando...</span>
                            </>
                          ) : (
                            <span>⚙️ Actualizar Cobro</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Subscriptions, Payments & Excel History (col-span-8) */}
                  <div className="md:col-span-8 flex flex-col gap-6">
                    {/* Active/Expired Accounts */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border dark:border-gray-750 shadow-sm">
                      <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        🍿 Cuentas y Suscripciones Activas
                      </h4>
                      {!profileData.subscriptions || profileData.subscriptions.length === 0 ? (
                        <span className="text-xxs text-gray-400 italic font-light block py-2">No tiene cuentas activas asignadas en la base de datos.</span>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                          {profileData.subscriptions.map((sub: any, idx: number) => (
                            <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-850 rounded-xl border dark:border-gray-750 flex flex-col gap-1.5 shadow-xxs">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-brand-primary text-xs uppercase">{sub.streaming_platform}</span>
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase ${
                                  sub.status === 'active' 
                                    ? 'bg-green-500/10 text-green-600' 
                                    : 'bg-red-500/10 text-red-500'
                                }`}>
                                  {sub.status === 'active' ? 'Activo' : 'Vencido'}
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-600 dark:text-gray-400 flex flex-col gap-0.5 font-mono">
                                <span className="truncate flex items-center justify-between gap-1">
                                  <span className="truncate"><b>Correo:</b> {sub.account_email}</span>
                                  <button
                                    onClick={() => handleViewAccountHistory(sub.account_email)}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 text-brand-primary rounded-lg transition-colors shrink-0"
                                    title="Ver Historial de la Cuenta (Quién la ha tenido)"
                                  >
                                    <History className="w-3.5 h-3.5" />
                                  </button>
                                </span>
                                <span><b>Clave:</b> {sub.account_password || 'N/A'}</span>
                                {sub.profile_pin && <span><b>PIN:</b> {sub.profile_pin}</span>}
                                <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 font-sans">
                                  Vence: {sub.expiration_date ? sub.expiration_date.substring(0, 10) : 'N/A'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Historical Excel cuts */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border dark:border-gray-750 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                          📊 Histórico de Excel (Cortes Mensuales)
                        </h4>
                        <button
                          onClick={() => fetchClientProfile(profileEditing?.phone || '', true)}
                          disabled={profileLoading}
                          className="px-2 py-1 bg-gray-50 dark:bg-gray-850 hover:bg-gray-100 dark:hover:bg-gray-750 border dark:border-gray-700 text-gray-650 dark:text-gray-350 font-bold text-[9px] rounded-lg transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                          title="Sincronizar en vivo desde la base de datos de Excel"
                        >
                          <RefreshCw className={`w-2.5 h-2.5 ${profileLoading ? 'animate-spin' : ''}`} />
                          <span>Forzar Sincronización</span>
                        </button>
                      </div>
                      {!profileData.excelHistory || profileData.excelHistory.length === 0 ? (
                        <span className="text-xxs text-gray-400 italic font-light block py-2">No tiene registros históricos en el Excel.</span>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                          {profileData.excelHistory.map((hist: any, idx: number) => {
                            const formattedVenc = hist.vencimiento ? (hist.vencimiento.toString().includes('-') ? hist.vencimiento.substring(0, 10) : formatExcelDate(hist.vencimiento)) : 'N/A';
                            return (
                              <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-850 rounded-xl border dark:border-gray-750 flex flex-col gap-1 shadow-xxs">
                                <div className="flex justify-between items-center font-bold">
                                  <span className="text-brand-primary text-xs uppercase">{hist.streaming}</span>
                                  <span className="text-[10px] text-gray-550 dark:text-gray-400">Corte: {hist.fecha_corte || 'N/A'}</span>
                                </div>
                                <div className="text-[10px] text-gray-650 dark:text-gray-400 flex flex-col gap-0.5 font-mono">
                                  <span className="truncate"><b>Correo:</b> {hist.correo || 'N/A'}</span>
                                  <span><b>Metodo:</b> {hist.metodo_pago || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-sans mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-800">
                                  <span className="text-gray-400">Vence: {formattedVenc}</span>
                                  <span className="font-extrabold text-emerald-600 dark:text-emerald-450">
                                    ${Number(hist.deben || 0).toLocaleString('es-CO')}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Approved purchases */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border dark:border-gray-750 shadow-sm">
                      <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-3">
                        💳 Historial de Compras de la Web
                      </h4>
                      {!profileData.purchases || profileData.purchases.length === 0 ? (
                        <span className="text-xxs text-gray-400 italic font-light block py-2">No tiene compras aprobadas registradas.</span>
                      ) : (
                        <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 font-mono text-[10px]">
                          {profileData.purchases.map((pur: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-850 rounded-xl border dark:border-gray-750">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-gray-800 dark:text-gray-200">{pur.platformName}</span>
                                <span className="text-[9px] text-gray-400 font-sans">
                                  Fecha: {pur.approvedAt ? pur.approvedAt.substring(0, 10) : 'N/A'}
                                </span>
                              </div>
                              <div className="text-right flex flex-col gap-0.5">
                                <span className="font-extrabold text-emerald-600 dark:text-emerald-450 text-xs">
                                  ${Number(pur.amount).toLocaleString('es-CO')}
                                </span>
                                <span className="text-[9px] text-gray-400">ID: {pur.order_id}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 dark:bg-gray-950 border-t dark:border-gray-850 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setShowClientProfileModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-250 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account History Modal */}
      {showAccountHistoryModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border dark:border-gray-805 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b dark:border-gray-850 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <div>
                <h3 className="font-extrabold text-gray-800 dark:text-white text-sm flex items-center gap-2 uppercase tracking-wide">
                  <History className="w-5 h-5 text-brand-primary" /> Historial de la Cuenta
                </h3>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">{accountHistoryEmail}</p>
              </div>
              <button
                onClick={() => setShowAccountHistoryModal(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <LogOut className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="flex-grow overflow-y-auto p-5 space-y-4">
              {loadingAccountHistory ? (
                <div className="text-center py-12 text-xs text-gray-500 font-medium">Cargando historial de la cuenta...</div>
              ) : accountHistoryData.length === 0 ? (
                <p className="text-center py-12 text-xs text-gray-450 italic">No hay registros históricos para esta cuenta en Excel.</p>
              ) : (
                <div className="space-y-3">
                  {accountHistoryData.map((hist: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-gray-50 dark:bg-gray-850 rounded-xl border dark:border-gray-750 flex flex-col gap-1.5 shadow-xxs">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-brand-primary text-[10px] bg-brand-primary/10 px-2 py-0.5 rounded-lg uppercase">
                          Corte: {hist.fecha_corte || 'N/A'}
                        </span>
                        <span className="text-[10px] text-gray-700 dark:text-gray-300 font-sans">
                          👤 {hist.customer_name || 'Cliente'} (+{hist.customer_phone})
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-650 dark:text-gray-400 flex flex-col gap-0.5 font-mono">
                        {hist.profile_name && <span><b>Perfil:</b> {hist.profile_name}</span>}
                        {hist.profile_pin && <span><b>PIN:</b> {hist.profile_pin}</span>}
                        <span><b>Método:</b> {hist.payment_method || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-sans mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-gray-450">Vence: {hist.vencimiento ? hist.vencimiento.substring(0, 10) : 'N/A'}</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-450">
                          Valor: ${Number(hist.deben || 0).toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 dark:bg-gray-950 border-t dark:border-gray-850 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setShowAccountHistoryModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-250 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
