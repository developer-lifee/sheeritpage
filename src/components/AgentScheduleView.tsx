import React, { useState, useEffect } from 'react';
import { Clock, User, Plus, Trash2, Save, RefreshCw, AlertTriangle, CheckCircle, Calendar, Users, X, ChevronLeft, ChevronRight, Lock, DollarSign, Gift, Settings, ShieldAlert, FileText, Printer, Award, History, Copy, Zap, Info, Unlock } from 'lucide-react';

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
  contract_status?: string;
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

const sanitizeTimeForInput = (t?: string) => {
  if (!t) return '';
  if (t === '24:00') return '23:59';
  return t;
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
  const isAdminOrSupervisor = isEsteban || role === 'admin' || role === 'supervisor';

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
  const [whatsappContactNumber, setWhatsappContactNumber] = useState<string>('573118587974');
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

  // Agent Employee Management Modal State
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [agentForm, setAgentForm] = useState({
    id: undefined as number | undefined,
    fullname: '',
    email: '',
    password: '',
    role: 'agent',
    status: 'active',
    exclude_from_payroll: false
  });
  const [agentFormSaving, setAgentFormSaving] = useState(false);
  const [agentFormError, setAgentFormError] = useState('');

  const handleSaveAgentForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentForm.fullname || !agentForm.email) {
      setAgentFormError('Nombre completo y correo son obligatorios.');
      return;
    }
    setAgentFormSaving(true);
    setAgentFormError('');

    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/agents/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: agentForm.id,
          fullname: agentForm.fullname,
          email: agentForm.email,
          password: agentForm.password,
          role: agentForm.role,
          status: agentForm.status,
          exclude_from_payroll: agentForm.exclude_from_payroll
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message || 'Empleado guardado correctamente.');
        setAgentModalOpen(false);
        setAgentForm({ id: undefined, fullname: '', email: '', password: '', role: 'agent', status: 'active', exclude_from_payroll: false });
        fetchData();
        fetchPayroll();
      } else {
        setAgentFormError(data.message || data.error || 'Error al guardar el empleado.');
      }
    } catch (err: any) {
      setAgentFormError(err.message || 'Error de conexión');
    } finally {
      setAgentFormSaving(false);
    }
  };

  const handleTerminateAgent = async (agent: { id: number; fullname: string; email?: string; status?: string }) => {
    const existingAgent = agents.find(a => a.id === agent.id);
    const currentStatus = existingAgent?.status || agent.status || 'active';
    const isTerminated = currentStatus === 'inactive';
    const promptLabel = isTerminated
      ? `Motivo o nota para reactivar el contrato de ${agent.fullname}:`
      : `Ingresa el motivo o descripción de la terminación de contrato para ${agent.fullname}:`;
    
    const defaultReason = isTerminated ? 'Reactivación de contrato laboral' : 'Fin de período de servicio / contrato';
    const reasonInput = window.prompt(promptLabel, defaultReason);
    
    if (reasonInput === null) return;

    try {
      const apiUrl = getApiUrl();
      const newStatus = isTerminated ? 'active' : 'inactive';
      const res = await fetch(`${apiUrl}/api/admin/agents/terminate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agent.id,
          status: newStatus,
          reason: reasonInput,
          performed_by: agentEmail || 'admin'
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message);
        fetchData();
        fetchPayroll();
      } else {
        setError(data.message || 'Error al actualizar el contrato.');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    }
  };

  // Contract History Modal States
  const [contractHistoryModalOpen, setContractHistoryModalOpen] = useState(false);
  const [contractHistoryAgent, setContractHistoryAgent] = useState<Agent | null>(null);
  const [contractHistoryList, setContractHistoryList] = useState<any[]>([]);
  const [contractHistoryLoading, setContractHistoryLoading] = useState(false);

  const handleOpenContractHistory = async (agent: { id: number; fullname: string; email?: string }) => {
    setContractHistoryAgent(agent as Agent);
    setContractHistoryModalOpen(true);
    setContractHistoryLoading(true);

    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/admin/agents/${agent.id}/contract-history`);
      const data = await res.json();
      if (data.success) {
        setContractHistoryList(data.history || []);
      } else {
        setContractHistoryList([]);
      }
    } catch (err) {
      console.error("Error cargando historial de contrato:", err);
      setContractHistoryList([]);
    } finally {
      setContractHistoryLoading(false);
    }
  };
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);
  const [payrollHistory, setPayrollHistory] = useState<PayrollHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // Drag & Drop + Copy/Paste States
  const [selectedCell, setSelectedCell] = useState<{ email: string; dayValue: number; dayLabel: string } | null>(null);
  const [copiedSlots, setCopiedSlots] = useState<{ slots: ScheduleSlot[]; sourceName: string; sourceDayLabel: string } | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [draggedSlotsData, setDraggedSlotsData] = useState<{ slots: ScheduleSlot[]; sourceEmail: string; sourceDay: number } | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ email: string; dayValue: number } | null>(null);

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
        setWhatsappContactNumber(data.whatsapp_contact_number || '573118587974');
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
        setPayrollList(Array.isArray(data.payroll) ? data.payroll : []);
      } else {
        setPayrollList([]);
        setError(data.message || 'Error al cargar los datos de nómina.');
      }
    } catch (err) {
      console.error('Error fetching payroll:', err);
      setPayrollList([]);
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
        setPayrollHistory(Array.isArray(data.history) ? data.history : []);
      } else {
        setPayrollHistory([]);
      }
    } catch (err) {
      console.error('Error fetching payroll history:', err);
      setPayrollHistory([]);
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
        shift_end_limit: shiftEndLimit,
        whatsapp_contact_number: whatsappContactNumber
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
    let sDate = startDate;
    let eDate = endDate;
    if (selectedPeriodMode === 'month') {
      const [yr, mo] = selectedMonth.split('-').map(Number);
      const lastDay = new Date(yr, mo, 0).getDate();
      sDate = `${selectedMonth}-01`;
      eDate = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
    }

    const periodDesc = selectedPeriodMode === 'range' ? `período ${sDate} al ${eDate}` : `mes ${selectedMonth}`;
    if (!window.confirm(`¿Seguro de cerrar/pagar la nómina de ${agent.fullname} para el ${periodDesc}? Esto archivará las horas pagadas y generará el desprendible.`)) return;
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/payroll/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: agent.email,
          payroll_month: selectedMonth,
          start_date: sDate,
          end_date: eDate,
          total_hours: agent.total_hours,
          trial_hours: agent.trial_hours || 0,
          normal_hours: agent.normal_hours || agent.total_hours,
          hourly_rate: agent.hourly_rate,
          total_bonuses: agent.total_bonuses,
          total_payment: agent.total_payment,
          period_label: `Período ${sDate} al ${eDate}`,
          status: 'paid'
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message || 'Nómina cerrada correctamente.');
        alert(`✅ ${data.message || 'Nómina archivada y cerrada correctamente.'}`);
        fetchPayrollData();
      } else {
        alert(`❌ Error al cerrar nómina: ${data.message || data.error || 'Ocurrió un problema en el servidor.'}`);
      }
    } catch (err: any) {
      console.error('Error closing payroll:', err);
      alert(`❌ Error de conexión al cerrar nómina: ${err.message || 'Error inesperado'}`);
    }
  };

  // Re-open / Cancel Closed Payroll (Admin Only)
  const handleReopenPayroll = async (agent: PayrollAgent) => {
    let sDate = startDate;
    let eDate = endDate;
    if (selectedPeriodMode === 'month') {
      const [yr, mo] = selectedMonth.split('-').map(Number);
      const lastDay = new Date(yr, mo, 0).getDate();
      sDate = `${selectedMonth}-01`;
      eDate = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
    }

    if (!window.confirm(`¿Seguro de reabrir la nómina de ${agent.fullname}? Esto cambiará su estado a BORRADOR para que puedas corregir horas, bonos o estatus.`)) return;
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/api/admin/payroll/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agent.agent_id,
          payroll_month: selectedMonth,
          start_date: sDate,
          end_date: eDate
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.message || 'Nómina reabierta correctamente.');
        alert(`🔓 ${data.message || 'Nómina reabierta correctamente.'}`);
        fetchPayrollData();
      } else {
        alert(`❌ Error al reabrir nómina: ${data.message || data.error}`);
      }
    } catch (err: any) {
      console.error('Error reopening payroll:', err);
      alert(`❌ Error de conexión al reabrir nómina: ${err.message}`);
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

  const executePasteSlots = async (
    targetEmail: string,
    targetDayValue: number,
    slotsToPaste: ScheduleSlot[],
    agentNameLabel: string,
    dayLabel: string
  ) => {
    const apiUrl = getApiUrl();
    const weekStart = getWeekStartParam();
    
    try {
      const resSchedule = await fetch(`${apiUrl}/api/admin/agents/schedule?email=${encodeURIComponent(targetEmail)}&week_start=${weekStart}`);
      const dataSchedule = await resSchedule.json();
      
      let fullSchedule: ScheduleSlot[] = [];
      if (dataSchedule.success && Array.isArray(dataSchedule.schedule)) {
        fullSchedule = dataSchedule.schedule
          .filter((s: any) => s.day_of_week !== targetDayValue)
          .map((s: any) => ({
            day_of_week: s.day_of_week,
            start_time: s.start_time.substring(0, 5),
            end_time: s.end_time.substring(0, 5),
            break_type: s.break_type || 'none',
            break_start: s.break_start ? s.break_start.substring(0, 5) : ''
          }));
      }

      const cleanSlots = slotsToPaste.map(s => ({
        day_of_week: targetDayValue,
        start_time: s.start_time.substring(0, 5),
        end_time: s.end_time.substring(0, 5),
        break_type: s.break_type || 'none',
        break_start: s.break_start ? s.break_start.substring(0, 5) : ''
      }));

      const mergedSchedule = [...fullSchedule, ...cleanSlots];

      const resSave = await fetch(`${apiUrl}/api/admin/agents/schedule/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          schedule: mergedSchedule,
          week_start: weekStart,
          requester_email: agentEmail,
          day_of_week: targetDayValue
        })
      });
      
      const dataSave = await resSave.json();
      if (dataSave.success) {
        setCopyToast(`⚡ ¡Franja pegada con éxito en ${dayLabel} para ${agentNameLabel}!`);
        setTimeout(() => setCopyToast(null), 3500);
        fetchAllSchedules();
        fetchPayrollData();
      } else {
        alert(dataSave.message || 'Error al pegar franja.');
      }
    } catch (err: any) {
      console.error('Error pasting slot:', err);
      alert('Error de conexión al pegar la franja.');
    }
  };

  // Keyboard Copy (Ctrl+C / Cmd+C) & Paste (Ctrl+V / Cmd+V) Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      
      // Ctrl+C / Cmd+C
      if (isCmdOrCtrl && e.key.toLowerCase() === 'c') {
        if (selectedCell) {
          const slots = getAgentSlotsForDay(selectedCell.email, selectedCell.dayValue);
          if (slots.length > 0) {
            const agentObj = agents.find(a => a.email.toLowerCase() === selectedCell.email.toLowerCase());
            const agentName = agentObj ? agentObj.fullname : selectedCell.email;
            setCopiedSlots({
              slots,
              sourceName: agentName,
              sourceDayLabel: selectedCell.dayLabel
            });
            setCopyToast(`📋 Franja de ${selectedCell.dayLabel} (${slots.map(s => `${s.start_time.substring(0, 5)}-${s.end_time.substring(0, 5)}`).join(', ')}) copiada. Selecciona otro día y presiona Ctrl+V.`);
            setTimeout(() => setCopyToast(null), 4000);
          } else {
            setCopyToast(`⚠️ El día ${selectedCell.dayLabel} está libre. No hay franjas para copiar.`);
            setTimeout(() => setCopyToast(null), 3000);
          }
        }
      }
      
      // Ctrl+V / Cmd+V
      if (isCmdOrCtrl && e.key.toLowerCase() === 'v') {
        if (selectedCell && copiedSlots) {
          const targetAgent = agents.find(a => a.email.toLowerCase() === selectedCell.email.toLowerCase());
          const isEditable = role === 'admin' || selectedCell.email.toLowerCase() === agentEmail.toLowerCase();
          if (isEditable && targetAgent) {
            executePasteSlots(selectedCell.email, selectedCell.dayValue, copiedSlots.slots, targetAgent.fullname, selectedCell.dayLabel);
          } else if (!isEditable) {
            setCopyToast('⚠️ Solo puedes modificar tu propio horario.');
            setTimeout(() => setCopyToast(null), 3000);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, copiedSlots, agents, role, agentEmail]);

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
          {/* VISTA CALENDARIO - BARRA SUPERIOR FIJA (STICKY) */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4 sticky top-0 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md pb-3 pt-2 border-b dark:border-gray-700 -mx-6 px-6 transition-all shadow-xs">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold flex items-center dark:text-white">
                <Calendar className="mr-2 text-brand-primary" /> Horarios de Trabajo de Asesores
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">
                Revisa y agenda las franjas horarias y almuerzos. Haz clic o arrastra celdas para modificar horarios.
              </p>
            </div>

            {/* Paginador de semanas STICKY y RESPONSIVO */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-gray-50 dark:bg-gray-850 p-2 rounded-2xl border dark:border-gray-700 w-full lg:w-auto shadow-xs">
              <div className="flex items-center justify-between gap-1 w-full sm:w-auto flex-grow">
                <button
                  onClick={handlePrevWeek}
                  className="p-2 hover:bg-white dark:hover:bg-gray-750 rounded-xl transition-all dark:text-gray-300 border dark:border-gray-700 sm:border-0"
                  title="Semana anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="text-xs font-black text-gray-800 dark:text-gray-100 px-2 min-w-[160px] text-center font-sans tracking-tight">
                  {getFormattedWeekLabel()}
                </span>

                <button
                  onClick={handleNextWeek}
                  className="p-2 hover:bg-white dark:hover:bg-gray-750 rounded-xl transition-all dark:text-gray-300 border dark:border-gray-700 sm:border-0"
                  title="Semana siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="hidden sm:block h-5 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1"></div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  onClick={handleCurrentWeek}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all text-center ${
                    !isTemplateMode && formatDateYMD(currentWeekDate) === formatDateYMD(getMondayOfDate(new Date()))
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'bg-white dark:bg-gray-750 text-gray-700 dark:text-gray-300 border dark:border-gray-700'
                  }`}
                >
                  Esta Semana
                </button>
                
                <button
                  onClick={handleTemplateMode}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all text-center ${
                    isTemplateMode
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'bg-white dark:bg-gray-750 text-gray-700 dark:text-gray-300 border dark:border-gray-700'
                  }`}
                  title="Editar la plantilla base recurrente"
                >
                  Plantilla Base
                </button>

                {/* Crear empleado trasladado a Nómina de Pagos */}
              </div>
            </div>
          </div>

          {/* Banner de Rango Permitido */}
          <div className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-xl p-3 flex items-center justify-between gap-2 text-xs font-bold mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-primary flex-shrink-0" />
              <span>📌 Franja laboral permitida para asignación de turnos: <strong className="font-mono bg-brand-primary/15 px-1.5 py-0.5 rounded">{shiftStartLimit}</strong> a <strong className="font-mono bg-brand-primary/15 px-1.5 py-0.5 rounded">{shiftEndLimit}</strong>.</span>
            </div>
            <span className="text-[11px] text-gray-500 font-normal hidden md:inline">
              (Máximo {maxHoursLimit.toFixed(1)}h netas diarias)
            </span>
          </div>

          {/* Toast & Toolbar de Arrastre / Copiar / Pegar */}
          {copyToast && (
            <div className="bg-emerald-600 text-white font-bold text-xs p-3 rounded-xl mb-4 shadow-lg flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-300 animate-bounce" />
                <span>{copyToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setCopyToast(null)}
                className="text-white/80 hover:text-white font-mono text-xs ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {selectedCell && (
            <div className="bg-brand-primary/10 border border-brand-primary/30 p-2.5 rounded-xl mb-4 flex flex-wrap items-center justify-between gap-2 text-xs animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-brand-primary">
                <Calendar className="w-4 h-4" />
                <span>Celda seleccionada: <strong>{selectedCell.dayLabel}</strong> ({agents.find(a => a.email.toLowerCase() === selectedCell.email.toLowerCase())?.fullname || selectedCell.email})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const slots = getAgentSlotsForDay(selectedCell.email, selectedCell.dayValue);
                    if (slots.length > 0) {
                      const agentObj = agents.find(a => a.email.toLowerCase() === selectedCell.email.toLowerCase());
                      setCopiedSlots({
                        slots,
                        sourceName: agentObj ? agentObj.fullname : selectedCell.email,
                        sourceDayLabel: selectedCell.dayLabel
                      });
                      setCopyToast(`📋 Franja de ${selectedCell.dayLabel} copiada. Selecciona otro día y presiona Ctrl+V o pulsa "Pegar Franja"`);
                    } else {
                      setCopyToast(`⚠️ El día ${selectedCell.dayLabel} no tiene turnos.`);
                    }
                  }}
                  className="bg-brand-primary text-white font-bold px-2.5 py-1 rounded-lg hover:bg-brand-dark transition-all flex items-center gap-1 text-xxs active:scale-95 shadow-sm"
                >
                  <Copy className="w-3 h-3" /> Copiar Franja (Ctrl+C)
                </button>
                {copiedSlots && (
                  <button
                    type="button"
                    onClick={() => {
                      const targetAgent = agents.find(a => a.email.toLowerCase() === selectedCell.email.toLowerCase());
                      if (targetAgent) {
                        executePasteSlots(selectedCell.email, selectedCell.dayValue, copiedSlots.slots, targetAgent.fullname, selectedCell.dayLabel);
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 text-xxs active:scale-95 shadow-sm"
                  >
                    <Zap className="w-3 h-3" /> Pegar Franja Copiada (Ctrl+V)
                  </button>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 font-light">
              Cargando cuadrante de colaboradores...
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW (md:block) */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-750">
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
                              <div className="flex items-center gap-2">
                                <span className="font-bold flex items-center gap-1.5 text-xs text-gray-800 dark:text-gray-200">
                                  <User className="w-3.5 h-3.5 text-gray-400" />
                                  {agent.fullname}
                                  {!isEditableRow && <Lock className="w-3 h-3 text-gray-400" title="Solo lectura" />}
                                </span>
                                {role === 'admin' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAgentForm({
                                        id: agent.id,
                                        fullname: agent.fullname,
                                        email: agent.email,
                                        password: '',
                                        role: agent.role,
                                        status: agent.status || 'active',
                                        exclude_from_payroll: !!agent.exclude_from_payroll
                                      });
                                      setAgentFormError('');
                                      setAgentModalOpen(true);
                                    }}
                                    className="text-xxs text-brand-primary hover:underline font-bold"
                                    title="Editar datos / Contraseña"
                                  >
                                    ✏️ Editar
                                  </button>
                                )}
                              </div>
                              <span className="text-xxs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">{agent.email}</span>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="text-xxs font-extrabold text-brand-primary uppercase tracking-wider">{agent.role}</span>
                                {agent.status === 'inactive' ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-red-700 dark:text-red-300 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                                    🔴 Contrato Terminado / Inactivo
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                    🟢 Activo
                                  </span>
                                )}
                                {agent.exclude_from_payroll && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                    🚫 Sueldo Excluido
                                  </span>
                                )}
                              </div>
                              {/* Terminar Contrato y Historial se trasladaron a la vista de Nómina y Pagos */}
                            </div>
                          </td>

                          {/* Week Days */}
                          {DAYS_OF_WEEK.map(day => {
                            const slots = getAgentSlotsForDay(agent.email, day.value);
                            const isSelected = selectedCell?.email.toLowerCase() === agent.email.toLowerCase() && selectedCell?.dayValue === day.value;
                            const isDragOver = dragOverCell?.email.toLowerCase() === agent.email.toLowerCase() && dragOverCell?.dayValue === day.value;

                            return (
                              <td
                                key={day.value}
                                onClick={() => {
                                  setSelectedCell({ email: agent.email, dayValue: day.value, dayLabel: day.label });
                                }}
                                onDoubleClick={() => handleCellClick(agent, day)}
                                onDragOver={(e) => {
                                  if (isEditableRow) {
                                    e.preventDefault();
                                    setDragOverCell({ email: agent.email, dayValue: day.value });
                                  }
                                }}
                                onDragLeave={() => setDragOverCell(null)}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  setDragOverCell(null);
                                  if (isEditableRow && draggedSlotsData) {
                                    executePasteSlots(agent.email, day.value, draggedSlotsData.slots, agent.fullname, day.label);
                                  }
                                }}
                                className={`py-3 px-2 text-center align-middle transition-all relative ${
                                  isDragOver
                                    ? 'bg-emerald-500/20 border-2 border-dashed border-emerald-500 scale-102 shadow-lg'
                                    : isSelected
                                    ? 'ring-2 ring-brand-primary bg-brand-primary/10'
                                    : isEditableRow
                                    ? 'cursor-pointer hover:bg-brand-primary/5 dark:hover:bg-brand-primary/10'
                                    : 'cursor-not-allowed opacity-90'
                                }`}
                                title={isEditableRow ? "Un toque: Seleccionar (Ctrl+C / Ctrl+V) | Arrastrar franja | Doble clic: Editar" : "Solo lectura"}
                              >
                                {isDragOver ? (
                                  <div className="text-emerald-700 dark:text-emerald-300 font-bold text-xxs flex flex-col items-center gap-0.5 animate-pulse">
                                    <Zap className="w-4 h-4 text-emerald-500" />
                                    <span>Soltar aquí</span>
                                  </div>
                                ) : slots.length === 0 ? (
                                  <span className="text-gray-350 dark:text-gray-600 italic text-xxs font-light hover:text-brand-primary">
                                    {isEditableRow ? '+ Libre' : 'Libre'}
                                  </span>
                                ) : (
                                  <div className="flex flex-col gap-1 items-center">
                                    {slots.map((s: any, idx: number) => (
                                      <span
                                        key={idx}
                                        draggable={isEditableRow}
                                        onDragStart={(e) => {
                                          e.stopPropagation();
                                          e.dataTransfer.setData('text/plain', JSON.stringify(slots));
                                          setDraggedSlotsData({ slots, sourceEmail: agent.email, sourceDay: day.value });
                                        }}
                                        className="inline-flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-xxs font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20 dark:bg-brand-primary/20 dark:text-brand-light font-mono min-w-[90px] cursor-grab active:cursor-grabbing hover:shadow-md transition-all"
                                        title="Mantén presionado y arrastra para copiar a otro día"
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

              {/* MOBILE CARDS VIEW (block md:hidden) */}
              <div className="block md:hidden space-y-4">
                {agents.map(agent => {
                  const agentSlots = allSchedules.filter((s: any) => s.email.toLowerCase() === agent.email.toLowerCase());
                  const totalWeeklyHours = agentSlots.reduce((acc, slot) => acc + calculateSlotHours(slot), 0);
                  const isEditableRow = role === 'admin' || agent.email.toLowerCase() === agentEmail.toLowerCase();
                  const estimatedPay = totalWeeklyHours * hourlyRate;

                  return (
                    <div
                      key={agent.id}
                      className="bg-white dark:bg-gray-850 p-4 rounded-2xl border dark:border-gray-750 shadow-sm flex flex-col gap-3"
                    >
                      {/* Agent Header */}
                      <div className="flex justify-between items-start border-b dark:border-gray-750 pb-3">
                        <div className="flex flex-col">
                          <span className="font-bold flex items-center gap-1.5 text-sm text-gray-900 dark:text-white">
                            <User className="w-4 h-4 text-brand-primary" />
                            {agent.fullname}
                            {!isEditableRow && <Lock className="w-3.5 h-3.5 text-gray-400" title="Solo lectura" />}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">{agent.email}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-extrabold text-brand-primary uppercase tracking-wider bg-brand-primary/10 px-2 py-0.5 rounded-md">
                              {agent.role}
                            </span>
                            {agent.exclude_from_payroll && (
                              <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                🚫 Sueldo Excluido
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Totals */}
                        <div className="flex flex-col items-end text-right">
                          <span className="text-xs font-black text-brand-primary font-mono bg-brand-primary/10 px-2.5 py-1 rounded-xl">
                            {totalWeeklyHours.toFixed(1)} / {(agent.max_weekly_hours || 40).toFixed(0)}h
                          </span>
                          <span className="text-xxs text-gray-500 dark:text-gray-400 font-sans mt-1">
                            {agent.exclude_from_payroll ? (
                              <span className="text-gray-400 font-bold">$0 (Excluido)</span>
                            ) : (
                              `Est: $${estimatedPay.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Days Grid in Mobile Card */}
                      <div className="grid grid-cols-1 gap-2">
                        <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                          Días de la Semana (Toca para editar / arrastrar / Ctrl+C/V):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {DAYS_OF_WEEK.map(day => {
                            const slots = getAgentSlotsForDay(agent.email, day.value);
                            const isSelected = selectedCell?.email.toLowerCase() === agent.email.toLowerCase() && selectedCell?.dayValue === day.value;
                            const isDragOver = dragOverCell?.email.toLowerCase() === agent.email.toLowerCase() && dragOverCell?.dayValue === day.value;

                            return (
                              <div
                                key={day.value}
                                onClick={() => {
                                  setSelectedCell({ email: agent.email, dayValue: day.value, dayLabel: day.label });
                                }}
                                onDoubleClick={() => handleCellClick(agent, day)}
                                onDragOver={(e) => {
                                  if (isEditableRow) {
                                    e.preventDefault();
                                    setDragOverCell({ email: agent.email, dayValue: day.value });
                                  }
                                }}
                                onDragLeave={() => setDragOverCell(null)}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  setDragOverCell(null);
                                  if (isEditableRow && draggedSlotsData) {
                                    executePasteSlots(agent.email, day.value, draggedSlotsData.slots, agent.fullname, day.label);
                                  }
                                }}
                                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                                  isDragOver
                                    ? 'bg-emerald-500/20 border-2 border-dashed border-emerald-500'
                                    : isSelected
                                    ? 'ring-2 ring-brand-primary bg-brand-primary/10 border-brand-primary'
                                    : isEditableRow
                                    ? 'cursor-pointer active:scale-98 bg-gray-50 hover:bg-brand-primary/5 dark:bg-gray-800 dark:hover:bg-gray-750 border-gray-200 dark:border-gray-700'
                                    : 'cursor-not-allowed opacity-90 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-16">
                                    {day.label}:
                                  </span>
                                  {!isTemplateMode && (
                                    <span className="text-[10px] text-gray-400 font-mono">
                                      {getDayDateLabel(currentWeekDate, day.value)}
                                    </span>
                                  )}
                                </div>

                                <div>
                                  {isDragOver ? (
                                    <span className="text-xxs font-bold text-emerald-600 dark:text-emerald-300 animate-pulse">
                                      📥 Soltar aquí
                                    </span>
                                  ) : slots.length === 0 ? (
                                    <span className="text-xxs text-gray-400 italic">
                                      {isEditableRow ? '+ Asignar' : 'Libre'}
                                    </span>
                                  ) : (
                                    <div className="flex flex-col items-end gap-0.5">
                                      {slots.map((s: any, idx: number) => (
                                        <span
                                          key={idx}
                                          draggable={isEditableRow}
                                          onDragStart={(e) => {
                                            e.stopPropagation();
                                            e.dataTransfer.setData('text/plain', JSON.stringify(slots));
                                            setDraggedSlotsData({ slots, sourceEmail: agent.email, sourceDay: day.value });
                                          }}
                                          className="text-xxs font-mono font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-lg border border-brand-primary/20 cursor-grab active:cursor-grabbing"
                                        >
                                          {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
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
              {role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    setAgentForm({ id: undefined, fullname: '', email: '', password: '', role: 'agent', status: 'active', exclude_from_payroll: false });
                    setAgentFormError('');
                    setAgentModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-extrabold rounded-xl transition-all shadow-sm"
                  title="Crear un nuevo asesor / colaborador"
                >
                  <Plus className="w-4 h-4" /> Crear Empleado
                </button>
              )}
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
                    {payrollList.filter(a => !a.exclude_from_payroll).reduce((sum, agent) => sum + Number(agent.total_hours || 0), 0).toFixed(1)} hrs
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
                    ${Math.round(payrollList.filter(a => !a.exclude_from_payroll).reduce((sum, agent) => sum + Number(agent.total_payment || 0), 0)).toLocaleString('es-CO')}
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
                            <div className="flex flex-col items-center gap-1 max-w-[130px] mx-auto">
                              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    trialPct >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${trialPct}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono font-bold">
                                {trialHist.toFixed(1)} / {trialHoursTarget} hrs ({trialPct.toFixed(0)}%)
                              </span>
                              {trialPct >= 100 && (
                                <span className="text-[9px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md mt-0.5 animate-pulse">
                                  🎉 Meta 80h alcanzada
                                </span>
                              )}
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
                            <span>{(Number(agent.total_hours) || 0).toFixed(1)} hrs</span>
                            {isTrial && agent.trial_hours !== undefined && (
                              <span className="text-[9px] text-gray-400 font-sans">
                                ({(Number(agent.trial_hours) || 0).toFixed(1)}h trial + {(Number(agent.normal_hours) || 0).toFixed(1)}h agent)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Rate */}
                        <td className="py-4 px-4 text-center font-mono text-xs">
                          {agent.exclude_from_payroll ? (
                            <span className="text-gray-400 italic text-[11px]">Sin Sueldo</span>
                          ) : (
                            `$${(Number(agent.hourly_rate) || 0).toLocaleString('es-CO')} / h`
                          )}
                        </td>

                        {/* Bonuses List */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1.5 max-w-[200px]">
                            {(!agent.bonuses || agent.bonuses.length === 0) ? (
                              <span className="text-xxs text-gray-400 italic">Sin bonos</span>
                            ) : (
                              (agent.bonuses || []).map(b => (
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
                            `$${Math.round(Number(agent.total_payment) || 0).toLocaleString('es-CO')}`
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
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xxs px-2.5 py-1.5 rounded-lg transition-all shadow-xs flex items-center justify-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3" /> Cerrar Nómina
                              </button>
                            ) : (
                              <div className="flex flex-col items-center gap-1 w-full">
                                <span className="text-xxs text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md w-full">
                                  <CheckCircle className="w-3 h-3 text-emerald-500" /> Archivado / Pagado
                                </span>
                                {isAdminOrSupervisor && (
                                  <button
                                    type="button"
                                    onClick={() => handleReopenPayroll(agent)}
                                    className="w-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-xxs px-2 py-1 rounded-lg transition-all flex items-center justify-center gap-1"
                                    title="Reabrir nómina para hacer correcciones en horas o bonos"
                                  >
                                    <Unlock className="w-3 h-3" /> Reabrir Nómina
                                  </button>
                                )}
                              </div>
                            )}

                            <button
                              onClick={() => handleOpenStubModal(agent)}
                              className="flex items-center gap-1 text-xxs font-bold text-brand-primary hover:underline mt-0.5"
                            >
                              <FileText className="w-3 h-3" /> Ver Desprendible
                            </button>

                            {role === 'admin' && (
                              <div className="flex flex-col gap-1 w-full mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const contractStatus = agent.contract_status || (agents.find(a => a.id === agent.agent_id)?.status);
                                    handleTerminateAgent({ id: agent.agent_id, fullname: agent.fullname, email: agent.email, status: contractStatus });
                                  }}
                                  className={`w-full text-[10px] font-bold px-2 py-1 rounded-lg border transition-all ${
                                    (agent.contract_status || (agents.find(a => a.id === agent.agent_id)?.status)) === 'inactive'
                                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20'
                                      : 'bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20'
                                  }`}
                                >
                                  {(agent.contract_status || (agents.find(a => a.id === agent.agent_id)?.status)) === 'inactive' ? '🔄 Reactivar' : '❌ Terminar Contrato'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenContractHistory({ id: agent.agent_id, fullname: agent.fullname, email: agent.email })}
                                  className="w-full text-[10px] font-bold px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                                  title="Ver historial de cambios de contrato y reactivaciones"
                                >
                                  📜 Historial Contrato
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Configuración Global del Sistema (Solo Esteban) */}
          {isEsteban && (
            <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-2xl border dark:border-gray-700 shadow-xs">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Settings className="w-5 h-5 text-brand-primary" /> Configuración Global del Sitio y Tarifas
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                Configura el número oficial de WhatsApp que reciben los clientes en el sitio web y las tarifas de nómina.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Número WhatsApp Contacto */}
                <div className="bg-gray-50 dark:bg-gray-850 p-4 rounded-xl border dark:border-gray-700">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-200 mb-1">
                    📱 WhatsApp Oficial de Contacto (Web)
                  </label>
                  <input
                    type="text"
                    value={whatsappContactNumber}
                    onChange={(e) => setWhatsappContactNumber(e.target.value)}
                    placeholder="Ej. 573118587974"
                    className="w-full p-2.5 text-xs font-mono font-bold rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                    Número al cual dirigirán los botones flotantes de WhatsApp, enlaces de ofertas y pie de página de Sheerit.
                  </p>
                </div>

                {/* Valor Hora Normal */}
                <div className="bg-gray-50 dark:bg-gray-850 p-4 rounded-xl border dark:border-gray-700">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-200 mb-1">
                    💵 Valor Hora Agente Oficial (COP)
                  </label>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full p-2.5 text-xs font-mono font-bold rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    Tarifa por hora para asesores graduados ($8,333/h).
                  </p>
                </div>

                {/* Valor Hora Prueba */}
                <div className="bg-gray-50 dark:bg-gray-850 p-4 rounded-xl border dark:border-gray-700">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-200 mb-1">
                    🌱 Valor Hora Período de Prueba (COP)
                  </label>
                  <input
                    type="number"
                    value={trialHourlyRate}
                    onChange={(e) => setTrialHourlyRate(Number(e.target.value))}
                    className="w-full p-2.5 text-xs font-mono font-bold rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    Tarifa por hora para los primeros 80h de prueba ($4,000/h).
                  </p>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  disabled={updatingConfig}
                  onClick={handleSaveAdminConfig}
                  className="px-5 py-2.5 bg-brand-primary hover:bg-brand-dark text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {updatingConfig ? 'Guardando Ajustes...' : '💾 Guardar Configuración Global'}
                </button>
              </div>
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
                              value={sanitizeTimeForInput(slot.start_time)}
                              onChange={(e) => handleSlotChange(index, 'start_time', e.target.value)}
                              className="px-2 py-1 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white bg-transparent"
                            />
                            <span className="text-xs text-gray-400">a</span>
                            <input
                              type="time"
                              value={sanitizeTimeForInput(slot.end_time)}
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
                                        value={sanitizeTimeForInput(slot.break_start)}
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
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-6 pt-4 border-t dark:border-gray-700">
              <button
                type="button"
                onClick={handleAddSlot}
                disabled={modalLoading || modalSaving}
                className="flex items-center justify-center text-xs font-bold text-brand-primary hover:text-brand-dark px-3 py-2.5 rounded-xl border border-brand-primary/20 hover:border-brand-primary/50 transition-colors w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Añadir Franja (9h def)
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => { setEditingAgent(null); setEditingDay(null); }}
                  className="flex-1 sm:flex-initial px-4 py-2.5 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all text-center"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveModal}
                  disabled={modalLoading || modalSaving}
                  className="flex-1 sm:flex-initial bg-brand-primary hover:bg-brand-dark text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center transition-all disabled:opacity-50 shadow-md"
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
                <tbody className="divide-y divide-gray-100 dark:divide-gray-750 font-mono text-gray-900 dark:text-slate-100">
                  {/* Trial Hours row if trial hours exist */}
                  {(selectedStubAgent.trial_hours || 0) > 0 && (
                    <tr className="text-gray-900 dark:text-slate-100">
                      <td className="py-3 px-4 font-sans font-semibold text-gray-900 dark:text-slate-100">Horas de Prueba (Trial)</td>
                      <td className="py-3 px-4 text-center font-bold text-gray-900 dark:text-slate-100">{selectedStubAgent.trial_hours?.toFixed(1)} hrs</td>
                      <td className="py-3 px-4 text-center text-gray-900 dark:text-slate-100">${(selectedStubAgent.trial_hourly_rate || 4000).toLocaleString('es-CO')}</td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">
                        ${Math.round((selectedStubAgent.trial_hours || 0) * (selectedStubAgent.trial_hourly_rate || 4000)).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  )}

                  {/* Normal Agent Hours row */}
                  {(selectedStubAgent.normal_hours || ((selectedStubAgent.trial_hours || 0) === 0 && selectedStubAgent.total_hours)) > 0 && (
                    <tr className="text-gray-900 dark:text-slate-100">
                      <td className="py-3 px-4 font-sans font-semibold text-gray-900 dark:text-slate-100">Horas Asesor Regular (Agent)</td>
                      <td className="py-3 px-4 text-center font-bold text-gray-900 dark:text-slate-100">
                        {((selectedStubAgent.trial_hours || 0) > 0 ? selectedStubAgent.normal_hours : (selectedStubAgent.normal_hours || selectedStubAgent.total_hours)).toFixed(1)} hrs
                      </td>
                      <td className="py-3 px-4 text-center text-gray-900 dark:text-slate-100">
                        ${(selectedStubAgent.normal_hourly_rate || (selectedStubAgent.hourly_rate && selectedStubAgent.hourly_rate > 6000 ? selectedStubAgent.hourly_rate : 8333)).toLocaleString('es-CO')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900 dark:text-white">
                        ${Math.round(
                          (selectedStubAgent.trial_hours || 0) > 0
                            ? (selectedStubAgent.normal_hours * (selectedStubAgent.normal_hourly_rate || (selectedStubAgent.hourly_rate && selectedStubAgent.hourly_rate > 6000 ? selectedStubAgent.hourly_rate : 8333)))
                            : ((selectedStubAgent.normal_hours || selectedStubAgent.total_hours) * (selectedStubAgent.hourly_rate || 8333))
                        ).toLocaleString('es-CO')}
                      </td>
                    </tr>
                  )}

                  {/* Bonuses rows */}
                  {selectedStubAgent.bonuses && selectedStubAgent.bonuses.length > 0 && (
                    selectedStubAgent.bonuses.map(b => (
                      <tr key={b.id} className="bg-emerald-50/20 dark:bg-emerald-950/20 text-gray-900 dark:text-slate-100">
                        <td className="py-2 px-4 font-sans text-emerald-700 dark:text-emerald-300 font-semibold">
                          Bono: {b.reason}
                        </td>
                        <td className="py-2 px-4 text-center text-gray-400 dark:text-gray-400">-</td>
                        <td className="py-2 px-4 text-center text-gray-400 dark:text-gray-400">-</td>
                        <td className="py-2 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          +${parseFloat(b.amount as any).toLocaleString('es-CO')}
                        </td>
                      </tr>
                    ))
                  )}

                  {/* Total Row */}
                  <tr className="bg-gray-50 dark:bg-gray-800 text-sm font-bold border-t-2 dark:border-gray-700 text-gray-900 dark:text-white">
                    <td colSpan={3} className="py-3 px-4 text-right font-sans uppercase text-gray-800 dark:text-slate-200">Total Neto a Pagar:</td>
                    <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 font-mono text-base font-black">
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
                          <div className="flex items-center justify-center gap-2">
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
                              className="flex items-center gap-1 text-xxs font-bold text-brand-primary hover:underline bg-brand-primary/10 px-2 py-1 rounded-lg"
                            >
                              <FileText className="w-3 h-3" /> Ver Desprendible
                            </button>
                            {isAdminOrSupervisor && (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!window.confirm(`¿Seguro de reabrir/cancelar este cierre de nómina de ${rec.fullname}?`)) return;
                                  const apiUrl = getApiUrl();
                                  try {
                                    const res = await fetch(`${apiUrl}/api/admin/payroll/reopen`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ id: rec.id })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      alert(`🔓 ${data.message}`);
                                      fetchPayrollHistory();
                                      fetchPayrollData();
                                    } else {
                                      alert(`❌ Error al reabrir nómina: ${data.message || data.error}`);
                                    }
                                  } catch (err: any) {
                                    alert(`❌ Error de conexión: ${err.message}`);
                                  }
                                }}
                                className="flex items-center gap-1 text-xxs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 px-2 py-1 rounded-lg transition-all"
                                title="Reabrir/eliminar este registro cerrado para hacer correcciones"
                              >
                                <Unlock className="w-3 h-3" /> Reabrir
                              </button>
                            )}
                          </div>
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
      {/* Modal Crear / Editar Empleado */}
      {agentModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-850 rounded-2xl max-w-md w-full border dark:border-gray-700 shadow-2xl p-6 relative">
            <button
              onClick={() => setAgentModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b dark:border-gray-700 pb-3">
              <User className="w-5 h-5 text-brand-primary" />
              <h3 className="text-base font-extrabold text-gray-800 dark:text-white">
                {agentForm.id ? 'Editar Empleado / Colaborador' : '➕ Crear Nuevo Empleado'}
              </h3>
            </div>

            {agentFormError && (
              <div className="bg-red-500/10 text-red-600 border border-red-500/20 p-2.5 rounded-xl mb-4 text-xs font-bold">
                {agentFormError}
              </div>
            )}

            <form onSubmit={handleSaveAgentForm} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={agentForm.fullname}
                  onChange={e => setAgentForm({ ...agentForm, fullname: e.target.value })}
                  placeholder="ej: Esclepiades Katherine"
                  className="w-full p-2.5 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={agentForm.email}
                  onChange={e => setAgentForm({ ...agentForm, email: e.target.value })}
                  placeholder="ej: katherine@outlook.es"
                  className="w-full p-2.5 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {agentForm.id ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña de Acceso *'}
                </label>
                <input
                  type="password"
                  required={!agentForm.id}
                  value={agentForm.password}
                  onChange={e => setAgentForm({ ...agentForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full p-2.5 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Rol de Acceso</label>
                  <select
                    value={agentForm.role}
                    onChange={e => setAgentForm({ ...agentForm, role: e.target.value })}
                    className="w-full p-2.5 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="agent">Asesor (Agent)</option>
                    <option value="trial">Asesor en Prueba (Trial)</option>
                    <option value="admin">Administrador (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Estado de Contrato</label>
                  <select
                    value={agentForm.status}
                    onChange={e => setAgentForm({ ...agentForm, status: e.target.value })}
                    className="w-full p-2.5 border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                  >
                    <option value="active">🟢 Activo</option>
                    <option value="inactive">🔴 Terminación de Contrato / Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-gray-800 dark:text-gray-200 font-bold">
                  <input
                    type="checkbox"
                    checked={agentForm.exclude_from_payroll}
                    onChange={e => setAgentForm({ ...agentForm, exclude_from_payroll: e.target.checked })}
                    className="w-4 h-4 text-brand-primary rounded"
                  />
                  <span>🚫 Excluir de Nómina y Labores ($0 sueldo)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setAgentModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-gray-600 dark:text-gray-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={agentFormSaving}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-extrabold rounded-xl shadow-sm"
                >
                  {agentFormSaving ? 'Guardando...' : 'Guardar Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Historial de Auditoría de Contrato */}
      {contractHistoryModalOpen && contractHistoryAgent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-850 rounded-2xl max-w-lg w-full border dark:border-gray-700 shadow-2xl p-6 relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setContractHistoryModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2 border-b dark:border-gray-700 pb-3">
              <History className="w-5 h-5 text-brand-primary" />
              <div>
                <h3 className="text-base font-extrabold text-gray-800 dark:text-white">
                  Historial de Contrato y Cambios
                </h3>
                <p className="text-xs text-gray-500 font-mono">Colaborador: {contractHistoryAgent.fullname} ({contractHistoryAgent.email})</p>
              </div>
            </div>

            {contractHistoryLoading ? (
              <div className="text-center py-12 text-gray-400 text-xs">Cargando historial de contrato...</div>
            ) : contractHistoryList.length === 0 ? (
              <div className="text-center py-12 text-gray-400 italic text-xs">
                No hay registros de terminaciones o reactivaciones previas para este colaborador.
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 pr-1 my-3 space-y-3">
                {contractHistoryList.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-xl border dark:border-gray-750 bg-gray-50 dark:bg-gray-800/80 text-xs flex flex-col gap-1.5 shadow-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className={`font-extrabold text-xs px-2 py-0.5 rounded border ${
                        rec.action === 'terminated'
                          ? 'bg-red-500/10 text-red-600 border-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      }`}>
                        {rec.action === 'terminated' ? '🔴 Terminación de Contrato' : '🟢 Reactivación de Contrato'}
                      </span>
                      <span className="font-mono text-[11px] text-gray-400">
                        {new Date(rec.created_at).toLocaleString('es-CO')}
                      </span>
                    </div>
                    <div className="text-gray-800 dark:text-gray-200 mt-1 font-sans">
                      <strong className="text-gray-500 dark:text-gray-400">Motivo / Descripción:</strong>{' '}
                      <span className="italic">{rec.reason || 'Sin descripción especificada'}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                      Registrado por: <strong>{rec.performed_by}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t dark:border-gray-700">
              <button
                type="button"
                onClick={() => setContractHistoryModalOpen(false)}
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
