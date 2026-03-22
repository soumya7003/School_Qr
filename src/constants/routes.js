/**
 * School QR — Route Constants
 *
 * Always use these instead of raw string paths.
 * Matches the Expo Router file structure exactly:
 *
 *   app/
 *     index.jsx              → LANDING
 *     (auth)/
 *       login.jsx            → LOGIN
 *       otp.jsx              → OTP
 *     (app)/
 *       home.jsx             → HOME
 *       qr.jsx               → QR
 *       scan.jsx             → SCAN
 *       updates.jsx          → UPDATES
 *       settings.jsx         → SETTINGS
 *     (modals)/
 *       profile-edit.jsx     → PROFILE_EDIT
 *       card-activate.jsx    → CARD_ACTIVATE
 *       emergency-info.jsx   → EMERGENCY_INFO
 */

export const ROUTES = {
  // ── Entry ──────────────────────────────────────
  LANDING: "/",

  // ── Auth stack ─────────────────────────────────
  LOGIN: "/(auth)/login",
  OTP: "/(auth)/otp",

  // ── App stack (tab bar) ────────────────────────
  HOME: "/(app)/home",
  QR: "/(app)/qr",
  SCAN: "/(app)/scan",
  UPDATES: "/(app)/updates",
  SETTINGS: "/(app)/settings",

  // ── Modals ─────────────────────────────────────
  MODAL_PROFILE_EDIT: "/(modals)/profile-edit",
  MODAL_CARD_ACTIVATE: "/(modals)/card-activate",
  MODAL_EMERGENCY_INFO: "/(modals)/emergency-info",
  MODAL_ADD_CONTACT: "/(modals)/add-contact",
  MODAL_SCAN_HISTORY: "/(modals)/scan-history",
};

/**
 * Tab bar route map — used by TabBar component to highlight active tab.
 * Keys must match the `name` prop Expo Router gives each tab.
 */
export const TAB_ROUTES = {
  home: ROUTES.HOME,
  qr: ROUTES.QR,
  scan: ROUTES.SCAN,
  updates: ROUTES.UPDATES,
  settings: ROUTES.SETTINGS,
};

export default ROUTES;
