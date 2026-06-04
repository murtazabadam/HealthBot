const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { getGeminiResponse } = require('../config/gemini');

// ── ML Engine Call ─────────────────────────────────────────────────────────────
async function getMLPrediction(text, symptoms) {
  try {
    const mlUrl = process.env.ML_ENGINE_URL ||
      'https://murtazabadam-healthbot-ml.hf.space/predict';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const response = await fetch(mlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, symptoms }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    const data = await response.json();
    console.log('ML:', JSON.stringify(data).substring(0, 200));
    return data;
  } catch (err) {
    console.error('ML error:', err.message);
    return null;
  }
}

// ── NL Map ────────────────────────────────────────────────────────────────────
const NL_MAP = {
  'high fever': 'high_fever',    'mild fever': 'mild_fever',
  'fever': 'high_fever',          'feverish': 'high_fever',
  'feel hot': 'high_fever',       'high temperature': 'high_fever',
  'cough': 'cough',               'coughing': 'cough',
  'dry cough': 'cough',           'mucus': 'mucoid_sputum',
  'phlegm': 'mucoid_sputum',
  'fatigue': 'fatigue',           'tired': 'fatigue',
  'exhausted': 'fatigue',         'weakness': 'fatigue',
  'weak': 'fatigue',              'no energy': 'fatigue',
  'lethargy': 'lethargy',         'lethargic': 'lethargy',
  'severe headache': 'severe_headache',
  'headache': 'headache',         'head pain': 'headache',
  'head hurts': 'headache',       'migraine': 'headache',
  'nausea': 'nausea',             'feel sick': 'nausea',
  'nauseated': 'nausea',          'vomiting': 'vomiting',
  'throwing up': 'vomiting',      'vomit': 'vomiting',
  'stomach pain': 'stomach_pain', 'stomach ache': 'stomach_pain',
  'belly pain': 'stomach_pain',   'tummy ache': 'stomach_pain',
  'abdominal pain': 'abdominal_pain',
  'stomach hurts': 'stomach_pain',
  'diarrhoea': 'diarrhoea',       'diarrhea': 'diarrhoea',
  'loose motion': 'diarrhoea',    'loose stool': 'diarrhoea',
  'constipation': 'constipation', 'indigestion': 'indigestion',
  'acidity': 'acidity',           'heartburn': 'acidity',
  'bloating': 'distention_of_abdomen',
  'bloated': 'distention_of_abdomen',
  'breathlessness': 'breathlessness',
  'cant breathe': 'breathlessness',
  'hard to breathe': 'breathlessness',
  'shortness of breath': 'breathlessness',
  'short of breath': 'breathlessness',
  'wheezing': 'wheezing',
  'chest pain': 'chest_pain',     'chest hurts': 'chest_pain',
  'chest tightness': 'chest_pain',
  'skin rash': 'skin_rash',       'rash': 'skin_rash',
  'red spots': 'skin_rash',       'itching': 'itching',
  'itchy': 'itching',             'itchy skin': 'itching',
  'yellow skin': 'yellowing_of_skin',
  'yellow eyes': 'yellowing_of_eyes',
  'jaundice': 'yellowing_of_skin', 'pale skin': 'pale_skin',
  'joint pain': 'joint_pain',     'joints hurt': 'joint_pain',
  'muscle pain': 'muscle_pain',   'body ache': 'muscle_pain',
  'back pain': 'back_pain',       'lower back pain': 'back_pain',
  'neck pain': 'neck_pain',       'knee pain': 'knee_pain',
  'hip pain': 'hip_joint_pain',
  'runny nose': 'runny_nose',     'cold': 'runny_nose',
  'blocked nose': 'continuous_sneezing',
  'stuffy nose': 'continuous_sneezing',
  'sneezing': 'continuous_sneezing',
  'sore throat': 'throat_irritation',
  'throat pain': 'throat_irritation',
  'throat hurts': 'throat_irritation',
  'chills': 'chills',             'shivering': 'chills',
  'feel cold': 'chills',          'night sweats': 'sweating',
  'sweating': 'sweating',
  'frequent urination': 'frequent_urination',
  'burning urination': 'burning_micturition',
  'painful urination': 'burning_micturition',
  'dark urine': 'dark_urine',     'yellow urine': 'yellow_urine',
  'blurry vision': 'blurred_and_distorted_vision',
  'weight loss': 'weight_loss',   'losing weight': 'weight_loss',
  'no appetite': 'loss_of_appetite',
  'loss of appetite': 'loss_of_appetite',
  'not hungry': 'loss_of_appetite',
  'dizziness': 'dizziness',       'dizzy': 'dizziness',
  'vertigo': 'dizziness',         'anxiety': 'anxiety',
  'anxious': 'anxiety',           'depression': 'depression',
  'depressed': 'depression',      'palpitations': 'palpitations',
  'heart racing': 'palpitations', 'swelling': 'swelling_joints',
  'swollen': 'swelling_joints',   'loss of smell': 'loss_of_smell',
  'cant smell': 'loss_of_smell',  'excessive thirst': 'polyuria',
  'very thirsty': 'polyuria',     'thirst': 'polyuria',
  'drinking a lot': 'polyuria',   'excessive hunger': 'excessive_hunger',
  'always hungry': 'excessive_hunger',
  'pain behind the eyes': 'pain_behind_the_eyes',
  'pain behind eyes': 'pain_behind_the_eyes',
  'eye pain': 'pain_in_eyes',     'red eyes': 'redness_of_eyes',
  'watery eyes': 'watering_from_eyes',
  'bloody stool': 'bloody_stool', 'blood in stool': 'bloody_stool',
  'insomnia': 'restlessness',     'cant sleep': 'restlessness',
  'mood swings': 'mood_swings',   'irritable': 'irritability',
  'skin peeling': 'skin_peeling', 'blisters': 'blister',
  'pus': 'pus_filled_pimples',    'pimples': 'pus_filled_pimples',
  'hair loss': 'brittle_nails',   'brittle nails': 'brittle_nails',
};

