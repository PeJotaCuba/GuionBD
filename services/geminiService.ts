// This service has been deprecated as per the request to remove AI functionalities.
// It is kept as a placeholder to avoid breaking file structure expectations if any.

import { ScriptAnalysis, Script } from "../types";

export const analyzeScriptContent = async (text: string): Promise<ScriptAnalysis> => {
  console.warn("AI Analysis is disabled.");
  return {
    title: "Sin Título (AI Desactivada)",
    summary: "Análisis automático desactivado.",
    genre: "General",
    themes: ["General"],
    tone: "Neutro"
  };
};

export const generateGlobalReport = async (scripts: Script[]): Promise<string> => {
  console.warn("AI Reporting is disabled.");
  return "La generación de informes con IA está desactivada.";
};
