import { useState, useEffect } from 'react';
import { User, Script } from './types';
import { Login } from './components/Login';
import { ProgramGrid } from './components/ProgramGrid';
import { ProgramDetail } from './components/ProgramDetail';
import { AdminSettings } from './components/AdminSettings';
import { 
  FileStack, Moon, Sun, LogOut, Settings, ChevronLeft 
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar sesión y tema
  useEffect(() => {
    const savedUser = localStorage.getItem('guionbd_session');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    const savedTheme = localStorage.getItem('guionbd_theme');
    if (savedTheme === 'dark') setDarkMode(true);
    setIsLoaded(true);
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

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('guionbd_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedProgram(null);
    setShowSettings(false);
    localStorage.removeItem('guionbd_session');
  };

  if (!isLoaded) return null;

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
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
                onClick={() => { setSelectedProgram(null); setShowSettings(false); }}
              >
                <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                  <FileStack className="text-white h-5 w-5" />
                </div>
                <div>
                  <span className="font-bold text-xl text-slate-900 dark:text-slate-100 tracking-tight leading-none block">GuionBD</span>
                  <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none">Gestor</span>
                </div>
              </div>

              {(selectedProgram || showSettings) && (
                <button 
                  onClick={() => { setSelectedProgram(null); setShowSettings(false); }}
                  className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <ChevronLeft size={18} />
                  Cambiar de programa
                </button>
              )}
            </div>
            
            {/* Acciones de Usuario */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400">
                {currentUser.role}: {currentUser.username}
              </span>

              {currentUser.role === 'Administrador' && (
                <button 
                  onClick={() => { setShowSettings(!showSettings); setSelectedProgram(null); }}
                  className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  title="Ajustes de Usuario"
                >
                  <Settings size={20} />
                </button>
              )}

              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title={darkMode ? "Modo Claro" : "Modo Oscuro"}
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <button 
                onClick={handleLogout}
                className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-slate-800/50 rounded-lg transition-all"
                title="Cerrar Sesión"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {showSettings ? (
          <AdminSettings />
        ) : selectedProgram ? (
          <ProgramDetail 
            programName={selectedProgram} 
            userRole={currentUser.role} 
            onBack={() => setSelectedProgram(null)}
          />
        ) : (
          <ProgramGrid 
            onSelectProgram={setSelectedProgram} 
            currentUser={currentUser} 
          />
        )}
      </main>
    </div>
  );
}