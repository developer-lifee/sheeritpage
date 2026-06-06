import React, { useState, useEffect } from 'react';
import { Users, Search, Clock, ShieldAlert } from 'lucide-react';

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

export const ClientsView: React.FC = () => {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Column Filters States
    const [showFilterName, setShowFilterName] = useState(false);
    const [filterName, setFilterName] = useState('');
    const [showFilterPhone, setShowFilterPhone] = useState(false);
    const [filterPhone, setFilterPhone] = useState('');
    const [showFilterService, setShowFilterService] = useState(false);
    const [filterService, setFilterService] = useState('');
    const [showFilterEmail, setShowFilterEmail] = useState(false);
    const [filterEmail, setFilterEmail] = useState('');

    // Customer History States
    const [expandedClient, setExpandedClient] = useState<number | null>(null);
    const [clientHistory, setClientHistory] = useState<any>(null);
    const [historyLoading, setHistoryLoading] = useState(false);

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

    const filtered = clients.filter(c => {
        const nameMatches = !filterName || (c.Nombre || '').toLowerCase().includes(filterName.toLowerCase());
        const phoneVal = (c.numero || c.Numero || '').toString();
        const phoneMatches = !filterPhone || phoneVal.includes(filterPhone);
        const serviceMatches = !filterService || (c.Streaming || '').toLowerCase().includes(filterService.toLowerCase());
        const emailMatches = !filterEmail || (c.correo || '').toLowerCase().includes(filterEmail.toLowerCase());
        return nameMatches && phoneMatches && serviceMatches && emailMatches;
    });

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
        const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
        try {
            const res = await fetch(`${apiUrl}/api/admin/actions/send-info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, type, password: 'admin123' })
            });
            const result = await res.json();
            if (result.success) {
                alert(`✅ Mensaje de ${type} enviado con éxito a ${phone}`);
            } else {
                alert(`❌ Error: ${result.message}`);
            }
        } catch (err) {
            alert("❌ Error de comunicación con el bot.");
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center dark:text-white">
                    <Users className="mr-2 text-brand-primary" /> Base de Datos (Clientes)
                </h2>
                <div className="text-xs text-gray-400">
                    Usa las lupas 🔍 en las columnas para realizar búsquedas específicas.
                </div>
            </div>

            {loading ? (
                <p className="text-center py-10 dark:text-gray-400">Cargando base de datos de clientes...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/25">
                                <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                    <div className="flex items-center gap-1.5">
                                        <span>Nombre</span>
                                        <Search className="w-3.5 h-3.5 cursor-pointer text-gray-400 hover:text-brand-primary transition-colors" onClick={() => setShowFilterName(!showFilterName)} />
                                    </div>
                                    {showFilterName && (
                                        <input
                                            type="text"
                                            value={filterName}
                                            onChange={(e) => setFilterName(e.target.value)}
                                            placeholder="Filtrar..."
                                            className="mt-2 px-2 py-1 text-xs w-full font-normal border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                        />
                                    )}
                                </th>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                    <div className="flex items-center gap-1.5">
                                        <span>Número</span>
                                        <Search className="w-3.5 h-3.5 cursor-pointer text-gray-400 hover:text-brand-primary transition-colors" onClick={() => setShowFilterPhone(!showFilterPhone)} />
                                    </div>
                                    {showFilterPhone && (
                                        <input
                                            type="text"
                                            value={filterPhone}
                                            onChange={(e) => setFilterPhone(e.target.value)}
                                            placeholder="Filtrar..."
                                            className="mt-2 px-2 py-1 text-xs w-full font-normal border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                        />
                                    )}
                                </th>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                    <div className="flex items-center gap-1.5">
                                        <span>Servicio</span>
                                        <Search className="w-3.5 h-3.5 cursor-pointer text-gray-400 hover:text-brand-primary transition-colors" onClick={() => setShowFilterService(!showFilterService)} />
                                    </div>
                                    {showFilterService && (
                                        <input
                                            type="text"
                                            value={filterService}
                                            onChange={(e) => setFilterService(e.target.value)}
                                            placeholder="Filtrar..."
                                            className="mt-2 px-2 py-1 text-xs w-full font-normal border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                        />
                                    )}
                                </th>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                    <div className="flex items-center gap-1.5">
                                        <span>Cuenta / Correo</span>
                                        <Search className="w-3.5 h-3.5 cursor-pointer text-gray-400 hover:text-brand-primary transition-colors" onClick={() => setShowFilterEmail(!showFilterEmail)} />
                                    </div>
                                    {showFilterEmail && (
                                        <input
                                            type="text"
                                            value={filterEmail}
                                            onChange={(e) => setFilterEmail(e.target.value)}
                                            placeholder="Filtrar..."
                                            className="mt-2 px-2 py-1 text-xs w-full font-normal border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-primary"
                                        />
                                    )}
                                </th>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Vencimiento</th>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.slice(0, 50).map((c, i) => {
                                const phone = c.numero || c.Numero;
                                return (
                                    <React.Fragment key={i}>
                                        <tr className="border-b dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-all">
                                            <td className="py-3.5 px-4 text-sm dark:text-gray-200 font-medium">{c.Nombre || 'N/A'}</td>
                                            <td className="py-3.5 px-4 text-sm dark:text-gray-200 font-mono">{phone}</td>
                                            <td className="py-3.5 px-4 text-sm dark:text-gray-200">
                                                <span className="bg-brand-primary/10 text-brand-primary dark:text-brand-light px-2.5 py-1 rounded-md text-xs font-bold">
                                                    {c.Streaming || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-sm text-gray-500 dark:text-gray-450">{c.correo || '-'}</td>
                                            <td className="py-3.5 px-4 text-sm font-mono dark:text-gray-300">{formatExcelDate(c.deben || c.vencimiento)}</td>
                                            <td className="py-3.5 px-4 text-sm">
                                                <div className="flex gap-1.5">
                                                    <button 
                                                        onClick={() => handleSendAction(phone, 'credentials')}
                                                        className="bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 text-blue-700 dark:text-blue-200 px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                                                        title="Enviar Credenciales"
                                                    >
                                                        🔑
                                                    </button>
                                                    <button 
                                                        onClick={() => handleSendAction(phone, 'payment')}
                                                        className="bg-green-50 dark:bg-green-900/30 hover:bg-green-100 text-green-700 dark:text-green-200 px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                                                        title="Cobrar"
                                                    >
                                                        💰
                                                    </button>
                                                    <button 
                                                        onClick={() => toggleExpandHistory(phone, i)}
                                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                                            expandedClient === i 
                                                                ? 'bg-purple-600 text-white' 
                                                                : 'bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 text-purple-700 dark:text-purple-200'
                                                        }`}
                                                        title="Historial de compras"
                                                    >
                                                        🕒
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Purchase History Expanded Drawer */}
                                        {expandedClient === i && (
                                            <tr>
                                                <td colSpan={6} className="bg-gray-50/50 dark:bg-gray-900/20 px-6 py-4 border-b dark:border-gray-700">
                                                    {historyLoading ? (
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                            <Clock className="w-4 h-4 animate-spin text-brand-primary" />
                                                            <span>Analizando historial en la base de datos...</span>
                                                        </div>
                                                    ) : !clientHistory || !clientHistory.historial || clientHistory.historial.length === 0 ? (
                                                        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                                                            <ShieldAlert className="w-4 h-4" />
                                                            <span>No se encontraron registros anteriores para este cliente en el histórico.</span>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-center">
                                                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                                    Historial de compras: {clientHistory.nombre} {clientHistory.apellido}
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
                                                                            <div className="flex gap-4 text-[11px] text-gray-400 dark:text-gray-550 border-t dark:border-gray-700 pt-2 mt-2">
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
                            })}
                        </tbody>
                    </table>
                    {filtered.length > 50 && <p className="text-center text-sm text-gray-500 mt-4">Mostrando 50 resultados...</p>}
                </div>
            )}
        </div>
    );
};
