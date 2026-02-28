/**
 * School QR — Theme Index
 *
 * Single import for all theme tokens.
 * Usage:
 *   import { theme } from '@/theme'
 *   import { colors } from '@/theme'  // or named
 */

// ── Combined theme object ─────────────────────────────────────────────────────
import colors from "./colors";
import radius from "./radius";
import shadows from "./shadows";
import spacing from "./spacing";
import typography from "./typography";

export { default as colors } from "./colors";
export { default as radius } from "./radius";
export { default as shadows } from "./shadows";
export { default as spacing } from "./spacing";
export { default as typography } from "./typography";

export {
  fontFamilies,
  fontSizes,
  fontWeights,
  letterSpacings,
  lineHeights,
} from "./typography";

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
};

export default theme;
