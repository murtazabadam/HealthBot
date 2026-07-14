// ── Central API Configuration ───────────────────────────────────────────────
// This is the ONLY place the backend URL should ever be defined.
// Every other file MUST import API_BASE_URL from here instead of
// hardcoding the URL. This prevents old/dead URLs from creeping back in
// when multiple people edit the codebase.

export const API_BASE_URL = "https://healthbot-backend-ezxv.onrender.com";

export const ML_ENGINE_URL = "https://murtazabadam-healthbot-ml.hf.space";

// Common API endpoints — import these instead of building URL strings manually
export const API = {
  // Auth
  SEND_OTP:               `${API_BASE_URL}/api/auth/send-otp`,
  VERIFY_REGISTRATION_OTP: `${API_BASE_URL}/api/auth/verify-registration-otp`,
  REGISTER:                `${API_BASE_URL}/api/auth/register`,
  LOGIN:                   `${API_BASE_URL}/api/auth/login`,
  FORGOT_PASSWORD:         `${API_BASE_URL}/api/auth/forgot-password`,
  VERIFY_OTP:              `${API_BASE_URL}/api/auth/verify-otp`,
  RESET_PASSWORD:          `${API_BASE_URL}/api/auth/reset-password`,
  PROFILE:                 `${API_BASE_URL}/api/auth/profile`,
  CHANGE_PASSWORD:         `${API_BASE_URL}/api/auth/change-password`,
  SET_PASSWORD:            `${API_BASE_URL}/api/auth/set-password`,
  DELETE_ACCOUNT:          `${API_BASE_URL}/api/auth/delete-account`,
  RESEND_VERIFICATION:     `${API_BASE_URL}/api/auth/resend-verification`,
  GOOGLE_LOGIN:            `${API_BASE_URL}/api/auth/google`,

  // Chat
  CHAT_MESSAGE: `${API_BASE_URL}/api/chat/message`,
  CHAT_HISTORY: `${API_BASE_URL}/api/chat/history`,
};

export default API_BASE_URL;