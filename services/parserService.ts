import { Script, ScriptStatus, User } from "../types";

const MONTHS: Record<string, number> = {
  ENERO: 0, ANERO: 0, FEBRERO: 1, MARZO: 2, ABRIL: 3, MAYO: 4, JUNIO: 5,
  JULIO: 6, AGOSTO: 7, SEPTIEMBRE: 8, OCTUBRE: 9, NOVIEMBRE: 10, DICIEMBRE: 11
};

export const parseScriptsFromText = (text: string, status: ScriptStatus): Script[] => {
  // Separar por el marcador >>> que indica el inicio de cada entrada
  const entries = text.split(/>>>/).map(e => e.trim()).filter(e => e);
  
  return entries.map(entry => {
    // Marcadores de inicio de campo
    const markers = ["Programa:", "Fecha:", "Escritor:", "Asesor:", "Tema:"];
    
    // Función para extraer contenido entre marcadores de forma segura
    const getField = (name: string) => {
      const startIdx = entry.indexOf(name);
      if (startIdx === -1) return "";
      
      const contentStart = startIdx + name.length;
      let endIdx = entry.length;
      
      // El final del campo es el inicio del siguiente marcador o el final de la cadena
      markers.forEach(m => {
        const mIdx = entry.indexOf(m, contentStart);
        if (mIdx !== -1 && mIdx < endIdx) {
          endIdx = mIdx;
        }
      });
      
      return entry.slice(contentStart, endIdx).trim();
    };

    let programa = getField('Programa:');
    let escritor = getField('Escritor:');
    let asesor = getField('Asesor:');
    let tema = getField('Tema:');
    const rawFecha = getField('Fecha:');

    // Si el programa dice "NO ESPECIFICADO", intentamos buscarlo en la cabecera (primera línea)
    if (!programa || programa.toUpperCase().includes("NO ESPECIFICADO")) {
      const header = entry.split('\n')[0].toUpperCase();
      // Buscamos siglas comunes o nombres en el nombre del archivo
      if (header.includes("BDB")) programa = "BUENOS DÍAS BAYAMO";
      else if (header.includes("TC")) programa = "TODOS EN CASA";
      else if (header.includes("PJ")) programa = "PARADA JOVEN";
      else if (header.includes("AB")) programa = "ARTE BAYAMO";
    }
    
    // Limpieza específica para "Asesor"
    if (asesor) {
      // Intentar extraer el nombre después de "por" o "es" (manejando errores de espacio como LisellFontelo)
      const nameMatch = asesor.match(/(?:por|es)\s*([A-Z][a-zñáéíóú]+\s*[A-Z][a-zñáéíóú]+(?:\s*[A-Z][a-zñáéíóú]+)?)/i);
      if (nameMatch) {
        asesor = nameMatch[1].trim();
      } else {
        // Limpiar puntos iniciales y tomar hasta la primera coma o salto de línea
        asesor = asesor.replace(/^[.\s]+/, '').split(/[,\n]/)[0].trim();
      }
    }

    // Limpieza de Escritor
    escritor = escritor.replace(/^[:\s.-]+/, '').trim();
    
    // Limpieza de Programa (eliminar prefijos basura)
    programa = programa.replace(/^(PROG\.?\s*|BOLETIN\s*\d*\s*|de trabajo de\s*)/i, '').trim();

    let dateAdded = new Date().toISOString();
    
    try {
        const cleanFecha = rawFecha.toUpperCase().replace(/\./g, ' ').replace(/\s+/g, ' ');
        const dayMatch = cleanFecha.match(/(\d{1,2})/);
        const yearMatch = cleanFecha.match(/(\d{4})/);
        const monthNames = Object.keys(MONTHS).join("|");
        const monthMatch = cleanFecha.match(new RegExp(`(${monthNames})`));

        if (dayMatch && yearMatch && monthMatch) {
            const day = parseInt(dayMatch[1]);
            const year = parseInt(yearMatch[1]);
            const month = MONTHS[monthMatch[1]];
            const d = new Date(year, month, day);
            if (!isNaN(d.getTime())) {
              dateAdded = d.toISOString();
            }
        } else if (rawFecha.includes('/')) {
            const parts = rawFecha.replace(/[^\d/]/g, '').split('/');
            if (parts.length === 3) {
                const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                if (!isNaN(d.getTime())) dateAdded = d.toISOString();
            }
        }
    } catch (e) {
        console.warn("Error parseando fecha:", rawFecha);
    }

    const themes = (tema || "")
      .split(/[\s,.:;]+/)
      .filter(w => w.length > 3 && !['PARA', 'DELL', 'ESTA', 'COMO', 'UNOS', 'COMO'].includes(w.toUpperCase()))
      .slice(0, 5); 

    return {
      id: crypto.randomUUID(),
      title: tema ? tema.replace(/^[,.\s]+/, '').trim() : "Sin Tema",
      genre: programa || "OTRO",
      summary: `Escritor: ${escritor || 'N/A'} | Asesor: ${asesor || 'N/A'}`,
      writer: escritor || "N/A",
      advisor: asesor || "N/A",
      content: entry, 
      themes: themes.length > 0 ? themes : ["General"],
      tone: "Informativo",
      dateAdded,
      status,
      wordCount: entry.split(/\s+/).length
    };
  });
};

export const parseUsersFromText = (text: string): User[] => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l && l.includes(':'));
  
  return lines.map(line => {
    const fullName = line.match(/Nombre completo:\s*([^,]+)/)?.[1]?.trim() || "";
    const username = line.match(/Nombre de usuario:\s*([^,]+)/)?.[1]?.trim() || "";
    const mobile = line.match(/Número de móvil:\s*([^,]+)/)?.[1]?.trim() || "";
    const password = line.match(/Contraseña:\s*(.+)/)?.[1]?.trim() || "";

    return {
      id: username === 'admin' ? 'admin' : crypto.randomUUID(),
      fullName,
      username,
      mobile,
      password,
      role: username === 'admin' ? 'Administrador' : 'Guionista',
      allowedPrograms: []
    };
  });
};