import React, { useState, useEffect } from 'react';
import { Clock, User, Plus, Trash2, Save, RefreshCw, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

interface Agent {
  id: number;
  username: string;
  fullname: string;
  email: string;
  role: string;
  status: string;
}

interface ScheduleSlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface AgentScheduleViewProps {
  agentEmail: string;
  role: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' }
];

export const AgentScheduleView: React.FC<AgentScheduleViewProps> = ({ agentEmail, role }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string>(agentEmail);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const getApiUrl = () => {
    return window.location.hostname.includes('sheerit.com.co')
      ? 'https://bot.sheerit.com.co'
      : `http://${window.location.hostname}:3000`;
  };

  useEffect(() => {
    if (role === 'admin') {
      fetchAgents();
    }
  }, [role]);

  useEffect(() => {
    if (selectedEmail) {
      fetchSchedule(selectedEmail);
    }
  }, [selectedEmail]);

  const fetchAgents = async () => {
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/agents`);
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents);
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  };

  const fetchSchedule = async (email: string) => {
    setLoading(true);
    setError('');
    setSuccess('');
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/agents/schedule?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success) {
        // Map time slots to clean HH:MM format (removing seconds if returned by DB)
        const formatted = data.schedule.map((s: any) => ({
          day_of_week: s.day_of_week,
          start_time: s.start_time.substring(0, 5),
          end_time: s.end_time.substring(0, 5)
        }));
        setSchedule(formatted);
      } else {
        setError(data.message || 'Error al obtener el horario.');
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError('No se pudo conectar con el servidor para cargar el horario.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = (day: number) => {
    setSchedule(prev => [
      ...prev,
      { day_of_week: day, start_time: '08:00', end_time: '17:00' }
    ]);
  };

  const handleRemoveSlot = (index: number) => {
    setSchedule(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleTimeChange = (index: number, field: 'start_time' | 'end_time', value: string) => {
    setSchedule(prev => prev.map((slot, idx) => {
      if (idx === index) {
        return { ...slot, [field]: value };
      }
      return slot;
    }));
  };

  const handleSave = async () => {
    // Validate slots
    for (const slot of schedule) {
      if (slot.start_time >= slot.end_time) {
        const dayLabel = DAYS_OF_WEEK.find(d => d.value === slot.day_of_week)?.label;
        setError(`La hora de inicio debe ser menor a la hora de cierre en el día ${dayLabel} (${slot.start_time} - ${slot.end_time}).`);
        return;
      }
    }

    setSaving(true);
    setError('');
    setSuccess('');
    const apiUrl = getApiUrl();

    try {
      const res = await fetch(`${apiUrl}/api/admin/agents/schedule/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: selectedEmail, schedule })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Horario del asesor guardado correctamente.');
      } else {
        setError(data.message || 'Error al guardar el horario.');
      }
    } catch (err) {
      console.error('Error saving schedule:', err);
      setError('Error de conexión al guardar el horario.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center dark:text-white">
            <Calendar className="mr-2 text-brand-primary" /> Horarios de Trabajo de Asesores
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Define tus franjas horarias y días de disponibilidad laboral para la atención de clientes.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => fetchSchedule(selectedEmail)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg transition-colors"
            title="Refrescar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center justify-center bg-brand-primary hover:bg-brand-dark text-white font-bold text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Horario'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center bg-red-50/10 text-red-800 dark:text-red-200 p-4 rounded-xl mb-6 border border-red-250 dark:border-red-900/50">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center bg-green-50/10 text-green-800 dark:text-green-200 p-4 rounded-xl mb-6 border border-green-250 dark:border-green-900/50">
          <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* Select Agent dropdown for admin */}
      {role === 'admin' && agents.length > 0 && (
        <div className="mb-6 bg-gray-50 dark:bg-gray-850 p-4 rounded-xl border dark:border-gray-750 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center">
            <User className="w-4 h-4 mr-1 text-brand-primary" /> Seleccionar Asesor:
          </span>
          <select
            value={selectedEmail}
            onChange={(e) => setSelectedEmail(e.target.value)}
            className="w-full sm:w-72 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm"
          >
            {agents.map(agent => (
              <option key={agent.id} value={agent.email}>
                {agent.fullname} ({agent.role}) - {agent.email}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 font-light">
          Cargando horario del asesor...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {DAYS_OF_WEEK.map(day => {
            const daySlots = schedule
              .map((s, idx) => ({ ...s, idx }))
              .filter(s => s.day_of_week === day.value);

            return (
              <div
                key={day.value}
                className="bg-gray-50/30 dark:bg-gray-850/50 p-4 rounded-2xl border dark:border-gray-750 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="w-full md:w-32 flex-shrink-0">
                  <span className="font-bold text-gray-700 dark:text-gray-300 text-base">
                    {day.label}
                  </span>
                </div>

                <div className="flex-1 w-full flex flex-col gap-3">
                  {daySlots.length === 0 ? (
                    <span className="text-sm text-gray-400 dark:text-gray-500 italic font-light py-2">
                      Sin disponibilidad registrada (No laborable)
                    </span>
                  ) : (
                    daySlots.map((slot) => (
                      <div
                        key={slot.idx}
                        className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2.5 rounded-xl border dark:border-gray-700 w-full sm:w-auto animate-fadeIn"
                      >
                        <Clock className="w-4 h-4 text-gray-450 dark:text-gray-500" />
                        <input
                          type="time"
                          value={slot.start_time}
                          onChange={(e) => handleTimeChange(slot.idx, 'start_time', e.target.value)}
                          className="px-2 py-1 text-sm border rounded-lg dark:bg-gray-850 dark:border-gray-700 dark:text-white"
                        />
                        <span className="text-xs text-gray-400 dark:text-gray-500">a</span>
                        <input
                          type="time"
                          value={slot.end_time}
                          onChange={(e) => handleTimeChange(slot.idx, 'end_time', e.target.value)}
                          className="px-2 py-1 text-sm border rounded-lg dark:bg-gray-850 dark:border-gray-700 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSlot(slot.idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                          title="Eliminar franja"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="w-full md:w-auto flex-shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => handleAddSlot(day.value)}
                    className="flex items-center text-xs font-bold text-brand-primary hover:text-brand-dark px-3 py-1.5 rounded-lg border border-brand-primary/20 hover:border-brand-primary/50 transition-colors w-full md:w-auto justify-center"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Añadir Franja
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
