const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { getGeminiResponse } = require('../config/gemini');

// ── ML Engine Call ──────────────────────────────────────────
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

// ── NL Map (fever → high_fever to match Kaggle dataset) ────
const NL_MAP = {
  // Fever — mapped to high_fever which exists in dataset
  'high fever': 'high_fever',
  'fever': 'high_fever',
  'mild fever': 'mild_fever',
  'low grade fever': 'mild_fever',
  'feverish': 'high_fever',
  'feel hot': 'high_fever',
  'high temperature': 'high_fever',
  'temperature': 'mild_fever',
  // Cough
  'cough': 'cough',
  'coughing': 'cough',
  'dry cough': 'cough',
  'mucus': 'mucoid_sputum',
  'phlegm': 'mucoid_sputum',
  'sputum': 'mucoid_sputum',
  // Fatigue
  'fatigue': 'fatigue',
  'tired': 'fatigue',
  'exhausted': 'fatigue',
  'weakness': 'fatigue',
  'weak': 'fatigue',
  'no energy': 'fatigue',
  'lethargy': 'lethargy',
  'lethargic': 'lethargy',
  // Headache
  'severe headache': 'severe_headache',
  'headache': 'headache',
  'head pain': 'headache',
  'head hurts': 'headache',
  'migraine': 'headache',
  // Nausea & vomiting
  'nausea': 'nausea',
  'feel sick': 'nausea',
  'nauseated': 'nausea',
  'vomiting': 'vomiting',
  'throwing up': 'vomiting',
  'vomit': 'vomiting',
  // Stomach
  'stomach pain': 'stomach_pain',
  'stomach ache': 'stomach_pain',
  'belly pain': 'stomach_pain',
  'tummy ache': 'stomach_pain',
  'abdominal pain': 'abdominal_pain',
  'stomach hurts': 'stomach_pain',
  'diarrhoea': 'diarrhoea',
  'diarrhea': 'diarrhoea',
  'loose motion': 'diarrhoea',
  'loose stool': 'diarrhoea',
  'constipation': 'constipation',
  'indigestion': 'indigestion',
  'acidity': 'acidity',
  'heartburn': 'acidity',
  // Breathing
  'breathlessness': 'breathlessness',
  'cant breathe': 'breathlessness',
  'hard to breathe': 'breathlessness',
  'shortness of breath': 'breathlessness',
  'short of breath': 'breathlessness',
  'wheezing': 'wheezing',
  'chest pain': 'chest_pain',
  'chest tightness': 'chest_pain',
  'chest hurts': 'chest_pain',
  // Skin
  'skin rash': 'skin_rash',
  'rash': 'skin_rash',
  'red spots': 'skin_rash',
  'itching': 'itching',
  'itchy': 'itching',
  'itchy skin': 'itching',
  'yellow skin': 'yellowing_of_skin',
  'yellow eyes': 'yellowing_of_eyes',
  'jaundice': 'yellowing_of_skin',
  'pale skin': 'pale_skin',
  // Pain
  'joint pain': 'joint_pain',
  'joints hurt': 'joint_pain',
  'muscle pain': 'muscle_pain',
  'body ache': 'muscle_pain',
  'back pain': 'back_pain',
  'lower back pain': 'back_pain',
  'neck pain': 'neck_pain',
  'knee pain': 'knee_pain',
  // Cold & throat
  'runny nose': 'runny_nose',
  'cold': 'runny_nose',
  'stuffy nose': 'continuous_sneezing',
  'sneezing': 'continuous_sneezing',
  'sore throat': 'throat_irritation',
  'throat pain': 'throat_irritation',
  'throat hurts': 'throat_irritation',
  // Temperature sensation
  'chills': 'chills',
  'shivering': 'chills',
  'feel cold': 'chills',
  'sweating': 'sweating',
  'night sweats': 'sweating',
  // Urinary
  'frequent urination': 'frequent_urination',
  'burning urination': 'burning_micturition',
  'painful urination': 'burning_micturition',
  'dark urine': 'dark_urine',
  'yellow urine': 'yellow_urine',
  // Eyes & vision
  'blurry vision': 'blurred_and_distorted_vision',
  'pain behind the eyes': 'pain_behind_the_eyes',
  'pain behind eyes': 'pain_behind_the_eyes',
  'eye pain': 'pain_in_eyes',
  'red eyes': 'redness_of_eyes',
  'watery eyes': 'watering_from_eyes',
  // Weight & appetite
  'weight loss': 'weight_loss',
  'losing weight': 'weight_loss',
  'no appetite': 'loss_of_appetite',
  'loss of appetite': 'loss_of_appetite',
  'not hungry': 'loss_of_appetite',
  // Mental
  'dizziness': 'dizziness',
  'dizzy': 'dizziness',
  'vertigo': 'dizziness',
  'anxiety': 'anxiety',
  'anxious': 'anxiety',
  'depression': 'depression',
  'depressed': 'depression',
  'mood swings': 'mood_swings',
  'irritable': 'irritability',
  // Heart
  'palpitations': 'palpitations',
  'heart racing': 'palpitations',
  // Swelling
  'swelling': 'swelling_joints',
  'swollen': 'swelling_joints',
  // Smell & taste
  'loss of smell': 'loss_of_smell',
  'cant smell': 'loss_of_smell',
  // Thirst & hunger
  'very thirsty': 'polyuria',
  'excessive thirst': 'polyuria',
  'drinking a lot': 'polyuria',
  'thirst': 'polyuria',
  'excessive hunger': 'excessive_hunger',
  'always hungry': 'excessive_hunger',
  // Sleep
  'insomnia': 'restlessness',
  'cant sleep': 'restlessness',
  // Skin conditions
  'skin peeling': 'skin_peeling',
  'blisters': 'blister',
  'hair loss': 'brittle_nails',
};

