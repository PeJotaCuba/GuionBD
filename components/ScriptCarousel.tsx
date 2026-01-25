import React from 'react';
import { Script } from '../types';
import { 
  Calendar, ChevronLeft, ChevronRight, 
  Mic2, Music, Palette, BookOpen, Sun, 
  Coffee, Users, Sparkles, FileText, Leaf
} from 'lucide-react';

interface ScriptCarouselProps {
  scripts: Script[];
  title: string;
}

// Función auxiliar para determinar el estilo basado en el género
const getProgramStyle = (genre: string, title: string) => {
  const normalizedGenre = genre.toUpperCase();
  const normalizedTitle = title.toUpperCase();

  if (normalizedGenre.includes('BUENOS') || normalizedGenre.includes('MAÑANA') || normalizedGenre.includes('DESDE')) {
    return {
      bg: 'bg-gradient-to-br from-amber-400 to-orange-500',
      icon: <Sun size={32} className="text-white/90" strokeWidth={1.5} />,
      pattern: 'opacity-20'
    };
  }
  if (normalizedGenre.includes('SON') || normalizedGenre.includes('MÚSICA') || normalizedGenre.includes('BOLEROS') || normalizedGenre.includes('CANTOR') || normalizedGenre.includes('COMBINACIÓN')) {
    return {
      bg: 'bg-gradient-to-br from-violet-500 to-fuchsia-600',
      icon: <Music size={32} className="text-white/90" strokeWidth={1.5} />,
      pattern: 'opacity-20'
    };
  }
  if (normalizedGenre.includes('ARTE') || normalizedGenre.includes('CINE') || normalizedGenre.includes('PINTURA')) {
    return {
      bg: 'bg-gradient-to-br from-teal-400 to-emerald-600',
      icon: <Palette size={32} className="text-white/90" strokeWidth={1.5} />,
      pattern: 'opacity-20'
    };
  }
  if (normalizedGenre.includes('CAMPESINO') || normalizedGenre.includes('TIERRA')) {
     return {
      bg: 'bg-gradient-to-br from-lime-500 to-green-600',
      icon: <Leaf size={32} className="text-white/90" strokeWidth={1.5} />,
      pattern: 'opacity-20'
    };
  }
  if (normalizedGenre.includes('LIBRO') || normalizedGenre.includes('LEER') || normalizedGenre.includes('LITERATURA') || normalizedGenre.includes('LEYENDO')) {
    return {
      bg: 'bg-gradient-to-br from-blue-400 to-indigo-600',
      icon: <BookOpen size={32} className="text-white/90" strokeWidth={1.5} />,
      pattern: 'opacity-20'
    };
  }
  if (normalizedGenre.includes('HABLANDO') || normalizedGenre.includes('GENTE') || normalizedGenre.includes('HOMBRES')) {
    return {
      bg: 'bg-gradient-to-br from-pink-400 to-rose-600',
      icon: <Users size={32} className="text-white/90" strokeWidth={1.5} />,
      pattern: 'opacity-20'
    };
  }
  if (normalizedTitle.includes('ENTREVISTA')) {
     return {
      bg: 'bg-gradient-to-br from-cyan-400 to-blue-600',
      icon: <Mic2 size={32} className="text-white/90" strokeWidth={1.5} />,
      pattern: 'opacity-20'
    };
  }

  // Default
  return {
    bg: 'bg-gradient-to-br from-slate-400 to-slate-600',
    icon: <FileText size={32} className="text-white/90" strokeWidth={1.5} />,
    pattern: 'opacity-10'
  };
};

export const ScriptCarousel: React.FC<ScriptCarouselProps> = ({ scripts, title }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const element = scrollRef.current;
      const scrollAmount = direction === 'left' ? -200 : 200;
      element.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (scripts.length === 0) return null;

  return (
    <div className="mb-8 animate-fade-in relative group/carousel">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 uppercase tracking-wide">
          <Calendar className="text-indigo-500" size={16} />
          {title}
        </h2>
        
        {/* Navigation buttons (visible on hover or always on touch) */}
        <div className="flex gap-1.5 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300">
          <button onClick={() => scroll('left')} className="p-1 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scroll('right')} className="p-1 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 px-1 no-scrollbar snap-x snap-mandatory scroll-smooth"
      >
        {scripts.map((script) => {
            const style = getProgramStyle(script.genre, script.title);
            const scriptDate = new Date(script.dateAdded);
            const isToday = scriptDate.getDate() === new Date().getDate() && scriptDate.getMonth() === new Date().getMonth();

            return (
              <div key={script.id} className="snap-start shrink-0 w-44 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-slate-100 dark:border-slate-800 group">
                {/* Vector Header */}
                <div className={`h-24 relative overflow-hidden flex items-center justify-center ${style.bg}`}>
                   {/* Decorative Circles */}
                   <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
                   <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-black/5 rounded-full blur-md"></div>
                   
                   {/* Main Icon with Animation */}
                   <div className="transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 ease-out">
                     {style.icon}
                   </div>

                   {/* Today Badge */}
                   {isToday && (
                     <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20">
                       <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-300 uppercase">Hoy</span>
                     </div>
                   )}
                </div>

                {/* Content */}
                <div className="p-3 flex flex-col h-24 justify-between">
                   <div>
                      <p className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-1 truncate">
                        {script.genre}
                      </p>
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
                        {script.title}
                      </h4>
                   </div>
                   
                   <div className="flex items-center gap-1.5 mt-2">
                     <Calendar size={10} className="text-slate-400" />
                     <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                       {scriptDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                       <span className="text-slate-300 mx-1">|</span>
                       {scriptDate.getFullYear()}
                     </p>
                   </div>
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};