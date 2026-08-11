const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const { getGroqResponse, isOffTopic } = require("../config/groq");
const nodemailer = require("nodemailer");
<<<<<<< HEAD
const { geocodeAddress, findNearbyFacilities } = require("../config/facilityFinder");
=======
const axios = require("axios"); // Using axios for safe Node.js compatibility
>>>>>>> d3148a6babc5cde9ad733250c505bdf26b9dfe2e

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

function extractSymptoms(text) {
  let lower = text.toLowerCase();
  const found = new Set();

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

      if (!isNegated) {
        found.add(NL_MAP[phrase]);

        newLower =
          newLower.substring(0, match.index) +
          " ".repeat(phrase.length) +
          newLower.substring(match.index + phrase.length);
      }
    }
    lower = newLower;
  }

  let finalSymptoms = [...found];

  // --- CONFLICT RESOLUTION (De-duplication) ---
  if (finalSymptoms.includes("mild_fever")) {
    finalSymptoms = finalSymptoms.filter((s) => s !== "high_fever");
  }
  if (finalSymptoms.includes("severe_headache")) {
    finalSymptoms = finalSymptoms.filter((s) => s !== "headache");
  }

  return finalSymptoms;
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
    ["stiff_neck", "high_fever"],
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

// ── Build ML Section & Clinical Intake Logic ────────────────────────────────────
function buildMLSection(mlResult, symptoms, rawText) {
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
  let mustHideBox = false;
  let doctorInstructions = "";

  if (!hasDuration) {
    mustHideBox = true;
    doctorInstructions +=
      " The patient hasn't mentioned a timeline. Ask them exactly how long they have been experiencing these symptoms.";
  }

  if (
    /\bfever(ish)?\b/.test(lowerText) &&
    !/high fever|mild fever|moderate/.test(lowerText)
  ) {
    mustHideBox = true;
    doctorInstructions +=
      " They mentioned a fever. Ask: 'Is your fever mild, moderate, or high?'";
  }
  if (/\bheadache\b/.test(lowerText) && !/severe headache/.test(lowerText)) {
    mustHideBox = true;
    doctorInstructions +=
      " They mentioned a headache. Ask: 'Is your headache a normal headache, or is it severe?'";
  }
  if (
    /\bcough(ing)?\b/.test(lowerText) &&
    !/mucus|phlegm|dry|blood/.test(lowerText)
  ) {
    mustHideBox = true;
    doctorInstructions +=
      " They mentioned a cough. Ask: 'Is it a dry cough, or are you coughing up mucus/phlegm?'";
  }
  if (
    /\b(swell|swelling|swollen)\b/.test(lowerText) &&
    !/joint|gland|lymph/.test(lowerText)
  ) {
    mustHideBox = true;
    doctorInstructions +=
      " They mentioned swelling. Ask: 'Where exactly is the swelling located (e.g., joints, face, throat, glands)?'";
  }
  if (
    /\bpain\b|\bhurts\b|\bache\b/.test(lowerText) &&
    !/chest|stomach|joint|muscle|back|neck|knee|hip|eye|throat|head|body|ear|tooth/.test(
      lowerText,
    )
  ) {
    mustHideBox = true;
    doctorInstructions +=
      " They mentioned pain but didn't specify where. Ask: 'Which specific part of your body hurts?'";
  }

  // 3. THE 3-PILLAR SECURITY LOCK
  if (symptoms.length < 3 || top.confidence < 60 || mustHideBox) {
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
  const tip = mlResult.low_confidence
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

<<<<<<< HEAD
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

=======
>>>>>>> d3148a6babc5cde9ad733250c505bdf26b9dfe2e
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

    if (intent === "symptoms") {
      const newSymptoms = extractSymptoms(text);

      const historyText = recentHistory
        .filter((m) => m.sender === "user")
        .map((m) => m.text)
        .join(" ");
      const combinedSymptoms = extractSymptoms(historyText + " " + text);

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

<<<<<<< HEAD
      mlResult = await getMLPrediction(text, []);
      const ml = buildMLSection(mlResult, symptoms);
=======
      mlResult = await getMLPrediction(
        historyText + " " + text,
        combinedSymptoms,
      );
      const ml = buildMLSection(
        mlResult,
        combinedSymptoms,
        historyText + " " + text,
      );
>>>>>>> d3148a6babc5cde9ad733250c505bdf26b9dfe2e

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
<<<<<<< HEAD
    } else if (intent === "find_doctor") {
      if (!user || !user.address) {
        botReply = `I'd like to help you find a nearby facility, ${userName.split(" ")[0]}, but I don't have an address on file for you yet. Add one in your Profile, or use the dedicated Care Locator tab which can use your live GPS location instead.`;
      } else {
        const geo = await geocodeAddress(user.address);
        if (!geo) {
          botReply = `I couldn't pinpoint your saved address (${user.address}) on the map, ${userName.split(" ")[0]}. Try the Care Locator tab, or double-check your address in Profile settings.`;
        } else {
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
        }
      }
=======
>>>>>>> d3148a6babc5cde9ad733250c505bdf26b9dfe2e
    } else {
      const offTopic = process.env.GROQ_API_KEY
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
          const historicalSymptoms = extractSymptoms(historyText);

          if (historicalSymptoms.length > 0) {
            mlResult = await getMLPrediction(historyText, historicalSymptoms);
            const ml = buildMLSection(
              mlResult,
              historicalSymptoms,
              historyText + " " + text,
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

<<<<<<< HEAD
    let mlResult = await getMLPrediction("", symptoms);
=======
    const historyText = recentHistory
      .filter((m) => m.sender === "user")
      .map((m) => m.text)
      .join(" ");
    const historicalSymptoms = extractSymptoms(historyText + " " + text);
    const combinedSymptoms = [...new Set([...symptoms, ...historicalSymptoms])];
>>>>>>> d3148a6babc5cde9ad733250c505bdf26b9dfe2e

    const mlResult = await getMLPrediction(
      historyText + " " + text,
      combinedSymptoms,
    );
    const ml = buildMLSection(
      mlResult,
      combinedSymptoms,
      historyText + " " + text,
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

// ── Symptom Options Route ────────────────────────────────────────────────────
router.get("/symptom-options", auth, (req, res) => {
  const ids = [...new Set(Object.values(NL_MAP))].sort();
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

// Helper function to calculate distance between two coordinates in km
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── Find Nearby Facilities Route ──────────────────────────────────────────────
router.get("/facilities", auth, async (req, res) => {
  try {
    let { lat, lon } = req.query;
    let locationSource = "gps";

    // If no exact coordinates provided, fallback to user's saved profile address
    if (!lat || !lon) {
      const user = await User.findById(req.user.id);
      if (!user || !user.address) {
        return res.status(400).json({
          message: "No location provided.",
          hint: "Please enable GPS or add an address in your Profile.",
        });
      }

      // Replaced native fetch with axios
      const geoRes = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(user.address)}`,
        {
          headers: { "User-Agent": "HealthBot/1.0" },
        },
      );
      const geoData = geoRes.data;

      if (!geoData || geoData.length === 0) {
        return res.status(400).json({
          message: "Could not locate your saved address.",
          hint: "Please click 'Use My Location' or update your address in your Profile.",
        });
      }
      lat = geoData[0].lat;
      lon = geoData[0].lon;
      locationSource = "address";
    }

    // Query Overpass API for nearby medical facilities (5km radius)
    const radius = 5000;
    const overpassQuery = `
      [out:json];
      (
        node["amenity"~"hospital|clinic|doctors|pharmacy"](around:${radius},${lat},${lon});
        way["amenity"~"hospital|clinic|doctors|pharmacy"](around:${radius},${lat},${lon});
      );
      out center;
    `;

    // Replaced native fetch with axios and implemented safe native timeout
    const overpassRes = await axios.post(
      "https://overpass-api.de/api/interpreter",
      overpassQuery,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 15000, // 15 seconds timeout
      },
    );

    const overpassData = overpassRes.data;
    const elements = overpassData.elements || [];

    // Map and format the results for the frontend
    const facilities = elements
      .map((el) => {
        const tags = el.tags || {};
        const elLat = el.lat || el.center?.lat;
        const elLon = el.lon || el.center?.lon;

        let type = "Clinic";
        if (tags.amenity === "hospital") type = "Hospital";
        else if (tags.amenity === "pharmacy") type = "Pharmacy";
        else if (tags.amenity === "doctors") type = "Doctor";

        const name = tags.name || `${type} (Unnamed)`;
        const distanceKm = getDistanceFromLatLonInKm(
          lat,
          lon,
          elLat,
          elLon,
        ).toFixed(1);
        const address =
          [tags["addr:street"], tags["addr:city"]].filter(Boolean).join(", ") ||
          null;

        return {
          name,
          type,
          distanceKm,
          address,
          phone: tags.phone || tags["contact:phone"] || null,
          mapsUrl: `https://www.google.com/maps/search/?api=1&query=${elLat},${elLon}`,
        };
      })
      .sort((a, b) => parseFloat(a.distanceKm) - parseFloat(b.distanceKm))
      .slice(0, 20); // Return top 20 closest

    res.json({ facilities, locationSource });
  } catch (err) {
    console.error("Facilities route error:", err.message);
    res.status(500).json({ message: "Failed to fetch nearby facilities." });
  }
});

module.exports = router;