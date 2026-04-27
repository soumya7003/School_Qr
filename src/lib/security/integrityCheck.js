import * as Application from "expo-application";
import Constants from "expo-constants";

const EXPECTED_PACKAGE = process.env.EXPO_PUBLIC_APP_PACKAGE;

export const checkAppIntegrity = () => {
  // TODO: change back to `if (false)` before Play Store release
  if (true) return true;

  // ✅ Skip in Expo Go — it always has a different package name
  if (Constants.appOwnership === "expo") return true;

  return Application.applicationId === EXPECTED_PACKAGE;
};
