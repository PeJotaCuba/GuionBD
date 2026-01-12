import React from 'react';
import { Script } from '../types';
import { Calendar, Tag, Trash2, Archive, ArchiveRestore } from 'lucide-react';

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

  // Imágenes específicas de Radio/Escritura/Audio (Reducidas y simples)
  const themeImages = [
    "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=100&q=60", // Micrófono vintage
    "https://images.unsplash.com/photo-1520032525096-7bd04a94b5a4?auto=format&fit=crop&w=100&q=60", // Máquina de escribir
    "https://images.unsplash.com/photo-1506157786151-c843ec76657f?auto=format&fit=crop&w=100&q=60", // Radio antigua
    "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=100&q=60", // Manuscrito
    "https://images.unsplash.com/photo-1478737270239-2f02b77ac618?auto=format&fit=crop&w=100&q=60"  // Altavoz
  ];

  // Deterministic image selection based on title length
  const imageIndex = script.title.length % themeImages.length;
  const imageUrl = themeImages[imageIndex];

  return (
    <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors flex gap-3 items-center group">
      {/* Thumbnail Reducido (w-12 h-12 = 48px) */}
      <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-slate-200">
        <img 
          src={imageUrl} 
          alt="Tema" 
          className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight line-clamp-2">
            {script.title}
          </h4>
          
          {/* Actions */}
          <div className="flex gap-1 shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleStatus(script.id); }}
              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
              title={script.status === 'active' ? "Archivar" : "Restaurar"}
            >
              {script.status === 'active' ? <Archive size={14} /> : <ArchiveRestore size={14} />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(script.id); }}
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              title="Eliminar"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Info Line */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400 mt-1">
          <span className="flex items-center gap-1">
             <Calendar size={10} /> {formattedDate}
          </span>
          {script.themes.length > 0 && (
             <span className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 truncate max-w-[120px]">
               <Tag size={10} /> {script.themes[0]}
             </span>
          )}
        </div>
      </div>
    </div>
  );
};