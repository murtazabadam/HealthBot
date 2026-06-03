const Groq = require('groq-sdk');

const responseCache = new Map();
const CACHE_MAX = 50;

let groq = null;

function initGroq() {
  if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
    console.log('AI: No API key found — using fallback bot');
    return false;
  }
  try {
    const key = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
    groq = new Groq({ apiKey: key });
    console.log('Groq AI ready! Model: llama3-8b-8192');
    return true;
  } catch (err) {
    console.error('Groq init error:', err.message);
    return false;
  }
}

initGroq();

async function getGeminiResponse(userMessage, mlPrediction, userName, chatHistory = []) {
  if (!groq) return null;

  const cacheKey = `${userMessage.toLowerCase().trim()}_${mlPrediction || ''}`;
  if (responseCache.has(cacheKey)) {
    console.log('AI: Using cached response');
    return responseCache.get(cacheKey);
  }

  try {
    const systemPrompt = `You are HealthBot, a compassionate AI medical assistant.

RULES:
- You are an AI, NOT a real doctor — always remind the patient
- Be warm, empathetic and easy to understand
- Keep response to 3 sentences maximum
- If ML prediction is provided, mention it naturally
- Ask one follow-up question about symptoms
- Never make definitive diagnoses — use "this may suggest" or "this could indicate"
- If symptoms sound serious, recommend seeing a doctor urgently

Patient name: ${userName}
${mlPrediction ? `ML Model says: ${mlPrediction}` : 'No ML prediction yet'}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-4).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text.substring(0, 300)
      })),
      { role: 'user', content: userMessage }
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages,
      max_tokens: 200,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || null;

    if (response) {
      if (responseCache.size >= CACHE_MAX) {
        responseCache.delete(responseCache.keys().next().value);
      }
      responseCache.set(cacheKey, response);
    }

    return response;

  } catch (err) {
    console.error('Groq error:', err.message);
    return null;
  }
}

module.exports = { getGeminiResponse };