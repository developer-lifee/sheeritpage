import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, LogOut, Database, Tv, LifeBuoy, TrendingUp, Calculator, MessageSquare, Key, Mail, Shield, AlertCircle, Clock, Send, CreditCard, Radio, FileText, Smartphone, Settings, Cpu, ShoppingBag, Globe } from 'lucide-react';
import { ClientsView } from './ClientsView';
import { NetflixMatchView } from './NetflixMatchView';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { AddSaleForm } from './AddSaleForm';
import { TicketsView } from './TicketsView';
import { GptAccountsView } from './GptAccountsView';
import { ManagedEmailsView } from './ManagedEmailsView';
import { ProviderEmailsView } from './ProviderEmailsView';
import { InventoryAccountsView } from './InventoryAccountsView';
import { AvailabilityView } from './AvailabilityView';
import { AccountAlertsView } from './AccountAlertsView';
import { SupportScheduleView } from './SupportScheduleView';
import { AgentScheduleView } from './AgentScheduleView';
import { PaymentConfigView } from './PaymentConfigView';
import { StreamingView } from './StreamingView';
import { PoliciesView } from './PoliciesView';
import ConnectionView from './ConnectionView';
import PromptsConfigView from './PromptsConfigView';
import RpaAutomatorView from './RpaAutomatorView';
import { WebSalesView } from './WebSalesView';
import { AccountingView } from './AccountingView';
import { AIPanelAssistant } from './AIPanelAssistant';
import { isDemoMode, disableDemoMode } from '../utils/demoMode';

interface Step {
  text: string;
}

interface Issue {
  id: string;
  title: string;
  image: string;
  whatsappMessage: string;
  steps: Step[];
}

interface SupportPlatform {
  id: string;
  name: string;
  logo: string;
  issues: Issue[];
}

interface AdminSupportProps {
  agentEmail: string;
  agentName: string;
  adminPassword?: string;
  onLogout: () => void;
}

