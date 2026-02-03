import { Script, ScriptStatus, User } from "../types";

const MONTHS: Record<string, number> = {
  ENERO: 0, FEBRERO: 1, MARZO: 2, ABRIL: 3, MAYO: 4, JUNIO: 5,
  JULIO: 6, AGOSTO: 7, SEPTIEMBRE: 8, OCTUBRE: 9, NOVIEMBRE: 10, DICIEMBRE: 11
};

export const parseScriptsFromText = (text: string, status: ScriptStatus): Script[] => {
  // Separar por el marcador ____ (4 o más guiones bajos)
  const entries = text.split(/_{4,}/).map(e => e.trim()).filter(e => e);
  
  return entries.map(entry => {
    // Función auxiliar para extraer el valor de un campo
    const extractField = (label: string): string => {
      const regex = new RegExp(`${label}\\s*:?\\s*(.*?)(?=(?:\\n|$))`, 'i');
      const match = entry.match(regex);
      return match ? match[1].trim() : "";
    };

    // Extraer campos principales
    let programa = extractField("Programa");
    let fechaRaw = extractField("Fecha");
    let escritor = extractField("Escritor");
    let asesor = extractField("Asesor");
    let tema = extractField("Tema");

    // Limpieza de campos si vienen vacíos o con datos residuales
    // Buscar multilinea para Tema si es muy largo y no capturó todo
    if (!tema) {
       const temaMatch = entry.match(/Tema:\s*([\s\S]*?)(?=$)/i);
       if (temaMatch) tema = temaMatch[1].trim();
    }

    // Si el programa no está especificado o es genérico, intentar deducirlo
    if (!programa || programa.toUpperCase().includes("NO ESPECIFICADO")) {
      if (entry.toUpperCase().includes("BDB")) programa = "BUENOS DÍAS BAYAMO";
      else if (entry.toUpperCase().includes("HCJ")) programa = "HABLANDO CON JUANA";
    }

    // Procesamiento de Fecha
    let dateAdded = new Date().toISOString();
    if (fechaRaw) {
      // Normalizar fecha (quitar "DE", ".", espacios extra)
      const cleanDate = fechaRaw.toUpperCase()
        .replace(/\./g, '')
        .replace(/,/g, '')
        .replace(/\s+DE\s+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Intentar patrón: DIA MES AÑO (ej: 01 ABRIL 2024)
      const parts = cleanDate.split(' ');
      let day, month, year;

      for (const part of parts) {
        if (!isNaN(parseInt(part))) {
          const num = parseInt(part);
          if (num > 31) year = num;
          else if (!day) day = num;
        } else {
          // Buscar mes
          const monthKey = Object.keys(MONTHS).find(m => part.includes(m));
          if (monthKey) month = MONTHS[monthKey];
        }
      }

      if (day !== undefined && month !== undefined && year !== undefined) {
        // Fijar a las 12:00 del mediodía para evitar problemas de zona horaria
        const d = new Date(year, month, day, 12, 0, 0);
        if (!isNaN(d.getTime())) {
          dateAdded = d.toISOString();
        }
      }
    }

    // Procesamiento de Temas (Tags)
    const themes = (tema || "")
      .split(/[\s,.:;]+/)
      .filter(w => w.length > 3 && !['PARA', 'SOBRE', 'COMO', 'CUANDO', 'DONDE', 'ESTE', 'ESTA'].includes(w.toUpperCase()))
      .slice(0, 5);

    return {
      id: crypto.randomUUID(),
      title: tema || "Sin Tema",
      genre: programa || "OTRO",
      summary: `Escritor: ${escritor || 'N/A'} | Asesor: ${asesor || 'N/A'}`,
      writer: escritor || "",
      advisor: asesor || "",
      content: entry,
      themes: themes.length > 0 ? themes : ["General"],
      tone: "Informativo",
      dateAdded,
      status,
      wordCount: entry.split(/\s+/).length
    };
  }).filter(s => s.title !== "Sin Tema"); // Filtrar entradas vacías si quedaron
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