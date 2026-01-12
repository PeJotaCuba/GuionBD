import React, { useState, useEffect, useMemo } from 'react';
import { Script, ScriptStatus } from './types';
import { ScriptCard } from './components/ScriptCard';
import { StatsView } from './components/StatsView';
import { UploadModal } from './components/UploadModal';
import { ScriptCarousel } from './components/ScriptCarousel';
import { 
  Upload, Search, LayoutGrid, FileStack, BarChart3, 
  Settings, Moon, Sun, Filter, FilePlus 
} from 'lucide-react';
// Import static database from TS file
import { guionBase } from './guionbase';

export default function App() {
  const [activeTab, setActiveTab] = useState<'active' | 'inactive' | 'reports'>('active');
  // Initialize with data from TS file
  const [scripts, setScripts] = useState<Script[]>(guionBase);
  const [uploadTarget, setUploadTarget] = useState<ScriptStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  // Filter main list scripts
  const filteredScripts = useMemo(() => {
    return scripts.filter(script => {
      const matchesSearch = 
        script.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        script.themes.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        script.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        script.summary.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (activeTab === 'reports') return true; 
      return matchesSearch && script.status === activeTab;
    });
  }, [scripts, activeTab, searchQuery]);

  // Filter scripts for carousel (One year ago)
  const carouselScripts = useMemo(() => {
    if (activeTab === 'reports') return [];
    
    // Logic: Scripts from exactly 1 year ago based on current year
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;

    return scripts.filter(s => {
       try {
         const scriptYear = new Date(s.dateAdded).getFullYear();
         // Match status and year = prevYear
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

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark:bg-slate-900' : 'bg-slate-50'}`}>
      
      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <FileStack className="text-white h-5 w-5" />
              </div>
              <span className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">GuionBD</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <Settings size={20} />
              </button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 ml-2"></div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {activeTab === 'active' && 'Guiones Activos'}
              {activeTab === 'inactive' && 'Guiones Inactivos'}
              {activeTab === 'reports' && 'Centro de Informes'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Gestión de programación y temáticas radiales.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
             <button 
                onClick={() => setUploadTarget('active')}
                className="group flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
              >
                <FilePlus size={20} />
                <span>Cargar Activos</span>
              </button>
              <button 
                onClick={() => setUploadTarget('inactive')}
                className="group flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-slate-500/30 transition-all hover:scale-105 active:scale-95"
              >
                <Upload size={20} />
                <span>Cargar Inactivos</span>
              </button>
          </div>
        </div>

        {/* Controls & Search */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8 items-start lg:items-center justify-between">
          
          {/* Tabs */}
          <div className="flex p-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setActiveTab('active')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'active' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <LayoutGrid size={16} />
              Activos
            </button>
            <button 
              onClick={() => setActiveTab('inactive')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'inactive' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <FileStack size={16} />
              Inactivos
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'reports' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <BarChart3 size={16} />
              Informes
            </button>
          </div>

          {/* Search Bar */}
          {activeTab !== 'reports' && (
            <div className="relative w-full lg:w-96 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Buscar programa, tema o fecha..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                 <Filter size={16} className="text-slate-300" />
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        {activeTab === 'reports' ? (
          <StatsView scripts={scripts} />
        ) : (
          <div className="pb-20">
            {/* Carousel for One Year Ago Scripts */}
            <ScriptCarousel 
              scripts={carouselScripts} 
              title="Hace un Año" 
            />

            {/* List of current filter scripts */}
            {filteredScripts.length > 0 ? (
              <>
                 <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                   <LayoutGrid size={20} className="text-indigo-500"/>
                   Todos los Guiones
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredScripts.map(script => (
                    <ScriptCard 
                      key={script.id} 
                      script={script} 
                      onToggleStatus={toggleStatus}
                      onDelete={deleteScript}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
                  <Search size={40} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 dark:text-white mb-2">
                  No se encontraron registros
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                  Carga un archivo TXT con el listado de guiones para comenzar.
                </p>
                {searchQuery && (
                   <button 
                     onClick={() => setSearchQuery('')}
                     className="mt-4 text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                   >
                     Limpiar búsqueda
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
