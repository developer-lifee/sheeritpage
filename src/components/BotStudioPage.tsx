import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Bot,
  QrCode,
  Sparkles,
  Volume2,
  Plus,
  Trash2,
  Download,
  Send,
  LogOut,
  Power,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Save,
  ArrowLeft,
  Sliders,
  KeyRound,
  UserPlus,
  LogIn,
  Upload,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  RotateCcw,
  UserCheck,
  Pencil,
  Star,
  X,
  Database
} from 'lucide-react';
import { useWhatsAppContact } from '../hooks/useWhatsAppContact';

interface DataSourceItem {
  id: number;
  tenant_id: number;
  name: string;
  source_type: 'google_sheets' | 'uploaded_table';
  sheet_url?: string | null;
  headers: string[];
  previewRows: Record<string, string>[];
  row_count: number;
  last_synced_at?: string | null;
  is_active: boolean;
}

interface SimAudioItem {
  id: number;
  title: string;
  duration_sec: number;
  hasImage: boolean;
  image_filename?: string | null;
  followup_text?: string;
}

interface SimChatMessage {
  id: string;
  sender: 'customer' | 'bot' | 'human';
  text?: string;
  burst?: string[];
  mode?: string;
  reason?: string;
  pausedByHuman?: boolean;
  audios?: SimAudioItem[];
  timestamp: string;
}

interface BotStudioPageProps {
  onNavigateHome?: () => void;
}

interface TenantData {
  id: number;
  slug: string;
  owner_name: string;
  business_name: string;
  email: string;
  plan_name: string;
  monthly_message_limit: number;
  amount_paid?: number;
  expires_at?: string | null;
  messages_used_month: number;
  usage_reset_month: string;
  status: string;
  dashboard_prefs?: {
    favoriteAudioIds?: number[];
    [key: string]: any;
  };
  enabled_modules?: string[];
  is_bot_active: number | boolean;
  business_description: string | null;
  system_prompt: string | null;
  knowledge_base: string | null;
  bot_tone: string | null;
  human_pause_minutes?: number;
  elevenlabs_enabled: number | boolean;
  has_elevenlabs_key?: boolean;
  elevenlabs_api_key_masked?: string;
  elevenlabs_voice_id: string | null;
  elevenlabs_model_id: string | null;
  reply_mode: string | null;
  wa_status: string;
  wa_phone: string | null;
}

interface SessionState {
  status: 'DISCONNECTED' | 'CONNECTING' | 'QR_READY' | 'PAIRING_CODE_READY' | 'CONNECTED' | string;
  qrDataUrl: string | null;
  pairingCode?: string | null;
  qrUpdatedAt?: number | null;
  phone: string | null;
  lastError: string | null;
}

interface LibraryAudio {
  id: number;
  tenant_id: number;
  title: string;
  trigger_description: string;
  original_filename: string | null;
  image_filename?: string | null;
  followup_text?: string | null;
  has_image?: number | boolean;
  duration_sec: number;
  is_active: number | boolean;
  created_at: string;
}

interface LiveChatSummary {
  chatId: string;
  phone: string;
  lastBody: string;
  lastDirection: 'in' | 'out';
  lastType: string;
  lastAt: string;
  isPaused: boolean;
  pausedUntil: number | null;
}

interface VoiceOption {
  voice_id: string;
  name: string;
  category?: string;
}

interface AudioSegment {
  id: string;
  text: string;
  voiceId: string;
}

interface LogEntry {
  id: number;
  customer_jid: string;
  direction: 'in' | 'out';
  message_type: string;
  body: string;
  decision_meta?: {
    mode?: string;
    audioIds?: number[];
    audioTitles?: string[];
    reason?: string;
  } | null;
  created_at: string;
}

interface ImprovementItem {
  id: number;
  tenant_id: number;
  message_log_id: number | null;
  customer_jid: string | null;
  incoming_text: string | null;
  bot_reply: string | null;
  client_question: string;
  explanation_plain: string | null;
  scope: 'tenant_config' | 'core_engine';
  practical_proposal: string | null;
  proposed_prompt_addition: string | null;
  proposed_audio_id: number | null;
  proposed_audio_trigger: string | null;
  status: 'proposed' | 'accepted' | 'applied' | 'reverted' | 'escalated_core' | 'queued_restart' | 'dismissed';
  applied_at: string | null;
  reverted_at: string | null;
  created_at: string;
}

const TOKEN_STORAGE_KEY = 'sheerit_saas_bot_token';

const getApiBase = () => {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3000';
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
};

const base64Mp3ToBlobUrl = (b64: string) => {
  const byteStr = atob(b64);
  const bytes = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
};

