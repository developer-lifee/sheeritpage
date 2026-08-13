export const DEMO_MODE_KEY = 'sheerit_demo_mode';

export const isDemoMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  const email = (localStorage.getItem('ticket_agent_email') || '').trim().toLowerCase();
  if (email === 'demo@sheerit.com.co' || email.includes('demo')) return true;
  return localStorage.getItem(DEMO_MODE_KEY) === 'true';
};

export const enableDemoMode = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DEMO_MODE_KEY, 'true');
  localStorage.setItem('ticket_agent_email', 'demo@sheerit.com.co');
  localStorage.setItem('ticket_agent_name', 'Asesor Demo Comercial');
  localStorage.setItem('ticket_agent_password', 'demo123');
};

export const disableDemoMode = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DEMO_MODE_KEY);
  localStorage.removeItem('ticket_agent_email');
  localStorage.removeItem('ticket_agent_name');
  localStorage.removeItem('ticket_agent_password');
};

// ==========================================
// DATASETS 100% SANITIZADOS Y SIMULADOS DE DEMOSTRACIÓN
// ==========================================

export const DEMO_TICKETS = [
  {
    userId: '573001234567@c.us',
    phone: '573001234567',
    nombre: 'Carlos Mendoza (Cliente Demo)',
    state: 'waiting_human',
    lastHumanInteraction: Date.now() - 3600000,
    agent: 'Asesor Demo Comercial',
    lastMessage: 'Hola, quisiera renovar mi suscripción de Netflix y consultar el paquete Combo.',
    lastMessageTime: Date.now() - 600000,
    lastMessageFromMe: false,
    queuePosition: 1,
    accounts: [
      { streaming: 'Netflix Ultra HD', correo: 'demo.cliente1@sheerit.com', nombrePerfil: 'Perfil 1' }
    ]
  },
  {
    userId: '573109876543@c.us',
    phone: '573109876543',
    nombre: 'Mariana Gómez (Demo)',
    state: 'waiting_human',
    lastHumanInteraction: Date.now() - 7200000,
    agent: null,
    lastMessage: 'Gracias por la atención. Ya envié el comprobante de pago por Nequi.',
    lastMessageTime: Date.now() - 1200000,
    lastMessageFromMe: false,
    queuePosition: 2,
    accounts: [
      { streaming: 'Disney+ Premium', correo: 'disney.demo@sheerit.com', nombrePerfil: 'Mariana' }
    ]
  },
  {
    userId: '573201122334@c.us',
    phone: '573201122334',
    nombre: 'Javier Ríos (Cliente Empresarial Demo)',
    state: 'resolved',
    lastHumanInteraction: Date.now() - 86400000,
    agent: 'Esteban Ávila',
    lastMessage: 'Excelente servicio. El bot de auto-entrega funcionó de inmediato.',
    lastMessageTime: Date.now() - 86400000,
    lastMessageFromMe: true,
    queuePosition: null,
    accounts: [
      { streaming: 'Spotify Family', correo: 'music.demo@sheerit.com', nombrePerfil: 'Familia Ríos' }
    ]
  },
  {
    userId: '573155544332@c.us',
    phone: '573155544332',
    nombre: 'Diana Marcela (Demo)',
    state: 'waiting_human',
    lastHumanInteraction: Date.now() - 1800000,
    agent: 'Carol Cubillos',
    lastMessage: '¿Tienen disponibilidad de cuentas Max (HBO) para entrega inmediata?',
    lastMessageTime: Date.now() - 900000,
    lastMessageFromMe: false,
    queuePosition: 3,
    accounts: []
  }
];

export const DEMO_MESSAGES: { [phone: string]: any[] } = {
  '573001234567': [
    { id: 'm1', body: 'Hola, buenas tardes.', isFromMe: false, timestamp: Date.now() - 3600000 },
    { id: 'm2', body: '¡Hola Carlos! Bienvenido a Sheerit. ¿En qué te podemos colaborar hoy?', isFromMe: true, timestamp: Date.now() - 3500000 },
    { id: 'm3', body: 'Hola, quisiera renovar mi suscripción de Netflix y consultar el paquete Combo.', isFromMe: false, timestamp: Date.now() - 600000 }
  ],
  '573109876543': [
    { id: 'm4', body: 'Hola, realicé la transferencia para Disney+.', isFromMe: false, timestamp: Date.now() - 2000000 },
    { id: 'm5', body: 'Gracias por la atención. Ya envié el comprobante de pago por Nequi.', isFromMe: false, timestamp: Date.now() - 1200000 }
  ]
};

