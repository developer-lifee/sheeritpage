import React, { useState, useEffect, useRef, useCallback } from 'react';
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

function formatServiceDetails(client: any): string {
    if (!client) return '';
    const streaming = (client.Streaming || client.Plataforma || 'Servicio').toString().trim();
    const streamingUpper = streaming.toUpperCase();
    const streamingLower = streaming.toLowerCase();

    const accountEmail = (client.correo || client.Correo || client.account_email || '').toString().trim();
    const password = (client.contraseña || client.Contraseña || client.password || client.clave || client.Clave || '').toString().trim();
    const pin = (client["pin perfil"] || client.pin || client.pin_perfil || '').toString().trim();
    const customerMail = (client["customer mail"] || client.customerMail || client["Customer Mail"] || '').toString().trim();

    const isFamilyOrInvitation = streamingLower.includes('youtube') ||
        streamingLower.includes('apple') ||
        streamingLower.includes('spotify familiar') ||
        streamingLower.includes('extra');

    let lines = [streamingUpper];

    if (isFamilyOrInvitation) {
        if (customerMail) {
            lines.push(`📧 Correo registrado: ${customerMail}`);
            lines.push(`📌 Estado: Acceso por invitación / perfil propio`);
        } else if (accountEmail) {
            lines.push(`📧 Correo: ${accountEmail}`);
            if (password && password !== 'N/A') {
                lines.push(`🔑 Contraseña: ${password}`);
            }
        }
    } else {
        if (accountEmail) {
            lines.push(`📧 Correo: ${accountEmail}`);
        }
        if (password && password !== 'N/A') {
            lines.push(`🔑 Contraseña: ${password}`);
        }
        if (pin) {
            lines.push(`📍 Pin Perfil: ${pin}`);
        }
    }

    return lines.join('\n');
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
    const [editingProfile, setEditingProfile] = useState<{
        phone: string;
        fullname: string;
        email: string;
        notes: string;
    } | null>(null);
    const [savingNotes, setSavingNotes] = useState(false);

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
    const messageTextareaRef = useRef<HTMLTextAreaElement>(null);

    // Insert variable at cursor position in the custom message textarea
    const insertVariable = useCallback((variable: string) => {
        const ta = messageTextareaRef.current;
        if (!ta) {
            setCustomMessage(prev => prev + variable);
            return;
        }
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const newValue = customMessage.substring(0, start) + variable + customMessage.substring(end);
        setCustomMessage(newValue);
        // Restore focus and cursor position after state update
        requestAnimationFrame(() => {
            ta.focus();
            ta.setSelectionRange(start + variable.length, start + variable.length);
        });
    }, [customMessage]);

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
        // General search matches
        const phoneVal = (c.numero || c.Numero || '').toString();
        const fullName = `${c.Nombre || ''} ${c.apellido || c.Apellido || ''}`.trim();
        const generalMatches = !generalSearch || 
            fullName.toLowerCase().includes(generalSearch.toLowerCase()) || 
            phoneVal.includes(generalSearch) || 
            String(c.Streaming || '').toLowerCase().includes(generalSearch.toLowerCase()) || 
            String(c.correo || '').toLowerCase().includes(generalSearch.toLowerCase());

        // Column level filters matches
        const nameMatches = !filterName || fullName.toLowerCase().includes(filterName.toLowerCase());
        const phoneMatches = !filterPhone || phoneVal.includes(filterPhone);
        const serviceMatches = !filterService || String(c.Streaming || '').toLowerCase().includes(filterService.toLowerCase());
        const emailMatches = !filterEmail || String(c.correo || '').toLowerCase().includes(filterEmail.toLowerCase());

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
                        .replace(/{Servicio}/g, formatServiceDetails(client))
                        .replace(/{Correo}/g, client.correo || client.Correo || client.account_email || client["customer mail"] || client.customerMail || '')
                        .replace(/{Contraseña}/g, client.contraseña || client.Contraseña || client.password || client.clave || '(Acceso por invitación/perfil propio)')
                        .replace(/{Pin}/g, client["pin perfil"] || client.pin || client.pin_perfil || '')
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

    const toggleExpandHistory = async (phone: string, idx: number, c: any, force = false) => {
        if (expandedClient === idx && !force) {
            setExpandedClient(null);
            setClientHistory(null);
            setEditingProfile(null);
            return;
        }
        setExpandedClient(idx);
        setHistoryLoading(true);
        if (!force) {
            setClientHistory(null);
            setEditingProfile(null);
        }
        
        const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
        try {
            const res = await fetch(`${apiUrl}/api/admin/client-history?phone=${phone}${force ? '&force=true' : ''}`);
            const data = await res.json();
            setClientHistory(data);
            
            const excelFullName = `${c.Nombre || ''} ${c.apellido || c.Apellido || ''}`.trim();
            const excelCustomerMail = c["customer mail"] || c.customer_mail || "";

            setEditingProfile({
                phone: data.phone || phone,
                fullname: data.fullname || excelFullName,
                email: data.email || excelCustomerMail,
                notes: data.notes || ''
            });
        } catch (e) {
            console.error("Error fetching history:", e);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSaveProfileNotes = async () => {
        if (!editingProfile) return;
        setSavingNotes(true);
        const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
        try {
            const res = await fetch(`${apiUrl}/api/admin/client-history/save-notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingProfile)
            });
            const data = await res.json();
            if (data.success) {
                setClients(prev => prev.map(c => {
                    const cleanC = c.whatsapp ? c.whatsapp.toString().replace(/\D/g, '') : '';
                    const cleanP = editingProfile.phone.replace(/\D/g, '');
                    if (cleanC.endsWith(cleanP.slice(-10))) {
                        return { ...c, Nombre: editingProfile.fullname.split(' ')[0] || '', Apellido: editingProfile.fullname.split(' ').slice(1).join(' ') || '', email: editingProfile.email, Notas: editingProfile.notes };
                    }
                    return c;
                }));
                setClientHistory(prev => prev ? { ...prev, fullname: editingProfile.fullname, email: editingProfile.email, notes: editingProfile.notes } : null);
                alert('Información y notas del cliente guardadas con éxito.');
            } else {
                alert(data.message || 'Error al guardar.');
            }
        } catch (e) {
            console.error(e);
            alert('Error de conexión al guardar.');
        } finally {
            setSavingNotes(false);
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
                            <div className="md:col-span-2 space-y-3">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                                    Constructor de Mensaje
                                </label>

                                {/* Variable chip buttons */}
                                <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
                                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide self-center mr-1">Insertar:</span>
                                    {[
                                        { label: '👤 Nombre', value: '{Nombre}', color: 'from-violet-500 to-purple-600' },
                                        { label: '📺 Servicio Completo', value: '{Servicio}', color: 'from-blue-500 to-cyan-600' },
                                        { label: '📧 Correo', value: '{Correo}', color: 'from-emerald-500 to-teal-600' },
                                        { label: '🔑 Contraseña', value: '{Contraseña}', color: 'from-pink-500 to-rose-600' },
                                        { label: '📅 Vencimiento', value: '{Vencimiento}', color: 'from-orange-500 to-amber-600' },
                                    ].map(chip => (
                                        <button
                                            key={chip.value}
                                            type="button"
                                            disabled={isSending}
                                            onClick={() => insertVariable(chip.value)}
                                            draggable
                                            onDragStart={(e) => e.dataTransfer.setData('text/plain', chip.value)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${chip.color} shadow-sm hover:scale-105 hover:shadow-md active:scale-95 transition-all duration-150 cursor-pointer select-none disabled:opacity-40`}
                                        >
                                            {chip.label}
                                        </button>
                                    ))}
                                    <span className="text-[10px] text-gray-400 ml-auto self-center">click o arrastra al mensaje</span>
                                </div>

                                {/* Message textarea with drop zone */}
                                <div className="relative">
                                    <textarea
                                        ref={messageTextareaRef}
                                        value={customMessage}
                                        onChange={(e) => setCustomMessage(e.target.value)}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const variable = e.dataTransfer.getData('text/plain');
                                            if (variable) insertVariable(variable);
                                        }}
                                        placeholder="Escribe tu mensaje aquí o arrastra las variables de arriba...&#10;&#10;Ej: Hola {Nombre}, tu servicio de {Servicio} vence el {Vencimiento}. ¡Renueva ya! 🚀"
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 rounded-xl dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary resize-none transition-all font-mono"
                                        disabled={isSending}
                                    />
                                </div>

                                {/* Live preview */}
                                {customMessage.trim() && (
                                    <div className="animate-fadeIn">
                                        <p className="text-[10px] font-bold uppercase text-gray-400 mb-1.5">Vista previa del mensaje:</p>
                                        <div className="bg-[#DCF8C6] dark:bg-green-900/30 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-gray-800 dark:text-green-100 max-w-sm shadow-sm font-sans whitespace-pre-wrap leading-relaxed">
                                            {customMessage
                                                .split(/({Nombre}|{Servicio}|{Vencimiento})/g)
                                                .map((part, idx) => {
                                                    const chipStyles: Record<string, string> = {
                                                        '{Nombre}': 'bg-violet-500 text-white',
                                                        '{Servicio}': 'bg-blue-500 text-white',
                                                        '{Vencimiento}': 'bg-orange-500 text-white',
                                                    };
                                                    return chipStyles[part]
                                                        ? <span key={idx} className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold mx-0.5 ${chipStyles[part]}`}>{part}</span>
                                                        : <span key={idx}>{part}</span>;
                                                })
                                            }
                                        </div>
                                    </div>
                                )}
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
                                                <td data-label="Nombre" className="py-3.5 px-4 text-sm dark:text-gray-200 font-medium">
                                                    {`${c.Nombre || ''} ${c.apellido || c.Apellido || ''}`.trim() || 'N/A'}
                                                </td>
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
                                                        <button 
                                                            onClick={() => toggleExpandHistory(phone, i, c)}
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
                                                    ) : (
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-2 animate-fadeIn text-xs">
                                                            {/* CRM / Profile Column */}
                                                            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border dark:border-gray-700 shadow-sm flex flex-col gap-4">
                                                                <div>
                                                                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-1">
                                                                        🧠 Conocimientos y Perfil de Cliente
                                                                    </h4>
                                                                    <p className="text-xxs text-gray-400">Registra información valiosa y notas personalizadas sobre este cliente.</p>
                                                                </div>

                                                                <div className="flex flex-col gap-3">
                                                                    <div>
                                                                        <label className="block text-xxs font-bold text-gray-500 uppercase mb-1">Nombre Completo:</label>
                                                                        <input
                                                                            type="text"
                                                                            value={editingProfile?.fullname || ''}
                                                                            onChange={(e) => setEditingProfile(prev => prev ? { ...prev, fullname: e.target.value } : null)}
                                                                            className="w-full px-3 py-1.5 border rounded-lg dark:bg-gray-855 dark:border-gray-700 dark:text-white text-xs"
                                                                            placeholder="Nombre del cliente"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xxs font-bold text-gray-500 uppercase mb-1">Correo Electrónico:</label>
                                                                        <input
                                                                            type="email"
                                                                            value={editingProfile?.email || ''}
                                                                            onChange={(e) => setEditingProfile(prev => prev ? { ...prev, email: e.target.value } : null)}
                                                                            className="w-full px-3 py-1.5 border rounded-lg dark:bg-gray-855 dark:border-gray-700 dark:text-white text-xs"
                                                                            placeholder="correo@ejemplo.com"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xxs font-bold text-gray-500 uppercase mb-1">Notas / Conocimientos del Cliente:</label>
                                                                        <textarea
                                                                            rows={4}
                                                                            value={editingProfile?.notes || ''}
                                                                            onChange={(e) => setEditingProfile(prev => prev ? { ...prev, notes: e.target.value } : null)}
                                                                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-855 dark:border-gray-700 dark:text-white text-xs"
                                                                            placeholder="Escribe detalles importantes del cliente aquí..."
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <button
                                                                    onClick={handleSaveProfileNotes}
                                                                    disabled={savingNotes}
                                                                    className="bg-brand-primary hover:bg-brand-dark text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 mt-2"
                                                                >
                                                                    {savingNotes ? 'Guardando...' : '💾 Guardar Datos del Perfil'}
                                                                </button>
                                                            </div>

                                                            {/* History / Accounts Column */}
                                                            <div className="flex flex-col gap-5">
                                                                {/* SUSCRIPCIONES (subscriptions table) */}
                                                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border dark:border-gray-700 shadow-sm flex flex-col">
                                                                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-3">
                                                                        🍿 Cuentas y Suscripciones
                                                                    </h4>
                                                                    {!clientHistory.subscriptions || clientHistory.subscriptions.length === 0 ? (
                                                                        <span className="text-xxs text-gray-400 italic">No tiene cuentas activas asignadas.</span>
                                                                    ) : (
                                                                        <div className="max-h-[160px] overflow-y-auto space-y-2.5 pr-1">
                                                                            {clientHistory.subscriptions.map((sub: any, sIdx: number) => (
                                                                                <div key={sIdx} className="p-3 bg-gray-50 dark:bg-gray-850 rounded-xl border dark:border-gray-750 flex flex-col gap-1 shadow-xxs">
                                                                                    <div className="flex justify-between items-center">
                                                                                        <span className="font-bold text-brand-primary text-xs uppercase">{sub.streaming_platform}</span>
                                                                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase ${
                                                                                            sub.status === 'active' 
                                                                                                ? 'bg-green-500/10 text-green-600' 
                                                                                                : 'bg-red-500/10 text-red-500'
                                                                                        }`}>
                                                                                            {sub.status === 'active' ? 'Activo' : 'Vencido'}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="text-xxs text-gray-500 dark:text-gray-400 flex flex-col gap-0.5 mt-0.5 font-mono">
                                                                                        <span><b>Correo:</b> {sub.account_email}</span>
                                                                                        <span><b>Clave:</b> {sub.account_password || 'N/A'}</span>
                                                                                        {sub.profile_pin && <span><b>PIN:</b> {sub.profile_pin}</span>}
                                                                                        <span className="text-[10px] text-gray-400 mt-1">Vence: {sub.expiration_date ? sub.expiration_date.substring(0, 10) : 'N/A'}</span>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* COMPRAS (web_sales_approved table) */}
                                                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border dark:border-gray-700 shadow-sm flex flex-col">
                                                                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-3">
                                                                        💳 Historial de Compras y Pagos
                                                                    </h4>
                                                                    {!clientHistory.purchases || clientHistory.purchases.length === 0 ? (
                                                                        <span className="text-xxs text-gray-400 italic font-light">No tiene compras aprobadas registradas.</span>
                                                                    ) : (
                                                                        <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 font-mono text-xxs">
                                                                            {clientHistory.purchases.map((pur: any, pIdx: number) => (
                                                                                <div key={pIdx} className="flex justify-between items-center p-2 border-b dark:border-gray-750">
                                                                                    <div className="flex flex-col">
                                                                                        <span className="font-bold text-gray-700 dark:text-gray-300">{pur.platformName}</span>
                                                                                        <span className="text-[10px] text-gray-400 font-sans mt-0.5">Fecha: {pur.approvedAt ? pur.approvedAt.substring(0, 10) : 'N/A'}</span>
                                                                                    </div>
                                                                                    <div className="text-right flex flex-col">
                                                                                        <span className="font-bold text-emerald-600 dark:text-emerald-450 text-xs">${Number(pur.amount).toLocaleString('es-CO')}</span>
                                                                                        <span className="text-[9px] text-gray-400 mt-0.5">ID: {pur.order_id}</span>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* EXCEL HISTORICO (Matriz de Excel Historico) */}
                                                                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border dark:border-gray-700 shadow-sm flex flex-col">
                                                                    <div className="flex justify-between items-center mb-3">
                                                                        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                                                                            📊 Histórico de Excel (Cortes Mensuales)
                                                                        </h4>
                                                                        <button
                                                                            onClick={() => toggleExpandHistory(phone, i, c, true)}
                                                                            disabled={historyLoading}
                                                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-brand-primary transition-colors flex items-center gap-1 text-[10px] font-semibold"
                                                                            title="Sincronizar en vivo desde Excel"
                                                                        >
                                                                            <RefreshCw size={11} className={historyLoading ? 'animate-spin' : ''} />
                                                                            Sincronizar
                                                                        </button>
                                                                    </div>
                                                                    {!clientHistory.excelHistory || clientHistory.excelHistory.length === 0 ? (
                                                                        <span className="text-xxs text-gray-400 italic font-light">No tiene registros históricos en el Excel.</span>
                                                                    ) : (
                                                                        <div className="max-h-[180px] overflow-y-auto space-y-2.5 pr-1 font-mono text-xxs">
                                                                            {clientHistory.excelHistory.map((hist: any, hIdx: number) => (
                                                                                <div key={hIdx} className="flex flex-col p-2.5 bg-gray-50 dark:bg-gray-850 rounded-xl border dark:border-gray-750 gap-1">
                                                                                    <div className="flex justify-between items-center font-bold">
                                                                                        <span className="text-brand-primary uppercase">{hist.streaming}</span>
                                                                                        <span className="text-gray-700 dark:text-gray-300">Corte: {hist.fecha_corte || 'N/A'}</span>
                                                                                    </div>
                                                                                    <div className="text-[10px] text-gray-550 dark:text-gray-400 font-sans flex flex-col gap-0.5 mt-0.5">
                                                                                        <span>📧 Correo: {hist.correo || 'N/A'}</span>
                                                                                        <span>💳 Pago: {hist.metodo_pago || 'N/A'}</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between items-center text-[10px] font-sans mt-1 pt-1 border-t border-gray-100 dark:border-gray-800">
                                                                                        <span className="text-gray-450 dark:text-gray-500">Vence: {hist.vencimiento || 'N/A'}</span>
                                                                                        <span className="font-bold text-emerald-600 dark:text-emerald-450">${Number(hist.deben || 0).toLocaleString('es-CO')}</span>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            })()}
                        </tbody>
                    </table>
                    {filtered.length > 50 && <p className="text-center text-sm text-gray-500 mt-4">Mostrando 50 resultados...</p>}
                </div>
            )}
        </div>
    );
};
