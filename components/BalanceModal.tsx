import React, { useState, useMemo } from 'react';
import { X, Calendar, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { Script } from '../types';

interface BalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  scripts: Script[];
  programName: string;
}

export const BalanceModal: React.FC<BalanceModalProps> = ({ isOpen, onClose, scripts, programName }) => {
  const [searchDate, setSearchDate] = useState('');

  if (!isOpen) return null;

  // Filtrar scripts basado en la búsqueda de fecha
  const filteredData = useMemo(() => {
    const q = searchDate.toLowerCase().trim();
    
    return scripts.filter(s => {
      if (!q) return true;
      const dateStr = new Date(s.dateAdded).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).toLowerCase();
      return dateStr.includes(q) || s.dateAdded.includes(q);
    }).sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
  }, [scripts, searchDate]);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in w-screen h-screen">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-4xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] relative">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-md rounded-t-[2rem]">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
              <Calendar size={24} className="text-indigo-500" />
              Balance de Programas
            </h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">{programName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-8 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="relative group">
            <Search size={18} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por fecha (ej: 27 de junio, 2024, junio...)"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium"
            />
          </div>
        </div>

        {/* Table/List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tema</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Datos Faltantes</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredData.map(script => {
                const missingFields = [];
                if (!script.writer) missingFields.push("Escritor");
                if (!script.advisor) missingFields.push("Asesor");
                if (!script.title || script.title === "Sin Título") missingFields.push("Tema");

                const formattedDate = new Date(script.dateAdded).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                });

                return (
                  <tr key={script.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize">
                          {formattedDate}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium line-clamp-1" title={script.title}>
                        {script.title}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {missingFields.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {missingFields.map(f => (
                            <span key={f} className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                              Falta {f}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {missingFields.length > 0 ? (
                        <div className="flex items-center justify-end gap-1.5 text-amber-500">
                          <span className="text-xs font-bold">Incompleto</span>
                          <AlertCircle size={16} />
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5 text-emerald-500">
                          <span className="text-xs font-bold">Correcto</span>
                          <CheckCircle size={16} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                    No se encontraron registros para la fecha seleccionada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-[2rem] text-center">
          <p className="text-xs text-slate-500">
            Total mostrados: <span className="font-bold text-slate-800 dark:text-white">{filteredData.length}</span> guiones
          </p>
        </div>
      </div>
    </div>
  );
};