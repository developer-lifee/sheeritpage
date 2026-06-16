import React, { useState, useEffect } from 'react';
import { Mail, Search, Trash2, PlusCircle, RefreshCw, AlertTriangle, CheckCircle, ExternalLink, ArrowRight, X, User, Copy, Check, ShieldAlert, CreditCard } from 'lucide-react';

interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  internalDate: string;
  snippet: string;
  body?: string;
}

interface ParsedEmail {
  type: 'payment' | 'otp' | 'general';
  brand: string;
  brandColor: string;
  amount?: string;
  reference?: string;
  sender?: string;
  code?: string;
  link?: string;
  platformName?: string;
}

const parseEmailData = (msg: EmailMessage): ParsedEmail => {
  const textToSearch = `${msg.subject} ${msg.snippet} ${msg.body || ''}`.toLowerCase();
  
  // 1. Check for OTP / Security codes
  const isOtp = /código|code|pin|otp|verificac|inici|seguridad/i.test(msg.subject) || 
                /código de verificación|verification code|código de acceso|security code/i.test(textToSearch);
  
  if (isOtp) {
    let platform = 'Código';
    let brandColor = 'bg-gray-50 border-gray-300 dark:bg-gray-900/40 dark:border-gray-700';
    if (textToSearch.includes('netflix')) {
      platform = 'Netflix';
      brandColor = 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900/50';
    } else if (textToSearch.includes('disney')) {
      platform = 'Disney+';
      brandColor = 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900/50';
    } else if (textToSearch.includes('max') || textToSearch.includes('hbo')) {
      platform = 'Max';
      brandColor = 'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-950/20 dark:border-indigo-900/50';
    } else if (textToSearch.includes('crunchy')) {
      platform = 'Crunchyroll';
      brandColor = 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/20 dark:border-orange-900/50';
    } else if (textToSearch.includes('prime') || textToSearch.includes('amazon')) {
      platform = 'Prime Video';
      brandColor = 'bg-cyan-50 border-cyan-200 text-cyan-800 dark:bg-cyan-950/20 dark:border-cyan-900/50';
    } else if (textToSearch.includes('claude') || textToSearch.includes('anthropic')) {
      platform = 'Claude';
      brandColor = 'bg-orange-55 border-orange-300 text-orange-850 dark:bg-orange-950/30 dark:border-orange-900/50';
    }

    // Try to extract 4 to 8 digit code
    let code = '';
    const codeMatch = textToSearch.match(/\b([0-9]{6})\b/) || 
                      textToSearch.match(/\b([0-9]{4})\b/) || 
                      textToSearch.match(/\b([0-9]{5})\b/) ||
                      textToSearch.match(/\b([0-9]{8})\b/) ||
                      textToSearch.match(/\b([A-Z0-9]{6,8})\b/i);
    if (codeMatch) {
      code = codeMatch[1].toUpperCase();
    }

    // Extract link (including Claude and Anthropic magic link URLs)
    const linkMatch = (msg.body || '').match(/https?:\/\/(?:www\.)?(?:netflix\.com|disneyplus\.com|starplus\.com|max\.com|hbomax\.com|primevideo\.com|amazon\.com|auth\.max\.com|claude\.ai|anthropic\.com|mail\.anthropic\.com)[^\s<>"']+/i);
    const link = linkMatch ? linkMatch[0] : undefined;

    return {
      type: 'otp',
      brand: platform,
      brandColor,
      code,
      link,
      platformName: platform
    };
  }

  // 2. Check for payments / transfers
  const isNequi = textToSearch.includes('nequi') || msg.from.toLowerCase().includes('nequi');
  const isDaviplata = textToSearch.includes('daviplata') || textToSearch.includes('davivienda') || msg.from.toLowerCase().includes('davivienda');
  const isBancolombia = textToSearch.includes('bancolombia') || msg.from.toLowerCase().includes('bancolombia');
  const isBreb = textToSearch.includes('bre-b') || textToSearch.includes('breb');

  if (isNequi || isDaviplata || isBancolombia || isBreb) {
    let brand = 'Transferencia';
    let brandColor = 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50';
    
    if (isNequi) {
      brand = 'Nequi';
      brandColor = 'bg-fuchsia-50 border-fuchsia-200 dark:bg-fuchsia-950/20 dark:border-fuchsia-900/50';
    } else if (isDaviplata) {
      brand = 'Daviplata';
      brandColor = 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50';
    } else if (isBancolombia) {
      brand = 'Bancolombia';
      brandColor = 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50';
    } else if (isBreb) {
      brand = 'Bre-B';
      brandColor = 'bg-sky-50 border-sky-200 dark:bg-sky-950/20 dark:border-sky-900/50';
    }

    // Extract amount
    let amount = '';
    const amountMatch = textToSearch.match(/(?:monto|valor|por|transfirió|recibiste|de)\s*(?:\$)?\s*([0-9]{1,3}(?:\.[0-9]{3})+(?:,[0-9]{2})?)/i) ||
                        textToSearch.match(/(?:\$)\s*([0-9]{1,3}(?:\.[0-9]{3})*)/);
    if (amountMatch) {
      amount = `$${amountMatch[1]}`;
    }

    // Extract reference
    let reference = '';
    const refMatch = textToSearch.match(/(?:referencia|ref\.|nro|transacción|aprobación|autorización|código):\s*([0-9a-zA-Z]+)/i) ||
                     textToSearch.match(/(?:ref\s+|referencia\s+|código\s+)([A-Za-z0-9]{6,15})/i);
    if (refMatch) {
      reference = refMatch[1];
    }

    // Extract sender/origin
    let sender = '';
    const senderMatch = textToSearch.match(/(?:de|desde|por)\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]{3,25})(?:\s+ha|\s+te|\s+envió)/i) ||
                        textToSearch.match(/(?:celular|cuenta)\s+(\d{10})/i);
    if (senderMatch) {
      sender = senderMatch[1].trim();
    }

    return {
      type: 'payment',
      brand,
      brandColor,
      amount,
      reference,
      sender
    };
  }

  return {
    type: 'general',
    brand: 'Correo',
    brandColor: 'bg-gray-50 border-gray-200 dark:bg-gray-900/30 dark:border-gray-700'
  };
};

