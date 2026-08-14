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
- If ML prediction is provided below, mention the top disease naturally
- CRITICAL: if NO ML prediction is provided below, you have NOT run any diagnosis or prediction. NEVER name a disease, NEVER say "based on your symptoms" or "the ML prediction suggests" or anything implying you've assessed or diagnosed them — if asked directly what the prediction/diagnosis is and none is provided, say plainly that you don't have one yet and more symptom detail is needed first
- Ask at most one relevant follow-up question, and only as part of your 1-2 sentences, never in addition to them
- NEVER make definitive diagnoses
- If symptoms sound serious, urge seeing a doctor immediately

Patient name: ${userName}
${mlPrediction
    ? `ML Model says: ${mlPrediction}`
    : isFollowUp
      ? 'Patient is continuing the conversation — use chat history for full context. No ML prediction has been run yet.'
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
// Kept as a narrow fallback ONLY for when analyzeSymptomTurn isn't in play
// (e.g. GROQ_API_KEY unset, or an analyzeSymptomTurn call itself failed and
// routes/chat.js fell back to the deterministic keyword pipeline for that
// turn). When the AI path is healthy, analyzeSymptomTurn's is_health_related
// field replaces this — folded into the same call instead of a second
// round-trip, and with awareness of the running symptom state so short
// replies ("yes"/"no") aren't judged in isolation.
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

// ── Unified symptom-conversation turn analysis ──────────────────────────
// This is the core of the AI-driven intake flow. One call per health
// message does everything the old pipeline needed several disconnected,
// regex-based mechanisms for:
//   - understands free-form phrasing ("I feel dull", "I stay at home a
//     lot") instead of only exact keyword matches
//   - properly handles negation/retraction ACROSS turns, because it's
//     given the current running symptom list and asked to update it, not
//     re-deriving from scratch by pattern-matching raw text every time
//   - decides what to ask next from genuine understanding of what's
//     already been established, instead of a "does this literal phrase
//     appear anywhere in the text" regex that can't tell "not headache"
//     from "headache"
//   - decides when enough has been gathered to move to confirmation
//
// knownSymptoms: [{id, label}] — the fixed vocabulary the ML model
// understands (see routes/chat.js's /symptom-options). The model is
// instructed to only place IDs from this list into matched_symptom_ids /
// negated_symptom_ids; anything it can't map goes into unmatched_notes
// instead of being invented as a new, ML-meaningless ID.
//
// Returns null on any failure — callers MUST handle that by falling back
// to the deterministic keyword pipeline for that turn; never assume a
// response.
async function analyzeSymptomTurn({
  userMessage,
  userName,
  activeSymptoms = [],
  notes = '',
  chatHistory = [],
  knownSymptoms = [],
}) {
  if (!groq) return null;

  const vocabList = knownSymptoms.map(s => `${s.id} (${s.label})`).join(', ');
  const activeList = activeSymptoms.length
    ? activeSymptoms.join(', ')
    : '(none yet)';

  const systemPrompt = `You are a careful, compassionate AI intake nurse for a symptom-checking chatbot. You are having a natural, flowing conversation with a patient to build up a picture of their symptoms before an ML model predicts a likely condition.

KNOWN SYMPTOM VOCABULARY (the ML model ONLY understands these exact ids — never invent new ones):
${vocabList}

CURRENTLY TRACKED SYMPTOMS FOR THIS PATIENT (from earlier in this conversation): ${activeList}
ADDITIONAL NOTES ALREADY CAPTURED: ${notes || '(none)'}

Read the patient's LATEST message (given as the user turn below, with recent chat history for context) and respond with STRICT JSON ONLY, no markdown, no commentary, in exactly this shape:
{
  "is_health_related": boolean,
  "is_emergency": boolean,
  "matched_symptom_ids": ["id_from_vocabulary", ...],
  "negated_symptom_ids": ["id_from_vocabulary", ...],
  "unmatched_notes": "string or empty string",
  "ready_for_confirmation": boolean,
  "reply": "string"
}

RULES:
- is_health_related: false ONLY if the message has genuinely nothing to do with health, feelings, symptoms, or continuing this conversation (general trivia, unrelated requests, etc). A short reply like "yes"/"no"/"ok" while a symptom conversation is under way is ALWAYS health-related — never mark it false just because it's short.
- is_emergency: true if the patient describes or the tracked symptoms together suggest something urgent (e.g. chest pain with breathlessness or sweating, severe headache with vomiting, high fever with confusion or a stiff neck, severe bleeding, difficulty breathing, suicidal ideation, or anything else clearly dangerous) — even if severity hasn't been fully clarified yet. Err toward true if genuinely unsure on something dangerous-sounding.
- matched_symptom_ids: ONLY ids from the vocabulary list above, that the patient is NEWLY affirming in this message (map casual language onto the closest matching vocabulary id — e.g. "I feel dull/wiped out/no energy" -> fatigue). Do not repeat ids that are already in the currently-tracked list unless the patient is re-affirming something after it was previously negated.
- negated_symptom_ids: vocabulary ids the patient is explicitly denying or retracting in this message, whether or not they're currently tracked (e.g. "no headache", "not anymore", "actually I don't have that").
- unmatched_notes: any clinically relevant free-text detail that does NOT map onto a vocabulary id (e.g. "stays home a lot", "stressful week at work", sleep/appetite details) — short phrase, or empty string if nothing new. Do not put vocabulary-mappable symptoms here.
- ready_for_confirmation: true once you have a reasonably complete picture — generally 2 or more tracked symptoms with any obviously-needed clarification (like fever severity, symptom duration) already given, OR the patient indicates they're done ("that's everything", "nothing else", "no other symptoms"). Do not wait indefinitely for a perfect picture — a compassionate intake nurse knows when to move forward.
- reply: your natural, warm, BRIEF (1-2 sentences) response to the patient — either a relevant follow-up question if not ready_for_confirmation yet, or a brief acknowledgment if you are ready (the app will show a separate confirmation UI, so don't list out their symptoms yourself here). NEVER state or imply a diagnosis or ML prediction here — none has run yet. If is_health_related is false, still write a brief, kind redirect back to health topics as the reply.
- Never fabricate symptoms the patient didn't describe or clearly imply.

Patient name: ${userName}`;

  const history = chatHistory.slice(-10).map(msg => ({
    role:    msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text.substring(0, 500)
  }));

  try {
    const completion = await groq.chat.completions.create({
      model:       'llama-3.1-8b-instant',
      messages:    [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage }
      ],
      max_tokens:  350,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '';
    const parsed = JSON.parse(raw);

    const knownIds = new Set(knownSymptoms.map(s => s.id));
    const cleanIds = (arr) =>
      Array.isArray(arr) ? arr.filter(id => knownIds.has(id)) : [];

    return {
      is_health_related: parsed.is_health_related !== false,
      is_emergency: !!parsed.is_emergency,
      matched_symptom_ids: cleanIds(parsed.matched_symptom_ids),
      negated_symptom_ids: cleanIds(parsed.negated_symptom_ids),
      unmatched_notes: typeof parsed.unmatched_notes === 'string' ? parsed.unmatched_notes.trim() : '',
      ready_for_confirmation: !!parsed.ready_for_confirmation,
      reply: typeof parsed.reply === 'string' && parsed.reply.trim() ? parsed.reply.trim() : null,
    };
  } catch (err) {
    console.error('analyzeSymptomTurn failed:', err.message);
    return null;
  }
}

module.exports = { getGroqResponse, isOffTopic, structurePrescription, analyzeSymptomTurn };

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