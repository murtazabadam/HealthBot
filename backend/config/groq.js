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
    console.log('Groq AI ready! Model: openai/gpt-oss-20b');
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
      model:       'openai/gpt-oss-20b',
      messages:    [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage }
      ],
      max_tokens:  250,
      temperature: 0.7,
      reasoning_effort: 'low', // gpt-oss models always spend tokens "thinking" first — curb it, since this call just needs a short reply, not deep reasoning
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
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: classifierPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 100,
      temperature: 0,
      reasoning_effort: 'low', // was 3 tokens total under the old non-reasoning model — gpt-oss needs real headroom for its reasoning pass before it can even emit YES/NO
    });
    const answer = (completion.choices[0]?.message?.content || '').trim().toUpperCase();
    return answer.startsWith('NO');
  } catch (err) {
    console.error('Off-topic classification failed:', err.message);
    return false; // fail open — a classifier error should never block a real user
  }
}

// ── Unified symptom-conversation turn analysis ──────────────────────────
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
- The patient is the ONLY person whose health this conversation is about. If a message describes something/someone else — an object, a pet, another person, a joke, a hypothetical — do NOT extract any symptom from it, even if the wording resembles a symptom description. Set matched_symptom_ids to an empty list for that part, and gently clarify in your reply that you're asking about their own health.
- is_health_related: false ONLY if the message has genuinely nothing to do with health, feelings, symptoms, or continuing this conversation (general trivia, unrelated requests, etc). A short reply like "yes"/"no"/"ok" while a symptom conversation is under way is ALWAYS health-related — never mark it false just because it's short.
- is_emergency: true ONLY for presentations that genuinely warrant urgent, ER-level care right now — e.g. chest pain with breathlessness/sweating/palpitations, severe headache with vomiting, high fever together with confusion or a stiff neck, signs of a stroke (one-sided weakness, slurred speech, facial drooping), severe or uncontrolled bleeding, real difficulty breathing, suicidal ideation, unconsciousness/unresponsiveness, or a similarly severe combination the patient clearly describes. Ordinary, common symptom combinations — fever with chills and fatigue, mild dizziness with vomiting, a routine headache, general tiredness — are NOT emergencies by themselves, even together, unless a genuine red-flag from the list above is also present. Most patients you talk to will NOT be having an emergency. When unsure, prefer false — the app has a separate, less alarming way of flagging "this deserves a doctor visit soon" that doesn't require is_emergency, so there's no need to reach for true just because something sounds unwell or could theoretically turn serious.
- matched_symptom_ids: ONLY ids from the vocabulary list above, and ONLY ones the PATIENT is CLEARLY, EXPLICITLY affirming about THEMSELVES in their CURRENT message. Map casual language onto the closest matching vocabulary id (e.g. "I feel dull/wiped out/no energy" -> fatigue) — but this is a mapping step, not a license to guess. If you are not confident the patient stated it, leave it out. NEVER include a symptom just because you (the assistant) asked about it in a previous turn and the patient's reply was unclear, off-topic, or about something else — an id only belongs here if the patient's own words support it. When genuinely unsure, do not include it — a missed symptom can be added next turn; a fabricated one cannot be un-shown once the patient sees it in the confirmation list.
- IMPORTANT — do not resurrect closed topics: if the CURRENTLY TRACKED SYMPTOMS list above is empty, that means a prediction was already delivered for whatever was discussed earlier and that topic is CLOSED. Do not re-add a symptom into matched_symptom_ids just because it appears somewhere in the older chat history — only extract from what the patient is saying in their CURRENT message, right now. If the patient's current message is just a short reply ("no", "nothing else") and there is nothing new to extract, return empty matched_symptom_ids and a short, natural conversational reply (e.g. ask if there's anything else going on, or if they're doing okay) — do NOT set ready_for_confirmation to true with an empty or stale symptom list.
- negated_symptom_ids: vocabulary ids the patient is explicitly denying or retracting in this message, whether or not they're currently tracked (e.g. "no headache", "not anymore", "actually I don't have that", "I never said I had fever").
- unmatched_notes: any clinically relevant free-text detail, ABOUT THE PATIENT, that does NOT map onto a vocabulary id (e.g. "stays home a lot", "stressful week at work", sleep/appetite details) — short phrase, or empty string if nothing new. Do not put vocabulary-mappable symptoms here.
- ready_for_confirmation: true once you have a reasonably complete picture — generally 2 or more NEWLY tracked symptoms this conversation, with any obviously-needed clarification (like fever severity, symptom duration) already given, OR the patient indicates they're done ("that's everything", "nothing else", "no other symptoms") AND there is at least one symptom to confirm. Do not wait indefinitely for a perfect picture — a compassionate intake nurse knows when to move forward. Never set this true if there are zero tracked symptoms (current + newly matched combined).
- ANSWERING QUESTIONS ABOUT A PRIOR RESULT: if the patient is asking about, questioning, or wants to understand a prediction or disease name already shown earlier in this conversation (e.g. "can you tell me more about it", "how come it means I have X", "why do you think that", "are you sure") — this is NOT a new symptom-gathering turn. Do not deflect back into intake questions. Instead, treat it as is_health_related: true, matched_symptom_ids and negated_symptom_ids empty, ready_for_confirmation: false, and write a reply that actually answers using what's visible in the chat history (e.g. briefly explain the condition mentioned, or clarify that the ML model's suggestion is a possibility to discuss with a doctor, not a confirmed diagnosis) — genuinely engage with what they asked instead of redirecting to another intake question.
- reply: your natural, warm, BRIEF (1-2 sentences) response to the patient — either a relevant follow-up question if not ready_for_confirmation yet, a direct answer if they asked about a prior result (see rule above), or a brief acknowledgment if you are ready (the app will show a separate confirmation UI, so don't list out their symptoms yourself here). NEVER state or imply a NEW diagnosis or ML prediction here that hasn't actually been run — you may reference/explain a prediction that's already visible in the chat history, but never invent a new one. If is_health_related is false, still write a brief, kind redirect back to health topics as the reply. If the message was about something other than the patient's own health (an object, a joke, a third party), gently clarify you can only assess their own symptoms.

Patient name: ${userName}`;

  const history = chatHistory.slice(-10).map(msg => ({
    role:    msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text.substring(0, 500)
  }));

  try {
    const completion = await groq.chat.completions.create({
      model:       'openai/gpt-oss-20b',
      messages:    [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage }
      ],
      max_tokens:  2000, // gpt-oss spends real tokens on its reasoning pass even at 'low' effort; 900 was cutting the JSON off mid-object on longer turns
      temperature: 0,
      reasoning_effort: 'low',
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'symptom_turn',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              is_health_related: { type: 'boolean' },
              is_emergency: { type: 'boolean' },
              matched_symptom_ids: { type: 'array', items: { type: 'string' } },
              negated_symptom_ids: { type: 'array', items: { type: 'string' } },
              unmatched_notes: { type: 'string' },
              ready_for_confirmation: { type: 'boolean' },
              reply: { type: 'string' },
            },
            required: [
              'is_health_related',
              'is_emergency',
              'matched_symptom_ids',
              'negated_symptom_ids',
              'unmatched_notes',
              'ready_for_confirmation',
              'reply',
            ],
            additionalProperties: false,
          },
        },
      },
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
      model:       'openai/gpt-oss-20b',
      messages:    [{ role: 'system', content: prompt }],
      max_tokens:  1500,
      temperature: 0,
      reasoning_effort: 'low', // curb reasoning-token spend so there's room left for the actual medicine-list JSON
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