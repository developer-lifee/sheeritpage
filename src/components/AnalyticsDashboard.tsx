import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { 
  Users, TrendingUp, Calendar, RefreshCcw, ArrowUpRight, ArrowDownRight, 
  DollarSign, Award, Heart, ShoppingBag, MousePointer, Activity, Eye, Share2, 
  Monitor, Tablet, Smartphone, Globe, Package, Box, CheckCircle2, AlertTriangle, 
  Layers, Search, ChevronDown, ChevronRight, Mail, Copy, Check, Filter, Sparkles 
} from 'lucide-react';
import { isDemoMode } from '../utils/demoMode';

interface ProfileSlot {
  rowNumber: number;
  nombre: string;
  apellido: string;
  whatsapp: string;
  pin: string;
  vencimiento: string;
  isLibre: boolean;
}

interface AccountItem {
  id: string;
  platform: string;
  email: string;
  vencimiento: string;
  total: number;
  ocupados: number;
  libres: number;
  occupancyRate: number;
  profiles: ProfileSlot[];
}

interface PlatformItem {
  platform: string;
  totalCupos: number;
  ocupados: number;
  libres: number;
  totalAccounts: number;
  accountsWithFreeCount: number;
  occupancyRate: number;
  accounts: AccountItem[];
}

interface FreeProfilesData {
  summary: {
    totalCupos: number;
    totalOcupados: number;
    totalLibres: number;
    occupancyRate: number;
    totalAccounts: number;
    accountsWithFree: number;
    exhaustedPlatforms: string[];
    criticalPlatforms: string[];
  };
  platforms: PlatformItem[];
  accounts: AccountItem[];
}

interface Stats {
  totalClients: number;
  byPlatform: Record<string, number>;
  byStatus: { active: number, expired: number, warning: number };
  expirations: { next7Days: number, next15Days: number, next30Days: number };
  historyTrend?: Array<{ name: string; ventas: number }>;
  newsCount: number;
  renewalsCount: number;
  churnedCount: number;
  financials: {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    trend: Array<{ name: string; ingresos: number; egresos: number; ganancias: number }>;
  };
  loyalty: {
    topPurchasers: Array<{ phone: string; name: string; count: number }>;
    topRenewals: Array<{ phone: string; name: string; count: number }>;
    topSpenders: Array<{ phone: string; name: string; count: number }>;
  };
}

interface TrafficStats {
  summary: {
    totalVisits: number;
    uniqueVisits: number;
    totalClicks: number;
  };
  deviceBreakdown: Array<{ name: string; value: number }>;
  topPages: Array<{ page: string; visits: number }>;
  clicksByPage: Array<{ page: string; clicks: number }>;
  visitsHistory: Array<{ date: string; count: number }>;
  topReferrers: Array<{ name: string; value: number }>;
}

interface ClickPoint {
  x_pct: number;
  y_pct: number;
  element_selector?: string;
  screen_width?: number;
  screen_height?: number;
}

