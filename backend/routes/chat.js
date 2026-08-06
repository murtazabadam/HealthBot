const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const { getGroqResponse, isOffTopic } = require("../config/groq");
const nodemailer = require("nodemailer"); // Added for Email Summary feature

// ── ML Engine Call ─────────────────────────────────────────────────────────────
async function getMLPrediction(text, symptoms) {
  try {
    const mlUrl =
      process.env.ML_ENGINE_URL ||
      "https://murtazabadam-healthbot-ml.hf.space/predict";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(mlUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, symptoms }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await res.json();
    console.log("ML:", JSON.stringify(data).substring(0, 200));
    return data;
  } catch (err) {
    console.error("ML error:", err.message);
    return null;
  }
}

// ── NL Map ────────────────────────────────────────────────────────────────────
function readableSymptom(id) {
  return id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const NL_MAP = {
  "high fever": "high_fever",
  "mild fever": "mild_fever",
  fever: "high_fever",
  feverish: "high_fever",
  "feel hot": "high_fever",
  "high temperature": "high_fever",
  cough: "cough",
  coughing: "cough",
  "dry cough": "cough",
  mucus: "mucoid_sputum",
  phlegm: "mucoid_sputum",
  fatigue: "fatigue",
  tired: "fatigue",
  exhausted: "fatigue",
  weakness: "fatigue",
  weak: "fatigue",
  "no energy": "fatigue",
  lethargy: "lethargy",
  lethargic: "lethargy",
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
  "loss of smell": "loss_of_smell",
  "cant smell": "loss_of_smell",
  "excessive thirst": "polyuria",
  "very thirsty": "polyuria",
  thirst: "polyuria",
  "drinking a lot": "polyuria",
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
};

const _SORTED = Object.keys(NL_MAP).sort((a, b) => b.length - a.length);

function _escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function _containsPhrase(lower, phrase) {
  return new RegExp(`\\b${_escapeRegex(phrase)}\\b`).test(lower);
}

// Long, unrelated text (a pasted paragraph, an article, etc.) needs a
// meaningful ratio of recognized symptom terms before it's trusted — a
// couple of coincidental real-word matches inside 150+ words of unrelated
// text should not be treated as a genuine symptom report. This mirrors the
// same guard already used in the Python ML engine, ported here because the
// confirmation checklist displays Node's extraction directly, before the
// ML engine ever gets a chance to apply its own guard.
const SHORT_TEXT_WORD_LIMIT = 40;
const MIN_SYMPTOM_DENSITY = 0.03;

function extractSymptoms(text) {
  const lower = text.toLowerCase();
  const found = new Set();
  for (const phrase of _SORTED) {
    if (_containsPhrase(lower, phrase)) found.add(NL_MAP[phrase]);
  }
  let result = [...found];

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount > SHORT_TEXT_WORD_LIMIT) {
    const density = result.length / wordCount;
    if (density < MIN_SYMPTOM_DENSITY) result = [];
  }

  return result;
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

<<<<<<< HEAD
=======
// Catches a symptom word attributed to a subject that clearly isn't a
// person. Two different checks, deliberately different designs:
//
// 1. Determiner + noun ("this book", "my mouse") — a blocklist of common
//    everyday objects/animals. Kept as a blocklist because it fires on a
//    noun appearing ANYWHERE in the message, so it must stay conservative
//    to avoid false positives on real sentences that just happen to
//    mention an object in passing ("I hit my head on the door").
//
// 2. Bare subject at the very start of the message ("amoeba is having...",
//    "sparrow has fever") — an ALLOWLIST of person-referring words instead
//    of a blocklist of non-person ones. A blocklist here kept failing on
//    every new organism/object someone tried ("mouse", then "amoeba", then
//    "sparrow") because it can only ever cover words already thought of.
//    Anchoring to the message's actual grammatical subject makes the
//    allowlist safe: if the very first word is followed immediately by
//    "is/has/having" and that word isn't a recognized person-referring
//    term, it's flagged — regardless of whether it's a known object, a
//    known animal, or something never seen before.
>>>>>>> 8a3a30abc79f35ddb84eb04908a4e87ceb870c82
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
<<<<<<< HEAD
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
=======
    // electronics / peripherals
    "mouse", "keyboard", "monitor", "speaker", "remote", "charger", "router",
    "printer", "tablet", "camera", "headphone", "headphones", "earphone",
    "earphones", "laptop", "computer", "phone",
    // vehicles
    "car", "bike", "bus", "train", "truck", "scooter", "plane", "boat", "ship",
    // non-human animals
    "rat", "dog", "cat", "cow", "goat", "horse", "bird", "fish", "lizard",
    "snake", "frog", "ant", "bee", "insect", "hamster", "rabbit", "parrot",
    "chicken", "goose", "duck",
>>>>>>> 8a3a30abc79f35ddb84eb04908a4e87ceb870c82
  ];
  const nounsPattern = nonPersonNouns.join("|");
  const determinerPattern = new RegExp(
    `\\b(this|that|the|my|our|his|her|their|a|an)\\s+(${nounsPattern})\\b`,
  );
