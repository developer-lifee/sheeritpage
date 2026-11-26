import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Database,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  CreditCard,
  Copy,
  Check,
  Eye,
  EyeOff,
  SlidersHorizontal,
  X,
  FileText,
  Calendar,
  Save,
  Layers
} from 'lucide-react';

interface MasterAccount {
  key: string;
  dbId: number | null;
  platform: string;
  rawPlatform: string;
  email: string;
  password: string;
  totalSlots: number;
  occupiedSlots: number;
  freeSlots: number;
  maxProfiles: number;
  rowNumbers: number[];
  freeRowNumbers: number[];
  expirationDate: string;
  daysLeft: number | null;
  providerName: string;
  paymentMethod: string;
  costPrice: number | null;
  salePrice: number | null;
  guideNotes: string;
  status: 'active' | 'inactive';
}

interface PlatformAccountingConfig {
  profileSlots: number;
  defaultCost: number | null;
  defaultSalePrice: number | null;
  durationDays: number;
  isVariableShared: boolean;
  source: 'contabilidad' | 'fallback';
  extraPlatform?: string;
  defaultExtraSlots?: number;
  extraSlotCost?: number;
  extraSlotSalePrice?: number;
}

interface SummaryStats {
  totalAccounts: number;
  totalSlots: number;
  occupiedSlots: number;
  freeSlots: number;
  expiringSoon: number;
}

const KNOWN_PLATFORMS = [
  'Netflix',
  'Netflix Extra',
  'Disney',
  'Max (HBO)',
  'HBO',
  'Prime Video',
  'Amazon',
  'Spotify',
  'YouTube',
  'Apple One',
  'Apple TV',
  'Paramount+',
  'Crunchyroll',
  'ViX',
  'ChatGPT (GPT)',
  'Claude',
  'Canva',
  'Microsoft'
];

const FALLBACK_DEFAULT_SLOTS: Record<string, number> = {
  NETFLIX: 5,
  'NETFLIX EXTRA': 1,
  DISNEY: 7,
  'DISNEY+': 7,
  HBO: 5,
  'HBO PLATINO': 5,
  MAX: 5,
  'MAX (HBO)': 5,
  AMAZON: 6,
  'PRIME VIDEO': 6,
  SPOTIFY: 6,
  YOUTUBE: 5,
  'APPLE ONE': 6,
  'APPLE TV': 5,
  'CRUNCHY ROLL': 5,
  CRUNCHYROLL: 5,
  PARAMOUNT: 6,
  'PARAMOUNT+': 6,
  VIX: 4,
  GPT: 5,
  CHATGPT: 5,
  'CHATGPT (GPT)': 5,
  CLAUDE: 5,
  CANVA: 5,
  MICROSOFT: 6,
  OFFICE: 6
};