function extractSymptoms(text) {
  const lower = text.toLowerCase();
  const found = new Set();
  // Sort by length descending so longer phrases match first
  const sorted = Object.keys(NL_MAP).sort((a, b) => b.length - a.length);
  for (const phrase of sorted) {
    if (lower.includes(phrase)) found.add(NL_MAP[phrase]);
  }
  console.log('Detected symptoms:', [...found], '| Intent: check next');
  return [...found];
}

// ── Intent Detection ────────────────────────────────────────
function detectIntent(text) {
  const lower = text.toLowerCase().trim();
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good evening',
    'good afternoon', 'good night', 'salam', 'assalam', 'namaste'];
  if (greetings.some(g => lower === g || lower.startsWith(g + ' ')
    || lower.startsWith(g + ','))) return 'greeting';
  if (['how are you', 'how r u', 'whats up', "what's up",
    'how do you do'].some(p => lower.includes(p))) return 'how_are_you';
  if (['thank', 'thanks', 'jazakallah', 'shukriya', 'thx']
    .some(t => lower.includes(t))) return 'thanks';
  if (['help', 'what can you do', 'how does this work']
    .some(h => lower.includes(h))) return 'help';
  if (['bye', 'goodbye', 'khuda hafiz', 'allah hafiz', 'take care']
    .some(f => lower.includes(f))) return 'farewell';
  if (['yes', 'yeah', 'yep', 'haan', 'ha'].includes(lower)) return 'yes';
  if (['no', 'nope', 'nah', 'nahi'].includes(lower)) return 'no';
  if (extractSymptoms(text).length > 0) return 'symptoms';
  if (['i feel', 'i have', 'suffering', 'pain', 'hurt', 'ache', 'sick',
    'i am', 'experiencing'].some(w => lower.includes(w)))
    return 'possible_symptoms';
  return 'unknown';
}

// ── Fallback Replies (no Gemini needed) ────────────────────
function getFallbackReply(intent, userName) {
  const name = userName ? userName.split(' ')[0] : 'there';
  const hour = new Date().getHours();
  const time = hour < 12 ? 'Good morning'
    : hour < 17 ? 'Good afternoon' : 'Good evening';
  const map = {
    greeting:
      `${time}, ${name}! 👋 I am HealthBot, your AI medical assistant.\n\nDescribe your symptoms and I will analyze them for you. The more detail you give, the more accurate my analysis!`,
    how_are_you:
      `Fully operational and ready to help, ${name}! 🤖\n\nHow are you feeling today? Please describe any symptoms you have.`,
    thanks:
      `You are welcome, ${name}! 😊 Remember to consult a real doctor for professional medical advice. Take care!`,
    help:
      `Here is what I can do, ${name}:\n\n🔍 Analyze symptoms and identify possible diseases\n📊 Show confidence levels for each prediction\n⚠️ Rate severity: Mild / Moderate / Serious / Severe\n💊 Give recommendations and precautions\n\nExample: "I have fever, headache and joint pain"`,
    farewell:
      `Goodbye, ${name}! 👋 Take care and consult a doctor if symptoms are severe. Allah Hafiz!`,
    yes:
      `Great! Please describe all your symptoms in detail and I will analyze them.`,
    no:
      `No problem! Come back anytime if you experience symptoms.`,
    possible_symptoms:
      `I want to help, ${name}. Please be more specific.\n\nFor example:\n• "I have fever and headache"\n• "I feel tired with stomach pain"\n• "I have skin rash and joint pain"`,
    unknown:
      `I am HealthBot, specialized in symptom analysis. Please describe what you are feeling.\n\nExample: "I have fever, cough and fatigue"`,
  };
  return map[intent] || map.unknown;
}

