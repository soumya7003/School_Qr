/**
 * School QR — Typography Tokens
 * Fonts: Sora (headings/brand) · DM Sans (body/UI)
 *
 * Install: expo install @expo-google-fonts/sora @expo-google-fonts/dm-sans expo-font
 */

export const fontFamilies = {
  // Display / Headings
  soraBlack: "Sora_800ExtraBold",
  soraBold: "Sora_700Bold",
  soraSemiBold: "Sora_600SemiBold",
  soraMedium: "Sora_500Medium",
  soraRegular: "Sora_400Regular",
  soraLight: "Sora_300Light",

  // Body / UI
  sansBold: "DMSans_700Bold",
  sansMedium: "DMSans_500Medium",
  sansRegular: "DMSans_400Regular",
  sansLight: "DMSans_300Light",
  sansItalic: "DMSans_400Regular_Italic",
};

/**
 * Font size scale (in sp — React Native uses dp/sp interchangeably)
 */
export const fontSizes = {
  xs: 10,
  sm: 11,
  base: 12,
  md: 13,
  lg: 14,
  xl: 15,
  "2xl": 16,
  "3xl": 17,
  "4xl": 18,
  "5xl": 20,
  "6xl": 22,
  "7xl": 24,
  "8xl": 26,
  "9xl": 28,
  "10xl": 30,
  display: 36,
};

export const lineHeights = {
  tight: 1.1,
  snug: 1.2,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
};

export const letterSpacings = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.5,
  wider: 1.0,
  widest: 2.5,
};

export const fontWeights = {
  light: "300",
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extrabold: "800",
};

/**
 * Pre-composed text style presets.
 * Usage: <Text style={typography.h1}>...</Text>
 */
export const typography = {
  // ── Display ──────────────────────────────────
  displayXL: {
    fontFamily: fontFamilies.soraBlack,
    fontSize: fontSizes.display,
    lineHeight: fontSizes.display * lineHeights.tight,
    letterSpacing: letterSpacings.tight,
  },

  // ── Headings ─────────────────────────────────
  h1: {
    fontFamily: fontFamilies.soraBold,
    fontSize: fontSizes["10xl"],
    lineHeight: fontSizes["10xl"] * lineHeights.snug,
  },
  h2: {
    fontFamily: fontFamilies.soraBold,
    fontSize: fontSizes["8xl"],
    lineHeight: fontSizes["8xl"] * lineHeights.snug,
  },
  h3: {
    fontFamily: fontFamilies.soraSemiBold,
    fontSize: fontSizes["6xl"],
    lineHeight: fontSizes["6xl"] * lineHeights.normal,
  },
  h4: {
    fontFamily: fontFamilies.soraSemiBold,
    fontSize: fontSizes["4xl"],
    lineHeight: fontSizes["4xl"] * lineHeights.normal,
  },
  h5: {
    fontFamily: fontFamilies.soraMedium,
    fontSize: fontSizes["2xl"],
    lineHeight: fontSizes["2xl"] * lineHeights.normal,
  },

  // ── Body ─────────────────────────────────────
  bodyLg: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.relaxed,
  },
  bodyMd: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.relaxed,
  },
  bodySm: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.relaxed,
  },
  bodyXs: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.relaxed,
  },

  // ── Labels / UI ──────────────────────────────
  labelLg: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.normal,
    letterSpacing: letterSpacings.normal,
  },
  labelMd: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
  },
  labelSm: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
    letterSpacing: letterSpacings.wide,
  },
  labelXs: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    letterSpacing: letterSpacings.wider,
  },

  // ── Overlines / Caps ─────────────────────────
  overline: {
    fontFamily: fontFamilies.soraBold,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.widest,
    textTransform: "uppercase",
  },

  // ── Button text ──────────────────────────────
  btnLg: {
    fontFamily: fontFamilies.soraSemiBold,
    fontSize: fontSizes.xl,
    letterSpacing: letterSpacings.normal,
  },
  btnMd: {
    fontFamily: fontFamilies.soraSemiBold,
    fontSize: fontSizes.lg,
  },
  btnSm: {
    fontFamily: fontFamilies.soraSemiBold,
    fontSize: fontSizes.md,
  },

  // ── Mono / code ──────────────────────────────
  mono: {
    fontFamily: "System",
    fontSize: fontSizes.md,
    letterSpacing: letterSpacings.wide,
  },
};

export default typography;
