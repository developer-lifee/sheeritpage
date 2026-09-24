import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Database, Play, RefreshCw, Download, Table, 
  Search, CheckCircle2, AlertTriangle, XCircle, 
  UploadCloud, FileSpreadsheet, ArrowRight, Layers,
  ChevronRight, ChevronDown, ZoomIn, ZoomOut, Maximize2,
  Key, Link2, Sparkles, Filter, ShieldCheck, HelpCircle,
  FileCode, Cpu, UserCheck, HardDrive, Trash2,
  Move, Copy, Eye, Code2, Focus, Compass, Split
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface TableColumn {
  name: string;
  dataType: string;
  fullType?: string;
  isPk: boolean;
  isFk: boolean;
  isNullable: boolean;
  defaultValue: any;
}

interface TableOverview {
  name: string;
  domain: string;
  exactRows: number;
  estimatedRows: number;
  columns: TableColumn[];
}

interface SchemaEdge {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  constraintName?: string;
  type: 'foreign_key' | 'logical';
}

const PRESET_QUERIES = [
  {
    name: 'Suscripciones que vencen en los próximos 7 días',
    sql: `SELECT s.id, c.fullname, s.customer_phone, s.streaming_platform, s.account_email, s.expiration_date, s.payment_method\nFROM subscriptions s\nJOIN customers c ON s.customer_phone = c.phone\nWHERE s.expiration_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)\nORDER BY s.expiration_date ASC;`
  },
  {
    name: 'Cuentas con perfiles asignados vs capacidad',
    sql: `SELECT sa.streaming_platform, sa.account_email, sa.status, COUNT(s.id) as asignaciones_activas\nFROM stream_accounts sa\nLEFT JOIN subscriptions s ON sa.account_email = s.account_email AND s.status = 'active'\nGROUP BY sa.streaming_platform, sa.account_email, sa.status\nORDER BY asignaciones_activas DESC;`
  },
  {
    name: 'Últimas 50 transacciones y mensajes registrados',
    sql: `SELECT m.id, m.chat_id, m.sender_name, m.body, m.is_from_me, m.bot_intent, m.created_at\nFROM messages m\nORDER BY m.created_at DESC\nLIMIT 50;`
  },
  {
    name: 'Clientes ordenados por número de suscripciones',
    sql: `SELECT c.phone, c.fullname, COUNT(s.id) as total_servicios\nFROM customers c\nLEFT JOIN subscriptions s ON c.phone = s.customer_phone\nGROUP BY c.phone, c.fullname\nORDER BY total_servicios DESC\nLIMIT 50;`
  },
  {
    name: 'Balance de costos y precios por plataforma',
    sql: `SELECT p.name, p.price as precio_venta, sp.normal_price as precio_referencia\nFROM platforms p\nLEFT JOIN streaming_prices sp ON p.name = sp.platform\nWHERE p.is_active = 1;`
  }
];

