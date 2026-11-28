import React, { useEffect, useState } from 'react';
import {
  Bug,
  Send,
  RefreshCw,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';

interface SaasBugTicket {
  id: number;
  tenant_id: number;
  title: string;
  category: string;
  description: string;
  steps_to_reproduce?: string | null;
  status: 'reported' | 'in_review' | 'in_progress' | 'resolved' | 'closed';
  admin_notes?: string | null;
  whatsapp_notified: number | boolean;
  created_at: string;
  updated_at?: string;
  resolved_at?: string | null;
}

interface SaasBugTicketsTabProps {
  apiBase: string;
  token: string;
  onNotify: (type: 'ok' | 'err', msg: string) => void;
}

const STATUS_META: Record<
  SaasBugTicket['status'],
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  reported: {
    label: 'Reportado',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    icon: Clock
  },
  in_review: {
    label: 'En revisión',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
    icon: AlertTriangle
  },
  in_progress: {
    label: 'En progreso',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/35',
    icon: Wrench
  },
  resolved: {
    label: 'Resuelto',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
    icon: CheckCircle2
  },
  closed: {
    label: 'Cerrado',
    badgeClass: 'bg-slate-700/60 text-slate-300 border-slate-600',
    icon: CheckCircle2
  }
};

const CATEGORY_LABELS: Record<string, string> = {
  bug: '🐛 Bug de plataforma',
  simulator: '🧪 Modo Prueba / Simulador',
  whatsapp: '📱 Conexión WhatsApp',
  audios: '🎙️ Audios / Flujos',
  feature: '✨ Solicitud técnica'
};

export const SaasBugTicketsTab: React.FC<SaasBugTicketsTabProps> = ({ apiBase, token, onNotify }) => {
  const [tickets, setTickets] = useState<SaasBugTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [category, setCategory] = useState('simulator');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/bug-tickets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.tickets)) {
        setTickets(data.tickets);
      }
    } catch {
      onNotify('err', 'No se pudo cargar tu historial de tickets técnicos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      onNotify('err', 'Escribe un título breve y describe lo que ocurrió.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/api/saas-bot/bug-tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category,
          title: title.trim(),
          description: description.trim(),
          steps_to_reproduce: steps.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'No se pudo enviar el reporte técnico.');
      }

      setTitle('');
      setDescription('');
      setSteps('');
      setTickets(prev => [data.ticket, ...prev]);
      onNotify(
        'ok',
        data.whatsapp_notified
          ? `Ticket #${data.ticket.id} enviado al equipo técnico de Errors bot. Aquí podrás seguir su estado.`
          : `Ticket #${data.ticket.id} registrado en el panel técnico.`
      );
    } catch (err: any) {
      onNotify('err', err.message || 'Error al registrar ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6 items-start">
      {/* Formulario de reporte */}
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4"
      >
        <div className="space-y-1">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white">
            <Bug className="w-5 h-5 text-rose-400" /> Reportar Bug o Falla Técnica
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Este canal envía tu reporte directo al equipo de ingeniería (<strong>Errors bot</strong>) sin afectar la configuración actual de tu bot. Podrás seguir el progreso en tiempo real.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Área o Categoría</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
          >
            <option value="simulator">🧪 Modo Prueba / Simulador</option>
            <option value="bug">🐛 Error en plataforma / WhatsApp Bot</option>
            <option value="whatsapp">📱 Conexión WhatsApp / QR</option>
            <option value="audios">🎙️ Audios / Flujos / Sheets</option>
            <option value="feature">✨ Nueva función técnica</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Título del problema *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={160}
            placeholder="Ej. Al pausar el bot en Modo Prueba no recuerda la ciudad..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">¿Qué ocurrió vs qué esperabas? *</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe el caso concreto, mensaje de entrada, lo que respondió el bot o el error que viste..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Pasos para reproducirlo (opcional)</label>
          <textarea
            value={steps}
            onChange={e => setSteps(e.target.value)}
            rows={2}
            placeholder="1. Escribir 'Estoy en Cali'&#10;2. Activar control manual..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Enviando al equipo técnico...' : 'Enviar Ticket a Soporte Técnico'}
        </button>
      </form>

      {/* Historial y seguimiento */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">Tus Tickets de Soporte ({tickets.length})</h3>
            <p className="text-xs text-slate-400">
              Seguimiento en vivo: Reportado → En revisión → En progreso → Resuelto.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchTickets}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>

        {loading && tickets.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">Cargando tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="py-12 px-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/70 mx-auto" />
            <p className="text-xs text-slate-300 font-semibold">Aún no has reportado bugs en esta ticketera.</p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Cuando detectes algo en el simulador o en WhatsApp en vivo, regístralo aquí y nuestro equipo técnico recibirá la alerta inmediata.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {tickets.map(ticket => {
              const meta = STATUS_META[ticket.status] || STATUS_META.reported;
              const StatusIcon = meta.icon;
              return (
                <div
                  key={ticket.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-mono text-slate-400 font-bold">#{ticket.id}</span>
                      <span className="text-xs font-bold text-white truncate">{ticket.title}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${meta.badgeClass}`}>
                      <StatusIcon className="w-3 h-3" />
                      {meta.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span>{CATEGORY_LABELS[ticket.category] || ticket.category}</span>
                    <span>·</span>
                    <span>
                      {new Date(ticket.created_at).toLocaleString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {Boolean(ticket.whatsapp_notified) && (
                      <span className="text-emerald-400 font-semibold">✓ Notificado a Errors bot</span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {ticket.description}
                  </p>

                  {ticket.steps_to_reproduce && (
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 whitespace-pre-wrap">
                      <strong className="text-slate-300">Pasos:</strong> {ticket.steps_to_reproduce}
                    </div>
                  )}

                  {ticket.admin_notes && (
                    <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs text-teal-200 space-y-1">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> Respuesta del equipo técnico
                      </div>
                      <p className="whitespace-pre-wrap text-[11px] leading-relaxed">{ticket.admin_notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