// ── Build ML Reply Block ────────────────────────────────────
function buildMLSection(mlResult, symptoms) {
  if (!mlResult || mlResult.error || !mlResult.predictions
    || mlResult.predictions.length === 0) return null;
  const top = mlResult.predictions[0];
  const others = mlResult.predictions.slice(1)
    .filter(p => p.confidence > 3)
    .map(p => `${p.disease} (${p.confidence}%)`).join(', ');
  const matched = (mlResult.matched_symptoms || symptoms)
    .map(s => s.replace(/_/g, ' '));
  const precautions = top.precautions && top.precautions.length > 0
    ? `\n\n💡 Precautions:\n${top.precautions.slice(0, 3)
      .map(p => `• ${p}`).join('\n')}` : '';
  const tip = mlResult.low_confidence
    ? `\n\n⚡ Tip: Describe more symptoms for better accuracy.` : '';
  const followup = mlResult.followup_question
    ? `\n\n❓ ${mlResult.followup_question}` : '';
  return {
    summary: `Top prediction: ${top.disease} (${top.confidence}% confidence). Severity: ${mlResult.severity}.`,
    block: `📊 ML Analysis (${matched.join(', ')}):\n📋 Most likely: ${top.disease} (${top.confidence}%)\n${others ? `📌 Also possible: ${others}\n` : ''}⚠️ Severity: ${mlResult.severity}\n💊 ${mlResult.recommendation}${precautions}${tip}${followup}\n\n⚕️ Not a substitute for professional medical advice.`
  };
}

// ── Message Route ───────────────────────────────────────────
router.post('/message', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const user = await User.findById(req.user.id);
    const userName = user ? user.name : 'there';
    const intent = detectIntent(text);
    let botReply = '';
    let mlResult = null;

    if (intent === 'symptoms') {
      const symptoms = extractSymptoms(text);

      // Get ML prediction
      mlResult = await getMLPrediction(text, symptoms);
      const ml = buildMLSection(mlResult, symptoms);

      // Only call Gemini for symptom messages — saves quota
      if (process.env.GEMINI_API_KEY && ml) {
        try {
          const recentHistory = [];
          const existingConv = await Conversation.findOne({ userId: req.user.id });
          if (existingConv) recentHistory.push(...existingConv.messages.slice(-6));

          const geminiText = await getGeminiResponse(
            text, ml.summary, userName, recentHistory
          );
          botReply = geminiText
            ? `${geminiText}\n\n${ml.block}`
            : ml.block;
        } catch (err) {
          console.error('Gemini failed, using ML only:', err.message);
          botReply = ml.block;
        }
      } else if (ml) {
        botReply = ml.block;
      } else {
        botReply = `I detected symptoms but could not get a prediction. Please describe more symptoms in detail.`;
      }

    } else {
      // ALL non-symptom messages use fallback — NO Gemini call
      // This preserves Gemini quota for medical symptom analysis only
      botReply = getFallbackReply(intent, userName);
    }

    // Save to database
    let conv = await Conversation.findOne({ userId: req.user.id });
    if (!conv) conv = new Conversation({ userId: req.user.id, messages: [] });
    conv.messages.push({ sender: 'user', text });
    conv.messages.push({ sender: 'bot', text: botReply });
    await conv.save();

    res.json({ reply: botReply, mlResult, intent });

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── History Route ───────────────────────────────────────────
router.get('/history', auth, async (req, res) => {
  try {
    const conv = await Conversation.findOne({ userId: req.user.id });
    res.json(conv ? conv.messages : []);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;