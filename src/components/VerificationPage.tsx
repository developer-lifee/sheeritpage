import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, Phone, RefreshCw, Copy, Check, ExternalLink, AlertCircle } from 'lucide-react';

export const VerificationPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; account?: string; code?: string; link?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const performVerification = async (targetPhone: string) => {
    const clean = targetPhone.replace(/\D/g, '');
    if (!clean) {
      setResult({ success: false, message: 'Por favor ingresa un número de teléfono válido.' });
      return;
    }

    setLoading(true);
    setResult(null);

    const apiUrl = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
      ? 'http://localhost:3000'
      : window.location.origin;

    try {
      const response = await fetch(`${apiUrl}/api/netflix/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean })
      });

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setResult({ success: false, message: 'Error conectando con el servidor de verificación: ' + (err.message || err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Extraer 'tel' de la URL si viene pre-cargado
    const params = new URLSearchParams(window.location.search);
    const tel = params.get('tel');

    if (tel) {
      setPhone(tel);
      performVerification(tel);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performVerification(phone);
  };

  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300">
        
        <div className="p-8 sm:p-10 text-center">
          <div className="w-20 h-20 bg-red-500/10 dark:bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <ShieldCheck className="w-10 h-10 text-red-600 dark:text-red-500" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
            Verificación de Hogar Netflix
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-sm mx-auto">
            Confirma la red de tu televisor o consulta el código de acceso temporal de 4 dígitos.
          </p>

          {/* Formulario de ingreso de número si no se está cargando */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="relative flex items-center mb-3">
              <div className="absolute left-4 text-gray-400">
                <Phone className="w-5 h-5" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ingresa tu WhatsApp (ej: 573131234567)"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 text-sm font-medium transition-all"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !phone.trim()}
              className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-200 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Buscando en buzón seguro...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Consultar Código / Actualizar Hogar</span>
                </>
              )}
            </button>
          </form>

          {/* Estado de carga */}
          {loading && (
            <div className="flex flex-col items-center justify-center space-y-3 py-6">
              <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Conectando con el servidor seguro y buscando códigos de Netflix...
              </p>
            </div>
          )}

          {/* Resultado */}
          {!loading && result && (
            <div className={`p-6 rounded-2xl border text-left transition-all ${
              result.success 
                ? 'bg-green-50 dark:bg-green-950/25 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-950/25 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start space-x-3 mb-2">
                {result.success ? (
                  <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-base font-bold ${result.success ? 'text-green-900 dark:text-green-200' : 'text-red-900 dark:text-red-200'}`}>
                    {result.success ? '¡Verificación Exitosa!' : 'Atención'}
                  </p>
                  <p className={`text-xs mt-1 leading-relaxed ${result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {result.message}
                  </p>
                </div>
              </div>

              {/* Botón de Enlace de Confirmación de Hogar */}
              {result.link && (
                <div className="mt-5 pt-4 border-t border-green-200/60 dark:border-green-800/60">
                  <a 
                    href={result.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 w-full px-5 py-3.5 text-sm font-extrabold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    <span>🚀 Confirmar Hogar en Netflix</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center mt-2">
                    Haz clic para abrir el enlace oficial y autorizar la conexión en tu TV.
                  </p>
                </div>
              )}

              {/* Código OTP de 4 Dígitos */}
              {result.code && (
                <div className="mt-5 pt-4 border-t border-green-200/60 dark:border-green-800/60">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider text-center">
                    Código de Acceso de 4 Dígitos
                  </p>
                  <div className="flex items-center justify-between p-3.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                    <span className="text-3xl font-mono font-black tracking-widest text-gray-900 dark:text-white mx-auto select-all">
                      {result.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(result.code!)}
                      className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      title="Copiar código"
                    >
                      {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 text-center mt-2">
                    Digita estos 4 números directamente en tu pantalla de Netflix.
                  </p>
                </div>
              )}

              {/* Cuenta vinculada */}
              {result.account && (
                <div className="mt-4 pt-3 border-t border-gray-200/40 dark:border-gray-800/40 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Cuenta consultada:</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{result.account}</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center space-x-1">
            <span>🛡️ Conexión cifrada SSL con el sistema de validación de Sheerit</span>
          </div>
        </div>
      </div>
    </div>
  );
};
