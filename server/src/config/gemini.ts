import { GoogleGenAI } from "@google/genai";

const GEMIN_API_KEY = process.env.GEMINI_API_KEY;

export const gemini = new GoogleGenAI({ apiKey: GEMIN_API_KEY });
