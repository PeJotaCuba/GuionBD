import { useState, useEffect, useMemo, useRef } from 'react';
import { Script, ScriptStatus } from './types';
import { ScriptCard } from './components/ScriptCard';
import { StatsView } from './components/StatsView';
import { UploadModal } from './components/UploadModal';
import { ScriptCarousel } from './components/ScriptCarousel';
import { 
  Upload, Search, FileStack, 
  Settings, Moon, Sun, FilePlus, Database,
  RefreshCw, ChevronDown, ChevronUp, Radio
} from 'lucide-react';
// CORRECCIÓN: Usamos el archivo .ts en lugar del .json para evitar errores de resolución
import { guionBase } from './guionbase';

export default function App() {
  const [activeTab, setActiveTab] = useState<'active' | 'inactive' | 'reports'>('active');
  const [scripts, setScripts] = useState<Script[]>([]);
  const [uploadTarget, setUploadTarget] = useState<ScriptStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  
  // Estado para programas expandidos (Acordeón)
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({});

  // Estado para el menú de ajustes
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Cargar datos iniciales
  useEffect(() => {
    // Intentar cargar desde localStorage
    const saved = localStorage.getItem('guionbd_data');
    if (saved) {
      try {
        setScripts(JSON.parse(saved));
      } catch (e) {
        console.error("Error cargando caché, usando datos base", e);
        setScripts(guionBase);
      }
    } else {
      // Si no hay localStorage, usar los datos base del archivo .ts
      setScripts(guionBase);
    }
  }, []);

  // Guardar en localStorage cuando cambian los scripts
  useEffect(() => {
    if (scripts.length > 0) {
      localStorage.setItem('guionbd_data', JSON.stringify(scripts));
    }
  }, [scripts]);

  // Cerrar menú de ajustes al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Normalización de texto para búsqueda flexible (quita acentos y hace minúsculas)
  const normalizeText = (text: string) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  // Búsqueda flexible (tokenizada y normalizada)
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

      // Todas las palabras buscadas deben estar presentes
      return searchTerms.every(term => searchableText.includes(term));
    });
  }, [scripts, activeTab, searchQuery]);

  // Agrupar por Programa (Genre) para el Acordeón
  const groupedScripts = useMemo<Record<string, Script[]>>(() => {
    const groups: Record<string, Script[]> = {};
    filteredScripts.forEach(script => {
      if (!groups[script.genre]) {
        groups[script.genre] = [];
      }
      groups[script.genre].push(script);
    });
    // Ordenar scripts por fecha dentro de cada grupo
    Object.keys(groups).forEach(key => {
        groups[key].sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
    });
    return groups;
  }, [filteredScripts]);

  // Filter scripts for carousel (One year ago)
  const carouselScripts = useMemo<Script[]>(() => {
    if (activeTab === 'reports') return [];
    
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;

    return scripts.filter(s => {
       try {
         const scriptYear = new Date(s.dateAdded).getFullYear();
         return s.status === activeTab && scriptYear === prevYear;
       } catch (e) {
         return false;
       }
    });
  }, [scripts, activeTab]);

  const handleAddScripts = (newScripts: Script[]) => {
    setScripts(prev => [...newScripts, ...prev]);
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

  const downloadDatabase = () => {
    const dataStr = JSON.stringify(scripts, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "biblio.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowSettings(false);
  };

  // Función para actualizar desde GitHub
  const updateFromGithub = async () => {
    const confirmUpdate = window.confirm("Esto descargará la última versión de biblio.json desde GitHub y actualizará tu base de datos local. ¿Continuar?");
    if (!confirmUpdate) return;

    try {
      // Nota: Seguimos apuntando a biblio.json en el repo remoto, ya que es la fuente de verdad esperada
      const response = await fetch('https://raw.githubusercontent.com/PeJotaCuba/GuionBD/refs/heads/main/biblio.json');
      if (!response.ok) throw new Error('Error al conectar con GitHub');
      
      const data = await response.json() as unknown;
      
      if (Array.isArray(data)) {
        const validScripts = data as Script[];
        setScripts(validScripts);
        alert(`Base de datos actualizada con éxito. ${validScripts.length} registros cargados.`);
      } else {
        throw new Error('Formato de datos inválido en GitHub');
      }
    } catch (error) {
      console.error(error);
      alert('Error al actualizar: No se pudo conectar o el archivo está dañado.');
    } finally {
        setShowSettings(false);
    }
  };

  const toggleProgramGroup = (programName: string) => {
    setExpandedPrograms(prev => ({
      ...prev,
      [programName]: !prev[programName]
    }));
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark:bg-slate-950' : 'bg-slate-50'}`}>
      
      {/* Navbar Compacta Mobile-First */}
      <nav className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <FileStack className="text-white h-4 w-4" />
              </div>
              <span className="font-bold text-lg text-slate-800 dark:text-white tracking-tight">GuionBD</span>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={updateFromGithub}
                className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-slate-800 rounded-full transition-colors hidden sm:block"
                title="Sincronizar BD desde GitHub"
              >
                <RefreshCw size={18} />
              </button>

              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              <div className="relative" ref={settingsRef}>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                >
                  <Settings size={18} />
                </button>

                {showSettings && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50 animate-fade-in">
                    <button 
                      onClick={updateFromGithub}
                      className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 sm:hidden"
                    >
                      <RefreshCw size={16} className="text-green-500" />
                      <div>
                        <span className="font-medium block">Sincronizar BD</span>
                        <span className="text-[10px] text-slate-400">Desde Github (biblio.json)</span>
                      </div>
                    </button>
                    <button 
                      onClick={downloadDatabase}
                      className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3"
                    >
                      <Database size={16} className="text-indigo-500" />
                      <div>
                        <span className="font-medium block">Guardar copia local</span>
                        <span className="text-[10px] text-slate-400">Descargar biblio.json</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        
        {/* Mobile-First Header */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {activeTab === 'active' ? 'En Emisión' : activeTab === 'inactive' ? 'Archivados' : 'Informes'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {scripts.length} registros totales
              </p>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
               <button onClick={() => setUploadTarget('active')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm active:scale-95 transition-transform">
                  <FilePlus size={16} /> <span className="sm:hidden">Cargar</span> <span className="hidden sm:inline">Cargar Activos</span>
               </button>
               <button onClick={() => setUploadTarget('inactive')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium shadow-sm active:scale-95 transition-transform">
                  <Upload size={16} /> <span className="sm:hidden">Archivar</span> <span className="hidden sm:inline">Cargar Inactivos</span>
               </button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3">
            {/* Tabs */}
            <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-lg">
              <button onClick={() => setActiveTab('active')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'active' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500'}`}>Activos</button>
              <button onClick={() => setActiveTab('inactive')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'inactive' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500'}`}>Inactivos</button>
              <button onClick={() => setActiveTab('reports')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'reports' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500'}`}>Informes</button>
            </div>

            {/* Flexible Search */}
            {activeTab !== 'reports' && (
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar programa, tema o fecha..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'reports' ? (
          <StatsView scripts={scripts} />
        ) : (
          <div className="pb-20 space-y-6">
            
            {/* Carousel (Only shows if there are scripts from 1 year ago) */}
            {carouselScripts.length > 0 && (
                <ScriptCarousel scripts={carouselScripts} title="Hace un Año" />
            )}

            {/* List Grouped by Program (Acordeón Restaurado) */}
            {Object.keys(groupedScripts).length > 0 ? (
              <div className="space-y-3">
                 {Object.entries(groupedScripts).map(([programName, programScripts]: [string, Script[]]) => {
                   const isExpanded = expandedPrograms[programName] || searchQuery.length > 0; // Auto expand on search
                   
                   return (
                     <div key={programName} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm transition-all">
                        <button 
                          onClick={() => toggleProgramGroup(programName)}
                          className="w-full px-4 py-3 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                             <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full text-indigo-600 dark:text-indigo-400">
                                <Radio size={18} />
                             </div>
                             <div>
                               <h3 className="font-bold text-slate-800 dark:text-white text-sm sm:text-base">{programName}</h3>
                               <p className="text-xs text-slate-500">{programScripts.length} guiones</p>
                             </div>
                          </div>
                          {isExpanded ? <ChevronUp size={18} className="text-slate-400"/> : <ChevronDown size={18} className="text-slate-400"/>}
                        </button>
                        
                        {isExpanded && (
                          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {programScripts.map(script => (
                              <ScriptCard 
                                key={script.id} 
                                script={script} 
                                onToggleStatus={toggleStatus}
                                onDelete={deleteScript}
                              />
                            ))}
                          </div>
                        )}
                     </div>
                   );
                 })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-3">
                   <Search size={24} className="text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {scripts.length === 0 ? "No hay guiones cargados." : "No se encontraron coincidencias."}
                </p>
                {scripts.length === 0 && (
                   <button onClick={updateFromGithub} className="mt-4 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
                      Cargar desde GitHub
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