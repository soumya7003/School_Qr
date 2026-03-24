/**
 * theme/tokens.js  —  RESQID Design Tokens
 *
 * PRIMARY BRAND COLOR: Orange (#F97316 dark / #EA6C0A light)
 * Red is ONLY used for danger/destructive actions.
 *
 * Import: import { darkT, lightT } from '@/theme/tokens';
 * Usage:  const { colors: C } = useTheme();  →  C.primary, C.bg, C.tx …
 */

export const darkT = {
  // ── Surfaces (bg = darkest, s5 = lightest) ─────
  bg: "#09090E", // outermost page
  s1: "#0E0E15", // screen background
  s2: "#13131B", // card / input
  s3: "#191921", // elevated card
  s4: "#202029", // chip / avatar / pressed
  s5: "#28282F", // toggle track

  // ── Borders ────────────────────────────────────
  bd: "rgba(255,255,255,0.07)",
  bd2: "rgba(255,255,255,0.13)",

  // ── Text ───────────────────────────────────────
  tx: "#F2F2F7",
  tx2: "rgba(242,242,247,0.62)",
  tx3: "rgba(242,242,247,0.34)",

  // ── Brand: Orange ──────────────────────────────
  primary: "#F97316",
  primaryBg: "rgba(249,115,22,0.10)",
  primaryBd: "rgba(249,115,22,0.28)",

  // ── Danger: Red (destructive only) ─────────────
  red: "#EF4444",
  redBg: "rgba(239,68,68,0.10)",
  redBd: "rgba(239,68,68,0.28)",

  // ── Success: Green ─────────────────────────────
  ok: "#22C55E",
  okBg: "rgba(34,197,94,0.10)",
  okBd: "rgba(34,197,94,0.26)",

  // ── Warning: Amber ─────────────────────────────
  amb: "#FBBF24",
  ambBg: "rgba(251,191,36,0.10)",
  ambBd: "rgba(251,191,36,0.26)",

  // ── Info: Blue ─────────────────────────────────
  blue: "#60A5FA",
  blueBg: "rgba(96,165,250,0.10)",
  blueBd: "rgba(96,165,250,0.26)",

  // ── Security: Purple ───────────────────────────
  purp: "#A78BFA",
  purpBg: "rgba(167,139,250,0.10)",
  purpBd: "rgba(167,139,250,0.26)",

  // ── Absolute ───────────────────────────────────
  white: "#FFFFFF",
  black: "#000000",
};

export const lightT = {
  // ── Surfaces ───────────────────────────────────
  bg: "#F3F3F8",
  s1: "#FFFFFF",
  s2: "#FFFFFF",
  s3: "#F8F8FC",
  s4: "#EFEFF5",
  s5: "#E6E6EE",

  // ── Borders ────────────────────────────────────
  bd: "rgba(0,0,0,0.07)",
  bd2: "rgba(0,0,0,0.13)",

  // ── Text ───────────────────────────────────────
  tx: "#0C0C14",
  tx2: "rgba(12,12,20,0.60)",
  tx3: "rgba(12,12,20,0.38)",

  // ── Brand: Orange ──────────────────────────────
  primary: "#EA6C0A",
  primaryBg: "rgba(234,108,10,0.08)",
  primaryBd: "rgba(234,108,10,0.24)",

  // ── Danger: Red ────────────────────────────────
  red: "#DC2626",
  redBg: "rgba(220,38,38,0.07)",
  redBd: "rgba(220,38,38,0.22)",

  // ── Success: Green ─────────────────────────────
  ok: "#16A34A",
  okBg: "rgba(22,163,74,0.07)",
  okBd: "rgba(22,163,74,0.22)",

  // ── Warning: Amber ─────────────────────────────
  amb: "#D97706",
  ambBg: "rgba(217,119,6,0.07)",
  ambBd: "rgba(217,119,6,0.22)",

  // ── Info: Blue ─────────────────────────────────
  blue: "#3B82F6",
  blueBg: "rgba(59,130,246,0.07)",
  blueBd: "rgba(59,130,246,0.22)",

  // ── Security: Purple ───────────────────────────
  purp: "#7C3AED",
  purpBg: "rgba(124,58,237,0.07)",
  purpBd: "rgba(124,58,237,0.22)",

  // ── Absolute ───────────────────────────────────
  white: "#FFFFFF",
  black: "#000000",
};
