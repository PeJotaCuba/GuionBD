import React from 'react';
import { Script } from '../types';
import { FileText, Calendar, Tag, Trash2, Archive, ArchiveRestore, Radio } from 'lucide-react';

interface ScriptCardProps {
  script: Script;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ScriptCard: React.FC<ScriptCardProps> = ({ script, onToggleStatus, onDelete }) => {
  const formattedDate = new Date(script.dateAdded).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Use genre (Program Name) to seed the image so all episodes of same program look similar
  const seed = script.genre.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const imageId = (seed % 70) + 1; 
  const imageUrl = `https://picsum.photos/id/${imageId}/400/200`;

  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-slate-100 dark:border-slate-700 flex flex-col h-full">
      <div className="h-32 overflow-hidden relative">
        <img 
          src={imageUrl} 
          alt="Program Cover" 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <div className="flex items-center gap-1.5 mb-1 opacity-90">
             <Radio size={12} className="text-indigo-400" />
             <p className="text-xs font-bold uppercase tracking-wide truncate">{script.genre}</p>
          </div>
          <h3 className="font-bold text-lg leading-tight line-clamp-2">{script.title}</h3>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="mb-4 flex-1">
            <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300 text-sm">
                <FileText size={16} className="mt-0.5 shrink-0 text-slate-400" />
                <span className="break-all font-mono text-xs">{script.summary.replace('Archivo: ', '')}</span>
            </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {script.themes.slice(0, 3).map((theme, idx) => (
            <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
              <Tag size={10} className="mr-1" />
              {theme}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700 mt-auto">
          <div className="flex items-center text-xs text-slate-400 font-medium">
            <Calendar size={12} className="mr-1" />
            {formattedDate}
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => onToggleStatus(script.id)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
              title={script.status === 'active' ? "Archivar" : "Restaurar"}
            >
              {script.status === 'active' ? <Archive size={16} /> : <ArchiveRestore size={16} />}
            </button>
            <button 
              onClick={() => onDelete(script.id)}
              className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
