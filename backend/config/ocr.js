const axios = require('axios');

/**
 * Runs OCR on a prescription upload (photo OR PDF) by delegating to the
 * ml-engine's /ocr endpoint (Python + real tesseract-ocr / PyMuPDF).
 *
 * This intentionally does NOT use the tesseract.js npm package in Node:
 * that package downloads its trained-data model from a CDN at runtime on
 * first use, which is a fragile dependency for a hosted backend (blocked/
 * slow CDN, cold starts on a free-tier host, etc). Routing through the
 * already-deployed ml-engine — the same service getMLPrediction() in
 * routes/chat.js calls — keeps OCR reliable and keeps all Python/ML-ish
 * dependencies in one place.
 *
 * Accepts a base64 data URL (e.g. "data:image/jpeg;base64,..." or
 * "data:application/pdf;base64,...") — which is what the frontend's file
 * input already produces via FileReader for both photo and PDF uploads.
 * The ml-engine inspects the data URL's mime prefix itself to decide
 * whether to run straight OCR (image) or the PDF path (direct text
 * extraction, falling back to per-page OCR for scanned PDFs).
 */
async function extractTextFromFile(base64File) {
  try {
    const mlUrl =
      process.env.ML_ENGINE_URL ||
      'https://murtazabadam-healthbot-ml.hf.space/predict';
    // /predict and /ocr live on the same ml-engine host — swap the path.
    const ocrUrl = mlUrl.replace(/\/predict\/?$/, '/ocr');

    const res = await axios.post(
      ocrUrl,
      { image: base64File },
      { timeout: 45000 } // PDFs with several pages take longer than a single photo
    );
    return (res.data?.text || '').trim();
  } catch (err) {
    console.error('OCR error:', err.response?.data || err.message);
    return '';
  }
}

// Kept as a named alias for anything still importing the old name.
const extractTextFromImage = extractTextFromFile;

module.exports = { extractTextFromFile, extractTextFromImage };