// ── Constants ─────────────────────────────────────────────────────────────────
export const OTP_TTL_MS = 2 * 60 * 1000; // 5 minutes
export const MAX_ATTEMPTS = 5;
export const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes after max attempts

export const OTP_ACTIONS = Object.freeze({
  DEACTIVATE_CARD: "DEACTIVATE_CARD",
  ACTIVATE_CARD: "ACTIVATE_CARD",
  VERIFY_PHONE: "VERIFY_PHONE",
  RESET_PIN: "RESET_PIN",
});

export const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिंदी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
];

export const BIOMETRIC_COLOR = "#6366f1"; // indigo — visually distinct from app primary

export const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

// ! index.js file color section
export const COLORS = {
  bg: "#0D0D0F",
  bgDeep: "#120909",
  red: "#FF3B30",
  redDark: "#C8211A",
  white: "#FFFFFF",
  textMuted: "rgba(255,255,255,0.42)",
  textDim: "rgba(255,255,255,0.22)",
  ringBorder: "rgba(255,59,48,0.20)",
  cardBorder: "rgba(255,255,255,0.06)",
  secondaryBg: "rgba(255,255,255,0.07)",
  secondaryBorder: "rgba(255,255,255,0.10)",
  green: "#2ECC71",
};