export const DEMO_AGENTS = [
  { id: 101, username: 'esteban', fullname: 'Esteban Ávila', email: 'estebanavila182@outlook.com', role: 'admin', status: 'active', exclude_from_payroll: false },
  { id: 102, username: 'camilo', fullname: 'Camilo', email: 'camco08@hotmail.com', role: 'supervisor', status: 'active', exclude_from_payroll: false },
  { id: 103, username: 'carol', fullname: 'Carol Cubillos', email: 'carolcubillos03@outlook.es', role: 'agent', status: 'active', exclude_from_payroll: false },
  { id: 104, username: 'melissa', fullname: 'Melissa Aristizábal', email: 'yaristizabal948@gmail.com', role: 'trial', status: 'active', exclude_from_payroll: false },
  { id: 105, username: 'demo_user', fullname: 'Asesor Demo Comercial', email: 'demo@sheerit.com.co', role: 'admin', status: 'active', exclude_from_payroll: false }
];

export const DEMO_SCHEDULES = [
  { id: 1, day_of_week: 1, start_time: '08:00', end_time: '16:00', break_type: 'lunch_60', break_start: '12:00', fullname: 'Esteban Ávila', email: 'estebanavila182@outlook.com', role: 'admin' },
  { id: 2, day_of_week: 1, start_time: '14:00', end_time: '22:00', break_type: 'lunch_60', break_start: '18:00', fullname: 'Camilo', email: 'camco08@hotmail.com', role: 'supervisor' },
  { id: 3, day_of_week: 1, start_time: '09:00', end_time: '17:00', break_type: 'lunch_60', break_start: '13:00', fullname: 'Carol Cubillos', email: 'carolcubillos03@outlook.es', role: 'agent' }
];

export const DEMO_PAYROLL = [
  { agent_id: 101, fullname: 'Esteban Ávila', email: 'estebanavila182@outlook.com', role: 'admin', total_hours: 160, normal_hours: 160, trial_hours: 0, hourly_rate: 8333, bonuses: [], total_bonuses: 0, total_payment: 1333280, status: 'paid' },
  { agent_id: 102, fullname: 'Camilo', email: 'camco08@hotmail.com', role: 'supervisor', total_hours: 152, normal_hours: 152, trial_hours: 0, hourly_rate: 8333, bonuses: [{ id: 1, amount: 50000, reason: 'Bono desempeño', bonus_month: '2026-08' }], total_bonuses: 50000, total_payment: 1316616, status: 'draft' },
  { agent_id: 103, fullname: 'Carol Cubillos', email: 'carolcubillos03@outlook.es', role: 'agent', total_hours: 144, normal_hours: 144, trial_hours: 0, hourly_rate: 8333, bonuses: [], total_bonuses: 0, total_payment: 1199952, status: 'draft' }
];

export const DEMO_CUSTOMERS = [
  { id: 1, name: 'Carlos Mendoza (Demo)', phone: '+573001234567', email: 'carlos.demo@example.com', totalOrders: 12, totalSpent: 280000, status: 'Activo', lastPurchase: '2026-08-10' },
  { id: 2, name: 'Mariana Gómez (Demo)', phone: '+573109876543', email: 'mariana.demo@example.com', totalOrders: 5, totalSpent: 115000, status: 'Activo', lastPurchase: '2026-08-11' },
  { id: 3, name: 'Javier Ríos (Demo)', phone: '+573201122334', email: 'javier.demo@example.com', totalOrders: 28, totalSpent: 640000, status: 'VIP', lastPurchase: '2026-08-12' }
];

export const DEMO_SALES = [
  { id: 'ORD-1001', customer: 'Carlos Mendoza (Demo)', service: 'Combo Netflix + Disney+', amount: 45000, date: '2026-08-12', paymentMethod: 'Nequi', status: 'Completado' },
  { id: 'ORD-1002', customer: 'Mariana Gómez (Demo)', service: 'Max (HBO) 1 Mes', amount: 18000, date: '2026-08-12', paymentMethod: 'Bancolombia', status: 'Completado' },
  { id: 'ORD-1003', customer: 'Javier Ríos (Demo)', service: 'Spotify Family Anual', amount: 120000, date: '2026-08-11', paymentMethod: 'Nequi', status: 'Completado' }
];

export const DEMO_ACCOUNTING = {
  monthlyIncome: 14850000,
  monthlyExpenses: 4200000,
  netProfit: 10650000,
  activeSubscriptions: 412,
  retentionRate: '94.2%'
};

export const DEMO_RPA_BOTS = [
  { id: 'bot-01', name: 'Bot-01 Auto-Entrega Licencias (Demo)', status: 'active', cpuUsage: '14%', ramUsage: '280 MB', tasksCompletedToday: 142, lastRun: 'Hace 2 minutos' },
  { id: 'bot-02', name: 'Bot-02 Verificador Nequi & Bancolombia (Demo)', status: 'active', cpuUsage: '8%', ramUsage: '190 MB', tasksCompletedToday: 89, lastRun: 'Hace 5 minutos' },
  { id: 'bot-03', name: 'Bot-03 Recordatorios & Notificaciones (Demo)', status: 'active', cpuUsage: '5%', ramUsage: '150 MB', tasksCompletedToday: 215, lastRun: 'Hace 1 minuto' }
];
