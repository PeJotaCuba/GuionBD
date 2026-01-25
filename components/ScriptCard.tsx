import React from 'react';
import { Script } from '../types';
import { Calendar, Hash, Trash2, Archive, ArchiveRestore, FileText } from 'lucide-react';

interface ScriptCardProps {
  script: Script;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ScriptCard: React.FC<ScriptCardProps> = ({ script, onToggleStatus, onDelete }) => {
  const formattedDate = new Date(script.dateAdded).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="group relative bg-white dark:bg-slate-900 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        
        {/* Icon / Status Indicator */}
        <div className="flex-shrink-0">
           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
             script.status === 'active' 
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
              : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
           }`}>
              <FileText size={20} strokeWidth={2} />
           </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h4 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-snug mb-1">
                {script.title}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-300 font-medium truncate">
                {script.summary}
              </p>
            </div>
            
            {/* Desktop Actions (Hover) */}
            <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); onToggleStatus(script.id); }}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                title={script.status === 'active' ? "Archivar" : "Restaurar"}
              >
                {script.status === 'active' ? <Archive size={18} /> : <ArchiveRestore size={18} />}
              </button>
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
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
               <Calendar size={12} className="text-slate-400" /> {formattedDate}
            </span>
            
            {script.themes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                 {script.themes.slice(0, 3).map((theme, idx) => (
                   <span key={idx} className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md border border-indigo-100 dark:border-indigo-800/30">
                     <Hash size={10} className="opacity-50" /> {theme}
                   </span>
                 ))}
              </div>
            )}
          </div>
          
          {/* Mobile Actions (Always Visible in Row below) */}
          <div className="flex sm:hidden items-center justify-end gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
             <button 
                onClick={(e) => { e.stopPropagation(); onToggleStatus(script.id); }}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 active:text-indigo-600"
              >
                {script.status === 'active' ? <Archive size={14} /> : <ArchiveRestore size={14} />}
                {script.status === 'active' ? "Archivar" : "Restaurar"}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(script.id); }}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 active:text-red-600"
              >
                <Trash2 size={14} />
                Eliminar
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};