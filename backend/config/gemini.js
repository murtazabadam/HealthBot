const { GoogleGenerativeAI } = require('@google/generative-ai');

let model = null;

function initGemini() {
  if (!process.env.GEMINI_API_KEY) {
    console.log('Gemini: No API key found — using fallback bot');
    return false;
  }
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('Gemini AI ready!');
    return true;
  } catch (err) {
    console.error('Gemini init error:', err.message);
    return false;
  }
}

const geminiReady = initGemini();

async function getGeminiResponse(userMessage, mlPrediction, userName, chatHistory = []) {
  if (!model) return null;

  try {
    const systemContext = `You are HealthBot, a compassionate AI medical assistant helping patients understand their symptoms.

RULES you must always follow:
- Always remind users you are an AI and NOT a replacement for a real doctor
- Be warm, empathetic and easy to understand
- Keep responses to 3-4 sentences maximum
- If an ML prediction is provided, mention it naturally in your response
- Ask one follow-up question to gather more symptom information
- Never make definitive diagnoses — use phrases like "this could suggest" or "this may indicate"
- If symptoms sound serious, always recommend seeing a doctor urgently
- Use simple language that any patient can understand

Current patient name: ${userName}
${mlPrediction
    ? `ML Model Prediction: ${mlPrediction}`
    : 'No ML prediction yet'}`;

    // Build conversation history for Gemini context (last 6 messages)
    const history = chatHistory.slice(-6).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text.substring(0, 500) }]
    }));

    const chat = model.startChat({
      history: history.length > 0 ? history : [],
      generationConfig: {
        maxOutputTokens: 350,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(
      `${systemContext}\n\nPatient message: ${userMessage}`
    );
    return result.response.text();

  } catch (err) {
    console.error('Gemini error:', err.message);
    return null;
  }
}

module.exports = { getGeminiResponse, geminiReady };