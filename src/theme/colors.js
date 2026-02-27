/**
 * School QR — Color Tokens
 * Dark theme only (matches the UI/UX spec)
 */

const palette = {
  // ── Brand ──────────────────────────────────────
  red50: "#FFF1F0",
  red100: "#FFE0DE",
  red400: "#FF6B63",
  red500: "#E8342A", // primary
  red600: "#C9291F",
  red700: "#B5251D", // primary-dark

  // ── Neutrals ───────────────────────────────────
  black: "#000000",
  gray950: "#070A0F", // page bg
  gray900: "#0A0D12", // screen bg
  gray850: "#0F1218",
  gray800: "#131720", // surface
  gray750: "#161B28",
  gray700: "#1C2232", // surface2
  gray650: "#242A3D", // surface3
  gray600: "#2E3550",
  gray500: "#3B4260",
  gray400: "#555C70", // text3 / disabled
  gray300: "#8A90A2", // text2 / secondary
  gray100: "#C8CDD8",
  white: "#FFFFFF",
  textPrimary: "#F0F2F7", // text

  // ── Semantic ───────────────────────────────────
  green400: "#4ADE80",
  green500: "#22C55E",
  green600: "#16A34A",

  amber300: "#FCD34D",
  amber400: "#FBBF24",
  amber500: "#F59E0B",
  amber600: "#D97706",

  blue400: "#60A5FA",
  blue500: "#3B82F6",
  blue600: "#2563EB",

  purple500: "#A855F7",

  // ── Transparent overlays ───────────────────────
  redAlpha8: "rgba(232,52,42,0.08)",
  redAlpha12: "rgba(232,52,42,0.12)",
  redAlpha15: "rgba(232,52,42,0.15)",
  redAlpha20: "rgba(232,52,42,0.20)",
  redAlpha25: "rgba(232,52,42,0.25)",
  redAlpha30: "rgba(232,52,42,0.30)",
  redAlpha35: "rgba(232,52,42,0.35)",

  greenAlpha10: "rgba(34,197,94,0.10)",
  greenAlpha12: "rgba(34,197,94,0.12)",
  greenAlpha15: "rgba(34,197,94,0.15)",

  amberAlpha10: "rgba(245,158,11,0.10)",
  amberAlpha12: "rgba(245,158,11,0.12)",

  blueAlpha10: "rgba(59,130,246,0.10)",
  blueAlpha12: "rgba(59,130,246,0.12)",

  whiteAlpha4: "rgba(255,255,255,0.04)",
  whiteAlpha6: "rgba(255,255,255,0.06)",
  whiteAlpha7: "rgba(255,255,255,0.07)",
  whiteAlpha9: "rgba(255,255,255,0.09)",
  whiteAlpha12: "rgba(255,255,255,0.12)",
  whiteAlpha20: "rgba(255,255,255,0.20)",

  blackAlpha30: "rgba(0,0,0,0.30)",
  blackAlpha50: "rgba(0,0,0,0.50)",
  blackAlpha70: "rgba(0,0,0,0.70)",
  transparent: "transparent",
};

/**
 * Semantic color map — use these in components, not raw palette values.
 * This makes future theme switching trivial.
 */
export const colors = {
  // ── Backgrounds ────────────────────────────────
  pageBg: palette.gray950, // outermost page
  screenBg: palette.gray900, // individual screen
  surface: palette.gray800, // cards, inputs
  surface2: palette.gray700, // elevated cards
  surface3: palette.gray650, // avatars, chips

  // ── Brand / Primary ────────────────────────────
  primary: palette.red500,
  primaryDark: palette.red700,
  primaryLight: palette.red400,
  primaryBg: palette.redAlpha12,
  primaryBgSoft: palette.redAlpha8,

  // ── Text ───────────────────────────────────────
  textPrimary: palette.textPrimary,
  textSecondary: palette.gray300,
  textTertiary: palette.gray400,
  textDisabled: palette.gray500,
  textInverse: palette.white,

  // ── Borders ────────────────────────────────────
  border: palette.whiteAlpha7,
  borderStrong: palette.whiteAlpha12,
  borderActive: palette.red500,

  // ── Status ─────────────────────────────────────
  success: palette.green500,
  successBg: palette.greenAlpha12,
  successLight: palette.green400,

  warning: palette.amber500,
  warningBg: palette.amberAlpha12,
  warningLight: palette.amber400,

  info: palette.blue500,
  infoBg: palette.blueAlpha12,
  infoLight: palette.blue400,

  // ── Token / Card status colours ────────────────
  // Maps to TokenStatus enum in schema
  statusActive: palette.green500,
  statusActiveBg: palette.greenAlpha12,
  statusInactive: palette.amber500,
  statusInactiveBg: palette.amberAlpha12,
  statusPending: palette.blue500,
  statusPendingBg: palette.blueAlpha12,
  statusRevoked: palette.red500,
  statusRevokedBg: palette.redAlpha12,
  statusExpired: palette.gray400,
  statusExpiredBg: "rgba(85,92,112,0.12)",

  // ── Overlays ───────────────────────────────────
  overlay: palette.blackAlpha50,
  overlayLight: palette.blackAlpha30,
  overlayHeavy: palette.blackAlpha70,

  white: palette.white,
  black: palette.black,
  transparent: palette.transparent,

  // ── Raw palette exposed for gradients ──────────
  palette,
};

export default colors;
