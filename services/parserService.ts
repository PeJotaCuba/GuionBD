import { Script, ScriptStatus, User } from "../types";

const MONTHS: Record<string, number> = {
  ENERO: 0, FEBRERO: 1, MARZO: 2, ABRIL: 3, MAYO: 4, JUNIO: 5,
  JULIO: 6, AGOSTO: 7, SEPTIEMBRE: 8, OCTUBRE: 9, NOVIEMBRE: 10, DICIEMBRE: 11
};

// Función auxiliar para limpiar texto
const cleanText = (text: string) => text ? text.trim().replace(/^[:\.\-]\s*/, '').trim() : "";

export const parseRawEntry = (entry: string, defaultStatus: ScriptStatus): Script | null => {
  if (!entry || entry.trim().length < 10) return null;

  const lines = entry.split('\n').map(l => l.trim()).filter(l => l);
  
  let programa = "";
  let fechaRaw = "";
  let escritor = "";
  let asesor = "";
  let tema = "";
  let contentBuffer = "";

  // Estrategia: Buscar línea por línea las palabras clave
  // Si no encuentra clave, asume que es continuación del campo anterior (para Temas largos)
  let currentField = ""; 

  lines.forEach(line => {
    const upperLine = line.toUpperCase();

    if (upperLine.startsWith("PROGRAMA")) {
      programa = cleanText(line.substring(line.indexOf(":") + 1));
      currentField = "programa";
    } else if (upperLine.startsWith("FECHA")) {
      fechaRaw = cleanText(line.substring(line.indexOf(":") + 1));
      currentField = "fecha";
    } else if (upperLine.startsWith("ESCRITOR") || upperLine.startsWith("ESCRIBE")) {
      escritor = cleanText(line.substring(line.indexOf(":") + 1));
      currentField = "escritor";
    } else if (upperLine.startsWith("ASESOR") || upperLine.startsWith("ASESORA")) {
      asesor = cleanText(line.substring(line.indexOf(":") + 1));
      currentField = "asesor";
    } else if (upperLine.startsWith("TEMA")) {
      tema = cleanText(line.substring(line.indexOf(":") + 1));
      currentField = "tema";
    } else {
      // Línea sin etiqueta, agregar al campo actual (útil para temas de varias líneas)
      if (currentField === "tema") {
        tema += " " + line;
      }
    }
    contentBuffer += line + "\n";
  });

  // Limpieza final de valores
  if (!tema) tema = "Sin Título";
  
  // Procesamiento de Fecha
  let dateAdded = new Date().toISOString();
  if (fechaRaw) {
    const cleanDate = fechaRaw.toUpperCase()
      .replace(/\./g, '')
      .replace(/,/g, '')
      .replace(/\s+DE\s+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const parts = cleanDate.split(' ');
    let day, month, year;

    for (const part of parts) {
      if (!isNaN(parseInt(part))) {
        const num = parseInt(part);
        if (num > 31) year = num;
        else if (!day) day = num;
      } else {
        const monthKey = Object.keys(MONTHS).find(m => part.includes(m));
        if (monthKey) month = MONTHS[monthKey];
      }
    }

    if (day !== undefined && month !== undefined && year !== undefined) {
      const d = new Date(year, month, day, 12, 0, 0);
      if (!isNaN(d.getTime())) {
        dateAdded = d.toISOString();
      }
    }
  }

  // Tags
  const themes = tema
    .split(/[\s,.:;]+/)
    .filter(w => w.length > 3 && !['PARA', 'SOBRE', 'COMO', 'CUANDO', 'DONDE', 'ESTE', 'ESTA', 'LOS', 'LAS'].includes(w.toUpperCase()))
    .slice(0, 5);

  return {
    id: crypto.randomUUID(),
    title: tema,
    genre: programa || "OTRO",
    summary: `Escritor: ${escritor || 'N/A'} | Asesor: ${asesor || 'N/A'}`,
    writer: escritor,
    advisor: asesor,
    content: contentBuffer,
    themes: themes.length > 0 ? themes : ["General"],
    tone: "Informativo",
    dateAdded,
    status: defaultStatus,
    wordCount: contentBuffer.split(/\s+/).length
  };
};

export const parseScriptsFromText = (text: string, status: ScriptStatus): Script[] => {
  // Separar por el marcador ____ (4 o más guiones bajos)
  const rawEntries = text.split(/_{4,}/);
  const scripts: Script[] = [];

  for (const raw of rawEntries) {
    const script = parseRawEntry(raw, status);
    if (script) {
      scripts.push(script);
    }
  }
  
  return scripts;
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