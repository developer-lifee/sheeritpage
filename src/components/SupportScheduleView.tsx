import React, { useState, useEffect } from 'react';
import { Clock, Shield, Save, RefreshCw, AlertTriangle, CheckCircle, HelpCircle, ToggleLeft, ToggleRight, Radio } from 'lucide-react';

interface SupportScheduleConfig {
  manual_status: 'online' | 'offline' | 'auto';
  weekday_start: string;
  weekday_end: string;
  weekend_start: string;
  weekend_end: string;
  offline_message: string;
}

export const SupportScheduleView: React.FC = () => {
  const [config, setConfig] = useState<SupportScheduleConfig>({
    manual_status: 'auto',
    weekday_start: '10:00',
    weekday_end: '22:00',
    weekend_start: '16:00',
    weekend_end: '22:00',
    offline_message: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [currentStatusOpen, setCurrentStatusOpen] = useState<boolean | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';

    try {
      const res = await fetch(`${apiUrl}/api/admin/support-schedule`);
      if (!res.ok) throw new Error('Error al obtener la configuración de horario');
      const data = await res.json();
      setConfig(data);

      // Simple local calculation to predict if it is open (approximate client-side view)
      calculateStatus(data);
    } catch (err) {
      console.error('Error fetching support schedule:', err);
      setError('No se pudo conectar con el bot para cargar los horarios.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatus = (cfg: SupportScheduleConfig) => {
    if (cfg.manual_status === 'online') {
      setCurrentStatusOpen(true);
      return;
    }
    if (cfg.manual_status === 'offline') {
      setCurrentStatusOpen(false);
      return;
    }

    // Auto status calculation based on current time (BOG UTC-5)
    try {
      const date = new Date();
      const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
      const bogotaDate = new Date(utc + (3600000 * -5));
      const day = bogotaDate.getDay();
      const isWeekend = (day === 0 || day === 6);

      const startStr = isWeekend ? cfg.weekend_start : cfg.weekday_start;
      const endStr = isWeekend ? cfg.weekend_end : cfg.weekday_end;

      const [startHour, startMin] = startStr.split(':').map(Number);
      const [endHour, endMin] = endStr.split(':').map(Number);

      const currentHour = bogotaDate.getHours();
      const currentMin = bogotaDate.getMinutes();

      const currentMinutes = currentHour * 60 + currentMin;
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      setCurrentStatusOpen(currentMinutes >= startMinutes && currentMinutes <= endMinutes);
    } catch (e) {
      setCurrentStatusOpen(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = (status: 'online' | 'offline' | 'auto') => {
    setConfig(prev => {
      const updated = { ...prev, manual_status: status };
      calculateStatus(updated);
      return updated;
    });
  };

  const handleInputChange = (field: keyof SupportScheduleConfig, value: string) => {
    setConfig(prev => {
      const updated = { ...prev, [field]: value };
      calculateStatus(updated);
      return updated;
    });
  };

  const handleSave = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/support-schedule/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, password: 'admin123' })
      });
      const result = await res.json();
      if (result.success) {
        setSuccess('Horarios y estado de soporte humano guardados con éxito.');
        fetchData();
      } else {
        setError(`❌ Error: ${result.message}`);
      }
    } catch (err) {
      setError('❌ Error al guardar la configuración.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center dark:text-white">
            <Clock className="mr-2 text-brand-primary" /> Horarios de Atención y Turnos
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Controla el horario de atención humana de soporte y el estado activo/inactivo (online/offline) del canal de WhatsApp.
          </p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={fetchData}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg transition-colors"
            title="Refrescar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleSave}
            disabled={actionLoading || loading}
            className="flex items-center justify-center bg-brand-primary hover:bg-brand-dark text-white font-bold text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {actionLoading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center bg-red-55/10 text-red-800 dark:text-red-200 p-4 rounded-xl mb-6 border border-red-200 dark:border-red-900/50">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center bg-green-55/10 text-green-800 dark:text-green-200 p-4 rounded-xl mb-6 border border-green-200 dark:border-green-900/50">
          <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 font-light">Cargando horarios de soporte...</div>
      ) : (
        <div className="space-y-8">
          {/* Status Panel Banner */}
          <div className={`p-5 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
            currentStatusOpen 
              ? 'bg-emerald-50/25 border-emerald-200 dark:bg-emerald-950/10 dark:border-emerald-900/30' 
              : 'bg-rose-50/25 border-rose-200 dark:bg-rose-950/10 dark:border-rose-900/30'
          }`}>
            <div>
              <span className="text-xs uppercase font-bold text-gray-400 dark:text-gray-500">Estado Actual de Asesores</span>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-3.5 h-3.5 rounded-full ${currentStatusOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                <span className={`text-xl font-black ${currentStatusOpen ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                  {currentStatusOpen ? 'ONLINE / ATENDIENDO' : 'OFFLINE / CERRADO'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-light">
                {config.manual_status === 'auto' 
                  ? 'El bot calcula el estado de forma automática según la hora local de Bogotá.'
                  : `El estado ha sido forzado manualmente a ${config.manual_status === 'online' ? 'Online' : 'Offline'}.`
                }
              </p>
            </div>

            {/* Manual controls buttons */}
            <div className="bg-gray-100 dark:bg-gray-750 p-1.5 rounded-xl border dark:border-gray-700 flex gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange('auto')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  config.manual_status === 'auto' 
                    ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-800 dark:text-white' 
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Automático
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('online')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  config.manual_status === 'online' 
                    ? 'bg-emerald-500 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-450'
                }`}
              >
                Forzar Online
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('offline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  config.manual_status === 'offline' 
                    ? 'bg-rose-500 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-450'
                }`}
              >
                Forzar Offline
              </button>
            </div>
          </div>

          {/* Schedules configure section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weekdays */}
            <div className="bg-gray-50/50 dark:bg-gray-850 p-5 rounded-2xl border dark:border-gray-750">
              <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-brand-primary" /> Lunes a Viernes
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">Hora de Inicio</label>
                  <input
                    type="time"
                    value={config.weekday_start}
                    onChange={(e) => handleInputChange('weekday_start', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">Hora de Cierre</label>
                  <input
                    type="time"
                    value={config.weekday_end}
                    onChange={(e) => handleInputChange('weekday_end', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Weekend */}
            <div className="bg-gray-50/50 dark:bg-gray-850 p-5 rounded-2xl border dark:border-gray-750">
              <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-brand-primary" /> Sábados y Domingos
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">Hora de Inicio</label>
                  <input
                    type="time"
                    value={config.weekend_start}
                    onChange={(e) => handleInputChange('weekend_start', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">Hora de Cierre</label>
                  <input
                    type="time"
                    value={config.weekend_end}
                    onChange={(e) => handleInputChange('weekend_end', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Custom message for closed schedule */}
          <div className="bg-gray-50/50 dark:bg-gray-850 p-5 rounded-2xl border dark:border-gray-750">
            <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-1 flex items-center">
              Mensaje Fuera de Horario (Canal Cerrado)
            </h4>
            <p className="text-[11px] text-gray-400 mb-3 font-light">
              Este mensaje se enviará automáticamente si un usuario solicita soporte humano o muestra alta frustración cuando no hay asesores activos.
            </p>
            <textarea
              rows={4}
              value={config.offline_message}
              onChange={(e) => handleInputChange('offline_message', e.target.value)}
              placeholder="Ej. Hola, nuestro canal de soporte humano está cerrado en este momento..."
              className="w-full p-3 text-sm rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">
              ⚠️ Nota: El bot agregará automáticamente la posición de la cola al final del mensaje (ej. "Tu turno en la cola de espera: #3. Nota: Dado que estamos fuera de horario, tu turno no avanzará...").
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
