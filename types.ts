export type ScriptStatus = 'active' | 'inactive';

export interface ScriptAnalysis {
  title: string;
  summary: string;
  genre: string;
  themes: string[];
  tone: string;
}

export interface Script extends ScriptAnalysis {
  id: string;
  content: string; // The full text content
  dateAdded: string; // ISO string
  status: ScriptStatus;
  wordCount: number;
}

export interface ChartData {
  name: string;
  value: number;
}
