const axios = require('axios');

/**
 * Runs OCR on a prescription image by delegating to the ml-engine's /ocr
 * endpoint (Python + the real tesseract-ocr binary via pytesseract).
 *
 * This intentionally does NOT use the tesseract.js npm package in Node:
 * that package downloads its trained-data model from a CDN at runtime on
 * first use, which is a fragile dependency for a hosted backend (blocked/
 * slow CDN, cold starts on a free-tier host, etc). Routing through the
 * already-deployed ml-engine — the same service getMLPrediction() in
 * routes/chat.js calls — keeps OCR reliable and keeps all Python/ML-ish
 * dependencies in one place.
 *
 * Accepts a base64 data URL (e.g. "data:image/jpeg;base64,...") — which is
 * what the frontend's file input already produces via FileReader.
 */
async function extractTextFromImage(base64Image) {
  try {
    const mlUrl =
      process.env.ML_ENGINE_URL ||
      'https://murtazabadam-healthbot-ml.hf.space/predict';
    // /predict and /ocr live on the same ml-engine host — swap the path.
    const ocrUrl = mlUrl.replace(/\/predict\/?$/, '/ocr');

    const res = await axios.post(
      ocrUrl,
      { image: base64Image },
      { timeout: 30000 }
    );
    return (res.data?.text || '').trim();
  } catch (err) {
    console.error('OCR error:', err.response?.data || err.message);
    return '';
  }
}

module.exports = { extractTextFromImage };