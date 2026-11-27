import React, { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Sparkles,
  Volume2,
  Sliders,
  Ticket,
  Database,
  Receipt,
  BarChart3,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Send,
  Zap,
  Check,
  Plus,
  Clock,
  RefreshCw,
  Search,
  Lock
} from 'lucide-react';
import { useWhatsAppContact } from '../hooks/useWhatsAppContact';

export type BasePlanId = 'starter' | 'pro' | 'scale';

interface BotModulesProps {
  onNavigate?: (view: any) => void;
  embedded?: boolean;
  externalPlanId?: BasePlanId;
  externalAddons?: ModuleId[];
  syncVersion?: number;
  onPlanChange?: (planId: BasePlanId) => void;
  onAddonsChange?: (addons: ModuleId[]) => void;
}

export interface BasePlan {
  id: BasePlanId;
  name: string;
  price: number;
  messages: string;
  includedAddonSlots: number;
  badge?: string;
  desc: string;
}

export type ModuleId =
  | 'flows'
  | 'semi'
  | 'ocr'
  | 'billing'
  | 'tickets'
  | 'crm'
  | 'accounting'
  | 'rpa';

export interface ModuleSpec {
  id: ModuleId;
  includedInBase: boolean;
  shortTitle: string;
  title: string;
  subtitle: string;
  price: number;
  tag: string;
  accent: string;
  description: string;
  exampleTitle: string;
  exampleText: string;
  bullets: string[];
  icon: React.ComponentType<{ className?: string }>;
}

export const BASE_PLANS: BasePlan[] = [
  {
    id: 'starter',
    name: 'Starter WhatsApp',
    price: 10000,
    messages: '50 Mensajes IA + Programables ilimitados',
    includedAddonSlots: 0,
    desc: 'Ideal para empezar: menús fijos, bienvenida, Módulo Automejorable con IA y 50 mensajes IA/mes.'
  },
  {
    id: 'pro',
    name: 'Pro Asistente IA',
    price: 30000,
    messages: '500 Mensajes IA / mes',
    includedAddonSlots: 1,
    badge: 'Más elegido',
    desc: 'Todo lo de Starter + Flujos Audio+Imagen + Modo Semiautomático + 1 módulo avanzado a gusto incluido.'
  },
  {
    id: 'scale',
    name: 'Scale & Alto Volumen',
    price: 60000,
    messages: '2.000 Mensajes IA / mes',
    includedAddonSlots: 3,
    desc: 'Todo lo de Pro + 2.000 mensajes IA + 3 módulos avanzados a gusto incluidos + panel multiagente.'
  }
];

