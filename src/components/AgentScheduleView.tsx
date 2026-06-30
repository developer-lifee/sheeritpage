import React, { useState, useEffect } from 'react';
import { Clock, User, Plus, Trash2, Save, RefreshCw, AlertTriangle, CheckCircle, Calendar, Users, X, ChevronLeft, ChevronRight, Lock, DollarSign, Gift, Settings, ShieldAlert } from 'lucide-react';

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

interface PayrollAgent {
  agent_id: number;
  fullname: string;
  email: string;
  role: string;
  total_hours: number;
  hourly_rate: number;
  bonuses: Array<{ id: number; amount: number; reason: string; bonus_month: string }>;
  total_bonuses: number;
  total_payment: number;
  status: 'draft' | 'paid';
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

const getDayDateLabel = (mondayDate: Date, dayOfWeek: number) => {
  const d = new Date(mondayDate);
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setDate(d.getDate() + offset);
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return d.toLocaleDateString('es-ES', options);
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
  // Check if current user is Esteban
  const isEsteban = agentEmail.trim().toLowerCase() === 'estebanavila182@outlook.com';

  const [activeMainTab, setActiveMainTab] = useState<'calendar' | 'payroll'>('calendar');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [allSchedules, setAllSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Admin Config State (Only for Esteban)
  const [hourlyRate, setHourlyRate] = useState<number>(8333);
  const [allowOvertime, setAllowOvertime] = useState<boolean>(true);
  const [updatingConfig, setUpdatingConfig] = useState(false);
  
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

  // Payroll States (Only for Esteban)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [payrollList, setPayrollList] = useState<PayrollAgent[]>([]);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [bonusAgent, setBonusAgent] = useState<PayrollAgent | null>(null);
  const [bonusAmount, setBonusAmount] = useState<string>('');
  const [bonusReason, setBonusReason] = useState<string>('');
  const [bonusSaving, setBonusSaving] = useState(false);

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

  const fetchSupportConfig = async () => {
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/support-schedule`);
      if (res.ok) {
        const data = await res.json();
        setAllowOvertime(data.allow_overtime !== false);
        setHourlyRate(Number(data.hourly_rate || 8333));
      }
    } catch (err) {
      console.error('Error fetching support schedule config:', err);
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

  const fetchPayrollData = async () => {
    if (!isEsteban) return;
    setPayrollLoading(true);
    setError('');
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/payroll?month=${selectedMonth}`);
      const data = await res.json();
      if (data.success) {
        setPayrollList(data.payroll);
      } else {
        setError(data.message || 'Error al cargar los datos de nómina.');
      }
    } catch (err) {
      console.error('Error fetching payroll:', err);
      setError('Error al conectar para obtener los reportes de nómina.');
    } finally {
      setPayrollLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchSupportConfig();
  }, []);

  useEffect(() => {
    if (activeMainTab === 'calendar') {
      fetchAllSchedules();
    } else {
      fetchPayrollData();
    }
  }, [currentWeekDate, isTemplateMode, activeMainTab, selectedMonth]);

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
      // Validate Overtime Local rule
      const resConfig = await fetch(`${apiUrl}/api/admin/support-schedule`);
      const dataConfig = await resConfig.json();
      const allowOvertimeVal = dataConfig.allow_overtime !== false;
      
      if (!allowOvertimeVal) {
        let dailyNetMinutes = 0;
        for (const slot of editingSlots) {
          const [sh, sm] = slot.start_time.split(':').map(Number);
          const [eh, em] = slot.end_time.split(':').map(Number);
          const diff = (eh * 60 + em) - (sh * 60 + sm);
          if (diff <= 0) continue;
          
          let breakMin = 0;
          if (slot.break_type === 'break_30') breakMin = 30;
          else if (slot.break_type === 'lunch_60') breakMin = 60;
          
          dailyNetMinutes += Math.max(0, diff - breakMin);
        }
        if (dailyNetMinutes > 8 * 60) {
          setModalError('No se permiten horas extras. El límite diario configurado es de 8.0 horas netas.');
          setModalSaving(false);
          return;
        }
      }

