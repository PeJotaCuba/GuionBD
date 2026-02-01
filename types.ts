export type ScriptStatus = 'active' | 'inactive';
export type UserRole = 'Administrador' | 'Guionista' | 'Asesor' | 'Director';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  fullName: string;
  mobile: string;
  allowedPrograms?: string[]; // Solo para Guionistas
}

export interface ScriptAnalysis {
  title: string;
  summary: string;
  genre: string;
  themes: string[];
  tone: string;
  writer?: string;
  advisor?: string;
}

export interface Script extends ScriptAnalysis {
  id: string;
  content: string;
  dateAdded: string;
  status: ScriptStatus;
  wordCount: number;
}

export interface ChartData {
  name: string;
  value: number;
}