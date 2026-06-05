// We are keeping the function names as "Gemini" so we don't break Chat.js,
// but this is now 100% powered by Grok!

const API_KEY = process.env.REACT_APP_GROK_KEY;

export const geminiReady = !!API_KEY && API_KEY !== "DISABLED";

if (!geminiReady) {
  console.log("Grok: No API key found in frontend");
} else {
  console.log("Grok ready in frontend!");
}

export async function getGeminiReply(userMessage, mlSummary, userName) {
  if (!geminiReady) return null;

  const systemPrompt = `You are HealthBot, a compassionate AI medical assistant.

Patient name: ${userName}
${mlSummary ? `ML Prediction: ${mlSummary}` : "No ML prediction available yet"}

RULES:
- Be warm and empathetic
- Keep response to 2-3 sentences only
- If ML prediction is available, mention it naturally
- Ask one follow-up question about symptoms
- Always say you are an AI not a real doctor
- Never make definitive diagnoses`;

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        model: "grok-beta",
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Grok API Error:", errorData);
      return null;
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (err) {
    console.error("Grok fetch error:", err.message);
    return null;
  }
}
