import { useState, useEffect, useMemo } from 'react';
import { Script, ScriptStatus } from './types';
import { ScriptCard } from './components/ScriptCard';
import { StatsView } from './components/StatsView';
import { UploadModal } from './components/UploadModal';
import { ScriptCarousel } from './components/ScriptCarousel';
import { 
  Upload, Search, FileStack, 
  Moon, Sun, FilePlus, 
  RefreshCw, ChevronDown, Radio, X,
  Download, Trash2
} from 'lucide-react';
import { guionBase } from './guionbase';

export default function App() {
  const [activeTab, setActiveTab] = useState<'active' | 'inactive' | 'reports'>('active');
  const [scripts, setScripts] = useState<Script[]>([]);
  const [uploadTarget, setUploadTarget] = useState<ScriptStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Estado para programas expandidos
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({});

  // Cargar datos
  useEffect(() => {
    const saved = localStorage.getItem('guionbd_data');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        setScripts(parsedData);
      } catch (e) {
        console.error("Error cargando caché, usando datos base", e);
        setScripts(guionBase);
      }
    } else {
      setScripts(guionBase);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('guionbd_data', JSON.stringify(scripts));
    }
  }, [scripts, isLoaded]);

  // --- Lógica de Normalización ---
  const normalizeText = (text: string) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  // Función específica para normalizar nombres de programas (ignora puntuación para agrupar)
  const normalizeProgramName = (name: string) => {
    // Primero eliminamos contenido entre paréntesis, ej: "Leyendo y Cantando (A)" -> "Leyendo y Cantando"
    const cleanName = name.replace(/\s*\(.*?\)/g, "");
    
    return cleanName
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
      .replace(/[.,;:\-]/g, "") // Quitar puntuación
      .replace(/\s+/g, " ") // Colapsar espacios
      .trim()
      .toUpperCase();
  };

  const filteredScripts = useMemo<Script[]>(() => {
    const normalizedQuery = normalizeText(searchQuery);
    const searchTerms = normalizedQuery.trim().split(/\s+/).filter(Boolean);

    return scripts.filter(script => {
      if (activeTab !== 'reports' && script.status !== activeTab) return false;
      if (searchTerms.length === 0) return true;

      const searchableText = normalizeText(`
        ${script.title} 
        ${script.genre} 
        ${script.themes.join(' ')} 
        ${script.summary}
      `);

      return searchTerms.every(term => searchableText.includes(term));
    });
  }, [scripts, activeTab, searchQuery]);

  // Agrupar por Programa Normalizado
  const groupedScripts = useMemo(() => {
    const groups: Record<string, { displayName: string, scripts: Script[] }> = {};
    
    filteredScripts.forEach(script => {
      const normalizedKey = normalizeProgramName(script.genre);
      
      if (!groups[normalizedKey]) {
        // Usamos el nombre original limpio (sin paréntesis) o formateado como el "nombre para mostrar"
        const display = script.genre.replace(/\s*\(.*?\)/g, "").trim().toUpperCase();
        
        groups[normalizedKey] = { 
          displayName: display, 
          scripts: [] 
        };
      }
      groups[normalizedKey].scripts.push(script);
    });

    // Ordenar scripts por fecha dentro de cada grupo
    Object.values(groups).forEach(group => {
        group.scripts.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
    });
    
    return groups;
  }, [filteredScripts]);

  const carouselScripts = useMemo<Script[]>(() => {
    if (activeTab === 'reports') return [];
    
    const today = new Date();
    const targetYear = today.getFullYear() - 1;
    
    // Generar un Set con las fechas objetivo (Mes-Día) para búsqueda rápida
    // Rango: Hoy - 2 días ... Hoy + 2 días
    const targetDateStrings = new Set<string>();
    
    for (let i = -2; i <= 2; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        // Formato "M-D" (e.g., "0-28" para Enero 28)
        targetDateStrings.add(`${d.getMonth()}-${d.getDate()}`);
    }

    return scripts.filter(s => {
       try {
         const d = new Date(s.dateAdded);
         
         // 1. Debe ser del año pasado
         if (d.getFullYear() !== targetYear) return false;

         // 2. Debe estar en el rango de +/- 2 días
         const dateString = `${d.getMonth()}-${d.getDate()}`;
         return targetDateStrings.has(dateString);
         
       } catch (e) { return false; }
    }).sort((a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime()); // Ordenar cronológicamente
  }, [scripts, activeTab]);

  const handleAddScripts = (newScripts: Script[]) => {
    setScripts(prev => {
      const updatedList = [...prev];

      newScripts.forEach(newScript => {
        // Normalizamos los datos clave para determinar si es el mismo guion:
        // 1. Fecha (YYYY-MM-DD)
        // 2. Programa (Normalizado)
        // 3. Título/Tema (Texto normalizado)
        
        const newDate = new Date(newScript.dateAdded).toISOString().split('T')[0];
        const newProgram = normalizeProgramName(newScript.genre);
        const newTitle = normalizeText(newScript.title);

        const existingIndex = updatedList.findIndex(existing => {
          const existingDate = new Date(existing.dateAdded).toISOString().split('T')[0];
          const existingProgram = normalizeProgramName(existing.genre);
          const existingTitle = normalizeText(existing.title);

          return existingProgram === newProgram && 
                 existingDate === newDate && 
                 existingTitle === newTitle;
        });

        if (existingIndex !== -1) {
          // Si existe, SOBRESCRIBIMOS los datos.
          // Mantenemos el ID original para consistencia interna si fuera necesario, 
          // pero actualizamos todo el contenido.
          updatedList[existingIndex] = { ...newScript, id: updatedList[existingIndex].id };
        } else {
          // Si no existe, lo agregamos al principio como nuevo.
          updatedList.unshift(newScript);
        }
      });

      return updatedList;
    });

    if (uploadTarget) {
        setActiveTab(uploadTarget === 'active' ? 'active' : 'inactive');
    }
  };

  const toggleStatus = (id: string) => {
    setScripts(prev => prev.map(s => 
      s.id === id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s
    ));
  };

  const deleteScript = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      setScripts(prev => prev.filter(s => s.id !== id));
    }
  };

  const clearDatabase = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar TODOS los guiones cargados (activos e inactivos)? Esta acción no se puede deshacer.')) {
      setScripts([]);
    }
  };

  const downloadDatabase = () => {
    const dataStr = JSON.stringify(scripts, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "biblio.json"; // Nombre exacto para GitHub
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateFromGithub = async () => {
    const confirmUpdate = window.confirm("Se descargarán los datos de 'biblio.json' desde GitHub y se combinarán con tu base de datos local. ¿Continuar?");
    if (!confirmUpdate) return;

    try {
      // Usar una timestamp para evitar caché del navegador
      const response = await fetch(`https://raw.githubusercontent.com/PeJotaCuba/GuionBD/refs/heads/main/biblio.json?t=${new Date().getTime()}`);
      if (!response.ok) throw new Error('Error al conectar con GitHub');
      
      const data = await response.json() as unknown;
      
      if (Array.isArray(data)) {
        const remoteScripts = data as Script[];
        
        setScripts(prevScripts => {
            const scriptMap = new Map(prevScripts.map(s => [s.id, s]));
            let newCount = 0;
            let updateCount = 0;

            remoteScripts.forEach(remoteScript => {
                if (scriptMap.has(remoteScript.id)) {
                    scriptMap.set(remoteScript.id, remoteScript);
                    updateCount++;
                } else {
                    scriptMap.set(remoteScript.id, remoteScript);
                    newCount++;
                }
            });
            
            const mergedScripts = Array.from(scriptMap.values());
            alert(`Sincronización exitosa.\nNuevos: ${newCount}\nActualizados: ${updateCount}`);
            return mergedScripts;
        });

      } else {
        throw new Error('Formato de datos inválido en GitHub');
      }
    } catch (error) {
      console.error(error);
      alert('Error al actualizar: No se pudo leer el archivo biblio.json del repositorio.');
    }
  };

  const toggleProgramGroup = (key: string) => {
    setExpandedPrograms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'dark:bg-slate-950' : 'bg-slate-50'}`}>
      
      {/* Navbar Moderno con Backdrop Blur */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                <FileStack className="text-white h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight leading-none block">GuionBD</span>
                <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none">Gestor</span>
              </div>
            </div>
            
            {/* Acciones */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={updateFromGithub}
                className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800/50 rounded-lg transition-all"
                title="Sincronizar desde GitHub"
              >
                <RefreshCw size={20} />
              </button>

              <button 
                onClick={downloadDatabase}
                className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800/50 rounded-lg transition-all"
                title="Guardar copia local (biblio.json)"
              >
                <Download size={20} />
              </button>

              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title={darkMode ? "Modo Claro" : "Modo Oscuro"}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <button 
                onClick={clearDatabase}
                className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-slate-800/50 rounded-lg transition-all"
                title="Eliminar todos los datos"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Encabezado y Acciones Principales */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {activeTab === 'active' ? 'En Emisión' : activeTab === 'inactive' ? 'Archivo Histórico' : 'Centro de Informes'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Gestionando <span className="font-semibold text-indigo-600 dark:text-indigo-400">{scripts.length}</span> guiones en total
              </p>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
               <button 
                  onClick={() => setUploadTarget('active')} 
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
               >
                  <FilePlus size={18} /> <span>Cargar Activos</span>
               </button>
               <button 
                  onClick={() => setUploadTarget('inactive')} 
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm active:scale-95 transition-all"
               >
                  <Upload size={18} /> <span>Cargar Inactivos</span>
               </button>
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Tabs Estilizados */}
            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl md:w-auto w-full">
              {[
                { id: 'active', label: 'Activos' },
                { id: 'inactive', label: 'Inactivos' },
                { id: 'reports', label: 'Informes' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 md:w-32 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    activeTab === tab.id 
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm ring-1 ring-black/5' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Búsqueda */}
            {activeTab !== 'reports' && (
              <div className="relative flex-grow group">
                <Search size={20} className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Buscar por programa, tema o fecha..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Área de Contenido */}
        {activeTab === 'reports' ? (
          <StatsView scripts={scripts} />
        ) : (
          <div className="pb-20 space-y-8">
            
            {/* Carrusel (Efemérides) */}
            {carouselScripts.length > 0 && (
                <ScriptCarousel scripts={carouselScripts} title="Hace un año (± 2 días)" />
            )}

            {/* Lista Agrupada (Acordeón) */}
            {Object.keys(groupedScripts).length > 0 ? (
              <div className="grid gap-4">
                 {Object.entries(groupedScripts).map(([key, group]) => {
                   const isExpanded = expandedPrograms[key] || searchQuery.length > 0;
                   
                   return (
                     <div key={key} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                        <button 
                          onClick={() => toggleProgramGroup(key)}
                          className={`w-full px-5 py-4 flex items-center justify-between transition-colors text-left ${
                            isExpanded ? 'bg-indigo-50/50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                             <div className={`p-2.5 rounded-full transition-colors ${
                               isExpanded ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                             }`}>
                                <Radio size={20} />
                             </div>
                             <div>
                               <h3 className="font-bold text-slate-900 dark:text-white text-base md:text-lg tracking-tight">
                                 {group.displayName}
                               </h3>
                               <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                 {group.scripts.length} {group.scripts.length === 1 ? 'guion' : 'guiones'}
                               </p>
                             </div>
                          </div>
                          <div className={`p-1 rounded-full transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-indigo-100/50 dark:bg-slate-700' : ''}`}>
                             <ChevronDown size={20} className={isExpanded ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                          </div>
                        </button>
                        
                        {/* Contenido del Acordeón con animación suave */}
                        <div 
                          className={`grid transition-all duration-300 ease-in-out ${
                            isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
                              {group.scripts.map(script => (
                                <ScriptCard 
                                  key={script.id} 
                                  script={script} 
                                  onToggleStatus={toggleStatus}
                                  onDelete={deleteScript}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                     </div>
                   );
                 })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
                   <Search size={32} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                  No se encontraron resultados
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
                  {scripts.length === 0 ? "Tu base de datos está vacía. Intenta cargar un archivo o sincronizar desde GitHub." : "Intenta ajustar tu búsqueda con otros términos."}
                </p>
                {scripts.length === 0 && (
                   <button onClick={updateFromGithub} className="mt-6 text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:underline decoration-2 underline-offset-4">
                      Sincronizar ahora
                   </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <UploadModal 
        isOpen={!!uploadTarget} 
        onClose={() => setUploadTarget(null)} 
        onSave={handleAddScripts}
        targetStatus={uploadTarget || 'active'} 
      />
    </div>
  );
}