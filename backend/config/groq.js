// ── Multi-provider AI layer with free-tier fallback ─────────────────────
// Groq's free tier caps at ~200k tokens/day PER MODEL. Once that's hit,
// every call 429s until the daily reset. Rather than the whole chatbot
// going down, this tries providers in order and falls through to the
// next one on a rate-limit or error — each provider draws from a totally
// separate free quota pool, so exhausting Groq doesn't touch Mistral's.
//
// All three are OpenAI-compatible REST APIs, so one generic caller works
// for all of them — no separate SDKs needed.
const axios = require('axios');

const PROVIDERS = [
  {
    name: 'groq',
    envKey: 'GROQ_API_KEY',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    bigModel: 'openai/gpt-oss-120b',
    smallModel: 'openai/gpt-oss-20b',
    supportsJsonMode: true,
  },
  {
    name: 'mistral',
    envKey: 'MISTRAL_API_KEY',
    url: 'https://api.mistral.ai/v1/chat/completions',
    bigModel: 'mistral-small-latest',
    smallModel: 'mistral-small-latest',
    supportsJsonMode: true,
  },
  {
    name: 'openrouter',
    envKey: 'OPENROUTER_API_KEY',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    bigModel: 'meta-llama/llama-3.3-70b-instruct:free',
    smallModel: 'meta-llama/llama-3.3-70b-instruct:free',
    supportsJsonMode: false, // free-routed models don't reliably honor response_format
    extraHeaders: {
      'HTTP-Referer': 'https://healthbotsc.vercel.app',
      'X-Title': 'HealthBot',
    },
  },
];

function configuredProviders() {
  return PROVIDERS.filter(p => !!process.env[p.envKey]);
}

function logReadyProviders() {
  const ready = configuredProviders().map(p => p.name);
  if (ready.length === 0) {
    console.log('AI: No provider API keys set — ML-only mode');
  } else {
    console.log(`AI ready! Provider fallback chain: ${ready.join(' -> ')}`);
  }
}
logReadyProviders();

// Tries each configured provider in order. Returns the raw text content,
// or null if every provider failed (caller must fall back to the
// deterministic keyword pipeline in that case).
async function callWithFallback({ messages, maxTokens, temperature = 0, useBigModel = true, jsonMode = false }) {
  const providers = configuredProviders();
  if (providers.length === 0) return null;

  for (const provider of providers) {
    const key = process.env[provider.envKey];
    const model = useBigModel ? provider.bigModel : provider.smallModel;

    try {
      const payload = { model, messages, max_tokens: maxTokens, temperature };
      if (jsonMode && provider.supportsJsonMode) {
        payload.response_format = { type: 'json_object' };
      }

      const res = await axios.post(provider.url, payload, {
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          ...(provider.extraHeaders || {}),
        },
        timeout: 25000,
      });

      const content = res.data?.choices?.[0]?.message?.content?.trim();
      if (content) {
        console.log(`AI (${provider.name}/${model}): SUCCESS`);
        return content;
      }
      console.warn(`AI (${provider.name}): empty response, trying next provider...`);
    } catch (err) {
      const status = err.response?.status;
      const apiMsg = err.response?.data?.error?.message || err.message;
      if (status === 429) {
        console.warn(`AI (${provider.name}): rate-limited, trying next provider...`);
      } else {
        console.error(`AI (${provider.name}) error:`, apiMsg);
      }
      // fall through to next provider
    }
  }

  console.error('AI: all providers exhausted or failed for this call');
  return null;
}

// ── Conversational reply ─────────────────────────────────────────────────
const responseCache = new Map();
const CACHE_MAX = 100;

