import React, { useState, useMemo, useRef } from 'react';
import { Search, Radio, Music, BookOpen, Users, Leaf, Newspaper, Home, Activity, Palette, Upload, RefreshCw, Database, FileText, X } from 'lucide-react';
import { User, Script } from '../types';
import { parseRawEntry } from '../services/parserService';
import { StatsView } from './StatsView';
import { LoadingOverlay } from './LoadingOverlay';

export const PROGRAMS = [
  { name: "BUENOS DÍAS BAYAMO", file: "bdias.json", color: "bg-amber-500", icon: <Activity size={32} /> },
  { name: "TODOS EN CASA", file: "casa.json", color: "bg-indigo-500", icon: <Home size={32} /> },
  { name: "RCM NOTICIAS", file: "noticias.json", color: "bg-red-600", icon: <Newspaper size={32} /> },
  { name: "ARTE BAYAMO", file: "arte.json", color: "bg-teal-500", icon: <Palette size={32} /> },
  { name: "PARADA JOVEN", file: "joven.json", color: "bg-cyan-500", icon: <Radio size={32} /> },
  { name: "HABLANDO CON JUANA", file: "juana.json", color: "bg-rose-500", icon: <Users size={32} /> },
  { name: "SIGUE A TU RITMO", file: "ritmo.json", color: "bg-orange-500", icon: <Music size={32} /> },
  { name: "AL SON DE LA RADIO", file: "son.json", color: "bg-violet-500", icon: <Music size={32} /> },
  { name: "CÓMPLICES", file: "complices.json", color: "bg-pink-500", icon: <Users size={32} /> },
  { name: "ESTACIÓN 95.3", file: "estacion.json", color: "bg-blue-600", icon: <Radio size={32} /> },
  { name: "PALCO DE DOMINGO", file: "domingo.json", color: "bg-fuchsia-500", icon: <BookOpen size={32} /> },
  { name: "COLOREANDO MELODÍAS", file: "melodias.json", color: "bg-lime-500", icon: <Palette size={32} /> },
  { name: "ALBA Y CRISOL", file: "alba.json", color: "bg-emerald-500", icon: <Leaf size={32} /> },
  { name: "DESDE EL BARRIO", file: "barrio.json", color: "bg-slate-600", icon: <Home size={32} /> },
  { name: "MÚSICA DESDE MI CIUDAD", file: "musica.json", color: "bg-indigo-600", icon: <Music size={32} /> },
];

interface ProgramGridProps {
  onSelectProgram: (name: string) => void;
  currentUser: User;
}

