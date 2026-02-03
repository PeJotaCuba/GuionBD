import React, { useState, useMemo, useEffect } from 'react';
import { X, Calendar, Search, AlertCircle, CheckCircle, FileDown, Filter, ArrowRight } from 'lucide-react';
import { Script } from '../types';

interface BalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  scripts: Script[];
  programName: string;
}

const MONTHS_LIST = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const BalanceModal: React.FC<BalanceModalProps> = ({ isOpen, onClose, scripts, programName }) => {
  const [step, setStep] = useState<'filter' | 'report'>('filter');
  const [selectedYear, setSelectedYear] = useState<string>('Todos');
  const [selectedMonth, setSelectedMonth] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Resetear estado al abrir
  useEffect(() => {
    if (isOpen) {
      setStep('filter');
      setSelectedYear('Todos');
      setSelectedMonth('Todos');
      setSearchQuery('');
    }
  }, [isOpen]);

  // Obtener años disponibles
  const availableYears = useMemo(() => {
    const years = new Set<string>(scripts.map(s => new Date(s.dateAdded).getFullYear().toString()));
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [scripts]);

  // Lógica principal de filtrado y agrupación
  const reportData = useMemo(() => {
    // 1. Filtrar por Año y Mes
    let filtered = scripts.filter(s => {
      const date = new Date(s.dateAdded);
      const yearMatch = selectedYear === 'Todos' || date.getFullYear().toString() === selectedYear;
      const monthMatch = selectedMonth === 'Todos' || date.getMonth() === MONTHS_LIST.indexOf(selectedMonth);
      return yearMatch && monthMatch;
    });

    // Ordenar por fecha descendente
    filtered.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());

    // 2. Agrupar por categorías de error
    const noWriter = filtered.filter(s => !s.writer || s.writer.toUpperCase().includes("NO ESPECIFICADO") || s.writer.toUpperCase().includes("PECIFICADO"));
    const noAdvisor = filtered.filter(s => !s.advisor || s.advisor.toUpperCase().includes("NO ESPECIFICADO") || s.advisor.toUpperCase().includes("PECIFICADO"));
    const noTopic = filtered.filter(s => !s.title || s.title.toUpperCase() === "SIN TÍTULO" || s.title.toUpperCase().includes("NO ESPECIFICADO"));

    return {
      total: filtered,
      noWriter,
      noAdvisor,
      noTopic
    };
  }, [scripts, selectedYear, selectedMonth]);

  // Filtrado final por búsqueda de texto (aplica a las listas mostradas)
  const filterListBySearch = (list: Script[]) => {
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(s => {
      const dateStr = new Date(s.dateAdded).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      return dateStr.toLowerCase().includes(q) || s.title.toLowerCase().includes(q);
    });
  };

  const handleExportDocx = () => {
    // Generación simple de HTML para Word basado en los datos actuales
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Balance</title></head>
      <body style="font-family: Arial, sans-serif;">
        <h2 style="text-align:center;">Balance: ${programName}</h2>
        <p><strong>Filtro:</strong> Año: ${selectedYear}, Mes: ${selectedMonth}</p>
        <hr/>
        <h3>Resumen</h3>
        <p>Total Guiones: ${reportData.total.length}</p>
        <p>Sin Escritor: ${reportData.noWriter.length}</p>
        <p>Sin Asesor: ${reportData.noAdvisor.length}</p>
        <p>Sin Tema: ${reportData.noTopic.length}</p>
        <hr/>
        <h3>Detalle de Faltantes</h3>
        <h4>Sin Escritor (${reportData.noWriter.length})</h4>
        <ul>${reportData.noWriter.map(s => `<li>${new Date(s.dateAdded).toLocaleDateString()}: ${s.title}</li>`).join('')}</ul>
        <h4>Sin Asesor (${reportData.noAdvisor.length})</h4>
        <ul>${reportData.noAdvisor.map(s => `<li>${new Date(s.dateAdded).toLocaleDateString()}: ${s.title}</li>`).join('')}</ul>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Balance_${programName}.doc`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in w-screen h-screen">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-6xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden relative transition-all">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-md">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
              <Calendar size={24} className="text-indigo-500" />
              Balance de Programas
            </h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">
              {programName} • {step === 'filter' ? 'Configuración' : 'Resultados'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        {/* CONTENIDO: PASO 1 - FILTROS */}
        {step === 'filter' && (
          <div className="p-10 flex flex-col items-center justify-center h-full space-y-8 animate-fade-in">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-3xl mb-4">
              <Filter size={48} className="text-indigo-500 dark:text-indigo-400" />
            </div>
            
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white text-center">
              Selecciona el periodo a analizar
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Año</label>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-lg font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all cursor-pointer"
                >
                  <option value="Todos">Todos los años</option>
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Mes</label>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-lg font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all cursor-pointer"
                >
                  <option value="Todos">Todos los meses</option>
                  {MONTHS_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <button 
              onClick={() => setStep('report')}
              className="mt-8 flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-105"
            >
              Generar Balance <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* CONTENIDO: PASO 2 - REPORTE */}
        {step === 'report' && (
          <div className="flex flex-col h-full overflow-hidden animate-fade-in">
            {/* Toolbar */}
            <div className="px-8 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setStep('filter')}
                  className="text-xs font-bold text-indigo-600 hover:underline bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg"
                >
                  Cambiar Filtros
                </button>
                <span className="text-sm font-semibold text-slate-500">
                  {selectedYear} • {selectedMonth}
                </span>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <div className="relative group flex-grow md:w-64">
                  <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar fecha..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <button 
                  onClick={handleExportDocx}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-sm font-bold hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                >
                  <FileDown size={16} /> <span className="hidden sm:inline">Exportar</span>
                </button>
              </div>
            </div>

            {/* Grid de Resultados */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full min-h-[500px]">
                
                {/* Columna 1: Total */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm overflow-hidden h-full">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-900/10">
                    <h4 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Total Guiones</h4>
                    <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{reportData.total.length}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {filterListBySearch(reportData.total).map(s => (
                      <div key={s.id} className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar size={12} className="text-slate-400" />
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 capitalize">
                            {new Date(s.dateAdded).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{s.title}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Columna 2: Sin Escritor */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm overflow-hidden h-full">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-900/10">
                    <h4 className="text-sm font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide">Sin Escritor</h4>
                    <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{reportData.noWriter.length}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {filterListBySearch(reportData.noWriter).map(s => (
                      <div key={s.id} className="p-2.5 rounded-xl hover:bg-amber-50/30 dark:hover:bg-amber-900/10 border border-transparent hover:border-amber-100 dark:hover:border-amber-900/30 transition-all">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle size={12} className="text-amber-500" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">
                            {new Date(s.dateAdded).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{s.title}</p>
                      </div>
                    ))}
                    {reportData.noWriter.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                        <CheckCircle size={32} className="text-emerald-500 mb-2" />
                        <span className="text-xs font-bold">Todo correcto</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Columna 3: Sin Asesor */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm overflow-hidden h-full">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-orange-50/50 dark:bg-orange-900/10">
                    <h4 className="text-sm font-black text-orange-600 dark:text-orange-400 uppercase tracking-wide">Sin Asesor</h4>
                    <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{reportData.noAdvisor.length}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {filterListBySearch(reportData.noAdvisor).map(s => (
                      <div key={s.id} className="p-2.5 rounded-xl hover:bg-orange-50/30 dark:hover:bg-orange-900/10 border border-transparent hover:border-orange-100 dark:hover:border-orange-900/30 transition-all">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle size={12} className="text-orange-500" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">
                            {new Date(s.dateAdded).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{s.title}</p>
                      </div>
                    ))}
                    {reportData.noAdvisor.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                        <CheckCircle size={32} className="text-emerald-500 mb-2" />
                        <span className="text-xs font-bold">Todo correcto</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Columna 4: Sin Tema */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm overflow-hidden h-full">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-red-50/50 dark:bg-red-900/10">
                    <h4 className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-wide">Sin Tema</h4>
                    <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{reportData.noTopic.length}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {filterListBySearch(reportData.noTopic).map(s => (
                      <div key={s.id} className="p-2.5 rounded-xl hover:bg-red-50/30 dark:hover:bg-red-900/10 border border-transparent hover:border-red-100 dark:hover:border-red-900/30 transition-all">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle size={12} className="text-red-500" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">
                            {new Date(s.dateAdded).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">Tema no especificado</p>
                      </div>
                    ))}
                    {reportData.noTopic.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                        <CheckCircle size={32} className="text-emerald-500 mb-2" />
                        <span className="text-xs font-bold">Todo correcto</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};