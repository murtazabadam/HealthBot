const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');

async function getMLPrediction(symptoms) {
  try {
    const response = await fetch('http://127.0.0.1:5001/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms })
    });
    return await response.json();
  } catch (err) {
    return null;
  }
}

function extractSymptoms(text) {
  const allSymptoms = [
    'fever','cough','fatigue','headache','nausea','vomiting','diarrhea',
    'chills','sweating','rash','dizziness','weakness','body_ache','sore_throat',
    'runny_nose','sneezing','chest_pain','shortness_of_breath','wheezing',
    'joint_pain','stomach_pain','abdominal_pain','blurred_vision','itching',
    'frequent_urination','excessive_thirst','burning_urination','pale_skin',
    'yellowing_of_skin','dark_urine','high_fever','severe_headache',
    'lower_back_pain','sensitivity_to_light','chest_tightness','slow_healing'
  ];
  const lower = text.toLowerCase();
  return allSymptoms.filter(s => lower.includes(s.replace('_', ' ')) || lower.includes(s));
}

function buildBotReply(text, mlResult) {
  const symptoms = extractSymptoms(text);

  if (symptoms.length === 0) {
    return `I'm HealthBot 🤖. Please describe your symptoms and I'll analyze them. For example: "I have fever, cough and fatigue."`;
  }

  if (!mlResult || !mlResult.predictions || mlResult.predictions.length === 0) {
    return `I detected these symptoms: ${symptoms.join(', ')}. Could you describe them in more detail?`;
  }

  const top = mlResult.predictions[0];
  const others = mlResult.predictions.slice(1).map(p => `${p.disease} (${p.confidence}%)`).join(', ');

  return `🔍 Based on your symptoms (${symptoms.join(', ')}):

📋 Most likely: **${top.disease}** (${top.confidence}% confidence)
${others ? `📌 Also possible: ${others}` : ''}
⚠️ Severity: **${mlResult.severity}**
💊 Recommendation: ${mlResult.recommendation}

⚕️ *This is not a substitute for professional medical advice.*`;
}

// Send a message
router.post('/message', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const symptoms = extractSymptoms(text);
    const mlResult = symptoms.length > 0 ? await getMLPrediction(symptoms) : null;
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