export function DataStudioView() {
  const [activeTab, setActiveTab] = useState<'query' | 'er' | 'import'>('query');
  const [tables, setTables] = useState<TableOverview[]>([]);
  const [edges, setEdges] = useState<SchemaEdge[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // SQL Studio States
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM customers LIMIT 25;');
  const [queryLimit, setQueryLimit] = useState<number>(100);
  const [allowWrite, setAllowWrite] = useState<boolean>(false);
  const [runningQuery, setRunningQuery] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [tableSearch, setTableSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('');

  // ER Diagram States
  const [zoomLevel, setZoomLevel] = useState<number>(0.85);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedErTable, setSelectedErTable] = useState<TableOverview | null>(null);
  const [tablePositions, setTablePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredEdge, setHoveredEdge] = useState<SchemaEdge | null>(null);
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);
  const [focusedTable, setFocusedTable] = useState<string | null>(null);
  const [erSubTab, setErSubTab] = useState<'canvas' | 'connections' | 'mermaid'>('canvas');
  const [searchErTable, setSearchErTable] = useState<string>('');
  const [mermaidCopied, setMermaidCopied] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Import Wizard States
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importRawRows, setImportRawRows] = useState<any[]>([]);
  const [targetEntity, setTargetEntity] = useState<'subscriptions' | 'customers' | 'stream_accounts'>('subscriptions');
  const [tenantId, setTenantId] = useState<string>('Sheerit Principal');
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importExecuting, setImportExecuting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const getApiUrl = () => {
    return (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
      ? 'http://localhost:3000'
      : window.location.origin;
  };

  // Algoritmo de posicionamiento estructurado por columnas lógicas
  const computeDefaultPositions = (tableList: TableOverview[]) => {
    const positions: Record<string, { x: number; y: number }> = {};
    const colY: Record<number, number> = { 0: 60, 1: 60, 2: 60, 3: 60 };

    tableList.forEach(t => {
      let col = 0;
      const name = t.name.toLowerCase();
      
      if (name.includes('customer') || name.includes('sales') || name.includes('excel_historical')) {
        col = 0; // Columna 1: Clientes y Ventas
      } else if (name.includes('subscription') || name.includes('chat') || name.includes('message') || name.includes('user_state')) {
        col = 1; // Columna 2: Suscripciones y Operaciones
      } else if (name.includes('stream') || name.includes('platform') || name.includes('rpa') || name.includes('recipe')) {
        col = 2; // Columna 3: Inventario Cuentas & Streaming
      } else {
        col = 3; // Columna 4: Agentes, Tareas & Nómina
      }

      const x = 60 + col * 480;
      const y = colY[col];
      positions[t.name] = { x, y };

      const estimatedHeight = Math.min(380, 130 + (t.columns?.length || 4) * 23);
      colY[col] += estimatedHeight + 70; // 70px de espacio vertical entre tablas
    });

    return positions;
  };

  // Cargar esquema inicial
  const loadSchema = async () => {
    setLoadingSchema(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/admin/database/schema-graph`);
      const data = await res.json();
      if (data.success && data.graph) {
        setTables(data.graph.nodes || []);
        setEdges(data.graph.edges || []);
        setTablePositions(computeDefaultPositions(data.graph.nodes || []));
        if (data.graph.nodes?.length > 0 && !selectedTable) {
          setSelectedTable(data.graph.nodes[0].name);
        }
      }
    } catch (e: any) {
      console.error('Error cargando esquema ER:', e);
    } finally {
      setLoadingSchema(false);
    }
  };

  useEffect(() => {
    loadSchema();
  }, []);

  // Manejo de Arrastre (Drag & Drop) de tablas en el Canvas ER
  const handleStartDrag = (tableName: string, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const current = tablePositions[tableName] || { x: 50, y: 50 };
    setDraggingTable(tableName);
    setDragOffset({
      x: e.clientX / zoomLevel - current.x,
      y: e.clientY / zoomLevel - current.y
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!draggingTable) return;
    const newX = Math.max(20, Math.round(e.clientX / zoomLevel - dragOffset.x));
    const newY = Math.max(20, Math.round(e.clientY / zoomLevel - dragOffset.y));
    setTablePositions(prev => ({
      ...prev,
      [draggingTable]: { x: newX, y: newY }
    }));
  };

  const handleCanvasMouseUp = () => {
    if (draggingTable) setDraggingTable(null);
  };

  // Ejecutar consulta SQL
  const handleExecuteQuery = async (queryToRun?: string) => {
    const query = queryToRun || sqlQuery;
    if (!query.trim()) return;

    setRunningQuery(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      const res = await fetch(`${getApiUrl()}/api/admin/database/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: query,
          allowWrite,
          limit: queryLimit
        })
      });

      const data = await res.json();
      if (data.success) {
        setQueryResult(data);
      } else {
        setQueryError(data.error || 'Error al ejecutar consulta');
      }
    } catch (e: any) {
      setQueryError(e.message || 'Error de conexión con el servidor');
    } finally {
      setRunningQuery(false);
    }
  };

  // Exportar resultados a CSV
  const exportResultToCsv = () => {
    if (!queryResult || !queryResult.rows || !queryResult.rows.length) return;
    const ws = XLSX.utils.json_to_sheet(queryResult.rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    XLSX.writeFile(wb, `query_result_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // Filtrado de tablas para explorador
  const filteredTables = useMemo(() => {
    if (!tableSearch) return tables;
    return tables.filter(t => t.name.toLowerCase().includes(tableSearch.toLowerCase()) || t.domain.toLowerCase().includes(tableSearch.toLowerCase()));
  }, [tables, tableSearch]);

  // Dominios únicos para el ER
  const domains = useMemo(() => {
    const set = new Set(tables.map(t => t.domain));
    return ['all', ...Array.from(set)];
  }, [tables]);

  // Filtrado de tablas por dominio para el ER
  const erFilteredTables = useMemo(() => {
    if (selectedDomain === 'all') return tables;
    return tables.filter(t => t.domain === selectedDomain);
  }, [tables, selectedDomain]);

  // Manejador de archivo Excel/CSV en el importador
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          setImportHeaders(headers);
          setImportRawRows(data);

          // Obtener sugerencia de mapeo del backend
          const res = await fetch(`${getApiUrl()}/api/admin/database/import-preview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              headers,
              rows: data.slice(0, 15),
              targetEntity
            })
          });
          const previewData = await res.json();
          if (previewData.success) {
            setColumnMapping(previewData.preview.suggestedMapping || {});
            setImportPreview(previewData.preview);
          }
        }
      } catch (err: any) {
        alert('Error al leer el archivo Excel/CSV: ' + err.message);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Ejecutar importación real en MySQL
  const handleExecuteImport = async () => {
    if (!importRawRows.length) return;
    setImportExecuting(true);
    setImportResult(null);

    try {
      const res = await fetch(`${getApiUrl()}/api/admin/database/import-execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEntity,
          mapping: columnMapping,
          rows: importRawRows,
          tenantId,
          options: { createCustomersIfMissing: true }
        })
      });
      const data = await res.json();
      setImportResult(data);
      if (data.success) {
        // Refrescar conteos
        loadSchema();
      }
    } catch (e: any) {
      setImportResult({ success: false, error: e.message });
    } finally {
      setImportExecuting(false);
    }
  };

  // Filtrado de filas en la grilla de resultados
  const displayedRows = useMemo(() => {
    if (!queryResult || !queryResult.rows) return [];
    if (!resultFilter) return queryResult.rows;
    const lower = resultFilter.toLowerCase();
    return queryResult.rows.filter((row: any) => 
      Object.values(row).some(v => String(v).toLowerCase().includes(lower))
    );
  }, [queryResult, resultFilter]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* HEADER PRINCIPAL */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-500/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-indigo-300">
            <Database className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">Data Studio & Relational Hub</h1>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                MySQL 8.0 Conectado
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-1 max-w-xl">
              Entorno administrativo integral: Consultas SQL en vivo (tipo DBeaver), Diagrama ER dinámico y asistente de transformación de archivos Excel a tablas relacionales Multi-Tenant.
            </p>
          </div>
        </div>

        {/* MÉTRICAS RÁPIDAS */}
        <div className="flex items-center gap-4 text-xs">
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
            <span className="text-gray-400 block font-medium">Tablas Activas</span>
            <span className="text-lg font-black text-white">{tables.length}</span>
          </div>
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
            <span className="text-gray-400 block font-medium">Relaciones Detectadas</span>
            <span className="text-lg font-black text-indigo-300">{edges.length}</span>
          </div>
          <button 
            onClick={loadSchema}
            disabled={loadingSchema}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-all active:scale-95"
            title="Refrescar Esquema"
          >
            <RefreshCw className={`w-4 h-4 ${loadingSchema ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* PESTAÑAS DE NAVEGACIÓN */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 space-x-2">
        <button
          onClick={() => setActiveTab('query')}
          className={`flex items-center gap-2 px-5 py-3 font-extrabold text-sm border-b-2 transition-all ${
            activeTab === 'query'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>1. Query Studio (SQL)</span>
        </button>

        <button
          onClick={() => setActiveTab('er')}
          className={`flex items-center gap-2 px-5 py-3 font-extrabold text-sm border-b-2 transition-all ${
            activeTab === 'er'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Diagrama Modelo ER</span>
        </button>

        <button
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-2 px-5 py-3 font-extrabold text-sm border-b-2 transition-all ${
            activeTab === 'import'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>3. Importador & Mapeador Multi-Tenant</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: QUERY STUDIO (TIPO DBEAVER) */}
      {/* ========================================================================= */}
      {activeTab === 'query' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* BARRA LATERAL: EXPLORADOR DE TABLAS */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-3xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Table className="w-4 h-4 text-indigo-500" />
                <span>Explorador de Tablas</span>
              </h2>
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full">
                {filteredTables.length}
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input 
                type="text"
                placeholder="Buscar tabla o dominio..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="max-h-[550px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {filteredTables.map(t => (
                <div 
                  key={t.name}
                  onClick={() => {
                    setSelectedTable(t.name);
                    setSqlQuery(`SELECT * FROM \`${t.name}\` LIMIT 50;`);
                  }}
                  className={`p-2.5 rounded-2xl cursor-pointer transition-all text-xs flex items-center justify-between border ${
                    selectedTable === t.name 
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400/40 text-indigo-950 dark:text-indigo-200 font-bold shadow-sm'
                      : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Table className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{t.name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {t.exactRows.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ÁREA PRINCIPAL: EDITOR SQL Y RESULTADOS */}
          <div className="lg:col-span-9 space-y-4">
            {/* EDITOR SQL */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Consultas Rápidas:</span>
                  <select
                    onChange={(e) => {
                      const found = PRESET_QUERIES.find(p => p.name === e.target.value);
                      if (found) setSqlQuery(found.sql);
                    }}
                    className="text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="">-- Seleccionar Plantilla --</option>
                    {PRESET_QUERIES.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={allowWrite}
                      onChange={(e) => setAllowWrite(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className="font-semibold">Permitir DML (INSERT/UPDATE)</span>
                  </label>

                  <select
                    value={queryLimit}
                    onChange={(e) => setQueryLimit(Number(e.target.value))}
                    className="text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-gray-700 dark:text-gray-300 font-mono"
                  >
                    <option value={25}>Límite: 25</option>
                    <option value={50}>Límite: 50</option>
                    <option value={100}>Límite: 100</option>
                    <option value={250}>Límite: 250</option>
                    <option value={500}>Límite: 500</option>
                  </select>

                  <button
                    onClick={() => handleExecuteQuery()}
                    disabled={runningQuery}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <Play className={`w-3.5 h-3.5 ${runningQuery ? 'animate-spin' : ''}`} />
                    <span>{runningQuery ? 'Ejecutando...' : 'Ejecutar (F9)'}</span>
                  </button>
                </div>
              </div>

              {/* TEXTAREA CON FORMATO MONOSPACE */}
              <div className="relative">
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleExecuteQuery();
                    }
                  }}
                  rows={5}
                  placeholder="Escribe tu consulta SQL aquí... Ej: SELECT * FROM customers LIMIT 20;"
                  className="w-full p-3 font-mono text-xs rounded-2xl bg-slate-950 text-emerald-300 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner resize-y leading-relaxed"
                />
              </div>
            </div>

            {/* MENSAJES DE ERROR O RETORNO DML */}
            {queryError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <span className="font-bold block">Error en consulta SQL:</span>
                  <p className="font-mono mt-0.5">{queryError}</p>
                </div>
              </div>
            )}

            {queryResult && !queryResult.isResultSet && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Sentencia DML ejecutada exitosamente</span>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                      Filas afectadas: {queryResult.affectedRows} | Insert ID: {queryResult.insertId || 'N/A'} | Tiempo: {queryResult.executionTimeMs}ms
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TABLA DE RESULTADOS */}
            {queryResult && queryResult.isResultSet && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      Resultados ({displayedRows.length} de {queryResult.rowCount})
                    </span>
                    <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                      ⚡ {queryResult.executionTimeMs} ms
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Filtrar resultados..."
                        value={resultFilter}
                        onChange={(e) => setResultFilter(e.target.value)}
                        className="pl-8 pr-3 py-1 text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={exportResultToCsv}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exportar Excel</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-2xl max-h-[450px] scrollbar-thin">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 sticky top-0 border-b border-gray-200 dark:border-gray-700 select-none">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center text-gray-400">#</th>
                        {queryResult.columns.map((col: any) => (
                          <th key={col.name} className="py-2.5 px-4 font-bold truncate">
                            {col.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                      {displayedRows.map((row: any, rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors">
                          <td className="py-2 px-3 text-center text-[10px] text-gray-400 font-sans">{rIdx + 1}</td>
                          {queryResult.columns.map((col: any) => (
                            <td 
                              key={col.name} 
                              className="py-2 px-4 whitespace-nowrap max-w-xs truncate cursor-pointer hover:underline"
                              onClick={() => navigator.clipboard.writeText(String(row[col.name] ?? ''))}
                              title="Haz clic para copiar"
                            >
                              {row[col.name] === null ? (
                                <span className="text-gray-400 italic">NULL</span>
                              ) : typeof row[col.name] === 'object' ? (
                                JSON.stringify(row[col.name])
                              ) : (
                                String(row[col.name])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DIAGRAMA MODELO ER INTERACTIVO CON CONECTORES SVG */}
      {/* ========================================================================= */}
      {activeTab === 'er' && (
        <div className="space-y-4">
          {/* BARRA DE HERRAMIENTAS SUPERIOR DEL MODELO ER */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-wrap items-center justify-between gap-4">
            {/* SUB-PESTAÑAS DE VISTA */}
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-xs font-bold">
              <button
                onClick={() => setErSubTab('canvas')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  erSubTab === 'canvas' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Lienzo Visual con Conectores</span>
              </button>

              <button
                onClick={() => setErSubTab('connections')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  erSubTab === 'connections' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Mapa de Conexiones ({edges.length})</span>
              </button>

              <button
                onClick={() => setErSubTab('mermaid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  erSubTab === 'mermaid' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Código Mermaid ERD</span>
              </button>
            </div>

            {/* FILTROS Y CONTROLES */}
            <div className="flex flex-wrap items-center gap-3">
              {/* BUSCADOR DE TABLAS */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Localizar tabla..."
                  value={searchErTable}
                  onChange={(e) => setSearchErTable(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44"
                />
              </div>

              {/* FILTRAR DOMINIO */}
              <select 
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-gray-800 dark:text-gray-200 font-bold"
              >
                {domains.map(d => (
                  <option key={d} value={d}>
                    {d === 'all' ? '🌐 Todos los Dominios' : `📁 ${d}`}
                  </option>
                ))}
              </select>

              {/* CONTROLES DE ZOOM */}
              <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-xs"
                  title="Alejar Zoom"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono font-bold px-1.5 text-gray-600 dark:text-gray-300 min-w-[40px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button 
                  onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-xs"
                  title="Acercar Zoom"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* BOTÓN REORGANIZAR COLUMNAS */}
              <button 
                onClick={() => setTablePositions(computeDefaultPositions(tables))}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 transition-all flex items-center gap-1.5"
                title="Restablecer tablas a columnas separadas ordenadas"
              >
                <Split className="w-3.5 h-3.5 text-indigo-500" />
                <span>Reorganizar Columnas</span>
              </button>
            </div>
          </div>

          {/* BANNER DE MODO ENFOQUE (SI ESTÁ ACTIVO) */}
          {focusedTable && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs text-indigo-900 dark:text-indigo-200">
              <div className="flex items-center gap-2">
                <Focus className="w-4 h-4 text-indigo-500 animate-pulse flex-shrink-0" />
                <span>
                  Modo Enfoque activado en: <strong className="font-mono text-indigo-600 dark:text-indigo-400 font-black">{focusedTable}</strong>. Mostrando únicamente las conexiones y tablas que se relacionan directamente con ella.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSqlQuery(`SELECT * FROM \`${focusedTable}\` LIMIT 50;`);
                    setActiveTab('query');
                  }}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-sm"
                >
                  Consultar en SQL
                </button>
                <button
                  onClick={() => setFocusedTable(null)}
                  className="px-2.5 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl text-[11px] font-bold transition-all"
                >
                  Quitar Enfoque (Ver Todo)
                </button>
              </div>
            </div>
          )}

          {/* LEYENDA RÁPIDA DE CONECTORES */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] px-2 text-gray-500 dark:text-gray-400 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-cyan-400 rounded-full" />
              <span>Llave Foránea (Foreign Key)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-b-2 border-dashed border-purple-400" />
              <span>Relación Lógica del Negocio</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-amber-400 rounded-full ring-2 ring-amber-400/40" />
              <span>Relación Seleccionada / Activa</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400 ml-auto">
              <Move className="w-3 h-3" />
              <span>Puedes arrastrar cualquier tarjeta por su cabecera para reacomodarla libremente</span>
            </div>
          </div>

          {/* SUB-VISTA 1: LIENZO INTERACTIVO CON CONECTORES SVG */}
          {erSubTab === 'canvas' && (
            <div 
              ref={canvasRef}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-auto min-h-[750px] max-h-[85vh] relative select-none cursor-default bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px]"
            >
              {/* CONTENEDOR CON ESCALADO DE ZOOM */}
              <div 
                style={{ 
                  transform: `scale(${zoomLevel})`, 
                  transformOrigin: 'top left',
                  width: '2400px',
                  height: '3100px'
                }} 
                className="relative transition-transform duration-100"
              >
                {/* CAPA SVG CON LÍNEAS DE CONEXIÓN CURVAS */}
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  style={{ width: '100%', height: '100%' }}
                >
                  <defs>
                    {/* MARCADOR FLECHA CYAN (FK) */}
                    <marker id="arrow-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                    </marker>
                    {/* MARCADOR FLECHA PURPLE (LÓGICA) */}
                    <marker id="arrow-purple" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#c084fc" />
                    </marker>
                    {/* MARCADOR FLECHA AMBER (ACTIVA/HOVER) */}
                    <marker id="arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
                    </marker>
                  </defs>

                  {/* DIBUJO DE TODAS LAS ARISTAS / RELACIONES */}
                  {edges.map((e, idx) => {
                    const fromPos = tablePositions[e.fromTable] || { x: 50, y: 50 };
                    const toPos = tablePositions[e.toTable] || { x: 50, y: 50 };

                    // Si se está filtrando por dominio y alguna de las dos no pertenece, no dibujar si no aplica
                    if (selectedDomain !== 'all') {
                      const tFrom = tables.find(t => t.name === e.fromTable);
                      const tTo = tables.find(t => t.name === e.toTable);
                      if (tFrom?.domain !== selectedDomain && tTo?.domain !== selectedDomain) return null;
                    }

                    const cardWidth = 330;
                    let startX = 0;
                    let startY = fromPos.y + 44;
                    let endX = 0;
                    let endY = toPos.y + 44;
                    let pathD = '';
                    let midX = 0;
                    let midY = 0;

                    if (toPos.x >= fromPos.x + 280) {
                      // El destino está a la derecha
                      startX = fromPos.x + cardWidth;
                      endX = toPos.x;
                      const dx = Math.max(60, (endX - startX) * 0.45);
                      pathD = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
                      midX = (startX + endX) / 2;
                      midY = (startY + endY) / 2;
                    } else if (fromPos.x >= toPos.x + 280) {
                      // El destino está a la izquierda
                      startX = fromPos.x;
                      endX = toPos.x + cardWidth;
                      const dx = Math.max(60, (startX - endX) * 0.45);
                      pathD = `M ${startX} ${startY} C ${startX - dx} ${startY}, ${endX + dx} ${endY}, ${endX} ${endY}`;
                      midX = (startX + endX) / 2;
                      midY = (startY + endY) / 2;
                    } else {
                      // Están en la misma columna o alineados verticalmente (bucle exterior hacia la derecha)
                      startX = fromPos.x + cardWidth;
                      endX = toPos.x + cardWidth;
                      const loopX = Math.max(startX, endX) + 80;
                      pathD = `M ${startX} ${startY} C ${loopX} ${startY}, ${loopX} ${endY}, ${endX} ${endY}`;
                      midX = loopX - 10;
                      midY = (startY + endY) / 2;
                    }

                    const isHovered = hoveredEdge === e;
                    const isConnectedToHoveredTable = hoveredTable === e.fromTable || hoveredTable === e.toTable;
                    const isConnectedToFocusedTable = focusedTable === e.fromTable || focusedTable === e.toTable;
                    const isActive = isHovered || isConnectedToHoveredTable || isConnectedToFocusedTable;

                    const isDimmed = focusedTable && !isConnectedToFocusedTable;

                    const strokeColor = isActive 
                      ? '#fbbf24' 
                      : e.type === 'foreign_key' 
                        ? '#38bdf8' 
                        : '#c084fc';

                    const strokeDash = e.type === 'logical' && !isActive ? '6 4' : 'none';
                    const markerUrl = isActive 
                      ? 'url(#arrow-amber)' 
                      : e.type === 'foreign_key' 
                        ? 'url(#arrow-cyan)' 
                        : 'url(#arrow-purple)';

                    return (
                      <g key={idx} className="pointer-events-auto cursor-pointer">
                        {/* ZONA INVISIBLE AMPLIA PARA HOVER FÁCIL */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke="transparent"
                          strokeWidth="24"
                          onMouseEnter={() => setHoveredEdge(e)}
                          onMouseLeave={() => setHoveredEdge(null)}
                          onClick={() => {
                            setFocusedTable(focusedTable === e.fromTable ? null : e.fromTable);
                          }}
                        />

                        {/* LÍNEA DE CONEXIÓN VISIBLE */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth={isActive ? '3.5' : '2'}
                          strokeDasharray={strokeDash}
                          markerEnd={markerUrl}
                          style={{
                            opacity: isDimmed ? 0.15 : 1,
                            filter: isActive ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))' : 'none',
                            transition: 'stroke 0.2s, stroke-width 0.2s, opacity 0.2s'
                          }}
                          onMouseEnter={() => setHoveredEdge(e)}
                          onMouseLeave={() => setHoveredEdge(null)}
                          onClick={() => {
                            setFocusedTable(focusedTable === e.fromTable ? null : e.fromTable);
                          }}
                        />

                        {/* CHIP FLOTANTE CON NOMBRES DE COLUMNA */}
                        <foreignObject 
                          x={midX - 75} 
                          y={midY - 13} 
                          width="150" 
                          height="26" 
                          className="overflow-visible pointer-events-none"
                          style={{ opacity: isDimmed ? 0.2 : 1 }}
                        >
                          <div 
                            className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold shadow-md truncate border text-center transition-all ${
                              isActive
                                ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/50 scale-105'
                                : 'bg-slate-900/90 text-slate-300 border-slate-700'
                            }`}
                            title={`${e.fromTable}.${e.fromColumn} ➔ ${e.toTable}.${e.toColumn}`}
                          >
                            {e.fromColumn} ➔ {e.toColumn}
                          </div>
                        </foreignObject>
                      </g>
                    );
                  })}
                </svg>

                {/* CAPA DE NODOS (TARJETAS DE TABLAS) */}
                {erFilteredTables.map(table => {
                  const pos = tablePositions[table.name] || { x: 50, y: 50 };
                  const isMatchingSearch = searchErTable && table.name.toLowerCase().includes(searchErTable.toLowerCase());

                  // Comprobar relaciones conectadas a esta tabla
                  const connectedEdges = edges.filter(e => e.fromTable === table.name || e.toTable === table.name);
                  const isDirectlyConnectedToFocused = focusedTable 
                    ? (table.name === focusedTable || connectedEdges.some(e => e.fromTable === focusedTable || e.toTable === focusedTable))
                    : true;

                  const isDimmed = focusedTable && !isDirectlyConnectedToFocused;
                  const isFocusedCurrent = focusedTable === table.name;

                  return (
                    <div 
                      key={table.name}
                      onMouseEnter={() => setHoveredTable(table.name)}
                      onMouseLeave={() => setHoveredTable(null)}
                      className={`bg-slate-950/95 rounded-2xl border shadow-2xl transition-all duration-150 z-20 overflow-hidden ${
                        isFocusedCurrent
                          ? 'border-amber-400 ring-4 ring-amber-400/40 scale-[1.02] shadow-amber-500/20'
                          : isMatchingSearch
                            ? 'border-emerald-400 ring-4 ring-emerald-400/40 scale-[1.02]'
                            : isDirectlyConnectedToFocused && focusedTable
                              ? 'border-indigo-400 ring-2 ring-indigo-400/40'
                              : 'border-slate-800 hover:border-slate-600'
                      }`}
                      style={{
                        left: `${pos.x}px`, 
                        top: `${pos.y}px`, 
                        width: '330px',
                        position: 'absolute',
                        opacity: isDimmed ? 0.2 : 1,
                        filter: isDimmed ? 'grayscale(80%)' : 'none'
                      }}
                    >
                      {/* CABECERA DE TABLA (ARRASTRABLE) */}
                      <div 
                        onMouseDown={(e) => handleStartDrag(table.name, e)}
                        className={`px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between cursor-move select-none ${
                          isFocusedCurrent 
                            ? 'bg-gradient-to-r from-amber-950 to-indigo-950' 
                            : 'bg-gradient-to-r from-slate-900 to-indigo-950/80 hover:from-slate-850 hover:to-indigo-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Move className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <Table className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                          <span className="font-extrabold text-xs text-white font-mono truncate">{table.name}</span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                            {table.exactRows.toLocaleString()}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFocusedTable(focusedTable === table.name ? null : table.name);
                            }}
                            className={`p-1 rounded-lg transition-all ${
                              focusedTable === table.name 
                                ? 'bg-amber-400 text-slate-950' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                            title={focusedTable === table.name ? 'Desactivar modo enfoque' : 'Enfocar sólo esta tabla y sus relaciones'}
                          >
                            <Focus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* SUB-CABECERA CON DOMINIO Y CAMPOS */}
                      <div className="px-3.5 py-1 bg-slate-900/70 border-b border-slate-800/80 text-[10px] text-gray-400 font-sans flex items-center justify-between">
                        <span>{table.domain}</span>
                        <span>{table.columns.length} campos</span>
                      </div>

                      {/* LISTA DE CAMPOS Y TIPOS */}
                      <div className="p-2 space-y-1 max-h-64 overflow-y-auto font-mono text-[11px] scrollbar-thin">
                        {table.columns.map(col => {
                          const isPk = col.isPk;
                          const isFk = col.isFk || edges.some(e => (e.fromTable === table.name && e.fromColumn === col.name) || (e.toTable === table.name && e.toColumn === col.name));

                          return (
                            <div 
                              key={col.name} 
                              className={`px-2 py-1 rounded flex items-center justify-between gap-2 transition-colors ${
                                isPk 
                                  ? 'bg-amber-500/10 text-amber-200' 
                                  : isFk 
                                    ? 'bg-cyan-500/10 text-cyan-200' 
                                    : 'hover:bg-slate-900 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {isPk && <Key className="w-3 h-3 text-amber-400 flex-shrink-0" title="Llave Primaria (PK)" />}
                                {isFk && <Link2 className="w-3 h-3 text-cyan-400 flex-shrink-0" title="Llave Foránea / Relación (FK)" />}
                                <span className={`${isPk ? 'font-black text-amber-300' : isFk ? 'font-bold text-cyan-300' : ''} truncate`}>
                                  {col.name}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-sans flex-shrink-0">{col.dataType}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* PIE DE TARJETA CON CONEXIONES */}
                      <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                        <span className="truncate">
                          {connectedEdges.length} conexión(es)
                        </span>
                        <button
                          onClick={() => {
                            setSqlQuery(`SELECT * FROM \`${table.name}\` LIMIT 50;`);
                            setActiveTab('query');
                          }}
                          className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
                        >
                          Ver SQL ➔
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUB-VISTA 2: LISTA / MATRIZ ESTRUCTURADA DE RELACIONES */}
          {erSubTab === 'connections' && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-indigo-500" />
                    <span>Catálogo de Relaciones del Esquema ({edges.length})</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Mapeo detallado de llaves foráneas y vínculos de negocio entre tablas.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {edges.map((e, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-2xl border transition-all text-xs space-y-2 cursor-pointer ${
                      focusedTable === e.fromTable || focusedTable === e.toTable
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 ring-2 ring-indigo-400/30'
                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                    }`}
                    onClick={() => {
                      setFocusedTable(focusedTable === e.fromTable ? null : e.fromTable);
                      setErSubTab('canvas');
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">{e.fromTable}</span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">{e.toTable}</span>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between font-mono text-[11px]">
                      <span className="text-gray-700 dark:text-gray-300 font-bold">{e.fromColumn}</span>
                      <span className="text-gray-400">➔</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{e.toColumn}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                        e.type === 'foreign_key' 
                          ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300' 
                          : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                      }`}>
                        {e.type === 'foreign_key' ? '🔑 Foreign Key' : '🧠 Vínculo Lógico'}
                      </span>
                      <span className="text-indigo-500 font-bold hover:underline">Ver en Lienzo</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-VISTA 3: CÓDIGO MERMAID ERD */}
          {erSubTab === 'mermaid' && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-indigo-500" />
                    <span>Diagrama en Notación Mermaid ERD</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Puedes copiar este código para incrustarlo directamente en GitHub, Notion, Obsidian o visores Mermaid.
                  </p>
                </div>

                <button
                  onClick={() => {
                    let code = 'erDiagram\n';
                    edges.forEach(e => {
                      const rel = e.type === 'foreign_key' ? '||--o{' : '}o--o{';
                      code += `    ${e.fromTable.toUpperCase()} ${rel} ${e.toTable.toUpperCase()} : "${e.fromColumn}_to_${e.toColumn}"\n`;
                    });
                    code += '\n';
                    tables.forEach(t => {
                      code += `    ${t.name.toUpperCase()} {\n`;
                      t.columns.slice(0, 10).forEach(c => {
                        const pkFk = c.isPk ? 'PK' : c.isFk ? 'FK' : '';
                        const cleanType = (c.dataType || 'string').replace(/[^a-zA-Z0-9]/g, '');
                        code += `        ${cleanType} ${c.name} ${pkFk}\n`;
                      });
                      code += `    }\n`;
                    });

                    navigator.clipboard.writeText(code);
                    setMermaidCopied(true);
                    setTimeout(() => setMermaidCopied(false), 2500);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{mermaidCopied ? '¡Copiado al Portapapeles!' : 'Copiar Código Mermaid'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-emerald-300 font-mono text-xs overflow-x-auto max-h-[500px] scrollbar-thin">
                <pre>{(() => {
                  let code = 'erDiagram\n';
                  edges.forEach(e => {
                    const rel = e.type === 'foreign_key' ? '||--o{' : '}o--o{';
                    code += `    ${e.fromTable.toUpperCase()} ${rel} ${e.toTable.toUpperCase()} : "${e.fromColumn}_to_${e.toColumn}"\n`;
                  });
                  code += '\n';
                  tables.forEach(t => {
                    code += `    ${t.name.toUpperCase()} {\n`;
                    t.columns.slice(0, 10).forEach(c => {
                      const pkFk = c.isPk ? 'PK' : c.isFk ? 'FK' : '';
                      const cleanType = (c.dataType || 'string').replace(/[^a-zA-Z0-9]/g, '');
                      code += `        ${cleanType} ${c.name} ${pkFk}\n`;
                    });
                    code += `    }\n`;
                  });
                  return code;
                })()}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: IMPORTADOR Y MAPEADOR MULTI-TENANT */}
      {/* ========================================================================= */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* PASO 1: SUBIDA DEL ARCHIVO */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 font-extrabold flex items-center justify-center text-sm">
                1
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                  Carga de Archivo Excel (.xlsx) o CSV
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Selecciona el archivo de datos del vendedor o proveedor para transformarlo y cargarlo limpiamente a la base relacional.
                </p>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-indigo-500 rounded-3xl p-8 text-center transition-all cursor-pointer relative bg-gray-50/50 dark:bg-gray-900/50">
              <input 
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <FileSpreadsheet className="w-12 h-12 text-indigo-500 animate-bounce" />
                <span className="font-extrabold text-sm text-gray-800 dark:text-gray-200">
                  {importFile ? importFile.name : 'Haz clic o arrastra tu archivo Excel aquí'}
                </span>
                <span className="text-xs text-gray-400">
                  {importFile ? `${(importFile.size / 1024).toFixed(1)} KB | ${importRawRows.length} filas detectadas` : 'Soporta .xlsx, .xls, .csv de cualquier tamaño'}
                </span>
              </div>
            </div>
          </div>

          {/* PASO 2: CONFIGURACIÓN MULTI-TENANT Y ENTIDAD DESTINO */}
          {importRawRows.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 font-extrabold flex items-center justify-center text-sm">
                  2
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                    Definición de Entidad y Multi-Tenancy (Vendedor)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Especifica qué tipo de registros estás subiendo y a qué vendedor / inquilino pertenecen.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Vendedor / Tenant Propietario:
                  </label>
                  <input 
                    type="text"
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    placeholder="Ej: Sheerit Principal, Vendedor David, Distribuidor X"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Entidad Destino en Base de Datos:
                  </label>
                  <select
                    value={targetEntity}
                    onChange={(e) => setTargetEntity(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="subscriptions">Suscripciones Activas con Clientes (Ventas / Migración Excel)</option>
                    <option value="stream_accounts">Cuentas Maestras de Streaming (Inventario Proveedores)</option>
                    <option value="customers">Directorio Exclusivo de Clientes (Teléfono y Nombres)</option>
                  </select>
                </div>
              </div>

              {/* MAPEO VISUAL DE COLUMNAS */}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-5 space-y-4">
                <h4 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Mapeo Visual de Columnas (Excel ➔ MySQL)</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {targetEntity === 'subscriptions' && (
                    <>
                      <div>
                        <span className="text-[11px] font-bold text-gray-500 block mb-1">Teléfono / WhatsApp (* Obligatorio)</span>
                        <select 
                          value={columnMapping['phone'] || ''} 
                          onChange={(e) => setColumnMapping({ ...columnMapping, phone: e.target.value })}
                          className="w-full text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-3 py-2 font-mono"
                        >
                          <option value="">-- Ignorar / No mapear --</option>
                          {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-gray-500 block mb-1">Nombre del Cliente</span>
                        <select 
                          value={columnMapping['fullname'] || ''} 
                          onChange={(e) => setColumnMapping({ ...columnMapping, fullname: e.target.value })}
                          className="w-full text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-3 py-2 font-mono"
                        >
                          <option value="">-- Ignorar / No mapear --</option>
                          {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-gray-500 block mb-1">Plataforma (Netflix, Disney, etc.)</span>
                        <select 
                          value={columnMapping['streaming_platform'] || ''} 
                          onChange={(e) => setColumnMapping({ ...columnMapping, streaming_platform: e.target.value })}
                          className="w-full text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-3 py-2 font-mono"
                        >
                          <option value="">-- Ignorar / No mapear --</option>
                          {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-gray-500 block mb-1">Correo de la Cuenta (* Obligatorio)</span>
                        <select 
                          value={columnMapping['account_email'] || ''} 
                          onChange={(e) => setColumnMapping({ ...columnMapping, account_email: e.target.value })}
                          className="w-full text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-3 py-2 font-mono"
                        >
                          <option value="">-- Ignorar / No mapear --</option>
                          {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-gray-500 block mb-1">Contraseña de Cuenta</span>
                        <select 
                          value={columnMapping['account_password'] || ''} 
                          onChange={(e) => setColumnMapping({ ...columnMapping, account_password: e.target.value })}
                          className="w-full text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-3 py-2 font-mono"
                        >
                          <option value="">-- Ignorar / No mapear --</option>
                          {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-gray-500 block mb-1">Fecha de Vencimiento / Corte</span>
                        <select 
                          value={columnMapping['expiration_date'] || ''} 
                          onChange={(e) => setColumnMapping({ ...columnMapping, expiration_date: e.target.value })}
                          className="w-full text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-3 py-2 font-mono"
                        >
                          <option value="">-- Ignorar / No mapear --</option>
                          {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-gray-500 block mb-1">PIN / Perfil</span>
                        <select 
                          value={columnMapping['profile_pin'] || ''} 
                          onChange={(e) => setColumnMapping({ ...columnMapping, profile_pin: e.target.value })}
                          className="w-full text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-3 py-2 font-mono"
                        >
                          <option value="">-- Ignorar / No mapear --</option>
                          {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-gray-500 block mb-1">Método de Pago</span>
                        <select 
                          value={columnMapping['payment_method'] || ''} 
                          onChange={(e) => setColumnMapping({ ...columnMapping, payment_method: e.target.value })}
                          className="w-full text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-3 py-2 font-mono"
                        >
                          <option value="">-- Ignorar / No mapear --</option>
                          {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-gray-500 block mb-1">Notas / Observaciones</span>
                        <select 
                          value={columnMapping['notes'] || ''} 
                          onChange={(e) => setColumnMapping({ ...columnMapping, notes: e.target.value })}
                          className="w-full text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-3 py-2 font-mono"
                        >
                          <option value="">-- Ignorar / No mapear --</option>
                          {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </>
                  )}

                  {targetEntity === 'customers' && (
                    <>
                      <div>
                        <span className="text-[11px] font-bold text-gray-500 block mb-1">Teléfono / WhatsApp (* Obligatorio)</span>
                        <select 
                          value={columnMapping['phone'] || ''} 
                          onChange={(e) => setColumnMapping({ ...columnMapping, phone: e.target.value })}
                          className="w-full text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-3 py-2 font-mono"
                        >
                          <option value="">-- Ignorar / No mapear --</option>
                          {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-gray-500 block mb-1">Nombre Completo</span>
                        <select 
                          value={columnMapping['fullname'] || ''} 
                          onChange={(e) => setColumnMapping({ ...columnMapping, fullname: e.target.value })}
                          className="w-full text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-3 py-2 font-mono"
                        >
                          <option value="">-- Ignorar / No mapear --</option>
                          {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-gray-500 block mb-1">Correo Electrónico</span>
                        <select 
                          value={columnMapping['email'] || ''} 
                          onChange={(e) => setColumnMapping({ ...columnMapping, email: e.target.value })}
                          className="w-full text-xs rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-3 py-2 font-mono"
                        >
                          <option value="">-- Ignorar / No mapear --</option>
                          {importHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* BOTÓN DE EJECUCIÓN */}
              <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-5">
                <div className="text-xs text-gray-500">
                  <span className="font-bold">Total a procesar:</span> {importRawRows.length} filas listas para transformar e ingestar.
                </div>
                <button
                  onClick={handleExecuteImport}
                  disabled={importExecuting}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <UploadCloud className={`w-5 h-5 ${importExecuting ? 'animate-bounce' : ''}`} />
                  <span>{importExecuting ? 'Transformando e Ingestando...' : 'Confirmar e Ingestar a MySQL'}</span>
                </button>
              </div>

              {/* RESULTADO DE LA IMPORTACIÓN */}
              {importResult && (
                <div className={`p-5 rounded-2xl border text-xs space-y-2 ${
                  importResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200' : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-200'
                }`}>
                  <div className="flex items-center gap-2 font-black text-sm">
                    {importResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                    <span>{importResult.success ? '¡Importación y Transformación Completada con Éxito!' : 'Error durante la importación'}</span>
                  </div>
                  {importResult.success && (
                    <div className="grid grid-cols-3 gap-2 font-mono text-center pt-2">
                      <div className="bg-white/50 dark:bg-gray-800 p-2 rounded-xl">
                        <span className="text-[10px] text-gray-500 block">Nuevos Insertados</span>
                        <span className="text-base font-bold text-emerald-600">{importResult.insertedCount}</span>
                      </div>
                      <div className="bg-white/50 dark:bg-gray-800 p-2 rounded-xl">
                        <span className="text-[10px] text-gray-500 block">Actualizados</span>
                        <span className="text-base font-bold text-indigo-600">{importResult.updatedCount}</span>
                      </div>
                      <div className="bg-white/50 dark:bg-gray-800 p-2 rounded-xl">
                        <span className="text-[10px] text-gray-500 block">Omitidos / Errores</span>
                        <span className="text-base font-bold text-amber-600">{importResult.skippedCount}</span>
                      </div>
                    </div>
                  )}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-3 p-3 bg-white/70 dark:bg-gray-900 rounded-xl max-h-40 overflow-y-auto font-mono text-[10px] text-amber-700 dark:text-amber-300">
                      <span className="font-bold block mb-1">Advertencias detectadas:</span>
                      {importResult.errors.map((err: string, i: number) => (
                        <div key={i}>⚠️ {err}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default DataStudioView;
