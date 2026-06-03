import React, { useState, useEffect } from 'react';
import { Mail, Search, Trash2, PlusCircle, RefreshCw, AlertTriangle, CheckCircle, ExternalLink, ArrowRight, X, User } from 'lucide-react';

interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  internalDate: string;
  snippet: string;
}

export const ManagedEmailsView: React.FC = () => {
  const [emails, setEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
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
              {inboxEmails.map((msg) => (
                <div
                  key={msg.id}
                  className="p-4 border dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl hover:shadow-sm transition-all"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="w-4 h-4 text-brand-primary flex-shrink-0" />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                        {msg.from}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                      {msg.date}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-1.5">{msg.subject}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-450 leading-relaxed font-light line-clamp-2">
                    {msg.snippet}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
