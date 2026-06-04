const Groq = require('groq-sdk');

const responseCache = new Map();
const CACHE_MAX = 50;

let groq = null;

function initGroq() {
  const key = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    console.log('AI: No API key found — ML-only mode');
    return false;
  }
  try {
    groq = new Groq({ apiKey: key });
    console.log('Groq AI ready! Model: llama-3.1-8b-instant');
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
    console.log('AI: Cached response used');
    return responseCache.get(cacheKey);
  }

  const systemPrompt = `You are HealthBot, a compassionate AI medical assistant with memory of this conversation.

RULES:
- You are an AI NOT a real doctor — remind the patient of this
- Be warm, empathetic and conversational like a real assistant
- Keep responses to 3-4 sentences
- If ML prediction is provided, mention it naturally
- Remember what the patient told you earlier in the conversation
- If patient answers your follow-up question, acknowledge their answer and ask another relevant question OR give advice
- Never make definitive diagnoses — use "this may suggest" or "this could indicate"
- If symptoms sound serious, recommend seeing a doctor urgently

Patient name: ${userName}
${mlPrediction ? `ML Model Prediction: ${mlPrediction}` : 'Continuing conversation — use history for context'}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-4).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text.substring(0, 300)
    })),
    { role: 'user', content: userMessage }
  ];

  try {
    console.log('Calling Groq AI...');
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages,
      max_tokens: 200,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || null;
    console.log('Groq:', response ? 'SUCCESS' : 'NULL response');

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
