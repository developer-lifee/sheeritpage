import React, { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';

export const ClientsView: React.FC = () => {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    const filtered = clients.filter(c => 
        (c.Nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.numero || '').toString().includes(searchTerm)
    );

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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center dark:text-white">
                    <Users className="mr-2" /> Base de Datos (Graph)
                </h2>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar cliente o número..." 
                        className="pl-9 pr-4 py-2 w-full border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <p className="text-center py-10 dark:text-gray-400">Cargando datos desde Microsoft Graph...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b dark:border-gray-700">
                                <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Nombre</th>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Número</th>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Servicio</th>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Cuenta / Correo</th>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Vencimiento</th>
                                <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.slice(0, 50).map((c, i) => (
                                <tr key={i} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="py-3 px-4 text-sm dark:text-gray-200">{c.Nombre || 'N/A'}</td>
                                    <td className="py-3 px-4 text-sm dark:text-gray-200">{c.numero}</td>
                                    <td className="py-3 px-4 text-sm dark:text-gray-200">
                                        <span className="bg-brand-primary/10 text-brand-primary px-2 py-1 rounded-md text-xs font-bold">
                                            {c.Streaming || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{c.correo || '-'}</td>
                                    <td className="py-3 px-4 text-sm font-mono dark:text-gray-300">{c.deben ? `${c.deben}` : c.vencimiento || '-'}</td>
                                    <td className="py-3 px-4 text-sm">
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleSendAction(c.numero, 'credentials')}
                                                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs font-bold transition-colors"
                                                title="Enviar Credenciales"
                                            >
                                                🔑 Creds
                                            </button>
                                            <button 
                                                onClick={() => handleSendAction(c.numero, 'payment')}
                                                className="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded text-xs font-bold transition-colors"
                                                title="Cobrar"
                                            >
                                                💰 Cobro
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length > 50 && <p className="text-center text-sm text-gray-500 mt-4">Mostrando 50 resultados...</p>}
                </div>
            )}
        </div>
    );
};
