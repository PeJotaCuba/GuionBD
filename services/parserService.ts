import { Script, ScriptStatus, User } from "../types";

const MONTHS: Record<string, number> = {
  ENERO: 0, FEBRERO: 1, MARZO: 2, ABRIL: 3, MAYO: 4, JUNIO: 5,
  JULIO: 6, AGOSTO: 7, SEPTIEMBRE: 8, OCTUBRE: 9, NOVIEMBRE: 10, DICIEMBRE: 11
};

export const parseScriptsFromText = (text: string, status: ScriptStatus): Script[] => {
  // Separar por el marcador >>> que indica el inicio de cada entrada de archivo
  const entries = text.split(/>>>/).map(e => e.trim()).filter(e => e);
  
  return entries.map(entry => {
    // Función auxiliar para extraer campos de forma robusta
    const getField = (name: string) => {
      const regex = new RegExp(`${name}:\\s*(.+?)(?=\\n|Escritor:|Asesor:|Tema:|Fecha:|Programa:|$)`, 'i');
      const match = entry.match(regex);
      return match ? match[1].trim() : "";
    };

    const programa = getField('Programa') || "NO ESPECIFICADO";
    const escritor = getField('Escritor') || "NO ESPECIFICADO";
    const asesor = getField('Asesor') || "NO ESPECIFICADO";
    const tema = getField('Tema') || "Sin Tema";
    const rawFecha = getField('Fecha') || "";
    
    let dateAdded = new Date().toISOString();
    
    try {
        const upperFecha = rawFecha.toUpperCase();
        const dayMatch = upperFecha.match(/(\d{1,2})/);
        const yearMatch = upperFecha.match(/(\d{4})/);
        const monthNames = Object.keys(MONTHS).join("|");
        const monthMatch = upperFecha.match(new RegExp(`(${monthNames})`));

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

    // Extraer palabras clave del tema para tags
    const themes = tema
      .split(/[\s,.:;]+/)
      .filter(w => w.length > 3 && !['PARA', 'DELL', 'ESTA', 'COMO'].includes(w.toUpperCase()))
      .slice(0, 5); 

    return {
      id: crypto.randomUUID(),
      title: tema,
      genre: programa,
      summary: `Escritor: ${escritor} | Asesor: ${asesor}`,
      writer: escritor,
      advisor: asesor,
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