const _SORTED = Object.keys(NL_MAP).sort((a, b) => b.length - a.length);

function extractSymptoms(text) {
  const lower = text.toLowerCase();
  const found = new Set();
  for (const phrase of _SORTED) {
    if (lower.includes(phrase)) found.add(NL_MAP[phrase]);
  }
  return [...found];
}

// ── Intent Detection ───────────────────────────────────────────────────────────
function detectIntent(text) {
  const lower = text.toLowerCase().trim();
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good evening',
    'good afternoon', 'good night', 'salam', 'assalam', 'namaste'];
  if (greetings.some(g => lower === g || lower.startsWith(g + ' ')
    || lower.startsWith(g + ','))) return 'greeting';
  if (['how are you', 'how r u', 'whats up', "what's up"].some(p =>
    lower.includes(p))) return 'how_are_you';
  if (['thank', 'thanks', 'jazakallah', 'shukriya', 'thx'].some(t =>
    lower.includes(t))) return 'thanks';
  if (['help', 'what can you do', 'how does this work'].some(h =>
    lower.includes(h))) return 'help';
  if (['bye', 'goodbye', 'khuda hafiz', 'allah hafiz', 'take care'].some(f =>
    lower.includes(f))) return 'farewell';
  if (['yes', 'yeah', 'yep', 'haan'].includes(lower)) return 'yes';
  if (['no', 'nope', 'nah', 'nahi'].includes(lower)) return 'no';
  if (extractSymptoms(text).length > 0) return 'symptoms';
  if (['i feel', 'i have', 'suffering', 'pain', 'hurt', 'ache',
    'sick', 'i am', 'experiencing'].some(w => lower.includes(w)))
    return 'possible_symptoms';
  return 'unknown';
}

// ── Emergency Check ────────────────────────────────────────────────────────────
function checkEmergency(symptoms) {
  const combos = [
    ['chest_pain', 'breathlessness'],
    ['chest_pain', 'sweating'],
    ['chest_pain', 'palpitations'],
    ['severe_headache', 'vomiting'],
    ['high_fever', 'altered_sensorium'],
    ['loss_of_balance', 'severe_headache'],
  ];
  return combos.some(combo => combo.every(s => symptoms.includes(s)));
}

// ── Fallback Replies ───────────────────────────────────────────────────────────
function getFallbackReply(intent, userName) {
  const name = userName ? userName.split(' ')[0] : 'there';
  const h = new Date().getHours();
  const time = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const map = {
    greeting:
      `${time}, ${name}! 👋 I am HealthBot, your AI medical assistant.\n\nDescribe your symptoms and I will analyse them for you. The more detail you give, the more accurate my analysis!`,
    how_are_you:
      `Fully operational and ready to help, ${name}! 🤖\n\nHow are you feeling today? Please describe any symptoms you have.`,
    thanks:
      `You are welcome, ${name}! 😊 Remember to consult a real doctor for professional medical advice. Take care!`,
    help:
      `Here is what I can do, ${name}:\n\n🔍 Analyse symptoms and identify possible diseases\n📊 Show confidence levels for each prediction\n⚠️ Rate severity: Mild, Moderate, Serious, Severe\n💊 Give recommendations and precautions\n\nExample: "I have fever, headache and joint pain"`,
    farewell:
      `Goodbye, ${name}! 👋 Take care and consult a doctor if symptoms are severe. Allah Hafiz!`,
    yes:
      `Please describe all your symptoms in detail and I will analyse them for you.`,
    no:
      `No problem! Come back anytime if you experience symptoms.`,
    possible_symptoms:
      `I want to help, ${name}. Please be more specific.\n\nFor example:\n• "I have fever and headache"\n• "I feel tired with stomach pain"\n• "I have skin rash and joint pain"`,
    unknown:
      `I am HealthBot, specialised in symptom analysis. Please describe what you are feeling.\n\nExample: "I have fever, cough and fatigue"`,
  };
  return map[intent] || map.unknown;
}

