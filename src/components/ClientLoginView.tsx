import React, { useState, useEffect } from 'react';
import { Shield, Phone, Key, Tv, Lock, Eye, EyeOff, RefreshCw, CheckCircle, AlertCircle, Copy, LogOut } from 'lucide-react';

interface ClientAccount {
  id: number;
  platform: string;
  email: string;
  password?: string;
  profile: string;
  vencimiento: string;
}

export default function ClientLoginView() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Input Phone, 2: Input OTP, 3: Dashboard
  const [loading, setLoading] = useState(false);
  const [requesting2fa, setRequesting2fa] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<ClientAccount[]>([]);
  const [showPass, setShowPass] = useState<Record<number, boolean>>({});

  const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://localhost:3000'
    : 'https://bot.sheerit.com.co';

  useEffect(() => {
    // Auto-login si viene de pasarela de pago o sesión guardada
    const urlParams = new URLSearchParams(window.location.search);
    const telParam = urlParams.get('tel') || urlParams.get('phone');
    const storedPhone = localStorage.getItem('client_session_phone') || localStorage.getItem('sheerit_client_phone');
    const targetPhone = telParam || storedPhone;

    if (targetPhone) {
      const cleanTarget = targetPhone.replace(/\D/g, '');
      if (cleanTarget.length >= 7) {
        setPhone(cleanTarget);
        setLoading(true);
        fetch(`${API_BASE}/api/client/auto-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: cleanTarget })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success && Array.isArray(data.accounts)) {
              setAccounts(data.accounts);
              setStep(3);
            }
          })
          .catch(err => console.warn("Auto-session check:", err))
          .finally(() => setLoading(false));
      }
    }
  }, []);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE}/api/client/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al solicitar el código OTP');
      }

      setSuccess('Código OTP enviado correctamente a tu WhatsApp. Ingresa el código de 6 dígitos.');
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE}/api/client/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'El código ingresado es inválido o ha expirado');
      }

      setAccounts(data.accounts);
      setSuccess('Inicio de sesión exitoso.');
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Código incorrecto');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest2fa = async (accountId: number) => {
    setRequesting2fa(accountId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_BASE}/api/client/request-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, accountId })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No se pudo generar la solicitud de código');
      }

      setSuccess(data.message || 'Solicitud enviada con éxito.');
    } catch (err: any) {
      setError(err.message || 'Error de red');
    } finally {
      setRequesting2fa(null);
    }
  };

  const togglePasswordVisibility = (id: number) => {
    setShowPass(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setSuccess(`${label} copiado al portapapeles.`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleLogout = () => {
    setPhone('');
    setCode('');
    setAccounts([]);
    setStep(1);
    setSuccess(null);
    setError(null);
  };

  return (
    <div className="max-w-md md:max-w-4xl mx-auto p-6 text-gray-800 dark:text-white min-h-[70vh] flex flex-col justify-center">
      
      {step === 1 && (
        <div className="max-w-md w-full mx-auto bg-white dark:bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl border border-gray-150 dark:border-slate-800 space-y-6 shadow-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400">
              <Shield size={32} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white">Ingreso de Clientes</h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
              Verifica tu identidad para ver tus credenciales o solicitar códigos 2FA.
            </p>
          </div>

          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                Ingresa tu número de WhatsApp
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="Ej: 573112513995"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl py-3 pl-4 pr-10 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
                />
                <Phone size={16} className="absolute right-3.5 top-4 text-gray-400 dark:text-slate-500" />
              </div>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">
                Formato internacional con prefijo de país. Ej: 57 para Colombia.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/5"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  Obtener Código OTP por WhatsApp
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-md w-full mx-auto bg-white dark:bg-slate-900/60 backdrop-blur-md p-8 rounded-2xl border border-gray-150 dark:border-slate-800 space-y-6 shadow-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400">
              <Key size={32} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white">Verificación OTP</h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
              Ingresa el código OTP de 6 dígitos que enviamos al chat de WhatsApp de @{phone}.
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                Código de 6 dígitos
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl py-3 text-center text-2xl tracking-widest font-bold font-mono text-indigo-500 dark:text-indigo-400 focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
                <CheckCircle size={14} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 px-4 bg-gray-150 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-white font-medium rounded-xl transition-all duration-200"
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/5"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Verificando...
                  </>
                ) : (
                  <>
                    Ingresar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 3 && (
        <div className="w-full space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-gray-150 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-800 dark:text-white flex items-center gap-2">
                👋 Mis Servicios Contratados
              </h2>
              <p className="text-gray-500 dark:text-slate-400 text-xs mt-1">
                Consulta los accesos o solicita códigos de seguridad de tus perfiles vigentes.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-500 dark:text-rose-400 rounded-xl transition-colors"
            >
              <LogOut size={12} /> Salir
            </button>
          </div>

          {/* Banner notification */}
          {(error || success) && (
            <div className="space-y-3 font-medium">
              {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Error al solicitar</p>
                    <p className="text-rose-600 dark:text-rose-450 mt-0.5">{error}</p>
                  </div>
                </div>
              )}
              {success && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs animate-fade-in">
                  <CheckCircle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Solicitud recibida</p>
                    <p className="text-emerald-600 dark:text-emerald-450 mt-0.5">{success}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Accounts Grid */}
          {accounts.length === 0 ? (
            <div className="bg-gray-50 dark:bg-slate-900/20 rounded-2xl border border-gray-150 dark:border-slate-800/50 p-12 text-center text-gray-400 dark:text-slate-500">
              <Tv size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm">No encontramos cuentas o servicios activos registrados para tu número.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between hover:border-gray-300 dark:hover:border-slate-750 transition-colors shadow-sm"
                >
                  <div className="p-6 space-y-4">
                    {/* Header card */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                          {acc.platform}
                        </span>
                        <h3 className="font-semibold text-gray-800 dark:text-white text-sm truncate max-w-[200px]" title={acc.email}>
                          {acc.email}
                        </h3>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 rounded-full">
                        Vence: {acc.vencimiento}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-2.5 pt-2 text-xs">
                      {/* Password line */}
                      {acc.password ? (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-slate-950/60 border border-gray-150 dark:border-slate-850">
                          <div className="flex items-center gap-1.5 truncate">
                            <Lock size={12} className="text-gray-400 dark:text-slate-500 shrink-0" />
                            <span className="text-gray-400 dark:text-slate-500">Clave:</span>
                            <span className="font-mono text-gray-700 dark:text-slate-300 font-semibold truncate">
                              {showPass[acc.id] ? acc.password : '••••••••'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => togglePasswordVisibility(acc.id)}
                              className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                            >
                              {showPass[acc.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            {showPass[acc.id] && (
                              <button
                                onClick={() => copyToClipboard(acc.password || '', 'Contraseña')}
                                className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                              >
                                <Copy size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-gray-50 dark:bg-slate-950/60 border border-gray-150 dark:border-slate-850 text-gray-400 dark:text-slate-500 italic text-[11px]">
                          Acceso por invitación/perfil propio
                        </div>
                      )}

                      {/* Profile / PIN line */}
                      <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-950/60 border border-gray-150 dark:border-slate-850 text-gray-750 dark:text-slate-300">
                        <span className="text-gray-400 dark:text-slate-500 mr-1.5 font-medium">Perfil asignado:</span> {acc.profile}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 bg-gray-50/50 dark:bg-slate-900/60 border-t border-gray-100 dark:border-slate-800/80">
                    <button
                      onClick={() => handleRequest2fa(acc.id)}
                      disabled={requesting2fa !== null}
                      className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/5"
                    >
                      {requesting2fa === acc.id ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" /> Solicitando...
                        </>
                      ) : (
                        <>
                          <Key size={12} />
                          {(() => {
                            const p = (acc.platform || "").toUpperCase();
                            if (p.includes('NETFLIX')) return 'Actualizar Hogar / Código de Acceso';
                            if (p.includes('DISNEY')) return 'Solicitar Código / Enlace de Acceso';
                            return 'Solicitar Código 2FA / Acceso';
                          })()}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
