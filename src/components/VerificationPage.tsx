import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';

export const VerificationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{ success: boolean; message: string; account?: string } | null>(null);

  useEffect(() => {
    // Extraer 'tel' de la URL
    const params = new URLSearchParams(window.location.search);
    const tel = params.get('tel');

    if (!tel) {
      setResult({ success: false, message: 'No se proporcionó un número de teléfono válido para la verificación.' });
      setLoading(false);
      return;
    }

    // Call the bot express server (assuming localhost:3000 for local dev, 
    // but in prod it would be sheerit.com.co/api or whatever mapping they have. 
    // We will hardcode standard PM2 bot port 3000 for now.
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co'; // Default fallback endpoint
    
    // Petición al endpoint del Whatbot
    fetch(`http://localhost:3000/api/netflix/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: tel })
    })
    .then(res => res.json())
    .then(data => {
      setResult(data);
      setLoading(false);
    })
    .catch(err => {
      setResult({ success: false, message: 'Error conectando con el sistema de verificación: ' + err.message });
      setLoading(false);
    });

  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-brand-primary" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Verificación de Hogar
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Verificando tu conexión para actualizar la cuenta de Netflix
          </p>

          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Conectando con el servidor seguro...
              </p>
            </div>
          ) : result ? (
            <div className={`p-6 rounded-xl border ${result.success ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
              <p className={`text-lg font-medium mb-2 ${result.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                {result.success ? '✅ ¡Verificación Exitosa!' : '❌ Error de Verificación'}
              </p>
              <p className={`text-sm ${result.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {result.message}
              </p>
              {result.account && (
                <div className="mt-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-green-100 dark:border-green-800">
                  <p className="text-xs text-green-600 dark:text-green-500 uppercase tracking-wider mb-1">Cuenta Principal</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{result.account}</p>
                </div>
              )}
            </div>
          ) : null}

          {!loading && result?.success && (
            <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
              <p>Tu solicitud ha sido procesada de forma segura.</p>
              <p>Si solicitaste el código, ya deberías tenerlo en WhatsApp o en pantalla.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
