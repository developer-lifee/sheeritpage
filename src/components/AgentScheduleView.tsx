import React, { useState, useEffect } from 'react';
import { Clock, User, Plus, Trash2, Save, RefreshCw, AlertTriangle, CheckCircle, Calendar, Users, X, ChevronLeft, ChevronRight, Lock, DollarSign, Gift, Settings, ShieldAlert, FileText, Printer, Award, History, Copy, Zap, Info } from 'lucide-react';

interface Agent {
  id: number;
  username: string;
  fullname: string;
  email: string;
  role: string;
  status: string;
  exclude_from_payroll?: boolean;
  max_weekly_hours?: number;
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
  start_date?: string;
  end_date?: string;
  total_hours: number;
  trial_hours?: number;
  normal_hours?: number;
  trial_hours_target?: number;
  trial_hours_left?: number;
  total_hist_trial?: number;
  hourly_rate: number;
  trial_hourly_rate?: number;
  bonuses: Array<{ id: number; amount: number; reason: string; bonus_month: string }>;
  total_bonuses: number;
  total_payment: number;
  exclude_from_payroll?: boolean;
  status: 'draft' | 'paid';
}

interface PayrollHistoryRecord {
  id: number;
  agent_id: number;
  fullname: string;
  email: string;
  role?: string;
  current_role?: string;
  payroll_month: string;
  start_date: string;
  end_date: string;
  total_hours: number;
  trial_hours: number;
  normal_hours: number;
  hourly_rate: number;
  total_bonuses: number;
  total_payment: number;
  period_label: string;
  status: string;
  created_at: string;
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

const generateTimeOptions = () => {
  const options = [];
  for (let h = 0; h < 24; h++) {
    const hStr = String(h).padStart(2, '0');
    options.push(`${hStr}:00`);
    options.push(`${hStr}:30`);
  }
  options.push("24:00");
  return options;
};

const getBreakStartOptions = (startTime: string, endTime: string, breakType: string) => {
  if (!startTime || !endTime || !breakType || breakType === 'none') return [];
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const duration = breakType === 'break_30' ? 30 : 60;
  
  // Care for mental health: break must start at least 90 minutes after start_time
  // and must end at least 90 minutes before end_time.
  const buffer = 90; 
  const minStart = startMin + buffer;
  const maxStart = endMin - duration - buffer;
  
  const options = [];
  for (let m = minStart; m <= maxStart; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    options.push(timeStr);
  }
  return options;
};

interface AgentScheduleViewProps {
  agentEmail: string;
  role: string;
  activeMainTab?: 'calendar' | 'payroll';
  setActiveMainTab?: (tab: 'calendar' | 'payroll') => void;
}

export const AgentScheduleView: React.FC<AgentScheduleViewProps> = ({
  agentEmail,
  role,
  activeMainTab: externalActiveMainTab,
  setActiveMainTab: externalSetActiveMainTab
}) => {
  // Check if current user is Esteban
  const isEsteban = agentEmail.trim().toLowerCase() === 'estebanavila182@outlook.com';

  const [internalActiveMainTab, internalSetActiveMainTab] = useState<'calendar' | 'payroll'>('calendar');
  const activeMainTab = externalActiveMainTab !== undefined ? externalActiveMainTab : internalActiveMainTab;
  const setActiveMainTab = externalSetActiveMainTab !== undefined ? externalSetActiveMainTab : internalSetActiveMainTab;
  const [agents, setAgents] = useState<Agent[]>([]);
  const [allSchedules, setAllSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Admin Config State (Only for Esteban)
  const [hourlyRate, setHourlyRate] = useState<number>(8333);
  const [trialHourlyRate, setTrialHourlyRate] = useState<number>(5000);
  const [trialHoursTarget, setTrialHoursTarget] = useState<number>(80);
  const [allowOvertime, setAllowOvertime] = useState<boolean>(true);
  const [maxHoursLimit, setMaxHoursLimit] = useState<number>(10);
  const [shiftStartLimit, setShiftStartLimit] = useState<string>('08:00');
  const [shiftEndLimit, setShiftEndLimit] = useState<string>('22:00');
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

  // Payroll & Cutoff States (Only for Esteban)
  const [selectedPeriodMode, setSelectedPeriodMode] = useState<'month' | 'range'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [payrollList, setPayrollList] = useState<PayrollAgent[]>([]);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [bonusAgent, setBonusAgent] = useState<PayrollAgent | null>(null);
  const [bonusAmount, setBonusAmount] = useState<string>('');
  const [bonusReason, setBonusReason] = useState<string>('');
  const [bonusSaving, setBonusSaving] = useState(false);

  // Pay Stub & History Modals State
  const [stubModalOpen, setStubModalOpen] = useState<boolean>(false);
  const [selectedStubAgent, setSelectedStubAgent] = useState<PayrollAgent | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);
  const [payrollHistory, setPayrollHistory] = useState<PayrollHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

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
        setTrialHourlyRate(Number(data.trial_hourly_rate || 5000));
        setTrialHoursTarget(Number(data.trial_hours_target || 80));
        setMaxHoursLimit(Number(data.max_hours_limit || 10));
        setShiftStartLimit(data.shift_start_limit || '08:00');
        setShiftEndLimit(data.shift_end_limit || '22:00');
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
      const url = selectedPeriodMode === 'range'
        ? `${apiUrl}/api/admin/payroll?start_date=${startDate}&end_date=${endDate}`
        : `${apiUrl}/api/admin/payroll?month=${selectedMonth}`;
      const res = await fetch(url);
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

  const fetchPayrollHistory = async () => {
    setHistoryLoading(true);
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/payroll/history`);
      const data = await res.json();
      if (data.success) {
        setPayrollHistory(data.history);
      }
    } catch (err) {
      console.error('Error fetching payroll history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleUpdateAgentRole = async (agentId: number, newRole: string) => {
    const apiUrl = getApiUrl();
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${apiUrl}/api/admin/agents/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId, role: newRole, password: 'admin123' })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Rol de asesor actualizado.');
        fetchPayrollData();
        fetchAgents();
      } else {
        setError(data.message || 'Error al actualizar el rol.');
      }
    } catch (err) {
      console.error('Error updating role:', err);
      setError('Error de conexión al actualizar rol.');
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
        start_time: '08:00',
        end_time: '17:00',
        break_type: 'lunch_60',
        break_start: '12:00'
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
        
        // Calculate slot duration
        const [sh, sm] = updated.start_time.split(':').map(Number);
        const [eh, em] = updated.end_time.split(':').map(Number);
        const durationHours = (eh * 60 + em - (sh * 60 + sm)) / 60;
        
        // Enforce mental health break logic on time change
        if (durationHours >= 5 && updated.break_type === 'none') {
          updated.break_type = 'lunch_60';
        } else if (durationHours < 4) {
          updated.break_type = 'none';
          updated.break_start = '';
        }

        if (field === 'break_type' || (durationHours >= 5 && updated.break_type === 'none') || field === 'start_time' || field === 'end_time') {
          if (updated.break_type === 'none') {
            updated.break_start = '';
          } else {
            const options = getBreakStartOptions(updated.start_time, updated.end_time, updated.break_type || 'lunch_60');
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
      const [sh, sm] = slot.start_time.split(':').map(Number);
      const [eh, em] = slot.end_time.split(':').map(Number);
      const durationHours = (eh * 60 + em - (sh * 60 + sm)) / 60;
      if (durationHours >= 4 && slot.break_type && slot.break_type !== 'none') {
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
      // Clear breaks for slots under 4 hours
      for (const slot of editingSlots) {
        const [sh, sm] = slot.start_time.split(':').map(Number);
        const [eh, em] = slot.end_time.split(':').map(Number);
        const durationHours = (eh * 60 + em - (sh * 60 + sm)) / 60;
        if (durationHours < 4) {
          slot.break_type = 'none';
          slot.break_start = '';
        }
      }

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
        const limitVal = parseFloat(dataConfig.max_hours_limit || 10);
        if (dailyNetMinutes > limitVal * 60) {
          setModalError(`No se permiten horas extras. El límite diario configurado es de ${limitVal.toFixed(1)} horas netas.`);
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
          week_start: weekStart,
          requester_email: agentEmail,
          day_of_week: editingDay.value
        })
      });
      const dataSave = await resSave.json();

      if (dataSave.success) {
        setSuccess(`Horario de ${editingAgent.fullname} para el día ${editingDay.label} guardado.`);
        setEditingAgent(null);
        setEditingDay(null);
        fetchAllSchedules();
        fetchPayrollData();
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

  const handleReplicateCurrentSlotsToWeek = async (mode: 'all' | 'workdays') => {
    if (!editingAgent || !editingDay || editingSlots.length === 0) return;
    setModalSaving(true);
    setModalError('');

    const targetDays = mode === 'workdays' ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6, 0];
    const apiUrl = getApiUrl();
    const weekStart = getWeekStartParam();

    try {
      const resSchedule = await fetch(`${apiUrl}/api/admin/agents/schedule?email=${encodeURIComponent(editingAgent.email)}&week_start=${weekStart}`);
      const dataSchedule = await resSchedule.json();

      let currentSlots: ScheduleSlot[] = [];
      if (dataSchedule.success) {
        currentSlots = dataSchedule.schedule.map((s: any) => ({
          day_of_week: s.day_of_week,
          start_time: s.start_time.substring(0, 5),
          end_time: s.end_time.substring(0, 5),
          break_type: s.break_type || 'none',
          break_start: s.break_start ? s.break_start.substring(0, 5) : ''
        }));
      }

      const filtered = currentSlots.filter(s => !targetDays.includes(s.day_of_week));
      const replicated: ScheduleSlot[] = [];

      for (const dayVal of targetDays) {
        for (const slot of editingSlots) {
          replicated.push({
            ...slot,
            day_of_week: dayVal
          });
        }
      }

      const mergedSchedule = [...filtered, ...replicated];

      const resSave = await fetch(`${apiUrl}/api/admin/agents/schedule/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editingAgent.email,
          schedule: mergedSchedule,
          week_start: weekStart,
          requester_email: agentEmail
        })
      });

      const dataSave = await resSave.json();
      if (dataSave.success) {
        setSuccess(`Turnos replicados exitosamente para ${editingAgent.fullname}.`);
        setEditingAgent(null);
        setEditingDay(null);
        fetchAllSchedules();
        fetchPayrollData();
      } else {
        setModalError(dataSave.message || 'Error al replicar turnos.');
      }
    } catch (err) {
      console.error('Error replicating slots:', err);
      setModalError('Error al replicar turnos.');
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
        hourly_rate: hourlyRate,
        trial_hourly_rate: trialHourlyRate,
        trial_hours_target: trialHoursTarget,
        max_hours_limit: maxHoursLimit,
        shift_start_limit: shiftStartLimit,
        shift_end_limit: shiftEndLimit
      };

      // 3. Save
      const resSave = await fetch(`${apiUrl}/api/admin/support-schedule/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: updatedConfig, password: 'admin123' })
      });
      const dataSave = await resSave.json();
      if (dataSave.success) {
        setSuccess('Configuración de tarifas y horas de prueba actualizada.');
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

  // Close Payroll Period (Only for Esteban)
  const handleClosePayroll = async (agent: PayrollAgent) => {
    const periodDesc = selectedPeriodMode === 'range' ? `período ${startDate} al ${endDate}` : `mes ${selectedMonth}`;
    if (!window.confirm(`¿Seguro de cerrar/pagar la nómina de ${agent.fullname} para el ${periodDesc}? Esto archivará las horas pagadas y generará el desprendible.`)) return;
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/payroll/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: agent.email,
          payroll_month: selectedMonth,
          start_date: startDate,
          end_date: endDate,
          total_hours: agent.total_hours,
          trial_hours: agent.trial_hours || 0,
          normal_hours: agent.normal_hours || agent.total_hours,
          hourly_rate: agent.hourly_rate,
          total_bonuses: agent.total_bonuses,
          total_payment: agent.total_payment,
          period_label: `Período ${startDate} al ${endDate}`,
          status: 'paid'
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.promoted) {
          alert(`🎉 ¡EXCELENTE! ${agent.fullname} ha sido promovido automáticamente a AGENT tras completar las ${trialHoursTarget} horas de prueba.`);
        } else {
          setSuccess(data.message || 'Nómina cerrada correctamente.');
        }
        fetchPayrollData();
      }
    } catch (err) {
      console.error('Error closing payroll:', err);
    }
  };

  const handleTogglePayrollExclusion = async (agentId: number, currentExclude: boolean) => {
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/agents/toggle-payroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          exclude_from_payroll: !currentExclude
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        fetchPayrollData();
      } else {
        setError(data.message || 'Error al actualizar exclusión de nómina.');
      }
    } catch (err) {
      console.error('Error toggling payroll exclusion:', err);
      setError('Error al actualizar exclusión de nómina.');
    }
  };

  const handleOpenStubModal = (agent: PayrollAgent) => {
    setSelectedStubAgent(agent);
    setStubModalOpen(true);
  };

  const handlePrintStub = () => {
    window.print();
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

          {/* Banner de Rango Permitido */}
          <div className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-xl p-3 flex items-center justify-between gap-2 text-xs font-bold mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-primary flex-shrink-0" />
              <span>📌 Franja laboral permitida para asignación de turnos: <strong className="font-mono bg-brand-primary/15 px-1.5 py-0.5 rounded">{shiftStartLimit}</strong> a <strong className="font-mono bg-brand-primary/15 px-1.5 py-0.5 rounded">{shiftEndLimit}</strong>.</span>
            </div>
            <span className="text-[11px] text-gray-500 font-normal hidden md:inline">
              (Máximo 12.0h netas diarias)
            </span>
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
                            {agent.exclude_from_payroll && (
                              <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 w-fit">
                                🚫 Sueldo Excluido ($0)
                              </span>
                            )}
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
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                              totalWeeklyHours > (agent.max_weekly_hours || 40)
                                ? 'bg-red-500/10 text-red-500'
                                : 'bg-brand-primary/5 text-brand-primary'
                            }`}>
                              {totalWeeklyHours.toFixed(1)} / {(agent.max_weekly_hours || 40).toFixed(0)} hrs
                            </span>
                            {allowOvertime && (
                              <span className="text-[9px] text-emerald-600 dark:text-emerald-450 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-lg mt-0.5">
                                Extras permitidas
                              </span>
                            )}
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-sans font-normal mt-1">
                              {agent.exclude_from_payroll ? (
                                <span className="text-gray-400 font-bold">Est: $0 (Excluido)</span>
                              ) : (
                                `Est: $${estimatedPay.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
                              )}
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
                <DollarSign className="mr-2 text-brand-primary" /> Reporte y Cierre de Nómina
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Visualiza, efectúa cierres parciales/mitad de mes, asigna bonos y genera desprendibles de pago.
              </p>
            </div>

            {/* Selector de Período y Modal Historial */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => { fetchPayrollHistory(); setHistoryModalOpen(true); }}
                className="flex items-center gap-1.5 px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <History className="w-4 h-4 text-brand-primary" /> Historial de Desprendibles
              </button>

              <div className="flex items-center bg-gray-100 dark:bg-gray-850 p-1 rounded-xl border dark:border-gray-700 text-xs">
                <button
                  onClick={() => setSelectedPeriodMode('month')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    selectedPeriodMode === 'month'
                      ? 'bg-white dark:bg-gray-700 text-brand-primary shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  Mes Completo
                </button>
                <button
                  onClick={() => setSelectedPeriodMode('range')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    selectedPeriodMode === 'range'
                      ? 'bg-white dark:bg-gray-700 text-brand-primary shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >
                  Cierre por Fecha Corte
                </button>
              </div>

              {selectedPeriodMode === 'month' ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Mes:</span>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-1.5 border rounded-xl dark:bg-gray-850 dark:border-gray-700 dark:text-white text-xs font-mono font-bold"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-850 p-2 rounded-xl border dark:border-gray-700">
                  <div className="flex items-center gap-1">
                    <span className="text-xxs font-bold text-gray-500">Desde:</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-2 py-1 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-xs font-mono"
                    />
                  </div>
                  <span className="text-xs text-gray-400">a</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xxs font-bold text-gray-500">Hasta:</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-2 py-1 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preset Buttons for Quick Cutoffs */}
          {selectedPeriodMode === 'range' && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xxs font-bold text-gray-400 uppercase tracking-wider">Atajos de Fecha Corte:</span>
              <button
                onClick={() => {
                  const now = new Date();
                  const y = now.getFullYear();
                  const m = String(now.getMonth() + 1).padStart(2, '0');
                  setStartDate(`${y}-${m}-01`);
                  setEndDate(`${y}-${m}-15`);
                }}
                className="px-2.5 py-1 text-xxs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                1 al 15 (Primera Quincena)
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  const y = now.getFullYear();
                  const m = String(now.getMonth() + 1).padStart(2, '0');
                  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
                  setStartDate(`${y}-${m}-16`);
                  setEndDate(`${y}-${m}-${lastDay}`);
                }}
                className="px-2.5 py-1 text-xxs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                16 a Fin de Mes
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  const y = now.getFullYear();
                  const m = String(now.getMonth() + 1).padStart(2, '0');
                  const d = String(now.getDate()).padStart(2, '0');
                  setStartDate(`${y}-${m}-01`);
                  setEndDate(`${y}-${m}-${d}`);
                }}
                className="px-2.5 py-1 text-xxs font-bold bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary rounded-lg transition-colors"
              >
                1 al {new Date().getDate()} (Cierre a hoy)
              </button>
            </div>
          )}

          {/* Tarjeta de Resumen de Nómina */}
          {!payrollLoading && payrollList.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-850 p-4 rounded-xl border dark:border-gray-700 flex justify-between items-center">
                <div>
                  <span className="text-xxs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Horas Acumuladas</span>
                  <div className="text-xl font-black text-gray-800 dark:text-white mt-1 font-mono">
                    {payrollList.reduce((sum, agent) => sum + Number(agent.total_hours || 0), 0).toFixed(1)} hrs
                  </div>
                </div>
                <Clock className="w-8 h-8 text-brand-primary/20" />
              </div>

              <div className="bg-amber-500/5 dark:bg-amber-500/10 p-4 rounded-xl border border-amber-500/25 flex justify-between items-center">
                <div>
                  <span className="text-xxs font-bold text-amber-600 dark:text-amber-450 uppercase tracking-wider">Meta de Horas Trial</span>
                  <div className="text-xl font-black text-amber-600 dark:text-amber-450 mt-1 font-mono">
                    {trialHoursTarget} hrs/promoción
                  </div>
                </div>
                <Award className="w-8 h-8 text-amber-500/20" />
              </div>

              <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/25 flex justify-between items-center">
                <div>
                  <span className="text-xxs font-bold text-emerald-600/70 dark:text-emerald-450 uppercase tracking-wider">Costo de Nómina Consolidado</span>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-450 mt-1 font-mono">
                    ${Math.round(payrollList.reduce((sum, agent) => sum + Number(agent.total_payment || 0), 0)).toLocaleString('es-CO')}
                  </div>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-500/20" />
              </div>
            </div>
          )}

          {/* Tabla de Nómina */}
          {payrollLoading ? (
            <div className="text-center py-12 text-gray-500">Cargando reportes de nómina...</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-750">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-850 text-gray-700 dark:text-gray-300 uppercase text-xxs font-bold tracking-wider border-b border-gray-100 dark:border-gray-750">
                    <th className="py-3 px-4">Asesor</th>
                    <th className="py-3 px-4 text-center">Progreso Trial</th>
                    <th className="py-3 px-4 text-center">Horas en Período</th>
                    <th className="py-3 px-4 text-center">Valor Hora</th>
                    <th className="py-3 px-4">Bonos Aplicados</th>
                    <th className="py-3 px-4 text-right">Total a Pagar</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-750">
                  {payrollList.map(agent => {
                    const isTrial = agent.role === 'trial';
                    const trialHist = agent.total_hist_trial || 0;
                    const trialPct = Math.min(100, (trialHist / trialHoursTarget) * 100);

                    return (
                      <tr
                        key={agent.agent_id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30 text-gray-900 dark:text-gray-100 transition-colors"
                      >
                        {/* Name / Info */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-gray-800 dark:text-gray-200">
                              {agent.fullname}
                              {isTrial && (
                                <span className="ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-450 px-1.5 py-0.5 rounded-full text-xxs font-extrabold uppercase">
                                  En Prueba
                                </span>
                              )}
                            </span>
                            <span className="text-xxs text-gray-500 font-mono mt-0.5">{agent.email}</span>
                            {isEsteban ? (
                              <select
                                value={agent.role}
                                onChange={(e) => handleUpdateAgentRole(agent.agent_id, e.target.value)}
                                className="mt-1 text-xxs font-bold uppercase bg-gray-50 dark:bg-gray-700 dark:text-white border dark:border-gray-600 rounded px-1 py-0.5 w-24 outline-none"
                              >
                                <option value="agent">Asesor</option>
                                <option value="trial">En Prueba</option>
                                <option value="supervisor">Supervisor</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : (
                              <span className="text-xxs font-bold text-brand-primary uppercase tracking-wider mt-1">{agent.role}</span>
                            )}
                            {isEsteban && (
                              <button
                                type="button"
                                onClick={() => handleTogglePayrollExclusion(agent.agent_id, !!agent.exclude_from_payroll)}
                                className={`mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded transition-all border ${
                                  agent.exclude_from_payroll
                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-emerald-500/10 hover:text-emerald-600'
                                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-red-500/10 hover:text-red-500'
                                }`}
                                title={agent.exclude_from_payroll ? "Haz clic para volver a contar el sueldo de esta persona" : "Haz clic para no contar el sueldo de esta persona en el reporte"}
                              >
                                {agent.exclude_from_payroll ? (
                                  <>🚫 Excluido de Nómina ($0)</>
                                ) : (
                                  <>💰 Contar en Nómina</>
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Progreso Trial */}
                        <td className="py-4 px-4 text-center">
                          {isTrial ? (
                            <div className="flex flex-col items-center gap-1 max-w-[120px] mx-auto">
                              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${trialPct}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono font-bold">
                                {trialHist.toFixed(1)} / {trialHoursTarget} hrs ({trialPct.toFixed(0)}%)
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xxs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                              <CheckCircle className="w-3 h-3" /> Graduado Agent
                            </span>
                          )}
                        </td>

                        {/* Hours */}
                        <td className="py-4 px-4 text-center font-mono font-bold">
                          <div className="flex flex-col items-center">
                            <span>{agent.total_hours.toFixed(1)} hrs</span>
                            {isTrial && agent.trial_hours !== undefined && (
                              <span className="text-[9px] text-gray-400 font-sans">
                                ({agent.trial_hours.toFixed(1)}h trial + {(agent.normal_hours || 0).toFixed(1)}h agent)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Rate */}
                        <td className="py-4 px-4 text-center font-mono text-xs">
                          {agent.exclude_from_payroll ? (
                            <span className="text-gray-400 italic text-[11px]">Sin Sueldo</span>
                          ) : (
                            `$${agent.hourly_rate.toLocaleString('es-CO')} / h`
                          )}
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
                          {agent.exclude_from_payroll ? (
                            <span className="text-gray-400 font-sans text-xs italic">
                              $0 <span className="text-[10px] bg-gray-200 dark:bg-gray-750 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded ml-1 font-bold">Excluido</span>
                            </span>
                          ) : (
                            `$${Math.round(agent.total_payment).toLocaleString('es-CO')}`
                          )}
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
                          <div className="flex flex-col gap-1.5 items-center min-w-[130px]">
                            {isAdminOrSupervisor && (
                              <button
                                type="button"
                                onClick={() => handleTogglePayrollExclusion(agent.agent_id, !!agent.exclude_from_payroll)}
                                className={`w-full flex items-center justify-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all border ${
                                  agent.exclude_from_payroll
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                                    : 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50 hover:bg-red-500/10 hover:text-red-500'
                                }`}
                                title={agent.exclude_from_payroll ? "Haz clic para volver a contar el sueldo de esta persona" : "Haz clic para no contar el sueldo de esta persona en el reporte"}
                              >
                                {agent.exclude_from_payroll ? (
                                  <>💰 Incluir en Nómina</>
                                ) : (
                                  <>🚫 Excluir de Nómina ($0)</>
                                )}
                              </button>
                            )}

                            {agent.status !== 'paid' ? (
                              <button
                                onClick={() => handleClosePayroll(agent)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xxs px-2.5 py-1.5 rounded-lg transition-all"
                              >
                                Cerrar Nómina
                              </button>
                            ) : (
                              <span className="text-xxs text-gray-400 italic flex items-center justify-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-500" /> Archivado
                              </span>
                            )}

                            <button
                              onClick={() => handleOpenStubModal(agent)}
                              className="flex items-center gap-1 text-xxs font-bold text-brand-primary hover:underline mt-0.5"
                            >
                              <FileText className="w-3 h-3" /> Ver Desprendible
                            </button>
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
              <>
                <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
                  {editingSlots.length === 0 ? (
                    <div className="text-center py-8 border border-dashed dark:border-gray-700 rounded-xl text-gray-400 dark:text-gray-500 italic text-sm">
                      Sin turnos asignados (Día libre)
                    </div>
                  ) : (
                    editingSlots.map((slot, index) => {
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
                              className="px-2 py-1 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white bg-transparent"
                            />
                            <span className="text-xs text-gray-400">a</span>
                            <input
                              type="time"
                              value={slot.end_time}
                              onChange={(e) => handleSlotChange(index, 'end_time', e.target.value)}
                              className="px-2 py-1 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white bg-transparent"
                            />

                            <span className="text-xxs font-bold text-brand-primary bg-brand-primary/5 px-2 py-1 rounded ml-auto">
                              {calculateSlotHours(slot).toFixed(1)} hrs netas
                            </span>
                          </div>

                          {/* Tipo de Break */}
                          <div className="flex items-center gap-3 w-full">
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 min-w-[50px]">Descanso:</span>
                            {(() => {
                              const [sh, sm] = slot.start_time.split(':').map(Number);
                              const [eh, em] = slot.end_time.split(':').map(Number);
                              const durationHours = (eh * 60 + em - (sh * 60 + sm)) / 60;
                              const needsBreak = durationHours >= 4;
                              
                              if (!needsBreak) {
                                return (
                                  <span className="text-xxs text-gray-450 italic">
                                    No requiere descanso (turno menor a 4 horas)
                                  </span>
                                );
                              }
                              
                              return (
                                <>
                                  <select
                                    value={slot.break_type || 'none'}
                                    onChange={(e) => handleSlotChange(index, 'break_type', e.target.value)}
                                    className="px-2 py-1 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white bg-transparent"
                                  >
                                    {durationHours < 5 && <option value="none">Sin descanso</option>}
                                    <option value="break_30">Break (30 min)</option>
                                    <option value="lunch_60">Almuerzo (1 hora)</option>
                                  </select>

                                  {/* Inicio del Break */}
                                  {slot.break_type && slot.break_type !== 'none' && (
                                    <div className="flex items-center gap-1.5 animate-fadeIn">
                                      <span className="text-xxs font-bold text-gray-500">Hora:</span>
                                      <input
                                        type="time"
                                        value={slot.break_start || ''}
                                        onChange={(e) => handleSlotChange(index, 'break_start', e.target.value)}
                                        className="px-2 py-1 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white bg-transparent"
                                      />
                                    </div>
                                  )}
                                </>
                              );
                            })()}

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

                {/* Quick Replicate Bar */}
                {editingSlots.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl flex flex-col gap-2 animate-fadeIn">
                    <span className="text-xxs font-extrabold uppercase text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" /> Copiar / Replicar Franjas Rápido:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleReplicateCurrentSlotsToWeek('workdays')}
                        disabled={modalLoading || modalSaving}
                        className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xxs px-2.5 py-1.5 rounded-lg shadow-sm transition-all disabled:opacity-50"
                        title="Copiar estas franjas a Lunes, Martes, Miércoles, Jueves y Viernes"
                      >
                        <Zap className="w-3 h-3" /> Replicar a Lunes - Viernes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReplicateCurrentSlotsToWeek('all')}
                        disabled={modalLoading || modalSaving}
                        className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xxs px-2.5 py-1.5 rounded-lg shadow-sm transition-all disabled:opacity-50"
                        title="Copiar estas franjas a los 7 días de la semana"
                      >
                        <Copy className="w-3 h-3" /> Replicar a Toda la Semana (Lun-Dom)
                      </button>
                    </div>
                  </div>
                )}
              </>
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

      {/* Pay Stub Modal (Desprendible de Pago) */}
      {stubModalOpen && selectedStubAgent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-850 rounded-2xl max-w-2xl w-full border dark:border-gray-700 shadow-2xl p-6 relative print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
            <button
              onClick={() => { setStubModalOpen(false); setSelectedStubAgent(null); }}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-150 dark:hover:bg-gray-700 rounded-lg text-gray-400 dark:text-gray-300 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header del Desprendible */}
            <div className="border-b dark:border-gray-700 pb-4 mb-4 text-center print:border-b-2 print:border-black">
              <div className="flex justify-center items-center gap-2 mb-1">
                <span className="text-xl font-black text-brand-primary tracking-wider uppercase">SHEERIT PLATFORM</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white uppercase tracking-wide">
                COMPROBANTE Y DESPRENDIBLE DE NÓMINA
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Liquidación de Servicios de Soporte al Cliente
              </p>
            </div>

            {/* Datos del Asesor y Período */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl mb-4 border dark:border-gray-700 text-xs print:bg-gray-100 print:text-black">
              <div>
                <span className="text-xxs font-bold text-gray-400 uppercase">Colaborador / Asesor:</span>
                <p className="font-bold text-gray-800 dark:text-white text-sm">{selectedStubAgent.fullname}</p>
                <p className="text-gray-500 font-mono text-xxs">{selectedStubAgent.email}</p>
              </div>
              <div>
                <span className="text-xxs font-bold text-gray-400 uppercase">Período de Liquidación:</span>
                <p className="font-bold text-brand-primary text-sm">
                  {selectedStubAgent.start_date && selectedStubAgent.end_date
                    ? `Del ${selectedStubAgent.start_date} al ${selectedStubAgent.end_date}`
                    : `Mes ${selectedMonth}`}
                </p>
                <p className="text-xxs font-extrabold uppercase mt-0.5 text-amber-600 dark:text-amber-450">
                  Rol: {selectedStubAgent.role}
                </p>
              </div>
            </div>

            {/* Desglose de Conceptos */}
            <div className="border rounded-xl overflow-hidden mb-4 dark:border-gray-700 print:border-black">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase text-xxs font-bold tracking-wider border-b dark:border-gray-700">
                    <th className="py-2.5 px-4">Concepto</th>
                    <th className="py-2.5 px-4 text-center">Horas</th>
                    <th className="py-2.5 px-4 text-center">Tarifa Unit.</th>
                    <th className="py-2.5 px-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-750 font-mono">
                  {/* Trial Hours row if trial hours exist */}
                  {(selectedStubAgent.trial_hours || 0) > 0 && (
                    <tr>
                      <td className="py-3 px-4 font-sans font-semibold">Horas de Prueba (Trial)</td>
                      <td className="py-3 px-4 text-center">{selectedStubAgent.trial_hours?.toFixed(1)} hrs</td>
                      <td className="py-3 px-4 text-center">${(selectedStubAgent.trial_hourly_rate || 5000).toLocaleString('es-CO')}</td>
                      <td className="py-3 px-4 text-right font-bold">
                        ${Math.round((selectedStubAgent.trial_hours || 0) * (selectedStubAgent.trial_hourly_rate || 5000)).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  )}

                  {/* Normal Agent Hours row */}
                  {(selectedStubAgent.normal_hours || selectedStubAgent.total_hours) > 0 && (
                    <tr>
                      <td className="py-3 px-4 font-sans font-semibold">Horas Asesor Regular (Agent)</td>
                      <td className="py-3 px-4 text-center">{(selectedStubAgent.normal_hours || selectedStubAgent.total_hours).toFixed(1)} hrs</td>
                      <td className="py-3 px-4 text-center">${selectedStubAgent.hourly_rate.toLocaleString('es-CO')}</td>
                      <td className="py-3 px-4 text-right font-bold">
                        ${Math.round((selectedStubAgent.normal_hours || selectedStubAgent.total_hours) * selectedStubAgent.hourly_rate).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  )}

                  {/* Bonuses rows */}
                  {selectedStubAgent.bonuses && selectedStubAgent.bonuses.length > 0 && (
                    selectedStubAgent.bonuses.map(b => (
                      <tr key={b.id} className="bg-emerald-50/20 dark:bg-emerald-950/10">
                        <td className="py-2 px-4 font-sans text-emerald-700 dark:text-emerald-300">
                          Bono: {b.reason}
                        </td>
                        <td className="py-2 px-4 text-center text-gray-400">-</td>
                        <td className="py-2 px-4 text-center text-gray-400">-</td>
                        <td className="py-2 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          +${parseFloat(b.amount as any).toLocaleString('es-CO')}
                        </td>
                      </tr>
                    ))
                  )}

                  {/* Total Row */}
                  <tr className="bg-gray-50 dark:bg-gray-800 text-sm font-bold border-t-2 dark:border-gray-700">
                    <td colSpan={3} className="py-3 px-4 text-right font-sans uppercase">Total Neto a Pagar:</td>
                    <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-mono text-base">
                      ${Math.round(selectedStubAgent.total_payment).toLocaleString('es-CO')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Note / Status */}
            <div className="flex justify-between items-center text-xxs text-gray-400 mb-6 print:mb-2">
              <span className="font-mono">Estado: {selectedStubAgent.status === 'paid' ? 'ARCHIVADO / CERRADO' : 'BORRADOR DE LIQUIDACIÓN'}</span>
              <span>Generado automáticamente por Sheerit Platform</span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 print:hidden pt-4 border-t dark:border-gray-700">
              <button
                type="button"
                onClick={() => { setStubModalOpen(false); setSelectedStubAgent(null); }}
                className="px-4 py-2 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handlePrintStub}
                className="bg-brand-primary hover:bg-brand-dark text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center transition-all"
              >
                <Printer className="w-4 h-4 mr-1.5" /> Imprimir / Guardar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payroll History Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-850 rounded-2xl max-w-4xl w-full border dark:border-gray-700 shadow-2xl p-6 relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setHistoryModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-150 dark:hover:bg-gray-700 rounded-lg text-gray-400 dark:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
              <History className="text-brand-primary" /> Historial de Nóminas Archivadas y Desprendibles
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Consulta todas las liquidaciones y cierres de nómina efectuados anteriormente.
            </p>

            {historyLoading ? (
              <div className="text-center py-12 text-gray-500">Cargando historial de desprendibles...</div>
            ) : payrollHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-400 italic">No hay cierres de nómina archivados aún.</div>
            ) : (
              <div className="overflow-y-auto flex-1 border rounded-xl dark:border-gray-750">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase text-xxs font-bold tracking-wider border-b dark:border-gray-750 sticky top-0">
                      <th className="py-3 px-4">Asesor</th>
                      <th className="py-3 px-4">Período / Rango</th>
                      <th className="py-3 px-4 text-center">Horas Pagadas</th>
                      <th className="py-3 px-4 text-right">Total Liquidado</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-750 font-mono">
                    {payrollHistory.map(rec => (
                      <tr key={rec.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750/30">
                        <td className="py-3 px-4 font-sans">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800 dark:text-gray-200">{rec.fullname}</span>
                            <span className="text-xxs text-gray-400 font-mono">{rec.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <span className="font-semibold text-brand-primary">
                            {rec.start_date && rec.end_date ? `${rec.start_date} al ${rec.end_date}` : rec.payroll_month}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          {Number(rec.total_hours).toFixed(1)} hrs
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          ${Math.round(Number(rec.total_payment)).toLocaleString('es-CO')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedStubAgent({
                                agent_id: rec.agent_id,
                                fullname: rec.fullname,
                                email: rec.email,
                                role: rec.current_role || 'agent',
                                start_date: rec.start_date,
                                end_date: rec.end_date,
                                total_hours: Number(rec.total_hours),
                                trial_hours: Number(rec.trial_hours || 0),
                                normal_hours: Number(rec.normal_hours || rec.total_hours),
                                hourly_rate: Number(rec.hourly_rate),
                                bonuses: [],
                                total_bonuses: Number(rec.total_bonuses),
                                total_payment: Number(rec.total_payment),
                                status: 'paid'
                              });
                              setStubModalOpen(true);
                            }}
                            className="flex items-center gap-1 mx-auto text-xxs font-bold text-brand-primary hover:underline bg-brand-primary/10 px-2 py-1 rounded-lg"
                          >
                            <FileText className="w-3 h-3" /> Ver Desprendible
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end mt-4 pt-3 border-t dark:border-gray-700">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
