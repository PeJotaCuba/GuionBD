import React, { useState, useEffect } from 'react';
import { Script } from '../types';
import { X, Save, Calendar, User, PenTool, Hash, Radio } from 'lucide-react';
import { PROGRAMS } from './ProgramGrid';

interface EditScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: Script | null;
  onSave: (updatedScript: Script) => void;
}

export const EditScriptModal: React.FC<EditScriptModalProps> = ({ isOpen, onClose, script, onSave }) => {
  const [formData, setFormData] = useState<Partial<Script>>({});

  useEffect(() => {
    if (script) {
      setFormData({ ...script });
    }
  }, [script]);

  if (!isOpen || !script) return null;

  const handleChange = (field: keyof Script, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleThemeChange = (value: string) => {
    // Convertir string separado por comas a array
    const themes = value.split(',').map(t => t.trim()).filter(t => t);
    setFormData(prev => ({ ...prev, themes }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id) {
      onSave(formData as Script);
      onClose();
    }
  };

  // Convertir fecha ISO a formato YYYY-MM-DD para el input date
  const dateValue = formData.dateAdded ? new Date(formData.dateAdded).toISOString().split('T')[0] : '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-hidden">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-md rounded-t-[2rem]">
          <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <PenTool size={20} className="text-indigo-500" />
            Editar Guion
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Programa */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Radio size={14} /> Programa
              </label>
              <select 
                value={formData.genre} 
                onChange={(e) => handleChange('genre', e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
              >
                {PROGRAMS.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
                <option value="OTRO">OTRO</option>
              </select>
            </div>

            {/* Fecha */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} /> Fecha
              </label>
              <input 
                type="date" 
                value={dateValue}
                onChange={(e) => handleChange('dateAdded', new Date(e.target.value).toISOString())}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
              />
            </div>
          </div>

          {/* Tema (Título) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Hash size={14} /> Tema Principal
            </label>
            <textarea 
              value={formData.title} 
              onChange={(e) => handleChange('title', e.target.value)}
              rows={2}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Escritor */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <PenTool size={14} /> Escritor
              </label>
              <input 
                type="text" 
                value={formData.writer}
                onChange={(e) => handleChange('writer', e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
              />
            </div>

            {/* Asesor */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User size={14} /> Asesor
              </label>
              <input 
                type="text" 
                value={formData.advisor}
                onChange={(e) => handleChange('advisor', e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
              />
            </div>
          </div>

          {/* Temáticas (Tags) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Hash size={14} /> Palabras Clave (separadas por coma)
            </label>
            <input 
              type="text" 
              value={formData.themes?.join(', ')}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
            />
          </div>

        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-[2rem] flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            className="flex-[2] py-3.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Save size={18} /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};