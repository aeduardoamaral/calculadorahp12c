
import { GoogleGenAI } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getFinancialAdvice = async (prompt: string, context: any) => {
  const ai = getAI();
  const contextStr = JSON.stringify(context);
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are an expert financial consultant specialized in HP 12C financial calculations. 
    The current calculator state is: ${contextStr}. 
    A user asks: "${prompt}". 
    Explain the financial concepts clearly and suggest how to use the HP 12C to solve their specific query.`,
    config: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
    }
  });

  return response.text;
};
