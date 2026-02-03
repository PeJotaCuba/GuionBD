import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
  progress: number;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, progress, message = "Procesando..." }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col items-center text-center">
        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-full mb-4">
          <Loader2 size={32} className="text-indigo-600 dark:text-indigo-400 animate-spin" />
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {message}
        </h3>
        
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 mb-3 overflow-hidden">
          <div 
            className="bg-indigo-600 h-4 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
          {Math.round(progress)}% Completado
        </p>
      </div>
    </div>
  );
};