const COLORS = ['#6366f1', '#10b981', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ec4899', '#f43f5e', '#3b82f6'];

export const AnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<string>('all_time');

  // Sub-tabs State
  const [subTab, setSubTab] = useState<'financial' | 'free_profiles' | 'traffic'>('financial');
  const [profilesData, setProfilesData] = useState<FreeProfilesData | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [searchProfilesTerm, setSearchProfilesTerm] = useState('');
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'free_only' | 'exhausted_only'>('all');
  const [viewMode, setViewMode] = useState<'platform_pivot' | 'accounts_table'>('platform_pivot');
  const [expandedPlatforms, setExpandedPlatforms] = useState<Record<string, boolean>>({});
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [trafficTimeframe, setTrafficTimeframe] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [trafficStats, setTrafficStats] = useState<TrafficStats | null>(null);
  const [loadingTraffic, setLoadingTraffic] = useState(false);
  const [selectedHeatmapPage, setSelectedHeatmapPage] = useState<string>('/');
  const [selectedDeviceFilter, setSelectedDeviceFilter] = useState<'all' | 'mobile' | 'desktop'>('all');
  const [heatmapClicks, setHeatmapClicks] = useState<ClickPoint[]>([]);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);
  const [elementClicks, setElementClicks] = useState<Array<{ element: string; total_clicks: number; mobile_clicks: number; desktop_clicks: number }>>([]);
  const [funnelData, setFunnelData] = useState<{ funnel: Array<{ step: string; count: number; pct: number }>; conversionRate: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fetchStats = async () => {
    setLoading(true);
    if (isDemoMode()) {
      setStats({
        totalClients: 412,
        byPlatform: { 'Netflix': 145, 'Disney+': 95, 'Spotify': 80, 'Max (HBO)': 52, 'YouTube': 40 },
        byStatus: { active: 380, expired: 12, warning: 20 },
        expirations: { next7Days: 8, next15Days: 14, next30Days: 25 },
        newsCount: 48,
        renewalsCount: 310,
        churnedCount: 12,
        financials: {
          totalIncome: 14850000,
          totalExpense: 4200000,
          netProfit: 10650000,
          trend: [
            { name: 'Mayo', ingresos: 12000000, egresos: 3500000, ganancias: 8500000 },
            { name: 'Junio', ingresos: 13500000, egresos: 3900000, ganancias: 9600000 },
            { name: 'Julio', ingresos: 14200000, egresos: 4100000, ganancias: 10100000 },
            { name: 'Agosto', ingresos: 14850000, egresos: 4200000, ganancias: 10650000 }
          ]
        },
        loyalty: {
          topPurchasers: [{ phone: '+57 300 *** 4567', name: 'Carlos Mendoza (Demo)', count: 12 }],
          topRenewals: [{ phone: '+57 310 *** 6543', name: 'Mariana Gómez (Demo)', count: 8 }],
          topSpenders: [{ phone: '+57 320 *** 2334', name: 'Javier Ríos (Demo)', count: 28 }]
        }
      });
      setLoading(false);
      return;
    }
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
    try {
      const res = await fetch(`${apiUrl}/api/admin/stats?timeframe=${timeframe}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrafficStats = async (tf = trafficTimeframe) => {
    setLoadingTraffic(true);
    if (isDemoMode()) {
      setTrafficStats({
        summary: { totalVisits: 14250, uniqueVisits: 8900, totalClicks: 34100 },
        deviceBreakdown: [{ name: 'Móvil', value: 68 }, { name: 'Escritorio', value: 32 }],
        topPages: [{ page: '/', visits: 9800 }, { page: '/portafolio', visits: 3200 }, { page: '/servicios', visits: 1250 }],
        clicksByPage: [{ page: '/', clicks: 22000 }, { page: '/portafolio', clicks: 8400 }],
        visitsHistory: [{ date: '2026-08-10', count: 1200 }, { date: '2026-08-11', count: 1450 }, { date: '2026-08-12', count: 1680 }],
        topReferrers: [{ name: 'Directo / WhatsApp', value: 55 }, { name: 'Google Search', value: 30 }, { name: 'Instagram', value: 15 }]
      });
      setLoadingTraffic(false);
      return;
    }
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
    try {
      const res = await fetch(`${apiUrl}/api/admin/visit-stats?timeframe=${tf}`);
      const data = await res.json();
      setTrafficStats(data);
    } catch (err) {
      console.error("Error fetching traffic stats:", err);
    } finally {
      setLoadingTraffic(false);
    }
  };

  const fetchHeatmapClicks = async (page: string, device: string = 'all', tf = trafficTimeframe) => {
    setLoadingHeatmap(true);
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
    try {
      const res = await fetch(`${apiUrl}/api/admin/click-heatmap?page=${encodeURIComponent(page)}&device=${device}&timeframe=${tf}`);
      const data = await res.json();
      setHeatmapClicks(data.clicks || []);
    } catch (err) {
      console.error("Error fetching heatmap clicks:", err);
    } finally {
      setLoadingHeatmap(false);
    }
  };

  const fetchElementClicks = async (tf = trafficTimeframe) => {
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
    try {
      const res = await fetch(`${apiUrl}/api/admin/element-clicks?timeframe=${tf}`);
      const data = await res.json();
      setElementClicks(data.elements || []);
    } catch (err) {
      console.error("Error fetching element clicks:", err);
    }
  };

  const fetchPurchaseFunnel = async (tf = trafficTimeframe) => {
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
    try {
      const res = await fetch(`${apiUrl}/api/admin/purchase-funnel?timeframe=${tf}`);
      const data = await res.json();
      setFunnelData(data);
    } catch (err) {
      console.error("Error fetching purchase funnel:", err);
    }
  };

  const fetchFreeProfiles = async () => {
    setLoadingProfiles(true);
    if (isDemoMode()) {
      setProfilesData({
        summary: {
          totalCupos: 1103,
          totalOcupados: 986,
          totalLibres: 117,
          occupancyRate: 89,
          totalAccounts: 254,
          accountsWithFree: 58,
          exhaustedPlatforms: ['CANVA', 'GPT', 'CLAUDE MAX X5', 'SPOTIFY OWNER'],
          criticalPlatforms: ['AMAZON', 'NETFLIX EXTRA', 'CLAUDE X2']
        },
        platforms: [
          {
            platform: 'NETFLIX',
            totalCupos: 160,
            ocupados: 157,
            libres: 3,
            totalAccounts: 32,
            accountsWithFreeCount: 3,
            occupancyRate: 98,
            accounts: [
              {
                id: 'NETFLIX__sheerstreaming@gmail.com',
                platform: 'NETFLIX',
                email: 'sheerstreaming@gmail.com',
                vencimiento: '2026-11-28',
                total: 5,
                ocupados: 4,
                libres: 1,
                occupancyRate: 80,
                profiles: [
                  { rowNumber: 10, nombre: 'Juan Pérez', apellido: '', whatsapp: '573001234567', pin: '1234', vencimiento: '2026-11-28', isLibre: false },
                  { rowNumber: 11, nombre: '', apellido: '', whatsapp: '', pin: '', vencimiento: '', isLibre: true }
                ]
              }
            ]
          }
        ],
        accounts: []
      });
      setLoadingProfiles(false);
      return;
    }

    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
    try {
      const res = await fetch(`${apiUrl}/api/admin/analytics/free-profiles`);
      const data = await res.json();
      setProfilesData(data);
    } catch (err) {
      console.error("Error fetching free profiles:", err);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleCopyEmail = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const togglePlatform = (plat: string) => {
    setExpandedPlatforms(prev => ({
      ...prev,
      [plat]: !prev[plat]
    }));
  };

  const toggleAccount = (accId: string) => {
    setExpandedAccounts(prev => ({
      ...prev,
      [accId]: !prev[accId]
    }));
  };

  useEffect(() => {
    fetchStats();
    fetchFreeProfiles();
  }, [timeframe]);

  useEffect(() => {
    if (subTab === 'free_profiles' && !profilesData) {
      fetchFreeProfiles();
    }
  }, [subTab]);

  useEffect(() => {
    if (subTab === 'traffic') {
      fetchTrafficStats();
      fetchHeatmapClicks(selectedHeatmapPage, selectedDeviceFilter);
      fetchElementClicks();
      fetchPurchaseFunnel();
    }
  }, [subTab, selectedHeatmapPage, selectedDeviceFilter]);

  // Heatmap rendering logic
  useEffect(() => {
    if (subTab !== 'traffic' || !canvasRef.current || heatmapClicks.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Paint clicks with radial gradients
    heatmapClicks.forEach(click => {
      // Coordinates are saved as percentages
      const x = (Number(click.x_pct) / 100) * canvas.width;
      const y = (Number(click.y_pct) / 100) * canvas.height;

      // Draw heat points
      const grad = ctx.createRadialGradient(x, y, 2, x, y, 16);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.9)');    // Red center
      grad.addColorStop(0.3, 'rgba(249, 115, 22, 0.6)');  // Orange
      grad.addColorStop(0.6, 'rgba(234, 179, 8, 0.35)');  // Yellow
      grad.addColorStop(1, 'rgba(234, 179, 8, 0)');       // Transparent outer
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, [heatmapClicks, subTab]);

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <RefreshCcw className="w-10 h-10 text-brand-primary animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse">Analizando base de datos en tiempo real...</p>
      </div>
    );
  }

  const platformData = Object.entries(stats.byPlatform).map(([name, value]) => ({ name, value }));
  
  const expirationData = [
    { name: '7 días', vences: stats.expirations.next7Days },
    { name: '15 días', vences: stats.expirations.next15Days },
    { name: '30 días', vences: stats.expirations.next30Days },
  ];

  const statusData = [
    { name: 'Activos', value: stats.byStatus.active, color: '#10b981' },
    { name: 'Próximos', value: stats.byStatus.warning, color: '#f59e0b' },
    { name: 'Vencidos', value: stats.byStatus.expired, color: '#ef4444' },
  ];

  const acquisitionData = [
    { name: 'Nuevos', value: stats.newsCount, color: '#6366f1' },
    { name: 'Renovaciones', value: stats.renewalsCount, color: '#10b981' },
  ];

  const renderPageMockup = () => {
    if (selectedHeatmapPage === '/') {
      return (
        <div className="relative w-full h-[520px] bg-slate-900 border border-gray-700 rounded-2xl overflow-hidden text-xs text-gray-400 select-none shadow-inner">
          {/* Mock Header */}
          <div className="h-[10%] bg-slate-800/90 border-b border-gray-750 flex items-center justify-between px-6">
            <div className="font-extrabold text-white tracking-wider flex items-center gap-1.5">
              <span className="w-3 h-3 bg-brand-primary rounded-full"></span>
              Sheerit
            </div>
            <div className="flex gap-4 font-semibold text-[10px]">
              <span className="text-indigo-400">Precios</span>
              <span>Soporte</span>
              <span>Verificar</span>
            </div>
            <div className="bg-brand-primary text-white px-3 py-1 rounded-full text-[9px] font-bold">Ingresar</div>
          </div>
          {/* Mock Hero */}
          <div className="h-[25%] bg-gradient-to-r from-indigo-950/70 to-purple-950/70 flex flex-col justify-center items-center text-center p-4">
            <div className="font-extrabold text-white text-sm mb-1 tracking-tight">Tu Entretenimiento al Mejor Precio</div>
            <div className="text-[9px] text-gray-300 max-w-xs leading-normal">Combina tus plataformas favoritas y ahorra hasta un 50% de forma garantizada</div>
          </div>
          {/* Mock Combo Cart */}
          <div className="h-[25%] bg-slate-900/40 border-y border-gray-800/60 flex items-center justify-center p-3">
            <div className="w-[90%] h-[90%] rounded-xl bg-slate-850/50 border border-indigo-500/20 border-dashed flex flex-col justify-center items-center gap-1">
              <div className="font-bold text-indigo-400 text-[11px] flex items-center gap-1">
                <ShoppingBag className="w-3 h-3 animate-bounce" /> Creador de Combo Personalizado
              </div>
              <div className="text-[8px] text-gray-500">Arrastra o añade tus plataformas de streaming aquí</div>
            </div>
          </div>
          {/* Mock Platform Catalog */}
          <div className="h-[20%] bg-slate-950/60 flex items-center justify-around px-4 gap-2">
            <div className="w-[22%] h-[75%] bg-slate-800 border border-gray-700/60 rounded-xl flex flex-col items-center justify-center font-bold text-[10px] text-white">Netflix</div>
            <div className="w-[22%] h-[75%] bg-slate-800 border border-gray-700/60 rounded-xl flex flex-col items-center justify-center font-bold text-[10px] text-white">Disney+</div>
            <div className="w-[22%] h-[75%] bg-slate-800 border border-gray-700/60 rounded-xl flex flex-col items-center justify-center font-bold text-[10px] text-white">HBO Max</div>
            <div className="w-[22%] h-[75%] bg-slate-800 border border-gray-700/60 rounded-xl flex flex-col items-center justify-center font-bold text-[10px] text-white">Spotify</div>
          </div>
          {/* Mock Reviews */}
          <div className="h-[12%] bg-slate-900 flex items-center justify-center">
            <div className="text-center font-bold text-emerald-400 text-[10px]">★★★★★ Opiniones de Clientes 100% Satisfechos</div>
          </div>
          {/* Mock Footer */}
          <div className="h-[8%] bg-slate-950 border-t border-gray-850 flex items-center justify-center text-[8px] text-gray-600">
            © 2026 Sheerit Inc. Hecho en Colombia con amor.
          </div>
          
          {/* Heatmap Canvas */}
          <canvas 
            ref={canvasRef} 
            width={700} 
            height={520} 
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
          />
        </div>
      );
    }
    
    if (selectedHeatmapPage === '/aiuda') {
      return (
        <div className="relative w-full h-[520px] bg-slate-900 border border-gray-700 rounded-2xl overflow-hidden text-xs text-gray-400 select-none shadow-inner">
          {/* Mock Header */}
          <div className="h-[10%] bg-slate-800/90 border-b border-gray-750 flex items-center justify-between px-6">
            <div className="font-extrabold text-white">Sheerit Ayuda</div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-lg">Soporte 24/7</span>
          </div>
          {/* Mock Search */}
          <div className="h-[15%] bg-indigo-950/30 flex items-center justify-center px-6">
            <div className="w-full max-w-sm h-8 bg-slate-800 border border-gray-700 rounded-xl px-3 flex items-center text-[10px] text-gray-500">
              ¿Cuál es tu inconveniente? (ej: "cambiar clave", "2fa")...
            </div>
          </div>
          {/* Mock Content */}
          <div className="h-[65%] bg-slate-900 flex gap-4 p-4">
            <div className="w-1/3 bg-slate-850/60 rounded-xl p-2.5 flex flex-col gap-1.5 text-[9px] border border-gray-800">
              <div className="font-bold text-white mb-1">Categorías de Falla</div>
              <div className="bg-brand-primary text-white p-1 rounded font-bold">Netflix Caído</div>
              <div className="p-1 hover:bg-slate-800 rounded">Error de PIN</div>
              <div className="p-1 hover:bg-slate-800 rounded">Cambio de Perfil</div>
            </div>
            <div className="w-2/3 bg-slate-850 rounded-xl p-4 flex flex-col gap-2 border border-gray-800">
              <div className="font-bold text-white text-sm">Paso a paso para Solucionar Netflix</div>
              <div className="h-2 bg-slate-800 rounded w-2/3"></div>
              <div className="h-2 bg-slate-800 rounded w-1/2"></div>
              <div className="h-2 bg-slate-800 rounded w-4/5"></div>
              <div className="mt-auto h-9 bg-emerald-600/90 text-white rounded-xl flex items-center justify-center font-bold text-[10px] shadow-lg shadow-emerald-950/30">
                Reportar e Iniciar Chat por WhatsApp
              </div>
            </div>
          </div>
          {/* Mock Footer */}
          <div className="h-[10%] bg-slate-950 border-t border-gray-850 flex items-center justify-center text-[9px] text-gray-600">
            ¿No encuentras la solución? Contacto de soporte inmediato.
          </div>

          {/* Heatmap Canvas */}
          <canvas 
            ref={canvasRef} 
            width={700} 
            height={520} 
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
          />
        </div>
      );
    }

    // Default fallback mock
    return (
      <div className="relative w-full h-[520px] bg-slate-900 border border-gray-700 rounded-2xl overflow-hidden text-xs text-gray-400 select-none flex flex-col shadow-inner">
        <div className="h-[10%] bg-slate-800 border-b border-gray-750 flex items-center px-6 justify-between">
          <span className="font-bold text-white">Sheerit CMS</span>
          <span className="text-[10px] text-indigo-400 font-mono">Página: {selectedHeatmapPage}</span>
        </div>
        <div className="flex-grow flex items-center justify-center p-8 text-center bg-slate-900/60">
          <div className="space-y-4 max-w-sm">
            <div className="font-extrabold text-white text-base">Bloque de Contenido General</div>
            <div className="text-[10px] text-gray-400 leading-normal">
              Esta sección simula el layout responsive de la ruta seleccionada. Los clics registrados por tus usuarios se renderizan en tiempo real sobre el plano.
            </div>
            <div className="flex justify-center gap-3">
              <div className="w-28 h-20 bg-slate-800 rounded-xl border border-gray-700/60 flex items-center justify-center font-semibold text-[10px]">Formulario</div>
              <div className="w-28 h-20 bg-slate-800 rounded-xl border border-gray-700/60 flex items-center justify-center font-semibold text-[10px]">Botón Enviar</div>
            </div>
          </div>
        </div>
        <div className="h-[10%] bg-slate-950 border-t border-gray-850 flex items-center justify-center text-[8px] text-gray-600">
          Sheerit Web Monitoring Engine
        </div>

        {/* Heatmap Canvas */}
        <canvas 
          ref={canvasRef} 
          width={700} 
          height={520} 
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />
      </div>
    );
  };

  // Filter platforms and accounts for dynamic pivot
  const filteredPlatforms = (profilesData?.platforms || []).map(p => {
    const matchPlatSearch = p.platform.toLowerCase().includes(searchProfilesTerm.toLowerCase());
    const matchingAccounts = p.accounts.filter(acc => {
      const matchEmail = acc.email.toLowerCase().includes(searchProfilesTerm.toLowerCase());
      const matchesSearch = matchPlatSearch || matchEmail;
      if (!matchesSearch) return false;

      if (filterAvailability === 'free_only') return acc.libres > 0;
      if (filterAvailability === 'exhausted_only') return acc.libres === 0;
      return true;
    });

    return {
      ...p,
      matchingAccounts
    };
  }).filter(p => {
    if (filterAvailability === 'free_only') return p.libres > 0 && p.matchingAccounts.length > 0;
    if (filterAvailability === 'exhausted_only') return p.libres === 0 && p.matchingAccounts.length > 0;
    return p.matchingAccounts.length > 0;
  });

  const filteredFlatAccounts = (profilesData?.accounts || []).filter(acc => {
    const matchPlat = acc.platform.toLowerCase().includes(searchProfilesTerm.toLowerCase());
    const matchEmail = acc.email.toLowerCase().includes(searchProfilesTerm.toLowerCase());
    if (!matchPlat && !matchEmail) return false;

    if (filterAvailability === 'free_only') return acc.libres > 0;
    if (filterAvailability === 'exhausted_only') return acc.libres === 0;
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Sub-Tabs Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border dark:border-gray-700 gap-4">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto p-1 bg-gray-100 dark:bg-gray-900 rounded-xl">
          <button
            onClick={() => setSubTab('financial')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${subTab === 'financial' ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            Métricas de Negocio y Financieras
          </button>
          <button
            onClick={() => {
              setSubTab('free_profiles');
              if (!profilesData) fetchFreeProfiles();
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${subTab === 'free_profiles' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            <Package className="w-3.5 h-3.5" /> Dinámica de Perfiles Libres (Stock)
            {profilesData && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${subTab === 'free_profiles' ? 'bg-emerald-800 text-white' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'}`}>
                {profilesData.summary.totalLibres}
              </span>
            )}
          </button>
          <button
            onClick={() => setSubTab('traffic')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${subTab === 'traffic' ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            Tráfico y Mapas de Calor (Heatmaps)
          </button>
        </div>
        
        {subTab === 'financial' && (
          <div className="flex items-center gap-3 w-full sm:w-auto px-2">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full sm:w-48 px-3 py-1.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs font-semibold"
            >
              <option value="all_time">Todo el histórico</option>
              <option value="this_month">Este Mes</option>
              <option value="last_30_days">Últimos 30 días</option>
              <option value="last_6_months">Últimos 6 meses</option>
            </select>
            <button
              onClick={fetchStats}
              className="p-1.5 bg-gray-150 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 rounded-xl transition-all"
              title="Refrescar Estadísticas"
            >
              <RefreshCcw className="w-4 h-4 dark:text-white" />
            </button>
          </div>
        )}

        {subTab === 'free_profiles' && (
          <div className="flex items-center gap-3 w-full sm:w-auto px-2">
            <button
              onClick={fetchFreeProfiles}
              disabled={loadingProfiles}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
              title="Sincronizar Stock en tiempo real desde Excel Online"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${loadingProfiles ? 'animate-spin' : ''}`} />
              <span>{loadingProfiles ? 'Sincronizando...' : 'Sincronizar Stock'}</span>
            </button>
          </div>
        )}
      </div>

      {subTab === 'financial' ? (
        <>
          {/* KPI Cards: General & Financial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Clientes Activos</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold dark:text-white">{stats.totalClients}</div>
              <div className="text-[11px] text-green-500 mt-1 font-medium flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> Suscriptores vigentes
              </div>
            </div>

            <div 
              onClick={() => {
                setSubTab('free_profiles');
                if (!profilesData) fetchFreeProfiles();
              }}
              className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-emerald-500/30 cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all group"
              title="Click para ver la Dinámica de Perfiles Libres por Cuenta"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Perfiles Libres</span>
                <Package className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {profilesData ? `${profilesData.summary.totalLibres} cupos` : '...'}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center justify-between">
                <span>{profilesData ? `${profilesData.summary.accountsWithFree} cuentas` : 'Ver stock'}</span>
                <span className="text-indigo-500 dark:text-indigo-400 font-bold flex items-center group-hover:underline">
                  Dinámica <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Ingresos de Caja</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                ${stats.financials.totalIncome.toLocaleString('es-CO')}
              </div>
              <div className="text-[11px] text-emerald-500 mt-1 font-medium flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> Recaudo acumulado
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Costos / Egresos</span>
                <DollarSign className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                ${stats.financials.totalExpense.toLocaleString('es-CO')}
              </div>
              <div className="text-[11px] text-red-500 mt-1 font-medium flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3" /> Gastos del periodo
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Utilidad Neta</span>
                <DollarSign className="w-4 h-4 text-indigo-500" />
              </div>
              <div className={`text-2xl font-bold ${stats.financials.netProfit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
                ${stats.financials.netProfit.toLocaleString('es-CO')}
              </div>
              <div className="text-[11px] text-indigo-500 mt-1 font-medium flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> Rendimiento de caja
              </div>
            </div>
          </div>

          {/* Financial Trend / Breakdown Chart */}
          {stats.financials.trend && stats.financials.trend.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
              <h3 className="text-base font-bold mb-4 dark:text-white">Flujo de Caja Mensual (Ingresos vs Egresos vs Ganancia Neta)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.financials.trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                      formatter={(value: any) => [`$${value.toLocaleString('es-CO')}`, '']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    />
                    <Legend />
                    <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="egresos" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ganancias" name="Ganancia Neta" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Grid: Acquisition & Platforms */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Customer Acquisition (New vs Renewal) Donut */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
              <h3 className="text-lg font-bold mb-6 dark:text-white">Adquisición vs. Retención (Nuevos vs. Renovaciones)</h3>
              <div className="h-64 flex flex-col sm:flex-row items-center justify-around gap-4">
                <div className="w-full sm:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={acquisitionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {acquisitionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {acquisitionData.map((d, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                      <div>
                        <span className="block text-sm font-semibold text-gray-700 dark:text-white">{d.name}</span>
                        <span className="text-xs text-gray-400">{d.value} clientes ({Math.round((d.value / (stats.totalClients || 1)) * 100)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Platform Popularity Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
              <h3 className="text-lg font-bold mb-6 dark:text-white">Plataformas más Populares</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {platformData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Grid: Expirations Forecast & Sales Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
              <h3 className="text-lg font-bold mb-6 dark:text-white">Pronóstico de Vencimientos</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expirationData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="vences" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {stats.historyTrend && stats.historyTrend.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
                <h3 className="text-lg font-bold mb-6 dark:text-white">Tendencia Histórica de Ventas / Renovaciones</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.historyTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                      <Line type="monotone" dataKey="ventas" name="Ventas / Renovaciones" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* CLIENT FIDELITY / LOYALTY LEADERBOARDS */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 space-y-6">
            <div className="border-b dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                <Award className="w-6 h-6 text-brand-primary animate-pulse" /> Fidelización y Clientes Destacados
              </h3>
              <p className="text-xs text-gray-400">Identifica a tus mejores clientes históricos en base a compras, renovaciones y gasto total.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-indigo-500" /> Mayor Diversidad de Cuentas
                </h4>
                <div className="space-y-2">
                  {stats.loyalty.topPurchasers.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Sin datos disponibles.</p>
                  ) : (
                    stats.loyalty.topPurchasers.map((user, idx) => (
                      <div key={user.phone} className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 dark:bg-gray-850/50 border dark:border-gray-750 text-xs">
                        <div>
                          <span className="font-extrabold text-gray-700 dark:text-gray-300 block">{idx + 1}. {user.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{user.phone}</span>
                        </div>
                        <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-extrabold px-2.5 py-1 rounded-lg">
                          {user.count} plts
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-emerald-500" /> Clientes más Recurrentes
                </h4>
                <div className="space-y-2">
                  {stats.loyalty.topRenewals.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Sin datos disponibles.</p>
                  ) : (
                    stats.loyalty.topRenewals.map((user, idx) => (
                      <div key={user.phone} className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 dark:bg-gray-850/50 border dark:border-gray-750 text-xs">
                        <div>
                          <span className="font-extrabold text-gray-700 dark:text-gray-300 block">{idx + 1}. {user.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{user.phone}</span>
                        </div>
                        <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-extrabold px-2.5 py-1 rounded-lg">
                          {user.count} renov.
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-indigo-500" /> Clientes de Mayor Valor (VIP)
                </h4>
                <div className="space-y-2">
                  {stats.loyalty.topSpenders.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Sin datos disponibles.</p>
                  ) : (
                    stats.loyalty.topSpenders.map((user, idx) => (
                      <div key={user.phone} className="flex justify-between items-center p-3 rounded-xl bg-gray-50/50 dark:bg-gray-850/50 border dark:border-gray-750 text-xs">
                        <div>
                          <span className="font-extrabold text-gray-700 dark:text-gray-300 block">{idx + 1}. {user.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{user.phone}</span>
                        </div>
                        <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-extrabold px-2.5 py-1 rounded-lg">
                          ${user.count.toLocaleString('es-CO')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Health Indicator */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
            <h3 className="text-lg font-bold mb-6 dark:text-white">Estado de Salud de la Suscripción</h3>
            <div className="flex flex-col sm:flex-row gap-6">
              {statusData.map((s, i) => (
                <div key={i} className="flex-grow">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{s.name}</span>
                    <span className="text-sm font-bold dark:text-white">{s.value} clientes</span>
                  </div>
                  <div className="w-full bg-gray-150 dark:bg-gray-750 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000" 
                      style={{ width: `${(s.value / stats.totalClients) * 100}%`, backgroundColor: s.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : subTab === 'free_profiles' ? (
        /* FREE PROFILES DYNAMIC PIVOT SUB-TAB CONTENT */
        <div className="space-y-6 animate-in fade-in duration-500">
          {loadingProfiles || !profilesData ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700">
              <RefreshCcw className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium animate-pulse">
                Calculando tabla dinámica de perfiles libres en inventario Excel...
              </p>
            </div>
          ) : (
            <>
              {/* TOP KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1: Perfiles Libres Totales */}
                <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-emerald-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-600 dark:text-emerald-400">
                      Perfiles Libres (Stock)
                    </span>
                    <span className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                      <Package className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="text-3xl font-black text-gray-900 dark:text-white">
                    {profilesData.summary.totalLibres} <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">cupos</span>
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Disponibles para entrega inmediata</span>
                  </div>
                </div>

                {/* 2: Cuentas con Disponibilidad */}
                <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-blue-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-blue-600 dark:text-blue-400">
                      Cuentas con Disponibilidad
                    </span>
                    <span className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                      <Box className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="text-3xl font-black text-gray-900 dark:text-white">
                    {profilesData.summary.accountsWithFree} <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">/ {profilesData.summary.totalAccounts}</span>
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-2 flex items-center gap-1">
                    <span>{Math.round((profilesData.summary.accountsWithFree / (profilesData.summary.totalAccounts || 1)) * 100)}% de cuentas tienen cupo libre</span>
                  </div>
                </div>

                {/* 3: Total Cupos en Inventario */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-gray-500 dark:text-gray-400">
                      Ocupación Total Matriz
                    </span>
                    <span className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl">
                      <Users className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="text-3xl font-black text-gray-900 dark:text-white">
                    {profilesData.summary.occupancyRate}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-2">
                    {profilesData.summary.totalOcupados} ocupados de {profilesData.summary.totalCupos} totales
                  </div>
                </div>

                {/* 4: Stock Agotado o Crítico */}
                <div className={`p-6 rounded-2xl shadow-sm border ${profilesData.summary.exhaustedPlatforms.length > 0 ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-500/30' : 'bg-white dark:bg-gray-800 dark:border-gray-700'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase font-extrabold tracking-wider text-rose-600 dark:text-rose-400">
                      Plataformas Agotadas
                    </span>
                    <span className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
                      <AlertTriangle className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
                    {profilesData.summary.exhaustedPlatforms.length} <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">sin stock</span>
                  </div>
                  <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-2 truncate" title={profilesData.summary.exhaustedPlatforms.join(', ')}>
                    {profilesData.summary.exhaustedPlatforms.length > 0 ? profilesData.summary.exhaustedPlatforms.slice(0, 3).join(', ') + (profilesData.summary.exhaustedPlatforms.length > 3 ? '...' : '') : 'Ninguna agotada'}
                  </div>
                </div>
              </div>

              {/* FILTROS Y CONTROLES */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border dark:border-gray-700 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchProfilesTerm}
                    onChange={(e) => setSearchProfilesTerm(e.target.value)}
                    placeholder="Buscar por plataforma (ej: Netflix, Amazon, Disney) o por correo de cuenta..."
                    className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-250 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  {searchProfilesTerm && (
                    <button
                      onClick={() => setSearchProfilesTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl overflow-x-auto">
                  <button
                    onClick={() => setFilterAvailability('all')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${filterAvailability === 'all' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                  >
                    Todas ({profilesData.platforms.length})
                  </button>
                  <button
                    onClick={() => setFilterAvailability('free_only')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-1 ${filterAvailability === 'free_only' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'}`}
                  >
                    🟢 Con Stock ({profilesData.platforms.filter(p => p.libres > 0).length})
                  </button>
                  <button
                    onClick={() => setFilterAvailability('exhausted_only')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-1 ${filterAvailability === 'exhausted_only' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'}`}
                  >
                    🔴 Agotadas ({profilesData.platforms.filter(p => p.libres === 0).length})
                  </button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl">
                  <button
                    onClick={() => setViewMode('platform_pivot')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${viewMode === 'platform_pivot' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    title="Vista Dinámica agrupada por plataforma"
                  >
                    <Layers className="w-3.5 h-3.5" /> Dinámica
                  </button>
                  <button
                    onClick={() => setViewMode('accounts_table')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${viewMode === 'accounts_table' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    title="Vista Plana de todas las cuentas"
                  >
                    <Users className="w-3.5 h-3.5" /> Cuentas
                  </button>
                </div>
              </div>

              {/* VISTA 1: TABLA DINÁMICA POR PLATAFORMA */}
              {viewMode === 'platform_pivot' ? (
                <div className="space-y-4">
                  {filteredPlatforms.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 p-12 text-center rounded-2xl border dark:border-gray-700">
                      <Package className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-200">No se encontraron plataformas con los filtros seleccionados.</p>
                      <button
                        onClick={() => { setSearchProfilesTerm(''); setFilterAvailability('all'); }}
                        className="mt-3 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                      >
                        Limpiar Filtros
                      </button>
                    </div>
                  ) : (
                    filteredPlatforms.map((plat) => {
                      const isExpanded = !!expandedPlatforms[plat.platform];
                      return (
                        <div 
                          key={plat.platform} 
                          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:border-gray-300 dark:hover:border-gray-650"
                        >
                          {/* PLATFORM HEADER */}
                          <div 
                            onClick={() => togglePlatform(plat.platform)}
                            className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-750/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <button className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 transition-transform">
                                {isExpanded ? <ChevronDown className="w-5 h-5 text-emerald-500" /> : <ChevronRight className="w-5 h-5" />}
                              </button>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-sm sm:text-base text-gray-900 dark:text-white tracking-wide">
                                    {plat.platform}
                                  </span>
                                  {plat.libres > 2 ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                      🟢 {plat.libres} LIBRES
                                    </span>
                                  ) : plat.libres > 0 ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                      🟡 {plat.libres} LIBRES (CRÍTICO)
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                                      🔴 AGOTADO (0 LIBRES)
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2">
                                  <span>{plat.totalAccounts} cuentas registradas</span>
                                  <span>•</span>
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{plat.accountsWithFreeCount} con stock disponible</span>
                                </div>
                              </div>
                            </div>

                            {/* OCCUPANCY BAR & STATS */}
                            <div className="w-full sm:w-72 flex flex-col gap-1.5 self-stretch sm:self-auto">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-gray-500 dark:text-gray-400">
                                  {plat.ocupados} / {plat.totalCupos} cupos ocupados
                                </span>
                                <span className="font-black text-gray-800 dark:text-gray-200">
                                  {plat.occupancyRate}%
                                </span>
                              </div>
                              <div className="w-full h-2.5 bg-gray-150 dark:bg-gray-700 rounded-full overflow-hidden flex">
                                <div 
                                  className="h-full bg-indigo-500 transition-all duration-500" 
                                  style={{ width: `${plat.occupancyRate}%` }}
                                />
                                <div 
                                  className="h-full bg-emerald-500 transition-all duration-500" 
                                  style={{ width: `${100 - plat.occupancyRate}%` }}
                                />
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-gray-400">
                                <span>Ocupados: {plat.ocupados}</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Libres: {plat.libres}</span>
                              </div>
                            </div>
                          </div>

                          {/* PLATFORM ACCOUNTS BREAKDOWN */}
                          {isExpanded && (
                            <div className="border-t border-gray-150 dark:border-gray-700/60 bg-gray-50/70 dark:bg-gray-900/40 p-4 sm:p-5 space-y-3">
                              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Cuentas de {plat.platform} ({plat.matchingAccounts.length} cuentas)
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                {plat.matchingAccounts.map((acc) => {
                                  const isAccExpanded = !!expandedAccounts[acc.id];
                                  return (
                                    <div 
                                      key={acc.id}
                                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 shadow-sm space-y-2.5"
                                    >
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                          <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white font-mono break-all">
                                            {acc.email}
                                          </span>
                                          <button
                                            onClick={(e) => handleCopyEmail(acc.email, e)}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 transition-colors"
                                            title="Copiar correo"
                                          >
                                            {copiedEmail === acc.email ? (
                                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                                            ) : (
                                              <Copy className="w-3.5 h-3.5" />
                                            )}
                                          </button>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          {acc.vencimiento && (
                                            <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-lg">
                                              Vence: {acc.vencimiento}
                                            </span>
                                          )}
                                          {acc.libres > 0 ? (
                                            <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                                              {acc.libres} LIBRE{acc.libres > 1 ? 'S' : ''} ({acc.ocupados}/{acc.total})
                                            </span>
                                          ) : (
                                            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-gray-150 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                              Completa ({acc.total}/{acc.total})
                                            </span>
                                          )}
                                          <button
                                            onClick={() => toggleAccount(acc.id)}
                                            className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors flex items-center gap-1"
                                          >
                                            {isAccExpanded ? 'Ocultar perfiles' : 'Ver perfiles'}
                                            {isAccExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                          </button>
                                        </div>
                                      </div>

                                      {/* ACC PROFILE SLOTS */}
                                      {isAccExpanded && (
                                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                          <div className="text-[11px] font-semibold text-gray-400 mb-2">
                                            Cupos / Perfiles de la Cuenta:
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                            {acc.profiles.map((pSlot, sIdx) => (
                                              <div 
                                                key={sIdx}
                                                className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between gap-1 transition-all ${
                                                  pSlot.isLibre 
                                                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500/30' 
                                                    : 'bg-gray-50 dark:bg-gray-850/60 border-gray-200 dark:border-gray-750'
                                                }`}
                                              >
                                                <div className="flex items-center justify-between">
                                                  <span className="text-[10px] font-mono text-gray-400">
                                                    Fila #{pSlot.rowNumber}
                                                  </span>
                                                  {pSlot.isLibre ? (
                                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                      ✨ LIBRE
                                                    </span>
                                                  ) : (
                                                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                                      Ocupado
                                                    </span>
                                                  )}
                                                </div>

                                                <div className="font-extrabold text-gray-800 dark:text-gray-200 truncate">
                                                  {pSlot.isLibre ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                                      Disponible para venta
                                                    </span>
                                                  ) : (
                                                    `${pSlot.nombre} ${pSlot.apellido}`.trim() || 'Cliente sin nombre'
                                                  )}
                                                </div>

                                                {!pSlot.isLibre && (
                                                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono mt-0.5">
                                                    <span>{pSlot.whatsapp || 'Sin WhatsApp'}</span>
                                                    {pSlot.pin && <span>PIN: {pSlot.pin}</span>}
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                /* VISTA 2: LISTA PLANA DE TODAS LAS CUENTAS */
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-4 py-3">Plataforma</th>
                          <th className="px-4 py-3">Cuenta Maestra (Correo)</th>
                          <th className="px-4 py-3">Vencimiento</th>
                          <th className="px-4 py-3 text-center">Cupos Totales</th>
                          <th className="px-4 py-3 text-center">Ocupados</th>
                          <th className="px-4 py-3 text-center">Libres</th>
                          <th className="px-4 py-3 text-center">Ocupación</th>
                          <th className="px-4 py-3 text-center">Detalle</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150 dark:divide-gray-700">
                        {filteredFlatAccounts.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                              No hay cuentas que coincidan con la búsqueda.
                            </td>
                          </tr>
                        ) : (
                          filteredFlatAccounts.map((acc) => {
                            const isAccExpanded = !!expandedAccounts[acc.id];
                            return (
                              <React.Fragment key={acc.id}>
                                <tr className="hover:bg-gray-50/60 dark:hover:bg-gray-750/30 transition-colors">
                                  <td className="px-4 py-3 font-extrabold text-gray-900 dark:text-white">
                                    {acc.platform}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5 font-mono text-gray-700 dark:text-gray-300">
                                      <span>{acc.email}</span>
                                      <button
                                        onClick={(e) => handleCopyEmail(acc.email, e)}
                                        className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400"
                                        title="Copiar correo"
                                      >
                                        {copiedEmail === acc.email ? (
                                          <Check className="w-3 h-3 text-emerald-500" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                                    {acc.vencimiento || '-'}
                                  </td>
                                  <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                                    {acc.total}
                                  </td>
                                  <td className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
                                    {acc.ocupados}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {acc.libres > 0 ? (
                                      <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                                        🟢 {acc.libres} LIBRES
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 dark:bg-gray-750 text-gray-400">
                                        0 Libres
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="font-bold text-gray-700 dark:text-gray-300">{acc.occupancyRate}%</span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      onClick={() => toggleAccount(acc.id)}
                                      className="px-2 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors inline-flex items-center gap-1"
                                    >
                                      {isAccExpanded ? 'Ocultar' : 'Ver'}
                                      {isAccExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                    </button>
                                  </td>
                                </tr>
                                {isAccExpanded && (
                                  <tr className="bg-gray-50/80 dark:bg-gray-850/60">
                                    <td colSpan={8} className="px-6 py-4">
                                      <div className="text-[11px] font-semibold text-gray-400 mb-2">
                                        Detalle de Perfiles en Fila de Excel:
                                      </div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                                        {acc.profiles.map((pSlot, sIdx) => (
                                          <div 
                                            key={sIdx}
                                            className={`p-2 rounded-lg border text-xs flex flex-col justify-between ${
                                              pSlot.isLibre 
                                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/30' 
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                            }`}
                                          >
                                            <div className="flex justify-between items-center text-[10px] text-gray-400">
                                              <span>Fila #{pSlot.rowNumber}</span>
                                              {pSlot.isLibre && (
                                                <span className="font-black text-emerald-600 dark:text-emerald-400">LIBRE</span>
                                              )}
                                            </div>
                                            <div className="font-extrabold text-gray-800 dark:text-gray-200 mt-1 truncate">
                                              {pSlot.isLibre ? '✨ Disponible' : `${pSlot.nombre} ${pSlot.apellido}`.trim() || 'Cliente'}
                                            </div>
                                            {!pSlot.isLibre && (
                                              <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                                {pSlot.whatsapp || '-'}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* TRAFFIC & HEATMAPS SUB-TAB CONTENT */
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {loadingTraffic || !trafficStats ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700">
              <RefreshCcw className="w-8 h-8 text-brand-primary animate-spin" />
              <p className="text-sm text-gray-400">Obteniendo logs de navegación y clicks...</p>
            </div>
          ) : (
            <>
              {/* Selector de Período / Fecha de Análisis */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-extrabold text-gray-700 dark:text-gray-200">Período de Análisis:</span>
                  <span className="text-[11px] text-gray-400">Filtra visitas, clics en botones y funnel por fecha</span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-750 p-1 rounded-xl">
                  {[
                    { id: 'today', label: '⚡ Hoy' },
                    { id: '7d', label: '📅 7 días' },
                    { id: '30d', label: '🗓️ 30 días' },
                    { id: 'all', label: '🌐 Histórico Total' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        const newTf = t.id as any;
                        setTrafficTimeframe(newTf);
                        fetchTrafficStats(newTf);
                        fetchElementClicks(newTf);
                        fetchPurchaseFunnel(newTf);
                        fetchHeatmapClicks(selectedHeatmapPage, selectedDeviceFilter, newTf);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                        trafficTimeframe === t.id
                          ? 'bg-brand-primary text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Traffic Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Visitas Totales</span>
                    <Eye className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-bold dark:text-white">{trafficStats.summary.totalVisits}</div>
                  <p className="text-[10px] text-gray-400 mt-1">Cargas de página registradas</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Visitantes Únicos</span>
                    <Users className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold dark:text-white">{trafficStats.summary.uniqueVisits}</div>
                  <p className="text-[10px] text-gray-400 mt-1">Filtrado por IP única</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Clics en Botones/Links</span>
                    <MousePointer className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-bold dark:text-white">{trafficStats.summary.totalClicks}</div>
                  <p className="text-[10px] text-gray-400 mt-1">Interacciones recolectadas</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Tasa de Clics (CTR)</span>
                    <Activity className="w-4 h-4 text-brand-primary animate-pulse" />
                  </div>
                  <div className="text-2xl font-bold dark:text-white">
                    {((trafficStats.summary.totalClicks / (trafficStats.summary.totalVisits || 1)) * 100).toFixed(1)}%
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Promedio de clics por visita</p>
                </div>
              </div>

              {/* Graphic charts: Visits history & Device breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Visits History LineChart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 flex flex-col justify-between">
                  <h3 className="text-sm font-extrabold text-gray-750 dark:text-white mb-4">Historial de Visitas Recientes (15 días)</h3>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trafficStats.visitsHistory}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Line type="monotone" dataKey="count" name="Visitas" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Device Breakdown Donut */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 flex flex-col justify-between">
                  <h3 className="text-sm font-extrabold text-gray-750 dark:text-white mb-4">Dispositivos Utilizados</h3>
                  <div className="h-44 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={trafficStats.deviceBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {trafficStats.deviceBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-around items-center text-xs mt-3 pt-3 border-t dark:border-gray-750">
                    {trafficStats.deviceBreakdown.map((d, i) => (
                      <div key={i} className="text-center">
                        <span className="flex items-center justify-center gap-1 font-semibold text-gray-700 dark:text-gray-300">
                          {d.name === 'mobile' ? <Smartphone className="w-3 h-3 text-indigo-500" /> : d.name === 'tablet' ? <Tablet className="w-3 h-3 text-emerald-500" /> : <Monitor className="w-3 h-3 text-orange-500" />}
                          {d.name}
                        </span>
                        <span className="text-[10px] text-gray-400">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid: Popular Pages and Interactive Heatmap */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                
                {/* Popular Pages & Clicks List */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
                    <h3 className="text-sm font-extrabold text-gray-750 dark:text-white mb-4 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-indigo-500" /> Páginas Más Solicitadas
                    </h3>
                    <div className="space-y-3">
                      {trafficStats.topPages.map((p, idx) => {
                        const clickData = trafficStats.clicksByPage.find(c => c.page === p.page);
                        return (
                          <div key={p.page} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-850 rounded-xl text-xs">
                            <div>
                              <span className="font-extrabold text-gray-700 dark:text-gray-300 block">{idx + 1}. {p.page}</span>
                              <span className="text-[10px] text-gray-400">{p.visits} visitas</span>
                            </div>
                            <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-extrabold px-2.5 py-1 rounded-lg">
                              {clickData?.clicks || 0} clics
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
                    <h3 className="text-sm font-extrabold text-gray-750 dark:text-white mb-4 flex items-center gap-1.5">
                      <Share2 className="w-4 h-4 text-emerald-500" /> Origen / Referrers
                    </h3>
                    <div className="space-y-2">
                      {trafficStats.topReferrers.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Tráfico directo (sin referrer).</p>
                      ) : (
                        trafficStats.topReferrers.map((r) => (
                          <div key={r.name} className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 dark:text-gray-400 truncate max-w-[200px]">{r.name}</span>
                            <span className="font-bold text-gray-700 dark:text-gray-300">{r.value} visitas</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Heatmap Interactive Visualizer */}
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b dark:border-gray-750 pb-3 gap-2">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-750 dark:text-white flex items-center gap-1.5">
                        <MousePointer className="w-4 h-4 text-brand-primary" /> Visualizador de Mapa de Calor
                      </h3>
                      <p className="text-[10px] text-gray-400">Visualiza dónde hacen clic los usuarios en tu web.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Device Filter Buttons */}
                      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-750 p-1 rounded-xl">
                        <button
                          onClick={() => setSelectedDeviceFilter('all')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                            selectedDeviceFilter === 'all'
                              ? 'bg-brand-primary text-white shadow-sm'
                              : 'text-gray-500 dark:text-gray-300 hover:text-gray-700'
                          }`}
                        >
                          🌐 Todos
                        </button>
                        <button
                          onClick={() => setSelectedDeviceFilter('mobile')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 ${
                            selectedDeviceFilter === 'mobile'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-gray-500 dark:text-gray-300 hover:text-gray-700'
                          }`}
                        >
                          <Smartphone className="w-3 h-3" /> Móvil
                        </button>
                        <button
                          onClick={() => setSelectedDeviceFilter('desktop')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 ${
                            selectedDeviceFilter === 'desktop'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-gray-500 dark:text-gray-300 hover:text-gray-700'
                          }`}
                        >
                          <Monitor className="w-3 h-3" /> Escritorio
                        </button>
                      </div>

                      <select
                        value={selectedHeatmapPage}
                        onChange={(e) => setSelectedHeatmapPage(e.target.value)}
                        className="px-2.5 py-1.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs font-semibold"
                      >
                        <option value="/">Página de Inicio (Home)</option>
                        <option value="/aiuda">Página de Soporte (/aiuda)</option>
                        <option value="/verificar">Verificación de Cuentas</option>
                        <option value="/mis-servicios">Mis Servicios</option>
                        <option value="/software">Planes SaaS</option>
                      </select>
                    </div>
                  </div>

                  {loadingHeatmap ? (
                    <div className="h-[520px] bg-gray-50 dark:bg-gray-850 rounded-2xl border dark:border-gray-700 flex flex-col items-center justify-center space-y-2">
                      <RefreshCcw className="w-6 h-6 text-brand-primary animate-spin" />
                      <p className="text-xs text-gray-400 animate-pulse">Cargando puntos de calor...</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {renderPageMockup()}
                      {heatmapClicks.length === 0 && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-800/90 text-white border border-gray-700 px-4 py-2.5 rounded-xl text-center z-30 shadow-2xl">
                          <p className="font-bold text-xs">Sin Clics Suficientes</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">Aún no hay clics registrados en esta categoría.</p>
                        </div>
                      )}
                      {heatmapClicks.length > 0 && (
                        <div className="absolute bottom-4 left-4 bg-slate-900/90 text-white border border-gray-750 px-3 py-1.5 rounded-xl z-30 flex items-center gap-2 text-[10px] shadow-lg">
                          <div className="flex gap-1 items-center">
                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                            <span>{heatmapClicks.length} clics graficados ({selectedDeviceFilter})</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Conversion Funnel */}
              {funnelData && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 space-y-4">
                  <div className="flex justify-between items-center border-b dark:border-gray-750 pb-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-750 dark:text-white flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-500" /> Embudo de Conversión de Compras (Funnel)
                      </h3>
                      <p className="text-[10px] text-gray-400">Rastreo continuo desde la navegación hasta la compra confirmada.</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> Conversión Real: {funnelData.conversionRate}%
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {funnelData.funnel.map((item, idx) => (
                      <div key={item.step} className="p-4 bg-gray-50 dark:bg-gray-850 rounded-xl border dark:border-gray-750 space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase">
                          <span>Paso {idx + 1}</span>
                          <span className="text-brand-primary">{item.pct}%</span>
                        </div>
                        <div className="text-sm font-extrabold text-gray-800 dark:text-white truncate">{item.step}</div>
                        <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">{item.count.toLocaleString()}</div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mt-2">
                          <div className="bg-brand-primary h-full rounded-full transition-all duration-500" style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Element Click Ranking */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 space-y-4">
                <h3 className="text-sm font-extrabold text-gray-750 dark:text-white flex items-center gap-1.5">
                  <MousePointer className="w-4 h-4 text-indigo-500" /> Dónde Hacen Clic (Botones y Productos Más Interactuados)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {elementClicks.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No hay clics en elementos registrados aún.</p>
                  ) : (
                    elementClicks.map((el, i) => (
                      <div key={i} className="p-3 bg-gray-50 dark:bg-gray-850 rounded-xl border dark:border-gray-750 text-xs flex justify-between items-center">
                        <div className="truncate max-w-[180px]">
                          <span className="font-extrabold text-gray-750 dark:text-gray-200 block truncate">{el.element}</span>
                          <div className="flex gap-2 text-[10px] text-gray-400 mt-0.5">
                            <span className="flex items-center gap-0.5"><Smartphone className="w-2.5 h-2.5" /> {el.mobile_clicks}</span>
                            <span className="flex items-center gap-0.5"><Monitor className="w-2.5 h-2.5" /> {el.desktop_clicks}</span>
                          </div>
                        </div>
                        <span className="bg-brand-primary/10 text-brand-primary font-black px-2.5 py-1 rounded-lg text-xs">
                          {el.total_clicks} clics
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      )}

    </div>
  );
};

