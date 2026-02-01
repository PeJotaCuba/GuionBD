import React, { useState, useMemo, useRef } from 'react';
import { Search, Radio, Music, BookOpen, Users, Leaf, Newspaper, Home, Activity, Palette, Upload, Loader2, FileText } from 'lucide-react';
import { User, Script } from '../types';
import { parseScriptsFromText } from '../services/parserService';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const globalUploadRef = useRef<HTMLInputElement>(null);

  // Normalización para comparación flexible de nombres
  const normalize = (str: string) => 
    str.normalize("NFD")
       .replace(/[\u0300-\u036f]/g, "")
       .replace(/[^\w\s]/gi, '')
       .toUpperCase()
       .trim();

  const getProgramScripts = (prog: typeof PROGRAMS[0]): Script[] => {
    const key = `guionbd_data_${prog.file}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  };

  const filteredPrograms = useMemo(() => {
    let allowed = PROGRAMS;
    if (currentUser.role === 'Guionista' && currentUser.allowedPrograms) {
      allowed = PROGRAMS.filter(p => currentUser.allowedPrograms?.includes(p.name));
    }

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
  }, [searchQuery, currentUser]);

  const handleGlobalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const text = await file.text();
      const allParsedScripts = parseScriptsFromText(text, 'active');
      
      if (allParsedScripts.length === 0) {
        alert("No se encontraron registros válidos. Verifica que el archivo use >>> como separador.");
        return;
      }

      const groupedByProgram: Record<string, Script[]> = {};
      let ignoredCount = 0;

      allParsedScripts.forEach(script => {
        const scriptProgNorm = normalize(script.genre);
        const matchedProg = PROGRAMS.find(p => {
          const pNorm = normalize(p.name);
          return pNorm === scriptProgNorm || scriptProgNorm.includes(pNorm) || pNorm.includes(scriptProgNorm);
        });

        if (matchedProg) {
          const progFile = matchedProg.file;
          if (!groupedByProgram[progFile]) groupedByProgram[progFile] = [];
          // Actualizamos el género al nombre oficial del programa
          script.genre = matchedProg.name;
          groupedByProgram[progFile].push(script);
        } else {
          ignoredCount++;
        }
      });

      let totalSaved = 0;
      Object.entries(groupedByProgram).forEach(([file, newScripts]) => {
        const key = `guionbd_data_${file}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const merged = [...newScripts, ...existing];
        const unique = merged.filter((v, i, a) => 
          a.findIndex(t => t.title === v.title && t.dateAdded === v.dateAdded) === i
        );

        localStorage.setItem(key, JSON.stringify(unique));
        totalSaved += newScripts.length;
      });

      alert(`Proceso completado:\n- ${totalSaved} guiones cargados.\n- ${ignoredCount} registros ignorados (programas no registrados).`);
      window.location.reload();
    } catch (error) {
      alert("Error al procesar el archivo masivo.");
    } finally {
      setIsProcessing(false);
      if (globalUploadRef.current) globalUploadRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Programas de Radio</h2>
        <p className="text-slate-500 dark:text-slate-400">Búsqueda avanzada por programa, fecha, tema o personal.</p>
        
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
          <div className="relative group flex-grow max-w-md w-full">
            <Search size={20} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Ej: Juan Pérez, 2026, Medioambiente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
            />
          </div>

          {currentUser.role === 'Administrador' && (
            <div className="shrink-0">
              <button 
                onClick={() => globalUploadRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
              >
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                <span>Carga Global</span>
              </button>
              <input type="file" ref={globalUploadRef} className="hidden" accept=".txt" onChange={handleGlobalUpload} />
            </div>
          )}
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
    </div>
  );
};