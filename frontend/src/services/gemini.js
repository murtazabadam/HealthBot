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

  // Extract user details
  const userName = userProfile?.name || "Unknown";
  const age = userProfile?.age ? `${userProfile.age}` : "Unknown";
  const gender = userProfile?.gender ? userProfile.gender : "Unknown";
  const bloodGroup = userProfile?.bloodGroup
    ? userProfile.bloodGroup
    : "Unknown";
  const address = userProfile?.address ? userProfile.address : "Unknown";

  // STRICT DATABASE PROMPT WITH ANTI-HALLUCINATION RULES
  const promptText = `You are HealthBot, an AI directly connected to a patient database.

=== DATABASE PROFILE FOR CURRENT USER ===
Name: ${userName}
Age: ${age}
Gender: ${gender}
Blood Group: ${bloodGroup}
Address: ${address}
=========================================

${mlSummary ? `ML Engine Prediction: ${mlSummary}` : ""}

MANDATORY RULES (DO NOT BREAK):
1. YOU ALREADY KNOW the user's details because they are listed in the DATABASE PROFILE above.
2. If the user asks about their age, name, location, or blood group, tell them the exact answer immediately.
3. NEVER say "you didn't tell me". Say "According to your system profile..."
4. NO FAKE NUMBERS: NEVER generate fake or placeholder phone numbers (e.g., 555-xxxx) for doctors or family. If emergency contacts are needed, ONLY suggest calling the local emergency number (112) and remind them of their registered Address.
5. Keep your answer under 3 sentences.

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
