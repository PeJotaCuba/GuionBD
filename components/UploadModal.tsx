import React, { useState, useRef } from 'react';
import { X, UploadCloud, Loader2, FileText, CheckCircle } from 'lucide-react';
import { parseScriptsFromText } from '../services/parserService';
import { Script, ScriptStatus } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scripts: Script[]) => void;
  targetStatus: ScriptStatus;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSave, targetStatus }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/plain' || droppedFile.name.endsWith('.txt')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Por favor, sube solo archivos .txt");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
       setFile(e.target.files[0]);
       setError(null);
    }
  };

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const text = await file.text();
      const scripts = parseScriptsFromText(text, targetStatus);
      
      if (scripts.length === 0) {
        throw new Error("No se encontraron registros válidos. Verifica que el archivo use el separador '____'.");
      }

      onSave(scripts);
      onClose();
      setFile(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al procesar el archivo.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in w-screen h-screen">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl border border-white/10 overflow-hidden transform transition-all scale-100">
        
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            Cargar Base de Datos
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <X size={20} className="text-slate-500 dark:text-slate-300" />
          </button>
        </div>

        <div className="p-8">
          {!file ? (
            <div 
              className={`
                border-3 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer
                ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".txt" 
              />
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4">
                <UploadCloud size={32} />
              </div>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Toca para subir o arrastra aquí
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Sube tu archivo .txt con los guiones separados por "____"
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4">
                <FileText size={32} />
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-white mb-1 truncate max-w-full px-4">
                {file.name}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {(file.size / 1024).toFixed(2)} KB
              </p>

              <button 
                onClick={processFile}
                disabled={isProcessing}
                className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Procesando guiones...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Cargar Información
                  </>
                )}
              </button>
              
              {!isProcessing && (
                <button 
                  onClick={() => setFile(null)}
                  className="mt-3 text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  Cancelar selección
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm rounded-lg text-center">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Asegúrate de que el archivo .txt use "____" para separar cada guion.
          </p>
        </div>
      </div>
    </div>
  );
};