async function getGroqResponse(userMessage, mlPrediction, userName, chatHistory = []) {
  const cacheKey = `${userMessage.toLowerCase().trim()}_${mlPrediction || 'none'}`;
  if (responseCache.has(cacheKey)) {
    console.log('AI: Cache hit');
    return responseCache.get(cacheKey);
  }

  const isFollowUp = !mlPrediction && chatHistory.length > 0;
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
- CRITICAL — NEVER FABRICATE ANYTHING: you can only reply with text — you have no tools, cannot book appointments, cannot call anyone, cannot access any live portal/database/account, cannot look up real phone numbers, addresses, doctor names, or reference numbers, and cannot remember anything outside this chat. If the patient asks for something you cannot actually do or verify — booking, confirming, looking up live contact details, checking records, anything requiring a real action or real-world data you don't have — do NOT invent an answer, a number, a link, a name, or a confirmation. Say plainly and directly that you can't do that or don't have that information, in one short sentence, and where relevant point them to a real feature of the app (like Care Locator) or suggest they contact the place directly themselves. Never soften a "no" into something that sounds like a "yes"

Patient name: ${userName}
${mlPrediction
    ? `ML Model says: ${mlPrediction}`
    : isFollowUp
      ? 'Patient is continuing the conversation — use chat history for full context. No ML prediction has been run yet.'
      : 'No ML prediction yet — ask patient to describe symptoms'}`;

  const history = chatHistory.slice(-8).map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text.substring(0, 500),
  }));

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ];

  console.log('Calling AI (conversation)...');
  const response = await callWithFallback({ messages, maxTokens: 90, temperature: 0.7, useBigModel: false });

  if (response) {
    if (responseCache.size >= CACHE_MAX) {
      responseCache.delete(responseCache.keys().next().value);
    }
    if (mlPrediction) responseCache.set(cacheKey, response);
  }
  return response;
}

// ── Off-topic gate ───────────────────────────────────────────────────────
async function isOffTopic(userMessage, chatHistory = []) {
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

  const messages = [
    { role: 'system', content: classifierPrompt },
    { role: 'user', content: userMessage },
  ];

  const answer = await callWithFallback({ messages, maxTokens: 3, temperature: 0, useBigModel: false });
  if (answer === null) return false; // fail open — never block a real user if every provider is down
  return answer.trim().toUpperCase().startsWith('NO');
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
  const vocabList = knownSymptoms.map(s => `${s.id} (${s.label})`).join(', ');
  const activeList = activeSymptoms.length ? activeSymptoms.join(', ') : '(none yet)';

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
- is_emergency: true ONLY for presentations that genuinely warrant urgent, ER-level care right now — e.g. chest pain with breathlessness/sweating/palpitations, severe headache with vomiting, high fever together with confusion or a stiff neck, signs of a stroke (one-sided weakness, slurred speech, facial drooping), severe or uncontrolled bleeding, real difficulty breathing, suicidal ideation, unconsciousness/unresponsiveness, or a similarly severe combination the patient clearly describes. Ordinary, common symptom combinations — fever with chills and fatigue, mild dizziness with vomiting, a routine headache, general tiredness — are NOT emergencies by themselves, even together, unless a genuine red-flag from the list above is also present. When unsure, prefer false.
- matched_symptom_ids: ONLY ids from the vocabulary list above, and ONLY ones the PATIENT is CLEARLY, EXPLICITLY affirming about THEMSELVES in their current message. Map casual language onto the closest matching vocabulary id (e.g. "I feel dull/wiped out/no energy" -> fatigue). If not confident, leave it out.
- negated_symptom_ids: vocabulary ids the patient is explicitly denying or retracting in this message, whether or not they're currently tracked.
- unmatched_notes: any clinically relevant free-text detail, ABOUT THE PATIENT, that does NOT map onto a vocabulary id — short phrase, or empty string if nothing new.
- ready_for_confirmation: true once you have a reasonably complete picture — generally 2 or more tracked symptoms with obviously-needed clarification given, OR the patient indicates they're done. Never true if zero tracked symptoms.
- reply: your natural, warm, BRIEF (1-2 sentences) response to the patient. NEVER state or imply a diagnosis or ML prediction here — none has run yet. If is_health_related is false, still write a brief, kind redirect back to health topics. If the message was about something other than the patient's own health, gently clarify you can only assess their own symptoms.
- CRITICAL — NEVER FABRICATE ANYTHING: you have no tools, cannot book appointments, cannot call anyone, cannot access any live portal/database, and cannot look up real phone numbers, addresses, or reference numbers. If the patient asks for something like that, your reply must plainly say you can't do that, not invent an answer.

Patient name: ${userName}`;

  const history = chatHistory.slice(-10).map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text.substring(0, 500),
  }));

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ];

  const raw = await callWithFallback({ messages, maxTokens: 2000, temperature: 0, useBigModel: true, jsonMode: true });
  if (!raw) return null;

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const knownIds = new Set(knownSymptoms.map(s => s.id));
    const cleanIds = (arr) => (Array.isArray(arr) ? arr.filter(id => knownIds.has(id)) : []);

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
    console.error('analyzeSymptomTurn: failed to parse JSON:', err.message);
    return null;
  }
}

// ── Prescription structuring ─────────────────────────────────────────────
async function structurePrescription(rawText) {
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

  const messages = [{ role: 'system', content: prompt }];
  const raw = await callWithFallback({ messages, maxTokens: 700, temperature: 0, useBigModel: false, jsonMode: true });
  if (!raw) return null;

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed.medicines)) parsed.medicines = [];
    parsed.doctorName = parsed.doctorName || '';
    parsed.notes = parsed.notes || '';
    return parsed;
  } catch (err) {
    console.error('Prescription structuring failed:', err.message);
    return null;
  }
}

module.exports = { getGroqResponse, isOffTopic, structurePrescription, analyzeSymptomTurn };