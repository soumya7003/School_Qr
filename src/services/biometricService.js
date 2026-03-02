import { useBiometricStore } from "@/store/biometricStore";
import { Platform } from "react-native";

let LocalAuthentication = null;

// load native module only on mobile
if (Platform.OS !== "web") {
  LocalAuthentication = require("expo-local-authentication");
}

// ── Check device capability ─────────────────────────
export async function checkDeviceBiometrics() {
  if (!LocalAuthentication) return false;

  const { setDeviceSupported, setBiometricType } = useBiometricStore.getState();

  const isHardwareAvailable = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  const isSupported = isHardwareAvailable && isEnrolled;

  setDeviceSupported(isSupported);

  if (isSupported) {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    const typeMap = {
      [LocalAuthentication.AuthenticationType.FINGERPRINT]: "fingerprint",
      [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION]: "face",
      [LocalAuthentication.AuthenticationType.IRIS]: "iris",
    };

    const best = types.includes(2) ? 2 : types.includes(1) ? 1 : types[0];
    setBiometricType(typeMap[best] ?? "fingerprint");
  }

  return isSupported;
}

// ── Prompt biometric ─────────────────────────
export async function promptBiometric({
  reason = "Verify your identity to continue",
  fallbackLabel = "Use Device PIN",
} = {}) {
  if (!LocalAuthentication) {
    return { success: false, error: "not_available_on_web" };
  }

  return await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    fallbackLabel,
    disableDeviceFallback: false,
    cancelLabel: "Cancel",
  });
}

// ── Enable biometric ─────────────────────────
export async function enableBiometric() {
  const supported = await checkDeviceBiometrics();
  if (!supported) return { ok: false, reason: "not_supported" };

  const result = await promptBiometric({
    reason: "Confirm to enable biometric lock",
  });

  if (!result.success) return { ok: false, reason: result.error };

  useBiometricStore.getState().setEnabled(true);
  return { ok: true };
}

// ── Disable biometric ─────────────────────────
export async function disableBiometric() {
  const result = await promptBiometric({
    reason: "Confirm to disable biometric lock",
  });

  if (!result.success) return { ok: false, reason: result.error };

  useBiometricStore.getState().setEnabled(false);
  return { ok: true };
}
