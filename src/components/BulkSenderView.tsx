import React, { useState, useEffect } from 'react';
import { Send, Users, MessageSquare, Play, HelpCircle, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface Client {
  Nombre?: string;
  numero?: string;
  Numero?: string;
  Streaming?: string;
  correo?: string;
  deben?: any;
  vencimiento?: any;
}

interface GroupChat {
  id: string;
  name: string;
  unreadCount: number;
}

export const BulkSenderView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'clients' | 'groups'>('clients');
  const [clients, setClients] = useState<Client[]>([]);
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Filter & Selection States (Clients)
  const [selectedService, setSelectedService] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [messageType, setMessageType] = useState<'custom' | 'credentials' | 'payment'>('custom');
  const [customMessage, setCustomMessage] = useState<string>('');

  // Selected WhatsApp Groups
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [groupMessage, setGroupMessage] = useState<string>('');

  // Sending progress
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0, success: 0, fail: 0 });
  const [sendingLogs, setSendingLogs] = useState<string[]>([]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoadingClients(true);
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/clients`);
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching clients:", e);
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchGroups = async () => {
    setLoadingGroups(true);
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/groups`);
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching groups:", e);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleSubTabChange = (tab: 'clients' | 'groups') => {
    setActiveSubTab(tab);
    if (tab === 'groups' && groups.length === 0) {
      fetchGroups();
    }
  };

  // Days remaining calculator
  const getDaysLeft = (excelDate: any) => {
    if (!excelDate) return 999;
    const str = excelDate.toString().trim();
    let date: Date | null = null;
    if (!isNaN(str as any)) {
      const serial = parseFloat(str);
      date = new Date((serial - 25569) * 86400 * 1000);
    } else {
      if (str.includes('-')) {
        date = new Date(str + 'T12:00:00');
      } else if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
          date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      }
    }
    if (date && !isNaN(date.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      const diff = date.getTime() - today.getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    return 999;
  };

  // Get unique streaming services
  const uniqueServices = Array.from(
    new Set(clients.map(c => (c.Streaming || '').split(' ')[0]).filter(Boolean))
  ).sort() as string[];

  // Filtered clients list
  const filteredClients = clients.filter(c => {
    const serviceVal = (c.Streaming || '').toLowerCase();
    const serviceMatches = selectedService === 'todos' || serviceVal.includes(selectedService.toLowerCase());

    const daysLeft = getDaysLeft(c.deben || c.vencimiento);
    let statusMatches = true;
    if (selectedStatus === 'vencidos') {
      statusMatches = daysLeft <= 0;
    } else if (selectedStatus === 'proximos') {
      statusMatches = daysLeft <= 7 && daysLeft > 0;
    } else if (selectedStatus === 'activos') {
      statusMatches = daysLeft > 7 && daysLeft !== 999;
    }

    return serviceMatches && statusMatches;
  });

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  // Send single message to client/group
  const sendSingle = async (phone: string, type: 'custom' | 'credentials' | 'payment', messageText?: string) => {
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    const body: any = { phone, type, password: 'admin123' };
    if (type === 'custom') {
      body.message = messageText;
    }
    const res = await fetch(`${apiUrl}/api/admin/actions/send-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.json();
  };

  // Run bulk sending for Clientes
  const startBulkClients = async () => {
    if (filteredClients.length === 0) return;
    if (messageType === 'custom' && !customMessage.trim()) {
      alert("Por favor, ingresa el mensaje personalizado a enviar.");
      return;
    }

    const confirmSend = window.confirm(`¿Estás seguro de enviar esta difusión a ${filteredClients.length} clientes? Se enviará con un delay de seguridad de 2 segundos para evitar baneos.`);
    if (!confirmSend) return;

    setIsSending(true);
    setSendingLogs([]);
    setSendProgress({ current: 0, total: filteredClients.length, success: 0, fail: 0 });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < filteredClients.length; i++) {
      const client = filteredClients[i];
      const phone = (client.numero || client.Numero || '').toString().replace(/\D/g, '');
      const clientName = client.Nombre || 'Cliente';
      
      if (!phone) {
        failCount++;
        setSendProgress(prev => ({ ...prev, current: i + 1, fail: failCount }));
        setSendingLogs(prev => [...prev, `❌ Saltado: ${clientName} (Sin número válido)`]);
        continue;
      }

      try {
        // Replace dynamic tags in custom message
        let finalMessage = customMessage;
        if (messageType === 'custom') {
          finalMessage = finalMessage
            .replace(/{Nombre}/g, clientName)
            .replace(/{Servicio}/g, client.Streaming || '')
            .replace(/{Vencimiento}/g, client.deben || client.vencimiento || '');
        }

        const res = await sendSingle(phone, messageType, finalMessage);
        
        if (res.success) {
          successCount++;
          setSendingLogs(prev => [...prev, `✅ Enviado a: ${clientName} (${phone})`]);
        } else {
          failCount++;
          setSendingLogs(prev => [...prev, `❌ Error enviando a: ${clientName} (${phone}) - ${res.message}`]);
        }
      } catch (err: any) {
        failCount++;
        setSendingLogs(prev => [...prev, `❌ Falla de red enviando a: ${clientName} (${phone}) - ${err.message}`]);
      }

      setSendProgress(prev => ({ ...prev, current: i + 1, success: successCount, fail: failCount }));
      
      // Safety delay
      if (i < filteredClients.length - 1) {
        await sleep(2000);
      }
    }

    setIsSending(false);
  };

  // Run bulk sending for Groups
  const startBulkGroups = async () => {
    if (selectedGroups.length === 0) {
      alert("Por favor, selecciona al menos un grupo de WhatsApp.");
      return;
    }
    if (!groupMessage.trim()) {
      alert("Por favor, ingresa el mensaje a enviar.");
      return;
    }

    const confirmSend = window.confirm(`¿Estás seguro de enviar este mensaje a los ${selectedGroups.length} grupos seleccionados?`);
    if (!confirmSend) return;

    setIsSending(true);
    setSendingLogs([]);
    setSendProgress({ current: 0, total: selectedGroups.length, success: 0, fail: 0 });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selectedGroups.length; i++) {
      const groupId = selectedGroups[i];
      const groupObj = groups.find(g => g.id === groupId);
      const groupName = groupObj ? groupObj.name : 'Grupo';

      try {
        const res = await sendSingle(groupId, 'custom', groupMessage);
        
        if (res.success) {
          successCount++;
          setSendingLogs(prev => [...prev, `✅ Enviado al grupo: ${groupName}`]);
        } else {
          failCount++;
          setSendingLogs(prev => [...prev, `❌ Error en grupo: ${groupName} - ${res.message}`]);
        }
      } catch (err: any) {
        failCount++;
        setSendingLogs(prev => [...prev, `❌ Falla de red en grupo: ${groupName} - ${err.message}`]);
      }

      setSendProgress(prev => ({ ...prev, current: i + 1, success: successCount, fail: failCount }));
      
      if (i < selectedGroups.length - 1) {
        await sleep(2000);
      }
    }

    setIsSending(false);
  };

  const handleGroupSelectionToggle = (id: string) => {
    if (selectedGroups.includes(id)) {
      setSelectedGroups(selectedGroups.filter(gId => gId !== id));
    } else {
      setSelectedGroups([...selectedGroups, id]);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6 animate-fadeIn">
      {/* Tab Selector */}
      <div className="flex space-x-2 border-b dark:border-gray-700 pb-3 mb-6">
        <button
          onClick={() => handleSubTabChange('clients')}
          className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'clients' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-750'}`}
        >
          <Users className="w-4 h-4 mr-2" />
          Grupos de Clientes (Base Datos)
        </button>
        <button
          onClick={() => handleSubTabChange('groups')}
          className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'groups' ? 'bg-brand-primary text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-750'}`}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Grupos de WhatsApp
        </button>
      </div>

      {activeSubTab === 'clients' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Service selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Filtrar por Servicio</label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="todos">Todos los servicios</option>
                {uniqueServices.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Status selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Filtrar por Vencimiento</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="todos">Todos los estados</option>
                <option value="activos">Vigentes / Activos</option>
                <option value="proximos">⚠️ Próximos a vencer (7 días o menos)</option>
                <option value="vencidos">🚨 Vencidos</option>
              </select>
            </div>

            {/* Message Type */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tipo de Contenido</label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="custom">Mensaje Personalizado</option>
                <option value="credentials">🔑 Enviar Credenciales Automáticas</option>
                <option value="payment">💰 Enviar Recordatorio de Cobro</option>
              </select>
            </div>
          </div>

          {messageType === 'custom' && (
            <div className="bg-gray-50/50 dark:bg-gray-900/10 border dark:border-gray-700 p-4 rounded-2xl">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Escribe tu Mensaje de Difusión</label>
                <span className="text-[10px] text-gray-400">Puedes usar: <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-red-500 font-mono">{`{Nombre}`}</code>, <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-red-500 font-mono">{`{Servicio}`}</code>, <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-red-500 font-mono">{`{Vencimiento}`}</code></span>
              </div>
              <textarea
                rows={5}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                className="w-full p-4 border dark:border-gray-600 rounded-xl dark:bg-gray-750 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          )}

          {/* Action button & Preview summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-2xl gap-4">
            <div>
              <p className="text-emerald-800 dark:text-emerald-300 font-bold text-base">
                Destinatarios Seleccionados: {filteredClients.length} clientes
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Filtros actuales: Servicio ({selectedService}) y Vencimiento ({selectedStatus})
              </p>
            </div>
            
            <button
              onClick={startBulkClients}
              disabled={isSending || filteredClients.length === 0}
              className="flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 w-full sm:w-auto"
            >
              <Play className="w-4 h-4 mr-2" />
              {isSending ? 'Enviando...' : 'Iniciar Envío Masivo'}
            </button>
          </div>
        </div>
      )}

      {activeSubTab === 'groups' && (
        <div className="space-y-6">
          {loadingGroups ? (
            <div className="flex flex-col items-center justify-center py-10 dark:text-gray-400">
              <RefreshCw className="w-8 h-8 animate-spin text-brand-primary mb-3" />
              <p>Recuperando grupos de WhatsApp desde el bot...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Group selection list */}
              <div className="col-span-1 border dark:border-gray-700 rounded-2xl p-4 max-h-96 overflow-y-auto space-y-2 bg-gray-50/25 dark:bg-gray-900/10">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Selecciona los Grupos</label>
                {groups.length === 0 ? (
                  <p className="text-xs text-gray-400">No se encontraron grupos activos.</p>
                ) : (
                  groups.map((group) => (
                    <div 
                      key={group.id} 
                      onClick={() => handleGroupSelectionToggle(group.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${selectedGroups.includes(group.id) ? 'bg-brand-primary/10 border-brand-primary' : 'bg-white border-gray-100 dark:bg-gray-850 dark:border-gray-800 dark:text-white'}`}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedGroups.includes(group.id)}
                        onChange={() => {}} // handled by click on container
                        className="rounded text-brand-primary focus:ring-brand-primary"
                      />
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold truncate">{group.name}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message writing & Sending */}
              <div className="col-span-1 md:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Mensaje del Anuncio / Difusión</label>
                  <textarea
                    rows={6}
                    value={groupMessage}
                    onChange={(e) => setGroupMessage(e.target.value)}
                    placeholder="Escribe el mensaje para los grupos..."
                    className="w-full p-4 border dark:border-gray-600 rounded-xl dark:bg-gray-750 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl gap-4">
                  <div>
                    <p className="text-brand-primary font-bold text-sm">
                      Grupos Seleccionados: {selectedGroups.length} chats grupales
                    </p>
                  </div>
                  
                  <button
                    onClick={startBulkGroups}
                    disabled={isSending || selectedGroups.length === 0}
                    className="flex items-center justify-center bg-brand-primary hover:bg-brand-primary/95 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 w-full sm:w-auto"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSending ? 'Enviando...' : 'Enviar a Grupos'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sending Progress Panel */}
      {(isSending || sendProgress.current > 0) && (
        <div className="mt-8 border dark:border-gray-750 rounded-2xl p-6 bg-gray-50/50 dark:bg-gray-900/20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Progreso del Envío</span>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{sendProgress.current} / {sendProgress.total}</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3.5 mb-4 overflow-hidden">
            <div 
              className="bg-brand-primary h-3.5 rounded-full transition-all duration-300" 
              style={{ width: `${(sendProgress.current / sendProgress.total) * 100}%` }}
            ></div>
          </div>

          <div className="flex gap-6 mb-6">
            <div className="flex items-center gap-1.5 text-xs font-bold text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>Éxitos: {sendProgress.success}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-500">
              <AlertTriangle className="w-4 h-4" />
              <span>Errores: {sendProgress.fail}</span>
            </div>
          </div>

          {/* Logs */}
          <div className="max-h-48 overflow-y-auto bg-white dark:bg-gray-850 p-4 border dark:border-gray-750 rounded-xl space-y-1.5 font-mono text-[10px] text-gray-500 dark:text-gray-450">
            {sendingLogs.length === 0 ? (
              <p className="text-gray-400">Iniciando transmisiones...</p>
            ) : (
              sendingLogs.map((log, idx) => (
                <div key={idx} className="border-b dark:border-gray-800 pb-1 last:border-0">{log}</div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