export const MODULES_CATALOG: ModuleSpec[] = [
  {
    id: 'flows',
    includedInBase: true,
    shortTitle: 'Flujos Audio + Imagen',
    title: 'Flujos Audio + Imagen + Texto (Sin "Reenviado")',
    subtitle: 'Simulación humana de grabación en tiempo real + material visual automático',
    price: 0,
    tag: 'INCLUIDO EN PRO ($30k)+',
    accent: 'emerald',
    description:
      'Sube tus audios en MP3/OGG y adjunta una imagen o texto complementario a cada flujo. El motor recodifica el audio al instante sin metadatos heredados, marca "grabando audio..." y lo entrega junto con la foto de tu catálogo o precios.',
    exampleTitle: 'Cómo funciona en vivo:',
    exampleText:
      'El cliente pregunta "¿cuánto vale el combo de 3?" -> el bot espera una pausa humana natural, aparece "grabando audio...", envía tu nota de voz explicativa y 1 segundo después envía la imagen con la oferta vigente.',
    bullets: [
      'Cero etiqueta de "Reenviado" o "Reenviado muchas veces"',
      'Une múltiples clips en una sola nota de voz fluida con silencio configurable',
      'Panel de Ajustes de Mejora con IA: consulta decisiones y revierte cambios en 1 clic'
    ],
    icon: Volume2
  },
  {
    id: 'semi',
    includedInBase: true,
    shortTitle: 'Modo Semiautomático',
    title: 'Modo Semiautomático + Chats en Vivo 1 Clic',
    subtitle: 'Toma el control de cualquier venta sin pelear con el bot',
    price: 0,
    tag: 'INCLUIDO EN PRO ($30k)+',
    accent: 'teal',
    description:
      'Atención híbrida inteligente: el bot responde en piloto automático hasta que tú escribes desde tu celular o desde la consola web. En ese instante, el bot pausa ese chat durante los minutos que elijas y te deja cerrar la venta.',
    exampleTitle: 'Cómo funciona en vivo:',
    exampleText:
      'El bot ya respondió dudas y precios. Cuando el cliente va a cerrar envío especial, respondes desde tu WhatsApp -> el chat pasa a "Control Manual (30 min)" y puedes disparar tus audios con 1 clic desde el panel.',
    bullets: [
      'Auto-pausa instantánea por chat al detectar respuesta humana (fromMe)',
      'Botones rápidos de 1 clic para disparar audios manuales o de cierre',
      'Reactivación automática por tiempo o manual en 1 clic'
    ],
    icon: Sliders
  },
  {
    id: 'ocr',
    includedInBase: false,
    shortTitle: 'Pagos OCR IA',
    title: 'Validación Automática de Pagos (OCR IA)',
    subtitle: 'Escáner visual de comprobantes bancarios 24/7 con detección anti-fraude',
    price: 25000,
    tag: '+$25.000 / mes',
    accent: 'cyan',
    description:
      'Nuestro motor visual analiza las capturas de pago que envían tus clientes por WhatsApp (Nequi, Bancolombia modo claro y oscuro, Daviplata, Bre-V), extrae el valor real, destinatario, fecha y hora para aprobar o escalar automáticamente.',
    exampleTitle: 'Ejemplo real en operación:',
    exampleText:
      'Un cliente paga $89.900 a las 11:20 PM por Nequi o Bancolombia modo oscuro. La IA lee el comprobante en segundos, verifica que coincida con tu cuenta destino y registra el pago sin que tengas que trasnochar revisando capturas.',
    bullets: [
      'Lectura precisa incluso en modo oscuro Bancolombia y comprobantes QR Bre-V',
      'Validación de monto, banco, llave/cuenta destino y fecha del pago',
      'Si la imagen es borrosa o dudosa, la escala a validación manual sin rechazar al cliente'
    ],
    icon: Receipt
  },
  {
    id: 'billing',
    includedInBase: false,
    shortTitle: 'Cobros Automáticos',
    title: 'Cobros y Recordatorios Automáticos',
    subtitle: 'Recupera renovaciones y cartera sin mensajes manuales repetitivos',
    price: 20000,
    tag: '+$20.000 / mes',
    accent: 'emerald',
    description:
      'Envía avisos personalizados antes y el día del vencimiento con el total exacto, desglose por producto y llave/cuenta de pago. Incluye bloqueo inteligente para no cobrar jamás a alguien que ya renovó.',
    exampleTitle: 'Ejemplo real en operación:',
    exampleText:
      'Cada mañana a las 9:00 AM el bot notifica a los clientes que vencen hoy con su monto exacto y botón/instrucción de pago. Si el cliente ya pagó anoche, el sistema cruza las fechas y bloquea el cobro automáticamente.',
    bullets: [
      'Recordatorios configurables pre-vencimiento, día de corte y mora',
      'Desglose claro si un cliente maneja múltiples cuentas o pedidos',
      'Escudo anti-cobro indebido verificando renovaciones recientes'
    ],
    icon: Clock
  },
  {
    id: 'tickets',
    includedInBase: false,
    shortTitle: 'Ticketera Multiagente',
    title: 'Ticketera Multiasistente y Turnos',
    subtitle: 'Todo tu equipo comercial o de soporte atendiendo 1 único WhatsApp oficial',
    price: 35000,
    tag: '+$35.000 / mes',
    accent: 'indigo',
    description:
      'Cuando un cliente necesita atención humana o cierre complejo, entra a una cola ordenada con Turno #1, #2, #3... Tus asesores atienden desde una consola web sin compartir celulares ni pisarse conversaciones.',
    exampleTitle: 'Ejemplo real en operación:',
    exampleText:
      'Llegan 20 chats simultáneos en pauta. El sistema asigna turnos reales en vivo, reparte conversaciones entre 3 vendedores ("Mis Tickets") y registra resoluciones únicas reales por asesor al final del día.',
    bullets: [
      'Turnos consecutivos en vivo y tiempo estimado de atención',
      'Bandeja por asesor, reasignación y notas privadas internas',
      'Métricas reales deduplicadas por cliente atendido al día'
    ],
    icon: Ticket
  },
  {
    id: 'crm',
    includedInBase: false,
    shortTitle: 'Base de Datos CRM',
    title: 'Base de Datos CRM y Control de Clientes',
    subtitle: 'Búsquedas instantáneas, vencimientos y sincronización Excel / SQL',
    price: 25000,
    tag: '+$25.000 / mes',
    accent: 'sky',
    description:
      'Organiza toda tu cartera en un panel web ultrarrápido: consulta qué compró cada cliente, su fecha de vencimiento, historial de chats y stock disponible, con sincronización directa a Excel Online / OneDrive o MariaDB.',
    exampleTitle: 'Ejemplo real en operación:',
    exampleText:
      'Digitas los últimos dígitos del celular de un cliente (aunque en la base esté con +57 y espacios), ves al instante su historial completo, renuevas 30 días o liberas el cupo en 1 clic.',
    bullets: [
      'Buscador normalizado de teléfonos, nombres, correos y planes',
      'Tabla dinámica en tiempo real de stock y cupos disponibles',
      'Sincronización bidireccional Excel Online (Microsoft Graph) o base SQL'
    ],
    icon: Database
  },
  {
    id: 'accounting',
    includedInBase: false,
    shortTitle: 'Contabilidad & Caja',
    title: 'Contabilidad, Flujo de Caja y Analítica',
    subtitle: 'Control financiero diario en tiempo real con márgenes reales por producto',
    price: 30000,
    tag: '+$30.000 / mes',
    accent: 'teal',
    description:
      'Visualiza ingresos del día, pagos de renovaciones a proveedores, gastos operativos, costos por producto y utilidad neta real en tableros financieros listos para decidir sin hojas sueltas.',
    exampleTitle: 'Ejemplo real en operación:',
    exampleText:
      'Cada venta o renovación aprobada entra automática al flujo de caja diario. Al cierre del mes sabes exactamente cuánto vendiste, cuánto costó tu pauta o inventario y qué utilidad neta dejó cada línea.',
    bullets: [
      'Libro diario automático de ingresos y salidas por medio de pago',
      'Cálculo real de márgenes por producto y alertas de déficit',
      'Gráficos diarios, mensuales y comparativos de rentabilidad'
    ],
    icon: BarChart3
  },
  {
    id: 'rpa',
    includedInBase: false,
    shortTitle: 'RPA & Códigos 2FA',
    title: 'Automatización RPA y Entrega de Códigos 2FA',
    subtitle: 'Robots web que operan portales externos y leen códigos OTP al instante',
    price: 40000,
    tag: '+$40.000 / mes',
    accent: 'purple',
    description:
      'Si tu operación depende de entrar a portales web sin API o extraer códigos de verificación / OTP desde correos electrónicos, automatizamos todo el flujo para que el bot entregue la respuesta en segundos.',
    exampleTitle: 'Ejemplo real en operación:',
    exampleText:
      'Un cliente solicita su código de verificación o consulta de pedido. El robot inicia sesión de forma segura, lee el OTP vigente o el estado en el portal externo y lo entrega por WhatsApp en <15 segundos.',
    bullets: [
      'Lectura en tiempo real de códigos OTP / 2FA desde Gmail o IMAP',
      'Grabador de flujos RPA reutilizables sobre portales administrativos',
      'Logs de auditoría por cada ejecución automática'
    ],
    icon: Cpu
  }
];

