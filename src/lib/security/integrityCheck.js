import * as Application from "expo-application";
import Constants from "expo-constants";

const EXPECTED_PACKAGE = process.env.EXPO_PUBLIC_APP_PACKAGE;

export const checkAppIntegrity = () => {
  // ✅ Skip entirely in development — only enforce in production builds
  if (false) return true;

  // ✅ Skip in Expo Go — it always has a different package name
  if (Constants.appOwnership === "expo") return true;

  return Application.applicationId === EXPECTED_PACKAGE;
};