export const ManagedEmailsView: React.FC = () => {
  const [emails, setEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // OAuth Authorization Flow State
  const [step, setStep] = useState<1 | 2>(1);
  const [authUrl, setAuthUrl] = useState('');
  const [authCode, setAuthCode] = useState('');

  // Inbox viewer state
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [inboxEmails, setInboxEmails] = useState<EmailMessage[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [emailsError, setEmailsError] = useState('');
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchEmails = () => {
    setLoading(true);
    setError('');
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    fetch(`${apiUrl}/api/admin/gmail-inboxes`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al obtener los correos');
        return res.json();
      })
      .then((data) => {
        setEmails(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching gmail inboxes:', err);
        setError('No se pudo conectar al backend para listar las bandejas Gmail.');
        setLoading(false);
      });
  };

  const fetchInboxEmails = (email: string) => {
    setEmailsLoading(true);
    setEmailsError('');
    setSelectedEmail(email);
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    fetch(`${apiUrl}/api/admin/gmail-inboxes/emails?email=${encodeURIComponent(email)}&password=admin123`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al obtener los correos de la bandeja');
        return res.json();
      })
      .then((data) => {
        setInboxEmails(Array.isArray(data) ? data : []);
        setEmailsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching inbox emails:', err);
        setEmailsError('No se pudieron cargar los correos de esta bandeja. Revisa si el token de Google está activo.');
        setEmailsLoading(false);
      });
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleStartAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/gmail-inboxes/auth-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: 'admin123' })
      });
      const result = await res.json();
      if (result.success && result.authUrl) {
        setAuthUrl(result.authUrl);
        setStep(2);
        window.open(result.authUrl, '_blank');
      } else {
        setError(`❌ Error: ${result.message || result.error}`);
      }
    } catch (err) {
      setError('❌ Error al comunicarse con el bot.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authCode.trim()) {
      setError('Por favor pega el código de Google.');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/gmail-inboxes/confirm-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, codeOrUrl: authCode, password: 'admin123' })
      });
      const result = await res.json();
      if (result.success) {
        setSuccess(`¡Bandeja ${newEmail} vinculada con éxito!`);
        setNewEmail('');
        setAuthCode('');
        setAuthUrl('');
        setStep(1);
        fetchEmails();
      } else {
        setError(`❌ Error: ${result.message || result.error}`);
      }
    } catch (err) {
      setError('❌ Error de comunicación con el bot.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEmail = async (e: React.MouseEvent, emailToDelete: string) => {
    e.stopPropagation(); // Prevent opening the inbox when deleting
    const confirmDelete = window.confirm(`¿Estás seguro de desvincular la bandeja ${emailToDelete}? El bot ya no leerá notificaciones de pagos de este correo.`);
    if (!confirmDelete) return;

    setError('');
    setSuccess('');
    if (selectedEmail === emailToDelete) {
      setSelectedEmail(null);
      setInboxEmails([]);
    }

    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/gmail-inboxes/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToDelete, password: 'admin123' })
      });
      const result = await res.json();
      if (result.success) {
        setSuccess('Bandeja desvinculada con éxito.');
        fetchEmails();
      } else {
        setError(`❌ Error: ${result.message || result.error}`);
      }
    } catch (err) {
      setError('❌ Error de conexión al desvincular el correo.');
    }
  };

  const filteredEmails = emails.filter((email) =>
    email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email List Dashboard */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center dark:text-white">
                <Mail className="mr-2 text-brand-primary" /> Bandejas Gmail Activas
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Selecciona una bandeja para inspeccionar sus correos recibidos.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-450" />
                <input
                  type="text"
                  placeholder="Buscar bandeja..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm w-full"
                />
              </div>
              <button
                onClick={fetchEmails}
                className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg transition-colors"
                title="Refrescar"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 rounded-xl mb-6 border border-red-200 dark:border-red-900/50">
              <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-4 rounded-xl mb-6 border border-green-200 dark:border-green-900/50">
              <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Cargando bandejas vinculadas...</div>
          ) : filteredEmails.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-750">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="font-bold text-gray-700 dark:text-gray-300">No hay bandejas vinculadas</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {searchTerm ? 'Ningún correo coincide con tu búsqueda.' : 'Vincula tu primer correo de pagos usando el panel lateral.'}
              </p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto border border-gray-150 dark:border-gray-750 rounded-xl divide-y divide-gray-150 dark:divide-gray-750 animate-fadeIn">
              {filteredEmails.map((email) => {
                const isSelected = selectedEmail === email;
                return (
                  <div
                    key={email}
                    onClick={() => fetchInboxEmails(email)}
                    className={`flex items-center justify-between p-3.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750/30 transition-all ${
                      isSelected ? 'bg-brand-primary/5 dark:bg-brand-primary/10 border-l-4 border-brand-primary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 pr-4 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-brand-primary' : 'bg-green-500'}`}></div>
                      <span className={`text-sm truncate ${isSelected ? 'font-bold text-brand-primary' : 'font-medium text-gray-800 dark:text-white'}`}>
                        {email}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteEmail(e, email)}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all flex-shrink-0"
                      title="Desvincular Bandeja"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Email Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6 self-start">
          <h3 className="text-lg font-bold flex items-center mb-4 dark:text-white">
            <PlusCircle className="mr-2 text-brand-primary" /> Vincular Bandeja Gmail
          </h3>

          {step === 1 ? (
            <form onSubmit={handleStartAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Correo Electrónico a Vincular</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="correo@gmail.com"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white text-sm"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Asegúrate de que este correo reciba los comprobantes de pagos (Nequi, Daviplata o Bancolombia).
                </p>
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-brand-primary hover:bg-brand-dark text-white font-bold text-sm py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {actionLoading ? 'Generando Enlace...' : <>Iniciar Conexión <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirmCode} className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-xl mb-2">
                <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                  <b>Paso 1 completado:</b> Hemos abierto el enlace de autorización de Google en una nueva pestaña.
                </p>
                <a
                  href={authUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-primary hover:underline font-bold mt-1.5 inline-flex items-center gap-1"
                >
                  Abrir enlace manualmente <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Código de Autorización de Google</label>
                <input
                  type="text"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  placeholder="Pega el código o la URL completa de error..."
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white text-sm font-mono"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Copia el código que te da Google al aceptar permisos, o la URL de la barra de direcciones de la pestaña si te da error de localhost.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setAuthUrl('');
                    setAuthCode('');
                  }}
                  className="w-1/3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold text-xs py-2.5 rounded-xl transition-all"
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-2/3 bg-brand-primary hover:bg-brand-dark text-white font-bold text-xs py-2.5 rounded-xl transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'Vinculando...' : 'Confirmar Conexión'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Selected Inbox Messages details */}
      {selectedEmail && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6 animate-fadeIn">
          <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-gray-700">
            <div>
              <h3 className="text-lg font-bold flex items-center dark:text-white">
                <Mail className="mr-2 text-brand-primary" /> Correos Recibidos: {selectedEmail}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Últimos 15 correos en la bandeja de entrada para verificar transferencias.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchInboxEmails(selectedEmail)}
                disabled={emailsLoading}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg transition-colors disabled:opacity-50"
                title="Actualizar correos"
              >
                <RefreshCw className={`w-5 h-5 ${emailsLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => {
                  setSelectedEmail(null);
                  setInboxEmails([]);
                }}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg transition-colors"
                title="Cerrar panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {emailsError && (
            <div className="flex items-center bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 rounded-xl border border-red-200 dark:border-red-900/50">
              <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
              <p className="text-sm">{emailsError}</p>
            </div>
          )}

          {emailsLoading ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-brand-primary" />
              <span>Cargando mensajes del buzón...</span>
            </div>
          ) : inboxEmails.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-750">
              <Mail className="w-12 h-12 text-gray-450 mx-auto mb-3" />
              <h4 className="font-bold text-gray-700 dark:text-gray-300">Buzón Vacío</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No se encontraron correos en la bandeja de entrada.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {inboxEmails.map((msg) => {
                const isExpanded = expandedEmailId === msg.id;
                const parsed = parseEmailData(msg);

                return (
                  <div
                    key={msg.id}
                    onClick={() => setExpandedEmailId(isExpanded ? null : msg.id)}
                    className={`border rounded-xl transition-all cursor-pointer overflow-hidden ${
                      isExpanded 
                        ? 'shadow-md ring-1 ring-brand-primary border-brand-primary' 
                        : 'border-gray-250 dark:border-gray-700 hover:shadow-sm'
                    }`}
                  >
                    {/* Card Header/Banner based on type */}
                    {parsed.type === 'otp' && (
                      <div className={`px-4 py-2 flex items-center justify-between border-b ${parsed.brandColor} dark:border-opacity-35`}>
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4" />
                          <span className="text-xs font-black tracking-wide uppercase">
                            Código de Verificación • {parsed.brand}
                          </span>
                        </div>
                        <span className="text-[10px] opacity-75 font-medium">{msg.date}</span>
                      </div>
                    )}

                    {parsed.type === 'payment' && (
                      <div className={`px-4 py-2 flex items-center justify-between border-b ${parsed.brandColor} dark:border-opacity-35`}>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <span className="text-xs font-black tracking-wide uppercase">
                            Notificación de Pago • {parsed.brand}
                          </span>
                        </div>
                        <span className="text-[10px] opacity-75 font-medium">{msg.date}</span>
                      </div>
                    )}

                    {parsed.type === 'general' && (
                      <div className="px-4 py-2 flex items-center justify-between border-b bg-gray-50/80 border-gray-150 dark:bg-gray-900/60 dark:border-gray-750 text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Correo Recibido</span>
                        </div>
                        <span className="text-[10px] font-medium">{msg.date}</span>
                      </div>
                    )}

                    {/* Card Body */}
                    <div className="p-4 bg-white dark:bg-gray-800" onClick={(e) => isExpanded && e.stopPropagation()}>
                      {/* From / Sender details */}
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-bold text-gray-450 tracking-wider">De:</span>
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-250 truncate">{msg.from}</p>
                        </div>
                        <span className="text-[10px] text-gray-450 font-bold whitespace-nowrap bg-gray-100 dark:bg-gray-750 px-2 py-0.5 rounded-full">
                          ID: {msg.id.substring(0, 8)}
                        </span>
                      </div>

                      {/* Main Subject */}
                      <h4 className="text-sm font-black text-gray-900 dark:text-white mb-3 line-clamp-1">
                        {msg.subject}
                      </h4>

                      {/* Styled Visual Elements based on Parsed Content */}
                      {parsed.type === 'otp' && (
                        <div className="mb-3 bg-gray-50 dark:bg-gray-900/40 border border-dashed border-gray-300 dark:border-gray-700 p-4 rounded-xl text-center">
                          {parsed.code ? (
                            <div className="space-y-2">
                              <span className="text-[10px] uppercase font-black tracking-widest text-brand-primary">CÓDIGO DE ACCESO</span>
                              <div className="flex items-center justify-center gap-3">
                                <span className="text-3xl font-black tracking-widest text-gray-900 dark:text-white font-mono bg-white dark:bg-gray-850 px-5 py-2 rounded-xl shadow-sm border border-gray-150 dark:border-gray-750">
                                  {parsed.code.split('').join(' ')}
                                </span>
                                <button
                                  onClick={(e) => handleCopy(e, parsed.code || '', `code-${msg.id}`)}
                                  className="p-2.5 bg-brand-primary text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center justify-center"
                                  title="Copiar Código"
                                >
                                  {copiedId === `code-${msg.id}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                              </div>
                              {copiedId === `code-${msg.id}` && (
                                <p className="text-[10px] text-green-500 font-bold">¡Código copiado al portapapeles!</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400 italic">No se pudo extraer el código automáticamente. Abre el cuerpo para verlo.</p>
                          )}

                          {parsed.link && (
                            <a
                              href={parsed.link}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-250 dark:bg-gray-750 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-black transition-all"
                            >
                              Confirmar Acceso / Enlace <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      )}

                      {parsed.type === 'payment' && (
                        <div className="mb-3 bg-gray-50 dark:bg-gray-900/40 p-4 border border-gray-150 dark:border-gray-750 rounded-xl space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-gray-450 tracking-wider">VALOR RECIBIDO</span>
                              {parsed.amount ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                                    {parsed.amount}
                                  </span>
                                  <button
                                    onClick={(e) => handleCopy(e, parsed.amount?.replace(/[^0-9]/g, '') || '', `amount-${msg.id}`)}
                                    className="p-1 text-gray-450 hover:text-brand-primary transition-colors"
                                    title="Copiar monto"
                                  >
                                    {copiedId === `amount-${msg.id}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500 italic">No detectado</p>
                              )}
                            </div>
                            
                            {parsed.reference && (
                              <div className="text-right">
                                <span className="text-[10px] uppercase font-bold text-gray-450 tracking-wider">REFERENCIA</span>
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className="text-xs font-mono font-black text-gray-700 dark:text-gray-300">
                                    {parsed.reference}
                                  </span>
                                  <button
                                    onClick={(e) => handleCopy(e, parsed.reference || '', `ref-${msg.id}`)}
                                    className="p-1 text-gray-450 hover:text-brand-primary transition-colors"
                                    title="Copiar referencia"
                                  >
                                    {copiedId === `ref-${msg.id}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {parsed.sender && (
                            <div className="pt-2 border-t border-gray-150 dark:border-gray-750 flex justify-between items-center text-xs">
                              <span className="text-gray-450 font-medium">Origen / Pagador:</span>
                              <span className="font-bold text-gray-800 dark:text-gray-250 truncate max-w-[200px]">
                                {parsed.sender}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Snippet preview */}
                      {!isExpanded && (
                        <p className="text-xs text-gray-500 dark:text-gray-450 font-light leading-relaxed line-clamp-2">
                          {msg.snippet}
                        </p>
                      )}

                      {/* Expanded body details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-150 dark:border-gray-750">
                          <span className="text-[10px] uppercase font-bold text-gray-450 tracking-wider block mb-2">CUERPO DEL MENSAJE:</span>
                          <div className="p-3.5 bg-gray-50 dark:bg-gray-900 border dark:border-gray-750 rounded-xl text-xs text-gray-700 dark:text-gray-350 whitespace-pre-wrap font-mono select-text break-words leading-relaxed max-h-[40vh] overflow-y-auto">
                            {msg.body}
                          </div>
                        </div>
                      )}

                      {/* Bottom action trigger */}
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-750/30">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                          {isExpanded ? 'Inspección abierta' : 'Inspección cerrada'}
                        </span>
                        <span
                          onClick={(e) => {
                            if (isExpanded) {
                              e.stopPropagation();
                              setExpandedEmailId(null);
                            }
                          }}
                          className="text-[10px] text-brand-primary hover:underline font-bold"
                        >
                          {isExpanded ? 'Ver menos ↑' : 'Ver cuerpo completo ↓'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
