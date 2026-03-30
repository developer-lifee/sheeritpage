import { useState } from 'react';

interface Props {
  onClose: () => void;
  onConfirm: (scheduleText: string) => void;
}

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const TIME_BLOCKS = [
  { id: 'madrugada', label: '00:00 - 06:00', type: 'valle' },
  { id: 'manana', label: '06:00 - 12:00', type: 'valle' },
  { id: 'tarde', label: '12:00 - 18:00', type: 'valle' },
  { id: 'noche', label: '18:00 - 00:00', type: 'pico' }
];

const MAX_BLOCKS = 4;
const MAX_PICO = 1;

export function XboxScheduleModal({ onClose, onConfirm }: Props) {
  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set());

  const handleToggleBlock = (dayIndex: number, blockId: string, type: string) => {
    const key = `${dayIndex}-${blockId}`;
    const newSelected = new Set(selectedBlocks);
    
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      // Validaciones
      if (newSelected.size >= MAX_BLOCKS) {
        alert(`Solo puedes seleccionar hasta ${MAX_BLOCKS} bloques de 6 horas por semana (1/7 del mes).`);
        return;
      }
      
      if (type === 'pico') {
        const currentPicos = Array.from(newSelected).filter(k => k.endsWith('-noche')).length;
        if (currentPicos >= MAX_PICO) {
          alert(`Para nivelar los paquetes, solo puedes escoger máximo ${MAX_PICO} bloque en horario pico (Noche) a la semana.`);
          return;
        }
      }
      
      newSelected.add(key);
    }
    
    setSelectedBlocks(newSelected);
  };

  const currentPicos = Array.from(selectedBlocks).filter(k => k.endsWith('-noche')).length;

  const handleConfirm = () => {
    if (selectedBlocks.size === 0) {
      alert("Por favor selecciona al menos un horario para continuar.");
      return;
    }

    // Parse back to string
    const sortedKeys = Array.from(selectedBlocks).sort();
    const scheduleParts = sortedKeys.map(key => {
      const [dayIdx, blockId] = key.split('-');
      const dayName = DAYS[parseInt(dayIdx)];
      const blockName = TIME_BLOCKS.find(b => b.id === blockId)?.label;
      return `${dayName} (${blockName})`;
    });

    onConfirm(scheduleParts.join(', '));
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-green-500"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.333 13.91l-4.242-4.242V6.666h1.515v4.379l3.798 3.798-1.071 1.066z"/></svg>
            Horarios de Xbox Ultimate
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full dark:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Para garantizar una experiencia premium por $15,000 COP a todos nuestros usuarios, el mes se divide en 7 partes. 
          Deberás elegir tus <strong>{MAX_BLOCKS} bloques semanales</strong> (24 horas totales por semana). Se requiere que balancees el uso combinando horarios de la tarde/mañana y máximo un horario pico.
        </p>

        <div className="mb-4 flex flex-wrap gap-4 text-sm font-medium">
          <span className={`px-3 py-1 rounded-full ${selectedBlocks.size === MAX_BLOCKS ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
            Bloques Elegidos: {selectedBlocks.size} / {MAX_BLOCKS}
          </span>
          <span className={`px-3 py-1 rounded-full ${currentPicos === MAX_PICO ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
            Horarios Pico: {currentPicos} / {MAX_PICO}
          </span>
        </div>

        <div className="overflow-x-auto flex-1 custom-scrollbar pb-2">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0 z-10">
              <tr>
                <th scope="col" className="p-3 border-b dark:border-gray-600">Franja Horaria</th>
                {DAYS.map(day => (
                  <th key={day} scope="col" className="p-3 border-b dark:border-gray-600 text-center">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_BLOCKS.map(block => (
                <tr key={block.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-3 font-medium text-gray-900 whitespace-nowrap dark:text-white flex items-center gap-2">
                    <span title={block.type === 'pico' ? 'Horario Pico' : 'Horario Valle'}>
                      {block.type === 'pico' ? '🔥' : '✌️'}
                    </span>
                    {block.label}
                  </td>
                  {DAYS.map((_, idx) => {
                    const key = `${idx}-${block.id}`;
                    const isSelected = selectedBlocks.has(key);
                    const isDisabled = !isSelected && (selectedBlocks.size >= MAX_BLOCKS || (block.type === 'pico' && currentPicos >= MAX_PICO));

                    return (
                      <td key={idx} className="p-2 text-center border-l border-r dark:border-gray-700/50">
                        <button
                          onClick={() => handleToggleBlock(idx, block.id, block.type)}
                          disabled={isDisabled}
                          className={`w-full h-10 rounded-lg transition-all flex items-center justify-center
                            ${isSelected 
                              ? (block.type === 'pico' ? 'bg-orange-500 text-white shadow-inner' : 'bg-brand-primary text-white shadow-inner') 
                              : (isDisabled ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-200 dark:border-gray-700' : 'bg-gray-50 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600')
                            }
                          `}
                        >
                          {isSelected && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 pt-4 border-t dark:border-gray-700 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-white">
            Cancelar
          </button>
          <button 
            onClick={handleConfirm}
            className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            Confirmar Horarios
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
