import React, { useState, useEffect, useMemo } from 'react';
import { Script, UserRole } from '../types';
import { ScriptCard } from './ScriptCard';
import { StatsView } from './StatsView';
import { UploadModal } from './UploadModal';
import { PROGRAMS } from './ProgramGrid';
import { 
  Upload, Search, Radio, ChevronLeft, 
  Trash2, RefreshCw, Download, FileText
} from 'lucide-react';

interface ProgramDetailProps {
  programName: string;
  userRole: UserRole;
  onBack: () => void;
}

export const ProgramDetail: React.FC<ProgramDetailProps> = ({ programName, userRole, onBack }) => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [view, setView] = useState<'list' | 'stats'>('list');

  const programInfo = PROGRAMS.find(p => p.name === programName);
  const fileName = programInfo?.file || `${programName.replace(/\s+/g, '_').toLowerCase()}.json`;
  const storageKey = `guionbd_data_${fileName}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setScripts(JSON.parse(saved));
    } else {
      setScripts([]);
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(scripts));
  }, [scripts, storageKey]);

  const filteredScripts = useMemo(() => {
    let result = scripts;
    if (selectedYear) {
      result = result.filter(s => new Date(s.dateAdded).getFullYear().toString() === selectedYear);
    }
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(s => 
        s.title.toLowerCase().includes(q) || 
        s.dateAdded.includes(q) ||
        s.themes.some(t => t.toLowerCase().includes(q)) ||
        s.writer?.toLowerCase().includes(q) ||
        s.advisor?.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
  }, [scripts, searchQuery, selectedYear]);

  const handleAddScripts = (newScripts: Script[]) => {
    setScripts(prev => {
      const merged = [...newScripts, ...prev];
      const unique = merged.filter((v, i, a) => 
        a.findIndex(t => t.title === v.title && t.dateAdded === v.dateAdded) === i
      );
      return unique;
    });
  };

  const clearData = () => {
    if (window.confirm('¿Eliminar toda la base de datos de este programa?')) {
      setScripts([]);
    }
  };

  const downloadData = () => {
    const blob = new Blob([JSON.stringify(scripts, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header del Programa */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 rounded-full hover:bg-white dark:hover:bg-slate-900 shadow-sm text-slate-600 dark:text-slate-400">
             <ChevronLeft />
          </button>
          <div className={`p-3 rounded-3xl ${programInfo?.color || 'bg-indigo-600'} text-white shadow-lg`}>
            <Radio size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase leading-tight">{programName}</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Base de Datos: <span className="font-bold text-indigo-500">{fileName}</span> ({scripts.length} registros)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {userRole === 'Administrador' ? (
            <>
              <button 
                onClick={() => setIsUploading(true)} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all"
              >
                <Upload size={18} /> <span>Cargar Información</span>
              </button>
              
              <button onClick={() => window.location.reload()} className="p-2.5 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all" title="Actualizar">
                <RefreshCw size={20} />
              </button>

              <button onClick={downloadData} className="p-2.5 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all" title="Descargar JSON">
                <Download size={20} />
              </button>

              <button onClick={clearData} className="p-2.5 text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all" title="Limpiar todo">
                <Trash2 size={20} />
              </button>
            </>
          ) : (
            <button onClick={() => window.location.reload()} className="p-2.5 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-all" title="Actualizar">
              <RefreshCw size={20} />
            </button>
          )}

          {(['Administrador', 'Director', 'Asesor'].includes(userRole)) && (
            <button 
              onClick={() => setView(view === 'list' ? 'stats' : 'list')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${view === 'stats' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}
            >
              <FileText size={18} /> <span>Informes</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full group">
            <Search size={20} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por fecha, tema, escritor o asesor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center">
            {['2022', '2023', '2024', '2025', '2026'].map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(selectedYear === year ? null : year)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${selectedYear === year ? 'bg-indigo-600 text-white shadow-md ring-4 ring-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pb-20">
        {view === 'stats' ? (
          <StatsView scripts={scripts} />
        ) : filteredScripts.length > 0 ? (
          <div className="grid gap-4">
            {filteredScripts.map(script => (
              <ScriptCard 
                key={script.id} 
                script={script} 
                onDelete={(id) => {
                   if(userRole === 'Administrador' && window.confirm('¿Eliminar guion?')) {
                     setScripts(prev => prev.filter(s => s.id !== id))
                   }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
             <FileText size={48} className="mb-4 text-slate-300" />
             <p className="text-xl font-medium text-slate-400">No hay guiones registrados para este programa o filtros.</p>
          </div>
        )}
      </div>

      <UploadModal 
        isOpen={isUploading} 
        onClose={() => setIsUploading(false)} 
        onSave={handleAddScripts}
        targetStatus="active" 
      />
    </div>
  );
};