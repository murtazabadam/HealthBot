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
    console.log('ML Response:', JSON.stringify(data).substring(0, 200));
    return data;
  } catch (err) {
    console.error('ML Engine error:', err.message);
    return null;
  }
}
function extractSymptoms(text) {
  const allSymptoms = [
    'fever', 'cough', 'fatigue', 'headache', 'nausea', 'vomiting',
    'diarrhoea', 'chills', 'sweating', 'skin_rash', 'dizziness',
    'weakness', 'muscle_pain', 'sore_throat', 'runny_nose',
    'continuous_sneezing', 'chest_pain', 'breathlessness', 'wheezing',
    'joint_pain', 'stomach_pain', 'abdominal_pain', 'blurred_and_distorted_vision',
    'itching', 'frequent_urination', 'excessive_thirst', 'burning_micturition',
    'yellowing_of_skin', 'dark_urine', 'high_fever', 'severe_headache',
    'back_pain', 'sensitivity_to_light', 'chest_pain', 'weight_loss',
    'loss_of_appetite', 'mild_fever', 'yellow_urine', 'yellowish_skin',
    'constipation', 'acidity', 'indigestion', 'anxiety', 'depression',
    'irritability', 'neck_pain', 'knee_pain', 'hip_joint_pain',
    'swelling_joints', 'painful_walking', 'cold_hands_and_feets',
    'mood_swings', 'weight_gain', 'restlessness', 'lethargy',
    'patches_in_throat', 'irregular_sugar_level', 'coma',
    'puffy_face_and_eyes', 'enlarged_thyroid', 'brittle_nails',
    'swollen_extremeties', 'excessive_hunger', 'extra_marital_contacts',
    'drying_and_tingling_lips', 'slurred_speech', 'knee_pain',
    'loss_of_balance', 'unsteadiness', 'weakness_of_one_body_side',
    'loss_of_smell', 'bladder_discomfort', 'foul_smell_of_urine',
    'continuous_feel_of_urine', 'passage_of_gases', 'internal_itching',
    'toxic_look', 'depression', 'irritability', 'muscle_pain',
    'altered_sensorium', 'red_spots_over_body', 'belly_pain',
    'abnormal_menstruation', 'dischromic_patches', 'watering_from_eyes',
    'increased_appetite', 'polyuria', 'family_history', 'mucoid_sputum',
    'rusty_sputum', 'lack_of_concentration', 'visual_disturbances',
    'receiving_blood_transfusion', 'receiving_unsterile_injections',
    'coma', 'stomach_bleeding', 'distention_of_abdomen',
    'history_of_alcohol_consumption', 'fluid_overload', 'blood_in_sputum',
    'prominent_veins_on_calf', 'palpitations', 'painful_walking',
    'pus_filled_pimples', 'blackheads', 'scurring', 'skin_peeling',
    'silver_like_dusting', 'small_dents_in_nails', 'inflammatory_nails',
    'blister', 'red_sore_around_nose', 'yellow_crust_ooze'
  ];

  const lower = text.toLowerCase();

  // Natural language mapping
  const nlMap = {
    'stomach hurts': 'stomach_pain',
    'belly pain': 'abdominal_pain',
    'feel sick': 'nausea',
    'throwing up': 'vomiting',
    'cant breathe': 'breathlessness',
    'hard to breathe': 'breathlessness',
    'short of breath': 'breathlessness',
    'tired': 'fatigue',
    'exhausted': 'fatigue',
    'no energy': 'fatigue',
    'feel weak': 'fatigue',
    'head hurts': 'headache',
    'head pain': 'headache',
    'runny nose': 'runny_nose',
    'stuffy nose': 'continuous_sneezing',
    'body ache': 'muscle_pain',
    'muscle ache': 'muscle_pain',
    'joint ache': 'joint_pain',
    'feel hot': 'fever',
    'high temperature': 'high_fever',
    'feel feverish': 'fever',
    'feverish': 'fever',
    'skin rash': 'skin_rash',
    'itchy skin': 'itching',
    'loose motion': 'diarrhoea',
    'loose stool': 'diarrhoea',
    'diarrhea': 'diarrhoea',
    'sore throat': 'sore_throat',
    'throat pain': 'sore_throat',
    'back pain': 'back_pain',
    'lose weight': 'weight_loss',
    'losing weight': 'weight_loss',
    'not hungry': 'loss_of_appetite',
    'no appetite': 'loss_of_appetite',
    'dark urine': 'dark_urine',
    'yellow eyes': 'yellowing_of_skin',
    'yellow skin': 'yellowing_of_skin',
    'blurry vision': 'blurred_and_distorted_vision',
    'cant see': 'blurred_and_distorted_vision',
    'frequent urination': 'frequent_urination',
    'need to pee': 'frequent_urination',
    'burning urination': 'burning_micturition',
    'painful urination': 'burning_micturition',
    'anxiety': 'anxiety',
    'depression': 'depression',
    'neck pain': 'neck_pain',
    'knee pain': 'knee_pain',
    'chest tightness': 'chest_pain',
    'chest hurts': 'chest_pain',
    'heart pounding': 'palpitations',
    'heart racing': 'palpitations',
    'sweating': 'sweating',
    'night sweats': 'sweating',
    'shivering': 'chills',
    'feel cold': 'chills',
  };

  const found = new Set();

  // Check natural language mappings first
  for (const [phrase, symptom] of Object.entries(nlMap)) {
    if (lower.includes(phrase)) found.add(symptom);
  }

  // Check direct symptom matches
  for (const symptom of allSymptoms) {
    const readable = symptom.replace(/_/g, ' ');
    if (lower.includes(readable) || lower.includes(symptom)) {
      found.add(symptom);
    }
  }

  return [...found];
}