export const formatCop = (val: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(val);

function ModuleLiveHud({ moduleId }: { moduleId: ModuleId }) {
  switch (moduleId) {
    case 'flows':
      return (
        <div className="bg-[#080F1D] border border-emerald-500/30 rounded-2xl p-4 space-y-3 font-sans">
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-300/90 border-b border-slate-800 pb-2">
            <span>● SIMULACIÓN WHATSAPP WEB • PTT NATIVO</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30">SIN REENVIADO</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 max-w-[82%] text-slate-200">
              Hola, ¿me explicas el combo de 3 y precios porfa?
            </div>
            <div className="ml-auto max-w-[88%] space-y-1.5">
              <div className="text-[10px] text-emerald-400 font-mono text-right animate-pulse">
                🎙️ grabando audio... (3.4s humano)
              </div>
              <div className="bg-teal-600/20 border border-teal-500/40 rounded-xl px-3 py-2 flex items-center gap-2.5 text-teal-100">
                <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-slate-950 shrink-0">
                  <Volume2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 flex items-center gap-0.5 h-5">
                  {[40, 75, 55, 95, 65, 85, 45, 90, 60, 80, 50, 70, 88, 42, 65].map((h, i) => (
                    <span
                      key={i}
                      className="flex-1 bg-teal-400/80 rounded-full"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-teal-300">0:40</span>
              </div>
              <div className="bg-teal-600/15 border border-teal-500/30 rounded-xl p-2 flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-teal-400/30 flex items-center justify-center text-xs font-bold text-teal-200">
                  IMG
                </div>
                <div className="text-[11px] text-slate-200">
                  <div className="font-semibold text-teal-300">Oferta_Combo_3.jpg</div>
                  <div className="text-slate-400">+ Texto con precio y envío gratis</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    case 'semi':
      return (
        <div className="bg-[#080F1D] border border-teal-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-mono text-teal-300 border-b border-slate-800 pb-2">
            <span>● CONTROL HÍBRIDO EN VIVO</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              👤 PAUSA AUTO: 30 MIN
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <div className="font-mono font-bold text-white">+57 312 ••• ••98</div>
              <div className="text-[11px] text-amber-300">Tú respondiste desde tu celular → Bot pausado</div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-300 font-semibold">
              Reactivar Auto
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono text-slate-400">⚡ DISPARO MANUAL CON 1 CLIC (SIN REENVIADO):</div>
            <div className="flex flex-wrap gap-1.5">
              {['01 Inicio', '07 Precio 3 tarros 🖼️', '02 Pedir datos', '38 Vigencia promo'].map(btn => (
                <span
                  key={btn}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/35 text-[11px] text-indigo-200 font-semibold"
                >
                  🎙️ {btn}
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    case 'ocr':
      return (
        <div className="bg-[#080F1D] border border-cyan-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300 border-b border-slate-800 pb-2">
            <span>● VISIÓN OCR BANCARIA • MODO OSCURO & BRE-V</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">VERIFICADO</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-[11px]">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-1">
              <div className="text-[10px] text-slate-500 font-mono">CAPTURA RECIBIDA</div>
              <div className="font-bold text-white">¡Transferencia Exitosa!</div>
              <div className="text-emerald-400 font-mono text-sm font-black">$89.900 COP</div>
              <div className="text-slate-400 text-[10px]">Bancolombia Modo Oscuro</div>
            </div>
            <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-2.5 space-y-1 font-mono text-[10px]">
              <div className="text-cyan-300 font-bold">EXTRACCIÓN JSON</div>
              <div className="text-slate-300">monto: <span className="text-emerald-300">89900</span></div>
              <div className="text-slate-300">banco: <span className="text-emerald-300">"Bancolombia"</span></div>
              <div className="text-slate-300">destino: <span className="text-emerald-300">OK ✓</span></div>
              <div className="text-slate-300">estado: <span className="text-emerald-300">"APROBADO"</span></div>
            </div>
          </div>
        </div>
      );
    case 'billing':
      return (
        <div className="bg-[#080F1D] border border-emerald-500/30 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-300 border-b border-slate-800 pb-2">
            <span>● MOTOR DE COBROS AUTOMÁTICOS</span>
            <span className="px-2 py-0.5 rounded bg-teal-500/15 text-teal-300">ESCUDO ANTI-COBRO ACTIVO</span>
          </div>
          <div className="space-y-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Andrea Gómez • Vence HOY</div>
                <div className="text-slate-400">Recordatorio enviado 9:00 AM ($30.000 + Bre-V)</div>
              </div>
              <span className="text-emerald-300 font-mono font-bold">ENVIADO</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Jorge Fonseca • Vigente 2027</div>
                <div className="text-emerald-300">Ya renovado — cobro bloqueado automáticamente</div>
              </div>
              <span className="text-amber-300 font-mono font-bold">PROTEGIDO</span>
            </div>
          </div>
        </div>
      );
    case 'tickets':
      return (
        <div className="bg-[#080F1D] border border-indigo-500/30 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-indigo-300 border-b border-slate-800 pb-2">
            <span>● TICKETERA MULTIASISTENTE EN TIEMPO REAL</span>
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-200">3 ASESORES EN LÍNEA</span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            {[
              { turn: '#04', user: 'Mateo R.', agent: 'Asesora Laura', state: 'En chat' },
              { turn: '#05', user: 'Camila P.', agent: 'Asesor Camilo', state: 'Esperando' },
              { turn: '#06', user: 'Diego V.', agent: 'Cola General', state: 'Turno asignado' }
            ].map(t => (
              <div key={t.turn} className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold">{t.turn}</span>
                  <span className="text-white font-semibold">{t.user}</span>
                </div>
                <span className="text-slate-400">{t.agent} • <strong className="text-emerald-300">{t.state}</strong></span>
              </div>
            ))}
          </div>
        </div>
      );
    case 'crm':
      return (
        <div className="bg-[#080F1D] border border-sky-500/30 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300">
            <Search className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-mono">3026281061</span>
            <span className="ml-auto text-[10px] text-sky-300">Match flexible +57 ✓</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-1.5">
            <div className="flex justify-between">
              <span className="font-bold text-white">Willington Canacue</span>
              <span className="text-emerald-300 font-semibold">ACTIVO • Vence 27 Dic</span>
            </div>
            <div className="text-slate-400">Servicio asignado • Sync Excel Online + MariaDB</div>
            <div className="flex gap-2 pt-1">
              <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300">Renovar +30d</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Historial completo</span>
            </div>
          </div>
        </div>
      );
    case 'accounting':
      return (
        <div className="bg-[#080F1D] border border-teal-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-mono text-teal-300 border-b border-slate-800 pb-2">
            <span>● FLUJO DE CAJA & RENTABILIDAD EN VIVO</span>
            <span className="text-emerald-300">UTILIDAD NETA</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400">Ingresos</div>
              <div className="text-xs font-black text-emerald-300">$4.850.000</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400">Egresos</div>
              <div className="text-xs font-black text-rose-300">$1.920.000</div>
            </div>
            <div className="p-2 rounded-xl bg-teal-500/15 border border-teal-500/30">
              <div className="text-[10px] text-teal-300">Utilidad Real</div>
              <div className="text-xs font-black text-white">$2.930.000</div>
            </div>
          </div>
          <div className="flex items-end gap-1.5 h-12 px-1">
            {[45, 62, 50, 78, 88, 70, 96].map((h, i) => (
              <div key={i} className="flex-1 bg-gradient-to-t from-teal-600/40 to-emerald-400/80 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      );
    case 'rpa':
      return (
        <div className="bg-[#080F1D] border border-purple-500/30 rounded-2xl p-4 space-y-2.5 font-mono text-[11px]">
          <div className="flex items-center justify-between text-[10px] text-purple-300 border-b border-slate-800 pb-2">
            <span>● MOTOR RPA & EXTRACTOR OTP 2FA</span>
            <span className="flex items-center gap-1 text-emerald-300"><Lock className="w-3 h-3" /> AUTO</span>
          </div>
          <div className="space-y-1 text-slate-300">
            <div><span className="text-purple-400">[15:40:02]</span> Cliente solicita código de acceso...</div>
            <div><span className="text-purple-400">[15:40:05]</span> Robot inicia sesión en portal / correo</div>
            <div><span className="text-emerald-400">[15:40:09]</span> Código extraído: <strong className="text-white bg-purple-500/30 px-1.5 py-0.5 rounded">971018</strong></div>
            <div><span className="text-teal-400">[15:40:10]</span> Entregado al cliente por WhatsApp ✓</div>
          </div>
        </div>
      );
  }
}

export function BotModulesShowcase({
  onNavigate,
  embedded = false,
  externalPlanId,
  externalAddons,
  syncVersion,
  onPlanChange,
  onAddonsChange
}: BotModulesProps) {
  const { getWaLink } = useWhatsAppContact();
  const [activeModId, setActiveModId] = useState<ModuleId>('ocr');
  const [selectedPlanId, setSelectedPlanId] = useState<BasePlanId>('pro');
  const [selectedAddons, setSelectedAddons] = useState<ModuleId[]>(['ocr']);

  useEffect(() => {
    if (syncVersion && syncVersion > 0) {
      if (externalPlanId) setSelectedPlanId(externalPlanId);
      if (externalAddons) setSelectedAddons(externalAddons);
    }
  }, [syncVersion, externalPlanId, externalAddons]);

  const addonModules = MODULES_CATALOG.filter(m => !m.includedInBase);
  const activeMod = MODULES_CATALOG.find(m => m.id === activeModId) || MODULES_CATALOG[2];

  const handleSelectPlan = (planId: BasePlanId) => {
    setSelectedPlanId(planId);
    onPlanChange?.(planId);
  };

  const toggleAddon = (id: ModuleId) => {
    const next = selectedAddons.includes(id)
      ? selectedAddons.filter(x => x !== id)
      : [...selectedAddons, id];
    setSelectedAddons(next);
    onAddonsChange?.(next);
  };

  const selectedPlan = BASE_PLANS.find(p => p.id === selectedPlanId) || BASE_PLANS[1];

  const pricing = useMemo(() => {
    const picked = addonModules.filter(m => selectedAddons.includes(m.id));
    const freeSlots = selectedPlan.includedAddonSlots;
    const includedPicked = picked.slice(0, freeSlots);
    const extraPicked = picked.slice(freeSlots);
    const addonsSubtotal = extraPicked.reduce((acc, item) => acc + item.price, 0);
    const hasBundleDiscount = extraPicked.length >= 3;
    const discountAmount = hasBundleDiscount ? Math.round(addonsSubtotal * 0.15) : 0;
    const totalMonthly = selectedPlan.price + addonsSubtotal - discountAmount;
    const remainingFreeSlots = Math.max(0, freeSlots - picked.length);
    return {
      picked,
      includedPicked,
      extraPicked,
      freeSlots,
      remainingFreeSlots,
      addonsSubtotal,
      hasBundleDiscount,
      discountAmount,
      totalMonthly
    };
  }, [selectedPlan, selectedAddons]);

  const handleRequestQuote = () => {
    const includedLines = pricing.includedPicked.map(a => `• ${a.title} (Incluido en plan — $0)`);
    const extraLines = pricing.extraPicked.map(a => `• ${a.title} (+${formatCop(a.price)})`);
    const allLines = [...includedLines, ...extraLines];
    const addonNames =
      allLines.length > 0
        ? allLines.join('\n')
        : '• Solo Plan Base (con Módulo Automejorable con IA incluido)';

    const msg =
      `Hola Sheerit! Vengo de ${embedded ? 'https://sheerit.co/software' : 'https://sheerit.co/modulos'} y quiero cotizar/activar mi suite:\n\n` +
      `📦 *Plan Base:* ${selectedPlan.name} (${selectedPlan.messages}) — ${formatCop(selectedPlan.price)}/mes\n` +
      `🧩 *Módulos seleccionados:*\n${addonNames}\n` +
      (pricing.hasBundleDiscount ? `🏷️ *Descuento combo 3+ módulos extras (15%):* -${formatCop(pricing.discountAmount)}\n` : '') +
      `\n💰 *Total mensual estimado:* ${formatCop(pricing.totalMonthly)} COP/mes`;

    window.open(getWaLink(msg), '_blank');
  };

  const ActiveIcon = activeMod.icon;

  return (
    <section
      id="modulos-bot"
      className="relative overflow-hidden bg-[#060B14] text-slate-100 py-16 md:py-24 border-y border-teal-500/20"
    >
      {/* Holographic Mesh 3D Atmospheric Backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none"
        style={{ backgroundImage: "url('/assets/software_suite_bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#050A12]/90 via-[#060B14]/65 to-[#050A12]/95 pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(45, 212, 191, 0.08) 1px, transparent 0)',
          backgroundSize: '28px 28px'
        }}
      />

      {/* Ambient glowing orbs */}
      <div className="absolute -top-32 left-1/4 w-[420px] h-[420px] bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/5 w-[380px] h-[380px] bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10 space-y-12">
        {/* Telemetry HUD Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-teal-500/35 text-[11px] font-mono text-teal-300 shadow-lg shadow-teal-950/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{embedded ? 'PASO 2 · INSPECCIONA Y ACTIVA TUS MÓDULOS' : 'WHATSAPP WEB ENGINE'}</span>
            <span className="text-slate-600">•</span>
            <span>SESIÓN REAL ANTI-BLOQUEO</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-300">ARQUITECTURA MODULAR</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Suite Tecnológica{' '}
            <span className="bg-gradient-to-r from-teal-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              Modular sobre tu mismo WhatsApp
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Empieza con tu bot desde <strong className="text-white">$10.000 o $30.000 COP/mes</strong> y enciende módulos avanzados solo cuando tu operación los pida: <strong className="text-teal-300">OCR de pagos bancarios</strong>, <strong className="text-cyan-300">Ticketera multiagente</strong>, <strong className="text-emerald-300">Cobros automáticos</strong>, <strong className="text-sky-300">CRM</strong>, <strong className="text-teal-300">Contabilidad</strong> y <strong className="text-indigo-300">RPA 2FA</strong>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            {!embedded && (
              <a
                href="#calculadora-modulos"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-teal-900/40"
              >
                <Zap className="w-4 h-4" /> Armar y cotizar mi Suite
              </a>
            )}
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('mibot')}
                className="px-5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-100 font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
              >
                <Bot className="w-4 h-4 text-teal-400" /> Abrir Panel Bot Studio (/mi-bot)
              </button>
            )}
          </div>
        </div>

        {/* Interactive Module Inspector */}
        <div className="bg-slate-900/75 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-800/80">
            <div className="text-xs font-mono text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              INSPECTOR INTERACTIVO DE MÓDULOS — Haz clic para ver simulación y activar en tu plan
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {pricing.freeSlots > 0 && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-500/15 border border-teal-400/40 text-teal-200">
                  Cupos gratis en {selectedPlan.name}: {pricing.includedPicked.length}/{pricing.freeSlots}
                  {pricing.remainingFreeSlots > 0 && ` · ¡Elige ${pricing.remainingFreeSlots} más sin costo!`}
                </span>
              )}
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                15% OFF automático en 3+ extras
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* Left Selector List */}
            <div className="lg:col-span-5 grid sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {MODULES_CATALOG.map(mod => {
                const Icon = mod.icon;
                const isActive = activeModId === mod.id;
                const isAdded = !mod.includedInBase && selectedAddons.includes(mod.id);
                const isIncludedFree = !mod.includedInBase && pricing.includedPicked.some(i => i.id === mod.id);
                const canTakeFree = !mod.includedInBase && !isAdded && pricing.remainingFreeSlots > 0;

                return (
                  <div
                    key={mod.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveModId(mod.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveModId(mod.id);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-500/20 via-slate-900 to-slate-900 border-teal-400/70 shadow-lg shadow-teal-950/40'
                        : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isActive
                            ? 'bg-teal-500/20 border-teal-400/50 text-teal-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs sm:text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                          {mod.shortTitle}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          {mod.includedInBase ? 'Incluido desde Plan Pro ($30k)' : `+${formatCop(mod.price)} / mes`}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {mod.includedInBase ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          PRO $30K+
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            toggleAddon(mod.id);
                          }}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition cursor-pointer ${
                            isIncludedFree
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 hover:bg-emerald-500/30'
                              : isAdded
                                ? 'bg-teal-500/20 text-teal-300 border-teal-400/50 hover:bg-teal-500/30'
                                : canTakeFree
                                  ? 'bg-cyan-500/10 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/20'
                                  : 'bg-slate-900 text-teal-300 border-slate-700 hover:border-teal-400/50'
                          }`}
                        >
                          {isIncludedFree
                            ? '✓ Incluido ($0)'
                            : isAdded
                              ? '✓ Agregado'
                              : canTakeFree
                                ? '+ Elegir gratis'
                                : '+ Agregar'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Detail + Live HUD Mockup */}
            <div className="lg:col-span-7 bg-slate-950/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/35 flex items-center justify-center text-teal-300 shrink-0">
                    <ActiveIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="inline-block text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 mb-1">
                      {activeMod.tag}
                    </span>
                    <h3 className="text-xl font-black text-white">{activeMod.title}</h3>
                    <p className="text-xs text-slate-400">{activeMod.subtitle}</p>
                  </div>
                </div>

                {!activeMod.includedInBase && (() => {
                  const activeIsAdded = selectedAddons.includes(activeMod.id);
                  const activeIsIncludedFree = pricing.includedPicked.some(i => i.id === activeMod.id);
                  const activeCanTakeFree = !activeIsAdded && pricing.remainingFreeSlots > 0;
                  return (
                    <button
                      type="button"
                      onClick={() => toggleAddon(activeMod.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                        activeIsIncludedFree
                          ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white'
                          : activeIsAdded
                            ? 'bg-teal-600 hover:bg-teal-500 border-teal-400 text-white'
                            : activeCanTakeFree
                              ? 'bg-slate-900 hover:bg-slate-800 border-emerald-400/50 text-emerald-300'
                              : 'bg-slate-900 hover:bg-slate-800 border-teal-500/40 text-teal-300'
                      }`}
                    >
                      {activeIsIncludedFree ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Incluido en tu plan ($0)
                        </>
                      ) : activeIsAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Agregado (+{formatCop(activeMod.price)})
                        </>
                      ) : activeCanTakeFree ? (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Elegir gratis en mi plan
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Agregar (+{formatCop(activeMod.price)})
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>

              {/* Live Visual HUD Preview */}
              <ModuleLiveHud moduleId={activeMod.id} />

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{activeMod.description}</p>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-teal-500/20 space-y-1">
                <div className="text-[11px] font-bold text-teal-300">{activeMod.exampleTitle}</div>
                <p className="text-xs text-slate-300 leading-relaxed">{activeMod.exampleText}</p>
              </div>

              <ul className="grid sm:grid-cols-1 gap-2">
                {activeMod.bullets.map(b => (
                  <li key={b} className="text-xs text-slate-300 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Interactive Calculator & Quote Builder (hidden when embedded in /software to avoid duplicate checkout) */}
        {!embedded && (
        <div
          id="calculadora-modulos"
          className="bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950/35 border border-teal-500/35 rounded-3xl p-6 sm:p-8 shadow-2xl"
        >
          <div className="grid lg:grid-cols-5 gap-6 items-start">
            <div className="lg:col-span-3 space-y-5">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-teal-300 uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4" /> Arma tu Suite Modular
                </div>
                <h3 className="text-2xl font-black text-white">Calcula tu mensualidad según los módulos que actives</h3>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300">1. Elige tu Plan Base de WhatsApp IA:</div>
                <div className="grid sm:grid-cols-3 gap-2.5">
                  {BASE_PLANS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPlan(p.id)}
                      className={`p-3 rounded-2xl border text-left transition ${
                        selectedPlanId === p.id
                          ? 'bg-teal-500/20 border-teal-400 text-white shadow-lg shadow-teal-950/40'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold">{p.name}</span>
                        {p.badge && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            TOP
                          </span>
                        )}
                      </div>
                      <div className="text-base font-black text-teal-300 mt-0.5">{formatCop(p.price)}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{p.messages}</div>
                      {p.includedAddonSlots > 0 && (
                        <div className="mt-1.5 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                          {p.includedAddonSlots === 1
                            ? '1 módulo a gusto incluido'
                            : `${p.includedAddonSlots} módulos a gusto incluidos`}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-300">
                    2. Marca los módulos avanzados que deseas encender (3+ extras = 15% OFF):
                  </div>
                  {pricing.freeSlots > 0 && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      Cupos incluidos en {selectedPlan.name}: {pricing.includedPicked.length}/{pricing.freeSlots}
                      {pricing.remainingFreeSlots > 0
                        ? ` · ¡Te quedan ${pricing.remainingFreeSlots} módulo(s) gratis por elegir!`
                        : ' · Cupo lleno'}
                    </span>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {addonModules.map(m => {
                    const checked = selectedAddons.includes(m.id);
                    const isIncludedFree = pricing.includedPicked.some(inc => inc.id === m.id);
                    const canTakeFreeSlot = !checked && pricing.remainingFreeSlots > 0;
                    return (
                      <label
                        key={m.id}
                        className={`flex items-center justify-between gap-2 p-3 rounded-xl border cursor-pointer text-xs transition ${
                          checked
                            ? 'bg-emerald-500/15 border-emerald-500/45 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAddon(m.id)}
                            className="accent-teal-400 w-4 h-4 shrink-0"
                          />
                          <span className="truncate font-semibold">{m.shortTitle}</span>
                        </span>
                        {isIncludedFree ? (
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shrink-0">
                            INCLUIDO ($0)
                          </span>
                        ) : canTakeFreeSlot ? (
                          <span className="font-mono text-[10px] text-teal-300 shrink-0">
                            Gratis en plan
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] text-emerald-300 shrink-0">+{formatCop(m.price)}</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Summary Panel */}
            <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-sm font-bold text-white">Cotización Mensual</span>
                <span className="text-[10px] font-mono text-teal-300">SIN CLÁUSULAS</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-200 font-semibold">
                  <span>{selectedPlan.name}</span>
                  <span className="font-mono">{formatCop(selectedPlan.price)}</span>
                </div>
                {selectedPlanId === 'scale' ? (
                  <div className="text-[11px] text-emerald-400 space-y-0.5">
                    <div>✓ Incluye todo lo del Plan Pro ($30k) + 2.000 Mensajes IA + Multiagente</div>
                    <div>✓ Incluye 3 módulos avanzados a gusto ($0)</div>
                  </div>
                ) : selectedPlanId === 'pro' ? (
                  <div className="text-[11px] text-emerald-400 space-y-0.5">
                    <div>✓ Incluye todo lo de Starter + Flujos Audio+Imagen + Modo Semiautomático 1 Clic</div>
                    <div>✓ Incluye 1 módulo avanzado a gusto ($0)</div>
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-400 space-y-0.5">
                    <div>✓ Incluye Módulo Automejorable con IA (Ajustes de Mejora en 1 clic)</div>
                    <div className="text-slate-400">• Sube a Pro ($30k) para tener Flujos Audio+Imagen y 1 módulo gratis</div>
                  </div>
                )}

                {pricing.includedPicked.map(item => (
                  <div key={item.id} className="flex justify-between text-emerald-300">
                    <span>✓ {item.shortTitle} (Incluido en plan)</span>
                    <span className="font-mono font-bold">$0</span>
                  </div>
                ))}

                {pricing.extraPicked.map(item => (
                  <div key={item.id} className="flex justify-between text-slate-400">
                    <span>+ {item.shortTitle}</span>
                    <span className="font-mono">{formatCop(item.price)}</span>
                  </div>
                ))}

                {pricing.hasBundleDiscount && (
                  <div className="flex justify-between text-emerald-300 font-semibold pt-1.5 border-t border-slate-800">
                    <span>Descuento combo 3+ módulos extras (15%)</span>
                    <span className="font-mono">-{formatCop(pricing.discountAmount)}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-baseline justify-between">
                <span className="text-xs font-semibold text-slate-400">Total mensual</span>
                <div className="text-right">
                  <div className="text-2xl font-black text-teal-300">{formatCop(pricing.totalMonthly)}</div>
                  <div className="text-[10px] text-slate-500">COP / mes • Actívalo sobre tu WhatsApp actual</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRequestQuote}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
              >
                <Send className="w-4 h-4" /> Activar esta configuración por WhatsApp
              </button>

              <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                ¿Ya tienes el Bot de $30.000? Los nuevos módulos se encienden directo sobre tu cuenta sin perder tus audios ni tu sesión.
              </p>
            </div>
          </div>
        </div>
        )}
      </div>
    </section>
  );
}

export function BotModulesLandingPage({ onNavigate }: { onNavigate?: (view: any) => void }) {
  return (
    <div className="min-h-screen bg-[#060B14] text-slate-100">
      <header className="sticky top-0 z-30 bg-[#060B14]/85 backdrop-blur border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight text-white">Sheerit Bot Studio & Suite</div>
              <div className="text-[11px] text-slate-400">Módulos avanzados sobre WhatsApp Web real</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigate && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('software')}
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 text-xs font-semibold text-slate-200"
                >
                  Ver Software Completo
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('mibot')}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white"
                >
                  Ir a Mi Bot
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:text-white text-xs text-slate-400 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Inicio
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <BotModulesShowcase onNavigate={onNavigate} embedded={false} />

      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5">
            <div className="font-bold text-teal-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Sesión Real WhatsApp Web
            </div>
            <p className="text-slate-400 leading-relaxed">
              Usamos sesión aislada en navegador real (la misma arquitectura probada en Sheerit) con pausas humanas y notas de voz frescas sin etiqueta de reenviado.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5">
            <div className="font-bold text-teal-300 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" /> Control Semiautomático
            </div>
            <p className="text-slate-400 leading-relaxed">
              Nunca pierdes el control de tus ventas: si escribes desde tu celular, el bot cede el turno automáticamente y solo retoma cuando tú decidas.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5">
            <div className="font-bold text-teal-300 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" /> Crecimiento sin Migrar
            </div>
            <p className="text-slate-400 leading-relaxed">
              Empieza desde $10.000 o $30.000/mes y enciende OCR, Cobros, Ticketera o Contabilidad cuando tu negocio lo pida.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
