import { useThemeColor } from "@/hooks/useThemeColor";
import { View } from "react-native";

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background"
  );

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}