// ── Constants ─────────────────────────────────────────────────────────────────

// ✅ FIX: Match backend OTP_TTL_SECONDS = 15 * 60
export const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes
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

export const BIOMETRIC_COLOR = "#6366f1";

export const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

// ✅ FIX: Single color object – use colors.js or tokens.js instead
// Keeping only what's needed for components that haven't migrated yet
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

// ✅ FIX: Remove duplicate C and Login_C – use COLORS or import from theme
// Keeping for backward compatibility, mark as deprecated
export const C = COLORS;
export const Login_C = COLORS;

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
