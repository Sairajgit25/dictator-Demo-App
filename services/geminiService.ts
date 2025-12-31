import { GoogleGenAI, Type } from "@google/genai";

// Note: In a production app, the API key would come from a secure backend or env var.
// For this frontend demo, we assume it's available via process.env.API_KEY
const apiKey = process.env.API_KEY || ''; 

const ai = new GoogleGenAI({ apiKey });

export const generateQuizForTopic = async (topic: string) => {
  if (!apiKey) {
    console.warn("No API Key found for Gemini");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a comprehensive micro-learning card about "${topic}".
      1. Provide a concise summary (max 3 sentences) explaining the core concept.
      2. Create a simple Mermaid.js diagram code (graph TD, graph LR, or sequenceDiagram) that visually explains the concept. 
         IMPORTANT SYNTAX RULES:
         - Use semicolons ';' to separate lines.
         - Enclose ALL node text in quotes to avoid syntax errors with special characters. Example: A["Node Label: Text"] --> B["Other Text"].
         - Do not include markdown code blocks (no \`\`\`).
      3. Create a multiple-choice question to test understanding.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            diagram: { type: Type.STRING },
            quiz: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING } 
                },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const generateModuleQuiz = async (content: string) => {
  if (!apiKey) {
    console.warn("No API Key found for Gemini");
    return null;
  }

  try {
    // Truncate content slightly to ensure it fits context window if very large, though usually fine.
    const cleanContent = content.substring(0, 8000);
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a challenging 5-question multiple-choice quiz to test understanding of the following text. For each question, provide a 'question', 'options' array, 'correctIndex', and a helpful 'explanation' of why the answer is correct: "${cleanContent}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING } 
                  },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result.questions || [];
  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};

export const generateSummary = async (content: string) => {
  if (!apiKey) {
    console.warn("No API Key found for Gemini");
    return null;
  }

  try {
    const cleanContent = content.substring(0, 8000);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Summarize the following educational content into one concise, engaging paragraph (approx 2-3 sentences) suitable for a mobile learning app: "${cleanContent}"`,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const generateImageForModule = async (title: string, summary: string) => {
    if (!apiKey) {
        console.warn("No API Key found for Gemini");
        return null;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        text: `Create a minimalist, high-contrast, vector-style educational icon or illustration for the concept: "${title}". Context: ${summary}. Colors: Lime Green (#AFFC41), Black, White. No text in the image. Flat design, solid lines, simple shapes. White background.`
                    }
                ]
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                const base64EncodeString: string = part.inlineData.data;
                return `data:image/png;base64,${base64EncodeString}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Gemini Image Gen Error:", error);
        return null;
    }
};