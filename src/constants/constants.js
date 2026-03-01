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
