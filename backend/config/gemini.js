const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function getGeminiResponse(userMessage, mlPrediction, userName) {
  const systemPrompt = `You are HealthBot, a compassionate and knowledgeable AI medical assistant. 
You help users understand their symptoms and health conditions.

IMPORTANT RULES:
- Always remind users you are an AI and not a replacement for a real doctor
- Be empathetic and understanding
- Keep responses concise (max 3-4 sentences)
- If ML prediction is provided, reference it naturally
- Ask one follow-up question to gather more symptoms
- Never make definitive diagnoses
- Respond in the same language the user uses

Current user: ${userName}
ML Model Prediction: ${mlPrediction ? JSON.stringify(mlPrediction) : 'No prediction yet'}`;

  const chat = model.startChat({
    history: [],
    generationConfig: {
      maxOutputTokens: 300,
      temperature: 0.7,
    },
  });

  const fullPrompt = `${systemPrompt}\n\nUser message: ${userMessage}`;
  const result = await chat.sendMessage(fullPrompt);
  return result.response.text();
}

module.exports = { getGeminiResponse };