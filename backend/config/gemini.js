const Groq = require('groq-sdk');

const responseCache = new Map();
const CACHE_MAX     = 100;

let groq = null;

function initGroq() {
  const key = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    console.log('AI: No API key — ML-only mode');
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

  const cacheKey = `${userMessage.toLowerCase().trim()}_${mlPrediction || 'none'}`;
  if (responseCache.has(cacheKey)) {
    console.log('AI: Cache hit');
    return responseCache.get(cacheKey);
  }

  const isFollowUp  = !mlPrediction && chatHistory.length > 0;
  const systemPrompt = `You are HealthBot, a compassionate AI medical assistant. You have memory of this full conversation.

STRICT RULES:
- You are an AI — NEVER claim to be a doctor or prescribe medications
- Be warm, conversational and empathetic — like a knowledgeable friend
- Keep responses to 3-4 sentences maximum — be concise
- Remember everything the patient said in this conversation
- If patient answers your question (e.g. "from last 2 days", "yes", "no"), acknowledge their answer and continue naturally
- If patient asks for self-care tips, give 3-4 brief practical tips
- If patient asks about medicine, say you cannot prescribe but suggest seeing a doctor and mention common OTC options they can ask a pharmacist about
- If ML prediction is provided, mention the top disease naturally
- Ask one relevant follow-up question to learn more
- NEVER make definitive diagnoses
- If symptoms sound serious, urge seeing a doctor immediately

Patient name: ${userName}
${mlPrediction
    ? `ML Model says: ${mlPrediction}`
    : isFollowUp
      ? 'Patient is continuing the conversation — use chat history for full context'
      : 'No ML prediction yet — ask patient to describe symptoms'}`;

  // Build history — keep last 8 messages for context
  const history = chatHistory.slice(-8).map(msg => ({
    role:    msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text.substring(0, 500)
  }));

  try {
    console.log('Calling Groq AI...');
    const completion = await groq.chat.completions.create({
      model:       'llama-3.1-8b-instant',
      messages:    [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage }
      ],
      max_tokens:  220,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content?.trim() || null;
    console.log('Groq:', response ? 'SUCCESS' : 'NULL response');

    if (response) {
      if (responseCache.size >= CACHE_MAX) {
        responseCache.delete(responseCache.keys().next().value);
      }
      // Only cache symptom messages — not conversational ones
      if (mlPrediction) responseCache.set(cacheKey, response);
    }
    return response;

  } catch (err) {
    console.error('Groq error:', err.message);
    return null;
  }
}

module.exports = { getGeminiResponse };
