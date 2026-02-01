import React from 'react';
import { Script } from '../types';
import { Calendar, Trash2, User, PenTool, Radio, Hash, Edit } from 'lucide-react';

interface ScriptCardProps {
  script: Script;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onEdit?: (script: Script) => void;
}

export const ScriptCard: React.FC<ScriptCardProps> = ({ script, isAdmin, onDelete, onEdit }) => {
  const formattedDate = new Date(script.dateAdded).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 overflow-hidden">
      
      {/* Header: Programa y Fecha */}
      <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Radio size={14} />
          </div>
          <span className="text-xs font-black tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
            {script.genre}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <Calendar size={14} />
          <span className="text-xs font-bold capitalize">{formattedDate}</span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-4 w-full">
            
            {/* Tema */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Tema</span>
              <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 leading-snug">
                {script.title}
              </h3>
            </div>

            {/* Grid: Escritor y Asesor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-100 dark:border-slate-800/50">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-sm text-emerald-500">
                  <PenTool size={14} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Escritor</span>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase line-clamp-1" title={script.writer}>
                    {script.writer || 'No especificado'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-sm text-amber-500">
                  <User size={14} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Asesor</span>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase line-clamp-1" title={script.advisor}>
                    {script.advisor || 'No especificado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tags / Palabras Clave */}
            {script.themes && script.themes.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {script.themes.slice(0, 4).map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    <Hash size={10} className="opacity-50" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Botones de Acción (Solo Admin) */}
          {isAdmin && (
            <div className="flex flex-col gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); if (onEdit) onEdit(script); }}
                className="group-hover:opacity-100 opacity-0 transition-opacity p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl flex-shrink-0"
                title="Editar Guion"
              >
                <Edit size={20} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(script.id); }}
                className="group-hover:opacity-100 opacity-0 transition-opacity p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex-shrink-0"
                title="Eliminar Guion"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};