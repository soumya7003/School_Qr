/**
 * School QR — Spacing Tokens
 *
 * Base unit: 4px
 * Usage: spacing[4] = 16, spacing[6] = 24, etc.
 *
 * Named aliases make intent clear in components.
 */

export const spacing = {
  // ── Numeric scale (multiples of 4) ────────────
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,

  // ── Named aliases ─────────────────────────────
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16, // default component padding
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  "4xl": 48,
  "5xl": 64,
  "6xl": 80,

  // ── Semantic ──────────────────────────────────
  screenH: 20, // horizontal screen padding
  screenV: 24, // vertical screen padding (top/bottom)
  cardPad: 16, // default card inner padding
  cardPadSm: 12, // compact card padding
  sectionGap: 24, // gap between major sections
  itemGap: 10, // gap between list items
  inputHeight: 50, // standard input height
  btnHeight: 54, // standard button height
  btnHeightSm: 42, // small button
  tabBarH: 72, // total tab bar height including safe area
  navBarH: 56, // top nav bar height
};

export default spacing;
