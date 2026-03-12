export type ScriptStatus = 'active' | 'inactive';

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