export function BotStudioPage({ onNavigateHome }: BotStudioPageProps) {
  const [token, setToken] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const impToken = params.get('impersonate');
        if (impToken && impToken.trim()) {
          localStorage.setItem(TOKEN_STORAGE_KEY, impToken.trim());
          window.history.replaceState({}, '', '/mi-bot');
          return impToken.trim();
        }
      }
      return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  // Auth form states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activationCode, setActivationCode] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerDesc, setRegisterDesc] = useState('');

  // Dashboard states
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [session, setSession] = useState<SessionState>({
    status: 'DISCONNECTED',
    qrDataUrl: null,
    phone: null,
    lastError: null
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsHasMore, setLogsHasMore] = useState(true);
  const [logsNextBeforeId, setLogsNextBeforeId] = useState<number | null>(null);
  const [logsSearch, setLogsSearch] = useState('');
  const [expandedWhyId, setExpandedWhyId] = useState<number | null>(null);
  const [activeImproveMsgId, setActiveImproveMsgId] = useState<number | null>(null);
  const [inlineQuestion, setInlineQuestion] = useState('');
  const [generalQuestion, setGeneralQuestion] = useState('');
  const [improvements, setImprovements] = useState<ImprovementItem[]>([]);
  const [refiningImpId, setRefiningImpId] = useState<number | null>(null);
  const refiningInputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [logsSubTab, setLogsSubTab] = useState<'history' | 'proposals' | 'applied'>('history');
  const [pairingPhone, setPairingPhone] = useState('');
  const [pairingNow, setPairingNow] = useState(() => Date.now());
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'generator' | 'elevenlabs' | 'simulator' | 'chats' | 'logs' | 'data'>('whatsapp');
  const [bannerMsg, setBannerMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  // #7 Datos & Sheets (Módulo Pro crm_sheets)
  const [dataSources, setDataSources] = useState<DataSourceItem[]>([]);
  const [dataModuleEnabled, setDataModuleEnabled] = useState(false);
  const [dataSheetName, setDataSheetName] = useState('');
  const [dataSheetUrl, setDataSheetUrl] = useState('');
  const [dataUploadName, setDataUploadName] = useState('');
  const [dataUploadFile, setDataUploadFile] = useState<File | null>(null);
  const [dataPreviewOpenId, setDataPreviewOpenId] = useState<number | null>(null);

  // Modo Prueba (chat simulado sin vincular WhatsApp)
  const [simMessages, setSimMessages] = useState<SimChatMessage[]>([]);
  const [simHistory, setSimHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [simBurstDrafts, setSimBurstDrafts] = useState<string[]>(['']);
  const [simHumanPaused, setSimHumanPaused] = useState(false);
  const [simHumanReply, setSimHumanReply] = useState('');
  const [simAudioBlobUrls, setSimAudioBlobUrls] = useState<Record<number, string>>({});
  const [simImageBlobUrls, setSimImageBlobUrls] = useState<Record<number, string>>({});
  const [simExpandedWhyId, setSimExpandedWhyId] = useState<string | null>(null);

  // Editable bot config
  const [cfgBusinessName, setCfgBusinessName] = useState('');
  const [cfgDescription, setCfgDescription] = useState('');
  const [cfgProducts, setCfgProducts] = useState('');
  const [cfgTone, setCfgTone] = useState('amigable y cercano');
  const [cfgSystemPrompt, setCfgSystemPrompt] = useState('');
  const [cfgKnowledgeBase, setCfgKnowledgeBase] = useState('');
  const [cfgBotActive, setCfgBotActive] = useState(true);
  const [cfgPauseMinutes, setCfgPauseMinutes] = useState(30);

  // Live chats & manual 1-click flow control
  const [liveChats, setLiveChats] = useState<LiveChatSummary[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<LogEntry[]>([]);
  const [selectedChatPaused, setSelectedChatPaused] = useState(false);
  const [manualChatText, setManualChatText] = useState('');

  // Uploaded audio library + AI decider
  const [audios, setAudios] = useState<LibraryAudio[]>([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadTrigger, setUploadTrigger] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadImageFile, setUploadImageFile] = useState<File | null>(null);
  const [uploadFollowupText, setUploadFollowupText] = useState('');
  const [selectedAudioIds, setSelectedAudioIds] = useState<number[]>([]);
  const [libPauseMs, setLibPauseMs] = useState(350);
  const [libSendPhone, setLibSendPhone] = useState('');
  const [libMergedUrl, setLibMergedUrl] = useState<string | null>(null);
  const [libMergedMeta, setLibMergedMeta] = useState<{ filesCount: number; durationSec: number } | null>(null);

  // #3 Edición inline de flujos de audio
  const [editingAudioId, setEditingAudioId] = useState<number | null>(null);
  const [editAudioTitle, setEditAudioTitle] = useState('');
  const [editAudioTrigger, setEditAudioTrigger] = useState('');
  const [editAudioFollowup, setEditAudioFollowup] = useState('');
  const [editAudioImageFile, setEditAudioImageFile] = useState<File | null>(null);
  const [editAudioRemoveImage, setEditAudioRemoveImage] = useState(false);

  // #4 Personalización por cliente: favoritos y filtro en Chats en Vivo
  const [favoriteAudioIds, setFavoriteAudioIds] = useState<number[]>([]);
  const [chatAudioSearch, setChatAudioSearch] = useState('');

  // Optional ElevenLabs TTS
  const [showElevenLabsTts, setShowElevenLabsTts] = useState(false);
  const [elEnabled, setElEnabled] = useState(false);
  const [elApiKeyInput, setElApiKeyInput] = useState('');
  const [elVoiceId, setElVoiceId] = useState('');
  const [elModelId, setElModelId] = useState('eleven_multilingual_v2');
  const [elReplyMode, setElReplyMode] = useState('text');
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [pauseMs, setPauseMs] = useState(300);
  const [segments, setSegments] = useState<AudioSegment[]>([
    { id: 'seg_1', text: 'Hola, bienvenido a nuestro negocio.', voiceId: '' },
    { id: 'seg_2', text: '¿En qué producto o servicio te podemos ayudar hoy?', voiceId: '' }
  ]);
  const [mergedAudioUrl, setMergedAudioUrl] = useState<string | null>(null);
  const [mergedMeta, setMergedMeta] = useState<{ segmentsCount: number; totalChars: number } | null>(null);
  const [sendToPhone, setSendToPhone] = useState('');

  const apiBase = getApiBase();
  const { getWaLink } = useWhatsAppContact();

  const notify = (type: 'ok' | 'err', text: string) => {
    setBannerMsg({ type, text });
    if (type === 'ok') {
      setTimeout(() => setBannerMsg(prev => (prev?.text === text ? null : prev)), 5000);
    }
  };

  const syncFormFromTenant = (t: TenantData) => {
    setTenant(t);
    setCfgBusinessName(t.business_name || '');
    setCfgDescription(t.business_description || '');
    setCfgTone(t.bot_tone || 'amigable y cercano');
    setCfgSystemPrompt(t.system_prompt || '');
    setCfgKnowledgeBase(t.knowledge_base || '');
    setCfgBotActive(Boolean(t.is_bot_active));
    setCfgPauseMinutes(t.human_pause_minutes !== undefined ? Number(t.human_pause_minutes) : 30);
    setElEnabled(Boolean(t.elevenlabs_enabled));
    setElVoiceId(t.elevenlabs_voice_id || '');
    setElModelId(t.elevenlabs_model_id || 'eleven_multilingual_v2');
    setElReplyMode(t.reply_mode || 'text');
    setFavoriteAudioIds(Array.isArray(t.dashboard_prefs?.favoriteAudioIds) ? t.dashboard_prefs.favoriteAudioIds : []);
    setDataModuleEnabled(Array.isArray(t.enabled_modules) && t.enabled_modules.includes('crm_sheets'));
  };

  const fetchDataSources = async (activeToken = token) => {
    if (!activeToken) return;
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/data-sources`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setDataModuleEnabled(Boolean(data.enabled));
        if (Array.isArray(data.sources)) setDataSources(data.sources);
      }
    } catch {}
  };

  const fetchAudios = async (activeToken = token) => {
    if (!activeToken) return;
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/audios`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.audios)) {
        setAudios(data.audios);
      }
    } catch {}
  };

  const fetchDashboard = async (activeToken = token) => {
    if (!activeToken) return;
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/me`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (data.success && data.tenant) {
        syncFormFromTenant(data.tenant);
        if (data.session) setSession(data.session);
        if (Array.isArray(data.logs)) {
          setLogs(data.logs);
          setLogsHasMore(data.logs.length >= 40);
          setLogsNextBeforeId(data.logs.length > 0 ? data.logs[data.logs.length - 1].id : null);
        }
        if (Array.isArray(data.improvements)) {
          setImprovements(data.improvements);
        }
      }
      fetchAudios(activeToken);
      fetchDataSources(activeToken);
    } catch (err) {
      console.error('Error cargando Bot Studio:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboard(token);
    }
  }, [token]);

  useEffect(() => {
    if (!token || (session.status !== 'CONNECTING' && session.status !== 'QR_READY' && session.status !== 'PAIRING_CODE_READY')) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`${apiBase}/api/saas-bot/whatsapp/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.session) {
          setSession(data.session);
          if (data.session.status === 'CONNECTED') {
            fetchDashboard(token);
          }
        }
      } catch {}
    }, 1500);
    return () => clearInterval(timer);
  }, [token, session.status]);

  useEffect(() => {
    if (!session.pairingCode) return;
    setPairingNow(Date.now());
    const tick = setInterval(() => setPairingNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [session.pairingCode, session.qrUpdatedAt]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const endpoint = authMode === 'register' ? '/api/saas-bot/register' : '/api/saas-bot/login';
      const payload = authMode === 'register'
        ? {
            activationCode: activationCode.trim().toUpperCase(),
            ownerName,
            businessName,
            email,
            password,
            businessDescription: registerDesc
          }
        : { email, password };

      const res = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.token) {
        throw new Error(data.message || 'No se pudo autenticar');
      }
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setToken(data.token);
      if (data.tenant) syncFormFromTenant(data.tenant);
    } catch (err: any) {
      setAuthError(err.message || 'Error de conexión');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    try { localStorage.removeItem(TOKEN_STORAGE_KEY); } catch {}
    setToken('');
    setTenant(null);
  };

  const handleConnectWhatsApp = async () => {
    setBusyAction('wa_connect');
    setBannerMsg(null);
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/whatsapp/connect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo iniciar WhatsApp');
      setSession(data.session);
      notify('ok', 'Generando código QR de WhatsApp...');
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingPhone.trim()) {
      notify('err', 'Ingresa el número de WhatsApp que vas a vincular.');
      return;
    }
    setBusyAction('wa_pairing');
    setBannerMsg(null);
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/whatsapp/pairing-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phone: pairingPhone.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo generar el código numérico');
      if (data.session) setSession(data.session);
      notify('ok', '¡Código de 8 dígitos generado! Ingrésalo en tu WhatsApp.');
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    setBusyAction('wa_disconnect');
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/whatsapp/disconnect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.session) setSession(data.session);
      notify('ok', 'Sesión de WhatsApp desconectada.');
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleGenerateConfig = async () => {
    if (!cfgDescription.trim() && !cfgProducts.trim()) {
      notify('err', 'Describe brevemente tu negocio o productos antes de generar.');
      return;
    }
    setBusyAction('ai_gen');
    setBannerMsg(null);
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/generate-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          businessName: cfgBusinessName,
          businessDescription: cfgDescription,
          productsOrServices: cfgProducts,
          tone: cfgTone
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Error generando configuración');
      setCfgSystemPrompt(data.system_prompt || '');
      setCfgKnowledgeBase(data.knowledge_base || '');
      notify('ok', 'Configuración generada automáticamente. Revísala y haz clic en Guardar.');
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleSaveConfig = async (overrideActive?: boolean) => {
    setBusyAction('save_cfg');
    setBannerMsg(null);
    try {
      const nextActive = overrideActive !== undefined ? overrideActive : cfgBotActive;
      const res = await fetch(`${apiBase}/api/saas-bot/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          business_name: cfgBusinessName,
          business_description: cfgDescription,
          system_prompt: cfgSystemPrompt,
          knowledge_base: cfgKnowledgeBase,
          bot_tone: cfgTone,
          is_bot_active: nextActive,
          human_pause_minutes: cfgPauseMinutes,
          elevenlabs_enabled: elEnabled,
          ...(elApiKeyInput.trim() ? { elevenlabs_api_key: elApiKeyInput.trim() } : {}),
          elevenlabs_voice_id: elVoiceId,
          elevenlabs_model_id: elModelId,
          reply_mode: elReplyMode
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Error guardando configuración');
      syncFormFromTenant(data.tenant);
      setElApiKeyInput('');
      notify('ok', 'Configuración guardada correctamente.');
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleUploadAudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle.trim() || !uploadTrigger.trim()) {
      notify('err', 'Completa título, cuándo debe enviarlo el bot y selecciona un archivo de audio.');
      return;
    }
    setBusyAction('upload_audio');
    setBannerMsg(null);
    try {
      const form = new FormData();
      form.append('title', uploadTitle.trim());
      form.append('trigger_description', uploadTrigger.trim());
      form.append('audio', uploadFile);
      if (uploadImageFile) form.append('image', uploadImageFile);
      if (uploadFollowupText.trim()) form.append('followup_text', uploadFollowupText.trim());

      const res = await fetch(`${apiBase}/api/saas-bot/audios/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo subir el audio');

      setAudios(prev => [...prev, data.audio]);
      setUploadTitle('');
      setUploadTrigger('');
      setUploadFile(null);
      setUploadImageFile(null);
      setUploadFollowupText('');
      notify('ok', `Flujo "${data.audio.title}" guardado (${data.audio.duration_sec}s) sin etiqueta de reenviado.`);
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleToggleAudioActive = async (audio: LibraryAudio) => {
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/audios/${audio.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !audio.is_active })
      });
      const data = await res.json();
      if (data.success && data.audio) {
        setAudios(prev => prev.map(a => a.id === audio.id ? data.audio : a));
      }
    } catch {}
  };

  const startEditAudio = (audio: LibraryAudio) => {
    setEditingAudioId(audio.id);
    setEditAudioTitle(audio.title || '');
    setEditAudioTrigger(audio.trigger_description || '');
    setEditAudioFollowup(audio.followup_text || '');
    setEditAudioImageFile(null);
    setEditAudioRemoveImage(false);
  };

  const handleSaveEditAudio = async (audioId: number) => {
    if (!editAudioTitle.trim() || !editAudioTrigger.trim()) {
      notify('err', 'Indica el nombre del audio y cuándo debe enviarlo.');
      return;
    }
    setBusyAction(`edit_audio_${audioId}`);
    try {
      const form = new FormData();
      form.append('title', editAudioTitle.trim());
      form.append('trigger_description', editAudioTrigger.trim());
      form.append('followup_text', editAudioFollowup.trim());
      if (editAudioRemoveImage) form.append('remove_image', '1');
      if (editAudioImageFile) form.append('image', editAudioImageFile);

      const res = await fetch(`${apiBase}/api/saas-bot/audios/${audioId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.audio) {
        throw new Error(data.message || 'No se pudo actualizar el audio');
      }
      setAudios(prev => prev.map(a => (a.id === audioId ? data.audio : a)));
      setEditingAudioId(null);
      setEditAudioImageFile(null);
      setEditAudioRemoveImage(false);
      notify('ok', 'Flujo de audio actualizado sin perder tu grabación.');
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleToggleFavoriteAudio = async (audioId: number) => {
    const prevFavs = favoriteAudioIds;
    const nextFavs = prevFavs.includes(audioId)
      ? prevFavs.filter(x => x !== audioId)
      : [...prevFavs, audioId];
    setFavoriteAudioIds(nextFavs);
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/dashboard-prefs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ favoriteAudioIds: nextFavs })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Error guardando favorito');
      if (Array.isArray(data.dashboard_prefs?.favoriteAudioIds)) {
        setFavoriteAudioIds(data.dashboard_prefs.favoriteAudioIds);
      }
    } catch (err: any) {
      setFavoriteAudioIds(prevFavs);
      notify('err', err.message);
    }
  };

  const handleSyncGoogleSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataSheetUrl.trim()) {
      notify('err', 'Pega la URL compartida o publicada de tu Google Sheets.');
      return;
    }
    setBusyAction('sync_google_sheet');
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/data-sources/google-sheet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: dataSheetName.trim() || 'Hoja de Cobertura / Catálogo',
          sheetUrl: dataSheetUrl.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.source) throw new Error(data.message || 'Error conectando Google Sheets');
      setDataSources(prev => [data.source, ...prev.filter(s => s.id !== data.source.id)]);
      setDataSheetName('');
      setDataSheetUrl('');
      setDataPreviewOpenId(data.source.id);
      notify('ok', `Hoja conectada: ${data.source.row_count} filas sincronizadas.`);
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleResyncSource = async (sourceId: number) => {
    setBusyAction(`resync_${sourceId}`);
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/data-sources/${sourceId}/sync`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.source) throw new Error(data.message || 'No se pudo resincronizar');
      setDataSources(prev => prev.map(s => (s.id === sourceId ? data.source : s)));
      notify('ok', `Sincronizado (${data.source.row_count} filas actualizadas).`);
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleImportExcelTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataUploadFile) {
      notify('err', 'Selecciona un archivo Excel (.xlsx, .xls) o CSV primero.');
      return;
    }
    setBusyAction('import_excel_table');
    try {
      const buf = await dataUploadFile.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) throw new Error('El archivo no contiene hojas válidas.');
      const ws = wb.Sheets[sheetName];
      const matrix = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });
      if (!matrix || matrix.length < 2) throw new Error('El archivo debe tener encabezados y al menos 1 fila de datos.');

      const rawHeaders = (matrix[0] || []).map((h, i) => String(h || '').trim() || `Columna_${i + 1}`);
      const headers = rawHeaders.filter(Boolean);
      const rows = matrix.slice(1, 1501).map(rowArr => {
        const obj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          obj[h] = rowArr[idx] !== undefined && rowArr[idx] !== null ? String(rowArr[idx]).trim() : '';
        });
        return obj;
      }).filter(obj => Object.values(obj).some(v => v !== ''));

      const res = await fetch(`${apiBase}/api/saas-bot/data-sources/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: dataUploadName.trim() || dataUploadFile.name.replace(/\.(xlsx|xls|csv)$/i, ''),
          headers,
          rows
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.source) throw new Error(data.message || 'No se pudo guardar la tabla');
      setDataSources(prev => [data.source, ...prev]);
      setDataUploadName('');
      setDataUploadFile(null);
      setDataPreviewOpenId(data.source.id);
      notify('ok', `Tabla Pro importada en Sheerit (${data.source.row_count} filas).`);
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleDeleteDataSource = async (sourceId: number) => {
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/data-sources/${sourceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDataSources(prev => prev.filter(s => s.id !== sourceId));
        notify('ok', 'Fuente de datos eliminada.');
      }
    } catch (err: any) {
      notify('err', err.message);
    }
  };

  const handleDeleteAudio = async (id: number) => {
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/audios/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAudios(prev => prev.filter(a => a.id !== id));
        setSelectedAudioIds(prev => prev.filter(x => x !== id));
        notify('ok', 'Audio eliminado de la biblioteca.');
      }
    } catch (err: any) {
      notify('err', err.message);
    }
  };

  const toggleSelectAudio = (id: number) => {
    setSelectedAudioIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleMergeLibraryAudios = async (withWhatsAppSend = false) => {
    if (selectedAudioIds.length === 0) {
      notify('err', 'Selecciona al menos 1 audio de tu biblioteca con las casillas.');
      return;
    }
    if (withWhatsAppSend && !libSendPhone.trim()) {
      notify('err', 'Escribe el número destino de WhatsApp.');
      return;
    }
    setBusyAction(withWhatsAppSend ? 'lib_merge_send' : 'lib_merge');
    setBannerMsg(null);
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/audios/merge-library`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          audioIds: selectedAudioIds,
          pauseMs: libPauseMs,
          ...(withWhatsAppSend ? { sendToPhone: libSendPhone.trim() } : {})
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Error procesando audios');

      if (libMergedUrl) URL.revokeObjectURL(libMergedUrl);
      setLibMergedUrl(base64Mp3ToBlobUrl(data.audioBase64));
      setLibMergedMeta({ filesCount: data.filesCount, durationSec: data.durationSec });

      notify(
        'ok',
        withWhatsAppSend
          ? `Nota de voz fresca (${data.filesCount} audio(s), ${data.durationSec}s) enviada sin etiqueta de reenviado.`
          : `Audio unido (${data.filesCount} clips, ${data.durationSec}s) listo para escuchar o descargar.`
      );
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleLoadVoices = async () => {
    setBusyAction('load_voices');
    setBannerMsg(null);
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/elevenlabs/voices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ apiKey: elApiKeyInput.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'No se pudieron cargar las voces');
      setVoices(data.voices || []);
      if (!elVoiceId && data.voices?.length > 0) {
        setElVoiceId(data.voices[0].voice_id);
      }
      notify('ok', `Se cargaron ${data.voices?.length || 0} voces de ElevenLabs.`);
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleMergeAudio = async (withWhatsAppSend = false) => {
    if (withWhatsAppSend && !sendToPhone.trim()) {
      notify('err', 'Escribe el número de WhatsApp destino para enviarlo.');
      return;
    }
    setBusyAction(withWhatsAppSend ? 'merge_send' : 'merge_only');
    setBannerMsg(null);
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/elevenlabs/merge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          apiKey: elApiKeyInput.trim(),
          defaultVoiceId: elVoiceId,
          modelId: elModelId,
          pauseMs,
          segments: segments.map(s => ({ text: s.text, voiceId: s.voiceId || elVoiceId })),
          ...(withWhatsAppSend ? { sendToPhone: sendToPhone.trim() } : {})
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Error uniendo audios');

      if (mergedAudioUrl) URL.revokeObjectURL(mergedAudioUrl);
      setMergedAudioUrl(base64Mp3ToBlobUrl(data.audioBase64));
      setMergedMeta({ segmentsCount: data.segmentsCount, totalChars: data.totalChars });

      notify(
        'ok',
        withWhatsAppSend
          ? `Audio de ${data.segmentsCount} segmentos generado y enviado por WhatsApp.`
          : `Audio unido con éxito (${data.segmentsCount} segmentos, ${data.totalChars} caracteres).`
      );
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleLoadMoreLogs = async (reset = false) => {
    setBusyAction('load_logs');
    try {
      const qs = new URLSearchParams({ limit: '40' });
      if (!reset && logsNextBeforeId) qs.set('beforeId', String(logsNextBeforeId));
      if (logsSearch.trim()) qs.set('search', logsSearch.trim());

      const res = await fetch(`${apiBase}/api/saas-bot/logs?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Error cargando historial');

      const incoming: LogEntry[] = Array.isArray(data.logs) ? data.logs : [];
      setLogs(prev => {
        if (reset) return incoming;
        const seen = new Set(prev.map(x => x.id));
        return [...prev, ...incoming.filter(x => !seen.has(x.id))];
      });
      setLogsHasMore(Boolean(data.hasMore));
      setLogsNextBeforeId(data.nextBeforeId || null);
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleCreateImprovement = async (messageLogId: number | null, questionText: string) => {
    const cleanQ = questionText.trim();
    if (cleanQ.length < 4) {
      notify('err', 'Escribe brevemente qué quieres consultar o mejorar.');
      return;
    }
    const finalQuestion =
      !messageLogId && refiningImpId
        ? `[Continuando Ajuste #${refiningImpId}] ${cleanQ}`
        : cleanQ;

    setBusyAction(messageLogId ? `imp_msg_${messageLogId}` : 'imp_general');
    setBannerMsg(null);
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/improvements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ messageLogId, clientQuestion: finalQuestion })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo analizar el ajuste');

      setImprovements(prev => [data.improvement, ...prev]);
      if (messageLogId) {
        setActiveImproveMsgId(null);
        setInlineQuestion('');
      } else {
        setGeneralQuestion('');
        setRefiningImpId(null);
      }
      setLogsSubTab('proposals');
      notify('ok', 'Respuesta agregada al hilo de Ajustes de Mejora.');
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleAcceptImprovement = async (impId: number) => {
    setBusyAction(`imp_accept_${impId}`);
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/improvements/${impId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo aceptar la propuesta');

      setImprovements(prev => prev.map(x => (x.id === impId ? data.improvement : x)));
      notify('ok', 'Propuesta aceptada. Ya puedes hacer clic en Aplicar cuando quieras cargarla en tu bot.');
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleApplyImprovement = async (impId: number) => {
    setBusyAction(`imp_apply_${impId}`);
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/improvements/${impId}/apply`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo aplicar el ajuste');

      setImprovements(prev => prev.map(x => (x.id === impId ? data.improvement : x)));
      if (data.tenant) syncFormFromTenant(data.tenant);
      fetchAudios(token);
      notify(
        'ok',
        data.queuedForRestart
          ? 'Mejora puesta en fila para el próximo reinicio del servidor (sin interrumpir tu bot).'
          : 'Cambio aplicado y recargado en tu instancia del bot.'
      );
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleRevertImprovement = async (impId: number) => {
    setBusyAction(`imp_revert_${impId}`);
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/improvements/${impId}/revert`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo deshacer el ajuste');

      setImprovements(prev => prev.map(x => (x.id === impId ? data.improvement : x)));
      if (data.tenant) syncFormFromTenant(data.tenant);
      fetchAudios(token);
      notify('ok', 'Ajuste deshecho. Tu bot volvió exactamente a como estaba antes.');
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleDismissImprovement = async (impId: number) => {
    setBusyAction(`imp_dismiss_${impId}`);
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/improvements/${impId}/dismiss`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo descartar');
      setImprovements(prev => prev.map(x => (x.id === impId ? { ...x, status: 'dismissed' } : x)));
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const fetchLiveChats = async () => {
    if (!token) return;
    setBusyAction('load_chats');
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.chats)) {
        setLiveChats(data.chats);
        const firstId = selectedChatId || data.chats[0]?.chatId || null;
        if (firstId) {
          await openLiveChat(firstId);
        }
      }
    } catch {} finally {
      setBusyAction(null);
    }
  };

  const openLiveChat = async (chatId: string) => {
    setSelectedChatId(chatId);
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/chats/${encodeURIComponent(chatId)}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages(Array.isArray(data.messages) ? data.messages : []);
        setSelectedChatPaused(Boolean(data.pauseState?.isPaused));
      }
    } catch {}
  };

  const handleToggleChatPause = async (chatId: string, nextPaused: boolean) => {
    setBusyAction('pause_chat');
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/chats/${encodeURIComponent(chatId)}/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ paused: nextPaused, minutes: cfgPauseMinutes || 30 })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo actualizar estado del chat');
      setSelectedChatPaused(Boolean(data.pauseState?.isPaused));
      setLiveChats(prev => prev.map(c => (c.chatId === chatId ? { ...c, isPaused: Boolean(data.pauseState?.isPaused) } : c)));
      notify('ok', nextPaused ? 'Bot pausado en este chat (control manual activo).' : 'Bot reactivado en modo automático para este chat.');
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleSendManualFlow = async ({ audioIds = [], text = '' }: { audioIds?: number[]; text?: string }) => {
    if (!selectedChatId) {
      notify('err', 'Selecciona una conversación primero.');
      return;
    }
    setBusyAction(audioIds.length > 0 ? `manual_flow_${audioIds[0]}` : 'manual_text');
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/chats/${encodeURIComponent(selectedChatId)}/send-manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ audioIds, text })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo enviar al chat');

      if (text) setManualChatText('');
      setSelectedChatPaused(Boolean(data.pauseState?.isPaused));
      await openLiveChat(selectedChatId);
      setLiveChats(prev => prev.map(c => (c.chatId === selectedChatId ? { ...c, lastBody: data.summary, isPaused: Boolean(data.pauseState?.isPaused) } : c)));
      notify('ok', audioIds.length > 0 ? 'Flujo enviado como nota de voz fresca (sin reenviado).' : 'Mensaje enviado al cliente.');
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const ensureSimMediaLoaded = async (pickedAudios: SimAudioItem[]) => {
    if (!token || !pickedAudios.length) return;
    await Promise.all(
      pickedAudios.map(async item => {
        if (!simAudioBlobUrls[item.id]) {
          try {
            const res = await fetch(`${apiBase}/api/saas-bot/audios/${item.id}/stream`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const blob = await res.blob();
              const objUrl = URL.createObjectURL(blob);
              setSimAudioBlobUrls(prev => (prev[item.id] ? prev : { ...prev, [item.id]: objUrl }));
            }
          } catch {}
        }
        if (item.hasImage && !simImageBlobUrls[item.id]) {
          try {
            const res = await fetch(`${apiBase}/api/saas-bot/audios/${item.id}/image`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const blob = await res.blob();
              const objUrl = URL.createObjectURL(blob);
              setSimImageBlobUrls(prev => (prev[item.id] ? prev : { ...prev, [item.id]: objUrl }));
            }
          } catch {}
        }
      })
    );
  };

  const handleRunSimulation = async (overrideMessages?: string[]) => {
    const burst = (overrideMessages ?? simBurstDrafts).map(m => m.trim()).filter(Boolean);
    if (burst.length === 0) {
      notify('err', 'Escribe al menos un mensaje de cliente para probar.');
      return;
    }

    const nowLabel = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const customerBubbleId = `sim_c_${Date.now()}`;
    setSimMessages(prev => [
      ...prev,
      {
        id: customerBubbleId,
        sender: 'customer',
        text: burst.join('\n'),
        burst: burst.length > 1 ? burst : undefined,
        timestamp: nowLabel
      }
    ]);
    if (!overrideMessages) setSimBurstDrafts(['']);
    setBusyAction('simulate_chat');

    try {
      const res = await fetch(`${apiBase}/api/saas-bot/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: burst,
          history: simHistory,
          humanPaused: simHumanPaused
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'No se pudo simular el turno');

      const sim = data.simulation;
      const botBubbleId = `sim_b_${Date.now()}`;

      if (sim.pausedByHuman) {
        setSimMessages(prev => [
          ...prev,
          {
            id: botBubbleId,
            sender: 'bot',
            pausedByHuman: true,
            mode: 'paused',
            reason: sim.reason,
            timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setSimHistory(prev => [...prev, { role: 'user', content: sim.incomingText }].slice(-12));
        return;
      }

      if (Array.isArray(sim.pickedAudios) && sim.pickedAudios.length > 0) {
        ensureSimMediaLoaded(sim.pickedAudios);
      }

      setSimMessages(prev => [
        ...prev,
        {
          id: botBubbleId,
          sender: 'bot',
          text: sim.replyText || '',
          mode: sim.mode,
          reason: sim.reason,
          audios: sim.pickedAudios || [],
          timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      setSimHistory(prev =>
        [
          ...prev,
          { role: 'user' as const, content: sim.incomingText },
          ...(sim.assistantHistorySummary
            ? [{ role: 'assistant' as const, content: String(sim.assistantHistorySummary) }]
            : [])
        ].slice(-12)
      );
    } catch (err: any) {
      notify('err', err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleSendSimHumanReply = () => {
    const msg = simHumanReply.trim();
    if (!msg) return;
    if (!simHumanPaused) setSimHumanPaused(true);
    setSimMessages(prev => [
      ...prev,
      {
        id: `sim_h_${Date.now()}`,
        sender: 'human',
        text: msg,
        timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setSimHistory(prev => [...prev, { role: 'assistant', content: msg }].slice(-12));
    setSimHumanReply('');
  };

  const handleResetSimulation = () => {
    setSimMessages([]);
    setSimHistory([]);
    setSimBurstDrafts(['']);
    setSimHumanPaused(false);
    setSimHumanReply('');
    setSimExpandedWhyId(null);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-10">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Sheerit Bot Studio</h1>
                <p className="text-xs text-slate-400">WhatsApp IA + Audios Naturales Anti-Bloqueo</p>
              </div>
            </div>
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Inicio
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl mb-5 border border-slate-800">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(null); }}
              className={`py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${authMode === 'login' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <LogIn className="w-4 h-4" /> Ingresar
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setAuthError(null); }}
              className={`py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${authMode === 'register' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <UserPlus className="w-4 h-4" /> Crear Cuenta
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-3">
            {authMode === 'register' && (
              <>
                <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30">
                  <label className="block text-xs font-semibold text-teal-300 mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" /> Código de Activación (obligatorio)
                  </label>
                  <input
                    required
                    value={activationCode}
                    onChange={e => setActivationCode(e.target.value.toUpperCase())}
                    placeholder="Ej: SH-XXXX-XXXX"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-teal-500/40 text-sm font-mono uppercase tracking-wider text-teal-200 focus:border-teal-400 outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Te lo entrega tu asesor Sheerit al confirmar tu plan.
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tu nombre completo</label>
                  <input
                    required
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    placeholder="Ej: Carlos Pérez"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nombre de tu negocio</label>
                  <input
                    required
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="Ej: Studio Audio & Ventas"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1">Correo electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none"
              />
            </div>

            {authMode === 'register' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">¿Qué vende o atiende tu negocio? (opcional)</label>
                <textarea
                  rows={2}
                  value={registerDesc}
                  onChange={e => setRegisterDesc(e.target.value)}
                  placeholder="Ej: Venta de productos, citas médicas o soporte..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 font-semibold text-sm transition"
            >
              {authLoading ? 'Procesando...' : authMode === 'register' ? 'Crear cuenta (500 msgs/mes)' : 'Entrar a mi Bot Studio'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const usedMsgs = tenant?.messages_used_month || 0;
  const limitMsgs = tenant?.monthly_message_limit || 500;
  const usagePct = Math.min(100, Math.round((usedMsgs / Math.max(1, limitMsgs)) * 100));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Topbar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold">{tenant?.business_name || 'Mi Bot WhatsApp'}</h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 font-semibold">
                  {tenant?.plan_name || 'Plan Básico 30K'}
                </span>
                {tenant?.expires_at && (() => {
                  const expDate = new Date(tenant.expires_at);
                  const isExpired = expDate.getTime() < Date.now();
                  return (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${
                        isExpired
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {isExpired
                        ? 'Plan vencido — renovar con Sheerit'
                        : `Vigente hasta ${expDate.toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}`}
                    </span>
                  );
                })()}
              </div>
              <p className="text-xs text-slate-400">
                Hola, {tenant?.owner_name} • {tenant?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="min-w-[170px] bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Mensajes del mes</span>
                <span className="font-mono text-slate-200 font-semibold">{usedMsgs}/{limitMsgs}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${usagePct >= 90 ? 'bg-rose-500' : 'bg-teal-500'}`}
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => {
                const next = !cfgBotActive;
                setCfgBotActive(next);
                handleSaveConfig(next);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                cfgBotActive
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              {cfgBotActive ? 'Bot Activo' : 'Bot Pausado'}
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Salir
            </button>
          </div>
        </div>

        {bannerMsg && (
          <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            bannerMsg.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            {bannerMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{bannerMsg.text}</span>
          </div>
        )}

        {/* Navigation tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { id: 'whatsapp', label: '1. Conectar WhatsApp', icon: QrCode },
            { id: 'generator', label: '2. Generador IA & Prompt', icon: Sparkles },
            { id: 'elevenlabs', label: '3. Audios y Flujos', icon: Volume2 },
            { id: 'simulator', label: '4. Modo Prueba', icon: Play },
            { id: 'chats', label: '5. Chats en Vivo', icon: Send },
            { id: 'logs', label: '6. Historial y Mejoras', icon: MessageSquare },
            { id: 'data', label: '7. Datos & Sheets', icon: Database }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'chats') fetchLiveChats();
                  if (tab.id === 'data') fetchDataSources();
                }}
                className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition ${
                  active
                    ? 'bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-900/30'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: WhatsApp QR */}
        {activeTab === 'whatsapp' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 grid md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <QrCode className="w-5 h-5 text-teal-400" /> Vincula tu WhatsApp
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Cada negocio tiene su propia sesión aislada con comportamiento humano (pausas de lectura, simulación de escritura y grabación natural de notas de voz para evitar bloqueos).
              </p>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                <span className="text-slate-400">Estado actual:</span>
                <span className={`font-bold px-2.5 py-1 rounded-full ${
                  session.status === 'CONNECTED'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : session.status === 'QR_READY' || session.status === 'PAIRING_CODE_READY'
                    ? 'bg-amber-500/15 text-amber-300'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {session.status === 'CONNECTED'
                    ? `Conectado ${session.phone ? `(+${session.phone})` : ''}`
                    : session.status === 'PAIRING_CODE_READY'
                    ? 'Código numérico listo'
                    : session.status === 'QR_READY'
                    ? 'Esperando escaneo QR'
                    : session.status === 'CONNECTING'
                    ? 'Conectando...'
                    : 'Desconectado'}
                </span>
              </div>

              {session.status !== 'CONNECTED' ? (
                <div className="space-y-3">
                  <form onSubmit={handleRequestPairingCode} className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 space-y-2.5">
                    <div className="text-xs font-semibold text-teal-300">
                      Opción recomendada: Vincular con código de 8 dígitos
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Más estable que el QR porque no cambia cada pocos segundos. Escribe el número de WhatsApp que vas a conectar:
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        value={pairingPhone}
                        onChange={e => setPairingPhone(e.target.value)}
                        placeholder="Ej: 3001234567"
                        className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs outline-none focus:border-teal-400"
                      />
                      <button
                        type="submit"
                        disabled={busyAction === 'wa_pairing'}
                        className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 font-semibold text-xs text-white whitespace-nowrap"
                      >
                        {busyAction === 'wa_pairing' ? 'Generando código...' : 'Generar código 8 dígitos'}
                      </button>
                    </div>
                  </form>

                  <div className="flex flex-wrap gap-3 items-center">
                    <button
                      onClick={handleConnectWhatsApp}
                      disabled={busyAction === 'wa_connect'}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs flex items-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${busyAction === 'wa_connect' ? 'animate-spin' : ''}`} />
                      {session.status === 'QR_READY' ? 'Refrescar QR' : 'O conectar escaneando código QR'}
                    </button>
                    {(session.status === 'CONNECTING' || session.status === 'QR_READY' || session.status === 'PAIRING_CODE_READY') && (
                      <button
                        type="button"
                        onClick={handleDisconnectWhatsApp}
                        disabled={busyAction === 'wa_disconnect'}
                        className="px-4 py-2.5 rounded-xl bg-rose-600/15 border border-rose-500/35 text-rose-300 hover:bg-rose-600/25 font-semibold text-xs disabled:opacity-50"
                      >
                        {busyAction === 'wa_disconnect' ? 'Reiniciando...' : 'Reiniciar conexión'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleDisconnectWhatsApp}
                    disabled={busyAction === 'wa_disconnect'}
                    className="px-4 py-2.5 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30 font-semibold text-sm"
                  >
                    Desconectar WhatsApp
                  </button>
                </div>
              )}
              {session.lastError && (
                <p className="text-xs text-amber-400">Nota: {session.lastError}</p>
              )}
            </div>

            <div className="flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-2xl p-6 min-h-[260px]">
              {session.status === 'CONNECTED' ? (
                <div className="text-center space-y-2">
                  <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
                  <p className="font-bold text-emerald-300">¡WhatsApp conectado y respondiendo!</p>
                  <p className="text-xs text-slate-400">Línea activa: +{session.phone || 'Vinculada'}</p>
                </div>
              ) : session.pairingCode ? (() => {
                const remainingSec = session.qrUpdatedAt
                  ? Math.max(0, Math.ceil((180000 - (pairingNow - session.qrUpdatedAt)) / 1000))
                  : 180;
                const mins = Math.floor(remainingSec / 60);
                const secs = String(remainingSec % 60).padStart(2, '0');
                return (
                  <div className="text-center space-y-3 w-full">
                    <div className="text-xs text-teal-300 font-semibold">Código de vinculación WhatsApp</div>
                    <div className="inline-block px-5 py-3 rounded-xl bg-slate-900 border border-teal-500/40 font-mono text-2xl font-bold tracking-[0.25em] text-white select-all">
                      {session.pairingCode.length === 8 ? `${session.pairingCode.slice(0, 4)}-${session.pairingCode.slice(4)}` : session.pairingCode}
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold border ${
                          remainingSec === 0
                            ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                            : remainingSec <= 30
                              ? 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        }`}
                      >
                        {remainingSec > 0
                          ? `Vigente por ${mins}:${secs} · Se actualiza automáticamente`
                          : 'Renovando código automáticamente...'}
                      </span>
                    </div>
                    <ol className="text-[11px] text-slate-400 space-y-1 text-left max-w-xs mx-auto pt-1">
                      <li>1. Abre WhatsApp en tu celular → <strong className="text-slate-200">Dispositivos vinculados</strong>.</li>
                      <li>2. Toca <strong className="text-slate-200">Vincular un dispositivo</strong>.</li>
                      <li>3. Abajo elige <strong className="text-teal-300">Vincular con el número de teléfono</strong> e ingresa este código.</li>
                    </ol>
                  </div>
                );
              })() : session.qrDataUrl ? (
                <div className="text-center space-y-3">
                  <img src={session.qrDataUrl} alt="QR WhatsApp" className="w-56 h-56 rounded-xl bg-white p-2 mx-auto" />
                  <p className="text-xs text-slate-400">Escanea este código desde tu WhatsApp (se actualiza en vivo)</p>
                </div>
              ) : session.status === 'CONNECTING' ? (
                <div className="text-center text-slate-300 space-y-2.5">
                  <RefreshCw className="w-10 h-10 mx-auto text-teal-400 animate-spin" />
                  <p className="text-sm font-semibold text-white">Iniciando sesión de WhatsApp Web...</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">Esto tarda entre 10 y 25 segundos. El QR aparecerá aquí automáticamente.</p>
                </div>
              ) : (
                <div className="text-center text-slate-500 space-y-2">
                  <QrCode className="w-12 h-12 mx-auto opacity-40" />
                  <p className="text-xs">Genera un código numérico o un QR para vincular tu WhatsApp</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: AI Auto Generator & Prompt */}
        {activeTab === 'generator' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-400" /> Generador Automático de Bot
                </h2>
                <p className="text-xs text-slate-400">
                  Cuéntale qué hace tu negocio y la IA redactará el prompt y la base de conocimiento por ti.
                </p>
              </div>
              <button
                onClick={() => handleSaveConfig()}
                disabled={busyAction === 'save_cfg'}
                className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-xs sm:text-sm flex items-center gap-2 shrink-0"
              >
                <Save className="w-4 h-4" /> Guardar Configuración
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nombre del negocio</label>
                  <input
                    value={cfgBusinessName}
                    onChange={e => setCfgBusinessName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tono del asistente</label>
                  <select
                    value={cfgTone}
                    onChange={e => setCfgTone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm outline-none focus:border-teal-500"
                  >
                    <option value="amigable y cercano">Amigable y cercano</option>
                    <option value="profesional y ejecutivo">Profesional y ejecutivo</option>
                    <option value="vendedor persuasivo">Vendedor persuasivo</option>
                    <option value="breve y directo">Breve y directo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Pausa automática al intervenir tú (minutos)</label>
                  <input
                    type="number"
                    min={0}
                    max={1440}
                    value={cfgPauseMinutes}
                    onChange={e => setCfgPauseMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm outline-none focus:border-teal-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Si respondes desde tu WhatsApp, el bot pausa ese chat estos minutos y luego se reactiva solo (0 = nunca pausar).
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Descripción de tu negocio</label>
                  <textarea
                    rows={3}
                    value={cfgDescription}
                    onChange={e => setCfgDescription(e.target.value)}
                    placeholder="Ej: Somos una clínica odontológica en Medellín. Agendamos valoraciones..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-3 flex flex-col justify-between">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Productos, precios, horarios y medios de pago</label>
                  <textarea
                    rows={6}
                    value={cfgProducts}
                    onChange={e => setCfgProducts(e.target.value)}
                    placeholder="Ej: Plan Básico $80.000, Plan Pro $150.000. Horario lunes a sábado 8am-6pm..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm outline-none focus:border-teal-500"
                  />
                </div>
                <button
                  onClick={handleGenerateConfig}
                  disabled={busyAction === 'ai_gen'}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {busyAction === 'ai_gen' ? 'Generando con IA...' : '✨ Generar Configuración Automáticamente'}
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Instrucciones del Bot (System Prompt)</label>
                <textarea
                  rows={9}
                  value={cfgSystemPrompt}
                  onChange={e => setCfgSystemPrompt(e.target.value)}
                  placeholder="Aquí aparecerán las instrucciones generadas para tu bot..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono leading-relaxed outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Base de Conocimiento y FAQs</label>
                <textarea
                  rows={9}
                  value={cfgKnowledgeBase}
                  onChange={e => setCfgKnowledgeBase(e.target.value)}
                  placeholder="Aquí aparecerán tus productos, precios y respuestas frecuentes..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono leading-relaxed outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Uploaded Audios Library & AI Decider + Optional ElevenLabs */}
        {activeTab === 'elevenlabs' && (
          <div className="space-y-5">
            {/* Anti-ban Human Mode banner */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-100/90 space-y-1">
                <p className="font-bold text-emerald-300">Modo Sesión Humana Anti-Bloqueo Activo + Cero "Reenviado"</p>
                <p>
                  Cada audio que subas se re-codifica sin metadatos heredados a nota de voz nativa PTT. Al responderle a un cliente, el bot agrupa ráfagas de mensajes, hace una pausa humana para marcar leído, simula <em>"grabando audio..."</em> proporcional a la duración real y envía el audio unido como si acabaras de grabarlo en vivo.
                </p>
              </div>
            </div>

            {/* Upload Pre-recorded Audio Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Upload className="w-5 h-5 text-teal-400" /> Subir Audios Pregrabados para el Decididor IA
                </h2>
                <p className="text-xs text-slate-400">
                  Sube tus audios en MP3, OGG, WAV o M4A e indícale al bot en qué momento debe elegir y unir cada uno según lo que pregunte el cliente.
                </p>
              </div>

              <form onSubmit={handleUploadAudio} className="space-y-3 bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Título del audio o flujo</label>
                    <input
                      required
                      value={uploadTitle}
                      onChange={e => setUploadTitle(e.target.value)}
                      placeholder="Ej: Audio 1 - Saludo y precios"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">¿Cuándo debe enviarlo el decididor IA?</label>
                    <input
                      required
                      value={uploadTrigger}
                      onChange={e => setUploadTrigger(e.target.value)}
                      placeholder="Ej: Cuando saluda o pregunta precios del servicio"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Archivo de audio (.mp3, .ogg, .wav, .m4a)</label>
                    <input
                      type="file"
                      accept="audio/*,.mp3,.ogg,.wav,.m4a,.opus"
                      onChange={e => setUploadFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3 items-end pt-1 border-t border-slate-800/70">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Imagen después del audio (opcional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setUploadImageFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Texto complementario después del audio (opcional)</label>
                    <input
                      value={uploadFollowupText}
                      onChange={e => setUploadFollowupText(e.target.value)}
                      placeholder="Ej: Tabla de precios o texto junto a la imagen"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs outline-none focus:border-teal-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busyAction === 'upload_audio'}
                    className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {busyAction === 'upload_audio' ? 'Procesando y normalizando...' : 'Subir Audio / Flujo'}
                  </button>
                </div>
              </form>

              {/* Library List & Manual Merger */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-200">
                    Audios en tu Biblioteca ({audios.length}) — El bot los decide y une automáticamente
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Pausa al unir (ms):</span>
                    <input
                      type="number"
                      min={0}
                      max={2000}
                      step={50}
                      value={libPauseMs}
                      onChange={e => setLibPauseMs(Number(e.target.value))}
                      className="w-20 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-200"
                    />
                  </div>
                </div>

                {audios.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-950 border border-slate-800 rounded-xl p-6 text-center">
                    Todavía no has subido audios. Sube tu primer audio arriba para activar el Decididor Automático de Notas de Voz.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {audios.map(audio => {
                      const selIdx = selectedAudioIds.indexOf(audio.id);
                      return (
                        <div key={audio.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selIdx !== -1}
                                onChange={() => toggleSelectAudio(audio.id)}
                                className="accent-indigo-500 w-4 h-4"
                              />
                              <span className="font-semibold text-sm text-white">
                                {selIdx !== -1 && (
                                  <span className="mr-1.5 px-1.5 py-0.5 text-[10px] rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                                    #{selIdx + 1}
                                  </span>
                                )}
                                {audio.title}
                              </span>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                                {audio.duration_sec}s
                              </span>
                            </label>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleFavoriteAudio(audio.id)}
                                title={favoriteAudioIds.includes(audio.id) ? 'Quitar de favoritos' : 'Fijar como favorito en Chats en Vivo'}
                                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                  favoriteAudioIds.includes(audio.id)
                                    ? 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-amber-300'
                                }`}
                              >
                                <Star className={`w-3.5 h-3.5 ${favoriteAudioIds.includes(audio.id) ? 'fill-amber-300' : ''}`} />
                              </button>
                              <button
                                type="button"
                                onClick={() => (editingAudioId === audio.id ? setEditingAudioId(null) : startEditAudio(audio))}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-slate-900 border-slate-700 text-slate-200 hover:border-teal-400/50 flex items-center gap-1 cursor-pointer"
                              >
                                <Pencil className="w-3 h-3 text-teal-400" />
                                {editingAudioId === audio.id ? 'Cerrar' : 'Editar'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleAudioActive(audio)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                                  audio.is_active
                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                    : 'bg-slate-800 border-slate-700 text-slate-400'
                                }`}
                              >
                                {audio.is_active ? 'Activo en Bot' : 'Inactivo'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAudio(audio.id)}
                                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"
                                title="Eliminar audio"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {editingAudioId === audio.id ? (
                            <div className="p-3.5 rounded-xl bg-slate-900 border border-teal-500/35 space-y-3 text-xs">
                              <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] text-slate-400 mb-1">Nombre del audio</label>
                                  <input
                                    value={editAudioTitle}
                                    onChange={e => setEditAudioTitle(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs outline-none focus:border-teal-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] text-slate-400 mb-1">
                                    Reemplazar imagen adjunta (opcional)
                                  </label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => {
                                      setEditAudioImageFile(e.target.files?.[0] || null);
                                      if (e.target.files?.[0]) setEditAudioRemoveImage(false);
                                    }}
                                    className="w-full text-[11px] text-slate-300 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-200"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[11px] text-slate-400 mb-1">Cuándo debe enviarlo el bot</label>
                                <textarea
                                  rows={2}
                                  value={editAudioTrigger}
                                  onChange={e => setEditAudioTrigger(e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs outline-none focus:border-teal-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-slate-400 mb-1">Texto complementario después del audio (opcional)</label>
                                <textarea
                                  rows={2}
                                  value={editAudioFollowup}
                                  onChange={e => setEditAudioFollowup(e.target.value)}
                                  placeholder="Vacío si no lleva texto adicional..."
                                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs outline-none focus:border-teal-500"
                                />
                              </div>
                              {Boolean(audio.has_image) && !editAudioImageFile && (
                                <label className="flex items-center gap-2 text-[11px] text-rose-300 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editAudioRemoveImage}
                                    onChange={e => setEditAudioRemoveImage(e.target.checked)}
                                    className="accent-rose-500"
                                  />
                                  <span>Quitar imagen adjunta actual ({audio.image_filename || 'imagen'})</span>
                                </label>
                              )}
                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingAudioId(null)}
                                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" /> Cancelar
                                </button>
                                <button
                                  type="button"
                                  disabled={busyAction === `edit_audio_${audio.id}`}
                                  onClick={() => handleSaveEditAudio(audio.id)}
                                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  {busyAction === `edit_audio_${audio.id}` ? 'Guardando...' : 'Guardar cambios'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-xs text-slate-400">
                                <strong className="text-teal-400">Cuándo enviarlo:</strong> {audio.trigger_description}
                              </p>
                              {(Boolean(audio.has_image) || Boolean(audio.followup_text)) && (
                                <div className="flex flex-wrap gap-2 text-[11px]">
                                  {Boolean(audio.has_image) && (
                                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                                      🖼️ Imagen adjunta: {audio.image_filename || 'Sí'}
                                    </span>
                                  )}
                                  {audio.followup_text && (
                                    <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                                      💬 Texto después del audio: "{audio.followup_text}"
                                    </span>
                                  )}
                                </div>
                              )}
                            </>
                          )}

                          <audio
                            controls
                            preload="none"
                            src={`${apiBase}/api/saas-bot/audios/${audio.id}/stream?token=${encodeURIComponent(token)}`}
                            className="w-full h-9"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {audios.length > 0 && (
                  <div className="bg-slate-950 border border-indigo-500/30 rounded-xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-slate-300">
                        Prueba manual: marca 1 o varios audios arriba ({selectedAudioIds.length} seleccionados) para unirlos y enviarlos como nota de voz humana.
                      </span>
                      <button
                        type="button"
                        onClick={() => handleMergeLibraryAudios(false)}
                        disabled={busyAction === 'lib_merge' || busyAction === 'lib_merge_send' || selectedAudioIds.length === 0}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Volume2 className="w-4 h-4" />
                        {busyAction === 'lib_merge' ? 'Uniendo...' : 'Unir y Escuchar'}
                      </button>
                    </div>

                    {libMergedUrl && (
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-indigo-300 font-semibold">
                            Nota unida ({libMergedMeta?.filesCount} clips • {libMergedMeta?.durationSec}s)
                          </span>
                          <a
                            href={libMergedUrl}
                            download={`nota_unida_${Date.now()}.mp3`}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" /> Descargar MP3
                          </a>
                        </div>
                        <audio controls src={libMergedUrl} className="w-full h-9" />
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row gap-2 sm:items-center">
                      <input
                        value={libSendPhone}
                        onChange={e => setLibSendPhone(e.target.value)}
                        placeholder="Enviar nota de voz fresca (sin reenviado) al WhatsApp: Ej. 3001234567"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs outline-none focus:border-teal-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleMergeLibraryAudios(true)}
                        disabled={busyAction === 'lib_merge_send' || selectedAudioIds.length === 0 || session.status !== 'CONNECTED'}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-xs font-semibold flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {busyAction === 'lib_merge_send' ? 'Grabando y enviando...' : 'Grabar y Enviar por WhatsApp'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Optional ElevenLabs TTS Synthesizer (Collapsible) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowElevenLabsTts(v => !v)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition"
              >
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" /> Opcional: Generar audios por texto con API de ElevenLabs
                  </h3>
                  <p className="text-xs text-slate-400">
                    Para clientes que prefieran crear audios nuevos por texto o usar síntesis en tiempo real si no tienen audios subidos.
                  </p>
                </div>
                {showElevenLabsTts ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>

              {showElevenLabsTts && (
                <div className="p-6 pt-2 border-t border-slate-800 space-y-5">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        API Key ElevenLabs {tenant?.has_elevenlabs_key ? `(${tenant.elevenlabs_api_key_masked})` : ''}
                      </label>
                      <input
                        type="password"
                        value={elApiKeyInput}
                        onChange={e => setElApiKeyInput(e.target.value)}
                        placeholder={tenant?.has_elevenlabs_key ? 'Guardada (pega para cambiar)' : 'sk_...'}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Voz principal</label>
                      <div className="flex gap-1.5">
                        {voices.length > 0 ? (
                          <select
                            value={elVoiceId}
                            onChange={e => setElVoiceId(e.target.value)}
                            className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs outline-none focus:border-teal-500"
                          >
                            <option value="">Selecciona voz...</option>
                            {voices.map(v => (
                              <option key={v.voice_id} value={v.voice_id}>{v.name}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            value={elVoiceId}
                            onChange={e => setElVoiceId(e.target.value)}
                            placeholder="Voice ID de ElevenLabs"
                            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs outline-none focus:border-teal-500"
                          />
                        )}
                        <button
                          type="button"
                          onClick={handleLoadVoices}
                          disabled={busyAction === 'load_voices'}
                          className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold shrink-0"
                          title="Cargar voces"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Modo respuesta TTS (sin biblioteca)</label>
                      <select
                        value={elReplyMode}
                        onChange={e => setElReplyMode(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs outline-none focus:border-teal-500"
                      >
                        <option value="text">Solo texto</option>
                        <option value="auto_match">Nota de voz cuando envíen audio</option>
                        <option value="voice">Siempre responder con nota de voz</option>
                      </select>
                    </div>
                    <div className="flex items-end gap-2">
                      <label className="flex-1 flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                        <span className="text-xs font-semibold text-slate-300">Activar TTS</span>
                        <input
                          type="checkbox"
                          checked={elEnabled}
                          onChange={e => setElEnabled(e.target.checked)}
                          className="accent-teal-500 w-4 h-4"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => handleSaveConfig()}
                        className="px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold"
                      >
                        Guardar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-300">Generar & Unir guiones por texto (ElevenLabs API)</span>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Pausa (ms):</span>
                        <input
                          type="number"
                          min={0}
                          max={2000}
                          step={50}
                          value={pauseMs}
                          onChange={e => setPauseMs(Number(e.target.value))}
                          className="w-20 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 font-mono"
                        />
                      </div>
                    </div>

                    {segments.map((seg, idx) => (
                      <div key={seg.id} className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-teal-400">Segmento #{idx + 1}</span>
                          {segments.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setSegments(prev => prev.filter(s => s.id !== seg.id))}
                              className="text-rose-400 hover:text-rose-300"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={2}
                          value={seg.text}
                          onChange={e => setSegments(prev => prev.map(s => s.id === seg.id ? { ...s, text: e.target.value } : s))}
                          className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs outline-none"
                        />
                      </div>
                    ))}

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        disabled={segments.length >= 10}
                        onClick={() => setSegments(prev => [...prev, { id: `seg_${Date.now()}`, text: '', voiceId: '' }])}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Añadir segmento
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMergeAudio(false)}
                        disabled={busyAction === 'merge_only' || busyAction === 'merge_send'}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold"
                      >
                        {busyAction === 'merge_only' ? 'Generando...' : 'Generar y Unir MP3'}
                      </button>
                    </div>

                    {mergedAudioUrl && (
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-indigo-300">{mergedMeta?.segmentsCount} segmentos • {mergedMeta?.totalChars} chars</span>
                          <a href={mergedAudioUrl} download={`elevenlabs_${Date.now()}.mp3`} className="text-xs text-emerald-400 underline">
                            Descargar MP3
                          </a>
                        </div>
                        <audio controls src={mergedAudioUrl} className="w-full h-9" />
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
                      <input
                        value={sendToPhone}
                        onChange={e => setSendToPhone(e.target.value)}
                        placeholder="Número WhatsApp destino (Ej: 3001234567)"
                        className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleMergeAudio(true)}
                        disabled={busyAction === 'merge_send' || session.status !== 'CONNECTED'}
                        className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-xs font-semibold"
                      >
                        Enviar por WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Chats en Vivo y Control Manual (Modo Semiautomático) */}
        {activeTab === 'chats' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Send className="w-5 h-5 text-teal-400" /> Chats en Vivo y Envío Manual con 1 Clic
                </h2>
                <p className="text-xs text-slate-400">
                  Cuando respondes desde tu WhatsApp o desde aquí, el bot se pausa automáticamente {cfgPauseMinutes} min en ese chat para no interrumpir tu cierre.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchLiveChats}
                disabled={busyAction === 'load_chats'}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs flex items-center gap-1.5 self-start"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${busyAction === 'load_chats' ? 'animate-spin' : ''}`} /> Actualizar chats
              </button>
            </div>

            {liveChats.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-950 border border-slate-800 rounded-xl">
                Aún no hay conversaciones registradas. En cuanto lleguen clientes a tu WhatsApp aparecerán aquí para tomar control manual o disparar audios con 1 clic.
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {/* Lista de chats */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2 space-y-1.5 max-h-[540px] overflow-y-auto">
                  {liveChats.map(chat => {
                    const selected = selectedChatId === chat.chatId;
                    return (
                      <button
                        key={chat.chatId}
                        type="button"
                        onClick={() => openLiveChat(chat.chatId)}
                        className={`w-full text-left p-3 rounded-lg border transition text-xs space-y-1 ${
                          selected
                            ? 'bg-teal-600/15 border-teal-500/50 text-white'
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-semibold truncate">+{chat.phone}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                              chat.isPaused
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-emerald-500/15 text-emerald-300'
                            }`}
                          >
                            {chat.isPaused ? '👤 Manual' : '🤖 Auto'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{chat.lastBody}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Conversación activa + Botones rápidos */}
                <div className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                  {!selectedChatId ? (
                    <div className="flex-1 flex items-center justify-center text-xs text-slate-500 py-16">
                      Selecciona una conversación de la izquierda.
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                        <div>
                          <div className="text-sm font-bold font-mono text-white">+{selectedChatId.replace(/@.*/, '')}</div>
                          <div className="text-[11px] text-slate-400">
                            {selectedChatPaused ? '👤 En control manual (bot pausado en este chat)' : '🤖 Atención automática activa'}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={busyAction === 'pause_chat'}
                          onClick={() => handleToggleChatPause(selectedChatId, !selectedChatPaused)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                            selectedChatPaused
                              ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30'
                              : 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                          }`}
                        >
                          {selectedChatPaused ? 'Reactivar Bot Automático' : 'Pausar Bot (Tomar Control)'}
                        </button>
                      </div>

                      <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                        {chatMessages.map(m => (
                          <div
                            key={m.id}
                            className={`p-2.5 rounded-xl text-xs max-w-[88%] ${
                              m.direction === 'in'
                                ? 'bg-slate-900 border border-slate-800 text-slate-200 mr-auto'
                                : 'bg-teal-600/20 border border-teal-500/30 text-teal-100 ml-auto'
                            }`}
                          >
                            <div className="text-[10px] text-slate-400 mb-0.5">
                              {m.direction === 'in' ? 'Cliente' : m.message_type === 'human' ? '👤 Tú (manual)' : '🤖 Bot'} •{' '}
                              {new Date(m.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="whitespace-pre-wrap">{m.body}</div>
                          </div>
                        ))}
                      </div>

                      {/* Botones rápidos de 1 clic para flujos (favoritos fijados arriba) */}
                      {audios.length > 0 && (() => {
                        const term = chatAudioSearch.trim().toLowerCase();
                        const sortedAudios = [...audios]
                          .filter(a => !term || a.title.toLowerCase().includes(term) || a.trigger_description.toLowerCase().includes(term))
                          .sort((a, b) => {
                            const aFav = favoriteAudioIds.includes(a.id) ? 1 : 0;
                            const bFav = favoriteAudioIds.includes(b.id) ? 1 : 0;
                            if (aFav !== bFav) return bFav - aFav;
                            return a.id - b.id;
                          });

                        return (
                          <div className="pt-2 border-t border-slate-800 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="text-[11px] font-semibold text-teal-300">
                                ⚡ Disparo rápido con 1 clic (⭐ Favoritos aparecen primero):
                              </div>
                              <input
                                value={chatAudioSearch}
                                onChange={e => setChatAudioSearch(e.target.value)}
                                placeholder="Buscar audio rápido (ej: precio, cobertura)..."
                                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] w-full sm:w-60 outline-none focus:border-teal-500"
                              />
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                              {sortedAudios.map(a => {
                                const isFav = favoriteAudioIds.includes(a.id);
                                return (
                                  <div
                                    key={a.id}
                                    className={`inline-flex items-center rounded-lg border overflow-hidden ${
                                      isFav
                                        ? 'bg-amber-500/15 border-amber-400/50 text-amber-200'
                                        : a.is_active
                                          ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-200'
                                          : 'bg-slate-800/80 border-slate-700 text-slate-300'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => handleToggleFavoriteAudio(a.id)}
                                      title={isFav ? 'Quitar favorito' : 'Fijar como favorito'}
                                      className="px-1.5 py-1.5 hover:bg-black/20 cursor-pointer"
                                    >
                                      <Star className={`w-3 h-3 ${isFav ? 'text-amber-300 fill-amber-300' : 'text-slate-500 hover:text-amber-300'}`} />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={session.status !== 'CONNECTED' || busyAction === `manual_flow_${a.id}`}
                                      onClick={() => handleSendManualFlow({ audioIds: [a.id] })}
                                      className="pr-2.5 pl-1 py-1.5 hover:bg-black/15 disabled:opacity-40 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Volume2 className="w-3 h-3" />
                                      {busyAction === `manual_flow_${a.id}` ? 'Enviando...' : a.title}
                                      {Boolean(a.has_image) && <span>🖼️</span>}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Envío manual de texto */}
                      <form
                        onSubmit={e => {
                          e.preventDefault();
                          if (manualChatText.trim()) handleSendManualFlow({ text: manualChatText.trim() });
                        }}
                        className="flex gap-2 pt-1"
                      >
                        <input
                          value={manualChatText}
                          onChange={e => setManualChatText(e.target.value)}
                          placeholder="Escribe un mensaje manual para cerrar la venta..."
                          className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs outline-none focus:border-teal-500"
                        />
                        <button
                          type="submit"
                          disabled={!manualChatText.trim() || session.status !== 'CONNECTED' || busyAction === 'manual_text'}
                          className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-xs font-semibold text-white flex items-center gap-1"
                        >
                          <Send className="w-3.5 h-3.5" /> Enviar
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Modo Prueba (Simulador sin WhatsApp) */}
        {activeTab === 'simulator' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Play className="w-5 h-5 text-teal-400" /> Modo Prueba (Simulador de Chat en Vivo)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Prueba exactamente qué audio, imagen, texto o pausa elegiría tu bot con tus reglas y biblioteca actuales. No requiere WhatsApp conectado, no escribe a clientes reales y no consume tu cuota mensual.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSimHumanPaused(prev => !prev)}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    simHumanPaused
                      ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 hover:bg-amber-500/30'
                      : 'bg-slate-950 border-slate-700 text-slate-200 hover:border-teal-500/50'
                  }`}
                >
                  {simHumanPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-300" /> Reactivar bot (Auto)
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-300" /> Simular toma manual ({cfgPauseMinutes} min)
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleResetSimulation}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reiniciar chat
                </button>
              </div>
            </div>

            {/* Escenarios rápidos de prueba */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400">Pruebas rápidas:</span>
              <button
                type="button"
                disabled={busyAction === 'simulate_chat'}
                onClick={() => handleRunSimulation(['Hola, quiero información'])}
                className="px-3 py-1 rounded-full bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-200 cursor-pointer"
              >
                👋 Primer saludo
              </button>
              <button
                type="button"
                disabled={busyAction === 'simulate_chat'}
                onClick={() => handleRunSimulation(['¿Cuánto valen 3 tarros?', 'Estoy en Medellín'])}
                className="px-3 py-1 rounded-full bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-200 cursor-pointer"
              >
                ⚡ 2 mensajes seguidos (Precio + Ciudad)
              </button>
              <button
                type="button"
                disabled={busyAction === 'simulate_chat'}
                onClick={() => handleRunSimulation(['Perdón, quise decir Envigado, ¿cuándo llega?'])}
                className="px-3 py-1 rounded-full bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-200 cursor-pointer"
              >
                📍 Corrección de ciudad
              </button>
            </div>

            {simHumanPaused && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center justify-between gap-2 flex-wrap">
                <span className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <strong>Control manual activo:</strong> mientras esté activo, si el cliente vuelve a escribir, el bot guardará silencio tal como en producción.
                </span>
              </div>
            )}

            {/* Hilo visual de WhatsApp simulado */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 h-[420px] overflow-y-auto space-y-3">
              {simMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2 px-4">
                  <Bot className="w-8 h-8 text-teal-400/70" />
                  <p className="text-xs max-w-md">
                    Escribe un mensaje abajo o haz clic en una prueba rápida. Verás exactamente qué audio de tu biblioteca, imagen y texto elegiría <strong className="text-slate-300">{cfgBusinessName || 'tu bot'}</strong> en este momento.
                  </p>
                </div>
              ) : (
                simMessages.map(msg => {
                  if (msg.sender === 'customer') {
                    return (
                      <div key={msg.id} className="flex justify-start">
                        <div className="max-w-[82%] bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs text-slate-100 space-y-1">
                          <div className="text-[10px] font-bold text-cyan-300 flex items-center justify-between gap-3">
                            <span>Cliente simulado {msg.burst ? `(${msg.burst.length} mensajes seguidos)` : ''}</span>
                            <span className="text-slate-500 font-normal">{msg.timestamp}</span>
                          </div>
                          {msg.burst ? (
                            <div className="space-y-1">
                              {msg.burst.map((line, idx) => (
                                <div key={idx} className="px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-700/70">
                                  {line}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (msg.sender === 'human') {
                    return (
                      <div key={msg.id} className="flex justify-end">
                        <div className="max-w-[82%] bg-indigo-950/70 border border-indigo-500/40 rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-xs text-slate-100 space-y-1">
                          <div className="text-[10px] font-bold text-indigo-300 flex items-center justify-between gap-3">
                            <span>👤 Tú (Asesor humano)</span>
                            <span className="text-slate-400 font-normal">{msg.timestamp}</span>
                          </div>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    );
                  }

                  if (msg.pausedByHuman) {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 max-w-lg text-center">
                          ⏸️ <strong>Bot en silencio:</strong> {msg.reason}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[85%] bg-teal-950/60 border border-teal-500/35 rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-xs text-slate-100 space-y-2.5">
                        <div className="text-[10px] font-bold text-teal-300 flex items-center justify-between gap-3">
                          <span>🤖 Bot ({msg.mode || 'auto'})</span>
                          <span className="text-slate-400 font-normal">{msg.timestamp}</span>
                        </div>

                        {msg.audios && msg.audios.length > 0 && (
                          <div className="space-y-2">
                            {msg.audios.map(aud => (
                              <div key={aud.id} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                                    <Volume2 className="w-3.5 h-3.5 shrink-0" /> Nota de voz: {aud.title} ({aud.duration_sec}s)
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-500">ID #{aud.id}</span>
                                </div>
                                {simAudioBlobUrls[aud.id] ? (
                                  <audio controls src={simAudioBlobUrls[aud.id]} className="w-full h-8" />
                                ) : (
                                  <div className="text-[10px] text-slate-400">Cargando reproductor...</div>
                                )}
                                {aud.hasImage && (
                                  <div className="space-y-1 pt-1 border-t border-slate-800/80">
                                    <div className="text-[10px] font-semibold text-cyan-300">
                                      🖼️ Imagen adjunta: {aud.image_filename || 'adjunta'}
                                    </div>
                                    {simImageBlobUrls[aud.id] && (
                                      <img
                                        src={simImageBlobUrls[aud.id]}
                                        alt={aud.image_filename || aud.title}
                                        className="max-h-48 rounded-lg border border-slate-800 object-contain"
                                      />
                                    )}
                                  </div>
                                )}
                                {aud.followup_text && (
                                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-200 whitespace-pre-wrap">
                                    {aud.followup_text}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {msg.text && (
                          <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-100 whitespace-pre-wrap">
                            {msg.text}
                          </div>
                        )}

                        {msg.reason && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => setSimExpandedWhyId(prev => (prev === msg.id ? null : msg.id))}
                              className="text-[10px] font-semibold text-teal-300 hover:text-teal-200 flex items-center gap-1 cursor-pointer"
                            >
                              {simExpandedWhyId === msg.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              ¿Por qué eligió esto?
                            </button>
                            {simExpandedWhyId === msg.id && (
                              <div className="mt-1.5 p-2 rounded-lg bg-slate-950/90 border border-teal-500/20 text-[11px] text-slate-300">
                                {msg.reason}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Composer: Mensajes seguidos de cliente + respuesta manual asesor */}
            <div className="grid lg:grid-cols-2 gap-4">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleRunSimulation();
                }}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-cyan-300">Mensaje(s) del cliente de prueba</span>
                  <button
                    type="button"
                    onClick={() => setSimBurstDrafts(prev => (prev.length < 5 ? [...prev, ''] : prev))}
                    className="text-[11px] font-semibold text-teal-300 hover:text-teal-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Añadir mensaje seguido
                  </button>
                </div>
                <div className="space-y-2">
                  {simBurstDrafts.map((draft, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        value={draft}
                        onChange={e =>
                          setSimBurstDrafts(prev => prev.map((v, i) => (i === idx ? e.target.value : v)))
                        }
                        placeholder={
                          idx === 0
                            ? 'Ej: Hola, quiero información de ResvisFactor'
                            : `Mensaje seguido #${idx + 1} (en el mismo turno)`
                        }
                        className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs outline-none focus:border-teal-500"
                      />
                      {simBurstDrafts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSimBurstDrafts(prev => prev.filter((_, i) => i !== idx))}
                          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={busyAction === 'simulate_chat'}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {busyAction === 'simulate_chat' ? 'Simulando respuesta...' : 'Simular envío'}
                  </button>
                </div>
              </form>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-indigo-300">Responder como asesor humano (opcional)</div>
                  <p className="text-[11px] text-slate-400">
                    Envía un mensaje manual para activar la pausa automática y comprobar que el bot cede el control del chat.
                  </p>
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    value={simHumanReply}
                    onChange={e => setSimHumanReply(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendSimHumanReply();
                      }
                    }}
                    placeholder="Ej: ¡Claro! En Sabaneta te llega hoy mismo..."
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    disabled={!simHumanReply.trim()}
                    onClick={handleSendSimHumanReply}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Tomar chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Historial y Ajustes de Mejora */}
        {activeTab === 'logs' && (() => {
          const proposedList = improvements.filter(
            i =>
              i.status === 'proposed' ||
              i.status === 'accepted' ||
              i.status === 'escalated_core' ||
              i.status === 'queued_restart'
          );
          const appliedList = improvements.filter(
            i => i.status === 'applied' || i.status === 'reverted' || i.status === 'queued_restart'
          );
          const chatThread = [...improvements].filter(i => i.status !== 'dismissed').reverse();

          return (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-teal-400" /> Historial y Ajustes de Mejora
                  </h2>
                  <p className="text-xs text-slate-400">
                    Revisa qué respondió tu bot, pregunta por qué eligió cada audio y aprueba mejoras con opción de deshacer.
                  </p>
                </div>
                <button
                  onClick={() => fetchDashboard(token)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs flex items-center gap-1.5 self-start"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Actualizar
                </button>
              </div>

              {/* Sub-pestañas */}
              <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setLogsSubTab('history')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    logsSubTab === 'history' ? 'bg-teal-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Historial ({logs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLogsSubTab('proposals')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    logsSubTab === 'proposals' ? 'bg-teal-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Ajustes de Mejora ({proposedList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLogsSubTab('applied')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    logsSubTab === 'applied' ? 'bg-teal-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Cambios Aplicados ({appliedList.length})
                </button>
              </div>

              {/* Sub-tab 1: Historial paginado con ¿Por qué respondió esto? */}
              {logsSubTab === 'history' && (
                <div className="space-y-3">
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      handleLoadMoreLogs(true);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      value={logsSearch}
                      onChange={e => setLogsSearch(e.target.value)}
                      placeholder="Buscar por mensaje o número de cliente..."
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs outline-none focus:border-teal-500"
                    />
                    <button
                      type="submit"
                      disabled={busyAction === 'load_logs'}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
                    >
                      Buscar
                    </button>
                  </form>

                  {logs.length === 0 ? (
                    <p className="text-xs text-slate-500 py-8 text-center">Aún no hay conversaciones registradas.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                      {logs.map(l => {
                        const isOut = l.direction === 'out';
                        const hasWhy = isOut && (l.decision_meta?.reason || (l.decision_meta?.audioTitles && l.decision_meta.audioTitles.length > 0));
                        const isWhyOpen = expandedWhyId === l.id;
                        const isImproveOpen = activeImproveMsgId === l.id;

                        return (
                          <div key={l.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="font-mono">
                                {l.direction === 'in' ? '📥 Cliente' : '🤖 Bot'} ({l.message_type}) • {l.customer_jid.replace(/@.*/, '')}
                              </span>
                              <span>{new Date(l.created_at).toLocaleString('es-CO')}</span>
                            </div>
                            <p className="text-slate-200 whitespace-pre-wrap">{l.body}</p>

                            {isOut && (
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                {hasWhy && (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedWhyId(isWhyOpen ? null : l.id)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-300 flex items-center gap-1"
                                  >
                                    {isWhyOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    ¿Por qué respondió esto?
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveImproveMsgId(isImproveOpen ? null : l.id);
                                    setInlineQuestion('');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-[11px] text-teal-300 flex items-center gap-1"
                                >
                                  <Sparkles className="w-3 h-3" /> Consultar o ajustar respuesta
                                </button>
                              </div>
                            )}

                            {isWhyOpen && l.decision_meta && (
                              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                                {l.decision_meta.audioTitles && l.decision_meta.audioTitles.length > 0 && (
                                  <div>
                                    <span className="text-teal-400 font-semibold">Audio(s) elegido(s):</span>{' '}
                                    {l.decision_meta.audioTitles.join(' + ')}
                                  </div>
                                )}
                                {l.decision_meta.reason && (
                                  <div>
                                    <span className="text-teal-400 font-semibold">Motivo:</span> {l.decision_meta.reason}
                                  </div>
                                )}
                              </div>
                            )}

                            {isImproveOpen && (
                              <div className="p-3 rounded-lg bg-slate-900 border border-teal-500/30 space-y-2">
                                <label className="block text-[11px] text-teal-300 font-semibold">
                                  ¿Qué quieres saber o ajustar sobre esta respuesta?
                                </label>
                                <textarea
                                  rows={2}
                                  value={inlineQuestion}
                                  onChange={e => setInlineQuestion(e.target.value)}
                                  placeholder="Ej: ¿Por qué envió este audio? Prefiero que cuando pregunten por precio en Bogotá envíe el audio de cobertura..."
                                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs outline-none focus:border-teal-500"
                                />
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setActiveImproveMsgId(null)}
                                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-[11px] text-slate-300"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busyAction === `imp_msg_${l.id}`}
                                    onClick={() => handleCreateImprovement(l.id, inlineQuestion)}
                                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-[11px] font-semibold text-white flex items-center gap-1"
                                  >
                                    <Send className="w-3 h-3" />
                                    {busyAction === `imp_msg_${l.id}` ? 'Analizando...' : 'Analizar con Asistente'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {logsHasMore && logs.length > 0 && (
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        disabled={busyAction === 'load_logs'}
                        onClick={() => handleLoadMoreLogs(false)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold text-slate-200"
                      >
                        {busyAction === 'load_logs' ? 'Cargando más...' : 'Cargar más historial'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 2: Ajustes de Mejora (Chat Iterativo Continuo) */}
              {logsSubTab === 'proposals' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 h-[460px] overflow-y-auto space-y-4">
                    {chatThread.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2 px-4">
                        <Sparkles className="w-7 h-7 text-teal-400/70" />
                        <p className="text-xs max-w-md">
                          Este es tu chat de mejora continua con IA. Pregunta por qué tu bot respondió algo o pide un nuevo ajuste abajo, itera con <strong className="text-slate-300">Continuar</strong>, confirma con <strong className="text-slate-300">Aceptar</strong> y carga con <strong className="text-slate-300">Aplicar</strong>.
                        </p>
                      </div>
                    ) : (
                      chatThread.map(imp => {
                        const isCore = imp.scope === 'core_engine' || imp.status === 'escalated_core' || imp.status === 'queued_restart';
                        const statusPill =
                          imp.status === 'applied'
                            ? { label: '✓ Aplicada en tu instancia', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' }
                            : imp.status === 'queued_restart'
                              ? { label: '⏳ En fila de reinicio', cls: 'bg-amber-500/15 text-amber-200 border-amber-500/35' }
                              : imp.status === 'accepted'
                                ? { label: 'Aceptada', cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35' }
                                : imp.status === 'reverted'
                                  ? { label: 'Revertida', cls: 'bg-slate-800 text-slate-400 border-slate-700' }
                                  : { label: 'Propuesta', cls: 'bg-teal-500/15 text-teal-300 border-teal-500/30' };

                        return (
                          <div key={imp.id} className="space-y-2.5">
                            {/* Burbuja Cliente (derecha) */}
                            <div className="flex justify-end">
                              <div className="max-w-[85%] bg-teal-950/65 border border-teal-500/35 rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-xs text-slate-100 space-y-1">
                                <div className="flex items-center justify-between gap-3 text-[10px] text-teal-300 font-semibold">
                                  <span>Tú · Ajuste #{imp.id}</span>
                                  <span className="text-slate-400 font-normal">
                                    {new Date(imp.created_at).toLocaleString('es-CO')}
                                  </span>
                                </div>
                                <p className="whitespace-pre-wrap leading-relaxed">{imp.client_question}</p>
                              </div>
                            </div>

                            {/* Burbuja Asistente (izquierda) */}
                            <div className="flex justify-start">
                              <div className="max-w-[90%] bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-slate-100 space-y-2.5">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <span className="text-[11px] font-semibold text-teal-300 flex items-center gap-1.5">
                                    <Bot className="w-3.5 h-3.5" /> Asistente Sheerit IA
                                  </span>
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusPill.cls}`}>
                                    {statusPill.label}
                                  </span>
                                </div>

                                {imp.explanation_plain && (
                                  <p className="text-slate-200 leading-relaxed">{imp.explanation_plain}</p>
                                )}

                                {imp.practical_proposal && (
                                  <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/25 space-y-1">
                                    <div className="text-[10px] font-semibold text-teal-300 uppercase tracking-wider">
                                      Propuesta práctica
                                    </div>
                                    <p className="text-slate-100 leading-relaxed">{imp.practical_proposal}</p>
                                  </div>
                                )}

                                {imp.status === 'queued_restart' && (
                                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-200 text-[11px]">
                                    ⏳ En fila para próximo reinicio del servidor (tu instancia actual sigue operando sin cortes).
                                  </div>
                                )}

                                {/* Botones: Continuar / Aceptar / Aplicar */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRefiningImpId(imp.id);
                                        setTimeout(() => refiningInputRef.current?.focus(), 40);
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
                                    >
                                      Continuar
                                    </button>

                                    {(imp.status === 'proposed' || imp.status === 'escalated_core') && (
                                      <button
                                        type="button"
                                        disabled={busyAction === `imp_accept_${imp.id}`}
                                        onClick={() => handleAcceptImprovement(imp.id)}
                                        className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/35 border border-cyan-500/40 text-xs font-semibold text-cyan-200 disabled:opacity-50 cursor-pointer"
                                      >
                                        {busyAction === `imp_accept_${imp.id}` ? 'Aceptando...' : 'Aceptar'}
                                      </button>
                                    )}

                                    {imp.status === 'accepted' && (
                                      <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-[11px] font-semibold text-cyan-300">
                                        ✓ Aceptada
                                      </span>
                                    )}

                                    {imp.status === 'applied' ? (
                                      <button
                                        type="button"
                                        disabled={busyAction === `imp_revert_${imp.id}`}
                                        onClick={() => handleRevertImprovement(imp.id)}
                                        className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold cursor-pointer"
                                      >
                                        {busyAction === `imp_revert_${imp.id}` ? 'Revirtiendo...' : 'Revertir'}
                                      </button>
                                    ) : imp.status !== 'queued_restart' && (
                                      <button
                                        type="button"
                                        disabled={busyAction === `imp_apply_${imp.id}`}
                                        onClick={() => handleApplyImprovement(imp.id)}
                                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {busyAction === `imp_apply_${imp.id}`
                                          ? 'Aplicando...'
                                          : isCore
                                            ? 'Aplicar (poner en fila)'
                                            : 'Aplicar (reiniciar instancia)'}
                                      </button>
                                    )}
                                  </div>

                                  {(imp.status === 'proposed' || imp.status === 'accepted') && (
                                    <button
                                      type="button"
                                      disabled={busyAction === `imp_dismiss_${imp.id}`}
                                      onClick={() => handleDismissImprovement(imp.id)}
                                      className="px-2.5 py-1 rounded-lg text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
                                    >
                                      Descartar
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Composer inferior del chat */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                    {refiningImpId !== null && (
                      <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-[11px] text-teal-200">
                        <span>↩️ Continuando sobre Ajuste #{refiningImpId}</span>
                        <button
                          type="button"
                          onClick={() => setRefiningImpId(null)}
                          className="text-slate-400 hover:text-white font-semibold cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                    <textarea
                      ref={refiningInputRef}
                      rows={2}
                      value={generalQuestion}
                      onChange={e => setGeneralQuestion(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleCreateImprovement(null, generalQuestion);
                        }
                      }}
                      placeholder="Escribe para iterar o pedir un nuevo ajuste (Enter para enviar)..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs outline-none focus:border-teal-500"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={busyAction === 'imp_general'}
                        onClick={() => handleCreateImprovement(null, generalQuestion)}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {busyAction === 'imp_general' ? 'Analizando...' : 'Enviar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Cambios Aplicados (con Deshacer) */}
              {logsSubTab === 'applied' && (
                <div className="space-y-3">
                  {appliedList.length === 0 ? (
                    <p className="text-xs text-slate-500 py-8 text-center">
                      Aún no has aplicado ningún ajuste de mejora. Cuando apruebes uno aparecerá aquí por si deseas deshacerlo.
                    </p>
                  ) : (
                    appliedList.map(imp => {
                      const isApplied = imp.status === 'applied';
                      const isQueued = imp.status === 'queued_restart';
                      return (
                        <div key={imp.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-200">Ajuste #{imp.id}</span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                                  isApplied
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                    : isQueued
                                      ? 'bg-amber-500/15 text-amber-200 border-amber-500/35'
                                      : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {isApplied ? 'Activo en tu bot' : isQueued ? '⏳ En fila de reinicio' : 'Deshecho'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {imp.applied_at ? `Aplicado: ${new Date(imp.applied_at).toLocaleString('es-CO')}` : ''}
                            </span>
                          </div>

                          <p className="text-slate-300">{imp.practical_proposal || imp.client_question}</p>

                          <div className="flex justify-end">
                            {isApplied ? (
                              <button
                                type="button"
                                disabled={busyAction === `imp_revert_${imp.id}`}
                                onClick={() => handleRevertImprovement(imp.id)}
                                className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                {busyAction === `imp_revert_${imp.id}` ? 'Revirtiendo...' : 'Deshacer ajuste'}
                              </button>
                            ) : isQueued ? (
                              <span className="text-[11px] text-amber-300 font-medium">
                                Esperando próximo reinicio programado del servidor
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={busyAction === `imp_apply_${imp.id}`}
                                onClick={() => handleApplyImprovement(imp.id)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                              >
                                Volver a aplicar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Tab 7: Datos, Excel Pro & Google Sheets en Vivo */}
        {activeTab === 'data' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Database className="w-5 h-5 text-sky-400" /> Base de Datos Pro & Google Sheets en Vivo
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Conecta tu hoja de Google Sheets en tiempo real o sube archivos Excel/CSV directamente a Sheerit para que tu bot consulte coberturas, bodegas, precios y stock al responder.
                </p>
              </div>
              {dataModuleEnabled && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-semibold self-start">
                  ✓ Módulo Activo
                </span>
              )}
            </div>

            {!dataModuleEnabled ? (
              <div className="bg-gradient-to-br from-slate-950 via-[#07111F] to-slate-900 border border-sky-500/35 rounded-2xl p-6 space-y-5 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/35 text-sky-300 text-[11px] font-mono font-bold uppercase">
                    Módulo Avanzado · Datos, CRM & Hojas Conectadas
                  </span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-emerald-300">
                    +$25.000 COP/mes · O Gratis ($0) como 1er módulo en Plan Pro 30K
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-teal-300 text-sm">1. Conector Google Sheets en Vivo</div>
                    <p className="text-slate-300 leading-relaxed">
                      Pega el enlace de tu hoja (cobertura de bodegas, rutas, horas de corte, catálogo). Se sincroniza automáticamente cada pocos minutos y el bot la consulta antes de responder y elegir el audio exacto.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-sky-300 text-sm">2. Modo Pro: Subir Datos directo a Sheerit</div>
                    <p className="text-slate-300 leading-relaxed">
                      Importa tu Excel (.xlsx) o CSV directamente en nuestra infraestructura propia: búsquedas instantáneas, cero caídas por permisos externos y tu operación creciendo dentro de un sistema real.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                  <p className="text-[11px] text-slate-400 max-w-xl">
                    Nota: Si estás en <strong className="text-white">Plan Pro ($30k)</strong> o <strong className="text-white">Scale ($60k)</strong>, puedes pedirlo usando tu cupo incluido sin costo adicional (o agregarlo como módulo adicional por $25.000/mes).
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const msg =
                        `¡Hola Sheerit! Quiero activar el módulo *Base de Datos CRM & Hojas Conectadas (Google Sheets / Excel Pro)* en mi Bot Studio (/mi-bot).\n\n` +
                        `🏢 *Negocio:* ${tenant?.business_name || cfgBusinessName}\n` +
                        `📦 *Plan actual:* ${tenant?.plan_name || 'Plan Básico 30K'}\n` +
                        `¿Me ayudas a habilitarlo?`;
                      window.open(getWaLink(msg), '_blank');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-teal-400 hover:from-sky-300 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg cursor-pointer"
                  >
                    <Send className="w-4 h-4" /> Solicitar activación por WhatsApp
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-5">
                  {/* Card 1: Google Sheets Live Sync */}
                  <form onSubmit={handleSyncGoogleSheet} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                    <div className="font-bold text-teal-300 text-sm">1. Conectar Google Sheets en vivo</div>
                    <p className="text-[11px] text-slate-400">
                      Comparte tu hoja como <em>"Cualquier persona con el enlace (Lector)"</em> o publicada en la web, y pega el enlace aquí.
                    </p>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Nombre de esta tabla</label>
                      <input
                        value={dataSheetName}
                        onChange={e => setDataSheetName(e.target.value)}
                        placeholder="Ej: Cobertura Bodegas y Cortes"
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Enlace de Google Sheets</label>
                      <input
                        value={dataSheetUrl}
                        onChange={e => setDataSheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs outline-none focus:border-teal-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={busyAction === 'sync_google_sheet'}
                      className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 font-semibold text-white flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${busyAction === 'sync_google_sheet' ? 'animate-spin' : ''}`} />
                      {busyAction === 'sync_google_sheet' ? 'Sincronizando hoja...' : 'Conectar y sincronizar ahora'}
                    </button>
                  </form>

                  {/* Card 2: Upload Excel / CSV Pro */}
                  <form onSubmit={handleImportExcelTable} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                    <div className="font-bold text-sky-300 text-sm">2. Importar Excel / CSV a Tabla Pro Sheerit</div>
                    <p className="text-[11px] text-slate-400">
                      Guarda tu base directamente en la nube de Sheerit (hasta 1.500 filas por tabla) para consultas instantáneas.
                    </p>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Nombre de la tabla</label>
                      <input
                        value={dataUploadName}
                        onChange={e => setDataUploadName(e.target.value)}
                        placeholder="Ej: Catálogo Precios 2026"
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Archivo Excel (.xlsx / .xls / .csv)</label>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={e => setDataUploadFile(e.target.files?.[0] || null)}
                        className="w-full text-[11px] text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-200"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={busyAction === 'import_excel_table'}
                      className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 font-semibold text-white flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {busyAction === 'import_excel_table' ? 'Importando...' : 'Subir como Tabla Pro'}
                    </button>
                  </form>
                </div>

                {/* Connected Sources List */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-200">
                    Tablas y Hojas Conectadas ({dataSources.length})
                  </h3>
                  {dataSources.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center bg-slate-950 border border-slate-800 rounded-xl">
                      Aún no has conectado ninguna hoja ni tabla. Agrega una arriba y pruébala de una vez en el <strong>4. Modo Prueba</strong>.
                    </p>
                  ) : (
                    dataSources.map(src => {
                      const isPreviewOpen = dataPreviewOpenId === src.id;
                      return (
                        <div key={src.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-sm">{src.name}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                                src.source_type === 'google_sheets'
                                  ? 'bg-teal-500/15 border-teal-500/30 text-teal-300'
                                  : 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                              }`}>
                                {src.source_type === 'google_sheets' ? 'Google Sheets en vivo' : 'Tabla Pro Sheerit'}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">{src.row_count} filas</span>
                              {src.last_synced_at && (
                                <span className="text-[11px] text-slate-500">
                                  · Sincronizado: {new Date(src.last_synced_at).toLocaleString('es-CO')}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setDataPreviewOpenId(isPreviewOpen ? null : src.id)}
                                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-slate-200 hover:border-teal-500/50 cursor-pointer"
                              >
                                {isPreviewOpen ? 'Ocultar vista previa' : 'Ver filas'}
                              </button>
                              {src.source_type === 'google_sheets' && (
                                <button
                                  type="button"
                                  disabled={busyAction === `resync_${src.id}`}
                                  onClick={() => handleResyncSource(src.id)}
                                  className="px-2.5 py-1 rounded-lg bg-teal-600/20 hover:bg-teal-600/35 border border-teal-500/40 text-[11px] text-teal-200 flex items-center gap-1 cursor-pointer"
                                >
                                  <RefreshCw className={`w-3 h-3 ${busyAction === `resync_${src.id}` ? 'animate-spin' : ''}`} />
                                  Sincronizar
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteDataSource(src.id)}
                                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                                title="Eliminar fuente"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {isPreviewOpen && src.previewRows.length > 0 && (
                            <div className="overflow-x-auto border border-slate-800 rounded-xl">
                              <table className="min-w-full text-[11px] text-left">
                                <thead className="bg-slate-900 text-slate-300">
                                  <tr>
                                    {src.headers.map(h => (
                                      <th key={h} className="px-2.5 py-1.5 font-semibold border-b border-slate-800 whitespace-nowrap">
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                                  {src.previewRows.slice(0, 10).map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-900/50">
                                      {src.headers.map(h => (
                                        <td key={h} className="px-2.5 py-1.5 whitespace-nowrap">
                                          {row[h] || '—'}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