// ── Build ML Reply Block ───────────────────────────────────────────────────────
function buildMLSection(mlResult, symptoms) {
  if (!mlResult || mlResult.error || !mlResult.predictions
    || mlResult.predictions.length === 0) return null;

  const top = mlResult.predictions[0];

  // If only 1 symptom and low confidence — ask for more
  if (mlResult.low_confidence && symptoms.length < 2) {
    return {
      summary: null,
      block: `I detected: ${symptoms.map(s => s.replace(/_/g, ' ')).join(', ')}.\n\n🔍 To give you an accurate analysis, could you describe more symptoms?\n\nFor example, do you also have:\n• Fever or chills\n• Headache or body ache\n• Nausea or vomiting\n• Skin rash or itching\n\nThe more symptoms you describe, the more accurate my prediction!`
    };
  }

  const others = mlResult.predictions.slice(1)
    .filter(p => p.confidence > 3)
    .map(p => `${p.disease} (${p.confidence}%)`).join(', ');
  const matched = (mlResult.matched_symptoms || symptoms)
    .map(s => s.replace(/_/g, ' '));
  const description = top.description ? `\n📖 ${top.description}` : '';
  const precautions = top.precautions && top.precautions.length > 0
    ? `\n\n💡 Precautions:\n${top.precautions.slice(0, 3).map(p => `• ${p}`).join('\n')}` : '';
  const tip = mlResult.low_confidence
    ? `\n\n⚡ Tip: Describe more symptoms for better accuracy.` : '';
  const followup = mlResult.followup_question
    ? `\n\n❓ ${mlResult.followup_question}` : '';

  return {
    summary: `Top prediction: ${top.disease} (${top.confidence}% confidence). Severity: ${mlResult.severity}.`,
    block: `📊 ML Analysis (${matched.join(', ')}):\n📋 Most likely: ${top.disease} (${top.confidence}%)\n${others ? `📌 Also possible: ${others}\n` : ''}⚠️ Severity: ${mlResult.severity}\n${description}\n💊 ${mlResult.recommendation}${precautions}${tip}${followup}\n\n⚕️ Not a substitute for professional medical advice.`
  };
}

// ── Message Route ──────────────────────────────────────────────────────────────
router.post('/message', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const user = await User.findById(req.user.id);
    const userName = user ? user.name : 'there';
    const intent = detectIntent(text);
    let botReply = '';
    let mlResult = null;
    let emergency = false;

    if (intent === 'symptoms') {
      const symptoms = extractSymptoms(text);

      // Check emergency
      emergency = checkEmergency(symptoms);

      // Call ML engine
      mlResult = await getMLPrediction(text, symptoms);
      const ml = buildMLSection(mlResult, symptoms);

      // Load recent history for AI context
      let recentHistory = [];
      const existingConv = await Conversation.findOne({ userId: req.user.id });
      if (existingConv) recentHistory = existingConv.messages.slice(-6);

      // Call Groq AI if key exists and ML got a result
      if (process.env.GROQ_API_KEY && ml && ml.summary) {
        try {
          const aiText = await getGeminiResponse(
            text, ml.summary, userName, recentHistory
          );
          botReply = aiText
            ? `${aiText}\n\n${ml.block}`
            : ml.block;
        } catch (err) {
          console.error('AI call failed:', err.message);
          botReply = ml ? ml.block : getFallbackReply('possible_symptoms', userName);
        }
      } else {
        botReply = ml ? ml.block : getFallbackReply('possible_symptoms', userName);
      }

    } else {
      // Non-symptom messages use fallback — saves Groq quota
      botReply = getFallbackReply(intent, userName);
    }

    // Save to database
    let conv = await Conversation.findOne({ userId: req.user.id });
    if (!conv) conv = new Conversation({ userId: req.user.id, messages: [] });
    conv.messages.push({ sender: 'user', text });
    conv.messages.push({ sender: 'bot', text: botReply });
    await conv.save();

    res.json({ reply: botReply, mlResult, intent, emergency });

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── History Route ──────────────────────────────────────────────────────────────
router.get('/history', auth, async (req, res) => {
  try {
    const conv = await Conversation.findOne({ userId: req.user.id });
    res.json(conv ? conv.messages : []);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
