
import { GoogleGenAI, Type } from "@google/genai";
import { MissionDifficulty } from "../types";

// The execution environment is expected to provide environment variables via process.env.
// For this to work in a browser environment, a build tool must replace these variables.
declare const process: any;

const API_KEY = process.env.API_KEY;

// Initialize the AI client only if the API key is available.
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

if (!ai) {
  // This error is critical for developers during setup.
  console.error("CRITICAL: API_KEY environment variable not set. Gemini API calls will fail.");
}

export interface GeneratedMissionData {
  title: string;
  description: string;
  difficulty: MissionDifficulty;
  xp: number;
  skills: string[];
}

export const generateMissionIdea = async (keywords: string): Promise<GeneratedMissionData> => {
  // Throw an error if the AI client could not be initialized.
  if (!ai) {
    throw new Error("El servicio de IA no está configurado. Revisa la variable de entorno API_KEY.");
  }
  
  const prompt = `
    Basado en las siguientes palabras clave: "${keywords}", genera los detalles para una nueva misión para un técnico de taller.
    La descripción debe ser motivadora y clara, con al menos 20 palabras.
    Las habilidades deben ser una lista de 2 a 4 habilidades relevantes para las palabras clave.
    El XP debe ser un número entero entre 30 y 200.
    La dificultad debe ser uno de los siguientes valores: 'Bajo', 'Medio', o 'Alto'.

    Devuelve la respuesta estrictamente en formato JSON, siguiendo el esquema proporcionado.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Using the recommended model
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Título de la misión." },
            description: { type: Type.STRING, description: "Descripción detallada de la misión." },
            difficulty: { type: Type.STRING, description: "Nivel de dificultad: Bajo, Medio o Alto." },
            xp: { type: Type.INTEGER, description: "Puntos de experiencia otorgados." },
            skills: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Lista de habilidades requeridas."
            },
          },
          required: ['title', 'description', 'difficulty', 'xp', 'skills']
        },
      },
    });
    
    // With responseSchema, the output should be valid JSON.
    const parsedData = JSON.parse(response.text);

    // Basic validation remains a good practice
    if (!parsedData.title || !parsedData.description || !parsedData.xp) {
        throw new Error("La respuesta de la IA no tiene el formato esperado.");
    }
    
    // Ensure skills is an array, even if empty
    if (!Array.isArray(parsedData.skills)) {
        parsedData.skills = [];
    }


    return parsedData as GeneratedMissionData;

  } catch (error) {
    console.error("Error al generar la misión con IA:", error);
    throw new Error("No se pudo generar la idea de la misión. Intenta de nuevo.");
  }
};
