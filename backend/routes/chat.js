const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');

async function getMLPrediction(text, symptoms) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const response = await fetch(
      'https://tranquil-nourishment-production-11f9.up.railway.app/predict',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, symptoms }),
        signal: controller.signal
      }
    );
    clearTimeout(timeout);
    const data = await response.json();
    console.log('ML Response:', JSON.stringify(data).substring(0, 300));
    return data;
  } catch (err) {
    console.error('ML Engine error:', err.message);
    return null;
  }
}

const NL_MAP = {
  'fever': 'fever', 'high fever': 'high_fever', 'mild fever': 'mild_fever',
  'feverish': 'fever', 'feel hot': 'fever', 'temperature': 'fever',
  'high temperature': 'high_fever', 'burning up': 'high_fever',
  'cough': 'cough', 'coughing': 'cough', 'dry cough': 'cough',
  'fatigue': 'fatigue', 'tired': 'fatigue', 'exhausted': 'fatigue',
  'weakness': 'fatigue', 'weak': 'fatigue', 'no energy': 'fatigue',
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
  'frequent urination': 'frequent_urination', 'need to pee often': 'frequent_urination',
  'burning urination': 'burning_micturition', 'painful urination': 'burning_micturition',
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
  'drinking a lot of water': 'polyuria', 'very thirsty': 'polyuria',
  'excessive hunger': 'excessive_hunger', 'always hungry': 'excessive_hunger',
  'pain behind eyes': 'pain_behind_the_eyes', 'eye pain': 'pain_in_eyes',
  'pain behind the eyes': 'pain_behind_the_eyes',
  'bloody stool': 'bloody_stool', 'blood in stool': 'bloody_stool',
  'blood in urine': 'burning_micturition',
  'insomnia': 'restlessness', 'cant sleep': 'restlessness',
  'hair loss': 'brittle_nails', 'nail problems': 'brittle_nails',
  'skin peeling': 'skin_peeling', 'dandruff': 'dischromic_patches',
  'mucus': 'mucoid_sputum', 'phlegm': 'mucoid_sputum', 'sputum': 'mucoid_sputum',
};

function extractSymptoms(text) {
  const lower = text.toLowerCase();
  const found = new Set();
  const sortedPhrases = Object.keys(NL_MAP).sort((a, b) => b.length - a.length);
  for (const phrase of sortedPhrases) {
    if (lower.includes(phrase)) {
      found.add(NL_MAP[phrase]);
    }
  }
  return [...found];
}

// Detect message type
function detectIntent(text) {
  const lower = text.toLowerCase().trim();

  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good evening',
    'good afternoon', 'good night', 'salam', 'assalam', 'namaste'];
  if (greetings.some(g => lower === g || lower.startsWith(g + ' ') || lower.startsWith(g + ','))) {
    return 'greeting';
  }

  const howAreYou = ['how are you', 'how r u', 'whats up', "what's up",
    'how do you do', 'how are u'];
  if (howAreYou.some(p => lower.includes(p))) return 'how_are_you';

  const thanks = ['thank', 'thanks', 'thank you', 'thankyou', 'thx', 'jazakallah', 'shukriya'];
  if (thanks.some(t => lower.includes(t))) return 'thanks';

  const helpKeywords = ['help', 'what can you do', 'how does this work',
    'what are your features', 'capabilities'];
  if (helpKeywords.some(h => lower.includes(h))) return 'help';

  const farewells = ['bye', 'goodbye', 'see you', 'take care', 'khuda hafiz', 'allah hafiz'];
  if (farewells.some(f => lower.includes(f))) return 'farewell';

  const yesWords = ['yes', 'yeah', 'yep', 'yup', 'correct', 'right', 'true', 'haan', 'ha'];
  if (yesWords.includes(lower)) return 'yes';

  const noWords = ['no', 'nope', 'nah', 'not really', 'nahi'];
  if (noWords.includes(lower)) return 'no';

  const symptoms = extractSymptoms(text);
  if (symptoms.length > 0) return 'symptoms';

  const feelWords = ['i feel', 'i am feeling', 'feeling', 'i have', 'suffering',
    'i got', 'experiencing', 'i am having', 'symptoms'];
  if (feelWords.some(w => lower.includes(w))) return 'possible_symptoms';

  return 'unknown';
}

