import React, { useState, useEffect, useRef } from 'react';
import { Users, Search, Clock, ShieldAlert, Filter, Check, X, Send, Play, CheckCircle2, AlertTriangle, RefreshCw, HelpCircle } from 'lucide-react';

function formatExcelDate(excelDate: any): string {
    if (!excelDate) return '-';
    const str = excelDate.toString().trim();
    if (isNaN(str)) {
        return str;
    }
    try {
        const serial = parseFloat(str);
        const date = new Date((serial - 25569) * 86400 * 1000);
        if (!isNaN(date.getTime())) {
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    } catch (e) {}
    return str;
}

const getDaysRemaining = (excelDate: any) => {
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

export const ClientsView: React.FC = () => {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // General search State
    const [generalSearch, setGeneralSearch] = useState('');

    // Column Popover States
    const [activePopover, setActivePopover] = useState<string | null>(null);

    // Column Filters States
    const [filterName, setFilterName] = useState('');
    const [filterPhone, setFilterPhone] = useState('');
    const [filterService, setFilterService] = useState('');
    const [filterEmail, setFilterEmail] = useState('');

    // Expiration Status Filter (Excel selector style)
    const [filterPaymentStatus, setFilterPaymentStatus] = useState('todos');

    // Customer History States
    const [expandedClient, setExpandedClient] = useState<number | null>(null);
    const [clientHistory, setClientHistory] = useState<any>(null);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Ref for closing popovers on click outside
    const popoverRef = useRef<HTMLDivElement>(null);

    // Bulk Sender States
    const [selectedClientPhones, setSelectedClientPhones] = useState<string[]>([]);
    const [messageType, setMessageType] = useState<'custom' | 'credentials' | 'payment'>('custom');
    const [customMessage, setCustomMessage] = useState<string>('');
    const [isSending, setIsSending] = useState(false);
    const [sendProgress, setSendProgress] = useState({ current: 0, total: 0, success: 0, fail: 0 });
    const [sendingLogs, setSendingLogs] = useState<string[]>([]);
    const [showBulkSender, setShowBulkSender] = useState(false);

    // Status states for inline feedback
    const [actionStates, setActionStates] = useState<{[key: string]: 'idle' | 'loading' | 'success' | 'error'}>({});
    const [actionErrorMessage, setActionErrorMessage] = useState<{[key: string]: string}>({});

    useEffect(() => {
        const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
        fetch(`${apiUrl}/api/admin/clients`)
            .then(res => res.json())
            .then(data => {
                setClients(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching clients:", err);
                setLoading(false);
            });
    }, []);

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setActivePopover(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Extract unique services dynamically for the Excel filter options
    const uniqueServices = Array.from(
        new Set(clients.map(c => c.Streaming).filter(Boolean))
    ).sort() as string[];

    const filtered = clients.filter(c => {
        const daysLeft = getDaysRemaining(c.deben || c.vencimiento);
        
        // Expiration payment filter matches
        let statusMatches = true;
        if (filterPaymentStatus === 'proximos') {
            statusMatches = daysLeft <= 7 && daysLeft > 0;
        } else if (filterPaymentStatus === 'vencidos') {
            statusMatches = daysLeft <= 0;
        }

        // General search matches
        const phoneVal = (c.numero || c.Numero || '').toString();
        const generalMatches = !generalSearch || 
            (c.Nombre || '').toLowerCase().includes(generalSearch.toLowerCase()) || 
            phoneVal.includes(generalSearch) || 
            (c.Streaming || '').toLowerCase().includes(generalSearch.toLowerCase()) || 
            (c.correo || '').toLowerCase().includes(generalSearch.toLowerCase());

        // Column level filters matches
        const nameMatches = !filterName || (c.Nombre || '').toLowerCase().includes(filterName.toLowerCase());
        const phoneMatches = !filterPhone || phoneVal.includes(filterPhone);
        const serviceMatches = !filterService || (c.Streaming || '').toLowerCase().includes(filterService.toLowerCase());
        const emailMatches = !filterEmail || (c.correo || '').toLowerCase().includes(filterEmail.toLowerCase());

        return statusMatches && generalMatches && nameMatches && phoneMatches && serviceMatches && emailMatches;
    });

    // Auto-select filtered clients on filter change
    useEffect(() => {
        const phones = filtered
            .map(c => (c.numero || c.Numero || '').toString().replace(/\D/g, ''))
            .filter(Boolean);
        const uniquePhones = Array.from(new Set(phones));
        setSelectedClientPhones(uniquePhones);
    }, [generalSearch, filterName, filterPhone, filterService, filterEmail, filterPaymentStatus, clients]);

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

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

    const startBulkClients = async () => {
        const uniqueClientsMap = new Map<string, any>();
        filtered.forEach(c => {
            const phone = (c.numero || c.Numero || '').toString().replace(/\D/g, '');
            if (phone && selectedClientPhones.includes(phone) && !uniqueClientsMap.has(phone)) {
                uniqueClientsMap.set(phone, c);
            }
        });
        const clientsToSend = Array.from(uniqueClientsMap.values());

        if (clientsToSend.length === 0) {
            alert("Por favor, selecciona al menos un cliente para el envío.");
            return;
        }

        if (messageType === 'custom' && !customMessage.trim()) {
            alert("Por favor, ingresa el mensaje personalizado a enviar.");
            return;
        }

        const confirmSend = window.confirm(`¿Estás seguro de enviar esta difusión a ${clientsToSend.length} clientes seleccionados? Se enviará con un delay de seguridad de 2 segundos para evitar bans.`);
        if (!confirmSend) return;

        setIsSending(true);
        setSendingLogs([]);
        setSendProgress({ current: 0, total: clientsToSend.length, success: 0, fail: 0 });

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < clientsToSend.length; i++) {
            const client = clientsToSend[i];
            const phone = (client.numero || client.Numero || '').toString().replace(/\D/g, '');
            const clientName = client.Nombre || 'Cliente';
            
            if (!phone) {
                failCount++;
                setSendProgress(prev => ({ ...prev, current: i + 1, fail: failCount }));
                setSendingLogs(prev => [...prev, `❌ Saltado: ${clientName} (Sin número válido)`]);
                continue;
            }

            try {
                let finalMessage = customMessage;
                if (messageType === 'custom') {
                    finalMessage = finalMessage
                        .replace(/{Nombre}/g, clientName)
                        .replace(/{Servicio}/g, client.Streaming || '')
                        .replace(/{Vencimiento}/g, formatExcelDate(client.deben || client.vencimiento));
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
            
            if (i < clientsToSend.length - 1) {
                await sleep(2000);
            }
        }

        setIsSending(false);
    };

    const handleToggleSelectClient = (phone: string) => {
        if (selectedClientPhones.includes(phone)) {
            setSelectedClientPhones(selectedClientPhones.filter(p => p !== phone));
        } else {
            setSelectedClientPhones([...selectedClientPhones, phone]);
        }
    };

    const handleToggleSelectAllClients = () => {
        const allFilteredPhones = filtered
            .map(c => (c.numero || c.Numero || '').toString().replace(/\D/g, ''))
            .filter(Boolean);
        const uniqueFilteredPhones = Array.from(new Set(allFilteredPhones));
            
        if (selectedClientPhones.length === uniqueFilteredPhones.length) {
            setSelectedClientPhones([]);
        } else {
            setSelectedClientPhones(uniqueFilteredPhones);
        }
    };

    const toggleExpandHistory = async (phone: string, idx: number) => {
        if (expandedClient === idx) {
            setExpandedClient(null);
            setClientHistory(null);
            return;
        }
        setExpandedClient(idx);
        setHistoryLoading(true);
        setClientHistory(null);
        
        const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
        try {
            const res = await fetch(`${apiUrl}/api/admin/client-history?phone=${phone}`);
            const data = await res.json();
            setClientHistory(data);
        } catch (e) {
            console.error("Error fetching history:", e);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSendAction = async (phone: string, type: 'credentials' | 'payment') => {
        const cleanPhone = phone ? phone.toString().replace(/\D/g, '') : '';
        const key = `${cleanPhone}_${type}`;
        if (!cleanPhone) {
            setActionStates(prev => ({ ...prev, [key]: 'error' }));
            setActionErrorMessage(prev => ({ ...prev, [key]: 'Número inválido' }));
            setTimeout(() => {
                setActionStates(prev => ({ ...prev, [key]: 'idle' }));
            }, 3000);
            return;
        }
        
        setActionStates(prev => ({ ...prev, [key]: 'loading' }));
        const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
        try {
            const res = await fetch(`${apiUrl}/api/admin/actions/send-info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleanPhone, type, password: 'admin123' })
            });
            const result = await res.json();
            if (result.success) {
                setActionStates(prev => ({ ...prev, [key]: 'success' }));
                setTimeout(() => {
                    setActionStates(prev => ({ ...prev, [key]: 'idle' }));
                }, 3000);
            } else {
                setActionStates(prev => ({ ...prev, [key]: 'error' }));
                setActionErrorMessage(prev => ({ ...prev, [key]: result.message || result.error || 'Error' }));
                setTimeout(() => {
                    setActionStates(prev => ({ ...prev, [key]: 'idle' }));
                }, 3500);
            }
        } catch (err: any) {
            setActionStates(prev => ({ ...prev, [key]: 'error' }));
            setActionErrorMessage(prev => ({ ...prev, [key]: err.message || err }));
            setTimeout(() => {
                setActionStates(prev => ({ ...prev, [key]: 'idle' }));
            }, 3500);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6 animate-fadeIn">
            {/* Custom styles for mobile responsiveness matching PHP project */}
            <style dangerouslySetInnerHTML={{__html: `
                @media only screen and (max-width: 768px) {
                    .responsive-table table, 
                    .responsive-table thead, 
                    .responsive-table tbody, 
                    .responsive-table th, 
                    .responsive-table td, 
                    .responsive-table tr {
                        display: block !important;
                    }

                    .responsive-table thead tr {
                        display: none !important;
                    }

                    .responsive-table tr {
                        margin-bottom: 16px;
                        border: 1px solid #e5e7eb;
                        border-radius: 16px;
                        padding: 12px;
                        background: #ffffff;
                    }

                    .dark .responsive-table tr {
                        border-color: #374151;
                        background: #1f2937;
                    }

                    .responsive-table td {
                        padding: 8px 10px !important;
                        padding-left: 45% !important;
                        position: relative;
                        text-align: left !important;
                        border-bottom: 1px solid #f3f4f6;
                    }

                    .dark .responsive-table td {
                        border-bottom-color: #374151;
                    }

                    .responsive-table td::before {
                        content: attr(data-label);
                        position: absolute;
                        left: 12px;
                        top: 8px;
                        width: 40%;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        font-weight: bold;
                        color: #9ca3af;
                    }

                    .responsive-table td:last-child {
                        border-bottom: none;
                    }
                }
            `}} />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold flex items-center dark:text-white">
                        <Users className="mr-2 text-brand-primary" /> Base de Datos (Clientes)
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">Filtra clientes de forma general, por vencimiento o usando las columnas tipo Excel.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* General search */}
                    <div className="relative flex-grow md:flex-grow-0 md:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar cliente..." 
                            className="pl-9 pr-4 py-2 w-full border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            value={generalSearch}
                            onChange={(e) => setGeneralSearch(e.target.value)}
                        />
                    </div>

                    {/* Expiration Filter */}
                    <select
                        value={filterPaymentStatus}
                        onChange={(e) => setFilterPaymentStatus(e.target.value)}
                        className="px-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer font-medium"
                    >
                        <option value="todos">Todos los Vencimientos</option>
                        <option value="proximos">⚠️ Próximos a Vencer (7 días o menos)</option>
                        <option value="vencidos">🚨 Vencidos</option>
                    </select>

                    {/* Streaming/Service Filter */}
                    <select
                        value={filterService}
                        onChange={(e) => setFilterService(e.target.value)}
                        className="px-3 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer font-medium"
                    >
                        <option value="">Todos los Servicios</option>
                        {uniqueServices.map((service) => (
                            <option key={service} value={service}>{service}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => setShowBulkSender(!showBulkSender)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                            showBulkSender 
                                ? 'bg-brand-primary text-white shadow-md' 
                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-750 dark:text-gray-200'
                        }`}
                    >
                        <Send className="w-4 h-4" />
                        <span>Difusión Masiva</span>
                        {selectedClientPhones.length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                                {selectedClientPhones.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* BULK SENDER SECTION */}
            {showBulkSender && (
                <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border dark:border-gray-700 mb-6 space-y-4 animate-fadeIn">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-1.5">
                                📢 Herramienta de Envío Masivo a Clientes Filtrados
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Enviarás un mensaje de WhatsApp a los clientes seleccionados en la tabla de abajo.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleToggleSelectAllClients}
                                className="px-3 py-1.5 bg-white dark:bg-gray-800 border dark:border-gray-700 text-xs font-bold rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                            >
                                {selectedClientPhones.length === filtered.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                            </button>
                            <span className="text-xs font-semibold px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-lg">
                                {selectedClientPhones.length} de {filtered.length} seleccionados
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                                Tipo de Mensaje
                            </label>
                            <select
                                value={messageType}
                                onChange={(e) => setMessageType(e.target.value as any)}
                                className="w-full px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
                                disabled={isSending}
                            >
                                <option value="custom">💬 Mensaje Personalizado</option>
                                <option value="credentials">🔑 Enviar Datos de Cuenta (Credenciales)</option>
                                <option value="payment">💰 Recordatorio de Cobro (Método de Pago)</option>
                            </select>
                        </div>

                        {messageType === 'custom' && (
                            <div className="md:col-span-2 space-y-2">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex justify-between">
                                    <span>Mensaje Personalizado</span>
                                    <span className="text-[10px] text-brand-primary lowercase font-normal">
                                        Variables: {"{Nombre}"}, {"{Servicio}"}, {"{Vencimiento}"}
                                    </span>
                                </label>
                                <textarea
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    placeholder="Hola {Nombre}, tu servicio de {Servicio} vence el {Vencimiento}..."
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none animate-fadeIn"
                                    disabled={isSending}
                                />
                            </div>
                        )}
                    </div>

                    {/* SENDING ACTION */}
                    <div className="flex justify-between items-center pt-2 border-t dark:border-gray-800">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Intervalo de seguridad de 2 segundos automático entre envíos.</span>
                        </div>
                        
                        <button
                            onClick={startBulkClients}
                            disabled={isSending || selectedClientPhones.length === 0}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
                        >
                            {isSending ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Enviando... ({sendProgress.current}/{sendProgress.total})</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 fill-white" />
                                    <span>Iniciar Envío Masivo</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* PROGRESS & LOGS */}
                    {isSending && (
                        <div className="space-y-2 border-t dark:border-gray-800 pt-3">
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>Progreso de transmisión</span>
                                <span>{sendProgress.current} / {sendProgress.total} (Éxitos: {sendProgress.success} | Fallidos: {sendProgress.fail})</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                                <div 
                                    className="bg-brand-primary h-full transition-all duration-300"
                                    style={{ width: `${(sendProgress.current / sendProgress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {sendingLogs.length > 0 && (
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl max-h-40 overflow-y-auto font-mono text-[10px] text-gray-600 dark:text-gray-400 space-y-1">
                            {sendingLogs.map((log, lIdx) => (
                                <div key={lIdx}>{log}</div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <p className="text-center py-10 dark:text-gray-400">Cargando base de datos de clientes...</p>
            ) : (
                <div className="overflow-x-auto responsive-table" ref={popoverRef}>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/25">
                                {showBulkSender && (
                                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-center w-12">
                                        <input 
                                            type="checkbox"
                                            checked={selectedClientPhones.length === filtered.length && filtered.length > 0}
                                            onChange={handleToggleSelectAllClients}
                                            className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer w-4 h-4"
                                        />
                                    </th>
                                )}
                                {/* NOMBRE COLUMN HEADER */}
                                <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 relative">
                                    <div className="flex items-center justify-between gap-1.5">
                                        <span>Nombre</span>
                                        <Filter 
                                            className={`w-3.5 h-3.5 cursor-pointer transition-colors ${filterName ? 'text-brand-primary fill-brand-primary/20' : 'text-gray-450 hover:text-brand-primary'}`} 
                                            onClick={() => setActivePopover(activePopover === 'nombre' ? null : 'nombre')} 
                                        />
                                    </div>
                                    {activePopover === 'nombre' && (
                                        <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-xl p-3 z-50 animate-fadeIn">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-450 uppercase">Filtro de Excel</span>
                                                <X className="w-3.5 h-3.5 cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => setActivePopover(null)} />
                                            </div>
                                            <input
                                                type="text"
                                                value={filterName}
                                                onChange={(e) => setFilterName(e.target.value)}
                                                placeholder="Buscar por nombre..."
                                                className="px-2.5 py-1.5 text-xs w-full border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                                autoFocus
                                            />
                                            {filterName && (
                                                <button 
                                                    onClick={() => setFilterName('')} 
                                                    className="mt-2 text-[10px] text-red-500 hover:underline block text-right w-full"
                                                >
                                                    Limpiar filtro
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </th>

                                {/* NUMERO COLUMN HEADER */}
                                <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 relative">
                                    <div className="flex items-center justify-between gap-1.5">
                                        <span>Número</span>
                                        <Filter 
                                            className={`w-3.5 h-3.5 cursor-pointer transition-colors ${filterPhone ? 'text-brand-primary fill-brand-primary/20' : 'text-gray-450 hover:text-brand-primary'}`} 
                                            onClick={() => setActivePopover(activePopover === 'numero' ? null : 'numero')} 
                                        />
                                    </div>
                                    {activePopover === 'numero' && (
                                        <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-xl p-3 z-50 animate-fadeIn">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-450 uppercase">Filtro de Excel</span>
                                                <X className="w-3.5 h-3.5 cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => setActivePopover(null)} />
                                            </div>
                                            <input
                                                type="text"
                                                value={filterPhone}
                                                onChange={(e) => setFilterPhone(e.target.value)}
                                                placeholder="Buscar por número..."
                                                className="px-2.5 py-1.5 text-xs w-full border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                                autoFocus
                                            />
                                            {filterPhone && (
                                                <button 
                                                    onClick={() => setFilterPhone('')} 
                                                    className="mt-2 text-[10px] text-red-500 hover:underline block text-right w-full"
                                                >
                                                    Limpiar filtro
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </th>

                                {/* CONTRASEÑA COLUMN HEADER */}
                                <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                    Contraseña
                                </th>

                                {/* CORREO COLUMN HEADER */}
                                <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 relative">
                                    <div className="flex items-center justify-between gap-1.5">
                                        <span>Cuenta / Correo</span>
                                        <Filter 
                                            className={`w-3.5 h-3.5 cursor-pointer transition-colors ${filterEmail ? 'text-brand-primary fill-brand-primary/20' : 'text-gray-450 hover:text-brand-primary'}`} 
                                            onClick={() => setActivePopover(activePopover === 'correo' ? null : 'correo')} 
                                        />
                                    </div>
                                    {activePopover === 'correo' && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-xl p-3 z-50 animate-fadeIn">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-450 uppercase">Filtro de Excel</span>
                                                <X className="w-3.5 h-3.5 cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => setActivePopover(null)} />
                                            </div>
                                            <input
                                                type="text"
                                                value={filterEmail}
                                                onChange={(e) => setFilterEmail(e.target.value)}
                                                placeholder="Buscar por correo..."
                                                className="px-2.5 py-1.5 text-xs w-full border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                                autoFocus
                                            />
                                            {filterEmail && (
                                                <button 
                                                    onClick={() => setFilterEmail('')} 
                                                    className="mt-2 text-[10px] text-red-500 hover:underline block text-right w-full"
                                                >
                                                    Limpiar filtro
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </th>

                                <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Vencimiento</th>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                // Sort by email / correo to group accounts together
                                const sortedFiltered = [...filtered].sort((a, b) => {
                                    const emailA = (a.correo || '').toString().trim().toLowerCase();
                                    const emailB = (b.correo || '').toString().trim().toLowerCase();
                                    if (!emailA && emailB) return 1;
                                    if (emailA && !emailB) return -1;
                                    if (emailA !== emailB) {
                                        return emailA.localeCompare(emailB);
                                    }
                                    // Secondary sort by Nombre
                                    const nameA = (a.Nombre || '').toString().trim().toLowerCase();
                                    const nameB = (b.Nombre || '').toString().trim().toLowerCase();
                                    return nameA.localeCompare(nameB);
                                });

                                // Pre-calculate email coloring groups
                                let isAlt = false;
                                let lastEmail = "";
                                const emailGroupColors = sortedFiltered.map(c => {
                                    const email = (c.correo || '').toString().trim().toLowerCase();
                                    if (email && email !== lastEmail) {
                                        isAlt = !isAlt;
                                        lastEmail = email;
                                    }
                                    return isAlt;
                                });

                                return sortedFiltered.slice(0, 50).map((c, i) => {
                                    const phone = c.numero || c.Numero;
                                    const daysLeft = getDaysRemaining(c.deben || c.vencimiento);
                                    const isAltColor = emailGroupColors[i];
                                    const rowBgClass = isAltColor 
                                        ? 'bg-gray-50/70 dark:bg-gray-900/10' 
                                        : 'bg-white dark:bg-gray-800';
                                    
                                    // Color badges setup based on expiration days
                                    let badgeColor = "text-gray-500 dark:text-gray-400";
                                    let badgeBg = "bg-gray-100 dark:bg-gray-700/50";
                                    let statusText = "";

                                    if (daysLeft <= 0) {
                                        badgeColor = "text-red-700 dark:text-red-300";
                                        badgeBg = "bg-red-50 dark:bg-red-950/45 border border-red-200 dark:border-red-900/50";
                                        statusText = "🔴 Vencido";
                                    } else if (daysLeft <= 7) {
                                        badgeColor = "text-amber-700 dark:text-amber-300";
                                        badgeBg = "bg-amber-50 dark:bg-amber-950/45 border border-amber-200 dark:border-amber-900/50";
                                        statusText = `⚠️ Vence en ${daysLeft} días`;
                                    } else if (daysLeft !== 999) {
                                        badgeColor = "text-green-700 dark:text-green-300";
                                        badgeBg = "bg-green-50 dark:bg-green-950/45 border border-green-200 dark:border-green-900/50";
                                        statusText = `🟢 ${daysLeft} días vigentes`;
                                    }

                                    return (
                                        <React.Fragment key={i}>
                                            <tr className={`border-b dark:border-gray-700 hover:bg-gray-150/40 dark:hover:bg-gray-750/50 transition-all ${rowBgClass}`}>
                                                {showBulkSender && (
                                                    <td className="py-3.5 px-4 text-center">
                                                        <input 
                                                            type="checkbox"
                                                            checked={selectedClientPhones.includes(phone ? phone.toString().replace(/\D/g, '') : '')}
                                                            onChange={() => handleToggleSelectClient(phone ? phone.toString().replace(/\D/g, '') : '')}
                                                            className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer w-4 h-4"
                                                        />
                                                    </td>
                                                )}
                                                <td data-label="Nombre" className="py-3.5 px-4 text-sm dark:text-gray-200 font-medium">{c.Nombre || 'N/A'}</td>
                                                <td data-label="Número" className="py-3.5 px-4 text-sm dark:text-gray-200 font-mono">{phone}</td>
                                                <td data-label="Contraseña" className="py-3.5 px-4 text-sm dark:text-gray-200 font-mono">
                                                    {c.contraseña || c.Clave || c.clave || c.password || '-'}
                                                </td>
                                                <td data-label="Cuenta / Correo" className="py-3.5 px-4 text-sm text-gray-500 dark:text-gray-400 break-all">{c.correo || '-'}</td>
                                                <td data-label="Vencimiento" className="py-3.5 px-4 text-sm font-mono dark:text-gray-300">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold">{formatExcelDate(c.deben || c.vencimiento)}</span>
                                                        {statusText && (
                                                            <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full mt-1.5 font-bold w-fit ${badgeBg} ${badgeColor}`}>
                                                                {statusText}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td data-label="Acciones" className="py-3.5 px-4 text-sm text-center">
                                                    <div className="flex gap-2 justify-center">
                                                        {(() => {
                                                            const cleanPhone = phone ? phone.toString().replace(/\D/g, '') : '';
                                                            const key = `${cleanPhone}_credentials`;
                                                            const state = actionStates[key] || 'idle';
                                                            
                                                            if (state === 'loading') {
                                                                return (
                                                                    <button disabled className="bg-blue-50 dark:bg-blue-900/30 text-blue-750 dark:text-blue-200 p-2 rounded-xl text-xs font-bold border border-blue-200/50 dark:border-blue-800/40 flex items-center gap-1.5 w-[105px] justify-center">
                                                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                                                        <span>Enviando</span>
                                                                    </button>
                                                                );
                                                            }
                                                            if (state === 'success') {
                                                                return (
                                                                    <button disabled className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 p-2 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-1.5 w-[105px] justify-center">
                                                                        <Check className="w-3 h-3" />
                                                                        <span>¡Enviado!</span>
                                                                    </button>
                                                                );
                                                            }
                                                            if (state === 'error') {
                                                                return (
                                                                    <button disabled className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 p-2 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/40 flex items-center gap-1.5 w-[105px] justify-center" title={actionErrorMessage[key] || 'Error'}>
                                                                        <X className="w-3 h-3" />
                                                                        <span>Fallo</span>
                                                                    </button>
                                                                );
                                                            }
                                                            return (
                                                                <button 
                                                                    onClick={() => handleSendAction(phone, 'credentials')}
                                                                    className="bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 text-blue-750 dark:text-blue-200 p-2 rounded-xl text-xs font-bold transition-all border border-blue-200/50 dark:border-blue-800/40 w-[105px]"
                                                                    title="Enviar Credenciales"
                                                                >
                                                                    🔑 Enviar Datos
                                                                </button>
                                                            );
                                                        })()}
                                                        {(() => {
                                                            const cleanPhone = phone ? phone.toString().replace(/\D/g, '') : '';
                                                            const key = `${cleanPhone}_payment`;
                                                            const state = actionStates[key] || 'idle';
                                                            
                                                            if (state === 'loading') {
                                                                return (
                                                                    <button disabled className="bg-green-50 dark:bg-green-900/30 text-green-750 dark:text-green-200 p-2 rounded-xl text-xs font-bold border border-green-200/50 dark:border-green-800/40 flex items-center gap-1.5 w-[85px] justify-center">
                                                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                                                        <span>Cobrando</span>
                                                                    </button>
                                                                );
                                                            }
                                                            if (state === 'success') {
                                                                return (
                                                                    <button disabled className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 p-2 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-1.5 w-[85px] justify-center">
                                                                        <Check className="w-3 h-3" />
                                                                        <span>¡Enviado!</span>
                                                                    </button>
                                                                );
                                                            }
                                                            if (state === 'error') {
                                                                return (
                                                                    <button disabled className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 p-2 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/40 flex items-center gap-1.5 w-[85px] justify-center" title={actionErrorMessage[key] || 'Error'}>
                                                                        <X className="w-3 h-3" />
                                                                        <span>Fallo</span>
                                                                    </button>
                                                                );
                                                            }
                                                            return (
                                                                <button 
                                                                    onClick={() => handleSendAction(phone, 'payment')}
                                                                    className="bg-green-50 dark:bg-green-900/30 hover:bg-green-100 text-green-750 dark:text-green-200 p-2 rounded-xl text-xs font-bold transition-all border border-green-200/50 dark:border-green-800/40 w-[85px]"
                                                                    title="Cobrar"
                                                                >
                                                                    💰 Cobrar
                                                                </button>
                                                            );
                                                        })()}
                                                        <button 
                                                            onClick={() => toggleExpandHistory(phone, i)}
                                                            className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                                                                expandedClient === i 
                                                                    ? 'bg-purple-600 text-white border-purple-600' 
                                                                    : 'bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 text-purple-750 dark:text-purple-200 border-purple-200/50 dark:border-purple-800/40'
                                                            }`}
                                                            title="Historial de compras"
                                                        >
                                                            🕒 Historial
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {/* Purchase History Expanded Drawer */}
                                            {expandedClient === i && (
                                                <tr className={rowBgClass}>
                                                    <td colSpan={showBulkSender ? 7 : 6} className="bg-gray-50/20 dark:bg-gray-900/10 px-6 py-4 border-b dark:border-gray-700">
                                                    {historyLoading ? (
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                            <Clock className="w-4 h-4 animate-spin text-brand-primary" />
                                                            <span>Analizando historial en la base de datos...</span>
                                                        </div>
                                                    ) : !clientHistory || !clientHistory.historial || clientHistory.historial.length === 0 ? (
                                                        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-450">
                                                            <ShieldAlert className="w-4 h-4" />
                                                            <span>No se encontraron registros anteriores para este cliente en el histórico.</span>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-center">
                                                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-450">
                                                                    Historial de compras de {clientHistory.nombre} {clientHistory.apellido}
                                                                </h4>
                                                            </div>
                                                            <div className="relative border-l-2 border-brand-primary/25 ml-3 space-y-4 py-1">
                                                                {clientHistory.historial.map((h: any, hIdx: number) => (
                                                                    <div key={hIdx} className="relative pl-6">
                                                                        <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-brand-primary border-2 border-white dark:border-gray-800"></div>
                                                                        <div className="bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-gray-150 dark:border-gray-700 shadow-sm max-w-2xl text-xs">
                                                                            <div className="flex justify-between items-center mb-1">
                                                                                <span className="font-bold text-gray-800 dark:text-white text-sm">
                                                                                    🍿 {h.streaming}
                                                                                </span>
                                                                                <span className="font-mono text-gray-450 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                                                                    Vence: {formatExcelDate(h.vencimiento || h.fecha_corte)}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-gray-500 dark:text-gray-400 mb-1">
                                                                                <b>Cuenta:</b> <span className="font-mono">{h.correo || 'N/A'}</span>
                                                                            </p>
                                                                            <div className="flex gap-4 text-[11px] text-gray-400 dark:text-gray-500 border-t dark:border-gray-700 pt-2 mt-2">
                                                                                <span><b>Método Pago:</b> {h.metodo_pago || 'N/A'}</span>
                                                                                {h.deben && <span><b>Debía:</b> ${parseFloat(h.deben).toLocaleString()}</span>}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            });
                        })()}
                        </tbody>
                    </table>
                    {filtered.length > 50 && <p className="text-center text-sm text-gray-500 mt-4">Mostrando 50 resultados...</p>}
                </div>
            )}
        </div>
    );
};
