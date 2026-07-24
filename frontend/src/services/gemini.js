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
  const userName = userProfile?.name || "Patient";
  const age = userProfile?.age ? `${userProfile.age} years old` : "Unknown";
  const gender = userProfile?.gender ? userProfile.gender : "Unknown";
  const bloodGroup = userProfile?.bloodGroup
    ? userProfile.bloodGroup
    : "Unknown";
  const address = userProfile?.address ? userProfile.address : "Unknown";

  const promptText = `You are HealthBot, a compassionate AI medical assistant.

SYSTEM DATA - CURRENT PATIENT PROFILE:
- Name: ${userName}
- Age: ${age}
- Gender: ${gender}
- Blood Group: ${bloodGroup}
- Address: ${address}

${mlSummary ? `ML Prediction: ${mlSummary}` : ""}

CRITICAL RULES FOR AI:
1. READ THE SYSTEM DATA: If the user asks "give details about me", "what is my profile", "who am I", or asks about any of their personal details, YOU MUST directly list their Name, Age, Gender, Blood Group, and Address from the SYSTEM DATA block above. Do not claim you don't know!
2. DO NOT HALLUCINATE: Do not claim the user told you things in previous messages. Treat the SYSTEM DATA as absolute facts provided by the database.
3. MISSING DATA: If a field says "Unknown", it means the user hasn't filled it in their profile yet. You can politely remind them to update their Profile settings if they ask.
4. ONLY ASK IF NECESSARY: DO NOT ask the user for missing details (Age, Gender, etc.) UNLESS they are actively describing a health symptom.
5. Always state you are an AI, not a real doctor, and keep responses to 3-4 sentences max.

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
