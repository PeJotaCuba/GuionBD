import React, { useState, useEffect, useMemo } from 'react';
import { Script, UserRole } from '../types';
import { ScriptCard } from './ScriptCard';
import { UploadModal } from './UploadModal';
import { EditScriptModal } from './EditScriptModal';
import { BalanceModal } from './BalanceModal';
import { PolishModal } from './PolishModal';
import { PROGRAMS } from './ProgramGrid';
import { ScriptCarousel } from './ScriptCarousel';
import { 
  Upload, Search, Radio, ChevronLeft, 
  Trash2, FileText, Plus, ClipboardList, Sparkles
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBalanceOpen, setIsBalanceOpen] = useState(false);
  const [isPolishOpen, setIsPolishOpen] = useState(false);
  const [polishInitialTerm, setPolishInitialTerm] = useState('');
  
  // Estado para el botón flotante
  const [selectionPos, setSelectionPos] = useState<{ x: number, y: number } | null>(null);
  const [tempSelection, setTempSelection] = useState('');

  const isAdmin = userRole === 'Administrador';

  const programInfo = PROGRAMS.find(p => p.name === programName);
  const fileName = programInfo?.file || `${programName.replace(/\s+/g, '_').toLowerCase()}.json`;
  const storageKey = `guionbd_data_${fileName}`;

  // Generar años disponibles dinámicamente (2022 - Año Actual)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = 2022; y <= currentYear; y++) {
      years.push(y.toString());
    }
    return years;
  }, []);

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

  // Efecto para detectar selección de texto (Mouse y Touch)
  useEffect(() => {
    if (!isAdmin) return;

    const handleSelection = () => {
      // Pequeño timeout para permitir que la selección nativa termine en móviles
      setTimeout(() => {
        const selection = window.getSelection();
        
        // Si no hay selección o es texto vacío
        if (!selection || selection.isCollapsed || !selection.toString().trim()) {
          setSelectionPos(null);
          return;
        }

        const text = selection.toString().trim();
        // Solo mostrar si se seleccionan más de 2 caracteres
        if (text.length < 2) {
          setSelectionPos(null);
          return;
        }

        try {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // Validar que el rectángulo sea visible y válido
            if (rect.width > 0 && rect.height > 0) {
              setTempSelection(text);
              
              // Ajuste para móviles: asegurar que no se salga de la pantalla
              const x = Math.max(10, Math.min(window.innerWidth - 10, rect.left + rect.width / 2));
              // Mostrar un poco más arriba para que el dedo no lo tape en touch, sumando scrollY para posición absoluta
              const y = rect.top + window.scrollY - 10;

              setSelectionPos({ x, y });
            }
        } catch (e) {
            console.error("Error obteniendo posición de selección", e);
            setSelectionPos(null);
        }
      }, 50); // Un poco más de tiempo para móviles
    };

    // Limpiar botón al hacer clic en otro lado
    const handleInteractionStart = (e: Event) => {
       const target = e.target as HTMLElement;
       if (!target.closest('#floating-polish-btn')) {
         setSelectionPos(null);
       }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection); // Soporte móvil
    document.addEventListener('keyup', handleSelection);
    
    document.addEventListener('mousedown', handleInteractionStart);
    document.addEventListener('touchstart', handleInteractionStart); // Soporte móvil

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
      document.removeEventListener('keyup', handleSelection);
      document.removeEventListener('mousedown', handleInteractionStart);
      document.removeEventListener('touchstart', handleInteractionStart);
    };
  }, [isAdmin]);

  // Filtro PRINCIPAL para la lista visual:
  const filteredScripts = useMemo(() => {
    let result = scripts;

    // Filtro estricto: Eliminar de la VISTA aquellos con datos faltantes o marcados como no especificados
    result = result.filter(s => {
      const w = (s.writer || "").trim().toUpperCase();
      const a = (s.advisor || "").trim().toUpperCase();
      const t = (s.title || "").trim().toUpperCase();
      
      const isUnspecified = 
        w === "" || w.includes("NO ESPECIFICADO") || w.includes("PECIFICADO") ||
        a === "" || a.includes("NO ESPECIFICADO") || a.includes("PECIFICADO") ||
        t === "" || t.includes("NO ESPECIFICADO");
        
      return !isUnspecified;
    });

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

  // Lógica para el carrusel "Hace un año"
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
      // Validar también en el carrusel
      const w = (s.writer || "").toUpperCase();
      const isValid = !w.includes("NO ESPECIFICADO") && !w.includes("PECIFICADO");
      
      return isValid && scriptDate >= startRange && scriptDate <= endRange;
    }).sort((a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime());
  }, [scripts]);

  // Nueva lógica de carga: Sobrescribir si existe (Fecha + Tema + Escritor)
  const handleAddScripts = (newScripts: Script[]) => {
    setScripts(prev => {
      const existingMap = new Map();
      
      // Función para generar clave única basada en Fecha (día), Tema y Escritor
      const generateKey = (s: Script) => {
        const datePart = new Date(s.dateAdded).toISOString().split('T')[0]; // YYYY-MM-DD
        const titlePart = s.title.trim().toLowerCase();
        const writerPart = (s.writer || "").trim().toLowerCase();
        return `${datePart}|${titlePart}|${writerPart}`;
      };

      // 1. Cargar existentes en el mapa
      prev.forEach(s => existingMap.set(generateKey(s), s));

      // 2. Insertar nuevos (sobrescribiendo si la clave ya existe)
      newScripts.forEach(s => {
        existingMap.set(generateKey(s), s);
      });

      // Retornar array
      return Array.from(existingMap.values());
    });
  };

  const handleSaveScript = (savedScript: Script) => {
    setScripts(prev => {
        const index = prev.findIndex(s => s.id === savedScript.id);
        if (index >= 0) {
            // Actualizar
            const updated = [...prev];
            updated[index] = savedScript;
            return updated;
        } else {
            // Crear nuevo (al principio)
            return [savedScript, ...prev];
        }
    });
  };

  // Función para Pulir (Reemplazar masivamente)
  const handlePolish = (term: string, replacement: string) => {
    // Escapar caracteres especiales para el regex
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedTerm, 'gi'); // Global, Case-insensitive

    const updatedScripts = scripts.map(s => {
      // Crear copia del script para no mutar directamente si no hay cambios
      const newS = { ...s };
      
      if (newS.title) newS.title = newS.title.replace(regex, replacement).replace(/\s+/g, ' ').trim();
      if (newS.summary) newS.summary = newS.summary.replace(regex, replacement).replace(/\s+/g, ' ').trim();
      if (newS.content) newS.content = newS.content.replace(regex, replacement); // Contenido respeta saltos de línea, no trim agresivo
      if (newS.writer) newS.writer = newS.writer.replace(regex, replacement).replace(/\s+/g, ' ').trim();
      if (newS.advisor) newS.advisor = newS.advisor.replace(regex, replacement).replace(/\s+/g, ' ').trim();
      
      return newS;
    });

    setScripts(updatedScripts);
    alert(`Proceso de pulido completado. Se han actualizado los registros que contenían "${term}".`);
  };

  const openPolishModal = () => {
    const selection = window.getSelection()?.toString();
    if (selection && selection.trim().length > 0) {
      setPolishInitialTerm(selection.trim());
    } else {
      setPolishInitialTerm('');
    }
    setIsPolishOpen(true);
  };

  // Acción del botón flotante
  const handleFloatingClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que el mousedown del document lo cierre inmediatamente
    e.preventDefault(); // Prevenir comportamientos por defecto en móviles
    setPolishInitialTerm(tempSelection);
    setIsPolishOpen(true);
    setSelectionPos(null);
    window.getSelection()?.removeAllRanges(); // Limpiar selección visual
  };

  const openNewScriptModal = () => {
    setEditingScript(null);
    setIsEditModalOpen(true);
  };

  const openEditScriptModal = (script: Script) => {
    setEditingScript(script);
    setIsEditModalOpen(true);
  };

  const clearData = () => {
    if (!isAdmin) return;
    if (window.confirm('¿Eliminar toda la base de datos de este programa? Esta acción no se puede deshacer.')) {
      setScripts([]);
      localStorage.removeItem(storageKey);
    }
  };

  return (
    <>
      <UploadModal 
        isOpen={isUploading} 
        onClose={() => setIsUploading(false)} 
        onSave={handleAddScripts}
        targetStatus="active" 
      />

      <EditScriptModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        script={editingScript}
        initialProgram={programName}
        onSave={handleSaveScript}
      />

      {isBalanceOpen && (
        <BalanceModal
          isOpen={isBalanceOpen}
          onClose={() => setIsBalanceOpen(false)}
          scripts={scripts} 
          programName={programName}
        />
      )}

      {isPolishOpen && (
        <PolishModal
          isOpen={isPolishOpen}
          onClose={() => setIsPolishOpen(false)}
          onApply={handlePolish}
          programName={programName}
          initialTerm={polishInitialTerm}
        />
      )}

      {/* Botón Flotante de Pulir */}
      {selectionPos && (
        <div 
          id="floating-polish-btn"
          style={{ 
            position: 'absolute', // Usar absolute relativo al contenedor principal o fixed con cálculo
            top: selectionPos.y, 
            left: selectionPos.x,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999 
          }}
          className="animate-fade-in"
        >
           <button 
             onClick={handleFloatingClick}
             className="bg-slate-900 text-white px-4 py-2 rounded-xl shadow-xl shadow-indigo-500/30 flex items-center gap-2 text-xs font-bold hover:bg-indigo-600 transition-all active:scale-95 border border-slate-700"
           >
              <Sparkles size={14} className="text-yellow-400" />
              Pulir
           </button>
           {/* Triangulito abajo */}
           <div className="w-2 h-2 bg-slate-900 rotate-45 absolute bottom-[-5px] left-1/2 -translate-x-1/2 -z-10 border-b border-r border-slate-700"></div>
        </div>
      )}

      <div className="space-y-8 animate-fade-in relative">
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
                {filteredScripts.length} registros visibles
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button 
              onClick={() => setIsBalanceOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm border border-slate-200 dark:border-slate-700"
            >
              <ClipboardList size={18} className="text-indigo-500" /> <span>Balance</span>
            </button>

            {isAdmin && (
              <>
                <button 
                  onClick={openNewScriptModal} 
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Plus size={18} /> <span>Nuevo</span>
                </button>

                <button 
                  onClick={() => setIsUploading(true)} 
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all"
                >
                  <Upload size={18} /> <span>Cargar</span>
                </button>

                <button 
                  onClick={openPolishModal}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-violet-500/20 transition-all"
                  title="Pulir base de datos (Reemplazar texto)"
                >
                  <Sparkles size={18} /> <span>Pulir</span>
                </button>

                <button 
                  onClick={clearData} 
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm font-bold transition-all" 
                  title="Limpiar todo"
                >
                  <Trash2 size={18} />
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
              {availableYears.map(year => (
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
                  onEdit={openEditScriptModal}
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
    </>
  );
};