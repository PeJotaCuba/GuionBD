import React from 'react';
import { Script } from '../types';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface ScriptCarouselProps {
  scripts: Script[];
  title: string;
}

export const ScriptCarousel: React.FC<ScriptCarouselProps> = ({ scripts, title }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const element = scrollRef.current;
      const scrollAmount = direction === 'left' ? -150 : 150;
      element.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const themeImages = [
    "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=200&q=60", 
    "https://images.unsplash.com/photo-1520032525096-7bd04a94b5a4?auto=format&fit=crop&w=200&q=60",
    "https://images.unsplash.com/photo-1506157786151-c843ec76657f?auto=format&fit=crop&w=200&q=60", 
    "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=200&q=60"
  ];

  if (scripts.length === 0) return null;

  return (
    <div className="mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
          <Calendar className="text-indigo-500" size={14} />
          {title}
        </h2>
        <div className="flex gap-1">
          <button onClick={() => scroll('left')} className="p-0.5 rounded-md bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => scroll('right')} className="p-0.5 rounded-md bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory"
      >
        {scripts.map((script) => {
             const imageIndex = script.title.length % themeImages.length;
             const imageUrl = themeImages[imageIndex];

            return (
              <div key={script.id} className="snap-start shrink-0 w-36 bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="h-16 relative overflow-hidden">
                   <img src={imageUrl} alt={script.title} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/40"></div>
                   <div className="absolute bottom-1 left-1.5 right-1.5">
                      <p className="text-[8px] text-white/90 font-bold uppercase truncate">{script.genre}</p>
                   </div>
                </div>
                <div className="p-2">
                  <h4 className="text-[10px] font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate mb-0.5">{script.title}</h4>
                  <p className="text-[9px] text-slate-400">
                    {new Date(script.dateAdded).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};