export function AdminSupport({ agentEmail, agentName, adminPassword = 'admin123', onLogout }: AdminSupportProps) {
  const [data, setData] = useState<SupportPlatform[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const getApiUrl = () => {
    return (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
      ? 'http://localhost:3000'
      : 'https://bot.sheerit.com.co';
  };

  const logAuditAction = async (action: string, details: any) => {
    try {
      const email = localStorage.getItem('ticket_agent_email') || agentEmail || 'unknown';
      const name = localStorage.getItem('ticket_agent_name') || agentName || 'unknown';
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/admin/audit-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentEmail: email, agentName: name, action, details })
      });
    } catch (e) {
      console.error("Failed to write frontend audit log:", e);
    }
  };
  const [activeTab, setActiveTab] = useState<'support' | 'db' | 'netflix' | 'stats' | 'sales' | 'tickets' | 'gpt' | 'emails' | 'inventory' | 'availability' | 'alerts' | 'schedule' | 'payments' | 'streaming' | 'policies' | 'whatsapp' | 'prompts' | 'rpa' | 'web_sales' | 'accounting'>('tickets');
  const [activePaymentsSubTab, setActivePaymentsSubTab] = useState<'calendar' | 'payroll'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [externalQueryDate, setExternalQueryDate] = useState<string | undefined>(undefined);


  // Platforms to recycle logos from
  const availableLogos = [
    { name: 'Netflix', url: '/img/Netflix_Logo.png' },
    { name: 'Disney+', url: '/img/Disney_Logo.png' },
    { name: 'Max (HBO)', url: '/img/HBO_Max_Logo.png' },
    { name: 'Prime Video', url: '/img/prime_video.png' },
    { name: 'Spotify', url: '/img/Spotify_Logo.png' },
    { name: 'YouTube', url: '/img/youtube.webp.png' },
    { name: 'Paramount+', url: '/img/Paramount_Logo.png' },
    { name: 'Crunchyroll', url: '/img/Crunchyroll_Logo.png' },
    { name: 'Gamepass', url: '/img/Gamepass_logo.png' },
    { name: 'Gemini', url: '/img/Gemini_Advanced_logo.png' },
    { name: 'ViX', url: '/img/ViX_Logo.png' },
    { name: 'GPT', url: '/img/GPT_logo.png' }
  ];

  const [role, setRole] = useState<'admin' | 'agent' | 'supervisor'>(() => {
    return agentEmail.trim().toLowerCase() === 'estebanavila182@outlook.com' ? 'admin' : 'agent';
  });

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/admin/agent-role?email=${encodeURIComponent(agentEmail)}`);
        const json = await res.json();
        if (json.success) {
          setRole(json.role);
        }
      } catch (err) {
        console.error('Error fetching agent role:', err);
      }
    };
    fetchRole();
  }, [agentEmail]);

  useEffect(() => {
    const apiUrl = getApiUrl();
    fetch(`${apiUrl}/api/support`)
      .then(res => res.json())
      .then(json => setData(Array.isArray(json) ? json : []))
      .catch(err => console.error('Error loading data:', err));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('password', adminPassword);
    formData.append('action', 'save');
    formData.append('data', JSON.stringify(data, null, 2));

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/support/save`, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (result.success) {
        setMessage('Guardado con éxito');
        logAuditAction('SAVE_SUPPORT_GUIDES', { platformsCount: data.length });
      } else {
        setMessage('Error: ' + result.message);
      }
    } catch (err) {
      setMessage('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (pIndex: number, iIndex: number, file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('password', adminPassword);
    formData.append('action', 'upload');
    formData.append('image', file);

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/support/upload`, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (result.success) {
        updateIssue(pIndex, iIndex, 'image', result.url);
        setMessage('Imagen subida con éxito');
      } else {
        setMessage('Error al subir: ' + result.message);
      }
    } catch (err) {
      setMessage('Error de conexión al subir');
    } finally {
      setLoading(false);
    }
  };

  const addPlatform = () => {
    const newPlatform: SupportPlatform = {
      id: 'nueva-' + Date.now(),
      name: 'Nueva Plataforma',
      logo: '/img/Netflix_Logo.png',
      issues: []
    };
    setData([newPlatform, ...data]);
    logAuditAction('ADD_PLATFORM', { id: newPlatform.id });
  };

  const removePlatform = (index: number) => {
    const platformName = data[index]?.name || 'Unknown';
    const newData = [...data];
    newData.splice(index, 1);
    setData(newData);
    logAuditAction('REMOVE_PLATFORM', { platformName });
  };

  const updatePlatform = (index: number, field: keyof SupportPlatform, value: any) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    setData(newData);
  };

  const addIssue = (pIndex: number) => {
    const newIssue: Issue = {
      id: 'issue-' + Date.now(),
      title: 'Nuevo Problema',
      image: '',
      whatsappMessage: 'Hola, tengo un problema con...',
      steps: [{ text: 'Paso 1...' }]
    };
    const newData = [...data];
    newData[pIndex].issues.unshift(newIssue);
    setData(newData);
    logAuditAction('ADD_ISSUE', { platformName: data[pIndex]?.name || 'Unknown' });
  };

  const removeIssue = (pIndex: number, iIndex: number) => {
    const platformName = data[pIndex]?.name || 'Unknown';
    const issueTitle = data[pIndex]?.issues[iIndex]?.title || 'Unknown';
    const newData = [...data];
    newData[pIndex].issues.splice(iIndex, 1);
    setData(newData);
    logAuditAction('REMOVE_ISSUE', { platformName, issueTitle });
  };

  const updateIssue = (pIndex: number, iIndex: number, field: keyof Issue, value: any) => {
    const newData = [...data];
    // @ts-ignore
    newData[pIndex].issues[iIndex][field] = value;
    setData(newData);
  };

  const addStep = (pIndex: number, iIndex: number) => {
    const newData = [...data];
    newData[pIndex].issues[iIndex].steps.push({ text: '' });
    setData(newData);
  };

  const removeStep = (pIndex: number, iIndex: number, sIndex: number) => {
    const newData = [...data];
    newData[pIndex].issues[iIndex].steps.splice(sIndex, 1);
    setData(newData);
  };

  const updateStep = (pIndex: number, iIndex: number, sIndex: number, text: string) => {
    const newData = [...data];
    newData[pIndex].issues[iIndex].steps[sIndex].text = text;
    setData(newData);
  };

  const isDemoActive = isDemoMode();

  return (
    <div className="max-w-[96%] mx-auto px-4 py-8 animate-fadeIn">

      {/* Banner de Estado Modo Demo Comercial */}
      {isDemoActive && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white px-5 py-3.5 rounded-2xl mb-6 shadow-xl border border-purple-500/40 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 rounded-xl text-purple-300 border border-purple-500/30">
              <Globe className="w-5 h-5 animate-pulse text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white tracking-wide">⚡ MODO DEMO COMERCIAL ACTIVO</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Datos Sanitizados
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                Estás en el entorno de presentación con datos simulados y sanitizados para clientes sin exponer información confidencial.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              disableDemoMode();
              onLogout();
            }}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir de Modo Demo</span>
          </button>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-xl mb-6 ${message.includes('éxito') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex space-x-2 mb-8 border-b border-gray-200 dark:border-gray-700 pb-4 overflow-x-auto whitespace-nowrap scrollbar-none">
        {/* GRUPO 1: Operaciones Diarias */}
        <button 
          onClick={() => setActiveTab('tickets')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'tickets' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <MessageSquare className="w-5 h-5 mr-2" /> Tickets
        </button>
        <button 
          onClick={() => setActiveTab('db')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'db' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <Database className="w-5 h-5 mr-2" /> Base de Datos
        </button>
        <button 
          onClick={() => setActiveTab('sales')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'sales' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <Calculator className="w-5 h-5 mr-2" /> Nueva Venta
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'stats' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <TrendingUp className="w-5 h-5 mr-2" /> Analítica
        </button>
        <button 
          onClick={() => setActiveTab('web_sales')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'web_sales' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <ShoppingBag className="w-5 h-5 mr-2" /> Ventas Web
        </button>
        <button 
          onClick={() => setActiveTab('accounting')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'accounting' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <Calculator className="w-5 h-5 mr-2" /> Contabilidad
        </button>

        {/* Separador visual */}
        <div className="h-6 w-px bg-gray-250 dark:bg-gray-700 self-center mx-1"></div>

        {/* GRUPO 2: Stock, Disponibilidad e Incidentes */}
        <button 
          onClick={() => setActiveTab('availability')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'availability' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <Shield className="w-5 h-5 mr-2" /> Disponibilidad Stock
        </button>
        <button 
          onClick={() => setActiveTab('alerts')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'alerts' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <AlertCircle className="w-5 h-5 mr-2" /> Alertas Cuentas
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'inventory' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <Plus className="w-5 h-5 mr-2" /> Agregar Stock
        </button>
        <button 
          onClick={() => setActiveTab('gpt')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'gpt' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <Key className="w-5 h-5 mr-2" /> 2FA y Correos
        </button>

        {/* Separador visual */}
        <div className="h-6 w-px bg-gray-250 dark:bg-gray-700 self-center mx-1"></div>

        {/* GRUPO 3: Herramientas del Sistema */}
        <button 
          onClick={() => setActiveTab('payments')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'payments' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <CreditCard className="w-5 h-5 mr-2" /> Pagos y Horarios
        </button>
        <button 
          onClick={() => setActiveTab('streaming')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'streaming' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <Radio className="w-5 h-5 mr-2" /> Transmisión TV
        </button>
        <button 
          onClick={() => setActiveTab('policies')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'policies' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <FileText className="w-5 h-5 mr-2" /> Políticas y PDFs
        </button>
        <button 
          onClick={() => setActiveTab('netflix')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'netflix' ? 'bg-red-600 text-white' : 'text-gray-500 hover:bg-red-50 dark:text-gray-400 dark:hover:bg-red-900/30'}`}
        >
          <Tv className="w-5 h-5 mr-2" /> Predictor Netflix
        </button>
        <button 
          onClick={() => setActiveTab('support')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'support' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <LifeBuoy className="w-5 h-5 mr-2" /> Guías
        </button>

        {role === 'admin' && (
          <>
            {/* Separador visual */}
            <div className="h-6 w-px bg-gray-250 dark:bg-gray-700 self-center mx-1"></div>

            {/* GRUPO 4: SaaS y Automatización */}
            <button 
              onClick={() => setActiveTab('whatsapp')}
              className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'whatsapp' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
            >
              <Smartphone className="w-5 h-5 mr-2" /> Conexión WhatsApp
            </button>
            <button 
              onClick={() => setActiveTab('prompts')}
              className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'prompts' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
            >
              <Settings className="w-5 h-5 mr-2" /> Prompts IA
            </button>
            <button 
              onClick={() => setActiveTab('rpa')}
              className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'rpa' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
            >
              <Cpu className="w-5 h-5 mr-2" /> RPA Automator
            </button>
          </>
        )}
      </div>

      <div className={activeTab === 'tickets' ? '' : 'hidden'}><TicketsView agentEmail={agentEmail} agentName={agentName} onLogout={onLogout} /></div>
      <div className={activeTab === 'db' ? '' : 'hidden'}><ClientsView /></div>
      <div className={activeTab === 'netflix' ? '' : 'hidden'}><NetflixMatchView /></div>
      <div className={activeTab === 'stats' ? '' : 'hidden'}><AnalyticsDashboard /></div>
      <div className={activeTab === 'sales' ? '' : 'hidden'}><AddSaleForm /></div>
      <div className={activeTab === 'web_sales' ? '' : 'hidden'}><WebSalesView /></div>
      <div className={activeTab === 'accounting' ? '' : 'hidden'}><AccountingView /></div>
      <div className={activeTab === 'gpt' ? 'space-y-8' : 'hidden'}>
        <GptAccountsView />
        <ManagedEmailsView />
        <ProviderEmailsView />
      </div>
      <div className={activeTab === 'inventory' ? '' : 'hidden'}><InventoryAccountsView /></div>
      <div className={activeTab === 'availability' ? '' : 'hidden'}><AvailabilityView /></div>
      <div className={activeTab === 'alerts' ? '' : 'hidden'}><AccountAlertsView /></div>
      <div className={activeTab === 'payments' ? 'space-y-8' : 'hidden'}>
        <AgentScheduleView 
          agentEmail={agentEmail} 
          role={role} 
          activeMainTab={activePaymentsSubTab} 
          setActiveMainTab={setActivePaymentsSubTab} 
          externalQueryDate={externalQueryDate}
          onClearExternalQueryDate={() => setExternalQueryDate(undefined)}
        />
        {activePaymentsSubTab === 'payroll' && (
          <>
            <SupportScheduleView />
            <PaymentConfigView />
          </>
        )}
      </div>
      <div className={activeTab === 'streaming' ? '' : 'hidden'}>
        <StreamingView adminPassword={adminPassword} />
      </div>
      <div className={activeTab === 'policies' ? '' : 'hidden'}>
        <PoliciesView />
      </div>
      {role === 'admin' && (
        <>
          <div className={activeTab === 'whatsapp' ? '' : 'hidden'}>
            <ConnectionView />
          </div>
          <div className={activeTab === 'prompts' ? '' : 'hidden'}>
            <PromptsConfigView />
          </div>
          <div className={activeTab === 'rpa' ? '' : 'hidden'}>
            <RpaAutomatorView />
          </div>
        </>
      )}

      <div className={activeTab === 'support' ? '' : 'hidden'}>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold dark:text-white">Editar Guías de Soporte</h2>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="flex items-center bg-green-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Guardando...' : 'Guardar Guías'}
          </button>
        </div>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Filtrar por nombre de plataforma..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:max-w-md px-4 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>
        <div className="space-y-8">
          {data
            .filter(platform => platform.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((platform) => {
              const pIndex = data.findIndex(p => p.id === platform.id);
              return (
                <div key={platform.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Nombre Plataforma</label>
                    <input 
                      value={platform.name}
                      onChange={(e) => updatePlatform(pIndex, 'name', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Logo URL (o selecciona uno)</label>
                    <div className="flex gap-2">
                      <input 
                        value={platform.logo}
                        onChange={(e) => updatePlatform(pIndex, 'logo', e.target.value)}
                        className="flex-grow px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                      <select 
                        onChange={(e) => updatePlatform(pIndex, 'logo', e.target.value)}
                        className="px-2 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Reciclar logo...</option>
                        {availableLogos.map(l => <option key={l.url} value={l.url}>{l.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => removePlatform(pIndex)}
                  className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="ml-6 space-y-4">
                <h4 className="font-bold dark:text-white flex items-center">
                  Problemas Registrados
                  <button 
                    onClick={() => addIssue(pIndex)}
                    className="ml-4 text-xs bg-brand-primary text-white px-2 py-1 rounded"
                  >
                    + Agregar Problema
                  </button>
                </h4>
                
                {platform.issues.map((issue, iIndex) => (
                  <div key={issue.id} className="border-l-4 border-brand-primary pl-4 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-r-xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs text-gray-500">Título del Inconveniente</label>
                        <input 
                          value={issue.title}
                          onChange={(e) => updateIssue(pIndex, iIndex, 'title', e.target.value)}
                          className="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <button 
                          onClick={() => removeIssue(pIndex, iIndex)}
                          className="text-red-500 text-xs mt-6 flex items-center"
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Eliminar Problema
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-xs text-gray-500">Imagen de Referencia (Guía visual)</label>
                      <div className="flex gap-2 items-center">
                        <input 
                          value={issue.image}
                          onChange={(e) => updateIssue(pIndex, iIndex, 'image', e.target.value)}
                          placeholder="/errores_img/archivo.png"
                          className="flex-grow px-2 py-1 border rounded dark:bg-gray-800 dark:text-white"
                        />
                        <label className="bg-brand-primary text-white px-3 py-1 rounded cursor-pointer text-xs font-bold">
                          Subir Imagen
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUpload(pIndex, iIndex, file);
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="ml-4">
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">Pasos de Solución</label>
                      <div className="space-y-2">
                        {issue.steps.map((step, sIndex) => (
                          <div key={sIndex} className="flex gap-2">
                            <span className="text-gray-400 mt-2 font-mono">{sIndex + 1}.</span>
                            <input 
                              value={step.text}
                              onChange={(e) => updateStep(pIndex, iIndex, sIndex, e.target.value)}
                              className="flex-grow px-2 py-1 border rounded dark:bg-gray-800 dark:text-white"
                            />
                            <button onClick={() => removeStep(pIndex, iIndex, sIndex)} className="text-red-400">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => addStep(pIndex, iIndex)}
                          className="text-xs text-brand-primary flex items-center"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Agregar Paso
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
          })}
        </div>

        <button 
          onClick={addPlatform}
          className="w-full mt-8 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-gray-500 hover:border-brand-primary hover:text-brand-primary transition-colors flex items-center justify-center font-bold"
        >
          <Plus className="w-6 h-6 mr-2" />
          Agregar Nueva Plataforma
        </button>
      </div>

      {/* Asistente IA omnipresente (DeepSeek & Gemini) */}
      <AIPanelAssistant
        activeTab={activeTab}
        agentEmail={agentEmail}
        agentName={agentName}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenDateQuery={(dateStr) => {
          setActiveTab('payments');
          setExternalQueryDate(dateStr || '2026-07-15');
        }}
      />
    </div>
  );
}
