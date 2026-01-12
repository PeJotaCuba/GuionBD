import React from 'react';
import { Script } from '../types';
import { Calendar, Radio, ChevronLeft, ChevronRight } from 'lucide-react';

interface ScriptCarouselProps {
  scripts: Script[];
  title: string;
}

export const ScriptCarousel: React.FC<ScriptCarouselProps> = ({ scripts, title }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -300 : 300;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (scripts.length === 0) return null;

  return (
    <div className="mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Calendar className="text-indigo-500" size={20} />
          {title}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => scroll('left')} className="p-1.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scroll('right')} className="p-1.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory"
      >
        {scripts.map((script) => {
             // Generate deterministic image
             const seed = script.genre.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
             const imageId = (seed % 70) + 1; 
             const imageUrl = `https://picsum.photos/id/${imageId}/300/200`;

            return (
              <div key={script.id} className="snap-start shrink-0 w-72 bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 group relative">
                <div className="h-32 relative overflow-hidden">
                   <img src={imageUrl} alt={script.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                   <div className="absolute bottom-2 left-3 right-3">
                      <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-0.5">{script.genre}</p>
                      <h4 className="text-white font-bold text-sm leading-tight truncate">{script.title}</h4>
                   </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                    {script.summary.replace('Archivo: ', '')}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{new Date(script.dateAdded).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Radio size={10} /> {script.status}</span>
                  </div>
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};
