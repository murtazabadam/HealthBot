const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const Prescription = require("../models/Prescription");
const Reminder = require("../models/Reminder");
const { getGroqResponse, isOffTopic, structurePrescription } = require("../config/groq");
const nodemailer = require("nodemailer");
const { geocodeAddress, findNearbyFacilities, FacilityLookupError } = require("../config/facilityFinder");
const { sendEmergencyAlertEmail } = require("../config/emailService");
const { sendSMS } = require("../config/smsService");
const { extractTextFromFile } = require("../config/ocr");
const axios = require("axios"); // Using axios for safe Node.js compatibility

// ── ML Engine Call ─────────────────────────────────────────────────────────────
async function getMLPrediction(text, symptoms) {
  try {
    const mlUrl =
      process.env.ML_ENGINE_URL ||
      "https://murtazabadam-healthbot-ml.hf.space/predict";

    // Replaced native fetch/AbortController with axios + timeout parameter
    const res = await axios.post(mlUrl, { text, symptoms }, { timeout: 30000 });
    console.log("ML:", JSON.stringify(res.data).substring(0, 200));
    return res.data;
  } catch (err) {
    console.error("ML error:", err.message);
    return null;
  }
}

// ── NL Map ────────────────────────────────────────────────────────────────────
function readableSymptom(id) {
  if (id === "unspecified_fever") return "Fever";
  return id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const NL_MAP = {
  "high fever": "high_fever",
  "mild fever": "mild_fever",
  // Bare "fever" doesn't say how severe it is — map it to a placeholder
  // that ISN'T a real ML symptom column, so it can never be silently
  // treated as high_fever. It only becomes high_fever/mild_fever once the
  // user actually states the severity (the clarification flow below asks).
  fever: "unspecified_fever",
  feverish: "unspecified_fever",
  "feel hot": "unspecified_fever",
  "high temperature": "high_fever",
  cough: "cough",
  coughing: "cough",
  "dry cough": "cough",
  mucus: "mucoid_sputum",
  phlegm: "mucoid_sputum",
  "coughing blood": "blood_in_sputum",
  "blood in cough": "blood_in_sputum",
  fatigue: "fatigue",
  tired: "fatigue",
  exhausted: "fatigue",
  weakness: "fatigue",
  weak: "fatigue",
  "no energy": "fatigue",
  lethargy: "lethargy",
  lethargic: "lethargy",
  "muscle weakness": "muscle_weakness",
  "weak muscles": "muscle_weakness",
  "severe headache": "severe_headache",
  headache: "headache",
  "head pain": "headache",
  "head hurts": "headache",
  migraine: "headache",
  nausea: "nausea",
  "feel sick": "nausea",
  nauseated: "nausea",
  vomiting: "vomiting",
  "throwing up": "vomiting",
  vomit: "vomiting",
  "stomach pain": "stomach_pain",
  "stomach ache": "stomach_pain",
  "belly pain": "stomach_pain",
  "tummy ache": "stomach_pain",
  "abdominal pain": "abdominal_pain",
  "stomach hurts": "stomach_pain",
  diarrhoea: "diarrhoea",
  diarrhea: "diarrhoea",
  "loose motion": "diarrhoea",
  "loose stool": "diarrhoea",
  constipation: "constipation",
  indigestion: "indigestion",
  acidity: "acidity",
  heartburn: "acidity",
  bloating: "distention_of_abdomen",
  bloated: "distention_of_abdomen",
  breathlessness: "breathlessness",
  "cant breathe": "breathlessness",
  "hard to breathe": "breathlessness",
  "shortness of breath": "breathlessness",
  "short of breath": "breathlessness",
  wheezing: "wheezing",
  "chest pain": "chest_pain",
  "chest hurts": "chest_pain",
  "chest tightness": "chest_pain",
  "skin rash": "skin_rash",
  rash: "skin_rash",
  "red spots": "skin_rash",
  itching: "itching",
  itchy: "itching",
  "itchy skin": "itching",
  "yellow skin": "yellowing_of_skin",
  "yellow eyes": "yellowing_of_eyes",
  jaundice: "yellowing_of_skin",
  "pale skin": "pale_skin",
  "joint pain": "joint_pain",
  "joints hurt": "joint_pain",
  "muscle pain": "muscle_pain",
  "body ache": "muscle_pain",
  "back pain": "back_pain",
  "lower back pain": "back_pain",
  "neck pain": "neck_pain",
  "stiff neck": "stiff_neck",
  "neck stiffness": "stiff_neck",
  "knee pain": "knee_pain",
  "hip pain": "hip_joint_pain",
  "runny nose": "runny_nose",
  cold: "runny_nose",
  "blocked nose": "continuous_sneezing",
  "stuffy nose": "continuous_sneezing",
  sneezing: "continuous_sneezing",
  "sore throat": "throat_irritation",
  "throat pain": "throat_irritation",
  "throat hurts": "throat_irritation",
  chills: "chills",
  shivering: "chills",
  "feel cold": "chills",
  "night sweats": "sweating",
  sweating: "sweating",
  "frequent urination": "frequent_urination",
  "burning urination": "burning_micturition",
  "painful urination": "burning_micturition",
  "dark urine": "dark_urine",
  "yellow urine": "yellow_urine",
  "blurry vision": "blurred_and_distorted_vision",
  "weight loss": "weight_loss",
  "losing weight": "weight_loss",
  "weight gain": "weight_gain",
  "gaining weight": "weight_gain",
  "no appetite": "loss_of_appetite",
  "loss of appetite": "loss_of_appetite",
  "not hungry": "loss_of_appetite",
  dizziness: "dizziness",
  dizzy: "dizziness",
  vertigo: "dizziness",
  anxiety: "anxiety",
  anxious: "anxiety",
  depression: "depression",
  depressed: "depression",
  palpitations: "palpitations",
  "heart racing": "palpitations",
  swelling: "swelling_joints",
  swollen: "swelling_joints",
  "swollen glands": "swelled_lymph_nodes",
  "lymph nodes": "swelled_lymph_nodes",
  "loss of smell": "loss_of_smell",
  "cant smell": "loss_of_smell",
  "excessive thirst": "polyuria",
  "very thirsty": "polyuria",
  thirst: "polyuria",
  "drinking a lot": "polyuria",
  "dry mouth": "dehydration",
  dehydrated: "dehydration",
  dehydration: "dehydration",
  "excessive hunger": "excessive_hunger",
  "always hungry": "excessive_hunger",
  "pain behind the eyes": "pain_behind_the_eyes",
  "pain behind eyes": "pain_behind_the_eyes",
  "eye pain": "pain_in_eyes",
  "red eyes": "redness_of_eyes",
  "watery eyes": "watering_from_eyes",
  "bloody stool": "bloody_stool",
  "blood in stool": "bloody_stool",
  insomnia: "restlessness",
  "cant sleep": "restlessness",
  "mood swings": "mood_swings",
  irritable: "irritability",
  "skin peeling": "skin_peeling",
  blisters: "blister",
  pus: "pus_filled_pimples",
  pimples: "pus_filled_pimples",
  "hair loss": "brittle_nails",
  "brittle nails": "brittle_nails",
  "mouth ulcers": "ulcers_on_tongue",
  "canker sores": "ulcers_on_tongue",
  // --- EMERGENCY SENSORIUM MAPPING ---
  confusion: "altered_sensorium",
  confused: "altered_sensorium",
  "cant think straight": "altered_sensorium",
  disoriented: "altered_sensorium",
  // --- SHORT-ANSWER CLARIFICATIONS ---
  mild: "mild_fever",
  moderate: "high_fever", // Mapped to high fever mathematically, but AI will recognize it
  high: "high_fever",
  severe: "severe_headache",
  dry: "cough",
};

const _SORTED = Object.keys(NL_MAP).sort((a, b) => b.length - a.length);

function _escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Runs the phrase match once and separates what was affirmed from what was
// explicitly negated ("fever but not headache" -> positive: fever, negated: headache).
function extractSymptomsWithNegation(text) {
  let lower = text.toLowerCase();
  const positive = new Set();
  const negated = new Set();

  for (const phrase of _SORTED) {
    const regex = new RegExp(`\\b${_escapeRegex(phrase)}\\b`, "g");
    let match;
    let newLower = lower;

    while ((match = regex.exec(lower)) !== null) {
      const contextBefore = lower.slice(
        Math.max(0, match.index - 25),
        match.index,
      );

      const isNegated =
        /\b(no|not|without|don'?t|doesn'?t|never|haven'?t)\b\s*([a-z]+\s*){0,3}$/.test(
          contextBefore,
        );

      if (isNegated) {
        negated.add(NL_MAP[phrase]);
      } else {
        positive.add(NL_MAP[phrase]);
      }

      newLower =
        newLower.substring(0, match.index) +
        " ".repeat(phrase.length) +
        newLower.substring(match.index + phrase.length);
    }
    lower = newLower;
  }

  return { positive, negated };
}

// De-dupes/reconciles related symptom ids once a final set has been built —
// shared by both the single-message and turn-aware extractors below.
function resolveSymptomConflicts(symptomsArray) {
  let final = symptomsArray;
  if (final.includes("mild_fever")) {
    final = final.filter((s) => s !== "high_fever" && s !== "unspecified_fever");
  }
  if (final.includes("high_fever")) {
    final = final.filter((s) => s !== "unspecified_fever");
  }
  if (final.includes("severe_headache")) {
    final = final.filter((s) => s !== "headache");
  }
  return final;
}

function extractSymptoms(text) {
  const { positive, negated } = extractSymptomsWithNegation(text);
  const finalSymptoms = [...positive].filter((s) => !negated.has(s));
  return resolveSymptomConflicts(finalSymptoms);
}

// Applies symptoms turn-by-turn across a conversation so a negation in a
// LATER message correctly cancels a symptom that was affirmed in an EARLIER
// one. A naive extractSymptoms(historyText + " " + text) call can't do this:
// once "headache" is found anywhere in the combined blob it stays forever,
// even if the user later says "not headache" — this fixes that.
function extractSymptomsFromTurns(historyTexts, currentText) {
  const active = new Set();
  for (const t of [...(historyTexts || []), currentText]) {
    if (!t) continue;
    const { positive, negated } = extractSymptomsWithNegation(t);
    for (const s of positive) active.add(s);
    for (const s of negated) active.delete(s);
  }
  return resolveSymptomConflicts([...active]);
}

// ── Intent Detection ───────────────────────────────────────────────────────────
function isHypotheticalQuestion(text) {
  const lower = text.toLowerCase().trim();
  const patterns = [
    /\bif\s+i\b[\s\S]*\b(will|would|could|might|can)\b/,
    /\b(will|would|could|might|can)\s+i\s+(get|have|develop|catch)\b/,
    /\bdoes\b[\s\S]*\bcause\b/,
    /\bwhat\s+causes\b/,
    /\bis\s+it\s+(bad|okay|ok|safe|fine)\s+to\s+eat\b/,
  ];
  return patterns.some((p) => p.test(lower));
}

function hasNonPersonSubject(text) {
  const lower = text.toLowerCase().trim();
  const nonPersonNouns = [
    "book",
    "chair",
    "table",
    "wall",
    "door",
    "window",
    "house",
    "building",
    "rock",
    "shoe",
    "bag",
    "pen",
    "bottle",
    "cup",
    "plate",
    "roof",
    "tv",
    "television",
    "fridge",
    "fan",
    "clock",
    "watch",
    "shirt",
    "sofa",
    "couch",
    "bed",
    "shelf",
    "cabinet",
    "drawer",
    "mirror",
    "lamp",
    "umbrella",
    "plant",
    "tree",
    "mouse",
    "keyboard",
    "monitor",
    "speaker",
    "remote",
    "charger",
    "router",
    "printer",
    "tablet",
    "camera",
    "headphone",
    "headphones",
    "earphone",
    "earphones",
    "laptop",
    "computer",
    "phone",
    "car",
    "bike",
    "bus",
    "train",
    "truck",
    "scooter",
    "plane",
    "boat",
    "ship",
    "rat",
    "dog",
    "cat",
    "cow",
    "goat",
    "horse",
    "bird",
    "fish",
    "lizard",
    "snake",
    "frog",
    "ant",
    "bee",
    "insect",
    "hamster",
    "rabbit",
    "parrot",
    "chicken",
    "goose",
    "duck",
  ];
  const nounsPattern = nonPersonNouns.join("|");
  const determinerPattern = new RegExp(
    `\\b(this|that|the|my|our|his|her|their|a|an)\\s+(${nounsPattern})\\b`,
  );
  const bareSubjectPattern = new RegExp(
    `^(${nounsPattern})\\s+(is|are|has|have|having|suffers|suffering|feels|feeling|seems|looks)\\b`,
  );
  return determinerPattern.test(lower) || bareSubjectPattern.test(lower);
}

// A bare "yes"/"no"/"a little"/etc. carries almost no signal on its own —
// asking the off-topic LLM classifier to judge it reliably, every time, is
// asking too much of a small fast model at near-zero context. Rather than
// try to make that probabilistic call more reliable, short-circuit it
// entirely: a short reply arriving while a conversation is already under
// way is treated as a continuation, deterministically, with no model call.
// This is also what the classifier's own prompt already says it SHOULD do
// ("short conversational reply continuing a prior health discussion") —
// this just makes that guarantee, instead of hoping the model gets there.
const SHORT_CONTINUATION_WORDS = [
  "yes", "yeah", "yep", "yup", "no", "nope", "nah",
  "ok", "okay", "sure", "maybe", "none", "nothing",
  "worse", "better", "same", "still", "not yet", "a little",
  "not really", "not much", "somewhat", "kind of", "sort of",
];
const SHORT_CONTINUATION_WORD_LIMIT = 4;

function isShortConversationalReply(text, hasConversation) {
  if (!hasConversation) return false;
  const trimmed = text.trim().toLowerCase();
  if (!trimmed) return false;
  if (trimmed.split(/\s+/).length <= SHORT_CONTINUATION_WORD_LIMIT) {
    if (SHORT_CONTINUATION_WORDS.some((w) => trimmed === w || trimmed.startsWith(w + " "))) {
      return true;
    }
    // Even without matching the exact word list, a very short (1-2 word)
    // reply mid-conversation is far more likely to be answering the bot's
    // last question than starting a new, unrelated topic.
    if (trimmed.split(/\s+/).length <= 2) return true;
  }
  return false;
}

// Answers to "how long have you had this?" — "from yesterday's morning",
// "since 2 days", "for about a week" — are obviously continuations of the
// clinical intake, but they're often 3-6 words and don't match any entry
// in SHORT_CONTINUATION_WORDS, so isShortConversationalReply above misses
// them and they used to fall through to the off-topic LLM classifier,
// which can and did misfire on them. Recognize the shape of a duration
// answer directly instead of relying on an exact word-list match.
const DURATION_ANSWER_WORD_LIMIT = 8;
const DURATION_ANSWER_PATTERN =
  /\b(yesterday'?s?|today|tonight|this\s+(morning|afternoon|evening|week)|last\s+(night|week|month)|since|ago|\d*\s*(days?|weeks?|months?|hours?|mins?|minutes?))\b/;

function isDurationAnswer(text, hasConversation) {
  if (!hasConversation) return false;
  const trimmed = text.trim().toLowerCase();
  if (!trimmed) return false;
  if (trimmed.split(/\s+/).length > DURATION_ANSWER_WORD_LIMIT) return false;
  return DURATION_ANSWER_PATTERN.test(trimmed);
}

function detectIntent(text) {
  const lower = text.toLowerCase().trim();
  const greetings = [
    "hi",
    "hello",
    "hey",
    "good morning",
    "good evening",
    "good afternoon",
    "good night",
    "salam",
    "assalam",
    "namaste",
  ];
  if (
    greetings.some(
      (g) =>
        lower === g || lower.startsWith(g + " ") || lower.startsWith(g + ","),
    )
  )
    return "greeting";
  if (
    ["how are you", "how r u", "whats up", "what's up"].some((p) =>
      lower.includes(p),
    )
  )
    return "how_are_you";
  if (
    ["thank", "thanks", "jazakallah", "shukriya", "thx"].some((t) =>
      lower.includes(t),
    )
  )
    return "thanks";
  if (
    ["help", "what can you do", "how does this work"].some((h) =>
      lower.includes(h),
    )
  )
    return "help";
  if (
    ["bye", "goodbye", "khuda hafiz", "allah hafiz", "take care"].some((f) =>
      lower.includes(f),
    )
  )
    return "farewell";
  if (
    [
      "find a doctor", "find doctor", "find a clinic", "find clinic",
      "nearby hospital", "nearest hospital", "nearby clinic", "nearest clinic",
      "doctor near me", "hospital near me", "clinic near me",
      "need a doctor", "recommend a doctor", "suggest a doctor",
      "where can i find a doctor", "where can i see a doctor",
    ].some((p) => lower.includes(p))
  )
    return "find_doctor";
  if (
    extractSymptoms(text).length > 0 &&
    !isHypotheticalQuestion(text) &&
    !hasNonPersonSubject(text)
  )
    return "symptoms";
  return "conversational";
}

// ── Emergency Check ────────────────────────────────────────────────────────────
function checkEmergency(symptoms) {
  const combos = [
    ["chest_pain", "breathlessness"],
    ["chest_pain", "sweating"],
    ["chest_pain", "palpitations"],
    ["severe_headache", "vomiting"],
  ];
  if (combos.some((combo) => combo.every((s) => symptoms.includes(s)))) {
    return true;
  }
  // Fever + confusion/stiff neck is a red-flag combo regardless of whether
  // severity has been clarified yet — don't wait on "mild vs high" to flag it.
  const hasFever =
    symptoms.includes("high_fever") || symptoms.includes("unspecified_fever");
  if (
    hasFever &&
    (symptoms.includes("altered_sensorium") || symptoms.includes("stiff_neck"))
  ) {
    return true;
  }
  return false;
}

// ── Fallback ──────────────────────────────────────────────────────────────────
function getFallbackReply(intent, userName) {
  const name = userName ? userName.split(" ")[0] : "there";
  const h = new Date().getHours();
  const time =
    h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const map = {
    greeting: `${time}, ${name}! 👋 I am HealthBot, your AI medical assistant.\n\nDescribe your symptoms and I will analyse them for you. The more detail you give, the more accurate my analysis!`,
    how_are_you: `Fully operational and ready to help, ${name}! 🤖\n\nHow are you feeling today? Describe any symptoms you have.`,
    thanks: `You are welcome, ${name}! 😊 Remember to consult a real doctor for professional advice. Take care!`,
    help: `Here is what I can do, ${name}:\n\n🔍 Analyse symptoms → identify possible diseases\n📊 Show confidence levels for each prediction\n⚠️ Rate severity: Mild / Moderate / Serious / Severe\n💊 Give recommendations and precautions\n\nExample: "I have fever, headache and joint pain"`,
    farewell: `Goodbye, ${name}! 👋 Take care and see a doctor if symptoms are severe. Allah Hafiz!`,
  };
  return (
    map[intent] ||
    `${time}, ${name}! I am HealthBot. Describe your symptoms and I will help analyse them.`
  );
}

// Location-specific pain/ache symptom ids — if any of these are present,
// the patient HAS already specified where it hurts, even though the
// generic "pain"/"hurts"/"ache" words also appear in the raw text.
const LOCATED_PAIN_SYMPTOMS = new Set([
  "chest_pain", "stomach_pain", "abdominal_pain", "joint_pain",
  "muscle_pain", "back_pain", "neck_pain", "knee_pain", "hip_joint_pain",
  "pain_in_eyes", "pain_behind_the_eyes", "throat_irritation",
]);

// How many consecutive bot turns are allowed to stay in "clinical intake"
// mode (asking clarifying questions, box hidden) before we force a reveal
// regardless of the usual thresholds. This is a hard backstop: whatever
// specific clarification logic exists above it, no patient should ever be
// able to get stuck answering the same handful of questions forever.
const MAX_CLARIFICATION_TURNS = 4;

// ── Build ML Section & Clinical Intake Logic ────────────────────────────────────
// `symptoms` here is always the already negation-resolved id set (from
// extractSymptoms/extractSymptomsFromTurns + resolveSymptomConflicts) —
// NOT raw text. That matters: it's what lets the checks below tell "user
// said mild_fever" apart from "user said fever", and "headache was
// negated so it's simply absent" apart from "headache was never
// mentioned". Checking raw text instead (the old approach) can't make
// either distinction, which is what caused the infinite follow-up loop.
function buildMLSection(mlResult, symptoms, rawText, recentHistory = []) {
  if (
    !mlResult ||
    mlResult.error ||
    !mlResult.predictions ||
    mlResult.predictions.length === 0
  )
    return null;

  const top = mlResult.predictions[0];
  const matched = (mlResult.matched_symptoms || symptoms).map((s) =>
    s.replace(/_/g, " "),
  );

  const lowerText = (rawText || "").toLowerCase();

  // 1. DURATION TRACKER
  const hasDuration =
    /\b(days?|weeks?|months?|hours?|mins?|minutes?|since|yesterday|today|morning|night|evening)\b/.test(
      lowerText,
    ) || /\d+/.test(lowerText);

  // 2. CLARIFICATION ENGINE
  // Fever/headache severity are read off the RESOLVED symptom set, not
  // raw text — this is negation-safe ("fever but not headache" never
  // leaves "headache" in `symptoms`) and answer-safe (once the user says
  // "mild", NL_MAP already turns that into mild_fever, which clears
  // unspecified_fever — no need to see the literal phrase "mild fever").
  let mustHideBox = false;
  let doctorInstructions = "";

  if (!hasDuration) {
    mustHideBox = true;
    doctorInstructions +=
      " The patient hasn't mentioned a timeline. Ask them exactly how long they have been experiencing these symptoms.";
  }

  if (symptoms.includes("unspecified_fever")) {
    mustHideBox = true;
    doctorInstructions +=
      " They mentioned a fever but haven't said how severe. Ask: 'Is your fever mild, moderate, or high?'";
  }
  if (symptoms.includes("headache")) {
    mustHideBox = true;
    doctorInstructions +=
      " They mentioned a headache. Ask: 'Is your headache a normal headache, or is it severe?'";
  }
  // Cough has no dedicated "unspecified" placeholder id (dry/mucus/blood
  // all still just resolve to "cough" or a companion id), so this one
  // still has to look at raw text — but only the TAIL of it (recent
  // turns), not the ever-growing full history, so an old, already-
  // answered mention can't keep re-triggering it turn after turn.
  const recentTailText = lowerText.slice(-150);
  if (
    symptoms.includes("cough") &&
    /\bcough(ing)?\b/.test(lowerText) &&
    !/mucus|phlegm|dry|blood/.test(recentTailText)
  ) {
    mustHideBox = true;
    doctorInstructions +=
      " They mentioned a cough. Ask: 'Is it a dry cough, or are you coughing up mucus/phlegm?'";
  }
  if (
    /\b(swell|swelling|swollen)\b/.test(lowerText) &&
    !symptoms.some((s) =>
      ["swelling_joints", "swelled_lymph_nodes"].includes(s),
    ) &&
    !/joint|gland|lymph/.test(recentTailText)
  ) {
    mustHideBox = true;
    doctorInstructions +=
      " They mentioned swelling. Ask: 'Where exactly is the swelling located (e.g., joints, face, throat, glands)?'";
  }
  if (
    /\bpain\b|\bhurts\b|\bache\b/.test(lowerText) &&
    !symptoms.some((s) => LOCATED_PAIN_SYMPTOMS.has(s)) &&
    !/chest|stomach|joint|muscle|back|neck|knee|hip|eye|throat|head|body|ear|tooth/.test(
      recentTailText,
    )
  ) {
    mustHideBox = true;
    doctorInstructions +=
      " They mentioned pain but didn't specify where. Ask: 'Which specific part of your body hurts?'";
  }

  // 2b. LOOP BACKSTOP — count how many bot replies in a row have already
  // been intake-only (no ML box shown). If we're at/past the cap, stop
  // asking and reveal whatever we've got instead of asking again — a
  // guaranteed exit, independent of which clarification rule is stuck.
  let consecutiveIntakeTurns = 0;
  for (let i = recentHistory.length - 1; i >= 0; i--) {
    const m = recentHistory[i];
    if (m.sender !== "bot") continue;
    if (m.text && m.text.includes("📊 ML Analysis")) break;
    consecutiveIntakeTurns++;
  }
  const forceReveal = consecutiveIntakeTurns >= MAX_CLARIFICATION_TURNS;
  if (forceReveal) mustHideBox = false;

  // 3. THE 3-PILLAR SECURITY LOCK
  if (!forceReveal && (symptoms.length < 3 || top.confidence < 60 || mustHideBox)) {
    const suggested =
      mlResult.followup_question || "fatigue, dizziness, or nausea";

    if (symptoms.length > 0 && doctorInstructions === "") {
      doctorInstructions +=
        " Ask them to elaborate on the severity of their symptoms (are they mild, moderate, or severe?).";
    }

    return {
      summary: `The user reported: ${matched.join(", ")}. You are a compassionate AI doctor conducting a clinical intake. Do NOT mention any specific diseases, do NOT guess, and do NOT mention severity yet. Your goal is to gather a complete clinical picture. IMPORTANT INSTRUCTIONS: ${doctorInstructions} Also ask if they have other symptoms like ${suggested}. Keep your response empathetic, conversational, and brief (1-2 sentences).`,
      block: "",
    };
  }

  // PASSES ALL CHECKS -> REVEAL ML BOX
  const others = mlResult.predictions
    .slice(1)
    .filter((p) => p.confidence > 3)
    .map((p) => `${p.disease} (${p.confidence}%)`)
    .join(", ");
  const description = top.description ? `\n📖 ${top.description}` : "";
  const precautions = top.precautions?.length
    ? `\n\n💡 Precautions:\n${top.precautions
        .slice(0, 3)
        .map((p) => `• ${p}`)
        .join("\n")}`
    : "";
  const tip =
    mlResult.low_confidence || (forceReveal && (symptoms.length < 3 || top.confidence < 60))
      ? `\n\n⚡ Tip: Describe more symptoms for better accuracy.`
      : "";
  const followup = mlResult.followup_question
    ? `\n\n❓ ${mlResult.followup_question}`
    : "";

  return {
    summary: `Top prediction: ${top.disease} (${top.confidence}% confidence). Severity: ${mlResult.severity}. Based on this, give compassionate, brief advice.`,
    block: `📊 ML Analysis (${matched.join(", ")}):\n📋 Most likely: ${top.disease} (${top.confidence}%)\n${others ? `📌 Also possible: ${others}\n` : ""}⚠️ Severity: ${mlResult.severity}\n${description}\n💊 ${mlResult.recommendation}${precautions}${tip}${followup}\n\n⚕️ Not a substitute for professional medical advice.`,
  };
}

// ── GET /api/chat/find-doctors ────────────────────────────────────────────────
router.get("/find-doctors", auth, async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    let latitude, longitude, locationSource;

    if (lat && lon) {
      latitude = parseFloat(lat);
      longitude = parseFloat(lon);
      locationSource = "gps";
    } else if (user.address) {
      const geo = await geocodeAddress(user.address);
      if (!geo) {
        return res.status(400).json({
          message: "Could not determine your location from your saved address",
          hint: "Try enabling GPS, or update your address in Profile settings",
        });
      }
      latitude = geo.latitude;
      longitude = geo.longitude;
      locationSource = "address";
    } else {
      return res.status(400).json({
        message: "No location available",
        hint: "Enable GPS or add an address in Profile settings",
      });
    }

    let facilities;
    try {
      facilities = await findNearbyFacilities(latitude, longitude);
    } catch (err) {
      if (err instanceof FacilityLookupError) {
        console.error("Find-doctors: all Overpass mirrors failed:", err.message);
        return res.status(503).json({
          message: "The facility search is temporarily unavailable — the map data service isn't responding.",
          hint: "Please try again in a minute, or search directly on Google Maps.",
        });
      }
      throw err;
    }

    res.json({
      facilities,
      locationSource,
      resolvedLocation: { latitude, longitude },
    });
  } catch (err) {
    console.error("Find-doctors error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/chat/notify-emergency ─────────────────────────────────────────
// Called by the frontend whenever an emergency is detected (either the ML/
// keyword emergency check on a chat message, or the user's explicit
// "Trigger Emergency Alert" action). Notifies the user's saved emergency
// contact by email and/or SMS — whichever channels are on file — and
// includes a Google Maps link when GPS coordinates were provided.
//
// This intentionally never fails loudly: a missing/misconfigured contact,
// or an email/SMS provider hiccup, still returns 200 with emailSent/smsSent
// flags so the frontend (which only logs a console error on failure) can't
// accidentally block the chat UI during an actual emergency. The real
// signal for "did it work" is emailSent/smsSent in the response, which
// callers can check if they want to surface it.
router.post("/notify-emergency", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { latitude, longitude } = req.body || {};
    const hasCoords =
      typeof latitude === "number" && typeof longitude === "number" &&
      !Number.isNaN(latitude) && !Number.isNaN(longitude);
    const mapsUrl = hasCoords
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : null;

    const contactEmail = user.emergencyContactEmail;
    const contactPhone = user.emergencyContactPhone;
    const contactName = user.emergencyContactName;

    if (!contactEmail && !contactPhone) {
      return res.status(200).json({
        message: "No emergency contact on file — nothing was sent.",
        hint: "Add an emergency contact email or phone number in Profile settings.",
        emailSent: false,
        smsSent: false,
        hasCoords,
      });
    }

    const smsMessage =
      `HealthBot Emergency Alert: ${user.name} may need immediate help.` +
      (mapsUrl ? ` Location: ${mapsUrl}` : "") +
      ` Please try to reach them now.`;

    const [emailSent, smsSent] = await Promise.all([
      contactEmail
        ? sendEmergencyAlertEmail(contactEmail, contactName, user.name, mapsUrl)
        : Promise.resolve(false),
      contactPhone ? sendSMS(contactPhone, smsMessage) : Promise.resolve(false),
    ]);

    res.json({
      message: "Emergency alert processed.",
      emailSent,
      smsSent,
      hasCoords,
    });
  } catch (err) {
    console.error("Notify-emergency error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── Prescription Read Route ────────────────────────────────────────────────
// Accepts a base64 image (data URL) of a prescription photo, OCRs it,
// asks the AI to structure the result into a medicine list, saves it, and
// auto-creates Reminder documents so the scheduler starts pinging the user
// at the right times for each medicine it could confidently parse.
function buildTimesForFrequency(timesPerDay) {
  const n = Number(timesPerDay);
  if (!Number.isFinite(n) || n <= 0) return [];
  const presets = {
    1: ["09:00"],
    2: ["09:00", "21:00"],
    3: ["08:00", "14:00", "20:00"],
    4: ["08:00", "12:00", "16:00", "20:00"],
  };
  return presets[Math.min(Math.round(n), 4)] || presets[4];
}

router.post("/prescription", auth, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image || typeof image !== "string") {
      return res.status(400).json({ message: "A prescription image or PDF is required" });
    }

    // Accept photos and PDFs — both arrive as data URLs from the frontend's
    // FileReader, distinguished by mime prefix.
    const isPdf = image.startsWith("data:application/pdf");
    const fileType = isPdf ? "pdf" : "image";

    const rawText = await extractTextFromFile(image);
    if (!rawText) {
      return res.status(422).json({
        message: isPdf
          ? "Couldn't read any text from that PDF. Make sure it's not empty or corrupted."
          : "Couldn't read any text from that image. Try a clearer, well-lit photo.",
      });
    }

    let structured = process.env.GROQ_API_KEY ? await structurePrescription(rawText) : null;
    if (!structured) structured = { doctorName: "", medicines: [], notes: "" };

    const prescription = new Prescription({
      userId: req.user.id,
      rawText,
      medicines: structured.medicines,
      doctorName: structured.doctorName,
      notes: structured.notes,
      image,
      fileType,
    });
    await prescription.save();

    // Auto-create reminders for every medicine with a usable dosing frequency.
    const createdReminders = [];
    const now = new Date();
    for (const med of structured.medicines) {
      const times = buildTimesForFrequency(med.timesPerDay);
      if (!times.length || !med.name) continue;

      const durationDays =
        Number.isFinite(med.durationDays) && med.durationDays > 0 ? med.durationDays : 5; // sane default if AI couldn't extract one

      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + durationDays);

      const reminder = new Reminder({
        userId: req.user.id,
        name: med.dosage ? `${med.name} (${med.dosage})` : med.name,
        instructions: med.instructions || "",
        times,
        startDate: now,
        endDate,
        source: "prescription",
        prescriptionId: prescription._id,
      });
      await reminder.save();
      createdReminders.push(reminder);
    }

    res.status(201).json({
      message: createdReminders.length
        ? `Prescription read. Set up ${createdReminders.length} medicine reminder(s) automatically.`
        : "Prescription read, but no medicines with a clear dosing schedule were found — you can add reminders manually.",
      prescription,
      reminders: createdReminders,
    });
  } catch (err) {
    console.error("Prescription route error:", err.message);
    res.status(500).json({ message: "Failed to process prescription image" });
  }
});

// ── Prescriptions List ────────────────────────────────────────────────────────
router.get("/prescriptions", auth, async (req, res) => {
  try {
    const items = await Prescription.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Deleting a prescription also removes any reminders it auto-created —
// otherwise they'd be orphaned (still firing, but pointing at a
// prescriptionId that no longer resolves to anything in the Prescriptions
// tab), which would be confusing to leave behind.
router.delete("/prescriptions/:id", auth, async (req, res) => {
  try {
    const prescription = await Prescription.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }
    const deletedReminders = await Reminder.deleteMany({
      prescriptionId: prescription._id,
      userId: req.user.id,
    });
    res.json({
      message: "Prescription deleted",
      remindersRemoved: deletedReminders.deletedCount || 0,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── Reminders CRUD ─────────────────────────────────────────────────────────────
router.get("/reminders", auth, async (req, res) => {
  try {
    const items = await Reminder.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/reminders", auth, async (req, res) => {
  try {
    const { name, instructions = "", times, startDate, endDate } = req.body;
    if (!name || !Array.isArray(times) || times.length === 0 || !startDate) {
      return res.status(400).json({ message: "name, times[], and startDate are required" });
    }
    const reminder = new Reminder({
      userId: req.user.id,
      name,
      instructions,
      times,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      source: "manual",
    });
    await reminder.save();
    res.status(201).json(reminder);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/reminders/:id", auth, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, userId: req.user.id });
    if (!reminder) return res.status(404).json({ message: "Reminder not found" });

    const { name, instructions, times, startDate, endDate, active } = req.body;
    if (name !== undefined) reminder.name = name;
    if (instructions !== undefined) reminder.instructions = instructions;
    if (Array.isArray(times) && times.length) reminder.times = times;
    if (startDate !== undefined) reminder.startDate = new Date(startDate);
    if (endDate !== undefined) reminder.endDate = endDate ? new Date(endDate) : null;
    if (active !== undefined) reminder.active = active;
    await reminder.save();
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/reminders/:id", auth, async (req, res) => {
  try {
    await Reminder.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: "Reminder deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── Message Route ──────────────────────────────────────────────────────────────
router.post("/message", auth, async (req, res) => {
  try {
    const { text, saveHistory = true } = req.body;
    const user = await User.findById(req.user.id);
    const userName = user ? user.name : "there";

    let conv = null;
    let recentHistory = [];
    if (saveHistory) {
      conv = await Conversation.findOne({ userId: req.user.id });
      recentHistory = conv ? conv.messages.slice(-12) : [];
    }
    const hasConversation = recentHistory.length > 0;

    const intent = detectIntent(text);
    let botReply = "";
    let mlResult = null;
    let emergency = false;
    let facilities = null;

    if (intent === "symptoms") {
      const newSymptoms = extractSymptoms(text);

      const historyText = recentHistory
        .filter((m) => m.sender === "user")
        .map((m) => m.text)
        .join(" ");
      const historyTexts = recentHistory
        .filter((m) => m.sender === "user")
        .map((m) => m.text);
      const combinedSymptoms = extractSymptomsFromTurns(historyTexts, text);

      emergency = checkEmergency(combinedSymptoms);

      if (!emergency) {
        if (saveHistory) {
          if (!conv)
            conv = new Conversation({ userId: req.user.id, messages: [] });
          conv.messages.push({ sender: "user", text });
          await conv.save();
        }

        return res.json({
          needsConfirmation: true,
          originalText: text,
          detectedSymptoms: newSymptoms.map((id) => ({
            id,
            label: readableSymptom(id),
          })),
          intent,
          emergency: false,
        });
      }

      mlResult = await getMLPrediction(
        historyText + " " + text,
        combinedSymptoms,
      );
      const ml = buildMLSection(
        mlResult,
        combinedSymptoms,
        historyText + " " + text,
        recentHistory,
      );

      if (process.env.GROQ_API_KEY && ml && ml.summary) {
        try {
          console.log("Calling Groq AI...");
          const aiText = await getGroqResponse(
            text,
            ml.summary,
            userName,
            recentHistory,
          );

          if (ml.block) {
            botReply = aiText ? `${aiText}\n\n${ml.block}` : ml.block;
          } else {
            botReply =
              aiText ||
              `Could you please provide more details about your symptoms, ${userName.split(" ")[0]}?`;
          }
        } catch (err) {
          console.error("Groq failed:", err.message);
          botReply =
            ml.block ||
            "I am having trouble connecting to my brain. Please provide more symptoms.";
        }
      } else {
        botReply =
          ml && ml.block
            ? ml.block
            : `I need more symptom details, ${userName.split(" ")[0]}. Please describe what you are feeling and how long you've felt this way.`;
      }
    } else if (
      ["greeting", "how_are_you", "thanks", "farewell", "help"].includes(
        intent,
      ) &&
      !hasConversation
    ) {
      botReply = getFallbackReply(intent, userName);
    } else if (intent === "find_doctor") {
      if (!user || !user.address) {
        botReply = `I'd like to help you find a nearby facility, ${userName.split(" ")[0]}, but I don't have an address on file for you yet. Add one in your Profile, or use the dedicated Care Locator tab which can use your live GPS location instead.`;
      } else {
        const geo = await geocodeAddress(user.address);
        if (!geo) {
          botReply = `I couldn't pinpoint your saved address (${user.address}) on the map, ${userName.split(" ")[0]}. Try the Care Locator tab, or double-check your address in Profile settings.`;
        } else {
          try {
            facilities = await findNearbyFacilities(geo.latitude, geo.longitude);
            if (!facilities.length) {
              botReply = `I couldn't find any listed hospitals or clinics near ${user.address} in OpenStreetMap's data. Try the Care Locator tab for a wider search, or search nearby facilities directly on Google Maps.`;
            } else {
              const top3 = facilities
                .slice(0, 3)
                .map((f) => `${f.name} (${f.type}, ${f.distanceKm} km away)`)
                .join(", ");
              botReply = `Here are the nearest facilities to ${user.address}, ${userName.split(" ")[0]}: ${top3}. See the Care Locator tab for the full list with directions.`;
            }
          } catch (err) {
            if (err instanceof FacilityLookupError) {
              botReply = `The facility search is temporarily unavailable, ${userName.split(" ")[0]} — please try again in a minute, or search directly on Google Maps.`;
            } else {
              throw err;
            }
          }
        }
      }
    } else {
      const offTopic =
        !isShortConversationalReply(text, hasConversation) &&
        !isDurationAnswer(text, hasConversation) &&
        process.env.GROQ_API_KEY
          ? await isOffTopic(text, recentHistory)
          : false;

      if (offTopic) {
        botReply = `That's outside what I can help with, ${userName.split(" ")[0]} — I'm a medical symptom assistant, so I can only help with health, symptoms, and wellness questions. Is there anything going on with your health I can help you with?`;
      } else if (process.env.GROQ_API_KEY) {
        try {
          console.log("Calling Groq AI for conversation...");

          const historyText = recentHistory
            .filter((m) => m.sender === "user")
            .map((m) => m.text)
            .join(" ");
          const historyTexts = recentHistory
            .filter((m) => m.sender === "user")
            .map((m) => m.text);
          const historicalSymptoms = extractSymptomsFromTurns(historyTexts, "");

          if (historicalSymptoms.length > 0) {
            mlResult = await getMLPrediction(historyText, historicalSymptoms);
            const ml = buildMLSection(
              mlResult,
              historicalSymptoms,
              historyText + " " + text,
              recentHistory,
            );
            const aiText = await getGroqResponse(
              text,
              ml?.summary || null,
              userName,
              recentHistory,
            );

            if (ml && ml.block) {
              botReply = aiText ? `${aiText}\n\n${ml.block}` : ml.block;
            } else {
              botReply = aiText || getFallbackReply(intent, userName);
            }
          } else {
            const aiText = await getGroqResponse(
              text,
              null,
              userName,
              recentHistory,
            );
            botReply = aiText || getFallbackReply(intent, userName);
          }
        } catch (err) {
          console.error("Groq conversation failed:", err.message);
          botReply = getFallbackReply(intent, userName);
        }
      } else {
        botReply = getFallbackReply(intent, userName);
      }
    }

    if (saveHistory) {
      if (!conv) conv = new Conversation({ userId: req.user.id, messages: [] });
      conv.messages.push({ sender: "user", text });
      conv.messages.push({ sender: "bot", text: botReply });
      await conv.save();
    }

    res.json({ reply: botReply, mlResult, intent, emergency, facilities });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── History Route ──────────────────────────────────────────────────────────────
router.get("/history", auth, async (req, res) => {
  try {
    const conv = await Conversation.findOne({ userId: req.user.id });
    res.json(conv ? conv.messages : []);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── Clear History Route ────────────────────────────────────────────────────────
router.delete("/history", auth, async (req, res) => {
  try {
    await Conversation.findOneAndDelete({ userId: req.user.id });
    res.json({ message: "Chat history cleared" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── Confirm Symptoms Route ───────────────────────────────────────────────────
router.post("/confirm-symptoms", auth, async (req, res) => {
  try {
    const { symptoms, originalText, saveHistory = true } = req.body;
    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one symptom is required" });
    }

    const user = await User.findById(req.user.id);
    const userName = user ? user.name : "there";
    const text = originalText || symptoms.map(readableSymptom).join(", ");

    let conv = null;
    let recentHistory = [];
    if (saveHistory) {
      conv = await Conversation.findOne({ userId: req.user.id });
      recentHistory = conv ? conv.messages.slice(-12) : [];
    }

    const historyText = recentHistory
      .filter((m) => m.sender === "user")
      .map((m) => m.text)
      .join(" ");
    // combinedSymptoms trusts the user's confirmed checkbox selection as
    // authoritative. We deliberately do NOT re-merge a fresh raw-text
    // extraction on top of it here — that used to silently re-add a
    // symptom the user had just explicitly unchecked (e.g. deselecting
    // "headache" during confirmation, only for it to reappear because the
    // word still existed somewhere in the raw conversation text).
    const combinedSymptoms = [...new Set(symptoms)];

    const mlResult = await getMLPrediction(
      historyText + " " + text,
      combinedSymptoms,
    );
    const ml = buildMLSection(
      mlResult,
      combinedSymptoms,
      historyText + " " + text,
      recentHistory,
    );

    let botReply;
    if (process.env.GROQ_API_KEY && ml && ml.summary) {
      try {
        const aiText = await getGroqResponse(
          text,
          ml.summary,
          userName,
          recentHistory,
        );
        if (ml.block) {
          botReply = aiText ? `${aiText}\n\n${ml.block}` : ml.block;
        } else {
          botReply =
            aiText || "Please tell me more about what you are experiencing.";
        }
      } catch (err) {
        console.error("Groq failed:", err.message);
        botReply = ml.block || "Please provide more details.";
      }
    } else {
      botReply =
        ml && ml.block
          ? ml.block
          : `I need more symptom details, ${userName.split(" ")[0]}. Please describe what you are feeling in more detail.`;
    }

    if (saveHistory) {
      if (!conv) conv = new Conversation({ userId: req.user.id, messages: [] });
      conv.messages.push({ sender: "bot", text: botReply });
      await conv.save();
    }

    res.json({
      reply: botReply,
      mlResult,
      intent: "symptoms",
      emergency: false,
    });
  } catch (err) {
    console.error("Confirm-symptoms error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// IDs that exist purely as internal placeholders for the natural-language
// clarification flow (e.g. bare "fever" before severity is known). They're
// deliberately not real ML columns, so offering them in the manual picker
// would let a symptom silently vanish from prediction with no chance to
// ask "how severe?" — exclude them; "High Fever"/"Mild Fever" cover it.
const NON_PICKABLE_SYMPTOM_IDS = new Set(["unspecified_fever"]);

// ── Symptom Options Route ────────────────────────────────────────────────────
router.get("/symptom-options", auth, (req, res) => {
  const ids = [...new Set(Object.values(NL_MAP))]
    .filter((id) => !NON_PICKABLE_SYMPTOM_IDS.has(id))
    .sort();
  res.json(ids.map((id) => ({ id, label: readableSymptom(id) })));
});

// ── Email Reminder Route ──────────────────────────────────────────────────────
router.post("/email-reminder", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { reminderName, time } = req.body;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `⏰ HealthBot Reminder: ${reminderName}`,
      text: `Hello ${user.name},\n\nThis is your friendly HealthBot reminder!\n\nIt is time for: ${reminderName}\nScheduled at: ${time}\n\nStay healthy!\n- The HealthBot Team`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Reminder email sent successfully!" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// NOTE: an older, duplicate "/facilities" route used to live here (a second,
// less robust Overpass implementation with no mirror fallback). It was never
// called by the frontend (which only uses GET /find-doctors, see
// frontend/src/config.js) and has been removed so there's a single source of
// truth for facility lookups: config/facilityFinder.js.

module.exports = router;