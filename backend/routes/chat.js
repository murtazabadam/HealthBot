const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { getGeminiResponse } = require('../config/gemini');

// ── ML Engine Call ──────────────────────────────────────────────────────────
async function getMLPrediction(text, symptoms) {
  try {
    const mlUrl = process.env.ML_ENGINE_URL ||
      'https://murtazabadam-healthbot-ml.hf.space/predict';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    // Send both text AND pre-extracted symptoms
    // ML engine will use symptoms list if text extraction misses any
    const response = await fetch(mlUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        symptoms,
        use_provided_symptoms: true  // tell ML to trust our extraction
      }),
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

// ── Symptom Extraction ──────────────────────────────────────────────────────
const NL_MAP = {
  'fever': 'fever', 'high fever': 'high_fever', 'mild fever': 'mild_fever',
  'feverish': 'fever', 'feel hot': 'fever', 'high temperature': 'high_fever',
  'cough': 'cough', 'coughing': 'cough', 'dry cough': 'cough',
  'fatigue': 'fatigue', 'tired': 'fatigue', 'exhausted': 'fatigue',
  'weakness': 'fatigue', 'weak': 'fatigue', 'no energy': 'fatigue',
  'lethargy': 'lethargy', 'lethargic': 'lethargy',
  'headache': 'headache', 'head pain': 'headache', 'head hurts': 'headache',
  'migraine': 'headache', 'severe headache': 'severe_headache',
  'nausea': 'nausea', 'feel sick': 'nausea', 'nauseated': 'nausea',
  'vomiting': 'vomiting', 'throwing up': 'vomiting', 'vomit': 'vomiting',
  'stomach pain': 'stomach_pain', 'stomach ache': 'stomach_pain',
  'belly pain': 'stomach_pain', 'tummy ache': 'stomach_pain',
  'abdominal pain': 'abdominal_pain', 'stomach hurts': 'stomach_pain',
  'diarrhea': 'diarrhoea', 'diarrhoea': 'diarrhoea',
  'loose motion': 'diarrhoea', 'loose stool': 'diarrhoea',
  'constipation': 'constipation', 'indigestion': 'indigestion',
  'acidity': 'acidity', 'heartburn': 'acidity',
  'breathlessness': 'breathlessness', 'cant breathe': 'breathlessness',
  'hard to breathe': 'breathlessness', 'shortness of breath': 'breathlessness',
  'wheezing': 'wheezing', 'chest pain': 'chest_pain',
  'chest tightness': 'chest_pain', 'chest hurts': 'chest_pain',
  'rash': 'skin_rash', 'skin rash': 'skin_rash', 'red spots': 'skin_rash',
  'itching': 'itching', 'itchy': 'itching', 'itchy skin': 'itching',
  'yellow skin': 'yellowing_of_skin', 'yellow eyes': 'yellowing_of_eyes',
  'jaundice': 'yellowing_of_skin', 'pale skin': 'pale_skin',
  'joint pain': 'joint_pain', 'joints hurt': 'joint_pain',
  'muscle pain': 'muscle_pain', 'body ache': 'muscle_pain',
  'back pain': 'back_pain', 'neck pain': 'neck_pain', 'knee pain': 'knee_pain',
  'runny nose': 'runny_nose', 'stuffy nose': 'continuous_sneezing',
  'sneezing': 'continuous_sneezing', 'sore throat': 'throat_irritation',
  'throat pain': 'throat_irritation', 'throat hurts': 'throat_irritation',
  'chills': 'chills', 'shivering': 'chills', 'feel cold': 'chills',
  'sweating': 'sweating', 'night sweats': 'sweating',
  'frequent urination': 'frequent_urination',
  'burning urination': 'burning_micturition',
  'painful urination': 'burning_micturition',
  'dark urine': 'dark_urine', 'yellow urine': 'yellow_urine',
  'blurry vision': 'blurred_and_distorted_vision',
  'weight loss': 'weight_loss', 'losing weight': 'weight_loss',
  'no appetite': 'loss_of_appetite', 'loss of appetite': 'loss_of_appetite',
  'not hungry': 'loss_of_appetite',
  'dizziness': 'dizziness', 'dizzy': 'dizziness', 'vertigo': 'dizziness',
  'anxiety': 'anxiety', 'anxious': 'anxiety',
  'depression': 'depression', 'depressed': 'depression',
  'palpitations': 'palpitations', 'heart racing': 'palpitations',
  'swelling': 'swelling_joints', 'swollen': 'swelling_joints',
  'loss of smell': 'loss_of_smell', 'cant smell': 'loss_of_smell',
  'excessive thirst': 'polyuria', 'thirst': 'polyuria',
  'very thirsty': 'polyuria', 'drinking a lot': 'polyuria',
  'excessive hunger': 'excessive_hunger', 'always hungry': 'excessive_hunger',
  'pain behind eyes': 'pain_behind_the_eyes',
  'pain behind the eyes': 'pain_behind_the_eyes',
  'eye pain': 'pain_in_eyes', 'red eyes': 'redness_of_eyes',
  'watery eyes': 'watering_from_eyes',
  'insomnia': 'restlessness', 'cant sleep': 'restlessness',
  'mood swings': 'mood_swings', 'irritable': 'irritability',
  'skin peeling': 'skin_peeling', 'blisters': 'blister',
  'hair loss': 'brittle_nails',
  'mucus': 'mucoid_sputum', 'phlegm': 'mucoid_sputum',
};

function extractSymptoms(text) {
  const lower = text.toLowerCase();
  const found = new Set();
  const sorted = Object.keys(NL_MAP).sort((a, b) => b.length - a.length);
  for (const phrase of sorted) {
    if (lower.includes(phrase)) found.add(NL_MAP[phrase]);
  }
  return [...found];
}

// ── Intent Detection ────────────────────────────────────────────────────────
function detectIntent(text) {
  const lower = text.toLowerCase().trim();
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good evening',
    'good afternoon', 'good night', 'salam', 'assalam', 'namaste'];
  if (greetings.some(g => lower === g || lower.startsWith(g + ' ')
    || lower.startsWith(g + ','))) return 'greeting';
  if (['how are you', 'how r u', 'whats up', "what's up"].some(p =>
    lower.includes(p))) return 'how_are_you';
  if (['thank', 'thanks', 'jazakallah', 'shukriya'].some(t =>
    lower.includes(t))) return 'thanks';
  if (['help', 'what can you do', 'how does this work'].some(h =>
    lower.includes(h))) return 'help';
  if (['bye', 'goodbye', 'khuda hafiz', 'allah hafiz', 'take care'].some(f =>
    lower.includes(f))) return 'farewell';
  if (['yes', 'yeah', 'yep', 'haan', 'ha'].includes(lower)) return 'yes';
  if (['no', 'nope', 'nah', 'nahi'].includes(lower)) return 'no';
  if (extractSymptoms(text).length > 0) return 'symptoms';
  if (['i feel', 'i have', 'suffering', 'pain', 'hurt', 'ache',
    'sick', 'i am', 'experiencing'].some(w => lower.includes(w)))
    return 'possible_symptoms';
  return 'unknown';
}

