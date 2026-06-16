import React, { useState, useEffect } from 'react';
import { FileText, Save, Plus, Trash2, RefreshCw, CheckCircle, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';

interface PolicySection {
  title: string;
  paragraphs: string[];
}

interface PoliciesData {
  terms_and_conditions: PolicySection[];
  refund_policy: PolicySection[];
}

export const PoliciesView: React.FC = () => {
  const [policies, setPolicies] = useState<PoliciesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'tc' | 'refund'>('tc');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/policies`);
      const data = await res.json();
      setPolicies(data);
    } catch (e) {
      console.error("Error fetching policies:", e);
      setMessage({ type: 'error', text: 'Error al conectar con el servidor para obtener las políticas.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!policies) return;
    setSaving(true);
    setMessage(null);
    const apiUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://bot.sheerit.com.co';
    try {
      const res = await fetch(`${apiUrl}/api/admin/policies/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policies, password: 'admin123' })
      });
      const data = await res.json();
      if (data.success) {
        if (data.warning) {
          setMessage({ type: 'error', text: `${data.warning} Detalle: ${data.error}` });
        } else {
          setMessage({ type: 'success', text: 'Políticas guardadas, bot de WhatsApp actualizado y archivos PDF regenerados correctamente.' });
        }
      } else {
        setMessage({ type: 'error', text: 'Error: ' + data.message });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Error de comunicación con el servidor.' });
    } finally {
      setSaving(false);
    }
  };

  const updateSectionTitle = (tab: 'tc' | 'refund', sIdx: number, value: string) => {
    if (!policies) return;
    const key = tab === 'tc' ? 'terms_and_conditions' : 'refund_policy';
    const updated = { ...policies };
    updated[key][sIdx].title = value;
    setPolicies(updated);
  };

  const updateParagraph = (tab: 'tc' | 'refund', sIdx: number, pIdx: number, value: string) => {
    if (!policies) return;
    const key = tab === 'tc' ? 'terms_and_conditions' : 'refund_policy';
    const updated = { ...policies };
    updated[key][sIdx].paragraphs[pIdx] = value;
    setPolicies(updated);
  };

  const addParagraph = (tab: 'tc' | 'refund', sIdx: number) => {
    if (!policies) return;
    const key = tab === 'tc' ? 'terms_and_conditions' : 'refund_policy';
    const updated = { ...policies };
    updated[key][sIdx].paragraphs.push('');
    setPolicies(updated);
  };

  const removeParagraph = (tab: 'tc' | 'refund', sIdx: number, pIdx: number) => {
    if (!policies) return;
    const key = tab === 'tc' ? 'terms_and_conditions' : 'refund_policy';
    const updated = { ...policies };
    updated[key][sIdx].paragraphs.splice(pIdx, 1);
    setPolicies(updated);
  };

  const addSection = (tab: 'tc' | 'refund') => {
    if (!policies) return;
    const key = tab === 'tc' ? 'terms_and_conditions' : 'refund_policy';
    const updated = { ...policies };
    updated[key].push({
      title: `${updated[key].length + 1}. Nueva Sección`,
      paragraphs: ['']
    });
    setPolicies(updated);
  };

  const removeSection = (tab: 'tc' | 'refund', sIdx: number) => {
    if (!policies) return;
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta sección completa y todos sus párrafos?")) return;
    const key = tab === 'tc' ? 'terms_and_conditions' : 'refund_policy';
    const updated = { ...policies };
    updated[key].splice(sIdx, 1);
    setPolicies(updated);
  };

  const moveSection = (tab: 'tc' | 'refund', sIdx: number, direction: 'up' | 'down') => {
    if (!policies) return;
    const key = tab === 'tc' ? 'terms_and_conditions' : 'refund_policy';
    const list = [...policies[key]];
    const targetIdx = direction === 'up' ? sIdx - 1 : sIdx + 1;
    
    if (targetIdx < 0 || targetIdx >= list.length) return;
    
    const temp = list[sIdx];
    list[sIdx] = list[targetIdx];
    list[targetIdx] = temp;
    
    setPolicies({
      ...policies,
      [key]: list
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 dark:text-gray-400">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-primary mb-3" />
        <p>Cargando políticas y PDFs...</p>
      </div>
    );
  }

  const activeKey = activeSubTab === 'tc' ? 'terms_and_conditions' : 'refund_policy';
  const activeSections = policies ? policies[activeKey] : [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 p-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center dark:text-white">
            <FileText className="mr-2 text-brand-primary" /> Documentos Legales y Políticas PDF
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Modifica los términos legales, actualiza automáticamente al Bot de WhatsApp y regenera los PDF del sitio web.
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center bg-brand-primary hover:bg-brand-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-55 w-full md:w-auto"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Guardando y Regenerando...' : 'Guardar y Regenerar PDFs'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-6 flex items-start gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800' : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800'}`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 gap-2">
        <button
          onClick={() => setActiveSubTab('tc')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${activeSubTab === 'tc' ? 'border-brand-primary text-brand-primary dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-650'}`}
        >
          Términos y Condiciones
        </button>
        <button
          onClick={() => setActiveSubTab('refund')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${activeSubTab === 'refund' ? 'border-brand-primary text-brand-primary dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-650'}`}
        >
          Política de Reembolsos
        </button>
      </div>

      <div className="space-y-6">
        {activeSections.map((section, sIdx) => (
          <div key={sIdx} className="p-5 rounded-2xl border border-gray-150 dark:border-gray-750 bg-gray-50/30 dark:bg-gray-900/10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div className="flex-grow w-full">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Título de la Sección</label>
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSectionTitle(activeSubTab, sIdx, e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-1 focus:ring-brand-primary outline-none"
                />
              </div>
              <div className="flex gap-1.5 self-end">
                <button
                  type="button"
                  onClick={() => moveSection(activeSubTab, sIdx, 'up')}
                  disabled={sIdx === 0}
                  className="p-2 border dark:border-gray-650 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 disabled:opacity-30"
                  title="Subir Sección"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveSection(activeSubTab, sIdx, 'down')}
                  disabled={sIdx === activeSections.length - 1}
                  className="p-2 border dark:border-gray-650 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 disabled:opacity-30"
                  title="Bajar Sección"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeSection(activeSubTab, sIdx)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg"
                  title="Eliminar Sección"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-brand-primary/20">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Párrafos de la Sección</span>
              {section.paragraphs.map((para, pIdx) => (
                <div key={pIdx} className="flex gap-3 items-start">
                  <span className="text-[11px] font-mono text-gray-400 mt-3">{pIdx + 1}.</span>
                  <textarea
                    rows={3}
                    value={para}
                    onChange={(e) => updateParagraph(activeSubTab, sIdx, pIdx, e.target.value)}
                    className="flex-grow p-3 text-xs border rounded-xl bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-1 focus:ring-brand-primary outline-none"
                    placeholder="Escribe el contenido de este párrafo..."
                  />
                  <button
                    type="button"
                    onClick={() => removeParagraph(activeSubTab, sIdx, pIdx)}
                    className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg mt-1"
                    title="Eliminar Párrafo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => addParagraph(activeSubTab, sIdx)}
                className="flex items-center text-xs font-bold text-brand-primary hover:text-brand-dark mt-2 gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Párrafo
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => addSection(activeSubTab)}
          className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-gray-500 hover:border-brand-primary hover:text-brand-primary transition-colors flex items-center justify-center font-bold"
        >
          <Plus className="w-5 h-5 mr-2" /> Agregar Nueva Sección
        </button>
      </div>
    </div>
  );
};
