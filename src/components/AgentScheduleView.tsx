import React, { useState, useEffect } from 'react';
import { Clock, User, Plus, Trash2, Save, RefreshCw, AlertTriangle, CheckCircle, Calendar, Users } from 'lucide-react';

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
  break_type?: 'none' | 'break_30' | 'lunch_60';
  break_start?: string;
}

export const calculateSlotHours = (slot: { start_time: string; end_time: string; break_type?: string }) => {
  if (!slot.start_time || !slot.end_time) return 0;
  const [sh, sm] = slot.start_time.split(':').map(Number);
  const [eh, em] = slot.end_time.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) return 0;
  let hours = diff / 60;
  if (slot.break_type === 'break_30') {
    hours = Math.max(0, hours - 0.5);
  } else if (slot.break_type === 'lunch_60') {
    hours = Math.max(0, hours - 1.0);
  }
  return hours;
};

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
  const [activeSubTab, setActiveSubTab] = useState<'edit' | 'overview'>('edit');
  const [allSchedules, setAllSchedules] = useState<any[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);

  const getApiUrl = () => {
    return window.location.hostname.includes('sheerit.com.co')
      ? 'https://bot.sheerit.com.co'
      : `http://${window.location.hostname}:3000`;
  };

  const fetchAllSchedules = async () => {
    setLoadingAll(true);
    setError('');
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/agents/schedules/all`);
      const data = await res.json();
      if (data.success) {
        setAllSchedules(data.schedules);
      } else {
        setError(data.message || 'Error al obtener todos los horarios.');
      }
    } catch (err) {
      console.error('Error fetching all schedules:', err);
      setError('No se pudo conectar con el servidor para cargar la vista general.');
    } finally {
      setLoadingAll(false);
    }
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

  useEffect(() => {
    if (activeSubTab === 'overview') {
      fetchAllSchedules();
    }
  }, [activeSubTab]);

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
        const formatted = data.schedule.map((s: any) => ({
          day_of_week: s.day_of_week,
          start_time: s.start_time.substring(0, 5),
          end_time: s.end_time.substring(0, 5),
          break_type: s.break_type || 'none',
          break_start: s.break_start ? s.break_start.substring(0, 5) : ''
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
      { day_of_week: day, start_time: '09:00', end_time: '17:00', break_type: 'none', break_start: '' }
    ]);
  };

  const handleRemoveSlot = (index: number) => {
    setSchedule(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSlotChange = (index: number, field: keyof ScheduleSlot, value: any) => {
    setSchedule(prev => prev.map((slot, idx) => {
      if (idx === index) {
        const updated = { ...slot, [field]: value };
        if (field === 'break_type' && value === 'none') {
          updated.break_start = '';
        }
        return updated;
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

      if (slot.break_type && slot.break_type !== 'none') {
        if (!slot.break_start) {
          const dayLabel = DAYS_OF_WEEK.find(d => d.value === slot.day_of_week)?.label;
          setError(`Debes ingresar la hora de inicio del break/almuerzo en el día ${dayLabel}.`);
          return;
        }
        if (slot.break_start <= slot.start_time || slot.break_start >= slot.end_time) {
          const dayLabel = DAYS_OF_WEEK.find(d => d.value === slot.day_of_week)?.label;
          setError(`La hora del break/almuerzo debe estar dentro del horario de la franja en el día ${dayLabel} (${slot.start_time} - ${slot.end_time}).`);
          return;
        }
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
  const getAgentSlotsForDay = (agentEmail: string, dayValue: number) => {
    return allSchedules.filter((s: any) => s.email === agentEmail && s.day_of_week === dayValue);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center dark:text-white">
            <Calendar className="mr-2 text-brand-primary" /> Horarios de Trabajo de Asesores
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Define tus franjas horarias y días de disponibilidad laboral para la atención de clientes o visualiza la cobertura global.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {activeSubTab === 'edit' ? (
            <>
              <button
                onClick={() => fetchSchedule(selectedEmail)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 rounded-lg transition-colors"
                title="Refrescar horario actual"
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
            </>
          ) : (
            <button
              onClick={fetchAllSchedules}
              disabled={loadingAll}
              className="flex items-center justify-center border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingAll ? 'animate-spin' : ''}`} />
              Refrescar Vista
            </button>
          )}
        </div>
      </div>

      {role === 'admin' && (
        <div className="flex border-b border-gray-100 dark:border-gray-750 mb-6">
          <button
            onClick={() => { setActiveSubTab('edit'); setError(''); setSuccess(''); }}
            className={`flex items-center gap-2 py-3 px-5 border-b-2 font-bold text-sm transition-colors ${
              activeSubTab === 'edit'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <User className="w-4 h-4" />
            Configurar por Asesor
          </button>
          <button
            onClick={() => { setActiveSubTab('overview'); setError(''); setSuccess(''); }}
            className={`flex items-center gap-2 py-3 px-5 border-b-2 font-bold text-sm transition-colors ${
              activeSubTab === 'overview'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Users className="w-4 h-4" />
            Vista General de Colaboradores
          </button>
        </div>
      )}

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

      {activeSubTab === 'edit' ? (
        <>
          {/* Select Agent dropdown for admin */}
          {role === 'admin' && agents.length > 0 && (
            <div className="mb-6 bg-gray-50 dark:bg-gray-850 p-4 rounded-xl border dark:border-gray-750 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center">
                <User className="w-4 h-4 mr-1 text-brand-primary" /> Seleccionar Asesor:
              </span>
              <select
                value={selectedEmail}
                onChange={(e) => setSelectedEmail(e.target.value)}
                className="w-full sm:w-72 px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm animate-fadeIn"
              >
                {agents.map(agent => (
                  <option key={agent.id} value={agent.email}>
                    {agent.fullname} ({agent.role}) - {agent.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {DAYS_OF_WEEK.map(day => {
              const daySlots = schedule
                .map((s, idx) => ({ ...s, idx }))
                .filter(s => s.day_of_week === day.value);

              return (
                <div
                  key={day.value}
                  className="bg-gray-50/30 dark:bg-gray-850/50 p-4 rounded-2xl border dark:border-gray-750 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fadeIn"
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
                      daySlots.map((slot) => {
                        const netHours = calculateSlotHours(slot);
                        return (
                          <div
                            key={slot.idx}
                            className="flex flex-col lg:flex-row lg:items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl border dark:border-gray-700 w-full animate-fadeIn"
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-450 dark:text-gray-500" />
                              <input
                                type="time"
                                value={slot.start_time}
                                onChange={(e) => handleSlotChange(slot.idx, 'start_time', e.target.value)}
                                className="px-2 py-1 text-sm border rounded-lg dark:bg-gray-850 dark:border-gray-700 dark:text-white"
                              />
                              <span className="text-xs text-gray-400 dark:text-gray-500">a</span>
                              <input
                                type="time"
                                value={slot.end_time}
                                onChange={(e) => handleSlotChange(slot.idx, 'end_time', e.target.value)}
                                className="px-2 py-1 text-sm border rounded-lg dark:bg-gray-850 dark:border-gray-700 dark:text-white"
                              />
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-0 lg:ml-2">Descanso:</span>
                              <select
                                value={slot.break_type || 'none'}
                                onChange={(e) => handleSlotChange(slot.idx, 'break_type', e.target.value)}
                                className="px-2 py-1 text-xs border rounded-lg dark:bg-gray-850 dark:border-gray-700 dark:text-white bg-transparent"
                              >
                                <option value="none">Sin Break</option>
                                <option value="break_30">Break (30 min)</option>
                                <option value="lunch_60">Almuerzo (1 hora)</option>
                              </select>

                              {slot.break_type && slot.break_type !== 'none' && (
                                <div className="flex items-center gap-1.5 animate-fadeIn">
                                  <span className="text-xxs text-gray-450">Inicio:</span>
                                  <input
                                    type="time"
                                    value={slot.break_start || ''}
                                    onChange={(e) => handleSlotChange(slot.idx, 'break_start', e.target.value)}
                                    className="px-1.5 py-0.5 text-xs border rounded-lg dark:bg-gray-850 dark:border-gray-700 dark:text-white"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 flex items-center justify-between lg:justify-end gap-3 mt-2 lg:mt-0">
                              <span className="text-xs font-bold text-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10 px-2 py-1 rounded-lg">
                                {netHours === 1 ? '1 hora neta' : `${netHours.toFixed(1)} horas netas`}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSlot(slot.idx)}
                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                                title="Eliminar franja"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
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
        </>
      ) : (
        <>
          {loadingAll ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 font-light">
              Cargando cuadrante de todos los colaboradores...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-750">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-850 text-gray-700 dark:text-gray-300 uppercase text-xxs font-bold tracking-wider border-b border-gray-100 dark:border-gray-750">
                    <th className="py-3 px-4 min-w-[150px]">Colaborador</th>
                    {DAYS_OF_WEEK.map(day => (
                      <th key={day.value} className="py-3 px-4 text-center font-bold">{day.label}</th>
                    ))}
                    <th className="py-3 px-4 text-center font-bold min-w-[110px]">Horas Semanales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-750">
                  {agents.map(agent => {
                    const agentSlots = allSchedules.filter((s: any) => s.email === agent.email);
                    const totalWeeklyHours = agentSlots.reduce((acc, slot) => acc + calculateSlotHours(slot), 0);

                    return (
                      <tr
                        key={agent.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30 text-gray-900 dark:text-gray-100 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold flex items-center gap-1.5 text-xs text-gray-800 dark:text-gray-200">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              {agent.fullname}
                            </span>
                            <span className="text-xxs text-gray-400 dark:text-gray-550 mt-0.5 font-mono">{agent.email}</span>
                            <span className="text-xxs font-extrabold text-brand-primary uppercase tracking-wider mt-1">{agent.role}</span>
                          </div>
                        </td>
                        {DAYS_OF_WEEK.map(day => {
                          const slots = getAgentSlotsForDay(agent.email, day.value);
                          return (
                            <td key={day.value} className="py-3 px-2 text-center align-middle">
                              {slots.length === 0 ? (
                                <span className="text-gray-300 dark:text-gray-600 italic text-xxs font-light">Libre</span>
                              ) : (
                                <div className="flex flex-col gap-1 items-center">
                                  {slots.map((s: any, idx: number) => {
                                    const sh = parseInt(s.start_time.split(':')[0]);
                                    const sm = parseInt(s.start_time.split(':')[1]);
                                    const eh = parseInt(s.end_time.split(':')[0]);
                                    const em = parseInt(s.end_time.split(':')[1]);

                                    return (
                                      <span
                                        key={idx}
                                        className="inline-flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-xxs font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20 dark:bg-brand-primary/20 dark:text-brand-light font-mono min-w-[90px]"
                                        title={`Horas brutas: ${((eh * 60 + em) - (sh * 60 + sm)) / 60}h. Descuento por descanso: ${s.break_type === 'lunch_60' ? '1h' : s.break_type === 'break_30' ? '30m' : '0m'}`}
                                      >
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-2.5 h-2.5" />
                                          {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}
                                        </span>
                                        {s.break_type && s.break_type !== 'none' && (
                                          <span className="text-[9px] text-gray-500 dark:text-gray-400 mt-0.5 font-sans flex items-center gap-0.5">
                                            {s.break_type === 'lunch_60' ? '🍱 Almuerzo' : '☕ Break'}: {s.break_start.substring(0, 5)}
                                          </span>
                                        )}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-center align-middle font-mono font-bold text-sm text-brand-primary">
                          <span className="bg-brand-primary/5 dark:bg-brand-primary/15 px-2.5 py-1 rounded-xl">
                            {totalWeeklyHours.toFixed(1)} hrs
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};
