import React, { useState, useEffect, useMemo } from 'react';
import { Script } from '../types';
import { 
  FileDown, Calendar, Layers, Repeat, BarChart3, X, Check, Filter
} from 'lucide-react';

interface StatsViewProps {
  onClose?: () => void;
  programs: Array<{ name: string; file: string }>;
}

// Tipos de informes
type ReportType = 'month' | 'repeated' | 'program' | 'year_ago' | null;

interface FilterConfig {
  programs: string[];
  year: string;
  month: string;
  week: string;
}

export const StatsView: React.FC<StatsViewProps> = ({ onClose, programs }) => {
  const [allScripts, setAllScripts] = useState<Script[]>([]);
  const [activeReport, setActiveReport] = useState<ReportType>(null);
  
  // Configuración del filtro actual
  const [filters, setFilters] = useState<FilterConfig>({
    programs: [],
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
    week: '1'
  });

  // Manejo de tecla Escape para cerrar
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeReport) {
          setActiveReport(null);
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, activeReport]);

  // Cargar todos los scripts al montar
  useEffect(() => {
    let gathered: Script[] = [];
    programs.forEach(prog => {
      const key = `guionbd_data_${prog.file}`;
      const data = localStorage.getItem(key);
      if (data) {
        gathered = [...gathered, ...JSON.parse(data)];
      }
    });
    setAllScripts(gathered);
  }, [programs]);

  // Listas para los selects (Años 2022 al actual)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear; y >= 2022; y--) {
      years.push(y.toString());
    }
    return years;
  }, []);

  const toggleProgram = (progName: string) => {
    setFilters(prev => {
      const exists = prev.programs.includes(progName);
      let newProgs = exists 
        ? prev.programs.filter(p => p !== progName)
        : [...prev.programs, progName];
      return { ...prev, programs: newProgs };
    });
  };

  const selectAllPrograms = () => {
    if (filters.programs.length === programs.length) {
      setFilters(prev => ({ ...prev, programs: [] }));
    } else {
      setFilters(prev => ({ ...prev, programs: programs.map(p => p.name) }));
    }
  };

  // Helpers de fecha
  const getMonthDay = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const downloadReport = (
    filename: string, 
    title: string, 
    subTitle: string, 
    headers: string[], 
    rows: (string | number)[][],
    columnWidths?: string[] // Nuevo parámetro opcional para anchos de columna
  ) => {
    const tableHeader = headers.map((h, index) => {
      const widthStyle = columnWidths && columnWidths[index] ? `width: ${columnWidths[index]};` : '';
      return `<th style="border:1px solid #000; padding: 8px; background-color: #f3f4f6; text-align: left; font-size: 11px; ${widthStyle}">${h}</th>`;
    }).join('');
    
    const tableBody = rows.map(row => 
      `<tr>${row.map(cell => 
        `<td style="border:1px solid #000; padding: 8px; vertical-align: top; word-wrap: break-word; font-size: 11px;">${cell}</td>`
      ).join('')}</tr>`
    ).join('');

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${title}</title></head>
      <body style="font-family: Arial, sans-serif;">
        <h2 style="text-align:center; color: #4338ca; margin-bottom: 5px;">${title}</h2>
        <h4 style="text-align:center; color: #666; margin-top: 0;">${subTitle}</h4>
        <p style="text-align:center; font-size: 10px; color: #888;">Generado el ${new Date().toLocaleDateString()}</p>
        <br/>
        <table style="width:100%; border-collapse: collapse; border: 1px solid #000; table-layout: fixed;">
          <thead><tr>${tableHeader}</tr></thead>
          <tbody>${tableBody}</tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActiveReport(null); // Cerrar modal al descargar
  };

  const handleGenerate = () => {
    // Filtrar primero por programas seleccionados
    let selectedScripts = allScripts.filter(s => {
       return filters.programs.includes(s.genre) || filters.programs.some(p => s.genre.includes(p));
    });

    const programsLabel = filters.programs.length === programs.length 
        ? "Todos los Programas" 
        : filters.programs.join(", ");
    
    // Nombres normalizados para archivo
    const safeProgramsName = filters.programs.length > 1 ? "Multiples_Programas" : filters.programs[0].replace(/\s+/g, '_');

    if (activeReport === 'month') {
        // Filtrar por año seleccionado
        selectedScripts = selectedScripts.filter(s => new Date(s.dateAdded).getFullYear().toString() === filters.year);

        const rows = selectedScripts.map(s => {
            const d = new Date(s.dateAdded);
            const monthName = d.toLocaleString('es-ES', { month: 'long' });
            return [
                monthName.charAt(0).toUpperCase() + monthName.slice(1),
                d.getDate(), // Solo Día
                s.genre,
                s.writer || 'No especificado', // Autor
                s.title
            ];
        }).sort((a, b) => {
            return a[2].toString().localeCompare(b[2].toString()) || a[0].toString().localeCompare(b[0].toString());
        }); 
        
        const fileName = `Temas_Por_Mes_${safeProgramsName}_${filters.year}`;
        const title = `Informe de Temas por Mes - ${filters.year}`;
        const subTitle = `Programas: ${programsLabel}`;

        // Headers modificados
        downloadReport(fileName, title, subTitle, ['Mes', 'Día', 'Programa', 'Autor', 'Temática'], rows);
    } 
    
    else if (activeReport === 'repeated') {
        const yearScripts = selectedScripts.filter(s => new Date(s.dateAdded).getFullYear().toString() === filters.year);
        const themeCounts: Record<string, number> = {};
        yearScripts.forEach(s => s.themes.forEach(t => themeCounts[t] = (themeCounts[t] || 0) + 1));
        const repeated = Object.keys(themeCounts).filter(t => themeCounts[t] > 1);
        
        const rows: string[][] = [];
        yearScripts.forEach(s => {
            s.themes.forEach(t => {
                if (repeated.includes(t)) {
                    rows.push([
                        getMonthDay(s.dateAdded), // Día/Mes
                        s.genre, 
                        s.writer || 'No especificado', // Autor
                        t
                    ]);
                }
            });
        });
        rows.sort((a, b) => a[3].localeCompare(b[3])); 
        
        const fileName = `Repetidos_${safeProgramsName}_${filters.year}`;
        // Pasamos anchos específicos: Fecha (12%), Programa (18%), Autor (20%), Temática (50%)
        downloadReport(
          fileName, 
          `Temáticas Repetidas Año ${filters.year}`, 
          `Programas: ${programsLabel}`, 
          ['Fecha', 'Programa', 'Autor', 'Temática'], 
          rows,
          ['12%', '18%', '20%', '50%'] 
        );
    }

    else if (activeReport === 'program') {
        // Filtrar por año 
        let filtered = selectedScripts.filter(s => {
            const d = new Date(s.dateAdded);
            return d.getFullYear().toString() === filters.year;
        });

        // Filtrar por mes (si no es "Todos")
        if (filters.month !== "") {
          filtered = filtered.filter(s => {
             const d = new Date(s.dateAdded);
             return (d.getMonth() + 1).toString() === filters.month;
          });
        }
        
        // Lógica de semana (si no es "Todas")
        let weekLabel = "";
        if(filters.week) {
             filtered = filtered.filter(s => {
                 const d = new Date(s.dateAdded);
                 const weekNum = Math.ceil(d.getDate() / 7);
                 return weekNum.toString() === filters.week;
             });
             weekLabel = `_Semana${filters.week}`;
        }

        const rows = filtered.map(s => [
            s.genre,
            getMonthDay(s.dateAdded), // Día/Mes
            s.writer || 'No especificado', // Autor
            s.title
        ]).sort((a, b) => a[0].localeCompare(b[0]));

        let periodName = filters.year;
        if (filters.month !== "") {
           const monthName = new Date(parseInt(filters.year), parseInt(filters.month)-1).toLocaleString('es-ES', {month: 'long'});
           periodName = `${monthName} ${filters.year}`;
        } else {
           periodName = `Todo el año ${filters.year}`;
        }

        const fileName = `Detallado_${safeProgramsName}_${periodName.replace(/\s+/g, '_')}${weekLabel}`;
        const subTitle = `Programas: ${programsLabel} | Periodo: ${periodName} ${filters.week ? `- Semana ${filters.week}` : ''}`;

        downloadReport(fileName, `Informe Detallado`, subTitle, ['Programa', 'Fecha', 'Autor', 'Temática'], rows);
    }

    else if (activeReport === 'year_ago') {
        const today = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        
        const startRange = new Date(oneYearAgo);
        startRange.setDate(oneYearAgo.getDate() - 3);
        startRange.setHours(0, 0, 0, 0);

        const endRange = new Date(oneYearAgo);
        endRange.setDate(oneYearAgo.getDate() + 3);
        endRange.setHours(23, 59, 59, 999);

        const rows = selectedScripts
            .filter(s => {
                const sDate = new Date(s.dateAdded);
                return sDate >= startRange && sDate <= endRange;
            })
            .map(s => [
                getMonthDay(s.dateAdded), // Día/Mes
                s.genre,
                s.writer || 'No especificado', // Autor
                s.title
            ]).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

        const rangeStr = `${startRange.toLocaleDateString()} al ${endRange.toLocaleDateString()}`;
        const fileName = `Historico_${safeProgramsName}_Hace_1_Ano`;
        
        downloadReport(fileName, `Temas hace un año (± 3 días)`, `Programas: ${programsLabel} | Rango: ${rangeStr}`, ['Fecha', 'Programa', 'Autor', 'Tema'], rows);
    }
  };

  const renderModal = () => {
    if (!activeReport) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
          
          <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-md rounded-t-[2rem]">
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
              <Filter size={20} className="text-indigo-500" />
              Configurar Informe
            </h2>
            <button onClick={() => setActiveReport(null)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500">
              <X size={20} />
            </button>
          </div>

          <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
            {/* Selección de Programas (Común a todos) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Programas</label>
                <button onClick={selectAllPrograms} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                  {filters.programs.length === programs.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {programs.map(prog => (
                  <button
                    key={prog.name}
                    onClick={() => toggleProgram(prog.name)}
                    className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                      filters.programs.includes(prog.name)
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full flex items-center justify-center border ${filters.programs.includes(prog.name) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-600'}`}>
                        {filters.programs.includes(prog.name) && <Check size={8} className="text-white" />}
                      </div>
                      <span className="truncate">{prog.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Filtros específicos */}
            {(activeReport === 'repeated' || activeReport === 'program' || activeReport === 'month') && (
               <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Año</label>
                 <select 
                   value={filters.year} 
                   onChange={(e) => setFilters({...filters, year: e.target.value})}
                   className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
                 >
                   {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
               </div>
            )}

            {activeReport === 'program' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mes</label>
                  <select 
                    value={filters.month}
                    onChange={(e) => setFilters({...filters, month: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
                  >
                    <option value="">Todos</option>
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{new Date(0, m-1).toLocaleString('es-ES', {month: 'long'})}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Semana</label>
                  <select 
                    value={filters.week}
                    onChange={(e) => setFilters({...filters, week: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white"
                  >
                    <option value="">Todas</option>
                    {[1,2,3,4,5].map(w => <option key={w} value={w}>Semana {w}</option>)}
                  </select>
                </div>
              </div>
            )}

            {activeReport === 'year_ago' && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 text-center">
                        Este informe generará datos de hace exactamente un año (fecha actual), incluyendo un rango de <strong>3 días antes y 3 días después</strong>.
                    </p>
                </div>
            )}

          </div>

          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-[2rem] flex gap-3">
            <button 
              onClick={() => setActiveReport(null)}
              className="flex-1 py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleGenerate}
              disabled={filters.programs.length === 0}
              className="flex-[2] py-3.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown size={18} /> Generar Informe
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pb-20">
      <div className="text-center mb-10 space-y-2">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white">Centro de Informes Globales</h2>
        <p className="text-slate-500 dark:text-slate-400">Genera documentos detallados de toda la programación.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Temas por Mes */}
        <button onClick={() => setActiveReport('month')} className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-sm hover:shadow-xl transition-all text-left">
          <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
            <Calendar size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Temas por Mes</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Resumen mensual de temáticas abordadas. Filtra por año y programas.</p>
        </button>

        {/* Temáticas Repetidas */}
        <button onClick={() => setActiveReport('repeated')} className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-sm hover:shadow-xl transition-all text-left">
          <div className="bg-amber-100 dark:bg-amber-900/30 w-12 h-12 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 group-hover:scale-110 transition-transform">
            <Repeat size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Temáticas Repetidas</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Detecta repeticiones de temas en un año específico entre programas seleccionados.</p>
        </button>

        {/* Temas por Programas (Detallado) */}
        <button onClick={() => setActiveReport('program')} className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all text-left">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
            <Layers size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Temas por Programas</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Informe detallado filtrado por programa, año, mes y semana.</p>
        </button>

        {/* Un año atrás */}
        <button onClick={() => setActiveReport('year_ago')} className="group bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 shadow-sm hover:shadow-xl transition-all text-left">
          <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 group-hover:scale-110 transition-transform">
            <BarChart3 size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Temas un año atrás</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Consulta histórica del día en curso hace un año (+/- 3 días).</p>
        </button>
      </div>

      {renderModal()}
    </div>
  );
};