import React, { useState, useMemo, useEffect } from 'react';
import { X, Calendar, Search, CheckCircle, FileDown, Filter, ArrowRight, List, AlertOctagon, UserX, FileQuestion } from 'lucide-react';
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
  
  // Estado para las pestañas en móvil
  const [activeTab, setActiveTab] = useState<'total' | 'writer' | 'advisor' | 'topic'>('total');

  // Resetear estado al abrir
  useEffect(() => {
    if (isOpen) {
      setStep('filter');
      setSelectedYear('Todos');
      setSelectedMonth('Todos');
      setSearchQuery('');
      setActiveTab('total');
    }
  }, [isOpen]);

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const minValidYear = 2022; 
    const yearsSet = new Set<string>();

    scripts.forEach(s => {
      try {
        const y = new Date(s.dateAdded).getFullYear();
        if (y >= 2000 && y <= currentYear + 2 && y.toString().length === 4) {
             yearsSet.add(y.toString());
        }
      } catch (e) {}
    });
    
    for(let y = minValidYear; y <= currentYear; y++) {
        yearsSet.add(y.toString());
    }
    
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [scripts]);

  const reportData = useMemo(() => {
    let filtered = scripts.filter(s => {
      const date = new Date(s.dateAdded);
      const yearMatch = selectedYear === 'Todos' || date.getFullYear().toString() === selectedYear;
      const monthMatch = selectedMonth === 'Todos' || date.getMonth() === MONTHS_LIST.indexOf(selectedMonth);
      return yearMatch && monthMatch;
    });

    filtered.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());

    const noWriter = filtered.filter(s => !s.writer || s.writer.trim() === '' || s.writer.toUpperCase().includes("NO ESPECIFICADO") || s.writer.toUpperCase().includes("PECIFICADO"));
    const noAdvisor = filtered.filter(s => !s.advisor || s.advisor.trim() === '' || s.advisor.toUpperCase().includes("NO ESPECIFICADO") || s.advisor.toUpperCase().includes("PECIFICADO"));
    const noTopic = filtered.filter(s => !s.title || s.title.trim() === '' || s.title.toUpperCase() === "SIN TÍTULO" || s.title.toUpperCase().includes("NO ESPECIFICADO"));

    return {
      total: filtered,
      noWriter,
      noAdvisor,
      noTopic
    };
  }, [scripts, selectedYear, selectedMonth]);

  const filterListBySearch = (list: Script[]) => {
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(s => {
      const dateStr = new Date(s.dateAdded).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      return dateStr.toLowerCase().includes(q) || (s.title && s.title.toLowerCase().includes(q));
    });
  };

  const handleExportDocx = () => {
    const generateList = (title: string, list: Script[]) => {
      if (list.length === 0) return `<p>No hay guiones en esta categoría.</p>`;
      return `
        <h4>${title} (${list.length})</h4>
        <ul>
          ${list.map(s => `<li><strong>${new Date(s.dateAdded).toLocaleDateString()}:</strong> ${s.title || 'Sin Título'}</li>`).join('')}
        </ul>
      `;
    };

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Balance - ${programName}</title></head>
      <body style="font-family: Arial, sans-serif;">
        <h2 style="text-align:center;">Balance: ${programName}</h2>
        <p><strong>Periodo:</strong> Año ${selectedYear}, Mes ${selectedMonth}</p>
        <hr/>
        <h3>Resumen Cuantitativo</h3>
        <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
          <tr><td style="border:1px solid #ccc; padding:8px;">Total Guiones</td><td style="border:1px solid #ccc; padding:8px;">${reportData.total.length}</td></tr>
          <tr><td style="border:1px solid #ccc; padding:8px; color:red;">Sin Escritor</td><td style="border:1px solid #ccc; padding:8px;">${reportData.noWriter.length}</td></tr>
          <tr><td style="border:1px solid #ccc; padding:8px; color:red;">Sin Asesor</td><td style="border:1px solid #ccc; padding:8px;">${reportData.noAdvisor.length}</td></tr>
          <tr><td style="border:1px solid #ccc; padding:8px; color:red;">Sin Tema</td><td style="border:1px solid #ccc; padding:8px;">${reportData.noTopic.length}</td></tr>
        </table>
        <hr/>
        <h3>Inventario Detallado de Faltantes</h3>
        ${generateList('Guiones sin Escritor', reportData.noWriter)}
        ${generateList('Guiones sin Asesor', reportData.noAdvisor)}
        ${generateList('Guiones sin Tema', reportData.noTopic)}
      </body>
      </html>
    `;
    
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Balance_${programName}_${selectedYear}.doc`;
    link.click();
  };

  const renderScriptList = (list: Script[], emptyMessage: string, colorClass: string) => {
    const filtered = filterListBySearch(list);
    return (
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar min-h-[200px]">
        {filtered.map(s => (
          <div key={s.id} className={`p-3 rounded-xl border border-transparent transition-all ${colorClass}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold opacity-70">
                {new Date(s.dateAdded).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-2 leading-snug">
                {s.title || <span className="italic opacity-50">Sin título</span>}
            </p>
          </div>
        ))}
        {list.length === 0 && (
          <div className="h-40 flex flex-col items-center justify-center text-slate-400 opacity-50">
            <CheckCircle size={32} className="text-emerald-500 mb-2" />
            <span className="text-xs font-bold">{emptyMessage}</span>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-7xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[90vh] overflow-hidden relative">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-md">
          <div className="flex-1 overflow-hidden">
            <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2 truncate">
              <Calendar size={20} className="text-indigo-500 flex-shrink-0" />
              <span className="truncate">Balance: {programName}</span>
            </h2>
            {step === 'report' && (
               <p className="text-xs text-slate-500 font-bold mt-0.5">Filtro: {selectedYear} / {selectedMonth}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 ml-2">
            <X size={24} />
          </button>
        </div>

        {/* PASO 1: FILTROS */}
        {step === 'filter' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-950/50">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-xl max-w-lg w-full border border-slate-100 dark:border-slate-700">
                <div className="flex justify-center mb-6">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-full text-indigo-600 dark:text-indigo-400">
                        <Filter size={40} />
                    </div>
                </div>
                <h3 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-8">
                  Configurar Balance
                </h3>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Año</label>
                    <select 
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-lg font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none"
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
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-lg font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none"
                    >
                      <option value="Todos">Todos los meses</option>
                      {MONTHS_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <button 
                  onClick={() => setStep('report')}
                  className="mt-8 w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
                >
                  Ver Resultados <ArrowRight size={20} />
                </button>
            </div>
          </div>
        )}

        {/* PASO 2: REPORTE */}
        {step === 'report' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* Toolbar */}
            <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
              <button 
                  onClick={() => setStep('filter')}
                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 order-2 md:order-1"
                >
                  <Filter size={14} /> Cambiar Filtros
              </button>

              <div className="flex gap-3 w-full md:w-auto items-center order-1 md:order-2">
                <div className="relative group flex-grow md:w-64">
                  <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <button 
                  onClick={handleExportDocx}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all whitespace-nowrap"
                >
                  <FileDown size={18} /> <span className="hidden sm:inline">Exportar</span>
                </button>
              </div>
            </div>

            {/* Navegación por Pestañas (Solo Móvil) */}
            <div className="md:hidden flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto no-scrollbar">
               <button 
                 onClick={() => setActiveTab('total')}
                 className={`flex-1 min-w-[80px] py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'total' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500'}`}
               >
                 Total ({reportData.total.length})
               </button>
               <button 
                 onClick={() => setActiveTab('writer')}
                 className={`flex-1 min-w-[80px] py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'writer' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500'}`}
               >
                 No Autor ({reportData.noWriter.length})
               </button>
               <button 
                 onClick={() => setActiveTab('advisor')}
                 className={`flex-1 min-w-[80px] py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'advisor' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500'}`}
               >
                 No Asesor ({reportData.noAdvisor.length})
               </button>
               <button 
                 onClick={() => setActiveTab('topic')}
                 className={`flex-1 min-w-[80px] py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'topic' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-500'}`}
               >
                 No Tema ({reportData.noTopic.length})
               </button>
            </div>

            {/* Contenido (Grid en Desktop / Único panel en Móvil) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-full">
                
                {/* Panel Total */}
                <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm overflow-hidden h-fit max-h-full ${activeTab !== 'total' ? 'hidden md:flex' : 'flex'}`}>
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-900/10 flex items-center justify-between">
                    <h4 className="text-xs font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2"><List size={14}/> Total Guiones</h4>
                    <span className="text-xl font-black text-slate-800 dark:text-white">{reportData.total.length}</span>
                  </div>
                  {renderScriptList(reportData.total, "No hay guiones", "hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-100 dark:hover:border-slate-700")}
                </div>

                {/* Panel Sin Escritor */}
                <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm overflow-hidden h-fit max-h-full ${activeTab !== 'writer' ? 'hidden md:flex' : 'flex'}`}>
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-900/10 flex items-center justify-between">
                    <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><UserX size={14}/> Sin Escritor</h4>
                    <span className="text-xl font-black text-slate-800 dark:text-white">{reportData.noWriter.length}</span>
                  </div>
                  {renderScriptList(reportData.noWriter, "Todo correcto", "bg-amber-50/20 hover:bg-amber-50/50 dark:bg-amber-900/10 dark:hover:bg-amber-900/20")}
                </div>

                {/* Panel Sin Asesor */}
                <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm overflow-hidden h-fit max-h-full ${activeTab !== 'advisor' ? 'hidden md:flex' : 'flex'}`}>
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-orange-50/50 dark:bg-orange-900/10 flex items-center justify-between">
                    <h4 className="text-xs font-black text-orange-500 uppercase tracking-widest flex items-center gap-2"><AlertOctagon size={14}/> Sin Asesor</h4>
                    <span className="text-xl font-black text-slate-800 dark:text-white">{reportData.noAdvisor.length}</span>
                  </div>
                  {renderScriptList(reportData.noAdvisor, "Todo correcto", "bg-orange-50/20 hover:bg-orange-50/50 dark:bg-orange-900/10 dark:hover:bg-orange-900/20")}
                </div>

                {/* Panel Sin Tema */}
                <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm overflow-hidden h-fit max-h-full ${activeTab !== 'topic' ? 'hidden md:flex' : 'flex'}`}>
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-red-50/50 dark:bg-red-900/10 flex items-center justify-between">
                    <h4 className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-2"><FileQuestion size={14}/> Sin Tema</h4>
                    <span className="text-xl font-black text-slate-800 dark:text-white">{reportData.noTopic.length}</span>
                  </div>
                  {renderScriptList(reportData.noTopic, "Todo correcto", "bg-red-50/20 hover:bg-red-50/50 dark:bg-red-900/10 dark:hover:bg-red-900/20")}
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};