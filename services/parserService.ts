import { Script, ScriptStatus } from "../types";

const MONTHS: Record<string, number> = {
  ENERO: 0, FEBRERO: 1, MARZO: 2, ABRIL: 3, MAYO: 4, JUNIO: 5,
  JULIO: 6, AGOSTO: 7, SEPTIEMBRE: 8, OCTUBRE: 9, NOVIEMBRE: 10, DICIEMBRE: 11
};

export const parseScriptsFromText = (text: string, status: ScriptStatus): Script[] => {
  // Split by the separator line defined in the sample
  const entries = text.split(/-{5,}/).map(e => e.trim()).filter(e => e);
  
  return entries.map(entry => {
    // Extract fields using Regex
    // Matches "PROGRAMA: Value" until newline or another keyword like "EMISIÓN:"
    const programaMatch = entry.match(/PROGRAMA:\s*([^:\n]+?)(?:\s+(?:EMISIÓN|ESCRIBE|ARCHIVO|FECHA|TEMA):|$|\n)/i);
    const archivoMatch = entry.match(/Archivo:\s*(.+)/i);
    const fechaMatch = entry.match(/Fecha:\s*(.+)/i);
    const temaMatch = entry.match(/Tema:\s*(.+)/i);

    // Clean up Program Name (remove "1. ", etc)
    const rawPrograma = programaMatch ? programaMatch[1].trim() : "Desconocido";
    const programa = rawPrograma.replace(/^\d+\.\s*/, '').trim();
    
    const archivo = archivoMatch ? archivoMatch[1].trim() : "";
    
    // Clean up Date
    const rawFecha = fechaMatch ? fechaMatch[1].trim() : "";
    let dateAdded = new Date().toISOString();
    
    // Parse Spanish Date
    try {
        const dayMatch = rawFecha.match(/(\d{1,2})/);
        const yearMatch = rawFecha.match(/(\d{4})/);
        const monthNames = Object.keys(MONTHS).join("|");
        const monthMatch = rawFecha.toUpperCase().match(new RegExp(`(${monthNames})`));

        if (dayMatch && yearMatch && monthMatch) {
            const day = parseInt(dayMatch[1]);
            const year = parseInt(yearMatch[1]);
            const month = MONTHS[monthMatch[1]];
            // Create date object
            const d = new Date(year, month, day);
            // Check if valid
            if (!isNaN(d.getTime())) {
              dateAdded = d.toISOString();
            }
        }
    } catch (e) {
        console.warn("Date parse error", rawFecha);
    }

    const tema = temaMatch ? temaMatch[1].trim() : "Sin Tema";

    // Generate pseudo-themes from the topic title for searching
    const ignoredWords = ['DE', 'LA', 'EL', 'EN', 'Y', 'LOS', 'LAS', 'DEL', 'UN', 'UNA', 'PARA', 'POR', 'CON', 'SOBRE'];
    const themes = tema
      .split(/[\s,.:;]+/)
      .filter(w => w.length > 3 && !ignoredWords.includes(w.toUpperCase()))
      .slice(0, 5); // Take top 5 keywords

    return {
      id: crypto.randomUUID(),
      title: tema,
      genre: programa || "General",
      summary: archivo ? `Archivo: ${archivo}` : "Sin archivo asociado",
      content: entry, // Store the full record text
      themes: themes.length > 0 ? themes : ["General"],
      tone: "Informativo",
      dateAdded,
      status,
      wordCount: entry.split(/\s+/).length
    };
  });
};
