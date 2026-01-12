import React from 'react';
import { Script } from '../types';
import { Calendar, Hash, Trash2, Archive, ArchiveRestore, FileText, Clock } from 'lucide-react';

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
    <div className="group relative bg-white dark:bg-slate-800 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all border-l-4 border-transparent hover:border-indigo-500 dark:hover:border-indigo-400">
      <div className="flex flex-col gap-2">
        {/* Header: Title and Actions */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-1.5 bg-slate-100 dark:bg-slate-700 rounded-md text-slate-500 dark:text-slate-400">
              <FileText size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {script.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                {script.summary}
              </p>
            </div>
          </div>

          {/* Actions (Visible on hover or distinct interaction) */}
          <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity self-start">
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleStatus(script.id); }}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
              title={script.status === 'active' ? "Archivar" : "Restaurar"}
            >
              {script.status === 'active' ? <Archive size={16} /> : <ArchiveRestore size={16} />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(script.id); }}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Footer: Metadata */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 ml-11">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-full">
             <Calendar size={12} /> {formattedDate}
          </span>
          
          {script.themes.length > 0 && (
            <div className="flex items-center gap-2 overflow-hidden">
               {script.themes.slice(0, 3).map((theme, idx) => (
                 <span key={idx} className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                   <Hash size={10} /> {theme}
                 </span>
               ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};