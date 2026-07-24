// Restored to original Google Gemini API
const API_KEY = process.env.REACT_APP_GEMINI_KEY;

export const geminiReady = !!API_KEY && API_KEY !== "DISABLED";

if (!geminiReady) {
  console.log("Gemini: No API key found in frontend .env file");
} else {
  console.log("Gemini ready in frontend!");
}

export async function getGeminiReply(userMessage, mlSummary, userProfile) {
  if (!geminiReady) return null;

  // Extract user details to inject into the AI's brain
  const userName = userProfile?.name
    ? userProfile.name.split(" ")[0]
    : "Patient";
  const age = userProfile?.age ? `${userProfile.age} years old` : "Unknown";
  const gender = userProfile?.gender ? userProfile.gender : "Unknown";
  const bloodGroup = userProfile?.bloodGroup
    ? userProfile.bloodGroup
    : "Unknown";
  const address = userProfile?.address ? userProfile.address : "Unknown";

  const promptText = `You are HealthBot, a compassionate AI medical assistant.

Patient Profile:
- Name: ${userName}
- Age: ${age}
- Gender: ${gender}
- Blood Group: ${bloodGroup}
- Location/Environment: ${address}

${mlSummary ? `ML Prediction: ${mlSummary}` : "No medical ML prediction available for this specific message."}

RULES:
- Be warm and empathetic.
- If the user asks about their own profile (like "what is my age?", "what is my blood group?"), answer them directly and conversationally using the Patient Profile provided above!
- Keep response to 2-3 sentences only.
- TAILOR YOUR ADVICE to the patient's age, gender, and environment. (e.g., If they are elderly, suggest extra caution. If female, consider female-specific health factors).
- CRITICAL: If Age, Gender, or Blood Group is "Unknown" and that information would help you better understand their specific symptoms, politely ask them to provide it.
- If an ML prediction is available, mention it naturally.
- Always say you are an AI not a real doctor, and never make definitive diagnoses.

User Message: ${userMessage}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: promptText }],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      console.error("Gemini API Error:", response.statusText);
      return null;
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error("Gemini fetch error:", err.message);
    return null;
  }
}
