import React, { useState } from 'react';
import { Tv, Search, MapPin, CheckCircle2, XCircle } from 'lucide-react';

export const NetflixMatchView: React.FC = () => {
    const [isp, setIsp] = useState('');
    const [loading, setLoading] = useState(false);
    const [matchData, setMatchData] = useState<{ rawReport: string, hasStock: boolean } | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
        
        fetch(`${apiUrl}/api/admin/match?isp=${encodeURIComponent(isp)}`)
            .then(res => res.json())
            .then(data => {
                setMatchData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching match data:", err);
                setLoading(false);
            });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6">
            <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-4">
                    <Tv className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold dark:text-white">Predictor de Hogar Inteligente</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Encuentra o predice cuentas ideales según IPS/Ubicación o IP de usuario.</p>
                </div>
            </div>

            <form onSubmit={handleSearch} className="mb-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Buscar por Operador / Ubicación (Ej: movistar-engativa, suba, etc)
                </label>
                <div className="flex gap-2">
                    <div className="relative flex-grow">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input 
                            type="text" 
                            value={isp}
                            onChange={(e) => setIsp(e.target.value)}
                            placeholder="Ingrese los datos del nuevo cliente..."
                            className="w-full pl-10 pr-4 py-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-brand-primary text-white px-6 py-3 rounded-xl font-bold flex items-center hover:bg-opacity-90 disabled:opacity-50"
                    >
                        <Search className="w-5 h-5 mr-2" />
                        {loading ? 'Analizando...' : 'Buscar Matches'}
                    </button>
                </div>
            </form>

            {matchData && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    <div className={`px-4 py-3 font-semibold flex items-center justify-between text-white ${matchData.hasStock ? 'bg-green-600' : 'bg-red-600'}`}>
                        <div className="flex items-center">
                            {matchData.hasStock ? <CheckCircle2 className="mr-2" /> : <XCircle className="mr-2" />}
                            {matchData.hasStock ? 'Hay stock disponible o cortable' : 'No hay cuentas que cumplan las condiciones'}
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 overflow-x-auto">
                        <pre className="text-sm dark:text-gray-300 font-mono whitespace-pre-wrap">
                            {matchData.rawReport || "Sin resultados..."}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};
