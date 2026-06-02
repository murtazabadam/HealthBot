// Simple in-memory cache — stores last 50 responses
const responseCache = new Map();
const CACHE_MAX = 50;

const { GoogleGenerativeAI } = require('@google/generative-ai');

let model = null;

function initGemini() {
  if (!process.env.GEMINI_API_KEY) {
    console.log('Gemini: No API key found — using fallback bot');
    return false;
  }
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    model = genAI.getGenerativeModel({ model: modelName });
    console.log(`Gemini AI ready! Model: ${modelName}`);
    return true;
  } catch (err) {
    console.error('Gemini init error:', err.message);
    return false;
  }
}

initGemini();

async function getGeminiResponse(userMessage, mlPrediction, userName, chatHistory = []) {
  if (!model) return null;

  // Cache key based on message + ML prediction
  const cacheKey = `${userMessage.toLowerCase().trim()}_${mlPrediction || ''}`;

  if (responseCache.has(cacheKey)) {
    console.log('Gemini: Using cached response');
    return responseCache.get(cacheKey);
  }

  const systemContext = `You are HealthBot, a compassionate AI medical assistant helping patients understand their symptoms.

RULES:
- Always remind users you are an AI and NOT a replacement for a real doctor
- Be warm, empathetic and easy to understand
- Keep responses to 3-4 sentences maximum
- If an ML prediction is provided, mention it naturally
- Ask one follow-up question to gather more symptom information
- Never make definitive diagnoses — use phrases like "this could suggest" or "this may indicate"
- If symptoms sound serious, recommend seeing a doctor urgently
- Use simple language any patient can understand

Current patient name: ${userName}
${mlPrediction ? `ML Model Prediction: ${mlPrediction}` : 'No ML prediction yet'}`;

  const history = chatHistory.slice(-4).map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text.substring(0, 300) }]
  }));

  try {
    const chat = model.startChat({
      history: history.length > 0 ? history : [],
      generationConfig: {
        maxOutputTokens: 250,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(
      `${systemContext}\n\nPatient message: ${userMessage}`
    );

    const response = result.response.text();

    // Store in cache
    if (response) {
      if (responseCache.size >= CACHE_MAX) {
        const firstKey = responseCache.keys().next().value;
        responseCache.delete(firstKey);
      }
      responseCache.set(cacheKey, response);
    }

    return response;

  } catch (err) {
    if (err.message && err.message.includes('429')) {
      console.log('Gemini rate limited — trying simple request...');
      try {
        const result = await model.generateContent(
          `You are HealthBot AI assistant. Patient ${userName} says: "${userMessage}". ${mlPrediction || ''} Respond warmly in 2-3 sentences, mention you are an AI, ask one follow-up question.`
        );

        const response = result.response.text();

        // Store in cache
        if (response) {
          if (responseCache.size >= CACHE_MAX) {
            const firstKey = responseCache.keys().next().value;
            responseCache.delete(firstKey);
          }
          responseCache.set(cacheKey, response);
        }

        return response;

      } catch (retryErr) {
        console.error('Gemini retry failed:', retryErr.message);
        return null;
      }
    }

    console.error('Gemini error:', err.message);
    return null;
  }
}

module.exports = { getGeminiResponse };