function getConversationalReply(intent, text, userName) {
  const name = userName ? userName.split(' ')[0] : 'there';
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const replies = {
    greeting: [
      `${timeGreeting}, ${name}! 👋 I'm HealthBot, your AI medical assistant.\n\nI can analyze your symptoms and help identify possible conditions. Please describe what you're feeling — be as detailed as possible for the most accurate results.`,
      `Hello ${name}! 😊 Welcome to HealthBot.\n\nI'm here to help you understand your symptoms. Just tell me what you're experiencing and I'll analyze it for you.`,
    ],
    how_are_you: [
      `I'm fully operational and ready to help you, ${name}! 🤖\n\nMore importantly — how are YOU feeling? Please describe any symptoms you're experiencing and I'll analyze them for you.`,
    ],
    thanks: [
      `You're welcome, ${name}! 😊\n\nRemember, I'm always here if you have more symptoms to analyze. Please consult a doctor for professional medical advice. Take care! 🌟`,
      `Happy to help! 🙏 If you experience any other symptoms, feel free to describe them and I'll analyze them. Stay healthy, ${name}!`,
    ],
    help: [
      `Here's what I can do for you, ${name}:\n\n🔍 Analyze symptoms and identify possible diseases\n📊 Show confidence levels for each prediction\n⚠️ Assess severity (Mild/Moderate/Serious/Severe)\n💊 Provide recommendations and precautions\n📖 Explain each disease\n\nJust describe your symptoms naturally. For example:\n"I have fever, headache and joint pain since 2 days"\n\nThe more symptoms you describe, the more accurate my analysis!`,
    ],
    farewell: [
      `Goodbye, ${name}! 👋 Take care of yourself.\n\nRemember to consult a doctor if your symptoms are severe. Stay healthy! 💪`,
      `Take care, ${name}! 🌟 Come back anytime if you need symptom analysis. Allah Hafiz!`,
    ],
    yes: [
      `I see! Please describe all your symptoms in detail and I'll analyze them for you. The more symptoms you mention, the more accurate my prediction will be.`,
    ],
    no: [
      `No problem! If you experience any symptoms later, feel free to describe them and I'll help analyze what might be going on.`,
    ],
    possible_symptoms: [
      `I'd like to help analyze your condition, ${name}. Could you be more specific about your symptoms?\n\nFor example:\n• "I have fever and headache"\n• "I feel tired with stomach pain"\n• "I have skin rash and joint pain"\n\nDescribe as many symptoms as you can for a more accurate analysis.`,
    ],
    unknown: [
      `I'm HealthBot 🤖 — specialized in medical symptom analysis.\n\nPlease describe your symptoms and I'll analyze them. For example:\n"I have fever, cough and fatigue"\n\nFor the most accurate results, mention all symptoms you're experiencing.`,
    ],
  };

  const options = replies[intent] || replies.unknown;
  return options[Math.floor(Math.random() * options.length)];
}

function buildBotReply(text, mlResult, userName) {
  const symptoms = extractSymptoms(text);

  if (!mlResult || mlResult.error || !mlResult.predictions || mlResult.predictions.length === 0) {
    return `I detected: ${symptoms.join(', ').replace(/_/g, ' ')}.\n\nCould you describe more symptoms? For example, do you also have fever, headache, nausea or any other discomfort?`;
  }

  const top = mlResult.predictions[0];
  const others = mlResult.predictions
    .slice(1)
    .filter(p => p.confidence > 3)
    .map(p => `${p.disease} (${p.confidence}%)`)
    .join(', ');

  const matched = (mlResult.matched_symptoms || symptoms).map(s => s.replace(/_/g, ' '));
  const lowConf = mlResult.low_confidence;
  const followup = mlResult.followup_question;

  const description = top.description
    ? `\n📖 ${top.description}`
    : '';

  const precautions = top.precautions && top.precautions.length > 0
    ? `\n\n💡 Precautions:\n${top.precautions.map(p => `• ${p}`).join('\n')}`
    : '';

  const accuracyNote = lowConf
    ? `\n\n⚡ For better accuracy, try describing more symptoms.`
    : '';

  const followupNote = followup
    ? `\n\n❓ ${followup}`
    : '';

  return `🔍 Based on your symptoms (${matched.join(', ')}):

📋 Most likely: ${top.disease} (${top.confidence}% confidence)
${others ? `📌 Also possible: ${others}` : ''}
⚠️ Severity: ${mlResult.severity}
${description}
💊 ${mlResult.recommendation}
${precautions}
${accuracyNote}
${followupNote}

⚕️ This is not a substitute for professional medical advice.`;
}

// ── Routes ─────────────────────────────────────────────────────────────────────
router.post('/message', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const user = await require('../models/User').findById(req.user.id);
    const userName = user ? user.name : '';
    const intent = detectIntent(text);
    let botReply = '';
    let mlResult = null;

    if (intent === 'symptoms') {
      const symptoms = extractSymptoms(text);
      mlResult = await getMLPrediction(text, symptoms);
      botReply = buildBotReply(text, mlResult, userName);
    } else {
      botReply = getConversationalReply(intent, text, userName);
    }

    let conversation = await Conversation.findOne({ userId: req.user.id });
    if (!conversation) {
      conversation = new Conversation({ userId: req.user.id, messages: [] });
    }
    conversation.messages.push({ sender: 'user', text });
    conversation.messages.push({ sender: 'bot', text: botReply });
    await conversation.save();

    res.json({ reply: botReply, mlResult, intent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ userId: req.user.id });
    res.json(conversation ? conversation.messages : []);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;