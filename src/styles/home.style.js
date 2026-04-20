// src/styles/home.style.js
import { Platform, StyleSheet } from "react-native";

export const homeStyles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 12 : 20,
    paddingBottom: 40,
    gap: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  subGreeting: {
    fontSize: 13,
    marginTop: 4,
  },
  safetyTip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  safetyText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
});
