import { Script, ScriptStatus, User, UserRole } from "../types";

const MONTHS: Record<string, number> = {
  ENERO: 0, FEBRERO: 1, MARZO: 2, ABRIL: 3, MAYO: 4, JUNIO: 5,
  JULIO: 6, AGOSTO: 7, SEPTIEMBRE: 8, OCTUBRE: 9, NOVIEMBRE: 10, DICIEMBRE: 11
};

export const parseScriptsFromText = (text: string, status: ScriptStatus): Script[] => {
  // Separar por líneas de guiones o entradas claras (asumimos separador de líneas vacías o guiones)
  const entries = text.split(/-{5,}/).map(e => e.trim()).filter(e => e);
  
  return entries.map(entry => {
    const programaMatch = entry.match(/Programa:\s*(.+)/i);
    const fechaMatch = entry.match(/Fecha:\s*(.+)/i);
    const escritorMatch = entry.match(/Escritor:\s*(.+)/i);
    const asesorMatch = entry.match(/Asesor:\s*(.+)/i);
    const temaMatch = entry.match(/Tema:\s*(.+)/i);

    const programa = programaMatch ? programaMatch[1].trim() : "Desconocido";
    const escritor = escritorMatch ? escritorMatch[1].trim() : "N/A";
    const asesor = asesorMatch ? asesorMatch[1].trim() : "N/A";
    const tema = temaMatch ? temaMatch[1].trim() : "Sin Tema";
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
        } else if (rawFecha.includes('/')) {
            const parts = rawFecha.split('/');
            if (parts.length === 3) {
                const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                if (!isNaN(d.getTime())) dateAdded = d.toISOString();
            }
        }
    } catch (e) {
        console.warn("Error parseando fecha:", rawFecha);
    }

    const themes = tema
      .split(/[\s,.:;]+/)
      .filter(w => w.length > 3)
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