export const ProgramGrid: React.FC<ProgramGridProps> = ({ onSelectProgram, currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processMessage, setProcessMessage] = useState("");
  const globalUploadRef = useRef<HTMLInputElement>(null);

  // Normalización mejorada: reemplaza puntuación por espacios y colapsa espacios
  const normalize = (str: string) => 
    str.normalize("NFD")
       .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
       .replace(/[^\w\s]/gi, ' ')      // Cambiar puntuación por espacio
       .replace(/\s+/g, ' ')           // Quitar espacios múltiples
       .trim()
       .toUpperCase();

  const getProgramScripts = (prog: typeof PROGRAMS[0]): Script[] => {
    const key = `guionbd_data_${prog.file}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  };

  // Determinar los programas disponibles para el usuario actual (para Informes y Filtrado)
  const availablePrograms = useMemo(() => {
    if (currentUser.role === 'Guionista' && currentUser.allowedPrograms) {
      return PROGRAMS.filter(p => currentUser.allowedPrograms?.includes(p.name));
    }
    return PROGRAMS;
  }, [currentUser]);

  const filteredPrograms = useMemo(() => {
    let allowed = availablePrograms;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return allowed;

    return allowed.filter(p => {
      if (p.name.toLowerCase().includes(q)) return true;
      const scripts = getProgramScripts(p);
      return scripts.some(s => 
        s.title.toLowerCase().includes(q) || 
        s.dateAdded.includes(q) ||
        s.writer?.toLowerCase().includes(q) ||
        s.advisor?.toLowerCase().includes(q) ||
        s.themes.some(t => t.toLowerCase().includes(q)) ||
        new Date(s.dateAdded).toLocaleDateString('es-ES').includes(q)
      );
    });
  }, [searchQuery, availablePrograms]);

  const handleGlobalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessMessage("Leyendo archivo...");
    setLoadingProgress(0);

    try {
      const text = await file.text();
      // Dividir por separador
      const rawEntries = text.split(/_{4,}/);
      const total = rawEntries.length;
      const parsedScripts: Script[] = [];

      setProcessMessage("Analizando guiones...");
      
      // Procesar en chunks para actualizar la UI
      const chunkSize = 20;
      for (let i = 0; i < total; i += chunkSize) {
        const chunk = rawEntries.slice(i, i + chunkSize);
        chunk.forEach(raw => {
          const script = parseRawEntry(raw, 'active');
          if (script) parsedScripts.push(script);
        });
        
        // Actualizar progreso
        setLoadingProgress(Math.round(((i + chunkSize) / total) * 100));
        // Permitir que el navegador renderice
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      if (parsedScripts.length === 0) {
        alert("No se encontraron registros válidos. Verifica que el archivo use '____' como separador.");
        return;
      }

      setProcessMessage("Guardando en base de datos...");
      distributeScripts(parsedScripts);
      
      setProcessMessage("¡Completado!");
      setLoadingProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500)); // Breve pausa para ver el 100%
      
      alert("Carga global completada. Se han actualizado/añadido los registros.");
      window.location.reload();
    } catch (error) {
      alert("Error al procesar el archivo masivo.");
    } finally {
      setIsProcessing(false);
      if (globalUploadRef.current) globalUploadRef.current.value = '';
    }
  };

  const handleRemoteUpdate = async () => {
    setIsProcessing(true);
    setProcessMessage("Descargando datos...");
    try {
      const response = await fetch('https://raw.githubusercontent.com/PeJotaCuba/GuionBD/refs/heads/main/global.json');
      if (!response.ok) throw new Error('Error al descargar la base de datos global');
      
      const allScripts: Script[] = await response.json();
      if (!Array.isArray(allScripts)) throw new Error('Formato inválido de JSON');

      setProcessMessage("Actualizando registros...");
      distributeScripts(allScripts);
      alert("Base de datos actualizada y sincronizada correctamente.");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert(`Error al actualizar: ${error instanceof Error ? error.message : 'Desconocido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Función mejorada para distribuir y sobrescribir datos
  const distributeScripts = (newScripts: Script[]) => {
      // 1. Agrupar los NUEVOS scripts por archivo de programa
      const groupedByProgram: Record<string, Script[]> = {};

      newScripts.forEach(script => {
        const scriptProgNorm = normalize(script.genre);
        
        // Búsqueda de coincidencia flexible para encontrar a qué programa pertenece
        const matchedProg = PROGRAMS.find(p => {
          const pNorm = normalize(p.name);
          if (pNorm === scriptProgNorm) return true;
          if (scriptProgNorm.length > 3 && pNorm.includes(scriptProgNorm)) return true;
          if (pNorm.length > 3 && scriptProgNorm.includes(pNorm)) return true;
          const initials = pNorm.split(' ').map(w => w[0]).join('');
          if (scriptProgNorm === initials) return true;
          return false;
        });

        if (matchedProg) {
          const progFile = matchedProg.file;
          if (!groupedByProgram[progFile]) groupedByProgram[progFile] = [];
          
          // Normalizar el nombre del programa en el script para consistencia
          script.genre = matchedProg.name;
          groupedByProgram[progFile].push(script);
        }
      });

      // 2. Procesar cada archivo de programa: Cargar, Merge (sobrescribir), Guardar
      Object.entries(groupedByProgram).forEach(([file, incomingScripts]) => {
        const key = `guionbd_data_${file}`;
        const existing: Script[] = JSON.parse(localStorage.getItem(key) || '[]');
        
        // Usar un Map para hacer el merge. La clave será una combinación de fecha, título y escritor.
        // Si la clave ya existe, el script INCOMING sobrescribe al EXISTING.
        const mergedMap = new Map<string, Script>();

        const generateKey = (s: Script) => {
             // Clave compuesta: Fecha(YYYY-MM-DD) + Titulo(Norm) + Escritor(Norm)
             const d = new Date(s.dateAdded).toISOString().split('T')[0];
             const t = normalize(s.title);
             const w = normalize(s.writer || "");
             return `${d}|${t}|${w}`;
        };

        // Primero cargamos los existentes
        existing.forEach(s => mergedMap.set(generateKey(s), s));

        // Luego cargamos los nuevos (sobrescribiendo si hay colisión de clave)
        // Esto garantiza que la información del JSON/TXT nuevo actualice a la vieja.
        incomingScripts.forEach(s => mergedMap.set(generateKey(s), s));

        // Convertir de nuevo a array
        const mergedArray = Array.from(mergedMap.values());

        localStorage.setItem(key, JSON.stringify(mergedArray));
      });
  };

  const handleDownloadDatabase = () => {
    const allData: any[] = [];
    PROGRAMS.forEach(prog => {
       const key = `guionbd_data_${prog.file}`;
       const data: Script[] = JSON.parse(localStorage.getItem(key) || '[]');
       allData.push(...data);
    });

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "global.json";
    link.click();
  };

  if (showStats) {
    return (
      <div className="animate-fade-in relative min-h-screen">
        <button 
          onClick={() => setShowStats(false)}
          className="absolute top-0 left-0 flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold mb-4 z-10"
        >
          <X size={20} /> Cerrar Informes
        </button>
        <div className="pt-10">
           <StatsView programs={availablePrograms} onClose={() => setShowStats(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <LoadingOverlay isVisible={isProcessing} progress={loadingProgress} message={processMessage} />

      <div className="text-center max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Programas de Radio</h2>
          <p className="text-slate-500 dark:text-slate-400">Búsqueda avanzada por programa, fecha, tema o personal.</p>
        </div>
        
        <div className="flex flex-col gap-6 items-center justify-center w-full">
          {/* Fila del Buscador */}
          <div className="relative group w-full max-w-xl">
            <Search size={20} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Ej: Juan Pérez, 2026, Medioambiente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
            />
          </div>

          {/* Fila de Botones */}
          <div className="flex flex-wrap gap-3 justify-center">
            <button
               onClick={handleRemoteUpdate}
               disabled={isProcessing}
               className="flex items-center gap-2 px-5 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm disabled:opacity-50"
               title="Actualizar datos desde servidor"
            >
               <RefreshCw size={18} className={isProcessing ? "animate-spin" : ""} />
               <span className="hidden sm:inline text-sm font-bold">Actualizar</span>
            </button>

            {['Administrador', 'Director', 'Asesor', 'Guionista'].includes(currentUser.role) && (
              <button
                onClick={() => setShowStats(true)}
                className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-5 py-3.5 rounded-2xl text-sm font-bold shadow-sm transition-all"
                title="Ver Informes Globales"
              >
                <FileText size={18} />
                <span className="hidden sm:inline">Informes</span>
              </button>
            )}

            {currentUser.role === 'Administrador' && (
              <>
                <button
                  onClick={handleDownloadDatabase}
                  className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-5 py-3.5 rounded-2xl text-sm font-bold shadow-sm transition-all"
                  title="Descargar base de datos completa"
                >
                  <Database size={18} />
                  <span className="hidden sm:inline">BD Global</span>
                </button>

                <div className="shrink-0 relative">
                  <button 
                    onClick={() => globalUploadRef.current?.click()}
                    disabled={isProcessing}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 h-full"
                  >
                    <Upload size={18} />
                    <span className="hidden sm:inline">Carga Global</span>
                  </button>
                  <input type="file" ref={globalUploadRef} className="hidden" accept=".txt" onChange={handleGlobalUpload} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {filteredPrograms.map((program) => {
          const scriptCount = getProgramScripts(program).length;
          return (
            <button
              key={program.name}
              onClick={() => onSelectProgram(program.name)}
              className="group relative flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-400 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`p-4 rounded-2xl ${program.color} text-white shadow-lg group-hover:scale-110 transition-transform mb-3`}>
                {program.icon}
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 text-center uppercase tracking-tight line-clamp-2">
                {program.name}
              </span>
              <span className="mt-1 text-[10px] font-black text-slate-400 dark:text-slate-500">
                {scriptCount} REGISTROS
              </span>
            </button>
          );
        })}
      </div>

      {filteredPrograms.length === 0 && (
        <div className="text-center py-20 bg-slate-100/50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
           <Search size={48} className="mx-auto mb-4 text-slate-300" />
           <p className="text-slate-500 font-medium">No se encontraron programas o guiones con los términos buscados.</p>
        </div>
      )}
    </div>
  );
};