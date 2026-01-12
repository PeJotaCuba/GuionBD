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

  const programData = useMemo(() => {
    const counts: Record<string, number> = {};
    scripts.forEach(s => {
      counts[s.genre] = (counts[s.genre] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [scripts]);

  // Fix: Added explicit CSS for word wrapping in the generated HTML table
  const downloadReport = (filename: string, title: string, headers: string[], rows: (string | number)[][]) => {
    const tableHeader = headers.map(h => 
      `<th style="border:1px solid #000; padding: 8px; background-color: #f3f4f6; text-align: left; font-size: 11px;">${h}</th>`
    ).join('');
    
    const tableBody = rows.map(row => 
      `<tr>${row.map(cell => 
        `<td style="border:1px solid #000; padding: 8px; vertical-align: top; word-wrap: break-word; font-size: 11px;">${cell}</td>`
      ).join('')}</tr>`
    ).join('');

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${title}</title></head>
      <body style="font-family: Arial, sans-serif;">
        <h2 style="text-align:center; color: #4338ca;">${title}</h2>
        <p style="text-align:center; font-size: 10px; color: #666;">Generado por GuionBD el ${new Date().toLocaleDateString()}</p>
        <br/>
        <table style="width:100%; border-collapse: collapse; border: 1px solid #000; table-layout: fixed;">
          <colgroup>
            <col style="width: 20%;">
            <col style="width: 30%;">
            <col style="width: 50%;">
          </colgroup>
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

  const downloadRepeatedThemes = () => {
    const themeCounts: Record<string, number> = {};
    scripts.forEach(s => s.themes.forEach(t => themeCounts[t] = (themeCounts[t] || 0) + 1));
    const repeatedThemes = Object.keys(themeCounts).filter(t => themeCounts[t] > 1);
    
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

    rows.sort((a, b) => a[2].localeCompare(b[2]) || a[0].localeCompare(b[0]));
    downloadReport('Tematicas_Repetidas', 'Informe de Temáticas Repetidas', ['Fecha', 'Programa', 'Temática'], rows);
  };

  const downloadOneYearAgo = () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const targetYear = oneYearAgo.getFullYear();

    const rows = scripts
      .filter(s => new Date(s.dateAdded).getFullYear() === targetYear)
      .map(s => [
        new Date(s.dateAdded).toLocaleDateString(),
        s.genre,
        s.title 
      ]);
    
    downloadReport('Temas_Ano_Atras', `Temas Año ${targetYear}`, ['Fecha', 'Programa', 'Tema'], rows);
  };

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
        if (a[1] !== b[1]) return (b[1] as number) - (a[1] as number); 
        return 0; 
    });

    // Modified headers for month report
    const headers = ['Mes', 'Año', 'Programa', 'Temática'];
     const tableHeader = headers.map(h => 
      `<th style="border:1px solid #000; padding: 8px; background-color: #f3f4f6; text-align: left; font-size: 11px;">${h}</th>`
    ).join('');
    
    const tableBody = rows.map(row => 
      `<tr>${row.map(cell => 
        `<td style="border:1px solid #000; padding: 8px; vertical-align: top; word-wrap: break-word; font-size: 11px;">${cell}</td>`
      ).join('')}</tr>`
    ).join('');

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Informe Mensual</title></head>
      <body style="font-family: Arial, sans-serif;">
        <h2 style="text-align:center; color: #4338ca;">Temas por Meses</h2>
        <table style="width:100%; border-collapse: collapse; border: 1px solid #000;">
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
    link.download = `Temas_Por_Meses.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      <div className="flex flex-col items-center justify-center h-40 text-slate-400">
        <p>No hay datos para informes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Chart */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Guiones por Programa</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={programData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {programData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Download Options */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Table size={18} className="text-indigo-500" />
          Descargar Informes (.doc)
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={downloadRepeatedThemes} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <span className="font-medium text-xs">Temáticas Repetidas</span>
            <FileDown size={16} className="text-slate-400" />
          </button>

          <button onClick={downloadOneYearAgo} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <span className="font-medium text-xs">Temas un año atrás</span>
            <FileDown size={16} className="text-slate-400" />
          </button>

          <button onClick={downloadThemesByMonth} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <span className="font-medium text-xs">Temas por Meses</span>
            <FileDown size={16} className="text-slate-400" />
          </button>

          <button onClick={downloadThemesByProgram} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <span className="font-medium text-xs">Temas por Programa</span>
            <FileDown size={16} className="text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};