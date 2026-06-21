import React, { useState, useEffect } from 'react';
import { QrCode, Phone, CheckCircle, AlertCircle, RefreshCw, Key } from 'lucide-react';

interface WhatsappState {
  status: string;
  qr: string | null;
  pairingCode: string | null;
  reason?: string;
}

export default function ConnectionView() {
  const [state, setState] = useState<WhatsappState>({
    status: 'DISCONNECTED',
    qr: null,
    pairingCode: null,
  });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const API_BASE = window.location.hostname.includes('sheerit.com.co')
    ? 'https://bot.sheerit.com.co'
    : `http://${window.location.hostname}:3000`;

  useEffect(() => {
    // Connect to SSE stream
    const eventSource = new EventSource(`${API_BASE}/api/whatsapp/status-stream`);

    eventSource.addEventListener('status', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        setState(data);
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    });

    eventSource.onerror = (err) => {
      console.error('SSE Connection failed:', err);
      setState(prev => ({ ...prev, status: 'DISCONNECTED' }));
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch(`${API_BASE}/api/whatsapp/request-pairing-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          password: 'admin123' // Stored password in SaaS
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al solicitar el código de vinculación');
      }

      setSuccessMsg('Solicitud enviada con éxito. Esperando código...');
      if (data.pairingCode) {
        setState(prev => ({
          ...prev,
          status: 'PAIRING_CODE_READY',
          pairingCode: data.pairingCode,
          qr: null
        }));
      }
    } catch (err: any) {
      setError(err.message || 'Fallo de conexión con el bot');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return (
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle size={14} className="animate-pulse" /> Conectado
          </span>
        );
      case 'QR_READY':
        return (
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <QrCode size={14} /> Esperando Escaneo QR
          </span>
        );
      case 'PAIRING_CODE_READY':
        return (
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Key size={14} /> Código de Vinculación Listo
          </span>
        );
      case 'CONNECTING':
        return (
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <RefreshCw size={14} className="animate-spin" /> Conectando...
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle size={14} /> Desconectado
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            🔌 Conexión de WhatsApp <span className="text-indigo-400">SaaS</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Gestiona la vinculación del número oficial de soporte de Sheerit.
          </p>
        </div>
        <div>
          {getStatusBadge(state.status)}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Side: QR Scanner / Code Display */}
        <div className="bg-slate-900/40 backdrop-blur-md p-8 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center min-h-[400px]">
          {state.status === 'CONNECTED' ? (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <CheckCircle size={44} className="animate-bounce" />
              </div>
              <h3 className="text-xl font-bold">¡Bot Listo para Operar!</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">
                El bot de WhatsApp está conectado y atendiendo solicitudes del canal de streaming.
              </p>
            </div>
          ) : state.status === 'QR_READY' && state.qr ? (
            <div className="text-center space-y-6">
              <h3 className="text-lg font-semibold text-slate-200">Escanea el Código QR</h3>
              <div className="bg-white p-4 rounded-xl inline-block shadow-xl shadow-indigo-500/5">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(state.qr)}`}
                  alt="WhatsApp QR Code"
                  className="w-48 h-48 md:w-56 md:h-56"
                />
              </div>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Abre WhatsApp en tu teléfono {`>`} Dispositivos Vinculados {`>`} Vincular Dispositivo y escanea el QR.
              </p>
            </div>
          ) : state.status === 'PAIRING_CODE_READY' && state.pairingCode ? (
            <div className="text-center space-y-6">
              <h3 className="text-lg font-semibold text-slate-200">Código de Vinculación</h3>
              <div className="bg-slate-950 p-6 rounded-xl border border-indigo-500/30 inline-block">
                <span className="text-3xl font-extrabold tracking-widest text-indigo-400 font-mono">
                  {state.pairingCode}
                </span>
              </div>
              <div className="text-xs text-slate-400 max-w-xs mx-auto space-y-2 text-left">
                <p className="font-semibold text-slate-300">Pasos para vincular:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Abre WhatsApp en tu teléfono.</li>
                  <li>Ve a <span className="text-indigo-300 font-medium">Dispositivos vinculados</span>.</li>
                  <li>Toca <span className="text-indigo-300 font-medium">Vincular dispositivo</span>.</li>
                  <li>Selecciona <span className="text-indigo-300 font-medium">Vincular con número de teléfono</span> e ingresa este código de 8 dígitos.</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400">
                <QrCode size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-300">Esperando conexión</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">
                Inicializa la conexión solicitando un código OTP por número o espera a que se genere un QR.
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Link with Phone Number (OTP) */}
        <div className="bg-slate-900/40 backdrop-blur-md p-8 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Phone size={18} className="text-indigo-400" /> Vinculación Directa por Teléfono
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Puedes vincular tu bot ingresando el número de teléfono directamente en lugar de escanear el QR.
              </p>
            </div>

            <form onSubmit={handleRequestPairingCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Número de Teléfono (Formato Internacional)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="Ej: 573112513995"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    disabled={loading || state.status === 'CONNECTED'}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 pl-4 pr-10 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                  <Phone size={16} className="absolute right-3.5 top-4 text-slate-600" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || state.status === 'CONNECTED'}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Generando Código...
                  </>
                ) : (
                  <>
                    <Key size={16} /> Obtener Código de Vinculación
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800/80">
            {error && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                <CheckCircle size={16} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
            {!error && !successMsg && (
              <p className="text-slate-500 text-xs text-center">
                Asegúrate de ingresar el prefijo de país sin símbolos (+). Ej: 57 para Colombia.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
