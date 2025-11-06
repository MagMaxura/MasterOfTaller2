import { GoogleGenAI, Type } from "@google/genai";
import { MissionDifficulty } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface MissionGenerationResult {
    title: string;
    description: string;
    difficulty: MissionDifficulty;
    xp: number;
    deadline: string;
}

export const generateMissionDetails = async (prompt: string): Promise<MissionGenerationResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `A partir de la siguiente solicitud, genera los detalles para una misión en un taller mecánico. La fecha actual es ${new Date().toLocaleDateString('es-ES')}. Calcula la fecha límite basándote en la solicitud. Si no se especifica un plazo, asume un plazo razonable (2-3 días). Responde únicamente con un objeto JSON válido. Solicitud: "${prompt}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Un título corto y descriptivo para la misión.' },
            description: { type: Type.STRING, description: 'Una descripción detallada de las tareas a realizar.' },
            difficulty: { type: Type.STRING, enum: [MissionDifficulty.LOW, MissionDifficulty.MEDIUM, MissionDifficulty.HIGH], description: 'La dificultad de la misión.' },
            xp: { type: Type.INTEGER, description: 'Puntos de experiencia recomendados (entre 20 y 200).' },
            deadline: { type: Type.STRING, description: 'La fecha límite calculada en formato YYYY-MM-DD.' },
          },
          required: ['title', 'description', 'difficulty', 'xp', 'deadline'],
        },
      },
    });

    const text = response.text;
    const parsedJson = JSON.parse(text);
    return parsedJson;

  } catch (error) {
    console.error("Error generating mission details with Gemini:", error);
    throw new Error("La IA no pudo generar los detalles de la misión. Inténtalo de nuevo con un prompt más claro o revisa tu prompt.");
  }
};