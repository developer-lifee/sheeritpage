import React, { useEffect, useState } from 'react';
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
  LogIn
} from 'lucide-react';

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
  messages_used_month: number;
  usage_reset_month: string;
  status: string;
  is_bot_active: number | boolean;
  business_description: string | null;
  system_prompt: string | null;
  knowledge_base: string | null;
  bot_tone: string | null;
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
  status: 'DISCONNECTED' | 'CONNECTING' | 'QR_READY' | 'CONNECTED' | string;
  qrDataUrl: string | null;
  phone: string | null;
  lastError: string | null;
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
  created_at: string;
}

const TOKEN_STORAGE_KEY = 'sheerit_saas_bot_token';

const getApiBase = () => {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3000';
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
};

export function BotStudioPage({ onNavigateHome }: BotStudioPageProps) {
  const [token, setToken] = useState<string>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  // Auth form states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
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
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'generator' | 'elevenlabs' | 'logs'>('whatsapp');
  const [bannerMsg, setBannerMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  // Editable bot config
  const [cfgBusinessName, setCfgBusinessName] = useState('');
  const [cfgDescription, setCfgDescription] = useState('');
  const [cfgProducts, setCfgProducts] = useState('');
  const [cfgTone, setCfgTone] = useState('amigable');
  const [cfgSystemPrompt, setCfgSystemPrompt] = useState('');
  const [cfgKnowledgeBase, setCfgKnowledgeBase] = useState('');
  const [cfgBotActive, setCfgBotActive] = useState(true);

  // ElevenLabs config + audio merger
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
    setCfgTone(t.bot_tone || 'amigable');
    setCfgSystemPrompt(t.system_prompt || '');
    setCfgKnowledgeBase(t.knowledge_base || '');
    setCfgBotActive(Boolean(t.is_bot_active));
    setElEnabled(Boolean(t.elevenlabs_enabled));
    setElVoiceId(t.elevenlabs_voice_id || '');
    setElModelId(t.elevenlabs_model_id || 'eleven_multilingual_v2');
    setElReplyMode(t.reply_mode || 'text');
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
        if (Array.isArray(data.logs)) setLogs(data.logs);
      }
    } catch (err) {
      console.error('Error cargando Bot Studio:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboard(token);
    }
  }, [token]);

  // Polling rápido de WhatsApp mientras conecta o espera QR
  useEffect(() => {
    if (!token || (session.status !== 'CONNECTING' && session.status !== 'QR_READY')) return;
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
    }, 3000);
    return () => clearInterval(timer);
  }, [token, session.status]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const endpoint = authMode === 'register' ? '/api/saas-bot/register' : '/api/saas-bot/login';
      const payload = authMode === 'register'
        ? { ownerName, businessName, email, password, businessDescription: registerDesc }
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
      const byteStr = atob(data.audioBase64);
      const bytes = new Uint8Array(byteStr.length);
      for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      setMergedAudioUrl(url);
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
                <p className="text-xs text-slate-400">WhatsApp IA + ElevenLabs Multi-Cliente</p>
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
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tu nombre completo</label>
                  <input
                    required
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    placeholder="Ej: Johan Hernández"
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'whatsapp', label: '1. Conectar WhatsApp', icon: QrCode },
            { id: 'generator', label: '2. Generador IA & Prompt', icon: Sparkles },
            { id: 'elevenlabs', label: '3. ElevenLabs & Unir Audios', icon: Volume2 },
            { id: 'logs', label: '4. Mensajes Recientes', icon: MessageSquare }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
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
                Cada negocio tiene su propia sesión aislada. Presiona <strong>Generar QR</strong> y escanéalo desde WhatsApp en tu celular (<em>Dispositivos vinculados → Vincular dispositivo</em>).
              </p>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                <span className="text-slate-400">Estado actual:</span>
                <span className={`font-bold px-2.5 py-1 rounded-full ${
                  session.status === 'CONNECTED'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : session.status === 'QR_READY'
                    ? 'bg-amber-500/15 text-amber-300'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {session.status === 'CONNECTED'
                    ? `Conectado ${session.phone ? `(+${session.phone})` : ''}`
                    : session.status === 'QR_READY'
                    ? 'Esperando escaneo QR'
                    : session.status === 'CONNECTING'
                    ? 'Conectando...'
                    : 'Desconectado'}
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                {session.status !== 'CONNECTED' ? (
                  <button
                    onClick={handleConnectWhatsApp}
                    disabled={busyAction === 'wa_connect'}
                    className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${busyAction === 'wa_connect' ? 'animate-spin' : ''}`} />
                    {session.status === 'QR_READY' ? 'Refrescar estado' : 'Conectar y generar QR'}
                  </button>
                ) : (
                  <button
                    onClick={handleDisconnectWhatsApp}
                    disabled={busyAction === 'wa_disconnect'}
                    className="px-4 py-2.5 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30 font-semibold text-sm"
                  >
                    Desconectar WhatsApp
                  </button>
                )}
              </div>
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
              ) : session.qrDataUrl ? (
                <div className="text-center space-y-3">
                  <img src={session.qrDataUrl} alt="QR WhatsApp" className="w-56 h-56 rounded-xl bg-white p-2 mx-auto" />
                  <p className="text-xs text-slate-400">Escanea este código desde tu WhatsApp</p>
                </div>
              ) : (
                <div className="text-center text-slate-500 space-y-2">
                  <QrCode className="w-12 h-12 mx-auto opacity-40" />
                  <p className="text-xs">Haz clic en "Conectar y generar QR" para iniciar</p>
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
                  Cuéntale qué hace tu negocio y la IA redactará el prompt de ventas y la base de conocimiento por ti.
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
                    placeholder="Ej: Diseño limpio $80.000, Plan Pro $150.000. Horario lunes a sábado 8am-6pm. Pagos por Nequi y Bancolombia..."
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

        {/* Tab 3: ElevenLabs Voice & Audio Merger */}
        {activeTab === 'elevenlabs' && (
          <div className="space-y-5">
            {/* Bot voice config */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-teal-400" /> Conexión con ElevenLabs
                  </h2>
                  <p className="text-xs text-slate-400">
                    Conecta tu API Key de ElevenLabs para que tu bot responda con notas de voz y para usar el unificador de audios.
                  </p>
                </div>
                <button
                  onClick={() => handleSaveConfig()}
                  disabled={busyAction === 'save_cfg'}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 font-semibold text-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Guardar Voz
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    API Key de ElevenLabs {tenant?.has_elevenlabs_key ? `(${tenant.elevenlabs_api_key_masked})` : ''}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={elApiKeyInput}
                      onChange={e => setElApiKeyInput(e.target.value)}
                      placeholder={tenant?.has_elevenlabs_key ? 'Guardada (pega para cambiar)' : 'sk_...'}
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs outline-none focus:border-teal-500"
                    />
                  </div>
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
                      title="Cargar voces de tu cuenta"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Modo de respuesta del bot</label>
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

                <div className="flex items-end">
                  <label className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                    <span className="text-xs font-semibold text-slate-300">Activar voz en bot</span>
                    <input
                      type="checkbox"
                      checked={elEnabled}
                      onChange={e => setElEnabled(e.target.checked)}
                      className="accent-teal-500 w-4 h-4"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Audio Merger Studio */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-indigo-400" /> Unir Audios de ElevenLabs
                  </h3>
                  <p className="text-xs text-slate-400">
                    Escribe varios bloques (incluso con voces distintas), únelos en una sola pista MP3 y descárgala o envíala como nota de voz por tu WhatsApp.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">Pausa entre bloques (ms):</label>
                  <input
                    type="number"
                    min={0}
                    max={2000}
                    step={50}
                    value={pauseMs}
                    onChange={e => setPauseMs(Number(e.target.value))}
                    className="w-20 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {segments.map((seg, idx) => (
                  <div key={seg.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-teal-400">Segmento #{idx + 1}</span>
                      <div className="flex items-center gap-2">
                        {voices.length > 0 ? (
                          <select
                            value={seg.voiceId}
                            onChange={e => setSegments(prev => prev.map(s => s.id === seg.id ? { ...s, voiceId: e.target.value } : s))}
                            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                          >
                            <option value="">Usar voz principal</option>
                            {voices.map(v => (
                              <option key={v.voice_id} value={v.voice_id}>{v.name}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            value={seg.voiceId}
                            onChange={e => setSegments(prev => prev.map(s => s.id === seg.id ? { ...s, voiceId: e.target.value } : s))}
                            placeholder="Voice ID opcional (si es otra voz)"
                            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs w-48"
                          />
                        )}
                        {segments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setSegments(prev => prev.filter(s => s.id !== seg.id))}
                            className="p-1 text-rose-400 hover:text-rose-300"
                            title="Eliminar segmento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={seg.text}
                      onChange={e => setSegments(prev => prev.map(s => s.id === seg.id ? { ...s, text: e.target.value } : s))}
                      placeholder="Escribe el guion de este bloque..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  disabled={segments.length >= 10}
                  onClick={() => setSegments(prev => [...prev, { id: `seg_${Date.now()}`, text: '', voiceId: '' }])}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" /> Añadir segmento ({segments.length}/10)
                </button>

                <button
                  type="button"
                  onClick={() => handleMergeAudio(false)}
                  disabled={busyAction === 'merge_only' || busyAction === 'merge_send'}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <Volume2 className="w-4 h-4" />
                  {busyAction === 'merge_only' ? 'Generando y uniendo...' : 'Unir y Generar Audio'}
                </button>
              </div>

              {mergedAudioUrl && (
                <div className="bg-slate-950 border border-indigo-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-indigo-300">
                      Audio unido listo ({mergedMeta?.segmentsCount} segmentos • {mergedMeta?.totalChars} caracteres)
                    </span>
                    <a
                      href={mergedAudioUrl}
                      download={`elevenlabs_unido_${Date.now()}.mp3`}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Descargar MP3
                    </a>
                  </div>
                  <audio controls src={mergedAudioUrl} className="w-full" />
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row gap-2 sm:items-center">
                <input
                  value={sendToPhone}
                  onChange={e => setSendToPhone(e.target.value)}
                  placeholder="Enviar como nota de voz por tu WhatsApp (Ej: 3001234567)"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={() => handleMergeAudio(true)}
                  disabled={busyAction === 'merge_send' || busyAction === 'merge_only' || session.status !== 'CONNECTED'}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {busyAction === 'merge_send' ? 'Enviando...' : 'Unir y Enviar por WhatsApp'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Logs */}
        {activeTab === 'logs' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-400" /> Últimos mensajes del bot
              </h2>
              <button
                onClick={() => fetchDashboard(token)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Actualizar
              </button>
            </div>
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">Aún no hay conversaciones registradas.</p>
            ) : (
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {logs.map(l => (
                  <div key={l.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono">
                        {l.direction === 'in' ? '📥 Cliente' : '🤖 Bot'} ({l.message_type}) • {l.customer_jid.replace(/@.*/, '')}
                      </span>
                      <span>{new Date(l.created_at).toLocaleString('es-CO')}</span>
                    </div>
                    <p className="text-slate-200 whitespace-pre-wrap">{l.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
