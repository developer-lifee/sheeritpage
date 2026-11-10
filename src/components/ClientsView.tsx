import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Users, Search, Clock, ShieldAlert, Filter, Check, X, Send, Play, CheckCircle2, AlertTriangle, RefreshCw, HelpCircle, Calendar, Plus, CreditCard, ShoppingBag, ChevronDown, Scissors } from 'lucide-react';
import { isDemoMode } from '../utils/demoMode';
import { AddSaleForm } from './AddSaleForm';

const ACCOUNT_COLOR_PALETTES = [
    {
        bg: 'bg-blue-50/50 dark:bg-blue-950/25',
        borderLeft: 'border-l-4 border-l-blue-500',
        dot: 'bg-blue-500',
        text: 'text-blue-700 dark:text-blue-400'
    },
    {
        bg: 'bg-purple-50/50 dark:bg-purple-950/25',
        borderLeft: 'border-l-4 border-l-purple-500',
        dot: 'bg-purple-500',
        text: 'text-purple-700 dark:text-purple-400'
    },
    {
        bg: 'bg-emerald-50/50 dark:bg-emerald-950/25',
        borderLeft: 'border-l-4 border-l-emerald-500',
        dot: 'bg-emerald-500',
        text: 'text-emerald-700 dark:text-emerald-400'
    },
    {
        bg: 'bg-amber-50/50 dark:bg-amber-950/25',
        borderLeft: 'border-l-4 border-l-amber-500',
        dot: 'bg-amber-500',
        text: 'text-amber-700 dark:text-amber-400'
    },
    {
        bg: 'bg-rose-50/50 dark:bg-rose-950/25',
        borderLeft: 'border-l-4 border-l-rose-500',
        dot: 'bg-rose-500',
        text: 'text-rose-700 dark:text-rose-400'
    },
    {
        bg: 'bg-cyan-50/50 dark:bg-cyan-950/25',
        borderLeft: 'border-l-4 border-l-cyan-500',
        dot: 'bg-cyan-500',
        text: 'text-cyan-700 dark:text-cyan-400'
    },
    {
        bg: 'bg-indigo-50/50 dark:bg-indigo-950/25',
        borderLeft: 'border-l-4 border-l-indigo-500',
        dot: 'bg-indigo-500',
        text: 'text-indigo-700 dark:text-indigo-400'
    },
    {
        bg: 'bg-teal-50/50 dark:bg-teal-950/25',
        borderLeft: 'border-l-4 border-l-teal-500',
        dot: 'bg-teal-500',
        text: 'text-teal-700 dark:text-teal-400'
    }
];

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
        const utcDate = new Date((serial - 25569) * 86400 * 1000);
        if (!isNaN(utcDate.getTime())) {
            // Construir fecha usando año, mes y día de UTC para evitar desfases horarios locales (GMT-5)
            date = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
        }
    } else {
        if (str.includes('-')) {
            const parts = str.split('T')[0].split('-');
            if (parts.length === 3) {
                date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
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
        return Math.round(diff / (1000 * 60 * 60 * 24));
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
    const [filterServices, setFilterServices] = useState<string[]>([]);
    const [filterEmail, setFilterEmail] = useState('');

    // Expiration Status Filter (Excel selector style)
    const [filterPaymentStatus, setFilterPaymentStatus] = useState('todos');

    // Searchable Service Combobox States
    const [serviceSearchQuery, setServiceSearchQuery] = useState('');
    const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
    const serviceDropdownRef = useRef<HTMLDivElement>(null);
    const columnPopoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target as Node)) {
                setIsServiceDropdownOpen(false);
            }
            if (columnPopoverRef.current && !columnPopoverRef.current.contains(event.target as Node)) {
                const target = event.target as HTMLElement;
                if (!target.closest('.column-filter-btn')) {
                    setActivePopover(null);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    // Expiration date editing state
    const [editingDateClient, setEditingDateClient] = useState<{ rowKey: string; rowNumber?: number; phone: string; streaming: string; date: string } | null>(null);
    const [isSavingDate, setIsSavingDate] = useState(false);

    const saveNewExpirationDate = async (clientRow: any) => {
        if (!editingDateClient || !editingDateClient.date) return;
        setIsSavingDate(true);
        try {
            const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
            const res = await fetch(`${apiUrl}/api/admin/client/update-expiration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rowNumber: editingDateClient.rowNumber || clientRow._rowNumber,
                    phone: editingDateClient.phone,
                    streaming: editingDateClient.streaming,
                    newDate: editingDateClient.date,
                    password: 'admin123'
                })
            });

            const data = await res.json();
            if (data.success) {
                setClients(prev => prev.map(c => {
                    const cPhone = (c.numero || c.Numero || '').toString().replace(/\D/g, '');
                    if (cPhone === editingDateClient.phone && c.Streaming === editingDateClient.streaming) {
                        return { ...c, deben: editingDateClient.date, vencimiento: editingDateClient.date };
                    }
                    return c;
                }));
                setEditingDateClient(null);
                alert("✅ Fecha de vencimiento actualizada correctamente.");
            } else {
                alert(`❌ Error actualizando vencimiento: ${data.message || data.error}`);
            }
        } catch (err: any) {
            alert(`❌ Error de red: ${err.message}`);
        } finally {
            setIsSavingDate(false);
        }
    };

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

    // Modal de Venta Directa / Renovación
    const [saleModalOpen, setSaleModalOpen] = useState(false);
    const [saleModalClient, setSaleModalClient] = useState<{ phone: string; name: string } | null>(null);

    // Modal de Corte de Servicio
    const [cutModalClient, setCutModalClient] = useState<{
        clientRow: any;
        phone: string;
        name: string;
        streaming: string;
        accountEmail: string;
        rowNumber?: number;
    } | null>(null);
    const [cutReason, setCutReason] = useState<string>('Mora > 3 días / No renovó');
    const [customCutReason, setCustomCutReason] = useState<string>('');
    const [resetDevices, setResetDevices] = useState<boolean>(true); // El límite de códigos no aplica a cuando sacamos todas las sesiones
    const [leaveSlotVirgin, setLeaveSlotVirgin] = useState<boolean>(true); // Dejar casilla "virgen" / libre en Excel para nueva venta
    const [isCuttingService, setIsCuttingService] = useState<boolean>(false);
    const [visibleRowsCount, setVisibleRowsCount] = useState<number>(100);

    const executeCutService = async () => {
        if (!cutModalClient) return;
        setIsCuttingService(true);
        const finalReason = cutReason === 'OTRO' ? (customCutReason || 'Corte manual') : cutReason;
        try {
            const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
            const res = await fetch(`${apiUrl}/api/admin/client/cut-service`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rowNumber: cutModalClient.rowNumber || cutModalClient.clientRow?._rowNumber,
                    phone: cutModalClient.phone,
                    streaming: cutModalClient.streaming,
                    email: cutModalClient.accountEmail,
                    reason: finalReason,
                    resetDevices,
                    leaveSlotVirgin,
                    password: 'admin123'
                })
            });
            const data = await res.json();
            if (data.success) {
                setClients(prev => prev.map(c => {
                    const cPhone = (c.numero || c.Numero || '').toString().replace(/\D/g, '');
                    const rowMatch = cutModalClient.rowNumber ? c._rowNumber === cutModalClient.rowNumber : false;
                    const phoneMatch = cPhone && cutModalClient.phone && cPhone === cutModalClient.phone && c.Streaming === cutModalClient.streaming;
                    if (rowMatch || phoneMatch) {
                        if (data.leaveSlotVirgin) {
                            return {
                                ...c,
                                Nombre: '',
                                nombre: '',
                                Apellido: '',
                                apellido: '',
                                numero: '',
                                Numero: '',
                                whatsapp: '',
                                deben: '',
                                vencimiento: '',
                                observaciones: ''
                            };
                        }
                        return { ...c, observaciones: data.observaciones || 'cortar' };
                    }
                    return c;
                }));
                alert(`✅ ${data.message}`);
                setCutModalClient(null);
            } else {
                alert(`❌ Error al cortar servicio: ${data.message || data.error}`);
            }
        } catch (e: any) {
            alert(`❌ Error de conexión: ${e.message}`);
        } finally {
            setIsCuttingService(false);
        }
    };

    const fetchClientsData = useCallback(() => {
        if (isDemoMode()) {
            setClients([
                { rowNumber: 1, Nombre: 'Carlos', Apellido: 'Mendoza (Demo)', numero: '573001234567', Streaming: 'Netflix Ultra HD', correo: 'demo.cliente1@sheerit.com', deben: '2026-08-25', status: 'Activo' },
                { rowNumber: 2, Nombre: 'Mariana', Apellido: 'Gómez (Demo)', numero: '573109876543', Streaming: 'Disney+ Premium', correo: 'disney.demo@sheerit.com', deben: '2026-08-28', status: 'Activo' },
                { rowNumber: 3, Nombre: 'Javier', Apellido: 'Ríos (Empresarial Demo)', numero: '573201122334', Streaming: 'Spotify Family', correo: 'music.demo@sheerit.com', deben: '2026-09-01', status: 'Activo' },
                { rowNumber: 4, Nombre: 'Diana', Apellido: 'Marcela (Demo)', numero: '573155544332', Streaming: 'Max (HBO)', correo: 'hbo.demo@sheerit.com', deben: '2026-08-22', status: 'Por Vencer' }
            ]);
            setLoading(false);
            return;
        }
        setLoading(true);
        const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
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

    useEffect(() => {
        fetchClientsData();
    }, [fetchClientsData]);

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

    // Helper to normalize streaming service names (trims, collapses multiple spaces, fixes common typos)
    const normalizeServiceName = (raw?: any): string => {
        if (!raw) return '';
        let s = String(raw)
            .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ')
            .trim()
            .replace(/\s+/g, ' ')
            .toUpperCase();
        s = s.replace(/\b(WONER|ONWER)\b/g, 'OWNER');
        return s;
    };

    // Extract unique services dynamically for the Excel filter options
    const uniqueServices = Array.from(
        new Set(clients.map(c => normalizeServiceName(c.Streaming)).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b)) as string[];

    const filtered = clients.filter(c => {
        const daysLeft = getDaysRemaining(c.deben || c.vencimiento);
        
        // Expiration payment filter matches
        let statusMatches = true;
        if (filterPaymentStatus === 'proximos') {
            statusMatches = daysLeft <= 7 && daysLeft >= 0;
        } else if (filterPaymentStatus === 'vencidos') {
            statusMatches = daysLeft < 0;
        }

        // General search matches
        const phoneVal = (c.numero || c.Numero || '').toString();
        const cleanPhoneVal = phoneVal.replace(/\D/g, '');
        const cleanGeneral = generalSearch.replace(/\D/g, '');
        const fullName = `${c.Nombre || ''} ${c.apellido || c.Apellido || ''}`.trim();
        const normStreaming = normalizeServiceName(c.Streaming).toLowerCase();
        
        const phoneMatchesSearch = phoneVal.toLowerCase().includes(generalSearch.toLowerCase()) || 
            (cleanGeneral.length >= 4 && cleanPhoneVal.includes(cleanGeneral));

        const generalMatches = !generalSearch || 
            fullName.toLowerCase().includes(generalSearch.toLowerCase()) || 
            phoneMatchesSearch || 
            normStreaming.includes(generalSearch.toLowerCase()) || 
            String(c.Streaming || '').toLowerCase().includes(generalSearch.toLowerCase()) || 
            String(c.correo || '').toLowerCase().includes(generalSearch.toLowerCase()) ||
            String(c.rowNumber || '').includes(generalSearch);

        // Column level filters matches
        const nameMatches = !filterName || fullName.toLowerCase().includes(filterName.toLowerCase());
        const cleanFilterPhone = filterPhone.replace(/\D/g, '');
        const phoneMatches = !filterPhone || 
            phoneVal.includes(filterPhone) || 
            (cleanFilterPhone.length >= 4 && cleanPhoneVal.includes(cleanFilterPhone));

        // Service matches: exact match on normalized service name (supports multi-selection, e.g. APPLE TV and APPLE ONE)
        const normClientService = normalizeServiceName(c.Streaming);
        const serviceMatches = filterServices.length === 0 || 
            filterServices.some(s => normalizeServiceName(s) === normClientService);

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
    }, [generalSearch, filterName, filterPhone, filterServices, filterEmail, filterPaymentStatus, clients]);

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    const sendSingle = async (phone: string, type: 'custom' | 'credentials' | 'payment', messageText?: string, platformFilter?: string) => {
        const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
        const body: any = { phone, type, password: 'admin123' };
        if (type === 'custom') {
            body.message = messageText;
        }
        if (platformFilter) {
            body.platform = platformFilter;
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

                const platformParam = filterServices.length === 1 ? filterServices[0] : (filterServices.length > 1 ? filterServices.join(', ') : undefined);
                const res = await sendSingle(phone, messageType, finalMessage, platformParam);
                
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
        
        const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
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
        const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
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
        const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
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

                    {/* Searchable Multi-Select Streaming/Service Combobox */}
                    <div className="relative min-w-[220px] max-w-[320px]" ref={serviceDropdownRef}>
                        <div className="relative flex items-center">
                            <input
                                type="text"
                                value={isServiceDropdownOpen ? serviceSearchQuery : (filterServices.length > 0 ? (filterServices.length <= 2 ? filterServices.join(', ') : `${filterServices.length} servicios (${filterServices.slice(0, 2).join(', ')}...)`) : '')}
                                placeholder={filterServices.length > 0 ? (filterServices.length <= 2 ? filterServices.join(', ') : `${filterServices.length} servicios seleccionados`) : "Todos los Servicios"}
                                title={filterServices.length > 0 ? `Filtrando: ${filterServices.join(', ')}` : "Todos los Servicios"}
                                onFocus={() => {
                                    setIsServiceDropdownOpen(true);
                                    setServiceSearchQuery('');
                                }}
                                onChange={(e) => {
                                    setServiceSearchQuery(e.target.value);
                                    if (!isServiceDropdownOpen) setIsServiceDropdownOpen(true);
                                }}
                                className={`w-full px-3 py-2 pr-8 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary font-medium cursor-pointer transition-all ${
                                    filterServices.length > 0 ? 'border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10 text-brand-primary font-bold' : ''
                                }`}
                            />
                            {filterServices.length > 0 ? (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFilterServices([]);
                                        setServiceSearchQuery('');
                                    }}
                                    className="absolute right-2.5 text-gray-400 hover:text-red-500 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                                    title="Quitar filtros de servicio"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <ChevronDown 
                                    onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                                    className="w-4 h-4 absolute right-2.5 text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-200" 
                                />
                            )}
                        </div>

                        {isServiceDropdownOpen && (
                            <div className="absolute z-50 mt-1 w-full min-w-[260px] max-h-72 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-2xl py-1 text-sm animate-fadeIn">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFilterServices([]);
                                        setServiceSearchQuery('');
                                    }}
                                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-brand-primary/10 hover:text-brand-primary transition-colors cursor-pointer ${
                                        filterServices.length === 0 ? 'font-bold text-brand-primary bg-brand-primary/10' : 'text-gray-700 dark:text-gray-200'
                                    }`}
                                >
                                    <span>🌐 Todos los Servicios</span>
                                    {filterServices.length === 0 && <Check className="w-4 h-4 text-brand-primary" />}
                                </button>

                                {filterServices.length > 0 && (
                                    <div className="flex items-center justify-between px-3 py-1 bg-brand-primary/10 text-xs font-semibold text-brand-primary border-y border-brand-primary/20">
                                        <span>{filterServices.length} {filterServices.length === 1 ? 'servicio seleccionado' : 'servicios seleccionados'}</span>
                                        <button 
                                            type="button" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFilterServices([]);
                                            }}
                                            className="text-red-500 hover:underline cursor-pointer"
                                        >
                                            Limpiar
                                        </button>
                                    </div>
                                )}

                                <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                                {(() => {
                                    const filteredSrvs = uniqueServices.filter(s =>
                                        s.toLowerCase().includes(serviceSearchQuery.toLowerCase().trim())
                                    );
                                    if (filteredSrvs.length === 0) {
                                        return (
                                            <div className="px-3 py-3 text-xs text-gray-400 text-center">
                                                No se encontró "{serviceSearchQuery}"
                                            </div>
                                        );
                                    }
                                    return filteredSrvs.map(srv => {
                                        const isSelected = filterServices.includes(srv);
                                        return (
                                            <button
                                                key={srv}
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFilterServices(prev =>
                                                        prev.includes(srv) ? prev.filter(s => s !== srv) : [...prev, srv]
                                                    );
                                                }}
                                                className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-brand-primary/10 hover:text-brand-primary transition-colors cursor-pointer ${
                                                    isSelected ? 'font-bold text-brand-primary bg-brand-primary/10' : 'text-gray-700 dark:text-gray-200'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                                                        isSelected 
                                                            ? 'bg-brand-primary border-brand-primary text-white' 
                                                            : 'border-gray-400 dark:border-gray-500'
                                                    }`}>
                                                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                    </div>
                                                    <span className="truncate">{srv}</span>
                                                </div>
                                                {isSelected && <span className="text-xs bg-brand-primary/20 text-brand-primary font-bold px-1.5 py-0.5 rounded">Activo</span>}
                                            </button>
                                        );
                                    });
                                })()}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            setSaleModalClient(null);
                            setSaleModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nueva Venta</span>
                    </button>

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
                                            className={`w-3.5 h-3.5 cursor-pointer transition-colors column-filter-btn ${filterName ? 'text-brand-primary fill-brand-primary/20' : 'text-gray-450 hover:text-brand-primary'}`} 
                                            onClick={() => setActivePopover(activePopover === 'nombre' ? null : 'nombre')} 
                                            title="Filtrar por nombre"
                                        />
                                    </div>
                                    {activePopover === 'nombre' && (
                                        <div 
                                            ref={columnPopoverRef}
                                            className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-2xl p-3.5 z-50 animate-fadeIn"
                                        >
                                            <div className="flex justify-between items-center mb-2.5">
                                                <span className="text-xs font-bold text-gray-600 dark:text-gray-350 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Filter className="w-3.5 h-3.5 text-brand-primary" /> Filtro por Nombre
                                                </span>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setActivePopover(null)} 
                                                    className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={filterName}
                                                    onChange={(e) => setFilterName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === 'Escape') setActivePopover(null);
                                                    }}
                                                    placeholder="Buscar por nombre..."
                                                    className="px-3 py-2 text-xs w-full border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary font-medium pr-7"
                                                    autoFocus
                                                />
                                                {filterName && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFilterName('')}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 cursor-pointer"
                                                        title="Borrar texto"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                                <span className="text-[11px] text-gray-400 dark:text-gray-400 font-medium">
                                                    {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {filterName && (
                                                        <button 
                                                            type="button"
                                                            onClick={() => setFilterName('')} 
                                                            className="text-xs text-red-500 hover:underline font-medium cursor-pointer"
                                                        >
                                                            Limpiar
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => setActivePopover(null)}
                                                        className="px-3 py-1 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                                                    >
                                                        Listo
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </th>

                                {/* NUMERO COLUMN HEADER */}
                                <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 relative">
                                    <div className="flex items-center justify-between gap-1.5">
                                        <span>Número</span>
                                        <Filter 
                                            className={`w-3.5 h-3.5 cursor-pointer transition-colors column-filter-btn ${filterPhone ? 'text-brand-primary fill-brand-primary/20' : 'text-gray-450 hover:text-brand-primary'}`} 
                                            onClick={() => setActivePopover(activePopover === 'numero' ? null : 'numero')} 
                                            title="Filtrar por teléfono"
                                        />
                                    </div>
                                    {activePopover === 'numero' && (
                                        <div 
                                            ref={columnPopoverRef}
                                            className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-2xl p-3.5 z-50 animate-fadeIn"
                                        >
                                            <div className="flex justify-between items-center mb-2.5">
                                                <span className="text-xs font-bold text-gray-600 dark:text-gray-350 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Filter className="w-3.5 h-3.5 text-brand-primary" /> Filtro por Número
                                                </span>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setActivePopover(null)} 
                                                    className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={filterPhone}
                                                    onChange={(e) => setFilterPhone(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === 'Escape') setActivePopover(null);
                                                    }}
                                                    placeholder="Buscar por número..."
                                                    className="px-3 py-2 text-xs w-full border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary font-medium pr-7"
                                                    autoFocus
                                                />
                                                {filterPhone && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFilterPhone('')}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 cursor-pointer"
                                                        title="Borrar texto"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                                <span className="text-[11px] text-gray-400 dark:text-gray-400 font-medium">
                                                    {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {filterPhone && (
                                                        <button 
                                                            type="button"
                                                            onClick={() => setFilterPhone('')} 
                                                            className="text-xs text-red-500 hover:underline font-medium cursor-pointer"
                                                        >
                                                            Limpiar
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => setActivePopover(null)}
                                                        className="px-3 py-1 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                                                    >
                                                        Listo
                                                    </button>
                                                </div>
                                            </div>
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
                                            className={`w-3.5 h-3.5 cursor-pointer transition-colors column-filter-btn ${filterEmail ? 'text-brand-primary fill-brand-primary/20' : 'text-gray-450 hover:text-brand-primary'}`} 
                                            onClick={() => setActivePopover(activePopover === 'correo' ? null : 'correo')} 
                                            title="Filtrar por correo"
                                        />
                                    </div>
                                    {activePopover === 'correo' && (
                                        <div 
                                            ref={columnPopoverRef}
                                            className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-2xl p-3.5 z-50 animate-fadeIn"
                                        >
                                            <div className="flex justify-between items-center mb-2.5">
                                                <span className="text-xs font-bold text-gray-600 dark:text-gray-350 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Filter className="w-3.5 h-3.5 text-brand-primary" /> Filtro por Correo
                                                </span>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setActivePopover(null)} 
                                                    className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={filterEmail}
                                                    onChange={(e) => setFilterEmail(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === 'Escape') setActivePopover(null);
                                                    }}
                                                    placeholder="Buscar por correo..."
                                                    className="px-3 py-2 text-xs w-full border rounded-lg dark:bg-gray-750 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary font-medium pr-7"
                                                    autoFocus
                                                />
                                                {filterEmail && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFilterEmail('')}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 cursor-pointer"
                                                        title="Borrar texto"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                                <span className="text-[11px] text-gray-400 dark:text-gray-400 font-medium">
                                                    {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {filterEmail && (
                                                        <button 
                                                            type="button"
                                                            onClick={() => setFilterEmail('')} 
                                                            className="text-xs text-red-500 hover:underline font-medium cursor-pointer"
                                                        >
                                                            Limpiar
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => setActivePopover(null)}
                                                        className="px-3 py-1 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                                                    >
                                                        Listo
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </th>

                                <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Vencimiento</th>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                // Ordenar idéntico a Excel: Nivel 1: streaming (A a Z) -> Nivel 2: correo (A a Z) -> Nivel 3: orden de fila / perfiles
                                const sortedFiltered = [...filtered].sort((a, b) => {
                                    const streamA = (a.Streaming || a.Plataforma || '').toString().trim().toUpperCase();
                                    const streamB = (b.Streaming || b.Plataforma || '').toString().trim().toUpperCase();
                                    if (streamA !== streamB) {
                                        if (!streamA && streamB) return 1;
                                        if (streamA && !streamB) return -1;
                                        return streamA.localeCompare(streamB);
                                    }

                                    const emailA = (a.correo || a.Correo || a.account_email || '').toString().trim().toLowerCase();
                                    const emailB = (b.correo || b.Correo || b.account_email || '').toString().trim().toLowerCase();
                                    if (emailA !== emailB) {
                                        if (!emailA && emailB) return 1;
                                        if (emailA && !emailB) return -1;
                                        return emailA.localeCompare(emailB);
                                    }

                                    // Tercer nivel: respetar el orden de perfiles / filas tal como están en Excel
                                    const rowA = a._rowNumber || a.rowNumber || 0;
                                    const rowB = b._rowNumber || b.rowNumber || 0;
                                    return rowA - rowB;
                                });

                                // Pre-calcular grupos de cuentas por servicio + correo para paletas visuales de color
                                let groupCounter = 0;
                                const accountGroupMap = new Map<string, number>();
                                sortedFiltered.forEach(c => {
                                    const stream = (c.Streaming || c.Plataforma || '').toString().trim().toUpperCase();
                                    const email = (c.correo || c.Correo || c.account_email || '').toString().trim().toLowerCase();
                                    const groupKey = `${stream}:::${email}`;
                                    if (email && !accountGroupMap.has(groupKey)) {
                                        accountGroupMap.set(groupKey, groupCounter % ACCOUNT_COLOR_PALETTES.length);
                                        groupCounter++;
                                    }
                                });

                                return sortedFiltered.slice(0, visibleRowsCount).map((c, i) => {
                                    const phone = c.numero || c.Numero;
                                    const daysLeft = getDaysRemaining(c.deben || c.vencimiento);
                                    const stream = (c.Streaming || c.Plataforma || '').toString().trim().toUpperCase();
                                    const email = (c.correo || c.Correo || c.account_email || '').toString().trim().toLowerCase();
                                    const groupKey = `${stream}:::${email}`;
                                    const paletteIndex = email ? accountGroupMap.get(groupKey) : undefined;
                                    const palette = paletteIndex !== undefined ? ACCOUNT_COLOR_PALETTES[paletteIndex] : null;

                                    const prevClient = i > 0 ? sortedFiltered[i - 1] : null;
                                    const prevStream = prevClient ? (prevClient.Streaming || prevClient.Plataforma || '').toString().trim().toUpperCase() : '';
                                    const prevEmail = prevClient ? (prevClient.correo || prevClient.Correo || prevClient.account_email || '').toString().trim().toLowerCase() : '';
                                    const prevGroupKey = `${prevStream}:::${prevEmail}`;

                                    const isNewPlatform = i > 0 && stream !== prevStream;
                                    const isNewAccountBlock = i > 0 && groupKey !== prevGroupKey;

                                    const rowBgClass = palette 
                                        ? `${palette.bg} ${palette.borderLeft}` 
                                        : 'bg-white dark:bg-gray-800 border-l-4 border-l-transparent';

                                    const blockDividerClass = isNewPlatform 
                                        ? 'border-t-4 border-t-brand-primary/50 dark:border-t-brand-primary/60' 
                                        : isNewAccountBlock 
                                            ? 'border-t-2 border-t-gray-300 dark:border-t-gray-600' 
                                            : '';
                                    
                                    // Color badges setup based on expiration days or cut status
                                    let badgeColor = "text-gray-500 dark:text-gray-400";
                                    let badgeBg = "bg-gray-100 dark:bg-gray-700/50";
                                    let statusText = "";

                                    const obs = String(c.observaciones || c.Observaciones || '').toLowerCase();
                                    const isCut = obs.includes('cortar') || obs.includes('corte');

                                    if (isCut) {
                                        badgeColor = "text-rose-700 dark:text-rose-300";
                                        badgeBg = "bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800";
                                        statusText = "✂️ Cortado";
                                    } else if (daysLeft < 0) {
                                        badgeColor = "text-red-700 dark:text-red-300";
                                        badgeBg = "bg-red-50 dark:bg-red-950/45 border border-red-200 dark:border-red-900/50";
                                        statusText = `🔴 Vencido (${Math.abs(daysLeft)}d)`;
                                    } else if (daysLeft === 0) {
                                        badgeColor = "text-red-700 dark:text-red-300";
                                        badgeBg = "bg-red-50 dark:bg-red-950/45 border border-red-200 dark:border-red-900/50";
                                        statusText = "⚠️ Vence hoy";
                                    } else if (daysLeft === 1) {
                                        badgeColor = "text-amber-700 dark:text-amber-300";
                                        badgeBg = "bg-amber-50 dark:bg-amber-950/45 border border-amber-200 dark:border-amber-900/50";
                                        statusText = "⚠️ Vence mañana";
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
                                            <tr className={`border-b dark:border-gray-700/60 hover:bg-gray-150/60 dark:hover:bg-gray-700/40 transition-all ${rowBgClass} ${blockDividerClass}`}>
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
                                                <td data-label="Cuenta / Correo" className="py-3.5 px-4 text-sm break-all font-mono">
                                                    <div className="flex flex-col gap-1">
                                                        {c.Streaming && (
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary dark:text-brand-light w-fit">
                                                                {normalizeServiceName(c.Streaming)}
                                                            </span>
                                                        )}
                                                        <div className="flex items-center gap-1.5">
                                                            {palette && (
                                                                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${palette.dot} shadow-2xs`} title="Cuenta agrupada por color" />
                                                            )}
                                                            <span className={`truncate text-xs ${palette ? `${palette.text} font-bold` : 'text-gray-600 dark:text-gray-300'}`}>
                                                                {c.correo || '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td data-label="Vencimiento" className="py-3.5 px-4 text-sm font-mono dark:text-gray-300">
                                                     {editingDateClient && editingDateClient.rowKey === `${phone}_${c.Streaming}_${i}` ? (
                                                         <div className="flex flex-col gap-1.5 p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-300 dark:border-purple-700 animate-fadeIn">
                                                             <label className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase">Editar Vencimiento:</label>
                                                             <input
                                                                 type="date"
                                                                 value={editingDateClient.date}
                                                                 onChange={(e) => setEditingDateClient({ ...editingDateClient, date: e.target.value })}
                                                                 className="px-2 py-1 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                             />
                                                             <div className="flex gap-1.5 mt-1">
                                                                 <button
                                                                     disabled={isSavingDate}
                                                                     onClick={() => saveNewExpirationDate(c)}
                                                                     className="flex-1 py-1 px-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 disabled:opacity-50"
                                                                 >
                                                                     {isSavingDate ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                                     <span>Guardar</span>
                                                                 </button>
                                                                 <button
                                                                     disabled={isSavingDate}
                                                                     onClick={() => setEditingDateClient(null)}
                                                                     className="py-1 px-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold transition-all"
                                                                 >
                                                                     <X className="w-3 h-3" />
                                                                 </button>
                                                             </div>
                                                         </div>
                                                     ) : (
                                                         <div className="flex flex-col group/venc relative">
                                                             <div className="flex items-center gap-1.5">
                                                                 <span className="font-semibold">{formatExcelDate(c.deben || c.vencimiento)}</span>
                                                                 <button
                                                                     onClick={() => {
                                                                         const currentDateStr = formatExcelDate(c.deben || c.vencimiento);
                                                                         let dateForPicker = currentDateStr;
                                                                         if (!currentDateStr || currentDateStr === '-' || !currentDateStr.includes('-')) {
                                                                             dateForPicker = new Date().toISOString().split('T')[0];
                                                                         }
                                                                         setEditingDateClient({
                                                                             rowKey: `${phone}_${c.Streaming}_${i}`,
                                                                             rowNumber: c._rowNumber,
                                                                             phone,
                                                                             streaming: c.Streaming || '',
                                                                             date: dateForPicker
                                                                         });
                                                                     }}
                                                                     className="p-1 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 opacity-60 hover:opacity-100 transition-all rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/30 cursor-pointer"
                                                                     title="Editar fecha de vencimiento a tu gusto"
                                                                 >
                                                                     <Calendar className="w-3.5 h-3.5" />
                                                                 </button>
                                                             </div>
                                                             {statusText && (
                                                                 <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full mt-1.5 font-bold w-fit ${badgeBg} ${badgeColor}`}>
                                                                     {statusText}
                                                                 </span>
                                                             )}
                                                         </div>
                                                     )}
                                                </td>
                                                <td data-label="Acciones" className="py-3.5 px-4 text-sm text-center">
                                                    <div className="flex gap-2 justify-center items-center">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const rawPhone = (c.numero || c.Numero || c.whatsapp || '').toString().replace(/\D/g, '');
                                                                const rawName = `${c.Nombre || ''} ${c.apellido || c.Apellido || ''}`.trim();
                                                                setSaleModalClient({ phone: rawPhone, name: rawName });
                                                                setSaleModalOpen(true);
                                                            }}
                                                            className="p-2 rounded-xl text-xs font-bold transition-all border bg-green-50 hover:bg-green-100 text-green-750 dark:bg-green-950/30 dark:hover:bg-green-900/50 dark:text-green-300 border-green-200/50 dark:border-green-800/40 flex items-center gap-1 shadow-2xs"
                                                            title="Registrar cobro, descuento o renovar servicio para este cliente"
                                                        >
                                                            <CreditCard className="w-3.5 h-3.5" />
                                                            <span>Venta / Renovar</span>
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const rawPhone = (c.numero || c.Numero || c.whatsapp || '').toString().replace(/\D/g, '');
                                                                const rawName = `${c.Nombre || ''} ${c.apellido || c.Apellido || ''}`.trim() || 'Cliente';
                                                                setCutModalClient({
                                                                    clientRow: c,
                                                                    phone: rawPhone,
                                                                    name: rawName,
                                                                    streaming: c.Streaming || '',
                                                                    accountEmail: c.correo || '',
                                                                    rowNumber: c._rowNumber
                                                                });
                                                                setCutReason('Mora > 3 días / No renovó');
                                                                setCustomCutReason('');
                                                                setResetDevices(true);
                                                            }}
                                                            className="p-2 rounded-xl text-xs font-bold transition-all border bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/50 flex items-center gap-1 shadow-2xs"
                                                            title="Aplicar corte de servicio a este cliente y gestionar reinicio de dispositivos si se sacan todas las sesiones"
                                                        >
                                                            <Scissors className="w-3.5 h-3.5" />
                                                            <span>Cortar</span>
                                                        </button>
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
                    {filtered.length > visibleRowsCount && (
                        <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
                            <span>Mostrando {Math.min(visibleRowsCount, filtered.length)} de {filtered.length} cuentas registradas</span>
                            <button
                                type="button"
                                onClick={() => setVisibleRowsCount(prev => prev + 100)}
                                className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors shadow-2xs font-bold"
                            >
                                + Cargar 100 más
                            </button>
                            <button
                                type="button"
                                onClick={() => setVisibleRowsCount(filtered.length)}
                                className="px-3 py-1.5 rounded-xl bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary dark:text-brand-light transition-colors shadow-2xs font-bold"
                            >
                                Mostrar todas ({filtered.length})
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL DE CORTE DE SERVICIO */}
            {cutModalClient && (
                <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
                    <div className="w-full max-w-lg bg-white dark:bg-gray-850 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
                                    <Scissors className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black">Corte de Servicio</h3>
                                    <p className="text-xs text-rose-200">
                                        {cutModalClient.name} · {cutModalClient.streaming || 'Servicio'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setCutModalClient(null)}
                                disabled={isCuttingService}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm font-bold transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4 text-xs">
                            {/* Detalles del Cliente */}
                            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-1.5 font-medium text-gray-700 dark:text-gray-300">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">WhatsApp:</span>
                                    <span className="font-mono font-bold">+{cutModalClient.phone || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Cuenta / Correo:</span>
                                    <span className="font-mono text-gray-900 dark:text-white truncate max-w-[240px]">
                                        {cutModalClient.accountEmail || 'Sin correo asignado'}
                                    </span>
                                </div>
                            </div>

                            {/* Motivo del Corte */}
                            <div className="space-y-1.5">
                                <label className="font-bold text-gray-800 dark:text-gray-200 block">
                                    Motivo del Corte:
                                </label>
                                <select
                                    value={cutReason}
                                    onChange={(e) => setCutReason(e.target.value)}
                                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-rose-500"
                                >
                                    <option value="Mora > 3 días / No renovó">Mora &gt; 3 días / No renovó</option>
                                    <option value="Cancelación solicitada por el cliente">Cancelación solicitada por el cliente</option>
                                    <option value="Cambio de cuenta o perfil">Cambio de cuenta o perfil</option>
                                    <option value="Incumplimiento de políticas / Sobreuso">Incumplimiento de políticas / Sobreuso</option>
                                    <option value="OTRO">Otro motivo personalizado...</option>
                                </select>

                                {cutReason === 'OTRO' && (
                                    <input
                                        type="text"
                                        placeholder="Escribe la razón detallada..."
                                        value={customCutReason}
                                        onChange={(e) => setCustomCutReason(e.target.value)}
                                        className="w-full mt-2 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                                    />
                                )}
                            </div>

                            {/* CONDICIÓN CLAVE: PREGUNTAR SI REINICIAR DISPOSITIVOS/SESIONES */}
                            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-2">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={resetDevices}
                                        onChange={(e) => setResetDevices(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                                    />
                                    <div className="space-y-1">
                                        <span className="font-bold text-amber-900 dark:text-amber-200 text-xs flex items-center gap-1.5">
                                            🔄 Reiniciar contador de códigos y dispositivos (Si sacaste todas las sesiones)
                                        </span>
                                        <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                                            El límite de 3 dispositivos <b>no aplica</b> cuando sacamos todas las sesiones de la cuenta. Al marcar esta opción, se liberará el contador para que los usuarios válidos puedan solicitar códigos sin bloqueo.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* CONDICIÓN: DEJAR CASILLA LIBRE ("VIRGEN") EN EXCEL */}
                            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={leaveSlotVirgin}
                                        onChange={(e) => setLeaveSlotVirgin(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <div className="space-y-1">
                                        <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-1.5">
                                            ✨ Dejar casilla libre ("virgen") en Excel para nueva venta
                                        </span>
                                        <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                                            Limpia el teléfono, fecha y marca el Nombre como <b>"libre"</b> en Excel para que el cupo quede inmediatamente disponible en el inventario sin dejar filas fantasmas.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* Botones de Acción */}
                            <div className="flex gap-2.5 pt-2">
                                <button
                                    type="button"
                                    disabled={isCuttingService}
                                    onClick={() => setCutModalClient(null)}
                                    className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    disabled={isCuttingService}
                                    onClick={executeCutService}
                                    className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
                                >
                                    {isCuttingService ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Aplicando Corte...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Scissors className="w-4 h-4" />
                                            <span>Confirmar Corte</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE VENTA DIRECTA / RENOVACIÓN */}
            {saleModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
                        <AddSaleForm
                            isModal={true}
                            initialPhone={saleModalClient?.phone || ''}
                            initialName={saleModalClient?.name || ''}
                            onClose={() => {
                                setSaleModalOpen(false);
                                setSaleModalClient(null);
                            }}
                            onSuccess={() => {
                                setSaleModalOpen(false);
                                setSaleModalClient(null);
                                fetchClientsData();
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
