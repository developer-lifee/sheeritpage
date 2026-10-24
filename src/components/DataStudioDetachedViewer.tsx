import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Monitor, Table, FileSpreadsheet, Search, RefreshCw, 
  BarChart2, Columns, Database, CheckCircle2, AlertTriangle, X
} from 'lucide-react';
import * as XLSX from 'xlsx';

export interface DualScreenPayload {
  title: string;
  sourceQuery?: string;
  tableName?: string;
  columns: string[];
  rows: any[];
  totalRows: number;
  executionTime?: string;
  timestamp: number;
}

export function DataStudioDetachedViewer() {
  const [data, setData] = useState<DualScreenPayload | null>(() => {
    try {
      const cached = localStorage.getItem('sheerit_datastudio_last_payload');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [tables, setTables] = useState<any[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'cards' | 'stats'>('grid');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isConnected, setIsConnected] = useState(true);
  const [loadingTableData, setLoadingTableData] = useState(false);

  const getApiUrl = () => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:3000';
    }
    return window.location.origin;
  };

  // Cargar lista de tablas para navegación autónoma
  const loadTablesList = async () => {
    setLoadingTables(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/database/tables`);
      const json = await res.json();
      if (json.success && Array.isArray(json.tables)) {
        setTables(json.tables);
      }
    } catch (e) {
      console.warn('Error cargando tablas en monitor 2:', e);
    } finally {
      setLoadingTables(false);
    }
  };

  // Cargar una tabla seleccionada directamente en este monitor
  const handleSelectTable = async (tableName: string) => {
    if (!tableName) return;
    setLoadingTableData(true);
    try {
      const q = `SELECT * FROM ${tableName} LIMIT 100;`;
      const res = await fetch(`${getApiUrl()}/api/admin/database/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: q, limit: 100 })
      });
      const json = await res.json();
      if (json.success) {
        const payload: DualScreenPayload = {
          title: `Tabla: ${tableName} (${json.rowCount || (json.rows ? json.rows.length : 0)} filas)`,
          sourceQuery: q,
          tableName,
          columns: json.fields?.map((f: any) => typeof f === 'string' ? f : f.name) || (json.rows && json.rows[0] ? Object.keys(json.rows[0]) : []),
          rows: json.rows || [],
          totalRows: json.rowCount || (json.rows ? json.rows.length : 0),
          executionTime: json.executionTime || '0ms',
          timestamp: Date.now()
        };
        setData(payload);
        localStorage.setItem('sheerit_datastudio_last_payload', JSON.stringify(payload));
      }
    } catch (e) {
      console.error('Error cargando tabla en visor:', e);
    } finally {
      setLoadingTableData(false);
    }
  };

  // Conectar con BroadcastChannel
  useEffect(() => {
    loadTablesList();

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('sheerit_datastudio_channel_v1');
        channel.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (type === 'DATA_UPDATE' && payload) {
            setData(payload);
            setIsConnected(true);
            setCurrentPage(1);
          } else if (type === 'PING') {
            setIsConnected(true);
            channel?.postMessage({ type: 'PONG' });
          }
        };

        // Enviar PING al monitor principal
        channel.postMessage({ type: 'PING' });
      }
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }

    // Escuchar también almacenamiento local como fallback
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sheerit_datastudio_last_payload' && e.newValue) {
        try {
          setData(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      channel?.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Filtrado reactivo de filas
  const filteredRows = useMemo(() => {
    if (!data?.rows) return [];
    let list = [...data.rows];
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      list = list.filter(row => {
        return Object.values(row).some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(q));
      });
    }
    if (sortColumn) {
      list.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        const res = valA > valB ? 1 : -1;
        return sortDirection === 'asc' ? res : -res;
      });
    }
    return list;
  }, [data?.rows, filterText, sortColumn, sortDirection]);

  // Paginación
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;

  // Estadísticas de Columnas (% Nulos, Únicos)
  const columnStats = useMemo(() => {
    if (!data?.rows || data.rows.length === 0 || !data.columns) return {};
    const stats: Record<string, { total: number; nulls: number; nullPct: number; uniqueCount: number; sampleValues: any[] }> = {};
    const total = data.rows.length;

    data.columns.forEach(col => {
      let nulls = 0;
      const uniqueSet = new Set();
      data.rows.forEach(r => {
        const val = r[col];
        if (val === null || val === undefined || val === '') {
          nulls++;
        } else {
          uniqueSet.add(val);
        }
      });
      stats[col] = {
        total,
        nulls,
        nullPct: Math.round((nulls / total) * 100),
        uniqueCount: uniqueSet.size,
        sampleValues: Array.from(uniqueSet).slice(0, 5)
      };
    });
    return stats;
  }, [data]);

  // Exportar a Excel
  const handleExportExcel = () => {
    if (!filteredRows.length) return;
    const ws = XLSX.utils.json_to_sheet(filteredRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');
    XLSX.writeFile(wb, `sheerit_monitor2_${data?.tableName || 'export'}_${Date.now()}.xlsx`);
  };

  // Exportar a CSV
  const handleExportCsv = () => {
    if (!filteredRows.length || !data?.columns) return;
    const headers = data.columns.join(',');
    const rows = filteredRows.map(r => data.columns.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sheerit_monitor2_${data?.tableName || 'export'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-gray-100 font-sans p-4 flex flex-col antialiased">
      {/* HEADER DE CONTROL DEL MONITOR 2 */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 mb-4 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 shadow-lg shadow-indigo-500/20">
            <Monitor className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-black text-white tracking-wide">
                🖥️ Sheerit Data Studio — Monitor 2
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Sincronizado</span>
              </span>
            </div>
            <p className="text-xs text-indigo-300 font-mono mt-0.5">
              {data?.title || 'Esperando transmisión desde Monitor 1 (ejecuta una consulta o selecciona una tabla)...'}
            </p>
          </div>
        </div>

        {/* CONTROLES RÁPIDOS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de tablas */}
          <select
            className="px-3.5 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-gray-200 focus:outline-none focus:border-indigo-500 font-medium"
            value={data?.tableName || ''}
            onChange={(e) => handleSelectTable(e.target.value)}
            disabled={loadingTableData}
          >
            <option value="">-- Ver otra tabla maestra --</option>
            {tables.map(t => (
              <option key={t.name} value={t.name}>{t.name} ({t.exactRows ?? t.estimatedRows} filas)</option>
            ))}
          </select>

          {/* Vistas: Grid vs Fichas vs Stats */}
          <div className="flex rounded-xl bg-slate-800 p-0.5 border border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              title="Vista Hoja de Cálculo / Grid"
            >
              <Table className="w-3.5 h-3.5 inline mr-1" /> Grid
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'cards' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              title="Vista Fichas 360°"
            >
              <Columns className="w-3.5 h-3.5 inline mr-1" /> Fichas
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'stats' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              title="Estadísticas de Columnas"
            >
              <BarChart2 className="w-3.5 h-3.5 inline mr-1" /> Stats
            </button>
          </div>

          {/* Exportar */}
          <button
            onClick={handleExportExcel}
            className="p-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
            title="Exportar a Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => window.close()}
            className="p-2 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-all active:scale-95"
            title="Cerrar esta ventana emergente"
          >
            ✕ Cerrar
          </button>
        </div>
      </div>

      {/* BARRA DE HERRAMIENTAS: BÚSQUEDA Y FILTRADO */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 mb-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow">
        <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-indigo-400" />
          <input
            type="text"
            placeholder="🔍 Buscar en todas las columnas y campos en tiempo real..."
            value={filterText}
            onChange={(e) => {
              setFilterText(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
          />
          {filterText && (
            <button onClick={() => setFilterText('')} className="text-gray-400 hover:text-white text-xs px-2 py-0.5 rounded bg-slate-800">
              Limpiar
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
          <span>Total: <strong className="text-white">{filteredRows.length}</strong> {filteredRows.length !== (data?.rows?.length || 0) && `(de ${data?.rows?.length || 0})`} filas</span>
          {data?.executionTime && (
            <span>⏱️ <strong>{data.executionTime}</strong></span>
          )}
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg bg-slate-800 disabled:opacity-40 text-xs font-bold hover:bg-slate-700 transition-all"
            >
              ◀
            </button>
            <span className="text-white font-bold px-1">{currentPage} / {totalPages}</span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-lg bg-slate-800 disabled:opacity-40 text-xs font-bold hover:bg-slate-700 transition-all"
            >
              ▶
            </button>
          </div>
        </div>
      </div>

      {/* CUERPO PRINCIPAL */}
      {loadingTableData ? (
        <div className="flex-1 flex flex-col items-center justify-center p-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80">
          <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mb-3" />
          <p className="text-sm font-bold text-gray-300">Cargando registros desde la base de datos...</p>
        </div>
      ) : !data || !data.rows || data.rows.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-16 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80">
          <Database className="w-14 h-14 text-indigo-400/40 mb-4 animate-pulse" />
          <h2 className="text-base font-bold text-gray-200">Visor de Monitor 2 Listo</h2>
          <p className="text-xs text-gray-400 max-w-lg mt-2 leading-relaxed">
            Puedes seleccionar cualquier tabla arriba en el menú desplegable, o ejecutar consultas y auditorías en el <strong>Monitor 1</strong> para verlas aquí proyectadas a pantalla completa.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* VISTA 1: GRID HOJA DE CÁLCULO */
        <div className="flex-1 overflow-auto rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-20 bg-slate-800 text-gray-200 font-bold uppercase text-[10px] tracking-wider border-b border-slate-700 shadow-md">
              <tr>
                <th className="p-3.5 w-12 text-center text-gray-500">#</th>
                {(data.columns || []).map(col => (
                  <th
                    key={col}
                    onClick={() => {
                      if (sortColumn === col) {
                        setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortColumn(col);
                        setSortDirection('asc');
                      }
                    }}
                    className="p-3.5 cursor-pointer hover:bg-slate-700 transition-colors select-none whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col}</span>
                      {sortColumn === col && (
                        <span className="text-indigo-400 text-xs font-black">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
              {paginatedRows.map((row, idx) => {
                const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                return (
                  <tr
                    key={idx}
                    onClick={() => setSelectedRow(row)}
                    className="hover:bg-indigo-600/15 cursor-pointer transition-colors group"
                  >
                    <td className="p-3 text-center text-gray-500 font-sans text-[10px] select-none">{globalIndex}</td>
                    {(data.columns || []).map(col => {
                      const val = row[col];
                      const isNull = val === null || val === undefined;
                      return (
                        <td key={col} className="p-3 truncate max-w-xs text-gray-300 group-hover:text-white">
                          {isNull ? (
                            <span className="text-gray-600 italic">NULL</span>
                          ) : typeof val === 'object' ? (
                            JSON.stringify(val)
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : viewMode === 'cards' ? (
        /* VISTA 2: FICHAS 360° POR FILA */
        <div className="flex-1 overflow-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-1">
          {paginatedRows.map((row, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedRow(row)}
              className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/60 cursor-pointer transition-all hover:shadow-xl space-y-3 text-xs"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <span className="font-black text-indigo-400">
                  Registro #{ (currentPage - 1) * pageSize + idx + 1 }
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-gray-400 font-mono">
                  {data.tableName || 'Fila'}
                </span>
              </div>
              <div className="space-y-2 font-mono text-[11px]">
                {(data.columns || []).slice(0, 8).map(col => (
                  <div key={col} className="flex justify-between items-center gap-2">
                    <span className="text-gray-400 font-sans text-[10px] truncate">{col}:</span>
                    <span className="text-white font-bold truncate max-w-[200px]">
                      {row[col] === null || row[col] === undefined ? '—' : String(row[col])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* VISTA 3: ESTADÍSTICAS Y CALIDAD DE COLUMNAS */
        <div className="flex-1 overflow-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <h2 className="text-xs font-black uppercase text-indigo-400 tracking-wider">
            📊 Perfilado de Calidad por Columna ({(data.columns || []).length} campos)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(data.columns || []).map(col => {
              const s = columnStats[col];
              if (!s) return null;
              return (
                <div key={col} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white truncate">{col}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${s.nullPct > 20 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                      {s.nullPct}% Nulos
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-300 space-y-1">
                    <div>Valores Únicos: <strong className="text-white">{s.uniqueCount}</strong></div>
                    <div>Faltantes: <strong className="text-rose-400">{s.nulls}</strong> / {s.total}</div>
                  </div>
                  {s.sampleValues.length > 0 && (
                    <div className="pt-2 border-t border-slate-700/50 text-[10px] text-gray-400">
                      <span className="text-gray-500">Muestra: </span>
                      {s.sampleValues.map(v => String(v)).join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE FILA 360° */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Table className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Inspección de Registro Individual</h3>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="text-gray-400 hover:text-white font-bold p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto space-y-2 pr-1">
              {Object.entries(selectedRow).map(([key, value]) => (
                <div key={key} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="text-indigo-300 font-bold font-sans">{key}</span>
                  <span className="text-gray-100 font-mono text-[11px] break-all select-all">
                    {value === null ? '<NULL>' : typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedRow(null)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
              >
                Cerrar Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default DataStudioDetachedViewer;
