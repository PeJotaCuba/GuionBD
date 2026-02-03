import React, { useState, useEffect } from 'react';
import { X, Sparkles, Eraser, RefreshCw } from 'lucide-react';

interface PolishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (term: string, replacement: string) => void;
  programName: string;
  initialTerm?: string;
}

export const PolishModal: React.FC<PolishModalProps> = ({ isOpen, onClose, onApply, programName, initialTerm = '' }) => {
  const [term, setTerm] = useState(initialTerm);
  const [replacement, setReplacement] = useState('');

  // Actualizar el término cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setTerm(initialTerm);
      setReplacement('');
    }
  }, [isOpen, initialTerm]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (!term.trim()) {
      alert("Debes escribir la palabra o frase a buscar.");
      return;
    }
    
    if (window.confirm(`¿Estás seguro? Esto modificará TODOS los guiones de "${programName}" donde aparezca "${term}".`)) {
      onApply(term, replacement);
      setTerm('');
      setReplacement('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 transform transition-all scale-100">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-indigo-600 rounded-t-[2rem] flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-100"></div>
          <div className="relative z-10 flex items-center gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
               <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Pulir Base de Datos</h2>
              <p className="text-xs font-medium text-indigo-100 opacity-90">{programName}</p>
            </div>
          </div>
          <button onClick={onClose} className="relative z-10 p-2 rounded-full hover:bg-white/20 transition-colors text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">
                  Buscar (Palabra o Frase)
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Ej: Errores comunes..."
                    className="w-full pl-4 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                    autoFocus={!initialTerm} // Solo autofoco si no hay término inicial
                  />
                </div>
             </div>

             <div className="flex justify-center">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400">
                   <RefreshCw size={20} />
                </div>
             </div>

             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 flex justify-between">
                  <span>Reemplazar con</span>
                  <span className="text-[10px] text-amber-500 normal-case font-normal">(Si lo dejas vacío, se elimina)</span>
                </label>
                <input 
                  type="text" 
                  value={replacement}
                  onChange={(e) => setReplacement(e.target.value)}
                  placeholder="Nueva palabra o frase..."
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                  autoFocus={!!initialTerm} // Autofoco aquí si ya hay término inicial
                />
             </div>
          </div>
          
          <button 
            onClick={handleApply}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2
              ${!replacement ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'}
            `}
          >
            {!replacement ? <Eraser size={20} /> : <RefreshCw size={20} />}
            {!replacement ? 'Eliminar Frase' : 'Reemplazar Texto'}
          </button>
        </div>
      </div>
    </div>
  );
};