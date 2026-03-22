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

export const C = {
  bg: "#0D0D0F",
  bgCard2: "#1A1A1D",
  red: "#FF3B30",
  redDark: "#C8211A",
  redGlow: "rgba(255,59,48,0.18)",
  white: "#FFFFFF",
  white90: "rgba(255,255,255,0.90)",
  white60: "rgba(255,255,255,0.60)",
  white35: "rgba(255,255,255,0.35)",
  white15: "rgba(255,255,255,0.15)",
  white08: "rgba(255,255,255,0.08)",
  white04: "rgba(255,255,255,0.04)",
  green: "#2ECC71",
  greenGlow: "rgba(46,204,113,0.5)",
  border: "rgba(255,255,255,0.07)",
  borderRed: "rgba(255,59,48,0.25)",
};

export const Login_C = {
  bg: "#0D0D0F",
  surface: "#131315",
  red: "#FF3B30",
  redDark: "#C8211A",
  redBorder: "rgba(255,59,48,0.35)",
  white: "#FFFFFF",
  white90: "rgba(255,255,255,0.90)",
  white60: "rgba(255,255,255,0.60)",
  white40: "rgba(255,255,255,0.40)",
  white10: "rgba(255,255,255,0.10)",
  white06: "rgba(255,255,255,0.06)",
  muted: "rgba(255,255,255,0.42)",
  dim: "rgba(255,255,255,0.22)",
  border: "rgba(255,255,255,0.07)",
  focusBorder: "rgba(255,59,48,0.55)",
  green: "#2ECC71",
};

export const VALID_MODES = ["register", "login"];
export const TRUST_BADGE_TEXT = "Trusted by 2,400+ parents across India";

export const FEATURE_PILLS = [
  { lib: "mci", icon: "qrcode-scan", label: "Instant QR Scan", delay: 550 },
  { lib: "feather", icon: "lock", label: "Secure & Private", delay: 650 },
  { lib: "feather", icon: "bell", label: "Live Alerts", delay: 750 },
];

export const ERROR_MESSAGES = {
  INVALID_PAYLOAD_PHONE: "Invalid phone number format.",
  OTP_REQUEST_FAILED: "Could not send OTP. Please try again.",
  INVALID_PAYLOAD_INIT: "Check your card number and phone number.",
  REGISTRATION_INIT_FAILED: "Could not send OTP. Please try again.",
  404: "Card not found. Check the number printed on your card.",
  409: "This card is already registered. Try signing in instead.",
  NETWORK_ERROR: "No internet connection. Check your network and retry.",
  REQUEST_TIMEOUT: "Request timed out. Please try again.",
  DEFAULT: "Something went wrong. Please try again.",
};

export const SUSPICIOUS_PATHS_ANDROID = [
  "/system/app/Superuser.apk",
  "/sbin/su",
  "/system/bin/su",
  "/system/xbin/su",
  "/data/local/xbin/su",
  "/su/bin/su",
];

export const ApiCode = Object.freeze({
  SETUP_FAILED: "REQUEST_SETUP_FAILED",
  TIMEOUT: "REQUEST_TIMEOUT",
  NETWORK: "NETWORK_ERROR",
  OFFLINE: "DEVICE_OFFLINE",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  FORBIDDEN: "FORBIDDEN",
  QUEUE_TIMEOUT: "REFRESH_QUEUE_TIMEOUT",
  CANCELLED: "REQUEST_CANCELLED",
});