<<<<<<< HEAD
  const bareSubjectPattern = new RegExp(
    `^(${nounsPattern})\\s+(is|are|has|have|having|suffers|suffering|feels|feeling|seems|looks)\\b`,
=======
  if (determinerPattern.test(lower)) return true;

  const personSubjectWords = [
    "i", "you", "he", "she", "they", "we", "it", // "it" left deliberately
    // permissive — too many legitimate uses ("it hurts") to safely flag
    "patient", "person", "someone", "somebody", "anyone",
    "man", "woman", "boy", "girl", "guy", "kid", "child", "baby", "friend",
    "doctor", "nurse", "mother", "father", "mom", "dad", "brother", "sister",
    "wife", "husband", "son", "daughter", "grandma", "grandpa",
    "grandmother", "grandfather", "uncle", "aunt", "cousin", "colleague",
    "neighbor", "neighbour",
  ];
  const bareSubjectMatch = lower.match(
    /^([a-z']+)\s+(is|are|has|have|having|suffers|suffering|feels|feeling|seems|looks)\b/
>>>>>>> 8a3a30abc79f35ddb84eb04908a4e87ceb870c82
  );
  if (bareSubjectMatch && !personSubjectWords.includes(bareSubjectMatch[1])) {
    return true;
  }

  return false;
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
    ["high_fever", "altered_sensorium"],
  ];
  return combos.some((combo) => combo.every((s) => symptoms.includes(s)));
}

// ── Fallback (only for greetings/bye/thanks when no history) ──────────────────
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

// ── Build ML Section ───────────────────────────────────────────────────────────
function buildMLSection(mlResult, symptoms) {
  if (
    !mlResult ||
    mlResult.error ||
    !mlResult.predictions ||
    mlResult.predictions.length === 0
  )
    return null;

  const top = mlResult.predictions[0];

  if (mlResult.low_confidence && symptoms.length < 2) {
    const suggestionPool = [
      {
        label: "Fever or chills",
        keys: ["high_fever", "mild_fever", "chills"],
      },
      {
        label: "Headache or body ache",
        keys: ["headache", "severe_headache", "muscle_pain"],
      },
      { label: "Nausea or vomiting", keys: ["nausea", "vomiting"] },
      { label: "Cough or sore throat", keys: ["cough", "throat_irritation"] },
      { label: "Fatigue or weakness", keys: ["fatigue", "lethargy"] },
    ];
    const relevantSuggestions = suggestionPool
      .filter((s) => !s.keys.some((k) => symptoms.includes(k)))
      .slice(0, 3)
      .map((s) => `• ${s.label}?`)
      .join("\n");

    return {
      summary: null,
      block: `I detected: ${symptoms.map((s) => s.replace(/_/g, " ")).join(", ")}.\n\n🔍 For accurate analysis, please describe more symptoms.\n\nDo you also have:\n${relevantSuggestions}\n\nMore symptoms = more accurate prediction.`,
    };
  }

  const others = mlResult.predictions
    .slice(1)
    .filter((p) => p.confidence > 3)
    .map((p) => `${p.disease} (${p.confidence}%)`)
    .join(", ");
  const matched = (mlResult.matched_symptoms || symptoms).map((s) =>
    s.replace(/_/g, " "),
  );
  const description = top.description ? `\n📖 ${top.description}` : "";
  const precautions = top.precautions?.length
    ? `\n\n💡 Precautions:\n${top.precautions
        .slice(0, 3)
        .map((p) => `• ${p}`)
        .join("\n")}`
    : "";
  const tip = mlResult.low_confidence
    ? `\n\n⚡ Tip: Describe more symptoms for better accuracy.`
    : "";
  const followup = mlResult.followup_question
    ? `\n\n❓ ${mlResult.followup_question}`
    : "";

  return {
    summary: `Top prediction: ${top.disease} (${top.confidence}% confidence). Severity: ${mlResult.severity}.`,
    block: `📊 ML Analysis (${matched.join(", ")}):\n📋 Most likely: ${top.disease} (${top.confidence}%)\n${others ? `📌 Also possible: ${others}\n` : ""}⚠️ Severity: ${mlResult.severity}\n${description}\n💊 ${mlResult.recommendation}${precautions}${tip}${followup}\n\n⚕️ Not a substitute for professional medical advice.`,
  };
}

// ── Message Route ──────────────────────────────────────────────────────────────
router.post("/message", auth, async (req, res) => {
  try {
    const { text, saveHistory = true } = req.body;
    const user = await User.findById(req.user.id);
    const userName = user ? user.name : "there";
    const intent = detectIntent(text);
    let botReply = "";
    let mlResult = null;
    let emergency = false;

    // Load history ONLY if saveHistory is true (Incognito Mode logic)
    let conv = null;
    let recentHistory = [];
    if (saveHistory) {
      conv = await Conversation.findOne({ userId: req.user.id });
      recentHistory = conv ? conv.messages.slice(-12) : [];
    }
    const hasConversation = recentHistory.length > 0;

    if (intent === "symptoms") {
      const symptoms = extractSymptoms(text);
      emergency = checkEmergency(symptoms);

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
          detectedSymptoms: symptoms.map((id) => ({
            id,
            label: readableSymptom(id),
          })),
          intent,
          emergency: false,
        });
      }

      mlResult = await getMLPrediction(text, []);
      const ml = buildMLSection(mlResult, symptoms);

      if (process.env.GROQ_API_KEY && ml && ml.summary) {
        try {
          console.log("Calling Groq AI...");
          const aiText = await getGroqResponse(
            text,
            ml.summary,
            userName,
            recentHistory,
          );
          console.log("Groq:", aiText ? "SUCCESS" : "NULL");
          botReply = aiText ? `${aiText}\n\n${ml.block}` : ml.block;
        } catch (err) {
          console.error("Groq failed:", err.message);
          botReply = ml.block;
        }
      } else {
        botReply = ml
          ? ml.block
          : `I need more symptom details, ${userName.split(" ")[0]}. Please describe what you are feeling in more detail.`;
      }
    } else if (
      ["greeting", "how_are_you", "thanks", "farewell", "help"].includes(
        intent,
      ) &&
      !hasConversation
    ) {
      botReply = getFallbackReply(intent, userName);
    } else {
      const offTopic = process.env.GROQ_API_KEY
        ? await isOffTopic(text, recentHistory)
        : false;

      if (offTopic) {
        botReply = `That's outside what I can help with, ${userName.split(" ")[0]} — I'm a medical symptom assistant, so I can only help with health, symptoms, and wellness questions. Is there anything going on with your health I can help you with?`;
      } else if (process.env.GROQ_API_KEY) {
        try {
          console.log("Calling Groq AI for conversation...");
          const aiText = await getGroqResponse(
            text,
            null,
            userName,
            recentHistory,
          );
          console.log("Groq conversation:", aiText ? "SUCCESS" : "NULL");
          botReply = aiText || getFallbackReply(intent, userName);
        } catch (err) {
          console.error("Groq conversation failed:", err.message);
          botReply = getFallbackReply(intent, userName);
        }
      } else {
        botReply = getFallbackReply(intent, userName);
      }
    }

    // ── Save to database ONLY if saveHistory is true ───────────────────────────
    if (saveHistory) {
      if (!conv) conv = new Conversation({ userId: req.user.id, messages: [] });
      conv.messages.push({ sender: "user", text });
      conv.messages.push({ sender: "bot", text: botReply });
      await conv.save();
    }

    res.json({ reply: botReply, mlResult, intent, emergency });
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

    const mlResult = await getMLPrediction(text, symptoms);
    const ml = buildMLSection(mlResult, symptoms);

    let botReply;
    if (process.env.GROQ_API_KEY && ml && ml.summary) {
      try {
        const aiText = await getGroqResponse(
          text,
          ml.summary,
          userName,
          recentHistory,
        );
        botReply = aiText ? `${aiText}\n\n${ml.block}` : ml.block;
      } catch (err) {
        console.error("Groq failed:", err.message);
        botReply = ml.block;
      }
    } else {
      botReply = ml
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

// ── Symptom Options Route ────────────────────────────────────────────────────
router.get("/symptom-options", auth, (req, res) => {
  const ids = [...new Set(Object.values(NL_MAP))].sort();
  res.json(ids.map((id) => ({ id, label: readableSymptom(id) })));
});

// ── Email Summary Route ──────────────────────────────────────────────────────
router.post("/email-summary", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { messages } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ message: "No messages to send" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const chatText = messages
      .map(
        (m) =>
          `${m.sender === "user" ? "You" : "HealthBot"}: ${m.text || "Attachment"}`,
      )
      .join("\n\n");

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "🩺 Your HealthBot Consultation Summary",
      text: `Hello ${user.name},\n\nHere is the summary of your recent HealthBot consultation:\n\n--------------------------------\n\n${chatText}\n\n--------------------------------\n\nStay healthy!\n- The HealthBot Team`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Email sent successfully!" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
