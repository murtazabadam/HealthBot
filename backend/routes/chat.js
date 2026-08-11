const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const { getGroqResponse, isOffTopic } = require("../config/groq");
const { geocodeAddress, findNearbyFacilities } = require("../config/facilityFinder");
const { sendEmergencyAlertEmail } = require("../config/emailService");
const { sendSMS } = require("../config/smsService");
const nodemailer = require("nodemailer");

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
// A couple of symptom IDs read oddly once auto-capitalized — e.g. "fever"
// alone maps to the ID high_fever (the dataset has no neutral "fever"
// option), but showing the user "High Fever" back when they only said
// "fever" reads as the bot claiming more than they said.
const LABEL_OVERRIDES = {
  high_fever: "Fever",
  mild_fever: "Mild Fever",
};

function readableSymptom(id) {
  if (LABEL_OVERRIDES[id]) return LABEL_OVERRIDES[id];
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

function extractSymptoms(text) {
  const lower = text.toLowerCase();
  const found = new Set();
  for (const phrase of _SORTED) {
    if (_containsPhrase(lower, phrase)) found.add(NL_MAP[phrase]);
  }
  return [...found];
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
    ["high_fever", "altered_sensorium"],
  ];
  return combos.some((combo) => combo.every((s) => symptoms.includes(s)));
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

// ── Build ML Section ───────────────────────────────────────────────────────────
function buildMLSection(mlResult, symptoms, forceThrough = false) {
  if (
    !mlResult ||
    mlResult.error ||
    !mlResult.predictions ||
    mlResult.predictions.length === 0
  )
    return null;

  const top = mlResult.predictions[0];

  if (mlResult.low_confidence && symptoms.length < 2 && !forceThrough) {
    const suggestionPool = [
      { label: "Fever or chills", id: "high_fever", keys: ["high_fever", "mild_fever", "chills"] },
      { label: "Headache or body ache", id: "headache", keys: ["headache", "severe_headache", "muscle_pain"] },
      { label: "Nausea or vomiting", id: "nausea", keys: ["nausea", "vomiting"] },
      { label: "Cough or sore throat", id: "cough", keys: ["cough", "throat_irritation"] },
      { label: "Fatigue or weakness", id: "fatigue", keys: ["fatigue", "lethargy"] },
    ];
    const suggested = suggestionPool
      .filter((s) => !s.keys.some((k) => symptoms.includes(k)))
      .slice(0, 3)
      .map((s) => ({ id: s.id, label: s.label }));

    // needsMore, not a text block — the caller shows this as tappable
    // suggestion chips instead of asking the user to type more.
    return { summary: null, needsMore: true, suggested };
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
    let facilities = null;

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
    } else if (intent === "find_doctor") {
      if (!user || !user.address) {
        botReply = `I'd like to help you find a nearby doctor or hospital, ${userName.split(" ")[0]}, but I don't have an address on file for you yet. Add one in your Profile, or use the dedicated Find a Doctor tab which can use your live GPS location instead.`;
      } else {
        const geo = await geocodeAddress(user.address);
        if (!geo) {
          botReply = `I couldn't pinpoint your saved address (${user.address}) on the map, ${userName.split(" ")[0]}. Try the Find a Doctor tab, or double-check your address in Profile settings.`;
        } else {
          facilities = await findNearbyFacilities(geo.latitude, geo.longitude);
          if (!facilities.length) {
            botReply = `I couldn't find any listed hospitals or clinics near ${user.address} in OpenStreetMap's data — coverage can be thin for some areas. Try the Find a Doctor tab for a wider search, or search nearby facilities directly on Google Maps.`;
          } else {
            const top3 = facilities.slice(0, 3)
              .map((f) => `${f.name} (${f.type}, ${f.distanceKm} km away)`)
              .join(", ");
            botReply = `Here are the nearest facilities to ${user.address}, ${userName.split(" ")[0]}: ${top3}. See the Find a Doctor tab for the full list with directions.`;
          }
        }
      }
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
    const { symptoms, originalText, saveHistory = true, round = 1 } = req.body;
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

    // Deliberately pass an EMPTY text here, not the raw original message.
    // The ML engine's /predict endpoint unions any symptoms it independently
    // extracts from `text` with the explicit `symptoms` list — which meant a
    // symptom the user just removed from the confirmation checklist would
    // silently reappear in the prediction anyway, since the raw text (still
    // containing that symptom) got re-extracted and merged back in. Passing
    // no text means the ML engine trusts the confirmed list exactly as given.
    const mlResult = await getMLPrediction("", symptoms);
    // Only one round of "add a suggested symptom" is ever offered — round 2
    // forces a real answer through regardless of confidence, so the
    // checklist can never reappear indefinitely.
    const ml = buildMLSection(mlResult, symptoms, round >= 2);

    if (ml && ml.needsMore) {
      // Not enough symptoms for a confident prediction yet — show the same
      // checklist UI again (with quick-add suggestions) instead of asking
      // the user to type more.
      return res.json({
        needsConfirmation: true,
        originalText: text,
        detectedSymptoms: symptoms.map((id) => ({ id, label: readableSymptom(id) })),
        suggestedSymptoms: ml.suggested,
        intent: "symptoms",
        emergency: false,
      });
    }

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

// ── Email Reminder Route (Replaced Email Summary) ─────────────────────────────
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

// ── Notify Emergency Contact ──────────────────────────────────────────────────
// Fired when the frontend's emergency alert triggers. Sends SMS + email to
// the user's registered emergency contact (Profile settings, not
// registration), including a Google Maps link built from the browser's
// geolocation when available, falling back to the user's saved address.
router.post("/notify-emergency", auth, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { emergencyContactName, emergencyContactPhone, emergencyContactEmail, address } = user;
    if (!emergencyContactPhone && !emergencyContactEmail) {
      return res.status(400).json({
        message: "No emergency contact on file",
        hint: "Add one in Profile settings",
      });
    }

    const mapsUrl =
      latitude && longitude
        ? `https://www.google.com/maps?q=${latitude},${longitude}`
        : address
          ? `https://www.google.com/maps/search/${encodeURIComponent(address)}`
          : null;

    const results = { sms: false, email: false };

    if (emergencyContactPhone) {
      const smsText = `HealthBot Emergency Alert: ${user.name} may need help.${mapsUrl ? ` Location: ${mapsUrl}` : ""}`;
      results.sms = await sendSMS(emergencyContactPhone, smsText);
    }
    if (emergencyContactEmail) {
      results.email = await sendEmergencyAlertEmail(
        emergencyContactEmail,
        emergencyContactName,
        user.name,
        mapsUrl,
      );
    }

    res.json({ notified: results.sms || results.email, ...results });
  } catch (err) {
    console.error("Emergency notify error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── Find Nearby Doctors / Facilities ────────────────────────────────────────
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

    const facilities = await findNearbyFacilities(latitude, longitude);
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

module.exports = router;