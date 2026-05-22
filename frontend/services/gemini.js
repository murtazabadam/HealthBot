import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.REACT_APP_GEMINI_KEY;

let model = null;

function initGemini() {
  if (!API_KEY || API_KEY === "DISABLED") {
    console.log("Gemini: No API key in frontend");
    return false;
  }
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    console.log("Gemini ready in frontend!");
    return true;
  } catch (err) {
    console.error("Gemini init error:", err.message);
    return false;
  }
}

export const geminiReady = initGemini();

export async function getGeminiReply(userMessage, mlSummary, userName) {
  if (!model) return null;

  const prompt = `You are HealthBot, a compassionate AI medical assistant.

Patient name: ${userName}
${mlSummary ? `ML Prediction: ${mlSummary}` : "No ML prediction available yet"}

RULES:
- Be warm and empathetic
- Keep response to 2-3 sentences only
- If ML prediction is available, mention it naturally
- Ask one follow-up question about symptoms
- Always say you are an AI not a real doctor
- Never make definitive diagnoses

Patient says: "${userMessage}"

Respond naturally as HealthBot:`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error("Gemini error:", err.message);
    return null;
  }
}
