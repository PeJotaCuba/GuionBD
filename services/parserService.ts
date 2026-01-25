import { Script, ScriptStatus } from "../types";

const MONTHS: Record<string, number> = {
  ENERO: 0, FEBRERO: 1, MARZO: 2, ABRIL: 3, MAYO: 4, JUNIO: 5,
  JULIO: 6, AGOSTO: 7, SEPTIEMBRE: 8, OCTUBRE: 9, NOVIEMBRE: 10, DICIEMBRE: 11
};

export const parseScriptsFromText = (text: string, status: ScriptStatus): Script[] => {
  const entries = text.split(/-{5,}/).map(e => e.trim()).filter(e => e);
  
  return entries.map(entry => {
    // Extraer campos
    const programaMatch = entry.match(/PROGRAMA:\s*([^:\n]+?)(?:\s+(?:EMISIÓN|ESCRIBE|ARCHIVO|FECHA|TEMA):|$|\n)/i);
    const archivoMatch = entry.match(/Archivo:\s*(.+)/i);
    const fechaMatch = entry.match(/Fecha:\s*(.+)/i);
    const temaMatch = entry.match(/Tema:\s*(.+)/i);

    // Limpiar nombre del programa (quitar numeración inicial "1. ", "2. ", etc)
    let programa = "Desconocido";
    if (programaMatch) {
       programa = programaMatch[1].replace(/^\d+\.\s*/, '').trim();
       // Opcional: Capitalizar primera letra de cada palabra para visualización
       programa = programa.charAt(0).toUpperCase() + programa.slice(1);
    }
    
    const archivo = archivoMatch ? archivoMatch[1].trim() : "";
    
    // Parseo de fecha
    const rawFecha = fechaMatch ? fechaMatch[1].trim() : "";
    let dateAdded = new Date().toISOString();
    
    try {
        const dayMatch = rawFecha.match(/(\d{1,2})/);
        const yearMatch = rawFecha.match(/(\d{4})/);
        const monthNames = Object.keys(MONTHS).join("|");
        const monthMatch = rawFecha.toUpperCase().match(new RegExp(`(${monthNames})`));

        if (dayMatch && yearMatch && monthMatch) {
            const day = parseInt(dayMatch[1]);
            const year = parseInt(yearMatch[1]);
            const month = MONTHS[monthMatch[1]];
            const d = new Date(year, month, day);
            if (!isNaN(d.getTime())) {
              dateAdded = d.toISOString();
            }
        }
    } catch (e) {
        console.warn("Date parse error", rawFecha);
    }

    const tema = temaMatch ? temaMatch[1].trim() : "Sin Tema";

    // Generar pseudo-temas para búsqueda
    const ignoredWords = ['DE', 'LA', 'EL', 'EN', 'Y', 'LOS', 'LAS', 'DEL', 'UN', 'UNA', 'PARA', 'POR', 'CON', 'SOBRE', 'SUS', 'LAS'];
    const themes = tema
      .split(/[\s,.:;]+/)
      .filter(w => w.length > 3 && !ignoredWords.includes(w.toUpperCase()))
      .slice(0, 5); 

    return {
      id: crypto.randomUUID(),
      title: tema,
      genre: programa,
      summary: archivo ? `Archivo: ${archivo}` : "Sin archivo asociado",
      content: entry, 
      themes: themes.length > 0 ? themes : ["General"],
      tone: "Informativo",
      dateAdded,
      status,
      wordCount: entry.split(/\s+/).length
    };
  });
};