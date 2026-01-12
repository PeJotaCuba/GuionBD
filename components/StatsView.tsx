import React, { useMemo } from 'react';
import { Script } from '../types';
import { 
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer 
} from 'recharts';
import { FileDown, Table } from 'lucide-react';

interface StatsViewProps {
  scripts: Script[];
}

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#22c55e'];

export const StatsView: React.FC<StatsViewProps> = ({ scripts }) => {

  // Pie chart data: Scripts per program
  const programData = useMemo(() => {
    const counts: Record<string, number> = {};
    scripts.forEach(s => {
      counts[s.genre] = (counts[s.genre] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [scripts]);

  // Helper to generate and download fake docx (HTML string with .doc extension)
  const downloadReport = (filename: string, title: string, headers: string[], rows: (string | number)[][]) => {
    const tableHeader = headers.map(h => `<th style="border:1px solid #000; padding: 8px; background-color: #f3f4f6;">${h}</th>`).join('');
    const tableBody = rows.map(row => 
      `<tr>${row.map(cell => `<td style="border:1px solid #000; padding: 8px;">${cell}</td>`).join('')}</tr>`
    ).join('');

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${title}</title></head>
      <body style="font-family: Arial, sans-serif;">
        <h1 style="text-align:center; color: #4338ca;">${title}</h1>
        <p style="text-align:center;">Generado por GuionBD el ${new Date().toLocaleDateString()}</p>
        <br/>
        <table style="width:100%; border-collapse: collapse; border: 1px solid #000;">
          <thead><tr>${tableHeader}</tr></thead>
          <tbody>${tableBody}</tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Temáticas Repetidas (Fecha, Programa, Temática)
  const downloadRepeatedThemes = () => {
    const themeCounts: Record<string, number> = {};
    scripts.forEach(s => s.themes.forEach(t => themeCounts[t] = (themeCounts[t] || 0) + 1));
    const repeatedThemes = Object.keys(themeCounts).filter(t => themeCounts[t] > 1);
    
    // Find scripts containing these themes
    const rows: string[][] = [];
    scripts.forEach(s => {
      s.themes.forEach(t => {
        if (repeatedThemes.includes(t)) {
          rows.push([
            new Date(s.dateAdded).toLocaleDateString(),
            s.genre,
            t
          ]);
        }
      });
    });

    // Sort by theme then date
    rows.sort((a, b) => a[2].localeCompare(b[2]) || a[0].localeCompare(b[0]));
    
    downloadReport('Tematicas_Repetidas', 'Informe de Temáticas Repetidas', ['Fecha', 'Programa', 'Temática'], rows);
  };

  // 2. Temas un año atrás (Día, Programa, Tema)
  const downloadOneYearAgo = () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const targetYear = oneYearAgo.getFullYear();

    const rows = scripts
      .filter(s => new Date(s.dateAdded).getFullYear() === targetYear)
      .map(s => [
        new Date(s.dateAdded).getDate(), // Day
        s.genre,
        s.title // Assuming title is main Theme as per data structure
      ]);
    
    downloadReport('Temas_Ano_Atras', `Temas Año ${targetYear}`, ['Día', 'Programa', 'Tema'], rows);
  };

  // 3. Temas por meses (Mes, Año, Programa, Temática)
  const downloadThemesByMonth = () => {
    const rows = scripts.map(s => {
      const d = new Date(s.dateAdded);
      const month = d.toLocaleString('es-ES', { month: 'long' });
      return [
        month.charAt(0).toUpperCase() + month.slice(1),
        d.getFullYear(),
        s.genre,
        s.title
      ];
    }).sort((a, b) => {
        if (a[1] !== b[1]) return (b[1] as number) - (a[1] as number); // Year desc
        return 0; // Simplified sort
    });

    downloadReport('Temas_Por_Meses', 'Informe de Temas por Meses', ['Mes', 'Año', 'Programa', 'Temática'], rows);
  };

  // 4. Temas por programas (Programa, Fecha, Temática)
  const downloadThemesByProgram = () => {
    const rows = scripts.map(s => [
      s.genre,
      new Date(s.dateAdded).toLocaleDateString(),
      s.title
    ]).sort((a, b) => a[0].localeCompare(b[0]));

    downloadReport('Temas_Por_Programas', 'Informe de Temas por Programa', ['Programa', 'Fecha', 'Temática'], rows);
  };


  if (scripts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <p>No hay datos suficientes para generar informes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart: Programas por Cantidad */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Guiones por Programa</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={programData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={3}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {programData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Download Options */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <Table size={20} className="text-indigo-500" />
            Descargar Tablas (.docx)
          </h3>
          
          <div className="space-y-3">
            <button 
              onClick={downloadRepeatedThemes}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 group"
            >
              <span className="font-medium text-sm">Temáticas Repetidas</span>
              <FileDown size={18} className="text-slate-400 group-hover:text-indigo-500" />
            </button>

            <button 
              onClick={downloadOneYearAgo}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 group"
            >
              <span className="font-medium text-sm">Temas un año atrás</span>
              <FileDown size={18} className="text-slate-400 group-hover:text-indigo-500" />
            </button>

            <button 
              onClick={downloadThemesByMonth}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 group"
            >
              <span className="font-medium text-sm">Temas por Meses</span>
              <FileDown size={18} className="text-slate-400 group-hover:text-indigo-500" />
            </button>

            <button 
              onClick={downloadThemesByProgram}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 group"
            >
              <span className="font-medium text-sm">Temas por Programa</span>
              <FileDown size={18} className="text-slate-400 group-hover:text-indigo-500" />
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-xs text-yellow-800 dark:text-yellow-200 border border-yellow-100 dark:border-yellow-900/30">
             Nota: Los archivos se descargarán con extensión .doc y pueden ser abiertos por Microsoft Word. Contienen tablas con la información solicitada.
          </div>
        </div>

      </div>
    </div>
  );
};