// ── Fallback Replies ────────────────────────────────────────────────────────
function getFallbackReply(intent, userName) {
  const name = userName ? userName.split(' ')[0] : 'there';
  const hour = new Date().getHours();
  const time = hour < 12 ? 'Good morning' : hour < 17
    ? 'Good afternoon' : 'Good evening';
  const map = {
    greeting: `${time}, ${name}! 👋 I am HealthBot, your AI medical assistant.\n\nDescribe your symptoms and I will analyze them for you. The more detail you give, the more accurate my analysis!`,
    how_are_you: `Fully operational and ready to help, ${name}! 🤖\n\nHow are you feeling today? Please describe any symptoms you have.`,
    thanks: `You are welcome, ${name}! 😊 Remember to consult a real doctor for professional medical advice. Take care!`,
    help: `Here is what I can do, ${name}:\n\n🔍 Analyze symptoms and identify possible diseases\n📊 Show confidence levels for each prediction\n⚠️ Rate severity: Mild, Moderate, Serious, Severe\n💊 Give recommendations and precautions\n\nExample: "I have fever, headache and joint pain"`,
    farewell: `Goodbye, ${name}! 👋 Take care and consult a doctor if symptoms are severe. Allah Hafiz!`,
    yes: `Great! Please describe all your symptoms in detail and I will analyze them.`,
    no: `No problem! Come back anytime if you experience symptoms.`,
    possible_symptoms: `I want to help, ${name}. Please be more specific.\n\nExample: "I have fever and headache" or "I feel tired with stomach pain"`,
    unknown: `I am HealthBot, specialized in symptom analysis. Please describe what you are feeling and I will help identify possible conditions.`,
  };
  return map[intent] || map.unknown;
}

