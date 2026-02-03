import React, { useState, useEffect, useMemo } from 'react';
import { Script, UserRole } from '../types';
import { ScriptCard } from './ScriptCard';
import { UploadModal } from './UploadModal';
import { EditScriptModal } from './EditScriptModal';
import { PROGRAMS } from './ProgramGrid';
import { ScriptCarousel } from './ScriptCarousel';
import { 
  Upload, Search, Radio, ChevronLeft, 
  Trash2, FileText
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
  const [editingScript, setEditingScript] = useState<Script | null>(null);

  const isAdmin = userRole === 'Administrador';

  const programInfo = PROGRAMS.find(p => p.name === programName);
  const fileName = programInfo?.file || `${programName.replace(/\s+/g, '_').toLowerCase()}.json`;
  const storageKey = `guionbd_data_${fileName}`;

  // Carga inicial
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setScripts(JSON.parse(saved));
    } else {
      setScripts([]);
    }
  }, [storageKey]);

  // Persistencia automática ante cambios
  useEffect(() => {
    if (scripts.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(scripts));
    }
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

  // Lógica para el carrusel "Hace un año" (rango -3 a +3 días)
  const historicScripts = useMemo(() => {
    const today = new Date();
    // Fecha objetivo: hace 1 año
    const targetDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    
    // Rango: -3 días a +3 días
    const startRange = new Date(targetDate);
    startRange.setDate(targetDate.getDate() - 3);
    startRange.setHours(0, 0, 0, 0);

    const endRange = new Date(targetDate);
    endRange.setDate(targetDate.getDate() + 3);
    endRange.setHours(23, 59, 59, 999);

    return scripts.filter(s => {
      const scriptDate = new Date(s.dateAdded);
      return scriptDate >= startRange && scriptDate <= endRange;
    }).sort((a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime());
  }, [scripts]);

  const handleAddScripts = (newScripts: Script[]) => {
    setScripts(prev => {
      const merged = [...newScripts, ...prev];
      const unique = merged.filter((v, i, a) => 
        a.findIndex(t => t.title === v.title && t.dateAdded === v.dateAdded) === i
      );
      return unique;
    });
  };

  const handleUpdateScript = (updatedScript: Script) => {
    // Actualizar estado local inmediatamente
    setScripts(prev => prev.map(s => s.id === updatedScript.id ? updatedScript : s));
  };

  const clearData = () => {
    if (!isAdmin) return;
    if (window.confirm('¿Eliminar toda la base de datos de este programa? Esta acción no se puede deshacer.')) {
      setScripts([]);
      localStorage.removeItem(storageKey);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Modales ubicados aquí para asegurar que estén por encima de todo el contenido */}
      <UploadModal 
        isOpen={isUploading} 
        onClose={() => setIsUploading(false)} 
        onSave={handleAddScripts}
        targetStatus="active" 
      />

      <EditScriptModal
        isOpen={!!editingScript}
        onClose={() => setEditingScript(null)}
        script={editingScript}
        onSave={handleUpdateScript}
      />

      {/* Header del Programa */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 rounded-full hover:bg-white dark:hover:bg-slate-900 shadow-sm text-slate-600 dark:text-slate-400 transition-colors">
             <ChevronLeft />
          </button>
          <div className={`p-3 rounded-3xl ${programInfo?.color || 'bg-indigo-600'} text-white shadow-lg`}>
            <Radio size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase leading-tight">{programName}</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {scripts.length} registros almacenados
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {isAdmin && (
            <>
              <button 
                onClick={() => setIsUploading(true)} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all"
              >
                <Upload size={18} /> <span>Cargar Información</span>
              </button>

              <button 
                onClick={clearData} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm font-bold transition-all" 
                title="Limpiar todo"
              >
                <Trash2 size={18} /> <span>Limpiar Datos</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Carrusel Histórico */}
      {historicScripts.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-slate-900/50 dark:to-slate-800/50 p-6 rounded-[2rem] border border-indigo-100 dark:border-slate-800">
           <ScriptCarousel scripts={historicScripts} title="Hace un año (± 3 días)" />
        </div>
      )}

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
        {filteredScripts.length > 0 ? (
          <div className="grid gap-4">
            {filteredScripts.map(script => (
              <ScriptCard 
                key={script.id} 
                script={script} 
                isAdmin={isAdmin}
                onDelete={(id) => {
                   if(isAdmin && window.confirm('¿Eliminar guion?')) {
                     setScripts(prev => prev.filter(s => s.id !== id))
                   }
                }}
                onEdit={(s) => setEditingScript(s)}
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
    </div>
  );
};