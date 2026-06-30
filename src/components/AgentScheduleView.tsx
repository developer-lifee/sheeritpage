import React, { useState, useEffect } from 'react';
import { Clock, User, Plus, Trash2, Save, RefreshCw, AlertTriangle, CheckCircle, Calendar, Users, X, ChevronLeft, ChevronRight, Lock } from 'lucide-react';

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

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' }
];

interface AgentScheduleViewProps {
  agentEmail: string;
  role: string;
}

// Helpers for dates
const getMondayOfDate = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
};

const formatDateYMD = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getBreakStartOptions = (startTime: string, endTime: string, breakType: string) => {
  if (!startTime || !endTime || !breakType || breakType === 'none') return [];
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const duration = breakType === 'break_30' ? 30 : 60;
  const options = [];
  
  // Generate options in 30-minute steps
  for (let m = startMin; m <= endMin - duration; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    options.push(timeStr);
  }
  return options;
};

export const AgentScheduleView: React.FC<AgentScheduleViewProps> = ({ agentEmail, role }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [allSchedules, setAllSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Week Pager State
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(getMondayOfDate(new Date()));
  const [isTemplateMode, setIsTemplateMode] = useState(false);

  // Modal Editing States
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editingDay, setEditingDay] = useState<{ value: number; label: string } | null>(null);
  const [editingSlots, setEditingSlots] = useState<ScheduleSlot[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  const getWeekStartParam = () => {
    return isTemplateMode ? 'default' : formatDateYMD(currentWeekDate);
  };

  const getApiUrl = () => {
    return window.location.hostname.includes('sheerit.com.co')
      ? 'https://bot.sheerit.com.co'
      : `http://${window.location.hostname}:3000`;
  };

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

  const fetchAllSchedules = async () => {
    setLoading(true);
    setError('');
    const apiUrl = getApiUrl();
    const weekStart = getWeekStartParam();
    try {
      const res = await fetch(`${apiUrl}/api/admin/agents/schedules/all?week_start=${weekStart}`);
      const data = await res.json();
      if (data.success) {
        setAllSchedules(data.schedules);
      } else {
        setError(data.message || 'Error al obtener todos los horarios.');
      }
    } catch (err) {
      console.error('Error fetching all schedules:', err);
      setError('No se pudo conectar con el servidor para cargar el panel de horarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    fetchAllSchedules();
  }, [currentWeekDate, isTemplateMode]);

  // Navigate Weeks
  const handlePrevWeek = () => {
    setIsTemplateMode(false);
    setCurrentWeekDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setIsTemplateMode(false);
    setCurrentWeekDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleCurrentWeek = () => {
    setIsTemplateMode(false);
    setCurrentWeekDate(getMondayOfDate(new Date()));
  };

  const handleTemplateMode = () => {
    setIsTemplateMode(true);
  };

  // Open Edit Modal for a cell
  const handleCellClick = async (agent: Agent, day: { value: number; label: string }) => {
    // Check permission: only admin or the user themselves can edit
    const isSelf = agent.email.toLowerCase() === agentEmail.toLowerCase();
    const isAdmin = role === 'admin';
    if (!isAdmin && !isSelf) return;

    setEditingAgent(agent);
    setEditingDay(day);
    setModalError('');
    setModalLoading(true);

    const apiUrl = getApiUrl();
    const weekStart = getWeekStartParam();

    try {
      const res = await fetch(`${apiUrl}/api/admin/agents/schedule?email=${encodeURIComponent(agent.email)}&week_start=${weekStart}`);
      const data = await res.json();
      if (data.success) {
        const formatted = data.schedule
          .filter((s: any) => s.day_of_week === day.value)
          .map((s: any) => ({
            day_of_week: s.day_of_week,
            start_time: s.start_time.substring(0, 5),
            end_time: s.end_time.substring(0, 5),
            break_type: s.break_type || 'none',
            break_start: s.break_start ? s.break_start.substring(0, 5) : ''
          }));
        setEditingSlots(formatted);
      } else {
        setModalError(data.message || 'Error al obtener el horario.');
      }
    } catch (err) {
      console.error('Error fetching schedule for modal:', err);
      setModalError('Error de conexión al cargar los turnos.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddSlot = () => {
    if (!editingDay) return;
    // Default values: 9 hours gross (09:00 - 18:00), lunch break at 13:00 (8 net hours)
    setEditingSlots(prev => [
      ...prev,
      {
        day_of_week: editingDay.value,
        start_time: '09:00',
        end_time: '18:00',
        break_type: 'lunch_60',
        break_start: '13:00'
      }
    ]);
  };

  const handleRemoveSlot = (index: number) => {
    setEditingSlots(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSlotChange = (index: number, field: keyof ScheduleSlot, value: any) => {
    setEditingSlots(prev => prev.map((slot, idx) => {
      if (idx === index) {
        const updated = { ...slot, [field]: value };
        if (field === 'break_type') {
          if (value === 'none') {
            updated.break_start = '';
          } else {
            // Set first available break option as default when break is selected
            const options = getBreakStartOptions(updated.start_time, updated.end_time, value);
            updated.break_start = options.length > 0 ? options[0] : '';
          }
        }
        return updated;
      }
      return slot;
    }));
  };

  const handleSaveModal = async () => {
    if (!editingAgent || !editingDay) return;

    // Validate editing slots
    for (const slot of editingSlots) {
      if (slot.start_time >= slot.end_time) {
        setModalError(`La hora de inicio debe ser menor a la de cierre (${slot.start_time} - ${slot.end_time}).`);
        return;
      }
      if (slot.break_type && slot.break_type !== 'none') {
        if (!slot.break_start) {
          setModalError('Debes seleccionar la hora del break/almuerzo.');
          return;
        }
        if (slot.break_start <= slot.start_time || slot.break_start >= slot.end_time) {
          setModalError(`La hora del break debe estar dentro de la franja (${slot.start_time} - ${slot.end_time}).`);
          return;
        }
      }
    }

    setModalSaving(true);
    setModalError('');
    const apiUrl = getApiUrl();
    const weekStart = getWeekStartParam();

    try {
      // 1. Fetch current full schedule for this agent
      const resSchedule = await fetch(`${apiUrl}/api/admin/agents/schedule?email=${encodeURIComponent(editingAgent.email)}&week_start=${weekStart}`);
      const dataSchedule = await resSchedule.json();
      
      let fullSchedule: ScheduleSlot[] = [];
      if (dataSchedule.success) {
        // Keep slots for other days
        fullSchedule = dataSchedule.schedule
          .filter((s: any) => s.day_of_week !== editingDay.value)
          .map((s: any) => ({
            day_of_week: s.day_of_week,
            start_time: s.start_time.substring(0, 5),
            end_time: s.end_time.substring(0, 5),
            break_type: s.break_type || 'none',
            break_start: s.break_start ? s.break_start.substring(0, 5) : ''
          }));
      }

      // 2. Append the newly edited slots for editingDay
      const mergedSchedule = [...fullSchedule, ...editingSlots];

      // 3. Save to server
      const resSave = await fetch(`${apiUrl}/api/admin/agents/schedule/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editingAgent.email,
          schedule: mergedSchedule,
          week_start: weekStart
        })
      });
      const dataSave = await resSave.json();

      if (dataSave.success) {
        setSuccess(`Horario de ${editingAgent.fullname} para el día ${editingDay.label} guardado.`);
        setEditingAgent(null);
        setEditingDay(null);
        fetchAllSchedules();
      } else {
        setModalError(dataSave.message || 'Error al guardar.');
      }
    } catch (err) {
      console.error('Error saving slot from modal:', err);
      setModalError('Error de conexión al guardar.');
    } finally {
      setModalSaving(false);
    }
  };

  const getAgentSlotsForDay = (agentEmail: string, dayValue: number) => {
    return allSchedules.filter((s: any) => s.email.toLowerCase() === agentEmail.toLowerCase() && s.day_of_week === dayValue);
  };

  const getFormattedWeekLabel = () => {
    if (isTemplateMode) return 'Plantilla / Horario Base';
    const nextSunday = new Date(currentWeekDate);
    nextSunday.setDate(nextSunday.getDate() + 6);
    
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const startStr = currentWeekDate.toLocaleDateString('es-ES', options);
    const endStr = nextSunday.toLocaleDateString('es-ES', options);
    const year = currentWeekDate.getFullYear();
    return `Semana del ${startStr} al ${endStr}, ${year}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6 animate-fadeIn relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center dark:text-white">
            <Calendar className="mr-2 text-brand-primary" /> Horarios de Trabajo de Asesores
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Revisa y agenda las franjas horarias y almuerzos. Haz clic en las celdas para modificar tu horario o el de tu equipo.
          </p>
        </div>

        {/* Paginador de semanas */}
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-850 p-1.5 rounded-xl border dark:border-gray-700 w-full lg:w-auto justify-between lg:justify-start">
          <button
            onClick={handlePrevWeek}
            className="p-1.5 hover:bg-white dark:hover:bg-gray-750 rounded-lg transition-all dark:text-gray-300"
            title="Semana anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 px-3 min-w-[200px] text-center">
            {getFormattedWeekLabel()}
          </span>

          <button
            onClick={handleNextWeek}
            className="p-1.5 hover:bg-white dark:hover:bg-gray-750 rounded-lg transition-all dark:text-gray-300"
            title="Semana siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1"></div>

          <button
            onClick={handleCurrentWeek}
            className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-all ${
              !isTemplateMode && formatDateYMD(currentWeekDate) === formatDateYMD(getMondayOfDate(new Date()))
                ? 'bg-brand-primary text-white'
                : 'hover:bg-white dark:hover:bg-gray-750 text-gray-600 dark:text-gray-300'
            }`}
          >
            Esta Semana
          </button>
          
          <button
            onClick={handleTemplateMode}
            className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-all ${
              isTemplateMode
                ? 'bg-brand-primary text-white'
                : 'hover:bg-white dark:hover:bg-gray-750 text-gray-600 dark:text-gray-300'
            }`}
            title="Editar la plantilla base recurrente"
          >
            Plantilla Base
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

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 font-light">
          Cargando cuadrante de colaboradores...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-750">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-850 text-gray-700 dark:text-gray-300 uppercase text-xxs font-bold tracking-wider border-b border-gray-100 dark:border-gray-750">
                <th className="py-3.5 px-4 min-w-[170px]">Colaborador</th>
                {DAYS_OF_WEEK.map(day => (
                  <th key={day.value} className="py-3.5 px-4 text-center font-bold">{day.label}</th>
                ))}
                <th className="py-3.5 px-4 text-center font-bold min-w-[110px]">Horas Semanales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-750">
              {agents.map(agent => {
                const agentSlots = allSchedules.filter((s: any) => s.email.toLowerCase() === agent.email.toLowerCase());
                const totalWeeklyHours = agentSlots.reduce((acc, slot) => acc + calculateSlotHours(slot), 0);
                const isEditableRow = role === 'admin' || agent.email.toLowerCase() === agentEmail.toLowerCase();

                return (
                  <tr
                    key={agent.id}
                    className="hover:bg-gray-50/30 dark:hover:bg-gray-750/20 text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    {/* Collaborador Info */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold flex items-center gap-1.5 text-xs text-gray-800 dark:text-gray-200">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {agent.fullname}
                          {!isEditableRow && <Lock className="w-3 h-3 text-gray-400" title="Solo lectura" />}
                        </span>
                        <span className="text-xxs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">{agent.email}</span>
                        <span className="text-xxs font-extrabold text-brand-primary uppercase tracking-wider mt-1">{agent.role}</span>
                      </div>
                    </td>

                    {/* Week Days */}
                    {DAYS_OF_WEEK.map(day => {
                      const slots = getAgentSlotsForDay(agent.email, day.value);
                      
                      return (
                        <td
                          key={day.value}
                          onClick={() => handleCellClick(agent, day)}
                          className={`py-3 px-2 text-center align-middle transition-all ${
                            isEditableRow
                              ? 'cursor-pointer hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10'
                              : 'cursor-not-allowed opacity-90'
                          }`}
                        >
                          {slots.length === 0 ? (
                            <span className="text-gray-350 dark:text-gray-600 italic text-xxs font-light hover:text-brand-primary">
                              {isEditableRow ? '+ Libre' : 'Libre'}
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1 items-center">
                              {slots.map((s: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-xxs font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20 dark:bg-brand-primary/20 dark:text-brand-light font-mono min-w-[90px]"
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
                              ))}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Total Hours */}
                    <td className="py-4 px-4 text-center align-middle font-mono font-bold text-sm text-brand-primary">
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

      {/* Edit Slots Modal */}
      {editingAgent && editingDay && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full border dark:border-gray-700 shadow-2xl p-6 relative">
            <button
              onClick={() => { setEditingAgent(null); setEditingDay(null); }}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-150 dark:hover:bg-gray-700 rounded-lg text-gray-400 dark:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold dark:text-white mb-1 flex items-center gap-1.5">
              <Calendar className="text-brand-primary" /> Editar Horario
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Configura los turnos para <strong>{editingAgent.fullname}</strong> el día <strong>{editingDay.label}</strong> ({getFormattedWeekLabel()}).
            </p>

            {modalError && (
              <div className="bg-red-50/10 text-red-800 dark:text-red-200 border border-red-250 dark:border-red-900/50 p-3 rounded-xl mb-4 text-xs">
                {modalError}
              </div>
            )}

            {modalLoading ? (
              <div className="text-center py-8 text-gray-500">Cargando turnos actuales...</div>
            ) : (
              <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
                {editingSlots.length === 0 ? (
                  <div className="text-center py-8 border border-dashed dark:border-gray-700 rounded-xl text-gray-400 dark:text-gray-500 italic text-sm">
                    Sin turnos asignados (Día libre)
                  </div>
                ) : (
                  editingSlots.map((slot, index) => {
                    const breakOptions = getBreakStartOptions(slot.start_time, slot.end_time, slot.break_type || '');
                    
                    return (
                      <div
                        key={index}
                        className="bg-gray-50 dark:bg-gray-850 p-4 rounded-xl border dark:border-gray-700 flex flex-col gap-3 relative animate-fadeIn"
                      >
                        {/* Horario de la Franja */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400 min-w-[50px]">Franja:</span>
                          <input
                            type="time"
                            value={slot.start_time}
                            onChange={(e) => handleSlotChange(index, 'start_time', e.target.value)}
                            className="px-2 py-1 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          />
                          <span className="text-xs text-gray-400">a</span>
                          <input
                            type="time"
                            value={slot.end_time}
                            onChange={(e) => handleSlotChange(index, 'end_time', e.target.value)}
                            className="px-2 py-1 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                          />

                          <span className="text-xxs font-bold text-brand-primary bg-brand-primary/5 px-2 py-1 rounded ml-auto">
                            {calculateSlotHours(slot).toFixed(1)} hrs netas
                          </span>
                        </div>

                        {/* Tipo de Break */}
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400 min-w-[50px]">Descanso:</span>
                          <select
                            value={slot.break_type || 'none'}
                            onChange={(e) => handleSlotChange(index, 'break_type', e.target.value)}
                            className="px-2 py-1 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white bg-transparent"
                          >
                            <option value="none">Sin descanso</option>
                            <option value="break_30">Break (30 min)</option>
                            <option value="lunch_60">Almuerzo (1 hora)</option>
                          </select>

                          {/* Inicio del Break (Relojito con horas disponibles) */}
                          {slot.break_type && slot.break_type !== 'none' && (
                            <div className="flex items-center gap-1.5 animate-fadeIn">
                              <span className="text-xxs font-bold text-gray-500">Hora:</span>
                              <select
                                value={slot.break_start || ''}
                                onChange={(e) => handleSlotChange(index, 'break_start', e.target.value)}
                                className="px-2 py-1 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white bg-transparent"
                              >
                                {breakOptions.length === 0 ? (
                                  <option value="">Rango inválido</option>
                                ) : (
                                  breakOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))
                                )}
                              </select>
                            </div>
                          )}

                          {/* Delete Slot Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(index)}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors ml-auto"
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
            )}

            {/* Modal Actions */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t dark:border-gray-700">
              <button
                type="button"
                onClick={handleAddSlot}
                disabled={modalLoading || modalSaving}
                className="flex items-center text-xs font-bold text-brand-primary hover:text-brand-dark px-3 py-2 rounded-xl border border-brand-primary/20 hover:border-brand-primary/50 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Añadir Franja (9h def)
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setEditingAgent(null); setEditingDay(null); }}
                  className="px-4 py-2 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveModal}
                  disabled={modalLoading || modalSaving}
                  className="bg-brand-primary hover:bg-brand-dark text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  {modalSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