export const InventoryAccountsView: React.FC = () => {
  const [accounts, setAccounts] = useState<MasterAccount[]>([]);
  const [platformDefaults, setPlatformDefaults] = useState<Record<string, number>>(FALLBACK_DEFAULT_SLOTS);
  const [platformConfigs, setPlatformConfigs] = useState<Record<string, PlatformAccountingConfig>>({});
  const [summary, setSummary] = useState<SummaryStats>({
    totalAccounts: 0,
    totalSlots: 0,
    occupiedSlots: 0,
    freeSlots: 0,
    expiringSoon: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WITH_FREE' | 'FULL' | 'EXPIRING' | 'INACTIVE'>('ALL');
  const [showPassMap, setShowPassMap] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createCustomPlatform, setCreateCustomPlatform] = useState(false);
  const [createForm, setCreateForm] = useState({
    streaming: 'Netflix',
    correo: '',
    contraseña: '',
    perfiles: 5,
    extraPerfiles: 2,
    isAutoSlots: true,
    vencimiento: '',
    proveedor: '',
    paymentMethod: '',
    costPrice: '',
    salePrice: '',
    guideNotes: '',
    recordExpense: false
  });
  const [savingCreate, setSavingCreate] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<MasterAccount | null>(null);
  const [editForm, setEditForm] = useState({
    account_password: '',
    expiration_date: '',
    provider_name: '',
    payment_method: '',
    cost_price: '',
    sale_price: '',
    guide_notes: '',
    status: 'active' as 'active' | 'inactive',
    syncToExcel: true
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Adjust slots modal
  const [slotsTarget, setSlotsTarget] = useState<MasterAccount | null>(null);
  const [slotsDelta, setSlotsDelta] = useState<number>(1);
  const [savingSlots, setSavingSlots] = useState(false);

  // Renew modal
  const [renewTarget, setRenewTarget] = useState<MasterAccount | null>(null);
  const [renewForm, setRenewForm] = useState({
    provider: '',
    payment_method: '',
    amount_paid: '',
    renewal_date: new Date().toISOString().split('T')[0],
    expiration_date: '',
    notes: '',
    sync_to_excel: true
  });
  const [savingRenew, setSavingRenew] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<MasterAccount | null>(null);
  const [clearFreeRows, setClearFreeRows] = useState(true);
  const [savingDelete, setSavingDelete] = useState(false);

  const apiUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : (typeof window !== 'undefined' ? window.location.origin : '');

  const showToastMsg = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const loadMasterAccounts = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/master-accounts${force ? '?force=1' : ''}`);
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts || []);
        setPlatformDefaults({ ...FALLBACK_DEFAULT_SLOTS, ...(data.platformDefaultSlots || {}) });
        if (data.platformConfigs) setPlatformConfigs(data.platformConfigs);
        if (data.summary) setSummary(data.summary);
      } else {
        showToastMsg('error', data.error || 'Error cargando cuentas matrices');
      }
    } catch (e: any) {
      showToastMsg('error', `Error de conexión: ${e.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    loadMasterAccounts(false);
  }, [loadMasterAccounts]);

  const getAccountingConfig = (platName: string): PlatformAccountingConfig => {
    const upper = String(platName || '').trim().toUpperCase();
    if (platformConfigs[upper]) return platformConfigs[upper];
    const matchedCfg = Object.keys(platformConfigs).find(k => upper.includes(k) || k.includes(upper));
    if (matchedCfg) return platformConfigs[matchedCfg];
    const slots = platformDefaults[upper] || 5;
    return {
      profileSlots: slots,
      defaultCost: upper === 'NETFLIX' ? 50900 : null,
      defaultSalePrice: null,
      durationDays: 30,
      isVariableShared: /gpt|chatgpt|claude|compartid|canva|platzi/i.test(upper),
      source: 'fallback',
      ...(upper === 'NETFLIX' ? {
        extraPlatform: 'NETFLIX EXTRA',
        defaultExtraSlots: 2,
        extraSlotCost: 11900,
        extraSlotSalePrice: 17000
      } : {})
    };
  };

  const getSuggestedSlots = (platName: string) => getAccountingConfig(platName).profileSlots;

  const availablePlatforms = useMemo(() => {
    const set = new Set<string>(KNOWN_PLATFORMS.map(p => p.toUpperCase()));
    Object.keys(platformConfigs).forEach(k => set.add(k.toUpperCase()));
    accounts.forEach(a => {
      if (a.platform) set.add(a.platform.toUpperCase());
    });
    return Array.from(set).sort();
  }, [accounts, platformConfigs]);

  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter(acc => {
      if (platformFilter !== 'ALL' && acc.platform !== platformFilter) return false;
      if (statusFilter === 'INACTIVE') {
        if (acc.status !== 'inactive') return false;
      } else {
        if (acc.status === 'inactive') return false;
        if (statusFilter === 'WITH_FREE' && acc.freeSlots <= 0) return false;
        if (statusFilter === 'FULL' && (acc.freeSlots > 0 || acc.totalSlots === 0)) return false;
        if (statusFilter === 'EXPIRING' && (acc.daysLeft === null || acc.daysLeft > 5)) return false;
      }
      if (!q) return true;
      return (
        acc.email.toLowerCase().includes(q) ||
        acc.platform.toLowerCase().includes(q) ||
        (acc.providerName || '').toLowerCase().includes(q) ||
        (acc.paymentMethod || '').toLowerCase().includes(q) ||
        (acc.guideNotes || '').toLowerCase().includes(q)
      );
    });
  }, [accounts, search, platformFilter, statusFilter]);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openCreateModal = () => {
    const initialPlat = 'NETFLIX';
    const cfg = getAccountingConfig(initialPlat);
    const defaultExp = new Date(Date.now() + (cfg.durationDays || 30) * 86400000).toISOString().split('T')[0];
    setCreateCustomPlatform(false);
    setCreateForm({
      streaming: initialPlat,
      correo: '',
      contraseña: '',
      perfiles: cfg.profileSlots,
      extraPerfiles: cfg.defaultExtraSlots || 0,
      isAutoSlots: true,
      vencimiento: defaultExp,
      proveedor: '',
      paymentMethod: '',
      costPrice: cfg.defaultCost != null ? String(cfg.defaultCost) : '',
      salePrice: cfg.defaultSalePrice != null ? String(cfg.defaultSalePrice) : '',
      guideNotes: '',
      recordExpense: false
    });
    setCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.streaming.trim() || !createForm.correo.trim() || !createForm.contraseña.trim()) {
      showToastMsg('error', 'Plataforma, correo y contraseña son obligatorios.');
      return;
    }
    setSavingCreate(true);
    try {
      const cfg = getAccountingConfig(createForm.streaming);
      const res = await fetch(`${apiUrl}/api/admin/accounts/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streaming: createForm.streaming.trim(),
          correo: createForm.correo.trim(),
          contraseña: createForm.contraseña.trim(),
          perfiles: createForm.perfiles,
          extraPerfiles: cfg.extraPlatform ? (createForm.extraPerfiles || 0) : 0,
          extraStreaming: cfg.extraPlatform || '',
          extraUnitCost: cfg.extraSlotCost ?? null,
          vencimiento: createForm.vencimiento || null,
          proveedor: createForm.proveedor.trim() || null,
          paymentMethod: createForm.paymentMethod.trim() || null,
          costPrice: createForm.costPrice !== '' ? Number(createForm.costPrice) : null,
          salePrice: createForm.salePrice !== '' ? Number(createForm.salePrice) : null,
          guideNotes: createForm.guideNotes.trim() || null,
          recordExpense: createForm.recordExpense,
          password: 'admin123'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'No se pudo crear la cuenta matriz');
      }
      setCreateOpen(false);
      showToastMsg('success', data.message || 'Cuenta matriz creada exitosamente.');
      loadMasterAccounts(true);
    } catch (err: any) {
      showToastMsg('error', err.message);
    } finally {
      setSavingCreate(false);
    }
  };

  const openEditModal = (acc: MasterAccount) => {
    setEditTarget(acc);
    setEditForm({
      account_password: acc.password || '',
      expiration_date: acc.expirationDate || '',
      provider_name: acc.providerName || '',
      payment_method: acc.paymentMethod || '',
      cost_price: acc.costPrice != null ? String(acc.costPrice) : '',
      sale_price: acc.salePrice != null ? String(acc.salePrice) : '',
      guide_notes: acc.guideNotes || '',
      status: acc.status || 'active',
      syncToExcel: true
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/master-accounts/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: editTarget.rawPlatform || editTarget.platform,
          email: editTarget.email,
          ...editForm,
          password: 'admin123'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || data.error || 'Error actualizando');
      setEditTarget(null);
      showToastMsg('success', data.message || 'Cuenta matriz actualizada.');
      loadMasterAccounts(true);
    } catch (err: any) {
      showToastMsg('error', err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAdjustSlotsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotsTarget || !slotsDelta) return;
    setSavingSlots(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/master-accounts/adjust-slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: slotsTarget.rawPlatform || slotsTarget.platform,
          email: slotsTarget.email,
          delta: slotsDelta,
          password: 'admin123'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || data.error || 'Error ajustando cupos');
      setSlotsTarget(null);
      showToastMsg('success', data.message || 'Cupos actualizados.');
      loadMasterAccounts(true);
    } catch (err: any) {
      showToastMsg('error', err.message);
    } finally {
      setSavingSlots(false);
    }
  };

  const openRenewModal = (acc: MasterAccount) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const baseExp = acc.expirationDate ? new Date(`${acc.expirationDate}T00:00:00`) : today;
    const nextBase = (!isNaN(baseExp.getTime()) && baseExp > today) ? baseExp : today;
    const nextExp = new Date(nextBase.getTime() + 30 * 86400000).toISOString().split('T')[0];
    setRenewTarget(acc);
    setRenewForm({
      provider: acc.providerName || '',
      payment_method: acc.paymentMethod || '',
      amount_paid: acc.costPrice != null ? String(acc.costPrice) : '',
      renewal_date: todayStr,
      expiration_date: nextExp,
      notes: '',
      sync_to_excel: true
    });
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewTarget) return;
    setSavingRenew(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/accounting/renewals/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'admin123',
          renewalData: {
            platform: renewTarget.platform,
            account_email: renewTarget.email,
            provider: renewForm.provider,
            payment_method: renewForm.payment_method,
            amount_paid: Number(renewForm.amount_paid) || 0,
            renewal_date: renewForm.renewal_date,
            expiration_date: renewForm.expiration_date,
            duration_days: 30,
            profile_slots: renewTarget.totalSlots || 5,
            notes: renewForm.notes,
            registered_by: 'Admin (Cuentas Matrices)',
            sync_to_cash_flow: true,
            sync_to_excel: renewForm.sync_to_excel
          }
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.message || data.error || 'Error renovando cuenta');
      setRenewTarget(null);
      showToastMsg('success', `Renovación de ${renewTarget.email} registrada y sincronizada.`);
      loadMasterAccounts(true);
    } catch (err: any) {
      showToastMsg('error', err.message);
    } finally {
      setSavingRenew(false);
    }
  };

  const handleDeleteSubmit = async (forceDeactivate = false) => {
    if (!deleteTarget) return;
    setSavingDelete(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/master-accounts`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: deleteTarget.rawPlatform || deleteTarget.platform,
          email: deleteTarget.email,
          clearFreeRows,
          forceDeactivate,
          password: 'admin123'
        })
      });
      const data = await res.json();
      if (res.status === 409 && data.hasOccupied && !forceDeactivate) {
        if (window.confirm(`${data.message}\n\n¿Deseas marcarla como inactiva de todas formas?`)) {
          setSavingDelete(false);
          return handleDeleteSubmit(true);
        }
        return;
      }
      if (!res.ok || !data.success) throw new Error(data.message || data.error || 'Error eliminando cuenta');
      setDeleteTarget(null);
      showToastMsg('success', data.message || 'Cuenta matriz actualizada.');
      loadMasterAccounts(true);
    } catch (err: any) {
      showToastMsg('error', err.message);
    } finally {
      setSavingDelete(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast */}
      {toast && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header & KPIs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-extrabold flex items-center gap-2 dark:text-white">
              <Database className="w-5 h-5 text-brand-primary" />
              Panel de Administración de Cuentas Matrices
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Gestiona inventario, vencimientos, renovaciones, precios, cupos, guías y sincronización simultánea con Excel Online y MariaDB.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => loadMasterAccounts(true)}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-dark text-white text-xs font-extrabold shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Nueva Cuenta Matriz
            </button>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40">
            <span className="text-[11px] font-bold uppercase text-indigo-600 dark:text-indigo-400">Cuentas Activas</span>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{summary.totalAccounts}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
            <span className="text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400">Cupos Totales</span>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              {summary.occupiedSlots} <span className="text-sm font-semibold text-gray-400">/ {summary.totalSlots} ocup.</span>
            </p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
            <span className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Cupos Libres</span>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{summary.freeSlots}</p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
            <span className="text-[11px] font-bold uppercase text-amber-600 dark:text-amber-400">Por Vencer (≤5d)</span>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{summary.expiringSoon}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por correo, plataforma, proveedor, tarjeta o guía..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-800 dark:text-white focus:outline-none focus:border-brand-primary"
            />
          </div>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs font-semibold text-gray-700 dark:text-gray-200"
          >
            <option value="ALL">Todas las plataformas</option>
            {availablePlatforms.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <div className="flex flex-wrap gap-1.5">
            {([
              ['ALL', 'Activas'],
              ['WITH_FREE', 'Con Libres'],
              ['FULL', 'Llenas'],
              ['EXPIRING', 'Por Vencer'],
              ['INACTIVE', 'Inactivas']
            ] as const).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setStatusFilter(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === val
                    ? 'bg-brand-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Cargando inventario de cuentas matrices...
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            No se encontraron cuentas matrices con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/70 text-gray-500 dark:text-gray-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-3">Plataforma / Correo</th>
                  <th className="px-4 py-3">Clave</th>
                  <th className="px-4 py-3">Cupos</th>
                  <th className="px-4 py-3">Vencimiento</th>
                  <th className="px-4 py-3">Proveedor / Pago</th>
                  <th className="px-4 py-3">Costo / Precio</th>
                  <th className="px-4 py-3">Guías</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/70">
                {filteredAccounts.map((acc) => {
                  const pct = acc.totalSlots > 0 ? Math.round((acc.occupiedSlots / acc.totalSlots) * 100) : 0;
                  const expBadge = acc.daysLeft === null
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300'
                    : acc.daysLeft < 0
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                    : acc.daysLeft <= 5
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300';

                  return (
                    <tr key={acc.key} className="hover:bg-gray-50/70 dark:hover:bg-gray-750/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-extrabold text-[10px]">
                            {acc.platform}
                          </span>
                          {acc.status === 'inactive' && (
                            <span className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold">
                              INACTIVA
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 font-mono font-semibold text-gray-800 dark:text-gray-200">
                          <span className="truncate max-w-[200px]" title={acc.email}>{acc.email}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(acc.email, `email_${acc.key}`)}
                            className="text-gray-400 hover:text-indigo-500"
                            title="Copiar correo"
                          >
                            {copiedKey === `email_${acc.key}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-700 dark:text-gray-300">
                            {acc.password ? (showPassMap[acc.key] ? acc.password : '••••••••') : '—'}
                          </span>
                          {acc.password && (
                            <>
                              <button
                                type="button"
                                onClick={() => setShowPassMap(p => ({ ...p, [acc.key]: !p[acc.key] }))}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {showPassMap[acc.key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopy(acc.password, `pass_${acc.key}`)}
                                className="text-gray-400 hover:text-indigo-500"
                              >
                                {copiedKey === `pass_${acc.key}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 min-w-[130px]">
                        <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                          <span className="text-gray-700 dark:text-gray-200">{acc.occupiedSlots}/{acc.totalSlots}</span>
                          <span className={acc.freeSlots > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}>
                            {acc.freeSlots} libres
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div
                            className={`h-full ${acc.freeSlots === 0 ? 'bg-indigo-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-mono font-bold text-[11px] ${expBadge}`}>
                          <Calendar className="w-3 h-3" />
                          {acc.expirationDate || 'Sin fecha'}
                        </span>
                        {acc.daysLeft !== null && (
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {acc.daysLeft < 0 ? `Vencida hace ${Math.abs(acc.daysLeft)}d` : acc.daysLeft === 0 ? 'Vence hoy' : `En ${acc.daysLeft}d`}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800 dark:text-gray-200">{acc.providerName || '—'}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[150px]" title={acc.paymentMethod}>
                          {acc.paymentMethod || 'Sin método'}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <div className="text-gray-700 dark:text-gray-200">
                          Costo: {acc.costPrice != null ? `$${acc.costPrice.toLocaleString('es-CO')}` : '—'}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                          Cupo: {acc.salePrice != null ? `$${acc.salePrice.toLocaleString('es-CO')}` : '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        {acc.guideNotes ? (
                          <span className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2" title={acc.guideNotes}>
                            {acc.guideNotes}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(acc)}
                            className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100"
                            title="Editar cuenta, fechas, precios y guías"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSlotsTarget(acc); setSlotsDelta(1); }}
                            className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 hover:bg-purple-100"
                            title="Agregar o quitar cupos libres"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openRenewModal(acc)}
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100"
                            title="Renovar cuenta matriz"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDeleteTarget(acc); setClearFreeRows(true); }}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 hover:bg-rose-100"
                            title="Eliminar o desactivar cuenta matriz"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: NUEVA CUENTA MATRIZ */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-850">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-primary/15 text-brand-primary">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Nueva Cuenta Matriz (Excel + MariaDB)</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Toma los perfiles base, costo, precio y duración desde Contabilidad (ajustables si es cupo compartido).
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setCreateOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Plataforma</label>
                    <button
                      type="button"
                      onClick={() => setCreateCustomPlatform(p => !p)}
                      className="text-[10px] font-bold text-indigo-500 hover:underline"
                    >
                      {createCustomPlatform ? 'Usar lista' : 'Otra plataforma'}
                    </button>
                  </div>
                  {createCustomPlatform ? (
                    <input
                      type="text"
                      value={createForm.streaming}
                      onChange={(e) => {
                        const val = e.target.value;
                        const cfg = getAccountingConfig(val);
                        setCreateForm(f => ({
                          ...f,
                          streaming: val,
                          ...(f.isAutoSlots ? { perfiles: cfg.profileSlots, extraPerfiles: cfg.defaultExtraSlots || 0 } : {})
                        }));
                      }}
                      placeholder="Nombre de la plataforma"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      required
                    />
                  ) : (
                    <select
                      value={createForm.streaming}
                      onChange={(e) => {
                        const val = e.target.value;
                        const cfg = getAccountingConfig(val);
                        const nextExp = new Date(Date.now() + (cfg.durationDays || 30) * 86400000).toISOString().split('T')[0];
                        setCreateForm(f => ({
                          ...f,
                          streaming: val,
                          perfiles: cfg.profileSlots,
                          extraPerfiles: cfg.defaultExtraSlots || 0,
                          isAutoSlots: true,
                          vencimiento: nextExp,
                          costPrice: cfg.defaultCost != null ? String(cfg.defaultCost) : '',
                          salePrice: cfg.defaultSalePrice != null ? String(cfg.defaultSalePrice) : ''
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {availablePlatforms.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Cantidad de Cupos (Filas)</label>
                    {(() => {
                      const cfg = getAccountingConfig(createForm.streaming);
                      if (!createForm.isAutoSlots) {
                        return <span className="text-[10px] font-bold text-indigo-500">Editado manual</span>;
                      }
                      if (cfg.isVariableShared) {
                        return <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Compartida / variable (Contab: {cfg.profileSlots} — ajustable)</span>;
                      }
                      return <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Contabilidad: {cfg.profileSlots} perfiles</span>;
                    })()}
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={createForm.perfiles}
                    onChange={(e) => setCreateForm({ ...createForm, perfiles: parseInt(e.target.value, 10) || 1, isAutoSlots: false })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                    required
                  />
                </div>

                {(() => {
                  const cfg = getAccountingConfig(createForm.streaming);
                  if (!cfg.extraPlatform) return null;
                  const extraCount = Math.max(0, Number(createForm.extraPerfiles) || 0);
                  const baseCostNum = Number(createForm.costPrice) || 0;
                  const extraUnitCost = cfg.extraSlotCost || 11900;
                  const totalCombinedCost = baseCostNum + (extraCount * extraUnitCost);
                  return (
                    <div className="sm:col-span-2 p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-900/50 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase text-rose-700 dark:text-rose-300">
                            Cupos Extra ({cfg.extraPlatform})
                          </label>
                          <p className="text-[11px] text-rose-800/80 dark:text-rose-200/80">
                            Se crean como filas aparte de {cfg.extraPlatform} (costo ${extraUnitCost.toLocaleString('es-CO')} c/u, venta ${(cfg.extraSlotSalePrice || 17000).toLocaleString('es-CO')}).
                          </p>
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={5}
                          value={createForm.extraPerfiles}
                          onChange={(e) => setCreateForm({
                            ...createForm,
                            extraPerfiles: Math.max(0, Math.min(5, parseInt(e.target.value, 10) || 0))
                          })}
                          className="w-24 px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono font-bold text-center"
                        />
                      </div>
                      <div className="text-[11px] font-mono font-semibold text-rose-900 dark:text-rose-200 bg-white/70 dark:bg-gray-900/60 px-2.5 py-1.5 rounded-lg border border-rose-200/70 dark:border-rose-900/40">
                        Base: ${baseCostNum.toLocaleString('es-CO')} ({createForm.perfiles} perfiles) + {extraCount} extras × ${extraUnitCost.toLocaleString('es-CO')} = <span className="font-black">${totalCombinedCost.toLocaleString('es-CO')} total</span>
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Correo de la Cuenta</label>
                  <input
                    type="email"
                    value={createForm.correo}
                    onChange={(e) => setCreateForm({ ...createForm, correo: e.target.value })}
                    placeholder="correo@cuenta.com"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Contraseña</label>
                  <input
                    type="text"
                    value={createForm.contraseña}
                    onChange={(e) => setCreateForm({ ...createForm, contraseña: e.target.value })}
                    placeholder="Clave de acceso"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={createForm.vencimiento}
                    onChange={(e) => setCreateForm({ ...createForm, vencimiento: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Proveedor</label>
                  <input
                    type="text"
                    value={createForm.proveedor}
                    onChange={(e) => setCreateForm({ ...createForm, proveedor: e.target.value })}
                    placeholder="Ej: Directo / Spotinet / Net"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Método de Pago / Tarjeta</label>
                  <input
                    type="text"
                    value={createForm.paymentMethod}
                    onChange={(e) => setCreateForm({ ...createForm, paymentMethod: e.target.value })}
                    placeholder="Ej: Tarjeta ****1234 / Nequi"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Costo Compra (COP)</label>
                    <input
                      type="number"
                      value={createForm.costPrice}
                      onChange={(e) => setCreateForm({ ...createForm, costPrice: e.target.value })}
                      placeholder="Ej: 45000"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Precio Venta/Cupo</label>
                    <input
                      type="number"
                      value={createForm.salePrice}
                      onChange={(e) => setCreateForm({ ...createForm, salePrice: e.target.value })}
                      placeholder="Ej: 13000"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Guías / Instrucciones de Uso</label>
                  <textarea
                    rows={2}
                    value={createForm.guideNotes}
                    onChange={(e) => setCreateForm({ ...createForm, guideNotes: e.target.value })}
                    placeholder="Ej: Pin de perfil por defecto, país de la cuenta, notas para asesores..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForm.recordExpense}
                  onChange={(e) => setCreateForm({ ...createForm, recordExpense: e.target.checked })}
                  className="rounded text-emerald-600"
                />
                <span className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-200">
                  Registrar esta compra como egreso en Contabilidad (account_renewals + flujo de caja)
                </span>
              </label>

              <div className="flex justify-end gap-2.5 pt-2">
                <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCreate}
                  className="px-5 py-2 rounded-xl bg-brand-primary hover:bg-brand-dark disabled:opacity-50 text-white font-extrabold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingCreate ? 'Creando cupos...' : 'Crear Cuenta Matriz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR CUENTA MATRIZ */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-xl w-full border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-850">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" /> Editar Cuenta Matriz
                </h3>
                <p className="text-[11px] text-gray-500 font-mono">{editTarget.platform} · {editTarget.email}</p>
              </div>
              <button type="button" onClick={() => setEditTarget(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-3 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Contraseña</label>
                  <input
                    type="text"
                    value={editForm.account_password}
                    onChange={(e) => setEditForm({ ...editForm, account_password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Fecha Vencimiento</label>
                  <input
                    type="date"
                    value={editForm.expiration_date}
                    onChange={(e) => setEditForm({ ...editForm, expiration_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Proveedor</label>
                  <input
                    type="text"
                    value={editForm.provider_name}
                    onChange={(e) => setEditForm({ ...editForm, provider_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Método de Pago</label>
                  <input
                    type="text"
                    value={editForm.payment_method}
                    onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Costo Compra (COP)</label>
                  <input
                    type="number"
                    value={editForm.cost_price}
                    onChange={(e) => setEditForm({ ...editForm, cost_price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Precio Venta/Cupo (COP)</label>
                  <input
                    type="number"
                    value={editForm.sale_price}
                    onChange={(e) => setEditForm({ ...editForm, sale_price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Estado</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="active">Activa</option>
                    <option value="inactive">Inactiva</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Guías / Notas de Cuenta</label>
                  <textarea
                    rows={3}
                    value={editForm.guide_notes}
                    onChange={(e) => setEditForm({ ...editForm, guide_notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.syncToExcel}
                  onChange={(e) => setEditForm({ ...editForm, syncToExcel: e.target.checked })}
                  className="rounded text-amber-600"
                />
                <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                  Sincronizar contraseña, vencimiento y método de pago en todas las filas de esta cuenta en Excel
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditTarget(null)} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300">
                  Cancelar
                </button>
                <button type="submit" disabled={savingEdit} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold">
                  {savingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MODIFICAR CUPOS */}
      {slotsTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-500" /> Modificar Cupos
                </h3>
                <p className="text-[11px] text-gray-500 font-mono">{slotsTarget.platform} · {slotsTarget.email}</p>
              </div>
              <button type="button" onClick={() => setSlotsTarget(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdjustSlotsSubmit} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex justify-between font-bold">
                <span>Actuales: {slotsTarget.totalSlots}</span>
                <span>Ocupados: {slotsTarget.occupiedSlots}</span>
                <span className="text-emerald-600 dark:text-emerald-400">Libres: {slotsTarget.freeSlots}</span>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                  Ajuste de cupos (positivo para agregar libres, negativo para quitar vacíos)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSlotsDelta(d => Math.max(-slotsTarget.freeSlots || -1, d - 1 || -1))}
                    className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 font-black"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={slotsDelta}
                    onChange={(e) => setSlotsDelta(parseInt(e.target.value, 10) || 0)}
                    className="flex-1 text-center px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setSlotsDelta(d => (d + 1 === 0 ? 1 : d + 1))}
                    className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 font-black"
                  >
                    +
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Nunca se eliminan filas con clientes activos; solo se limpian cupos libres.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setSlotsTarget(null)} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 font-bold">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingSlots || slotsDelta === 0}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-extrabold"
                >
                  {savingSlots ? 'Aplicando...' : 'Aplicar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RENOVAR CUENTA MATRIZ */}
      {renewTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-500" /> Renovar Cuenta Matriz
                </h3>
                <p className="text-[11px] text-gray-500 font-mono">{renewTarget.platform} · {renewTarget.email}</p>
              </div>
              <button type="button" onClick={() => setRenewTarget(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRenewSubmit} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Proveedor</label>
                  <input
                    type="text"
                    value={renewForm.provider}
                    onChange={(e) => setRenewForm({ ...renewForm, provider: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Método de Pago / Tarjeta</label>
                  <input
                    type="text"
                    value={renewForm.payment_method}
                    onChange={(e) => setRenewForm({ ...renewForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Valor Pagado (COP)</label>
                  <input
                    type="number"
                    value={renewForm.amount_paid}
                    onChange={(e) => setRenewForm({ ...renewForm, amount_paid: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Fecha Pago</label>
                  <input
                    type="date"
                    value={renewForm.renewal_date}
                    onChange={(e) => setRenewForm({ ...renewForm, renewal_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Nueva Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={renewForm.expiration_date}
                    onChange={(e) => setRenewForm({ ...renewForm, expiration_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Notas</label>
                  <input
                    type="text"
                    value={renewForm.notes}
                    onChange={(e) => setRenewForm({ ...renewForm, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setRenewTarget(null)} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 font-bold">
                  Cancelar
                </button>
                <button type="submit" disabled={savingRenew} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold">
                  {savingRenew ? 'Registrando...' : 'Registrar Renovación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ELIMINAR / DESACTIVAR */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Eliminar / Desactivar Cuenta Matriz</h3>
                <p className="text-[11px] text-gray-500 font-mono">{deleteTarget.platform} · {deleteTarget.email}</p>
              </div>
            </div>
            {deleteTarget.occupiedSlots > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200">
                ⚠️ Esta cuenta tiene <strong>{deleteTarget.occupiedSlots} cliente(s) activo(s)</strong>. Sus filas nunca se borrarán; solo se marcará como inactiva.
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={clearFreeRows}
                onChange={(e) => setClearFreeRows(e.target.checked)}
                className="rounded text-rose-600"
              />
              <span className="text-gray-700 dark:text-gray-300 font-semibold">
                Limpiar también los {deleteTarget.freeSlots} cupo(s) libres en Excel Online
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 font-bold">
                Cancelar
              </button>
              <button
                type="button"
                disabled={savingDelete}
                onClick={() => handleDeleteSubmit(false)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-extrabold"
              >
                {savingDelete ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
