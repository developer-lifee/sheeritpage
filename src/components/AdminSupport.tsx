import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, LogOut, Database, Tv, LifeBuoy, TrendingUp, Calculator, MessageSquare, Key, Mail } from 'lucide-react';
import { ClientsView } from './ClientsView';
import { NetflixMatchView } from './NetflixMatchView';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { AddSaleForm } from './AddSaleForm';
import { TicketsView } from './TicketsView';
import { GptAccountsView } from './GptAccountsView';
import { ManagedEmailsView } from './ManagedEmailsView';
import { InventoryAccountsView } from './InventoryAccountsView';
import { AvailabilityView } from './AvailabilityView';

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

export function AdminSupport() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [data, setData] = useState<SupportPlatform[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'support' | 'db' | 'netflix' | 'stats' | 'sales' | 'tickets' | 'gpt' | 'emails' | 'inventory' | 'availability'>('tickets');

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

  useEffect(() => {
    fetch('/data/support.json')
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error('Error loading data:', err));
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      setMessage('');
    } else {
      setMessage('Contraseña incorrecta');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('password', password);
    formData.append('action', 'save');
    formData.append('data', JSON.stringify(data, null, 2));

    try {
      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
      const response = await fetch(`${apiUrl}/api/support/save`, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (result.success) {
        setMessage('Guardado con éxito');
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
    formData.append('password', password);
    formData.append('action', 'upload');
    formData.append('image', file);

    try {
      const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
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
    setData([...data, newPlatform]);
  };

  const removePlatform = (index: number) => {
    const newData = [...data];
    newData.splice(index, 1);
    setData(newData);
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
    newData[pIndex].issues.push(newIssue);
    setData(newData);
  };

  const removeIssue = (pIndex: number, iIndex: number) => {
    const newData = [...data];
    newData[pIndex].issues.splice(iIndex, 1);
    setData(newData);
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Admin Ayuda</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Contraseña Admin</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ingresa la contraseña"
              />
            </div>
            {message && <p className="text-red-500 mb-4">{message}</p>}
            <button className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Panel de Control Ayuda</h1>
          <p className="text-gray-600 dark:text-gray-400 font-light">Gestión administrativa integral</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="flex-1 sm:flex-initial flex items-center justify-center bg-gray-250 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-650 dark:text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Salir
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-6 ${message.includes('éxito') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex space-x-2 mb-8 border-b border-gray-200 dark:border-gray-700 pb-4 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button 
          onClick={() => setActiveTab('tickets')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'tickets' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <MessageSquare className="w-5 h-5 mr-2" /> Tickets
        </button>
        <button 
          onClick={() => setActiveTab('support')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'support' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <LifeBuoy className="w-5 h-5 mr-2" /> Guías
        </button>
        <button 
          onClick={() => setActiveTab('db')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'db' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <Database className="w-5 h-5 mr-2" /> Base de Datos
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'stats' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <TrendingUp className="w-5 h-5 mr-2" /> Analítica
        </button>
        <button 
          onClick={() => setActiveTab('sales')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'sales' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <Calculator className="w-5 h-5 mr-2" /> Nueva Venta
        </button>
        <button 
          onClick={() => setActiveTab('netflix')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'netflix' ? 'bg-red-600 text-white' : 'text-gray-500 hover:bg-red-50 dark:text-gray-400 dark:hover:bg-red-900/30'}`}
        >
          <Tv className="w-5 h-5 mr-2" /> Predictor Netflix
        </button>
        <button 
          onClick={() => setActiveTab('gpt')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'gpt' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <Key className="w-5 h-5 mr-2" /> Cuentas GPT
        </button>
        <button 
          onClick={() => setActiveTab('emails')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'emails' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <Mail className="w-5 h-5 mr-2" /> Correos
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'inventory' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <Database className="w-5 h-5 mr-2" /> Agregar Stock
        </button>
        <button 
          onClick={() => setActiveTab('availability')}
          className={`flex-shrink-0 flex items-center px-4 py-2 rounded-lg font-bold transition-colors ${activeTab === 'availability' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
        >
          <Shield className="w-5 h-5 mr-2" /> Disponibilidad Stock
        </button>
      </div>

      {activeTab === 'tickets' && <TicketsView />}
      {activeTab === 'db' && <ClientsView />}
      {activeTab === 'netflix' && <NetflixMatchView />}
      {activeTab === 'stats' && <AnalyticsDashboard />}
      {activeTab === 'sales' && <AddSaleForm />}
      {activeTab === 'gpt' && <GptAccountsView />}
      {activeTab === 'emails' && <ManagedEmailsView />}
      {activeTab === 'inventory' && <InventoryAccountsView />}
      {activeTab === 'availability' && <AvailabilityView />}

      {activeTab === 'support' && (
        <>
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
          <div className="space-y-8">
        {data.map((platform, pIndex) => (
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
        ))}
      </div>

      <button 
        onClick={addPlatform}
        className="w-full mt-8 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-gray-500 hover:border-brand-primary hover:text-brand-primary transition-colors flex items-center justify-center font-bold"
      >
        <Plus className="w-6 h-6 mr-2" />
        Agregar Nueva Plataforma
      </button>
      </>
      )}
    </div>
  );
}
