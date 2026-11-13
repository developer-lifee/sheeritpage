import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Printer, Award, Copy, Check, UserCheck, Calendar, DollarSign, FileText, Upload, RotateCcw } from 'lucide-react';

export interface CertificateEmployeeOption {
  id: number;
  fullname: string;
  email: string;
  role: string;
  status?: string;
  hourly_rate?: number;
}

interface EmploymentCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: CertificateEmployeeOption[];
  initialEmployee?: CertificateEmployeeOption | null;
  tenantKey?: string;
  defaultCompanyName?: string;
  defaultLogoUrl?: string;
}

const ROLE_LABELS: Record<string, string> = {
  agent: 'Asesor de Soporte al Cliente',
  trial: 'Asesor de Soporte en Formación',
  supervisor: 'Supervisor de Operaciones',
  admin: 'Administrador de Plataforma',
};

function formatLongDateEs(dateStr: string): string {
  if (!dateStr) return '___ de _________ de ____';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const EmploymentCertificateModal: React.FC<EmploymentCertificateModalProps> = ({
  isOpen,
  onClose,
  employees,
  initialEmployee,
  tenantKey = 'default',
  defaultCompanyName = 'SHEERIT',
  defaultLogoUrl = '/faviconsheerit.png',
}) => {
  const storageKey = `cert_brand_config_${tenantKey}`;
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const todayIso = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const loadSavedBrand = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const savedBrand = useMemo(loadSavedBrand, [storageKey]);

  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [fullname, setFullname] = useState('');
  const [docType, setDocType] = useState('C.C.');
  const [docNumber, setDocNumber] = useState('');
  const [position, setPosition] = useState('Asesor de Soporte al Cliente');
  const [contractType, setContractType] = useState('Prestación de Servicios');
  const [startDate, setStartDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [endDate, setEndDate] = useState(todayIso);
  const [includeSalary, setIncludeSalary] = useState(false);
  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryPeriod, setSalaryPeriod] = useState('mensuales');
  const [addressedTo, setAddressedTo] = useState('A QUIEN INTERESE');
  const [city, setCity] = useState<string>(savedBrand.city ?? 'Bogotá D.C.');
  const [issueDate, setIssueDate] = useState(todayIso);
  const [signerName, setSignerName] = useState<string>(savedBrand.signerName ?? 'Esteban Ávila');
  const [signerRole, setSignerRole] = useState<string>(savedBrand.signerRole ?? 'Director General');
  const [companyName, setCompanyName] = useState<string>(savedBrand.companyName ?? defaultCompanyName);
  const [companyNit, setCompanyNit] = useState<string>(savedBrand.companyNit ?? '');
  const [companyContact, setCompanyContact] = useState<string>(
    savedBrand.companyContact ?? 'sheerit.co · WhatsApp +57 311 858 7974'
  );
  const [logoUrl, setLogoUrl] = useState<string>(savedBrand.logoUrl ?? defaultLogoUrl);
  const [showLogo, setShowLogo] = useState<boolean>(savedBrand.showLogo ?? true);
  const [accentColor, setAccentColor] = useState<string>(savedBrand.accentColor ?? '#0d9488');
  const [functionsSummary, setFunctionsSummary] = useState(
    'Atención al cliente multicanal, soporte técnico de cuentas digitales, gestión de tickets, verificación de pagos y acompañamiento operativo en turnos asignados.'
  );
  const [copied, setCopied] = useState(false);

  // Persistir configuración de marca/empresa multitenant en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          companyName,
          companyNit,
          companyContact,
          signerName,
          signerRole,
          city,
          logoUrl,
          showLogo,
          accentColor,
        })
      );
    } catch {
      // Ignorar errores de cuota de almacenamiento
    }
  }, [storageKey, companyName, companyNit, companyContact, signerName, signerRole, city, logoUrl, showLogo, accentColor]);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
        setShowLogo(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetBrand = () => {
    setCompanyName(defaultCompanyName);
    setCompanyNit('');
    setCompanyContact('');
    setLogoUrl(defaultLogoUrl);
    setShowLogo(true);
    setAccentColor('#0d9488');
  };

  const applyEmployee = (emp: CertificateEmployeeOption | null | undefined) => {
    if (!emp) return;
    setSelectedEmpId(String(emp.id));
    setFullname(emp.fullname || '');
    setPosition(ROLE_LABELS[emp.role] || emp.role || 'Asesor de Soporte al Cliente');
    setIsActive(emp.status !== 'inactive');
    if (emp.hourly_rate && emp.hourly_rate > 0) {
      // Estimado referencial mensual (160h) por si deciden incluir remuneración
      const est = Math.round(emp.hourly_rate * 160);
      setSalaryAmount(est.toLocaleString('es-CO'));
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (initialEmployee) {
      applyEmployee(initialEmployee);
    } else if (employees.length > 0 && !selectedEmpId) {
      applyEmployee(employees[0]);
    }
  }, [isOpen, initialEmployee, employees]);

  if (!isOpen) return null;

  const docPhrase = docNumber.trim()
    ? `, identificado(a) con ${docType} No. ${docNumber.trim()}`
    : '';

  const startPhrase = startDate ? formatLongDateEs(startDate) : '[FECHA DE INGRESO]';
  const endPhrase = endDate ? formatLongDateEs(endDate) : '[FECHA DE RETIRO]';

  const statusParagraph = isActive
    ? `Que ${fullname || '[NOMBRE DEL COLABORADOR]'}${docPhrase}, se encuentra vinculado(a) activamente con ${companyName} desde el ${startPhrase} hasta la fecha, desempeñando el cargo de ${position} bajo la modalidad de ${contractType}.`
    : `Que ${fullname || '[NOMBRE DEL COLABORADOR]'}${docPhrase}, estuvo vinculado(a) con ${companyName} desde el ${startPhrase} hasta el ${endPhrase}, desempeñando el cargo de ${position} bajo la modalidad de ${contractType}.`;

  const salaryParagraph =
    includeSalary && salaryAmount.trim()
      ? `Durante su vinculación, devengó una remuneración promedio de $${salaryAmount.trim()} COP ${salaryPeriod}.`
      : '';

  const issuePhrase = `Para constancia de lo anterior, se expide la presente certificación en ${city}, a los ${formatLongDateEs(issueDate)}.`;

  const plainTextCertificate = [
    `${companyName.toUpperCase()}`,
    companyNit ? `NIT: ${companyNit}` : '',
    '',
    'CERTIFICADO LABORAL',
    '',
    addressedTo.trim().toUpperCase(),
    '',
    `${companyName} hace constar:`,
    '',
    statusParagraph,
    functionsSummary.trim() ? `Entre sus principales funciones se encuentran: ${functionsSummary.trim()}` : '',
    salaryParagraph,
    'Durante el tiempo de servicio ha demostrado responsabilidad, compromiso y adecuado desempeño en las labores asignadas.',
    '',
    issuePhrase,
    '',
    'Cordialmente,',
    signerName,
    signerRole,
    companyName,
    companyContact,
  ]
    .filter((line, idx, arr) => !(line === '' && arr[idx - 1] === ''))
    .join('\n');

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(plainTextCertificate);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silencioso
    }
  };

  const handlePrintPdf = () => {
    const resolvedLogo = logoUrl
      ? (logoUrl.startsWith('data:') || logoUrl.startsWith('http')
          ? logoUrl
          : `${window.location.origin}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`)
      : '';
    const safeAccent = /^#[0-9a-fA-F]{3,8}$/.test(accentColor) ? accentColor : '#0d9488';
    const printWin = window.open('', '_blank', 'width=900,height=1050');
    if (!printWin) return;

    const certCode = `CERT-${new Date().getFullYear()}-${String(selectedEmpId || '001').padStart(3, '0')}`;

    printWin.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Certificado Laboral - ${escapeHtml(fullname || 'Colaborador')}</title>
  <style>
    @page { size: letter; margin: 18mm 20mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 0;
      background: #ffffff;
      line-height: 1.65;
    }
    .page {
      max-width: 720px;
      margin: 0 auto;
      padding: 12px 4px;
      position: relative;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid ${safeAccent};
      padding-bottom: 16px;
      margin-bottom: 28px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .brand img {
      max-width: 72px;
      max-height: 58px;
      border-radius: 10px;
      object-fit: contain;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 0.08em;
      color: #0f172a;
      margin: 0;
      line-height: 1.1;
    }
    .brand-sub {
      font-size: 11px;
      color: #475569;
      margin-top: 3px;
    }
    .doc-meta {
      text-align: right;
      font-size: 11px;
      color: #64748b;
    }
    .doc-title {
      text-align: center;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.12em;
      color: #0f172a;
      margin: 22px 0 6px;
      text-transform: uppercase;
    }
    .doc-subtitle {
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: ${safeAccent};
      margin-bottom: 28px;
      text-transform: uppercase;
    }
    .addressed {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.04em;
      margin-bottom: 18px;
      text-transform: uppercase;
    }
    .intro {
      font-size: 13.5px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    p {
      font-size: 13.5px;
      text-align: justify;
      margin: 0 0 14px;
      color: #1e293b;
    }
    .signature-block {
      margin-top: 52px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .sig-line {
      width: 260px;
      border-top: 1.5px solid #0f172a;
      padding-top: 8px;
    }
    .sig-name {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
    }
    .sig-role {
      font-size: 12px;
      color: #475569;
    }
    .seal {
      border: 2px solid ${safeAccent};
      color: ${safeAccent};
      border-radius: 10px;
      padding: 8px 14px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-align: center;
    }
    .footer {
      margin-top: 44px;
      padding-top: 12px;
      border-top: 1px solid #cbd5e1;
      text-align: center;
      font-size: 10.5px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand">
        ${showLogo && resolvedLogo ? `<img src="${resolvedLogo}" alt="${escapeHtml(companyName)}" />` : ''}
        <div>
          <h1 class="brand-title">${escapeHtml(companyName)}</h1>
          <div class="brand-sub">
            ${companyNit ? `NIT: ${escapeHtml(companyNit)}${companyContact ? ' · ' : ''}` : ''}${escapeHtml(companyContact)}
          </div>
        </div>
      </div>
      <div class="doc-meta">
        <div><strong>Ref:</strong> ${escapeHtml(certCode)}</div>
        <div>${escapeHtml(city)}, ${escapeHtml(formatLongDateEs(issueDate))}</div>
      </div>
    </div>

    <div class="doc-title">Certificado Laboral</div>
    <div class="doc-subtitle">Constancia Oficial de Vinculación</div>

    <div class="addressed">${escapeHtml(addressedTo || 'A QUIEN INTERESE')}</div>
    <div class="intro">${escapeHtml(companyName)} se permite certificar:</div>

    <p>${escapeHtml(statusParagraph)}</p>
    ${functionsSummary.trim() ? `<p>Entre sus principales funciones y responsabilidades se encuentran: ${escapeHtml(functionsSummary.trim())}</p>` : ''}
    ${salaryParagraph ? `<p>${escapeHtml(salaryParagraph)}</p>` : ''}
    <p>Durante su permanencia ha demostrado compromiso, puntualidad, honestidad y excelente disposición en el cumplimiento de las actividades asignadas.</p>
    <p>${escapeHtml(issuePhrase)}</p>

    <div class="signature-block">
      <div>
        <div style="font-size: 13px; margin-bottom: 34px;">Atentamente,</div>
        <div class="sig-line">
          <div class="sig-name">${escapeHtml(signerName)}</div>
          <div class="sig-role">${escapeHtml(signerRole)} · ${escapeHtml(companyName)}</div>
        </div>
      </div>
      <div class="seal">
        Documento Emitido<br/>${escapeHtml(companyName)}<br/>${escapeHtml(certCode)}
      </div>
    </div>

    <div class="footer">
      ${escapeHtml(companyName)}${companyNit ? ` · NIT ${escapeHtml(companyNit)}` : ''} · ${escapeHtml(companyContact)}
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>`);
    printWin.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                Generador de Certificado Laboral
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Personaliza los datos del colaborador, previsualiza con el logo de {companyName} y exporta a PDF.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Form + Live Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 p-5">
          {/* Left Form */}
          <div className="lg:col-span-5 space-y-4">
            {/* Seleccionar empleado */}
            {employees.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Cargar datos de empleado
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => {
                    const found = employees.find((emp) => String(emp.id) === e.target.value);
                    applyEmployee(found);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={String(emp.id)}>
                      {emp.fullname} ({emp.role}{emp.status === 'inactive' ? ' · Inactivo' : ''})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Colaborador y Documento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Nombre completo del colaborador
                </label>
                <input
                  type="text"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  placeholder="Ej. Carol Andrea Pérez"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Tipo de documento
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="C.C.">C.C. (Cédula)</option>
                  <option value="C.E.">C.E. (Extranjería)</option>
                  <option value="PPT">PPT</option>
                  <option value="Pasaporte">Pasaporte</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Número de documento (opcional)
                </label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="Ej. 1.012.345.678"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Cargo y Contrato */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Cargo desempeñado
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Tipo de vinculación
                </label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Prestación de Servicios">Prestación de Servicios</option>
                  <option value="Término Indefinido">Término Indefinido</option>
                  <option value="Término Fijo">Término Fijo</option>
                  <option value="Turnos Rotativos / Medio Tiempo">Turnos Rotativos / Medio Tiempo</option>
                </select>
              </div>
            </div>

            {/* Fechas y estado */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-500" /> Fechas de vinculación
                </span>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  Labora actualmente
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                    Fecha de ingreso
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  />
                </div>
                {!isActive && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                      Fecha de retiro
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Salario opcional */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 space-y-2.5">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSalary}
                  onChange={(e) => setIncludeSalary(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                Incluir remuneración / salario en el certificado
              </label>
              {includeSalary && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={salaryAmount}
                    onChange={(e) => setSalaryAmount(e.target.value)}
                    placeholder="Ej. 1.300.000"
                    className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  />
                  <select
                    value={salaryPeriod}
                    onChange={(e) => setSalaryPeriod(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                  >
                    <option value="mensuales">mensuales</option>
                    <option value="quincenales">quincenales</option>
                    <option value="por hora laborada">por hora laborada</option>
                  </select>
                </div>
              )}
            </div>

            {/* Funciones */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                Funciones principales (opcional)
              </label>
              <textarea
                rows={2}
                value={functionsSummary}
                onChange={(e) => setFunctionsSummary(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Logo y marca de la empresa (Multitenant) */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                  Logo y color de la empresa (Multitenant)
                </span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-[11px] font-semibold text-gray-600 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showLogo}
                      onChange={(e) => setShowLogo(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    Mostrar logo
                  </label>
                  <button
                    type="button"
                    onClick={handleResetBrand}
                    className="text-[11px] font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 flex items-center gap-1"
                    title="Restaurar valores por defecto"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <Upload className="w-3.5 h-3.5" /> Subir logo
                </button>
                <input
                  type="text"
                  value={logoUrl.startsWith('data:') ? '' : logoUrl}
                  onChange={(e) => { setLogoUrl(e.target.value); setShowLogo(true); }}
                  placeholder={logoUrl.startsWith('data:') ? 'Imagen subida (local)' : 'o pega URL del logo...'}
                  className="flex-1 min-w-[140px] px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                />
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  title="Color de acento de la empresa"
                  className="w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-700 cursor-pointer bg-transparent"
                />
              </div>
            </div>

            {/* Datos de expedición y empresa */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Dirigido a
                </label>
                <input
                  type="text"
                  value={addressedTo}
                  onChange={(e) => setAddressedTo(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Firmante
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Cargo firmante
                </label>
                <input
                  type="text"
                  value={signerRole}
                  onChange={(e) => setSignerRole(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Empresa
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                  NIT / Identificación (opcional)
                </label>
                <input
                  type="text"
                  value={companyNit}
                  onChange={(e) => setCompanyNit(e.target.value)}
                  placeholder="Ej. 901.XXX.XXX-X"
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Fecha de expedición
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Contacto pie de página
                </label>
                <input
                  type="text"
                  value={companyContact}
                  onChange={(e) => setCompanyContact(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Right Live Document Preview */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-500" /> Vista previa del documento
              </span>
              <span className="text-[11px] text-gray-400">Formato Carta / PDF</span>
            </div>

            <div className="bg-white text-slate-900 rounded-xl border border-gray-300 shadow-lg p-7 sm:p-9 flex-1 flex flex-col justify-between min-h-[540px]">
              <div>
                {/* Header */}
                <div
                  className="flex items-center justify-between border-b-2 pb-4 mb-6"
                  style={{ borderBottomColor: accentColor }}
                >
                  <div className="flex items-center gap-3">
                    {showLogo && logoUrl && (
                      <img
                        src={logoUrl}
                        alt={companyName}
                        className="max-w-14 max-h-14 rounded-xl object-contain"
                      />
                    )}
                    <div>
                      <h4 className="text-xl font-black tracking-wider text-slate-900 leading-none">
                        {companyName}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {companyNit ? `NIT: ${companyNit}${companyContact ? ' · ' : ''}` : ''}{companyContact}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-500">
                    <div className="font-bold text-slate-700">
                      Ref: CERT-{new Date().getFullYear()}-{String(selectedEmpId || '001').padStart(3, '0')}
                    </div>
                    <div>{city}, {formatLongDateEs(issueDate)}</div>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center mb-6">
                  <h2 className="text-lg font-extrabold tracking-widest uppercase text-slate-900">
                    CERTIFICADO LABORAL
                  </h2>
                  <p
                    className="text-[11px] font-bold tracking-wider uppercase"
                    style={{ color: accentColor }}
                  >
                    Constancia Oficial de Vinculación
                  </p>
                </div>

                {/* Body */}
                <div className="space-y-3.5 text-[13px] leading-relaxed text-slate-800 text-justify">
                  <p className="font-extrabold uppercase tracking-wide text-slate-900">
                    {addressedTo || 'A QUIEN INTERESE'}
                  </p>
                  <p className="font-bold text-slate-900">{companyName} se permite certificar:</p>
                  <p>{statusParagraph}</p>
                  {functionsSummary.trim() && (
                    <p>
                      Entre sus principales funciones y responsabilidades se encuentran: {functionsSummary.trim()}
                    </p>
                  )}
                  {salaryParagraph && <p>{salaryParagraph}</p>}
                  <p>
                    Durante su permanencia ha demostrado compromiso, puntualidad, honestidad y excelente disposición en el cumplimiento de las actividades asignadas.
                  </p>
                  <p>{issuePhrase}</p>
                </div>
              </div>

              {/* Signature & Footer */}
              <div className="mt-10">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-700 mb-7">Atentamente,</p>
                    <div className="border-t border-slate-900 pt-1.5 w-56">
                      <p className="text-sm font-extrabold text-slate-900">{signerName}</p>
                      <p className="text-xs text-slate-600">{signerRole} · {companyName}</p>
                    </div>
                  </div>
                  <div
                    className="border-2 rounded-lg px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-center"
                    style={{ borderColor: accentColor, color: accentColor }}
                  >
                    Documento Emitido<br />{companyName}
                  </div>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500">
                  {companyName}{companyNit ? ` · NIT ${companyNit}` : ''} · {companyContact}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-850">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-teal-500" />
            <span>Usa <strong>Imprimir / Guardar PDF</strong> para descargarlo con el logo oficial.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Texto Copiado' : 'Copiar Texto'}
            </button>
            <button
              type="button"
              onClick={handlePrintPdf}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Guardar PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-bold transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
