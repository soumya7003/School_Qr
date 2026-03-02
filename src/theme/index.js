// Theme Index

import colors from "./colors";
import radius from "./radius";
import shadows from "./shadows";
import spacing from "./spacing";
import typography, {
  fontFamilies,
  fontSizes,
  fontWeights,
  letterSpacings,
  lineHeights,
} from "./typography";

// named exports
export {
  colors,
  fontFamilies,
  fontSizes,
  fontWeights,
  letterSpacings,
  lineHeights,
  radius,
  shadows,
  spacing,
  typography,
};

// combined theme object
export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
};

export default theme;
