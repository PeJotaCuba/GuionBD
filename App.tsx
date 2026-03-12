import { useState, useEffect } from 'react';
import { ProgramGrid } from './components/ProgramGrid';
import { ProgramDetail } from './components/ProgramDetail';
import { Login } from './components/Login';
import { 
  FileStack, Moon, Sun, ChevronLeft, LogOut
} from 'lucide-react';

export default function App() {
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Cargar tema
  useEffect(() => {
    const savedTheme = localStorage.getItem('guionbd_theme');
    if (savedTheme === 'dark') setDarkMode(true);
    
    const auth = localStorage.getItem('guionbd_auth');
    if (auth === 'true') setIsAuthenticated(true);
    
    setIsLoaded(true);
  }, []);

  // Manejo del botón Atrás (History API)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Si el estado tiene un programa, lo seleccionamos, si no, volvemos al grid
      if (event.state && event.state.program) {
        setSelectedProgram(event.state.program);
      } else {
        setSelectedProgram(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('guionbd_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('guionbd_theme', 'light');
    }
  }, [darkMode]);

  const navigateToProgram = (programName: string) => {
    setSelectedProgram(programName);
    window.history.pushState({ program: programName }, '', `#${programName.replace(/\s+/g, '-')}`);
  };

  const navigateHome = () => {
    setSelectedProgram(null);
    // Si hay historial, volvemos atrás, si no, reemplazamos estado
    if (window.history.state && window.history.state.program) {
      window.history.back();
    } else {
      window.history.pushState(null, '', window.location.pathname);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('guionbd_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('guionbd_auth');
    setSelectedProgram(null);
  };

  if (!isLoaded) return null;

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'dark:bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="absolute top-4 right-4 z-50">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title={darkMode ? "Modo Claro" : "Modo Oscuro"}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'dark:bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Navbar Superior */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo y Navegación */}
            <div className="flex items-center gap-4">
              <div 
                className="flex items-center gap-2.5 cursor-pointer" 
                onClick={navigateHome}
              >
                <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                  <FileStack className="text-white h-5 w-5" />
                </div>
                <div>
                  <span className="font-bold text-xl text-slate-900 dark:text-slate-100 tracking-tight leading-none block">CMNL Guiones</span>
                  <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none">Gestor</span>
                </div>
              </div>

              {selectedProgram && (
                <button 
                  onClick={navigateHome}
                  className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <ChevronLeft size={18} />
                  Volver
                </button>
              )}
            </div>
            
            {/* Acciones de Usuario */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title={darkMode ? "Modo Claro" : "Modo Oscuro"}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {selectedProgram ? (
          <ProgramDetail 
            programName={selectedProgram} 
            onBack={navigateHome}
          />
        ) : (
          <ProgramGrid 
            onSelectProgram={navigateToProgram} 
          />
        )}
      </main>
    </div>
  );
}