import React from 'react';
import { Script } from '../types';
import { Calendar, Hash, Trash2, FileText, UserCircle } from 'lucide-react';

interface ScriptCardProps {
  script: Script;
  onDelete: (id: string) => void;
}

export const ScriptCard: React.FC<ScriptCardProps> = ({ script, onDelete }) => {
  const formattedDate = new Date(script.dateAdded).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="group relative bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-md transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        
        {/* Icon / Status Indicator */}
        <div className="flex-shrink-0">
           <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
              <FileText size={20} strokeWidth={2} />
           </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <h4 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-snug mb-1 truncate uppercase">
                {script.title}
              </h4>
              <div className="flex flex-col gap-0.5 mb-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <UserCircle size={12} className="text-indigo-500" /> Escritor: <span className="text-slate-700 dark:text-slate-300">{script.writer || 'N/A'}</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                  <UserCircle size={12} className="text-amber-500" /> Asesor: <span className="text-slate-700 dark:text-slate-300">{script.advisor || 'N/A'}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(script.id); }}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                title="Eliminar"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Metadata Footer */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
               <Calendar size={12} className="text-slate-400" /> {formattedDate}
            </span>
            
            {script.themes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                 {script.themes.slice(0, 3).map((theme, idx) => (
                   <span key={idx} className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-slate-800 border border-indigo-100 dark:border-indigo-500/20 px-2.5 py-1 rounded-lg">
                     <Hash size={10} className="opacity-50" /> {theme}
                   </span>
                 ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};