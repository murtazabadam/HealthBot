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
- Be warm and empathetic, but ALWAYS brief — 1-2 short sentences maximum, ever. This is a strict limit, not a suggestion.
- No filler, no repeating what the patient already said back to them, no long lead-ins — get straight to the point
- Remember everything the patient said in this conversation
- If patient answers your question (e.g. "from last 2 days", "yes", "no"), acknowledge their answer and continue naturally
- If patient asks for self-care tips: exception to the 1-2 sentence rule — give up to 3 tips as a short bullet list, nothing else added
- If patient asks about medicine, say briefly you cannot prescribe and suggest a pharmacist or doctor — keep it to one sentence
- Ask at most one relevant follow-up question, and only as part of your 1-2 sentences, never in addition to them
- If symptoms sound serious, urge seeing a doctor immediately
- NEVER GUESS OR INVENT A DIAGNOSIS. The ONLY disease name you are allowed to say is one that appears
  verbatim in the "ML Model says:" line below. If that line is absent, you have NOT run any
  diagnostic analysis — do not name a disease, do not say "I'm considering X", and do not say
  anything implying you evaluated their symptoms against a condition.
- NEVER claim an ML/diagnostic prediction exists unless "ML Model says:" is present below. If the
  patient asks what the ML/analysis says and that line is absent, say plainly that no analysis has
  run yet and ask for more specific, distinct symptoms (not vague ones like "feeling dull" or "off")
  so one can run.

Patient name: ${userName}
${mlPrediction
    ? `ML Model says: ${mlPrediction}`
    : isFollowUp
      ? 'Patient is continuing the conversation — use chat history for full context. No ML prediction exists for this conversation yet — do not imply one does.'
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
      max_tokens:  90,
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

module.exports = { getGroqResponse, isOffTopic, structurePrescription };

// ── Prescription structuring ─────────────────────────────────────────────
// Turns raw, error-prone OCR text from a prescription photo into a strict
// JSON medicine list. Kept as its own narrow call (low temperature, no
// chat history, JSON-only) rather than reusing getGroqResponse, because a
// parsing failure here should never leak conversational text into a
// medicine name/dosage field.
async function structurePrescription(rawText) {
  if (!groq) return null;

  const prompt = `You are a medical prescription parser. Below is raw OCR text extracted from a photo of a doctor's prescription. It will contain OCR noise: garbled characters, misread words, stray symbols, and irrelevant boilerplate (clinic letterhead, signatures, etc).

Extract ONLY medicines you can identify with reasonable confidence. Return STRICT JSON and nothing else — no markdown, no commentary — in exactly this shape:
{
  "doctorName": "string, or empty string if not found",
  "medicines": [
    {
      "name": "medicine name",
      "dosage": "e.g. 500mg",
      "frequency": "human-readable, e.g. twice daily",
      "timesPerDay": 2,
      "durationDays": 5,
      "instructions": "e.g. after food, or empty string"
    }
  ],
  "notes": "any other relevant free-text detail, or empty string"
}

Rules:
- If a field is not present in the text, use an empty string ("") for text fields, or null for timesPerDay/durationDays.
- Never invent a medicine name that isn't reasonably supported by the OCR text.
- If you cannot confidently identify any medicines at all, return {"doctorName":"","medicines":[],"notes":"Could not confidently read any medicines from this image."}

OCR TEXT:
"""
${rawText.slice(0, 4000)}
"""`;

  try {
    const completion = await groq.chat.completions.create({
      model:       'llama-3.1-8b-instant',
      messages:    [{ role: 'system', content: prompt }],
      max_tokens:  700,
      temperature: 0,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed.medicines)) parsed.medicines = [];
    parsed.doctorName = parsed.doctorName || '';
    parsed.notes       = parsed.notes || '';
    return parsed;
  } catch (err) {
    console.error('Prescription structuring failed:', err.message);
    return null;
  }
}