function buildBotReply(text, mlResult) {
  const symptoms = extractSymptoms(text);

  if (symptoms.length === 0) {
    return `I'm HealthBot 🤖 I can help analyze your symptoms.\n\nPlease describe what you're feeling. For example:\n"I have fever, headache and joint pain since 2 days"\n\nThe more symptoms you describe, the more accurate my analysis will be.`;
  }

  if (!mlResult || mlResult.error || !mlResult.predictions || mlResult.predictions.length === 0) {
    return `I detected: ${symptoms.join(', ')}.\n\nCould you describe more symptoms? For example, do you also have fever, headache, nausea or any other discomfort?`;
  }

  const top = mlResult.predictions[0];
  const others = mlResult.predictions
    .slice(1)
    .filter(p => p.confidence > 3)
    .map(p => `${p.disease} (${p.confidence}%)`)
    .join(', ');

  const matched = mlResult.matched_symptoms || symptoms;
  const lowConf = mlResult.low_confidence;
  const followup = mlResult.followup_question;

  const description = top.description
    ? `\n📖 ${top.description}`
    : '';

  const precautions = top.precautions && top.precautions.length > 0
    ? `\n\n💡 Precautions:\n${top.precautions.map(p => `• ${p}`).join('\n')}`
    : '';

  const accuracyNote = lowConf
    ? `\n\n⚡ Tip: Describe more symptoms for a more accurate diagnosis.`
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
// Send a message
router.post('/message', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const symptoms = extractSymptoms(text);
    const mlResult = await getMLPrediction(text, symptoms);
    const botReply = buildBotReply(text, mlResult);

    let conversation = await Conversation.findOne({ userId: req.user.id });
    if (!conversation) {
      conversation = new Conversation({ userId: req.user.id, messages: [] });
    }
    conversation.messages.push({ sender: 'user', text });
    conversation.messages.push({ sender: 'bot', text: botReply });
    await conversation.save();

    res.json({ reply: botReply, mlResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get history
router.get('/history', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ userId: req.user.id });
    res.json(conversation ? conversation.messages : []);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;