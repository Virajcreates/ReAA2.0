import { GoogleGenerativeAI } from '@google/generative-ai';

let genAIInstance: GoogleGenerativeAI | null = null;
let lastApiKey: string | null = null;

export function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not defined in environment variables.');
    return null;
  }
  if (!genAIInstance || lastApiKey !== apiKey) {
    genAIInstance = new GoogleGenerativeAI(apiKey);
    lastApiKey = apiKey;
  }
  return genAIInstance;
}

export const GEMINI_CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';
export const GEMINI_FALLBACK_MODEL = 'gemini-2.5-flash';
export const GEMINI_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