// ── Format ML Result ────────────────────────────────────────────────────────
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
    block: `\n\n📊 ML Analysis (${matched.join(', ')}):\n📋 Most likely: ${top.disease} (${top.confidence}%)\n${others ? `📌 Also possible: ${others}\n` : ''}⚠️ Severity: ${mlResult.severity}\n💊 ${mlResult.recommendation}${precautions}${tip}${followup}\n\n⚕️ Not a substitute for professional medical advice.`
  };
}

// ── Message Route ───────────────────────────────────────────────────────────
router.post('/message', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const user = await User.findById(req.user.id);
    const userName = user ? user.name : 'there';
    const intent = detectIntent(text);
    let botReply = '';
    let mlResult = null;

    // Load recent chat history for Gemini context
    let recentHistory = [];
    const existingConv = await Conversation.findOne({ userId: req.user.id });
    if (existingConv) recentHistory = existingConv.messages.slice(-8);

    if (intent === 'symptoms') {
      const symptoms = extractSymptoms(text);
      mlResult = await getMLPrediction(text, symptoms);
      const ml = buildMLSection(mlResult, symptoms);

      if (process.env.GEMINI_API_KEY) {
        try {
          const geminiText = await getGeminiResponse(
            text,
            ml ? ml.summary : null,
            userName,
            recentHistory
          );
          if (geminiText) {
            botReply = geminiText + (ml ? ml.block : '');
          } else {
            // Gemini returned null — use ML only
            botReply = ml ? ml.block.trim() : getFallbackReply('possible_symptoms', userName);
          }
        } catch (err) {
          console.error('Gemini error:', err.message);
          botReply = ml ? ml.block.trim() : getFallbackReply('possible_symptoms', userName);
        }
      } else {
        botReply = ml ? ml.block.trim() : getFallbackReply('possible_symptoms', userName);
      }

    } else {
      // Non-symptom messages — use Gemini for natural conversation
      if (process.env.GEMINI_API_KEY) {
        try {
          const geminiText = await getGeminiResponse(
            text, null, userName, recentHistory
          );
          botReply = geminiText || getFallbackReply(intent, userName);
        } catch {
          botReply = getFallbackReply(intent, userName);
        }
      } else {
        botReply = getFallbackReply(intent, userName);
      }
    }

    // Save to database
    let conv = await Conversation.findOne({ userId: req.user.id });
    if (!conv) conv = new Conversation({ userId: req.user.id, messages: [] });
    conv.messages.push({ sender: 'user', text });
    conv.messages.push({ sender: 'bot', text: botReply });
    await conv.save();

    res.json({ reply: botReply, mlResult, intent });

  } catch (err) {
    console.error('Chat route error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── History Route ───────────────────────────────────────────────────────────
router.get('/history', auth, async (req, res) => {
  try {
    const conv = await Conversation.findOne({ userId: req.user.id });
    res.json(conv ? conv.messages : []);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;