      // Fetch current full schedule
      const resSchedule = await fetch(`${apiUrl}/api/admin/agents/schedule?email=${encodeURIComponent(editingAgent.email)}&week_start=${weekStart}`);
      const dataSchedule = await resSchedule.json();
      
      let fullSchedule: ScheduleSlot[] = [];
      if (dataSchedule.success) {
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

      const mergedSchedule = [...fullSchedule, ...editingSlots];

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
      console.error('Error saving slot:', err);
      setModalError('Error de conexión al guardar.');
    } finally {
      setModalSaving(false);
    }
  };

  // Save Config (Only for Esteban)
  const handleSaveAdminConfig = async () => {
    if (!isEsteban) return;
    setUpdatingConfig(true);
    setError('');
    setSuccess('');
    const apiUrl = getApiUrl();
    try {
      // 1. Fetch current config
      const resGet = await fetch(`${apiUrl}/api/admin/support-schedule`);
      const currentConfig = await resGet.json();

      // 2. Merge changes
      const updatedConfig = {
        ...currentConfig,
        allow_overtime: allowOvertime,
        hourly_rate: hourlyRate
      };

      // 3. Save
      const resSave = await fetch(`${apiUrl}/api/admin/support-schedule/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: updatedConfig, password: 'admin123' })
      });
      const dataSave = await resSave.json();
      if (dataSave.success) {
        setSuccess('Configuración de horas extras y valor hora actualizada.');
      } else {
        setError(dataSave.message || 'Error al guardar la configuración.');
      }
    } catch (err) {
      console.error('Error saving admin config:', err);
      setError('Error al guardar las configuraciones de administrador.');
    } finally {
      setUpdatingConfig(false);
    }
  };

  // Add Bonus (Only for Esteban)
  const handleSaveBonus = async () => {
    if (!bonusAgent || !bonusAmount || !bonusReason) return;
    setBonusSaving(true);
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/bonuses/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: bonusAgent.email,
          amount: parseFloat(bonusAmount),
          reason: bonusReason,
          bonus_month: selectedMonth
        })
      });
      const data = await res.json();
      if (data.success) {
        setBonusModalOpen(false);
        setBonusAmount('');
        setBonusReason('');
        setBonusAgent(null);
        fetchPayrollData();
      } else {
        alert(data.message || 'Error al guardar bono.');
      }
    } catch (err) {
      console.error('Error saving bonus:', err);
    } finally {
      setBonusSaving(false);
    }
  };

  // Delete Bonus (Only for Esteban)
  const handleDeleteBonus = async (bonusId: number) => {
    if (!window.confirm('¿Seguro de eliminar este bono?')) return;
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/bonuses/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bonusId })
      });
      const data = await res.json();
      if (data.success) {
        fetchPayrollData();
      }
    } catch (err) {
      console.error('Error deleting bonus:', err);
    }
  };

  // Close Payroll Month (Only for Esteban)
  const handleClosePayroll = async (agent: PayrollAgent) => {
    if (!window.confirm(`¿Seguro de cerrar/pagar la nómina de ${agent.fullname} para el mes ${selectedMonth}? Esto persistirá el registro en la contabilidad.`)) return;
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/payroll/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: agent.email,
          payroll_month: selectedMonth,
          total_hours: agent.total_hours,
          hourly_rate: agent.hourly_rate,
          total_bonuses: agent.total_bonuses,
          total_payment: agent.total_payment,
          status: 'paid'
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchPayrollData();
      }
    } catch (err) {
      console.error('Error closing payroll:', err);
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
      
      {/* TABS PRINCIPALES (Solo visible para Esteban) */}
      {isEsteban && (
        <div className="flex border-b border-gray-100 dark:border-gray-750 mb-6 gap-4">
          <button
            onClick={() => setActiveMainTab('calendar')}
            className={`flex items-center gap-2 py-3 px-5 border-b-2 font-bold text-sm transition-colors ${
              activeMainTab === 'calendar'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Calendario de Turnos
          </button>
          <button
            onClick={() => setActiveMainTab('payroll')}
            className={`flex items-center gap-2 py-3 px-5 border-b-2 font-bold text-sm transition-colors ${
              activeMainTab === 'payroll'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Nómina y Pagos
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

      {activeMainTab === 'calendar' ? (
        <>
          {/* VISTA CALENDARIO */}
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
                      <th key={day.value} className="py-3.5 px-4 text-center font-bold">
                        <div className="flex flex-col items-center">
                          <span>{day.label}</span>
                          {!isTemplateMode && (
                            <span className="text-[10px] text-gray-400 font-normal mt-0.5">
                              ({getDayDateLabel(currentWeekDate, day.value)})
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="py-3.5 px-4 text-center font-bold min-w-[150px]">Costo Semanal / Horas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-750">
                  {agents.map(agent => {
                    const agentSlots = allSchedules.filter((s: any) => s.email.toLowerCase() === agent.email.toLowerCase());
                    const totalWeeklyHours = agentSlots.reduce((acc, slot) => acc + calculateSlotHours(slot), 0);
                    const isEditableRow = role === 'admin' || agent.email.toLowerCase() === agentEmail.toLowerCase();
                    const estimatedPay = totalWeeklyHours * hourlyRate;

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

                        {/* Cost & Hours Info */}
                        <td className="py-4 px-4 text-center align-middle font-mono font-bold text-sm text-brand-primary">
                          <div className="flex flex-col items-center gap-1">
                            <span className="bg-brand-primary/5 dark:bg-brand-primary/15 px-2.5 py-1 rounded-xl text-xs text-brand-primary">
                              {totalWeeklyHours.toFixed(1)} hrs
                            </span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-sans font-normal">
                              Est: ${estimatedPay.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          {/* PESTAÑA NÓMINA (SOLO ESTEBAN) */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center dark:text-white">
                <DollarSign className="mr-2 text-brand-primary" /> Reporte de Nómina Mensual
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Visualiza, añade bonos y cierra el historial de pagos de tu equipo para contabilidad.
              </p>
            </div>

            {/* Selector de Mes */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Seleccionar Mes:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border rounded-xl dark:bg-gray-850 dark:border-gray-700 dark:text-white text-sm"
              />
            </div>
          </div>

          {/* Configuración de Administrador de Esteban */}
          <div className="bg-gray-50/50 dark:bg-gray-850 border border-dashed border-gray-250 dark:border-gray-700 rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-bold text-gray-850 dark:text-gray-150 flex items-center gap-1.5 mb-4">
              <Settings className="w-4 h-4 text-brand-primary" /> Configuración General de Horas Extras y Valor Hora
            </h3>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Overtime allow */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">¿Permitir horas extras?</span>
                <button
                  type="button"
                  onClick={() => setAllowOvertime(true)}
                  className={`px-3 py-1 text-xxs font-extrabold rounded-lg transition-all ${
                    allowOvertime ? 'bg-brand-primary text-white shadow-sm' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'
                  }`}
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => setAllowOvertime(false)}
                  className={`px-3 py-1 text-xxs font-extrabold rounded-lg transition-all ${
                    !allowOvertime ? 'bg-rose-500 text-white shadow-sm' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'
                  }`}
                >
                  No (Máx 8h netas)
                </button>
              </div>

              {/* Hourly rate value */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Valor Hora (COP):</span>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="px-2.5 py-1 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white w-24"
                />
              </div>

              {/* Save Admin config */}
              <button
                onClick={handleSaveAdminConfig}
                disabled={updatingConfig}
                className="bg-brand-primary hover:bg-brand-dark text-white px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center transition-all disabled:opacity-50 sm:ml-auto"
              >
                <Save className="w-3.5 h-3.5 mr-1" />
                {updatingConfig ? 'Guardando...' : 'Guardar Ajustes'}
              </button>
            </div>
          </div>

          {/* Tabla de Nómina */}
          {payrollLoading ? (
            <div className="text-center py-12 text-gray-500">Cargando reportes de nómina...</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-750">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-850 text-gray-700 dark:text-gray-300 uppercase text-xxs font-bold tracking-wider border-b border-gray-100 dark:border-gray-750">
                    <th className="py-3 px-4">Asesor</th>
                    <th className="py-3 px-4 text-center">Horas Netas del Mes</th>
                    <th className="py-3 px-4 text-center">Valor Hora</th>
                    <th className="py-3 px-4">Bonos Aplicados</th>
                    <th className="py-3 px-4 text-right">Total a Pagar</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-750">
                  {payrollList.map(agent => (
                    <tr
                      key={agent.agent_id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30 text-gray-900 dark:text-gray-100 transition-colors"
                    >
                      {/* Name / Info */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-gray-800 dark:text-gray-200">{agent.fullname}</span>
                          <span className="text-xxs text-gray-500 font-mono mt-0.5">{agent.email}</span>
                        </div>
                      </td>

                      {/* Hours */}
                      <td className="py-4 px-4 text-center font-mono font-bold">
                        {agent.total_hours.toFixed(1)} hrs
                      </td>

                      {/* Rate */}
                      <td className="py-4 px-4 text-center font-mono text-xs">
                        ${agent.hourly_rate.toLocaleString('es-CO')} / h
                      </td>

                      {/* Bonuses List */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1.5 max-w-[200px]">
                          {agent.bonuses.length === 0 ? (
                            <span className="text-xxs text-gray-400 italic">Sin bonos</span>
                          ) : (
                            agent.bonuses.map(b => (
                              <div key={b.id} className="flex items-center justify-between bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg px-2 py-1 text-xxs text-emerald-800 dark:text-emerald-300">
                                <span>{b.reason} (+${b.amount})</span>
                                {agent.status !== 'paid' && (
                                  <button
                                    onClick={() => handleDeleteBonus(b.id)}
                                    className="text-red-500 hover:text-red-700 ml-1.5"
                                    title="Eliminar bono"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                          {agent.status !== 'paid' && (
                            <button
                              type="button"
                              onClick={() => { setBonusAgent(agent); setBonusModalOpen(true); }}
                              className="text-xxs font-bold text-emerald-700 dark:text-emerald-450 hover:underline flex items-center mt-1"
                            >
                              <Gift className="w-3 h-3 mr-1" /> + Agregar Bono
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Total to pay */}
                      <td className="py-4 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ${Math.round(agent.total_payment).toLocaleString('es-CO')}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-lg text-xxs font-extrabold uppercase ${
                          agent.status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {agent.status === 'paid' ? 'CERRADO / PAGADO' : 'BORRADOR'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-center">
                        {agent.status !== 'paid' ? (
                          <button
                            onClick={() => handleClosePayroll(agent)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xxs px-2.5 py-1.5 rounded-lg transition-all"
                          >
                            Cerrar Nómina
                          </button>
                        ) : (
                          <span className="text-xxs text-gray-400 italic flex items-center justify-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-500" /> Archivado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
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

                          {/* Inicio del Break */}
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

      {/* Bonus Modal (Esteban Only) */}
      {bonusModalOpen && bonusAgent && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full border dark:border-gray-700 shadow-2xl p-6 relative">
            <button
              onClick={() => { setBonusModalOpen(false); setBonusAgent(null); }}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-150 dark:hover:bg-gray-700 rounded-lg text-gray-400 dark:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold dark:text-white mb-2 flex items-center gap-1.5">
              <Gift className="text-emerald-500" /> Registrar Bono
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Asigna un incentivo o bono a <strong>{bonusAgent.fullname}</strong> para el mes de <strong>{selectedMonth}</strong>.
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Monto (COP):</label>
                <input
                  type="number"
                  placeholder="Ej. 50000"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl dark:bg-gray-850 dark:border-gray-700 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Motivo / Descripción:</label>
                <input
                  type="text"
                  placeholder="Ej. Excelente desempeño dominical"
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl dark:bg-gray-850 dark:border-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t dark:border-gray-700">
              <button
                type="button"
                onClick={() => { setBonusModalOpen(false); setBonusAgent(null); }}
                className="px-4 py-2 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-755 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveBonus}
                disabled={bonusSaving || !bonusAmount || !bonusReason}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-1.5" />
                {bonusSaving ? 'Guardando...' : 'Asignar Bono'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
