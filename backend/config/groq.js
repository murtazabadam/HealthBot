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

async function getGroqResponse(userMessage, mlPrediction, userName, chatHistory = []) {
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
- YOU ARE A MEDICAL SYMPTOM ASSISTANT ONLY. If the patient asks something with no
  connection to health, symptoms, or medicine — geography, math, trivia, coding,
  entertainment, current events, or anything similar — do NOT answer it, not even
  briefly or partially. Do not supply the fact, the number, or the answer in any
  form. Instead, in one short sentence, say this is outside what you can help
  with and redirect to their health concern. Never answer the off-topic question
  first and redirect after — redirect only.

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

// ── Off-topic gate ───────────────────────────────────────────────────────
// A dedicated, narrow classification call, kept completely separate from
// getGroqResponse above. The point of splitting this out: when the answer
// is "off-topic", the caller in routes/chat.js never uses any model-
// generated text at all — it substitutes a hardcoded string it controls
// itself. That's a stronger guarantee than the prompt rule inside
// getGroqResponse's systemPrompt (which still relies on the model choosing
// to comply while generating free-form content) — here, the model's only
// job is a one-word yes/no, and the actual reply text is never its output.
async function isOffTopic(userMessage, chatHistory = []) {
  if (!groq) return false; // fail open — never block the user if AI is unavailable

  const recentContext = chatHistory
    .slice(-4)
    .map(m => `${m.sender}: ${m.text}`)
    .join('\n');

  const classifierPrompt = `You are a strict topic gate for a medical symptom-checking chatbot.
Decide whether the LATEST user message is something this chatbot should engage with.

Reply YES if the message is: a symptom description, a health/medical/wellness question, a
question about medicine or self-care, a greeting, thanks, farewell, a short conversational
reply continuing a prior health discussion (e.g. "yes", "since 2 days", "ok", "a little
better"), or a question about what the bot itself can do.

Reply NO if the message has no connection to health at all — geography, math, general
trivia, coding, entertainment, sports, current events, requests to write unrelated
creative content, or any other unrelated topic.

Reply with exactly one word: YES or NO. Nothing else — no punctuation, no explanation.

Recent conversation for context:
${recentContext || '(no prior messages)'}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: classifierPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 3,
      temperature: 0,
    });
    const answer = (completion.choices[0]?.message?.content || '').trim().toUpperCase();
    return answer.startsWith('NO');
  } catch (err) {
    console.error('Off-topic classification failed:', err.message);
    return false; // fail open — a classifier error should never block a real user
  }
}

module.exports = { getGroqResponse, isOffTopic };