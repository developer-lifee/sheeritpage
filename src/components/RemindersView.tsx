import React, { useState, useEffect } from 'react';
import { Bell, Clock, Calendar, Send, Plus, Trash2, Edit3, CheckCircle, AlertCircle, RefreshCw, Play, Shield, MessageSquare, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';

interface Reminder {
  id: string;
  title: string;
  target: string;
  targetLabel: string;
  message: string;
  type: 'recurring' | 'once';
  time: string;
  datetime?: string | null;
  days: number[];
  daysLabel: string;
  enabled: boolean;
  createdAt: string;
  lastSentAt?: string | null;
}

interface PredefinedTarget {
  id: string;
  name: string;
}

const TEMPLATES = [
  {
    title: 'Revisar uso de Claude',
    target: '120363102144405222@g.us',
    time: '10:00',
    type: 'recurring',
    days: [1, 2, 3, 4, 5, 6, 0],
    message: '🔔 *RECORDATORIO DIARIO:*\nPor favor revisar el consumo y uso de tokens de las cuentas de Claude para verificar disponibilidad y límites antes de la demanda del mediodía.'
  },
  {
    title: 'Revisión nocturna de Claude y tokens',
    target: '120363102144405222@g.us',
    time: '19:00',
    type: 'recurring',
    days: [1, 2, 3, 4, 5, 6, 0],
    message: '🌙 *RECORDATORIO DE LA TARDE:*\nRevisar el estado y cupo de las cuentas de Claude Pro / Max para asegurar stock en horario nocturno.'
  },
  {
    title: 'Aviso de cierre de turno de soporte',
    target: '120363102144405222@g.us',
    time: '21:30',
    type: 'recurring',
    days: [1, 2, 3, 4, 5],
    message: '⏱️ *RECORDATORIO DE CIERRE:*\nFaltan 30 minutos para el cierre de soporte humano. Por favor verificar tickets pendientes y dejar notas en el sistema.'
  }
];

export const RemindersView: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [targets, setTargets] = useState<PredefinedTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    target: '120363102144405222@g.us',
    customTarget: '',
    message: '',
    type: 'recurring' as 'recurring' | 'once',
    time: '10:00',
    datetime: '',
    recurrencePreset: 'daily' as 'daily' | 'weekdays' | 'custom',
    selectedDays: [1, 2, 3, 4, 5, 6, 0]
  });

  const getApiUrl = () => {
    return window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/reminders`);
      if (res.ok) {
        const data = await res.json();
        setReminders(data.reminders || []);
        setTargets(data.predefinedTargets || []);
      }
    } catch (err: any) {
      console.error('Error cargando recordatorios:', err);
      showToast('Error cargando la lista de recordatorios', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewModal = (template?: typeof TEMPLATES[0]) => {
    setEditingId(null);
    if (template) {
      setFormData({
        title: template.title,
        target: template.target,
        customTarget: '',
        message: template.message,
        type: 'recurring',
        time: template.time,
        datetime: '',
        recurrencePreset: template.days.length === 7 ? 'daily' : 'weekdays',
        selectedDays: template.days
      });
    } else {
      setFormData({
        title: '',
        target: targets[0]?.id || '120363102144405222@g.us',
        customTarget: '',
        message: '',
        type: 'recurring',
        time: '10:00',
        datetime: '',
        recurrencePreset: 'daily',
        selectedDays: [1, 2, 3, 4, 5, 6, 0]
      });
    }
    setModalOpen(true);
  };

  const openEditModal = (rem: Reminder) => {
    setEditingId(rem.id);
    const isPredefined = targets.some(t => t.id === rem.target);
    setFormData({
      title: rem.title,
      target: isPredefined ? rem.target : 'custom',
      customTarget: isPredefined ? '' : rem.target,
      message: rem.message,
      type: rem.type,
      time: rem.time || '10:00',
      datetime: rem.datetime || '',
      recurrencePreset: rem.days.length === 7 ? 'daily' : (rem.days.length === 5 && !rem.days.includes(0) && !rem.days.includes(6) ? 'weekdays' : 'custom'),
      selectedDays: rem.days || [1, 2, 3, 4, 5, 6, 0]
    });
    setModalOpen(true);
  };

  const handleToggleDay = (dayNum: number) => {
    setFormData(prev => {
      const exists = prev.selectedDays.includes(dayNum);
      const nextDays = exists 
        ? prev.selectedDays.filter(d => d !== dayNum) 
        : [...prev.selectedDays, dayNum].sort();
      return { ...prev, selectedDays: nextDays, recurrencePreset: 'custom' };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast('Por favor ingresa un título para el recordatorio', 'error');
      return;
    }
    if (!formData.message.trim()) {
      showToast('Por favor escribe el mensaje a enviar', 'error');
      return;
    }

    const finalTarget = formData.target === 'custom' ? formData.customTarget.trim() : formData.target;
    if (!finalTarget) {
      showToast('Por favor especifica el destino del mensaje', 'error');
      return;
    }

    let finalDays = formData.selectedDays;
    if (formData.recurrencePreset === 'daily') finalDays = [1, 2, 3, 4, 5, 6, 0];
    if (formData.recurrencePreset === 'weekdays') finalDays = [1, 2, 3, 4, 5];

    const payload = {
      title: formData.title,
      target: finalTarget,
      message: formData.message,
      type: formData.type,
      time: formData.time,
      datetime: formData.datetime,
      days: finalDays
    };

    try {
      const url = editingId 
        ? `${getApiUrl()}/api/admin/reminders/${editingId}`
        : `${getApiUrl()}/api/admin/reminders`;
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(editingId ? 'Recordatorio actualizado correctamente' : 'Recordatorio creado y programado');
        setModalOpen(false);
        loadData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Error al guardar recordatorio', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleActive = async (rem: Reminder) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/reminders/${rem.id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !rem.enabled })
      });
      if (res.ok) {
        setReminders(prev => prev.map(r => r.id === rem.id ? { ...r, enabled: !rem.enabled } : r));
        showToast(!rem.enabled ? 'Recordatorio activado' : 'Recordatorio pausado');
      }
    } catch (err: any) {
      showToast('Error al cambiar estado del recordatorio', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este recordatorio programado?')) return;
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/reminders/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setReminders(prev => prev.filter(r => r.id !== id));
        showToast('Recordatorio eliminado');
      }
    } catch (err: any) {
      showToast('Error al eliminar recordatorio', 'error');
    }
  };

  const handleTestSend = async (rem: Reminder) => {
    setTestingId(rem.id);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/reminders/${rem.id}/test`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Recordatorio enviado exitosamente a ${rem.targetLabel}`);
        loadData();
      } else {
        showToast(`❌ Error enviando mensaje: ${data.error || 'Fallo de entrega'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Error al probar recordatorio: ${err.message}`, 'error');
    } finally {
      setTestingId(null);
    }
  };

  const dayLetters = [
    { num: 1, name: 'Lunes', short: 'L' },
    { num: 2, name: 'Martes', short: 'M' },
    { num: 3, name: 'Miércoles', short: 'X' },
    { num: 4, name: 'Jueves', short: 'J' },
    { num: 5, name: 'Viernes', short: 'V' },
    { num: 6, name: 'Sábado', short: 'S' },
    { num: 0, name: 'Domingo', short: 'D' }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 text-sm font-semibold transition-all ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-600 text-white border-emerald-500' 
            : 'bg-rose-600 text-white border-rose-500'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 dark:from-blue-950/60 dark:to-purple-950/60 p-6 rounded-2xl border border-blue-500/20 backdrop-blur-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              Recordatorios Automáticos de WhatsApp
            </h2>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 max-w-2xl">
            Programa alertas y mensajes recurrentes hacia los grupos de administración (Sheerit General, Errors Bot) o chats individuales a horas fijas de Colombia.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
            title="Recargar recordatorios"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => openNewModal()}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl font-bold text-xs bg-brand-primary hover:bg-brand-primary/90 text-white flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Recordatorio</span>
          </button>
        </div>
      </div>

      {/* Quick Templates Bar */}
      <div className="bg-gray-50/50 dark:bg-gray-900/40 border dark:border-gray-800 p-4 rounded-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Plantillas Rápidas recomendadas:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              onClick={() => openNewModal(tmpl)}
              className="text-xs bg-white dark:bg-gray-800 hover:border-brand-primary border dark:border-gray-700 px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-200 flex items-center gap-1.5 transition-all shadow-xs group"
            >
              <Clock className="w-3 h-3 text-brand-primary" />
              <span className="font-semibold group-hover:text-brand-primary">{tmpl.title}</span>
              <span className="text-[10px] text-gray-400 font-mono">({tmpl.time})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reminders List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
          <RefreshCw className="w-7 h-7 animate-spin text-brand-primary" />
          <span className="text-xs font-medium">Cargando recordatorios activos...</span>
        </div>
      ) : reminders.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-brand-primary flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">No hay recordatorios configurados</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Crea tu primer recordatorio para que el bot de WhatsApp envíe automáticamente alertas diarias en los horarios que definas.
          </p>
          <button
            onClick={() => openNewModal()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-primary text-white hover:bg-brand-primary/90 transition-all inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear recordatorio ahora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reminders.map((rem) => (
            <div 
              key={rem.id}
              className={`bg-white dark:bg-gray-900 rounded-2xl border transition-all shadow-sm hover:shadow-md flex flex-col justify-between p-5 ${
                rem.enabled 
                  ? 'border-gray-200 dark:border-gray-800' 
                  : 'border-dashed border-gray-300 dark:border-gray-800 opacity-60'
              }`}
            >
              <div className="space-y-3">
                {/* Header card */}
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                      {rem.daysLabel}
                    </span>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                      {rem.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleToggleActive(rem)}
                    className="text-gray-400 hover:text-brand-primary transition-colors cursor-pointer shrink-0"
                    title={rem.enabled ? 'Pausar recordatorio' : 'Activar recordatorio'}
                  >
                    {rem.enabled ? (
                      <ToggleRight className="w-7 h-7 text-emerald-500 fill-emerald-500/20" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Badges: Time & Target */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/30 font-mono font-bold text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{rem.time || 'Hora fija'}</span>
                  </div>

                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border dark:border-gray-750 text-[11px] font-medium truncate max-w-[200px]">
                    <MessageSquare className="w-3 h-3 text-brand-primary shrink-0" />
                    <span className="truncate">{rem.targetLabel}</span>
                  </div>
                </div>

                {/* Message preview box */}
                <div className="bg-gray-50/70 dark:bg-gray-950/50 p-3 rounded-xl border dark:border-gray-850 text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-32 overflow-y-auto leading-relaxed shadow-xxs">
                  {rem.message}
                </div>
              </div>

              {/* Footer info & action buttons */}
              <div className="pt-4 mt-4 border-t dark:border-gray-800/80 flex items-center justify-between gap-2">
                <div className="text-[10px] text-gray-400">
                  {rem.lastSentAt ? (
                    <span>Último: {new Date(rem.lastSentAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} ({new Date(rem.lastSentAt).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })})</span>
                  ) : (
                    <span>Sin envíos previos</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleTestSend(rem)}
                    disabled={testingId === rem.id}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all flex items-center gap-1"
                    title="Enviar mensaje de prueba ahora"
                  >
                    <Play className={`w-3 h-3 ${testingId === rem.id ? 'animate-spin' : ''}`} />
                    <span>{testingId === rem.id ? 'Enviando...' : 'Probar'}</span>
                  </button>

                  <button
                    onClick={() => openEditModal(rem)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-brand-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Editar"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(rem.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 shadow-2xl w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col animate-scaleUp">
            {/* Modal Header */}
            <div className="p-5 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-brand-primary" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {editingId ? 'Editar Recordatorio' : 'Nuevo Recordatorio de WhatsApp'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-200 text-sm p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-grow">
              {/* Título */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Título descriptivo del recordatorio
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Revisar uso de Claude, Cierre de turnos..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              {/* Destino */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Destino del mensaje en WhatsApp
                </label>
                <select
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
                >
                  {targets.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                  <option value="custom">📱 Otro número de teléfono o ID de grupo personalizado</option>
                </select>

                {formData.target === 'custom' && (
                  <input
                    type="text"
                    required
                    placeholder="Número con código de país (ej: 573118587974) o JID de grupo"
                    value={formData.customTarget}
                    onChange={(e) => setFormData({ ...formData, customTarget: e.target.value })}
                    className="w-full mt-2 px-3 py-2 text-xs border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                )}
              </div>

              {/* Frecuencia y Hora */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Frecuencia
                  </label>
                  <select
                    value={formData.type === 'once' ? 'once' : formData.recurrencePreset}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'once') {
                        setFormData({ ...formData, type: 'once' });
                      } else {
                        setFormData({ 
                          ...formData, 
                          type: 'recurring', 
                          recurrencePreset: val as any,
                          selectedDays: val === 'daily' ? [1,2,3,4,5,6,0] : (val === 'weekdays' ? [1,2,3,4,5] : formData.selectedDays)
                        });
                      }
                    }}
                    className="w-full px-3 py-2 text-xs border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
                  >
                    <option value="daily">Todos los días</option>
                    <option value="weekdays">Lunes a Viernes</option>
                    <option value="custom">Días específicos</option>
                    <option value="once">Una sola vez</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {formData.type === 'once' ? 'Fecha y Hora (Bogotá)' : 'Hora de Envío (Bogotá)'}
                  </label>
                  {formData.type === 'once' ? (
                    <input
                      type="datetime-local"
                      required
                      value={formData.datetime}
                      onChange={(e) => setFormData({ ...formData, datetime: e.target.value })}
                      className="w-full px-3 py-2 text-xs border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary font-mono"
                    />
                  ) : (
                    <input
                      type="time"
                      required
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-3 py-2 text-xs border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary font-mono font-bold"
                    />
                  )}
                </div>
              </div>

              {/* Días específicos (si aplica) */}
              {formData.type === 'recurring' && formData.recurrencePreset === 'custom' && (
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400">
                    Selecciona los días activos:
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {dayLetters.map(d => {
                      const selected = formData.selectedDays.includes(d.num);
                      return (
                        <button
                          type="button"
                          key={d.num}
                          onClick={() => handleToggleDay(d.num)}
                          className={`w-9 h-8 rounded-lg text-xs font-bold transition-all ${
                            selected 
                              ? 'bg-brand-primary text-white shadow-xs' 
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {d.short}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mensaje */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Mensaje de WhatsApp
                  </label>
                  <span className="text-[10px] text-gray-400">Soporta *negrita*, _cursiva_ y saltos de línea</span>
                </div>
                <textarea
                  rows={4}
                  required
                  placeholder="Escribe el mensaje exacto que enviará el bot..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary font-mono leading-relaxed"
                />
              </div>

              {/* Botones de acción */}
              <div className="pt-4 border-t dark:border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white shadow-md hover:shadow-lg transition-all"
                >
                  {editingId ? 'Guardar Cambios' : 'Crear y Programar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
