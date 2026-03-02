import { useBiometricStore } from "@/store/biometricStore";
import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

/**
 * ─────────────────────────────────────────────
 * Check device biometric capability
 * ─────────────────────────────────────────────
 */
export async function checkDeviceBiometrics() {
  if (isWeb) return false;

  try {
    const { setDeviceSupported, setBiometricType } =
      useBiometricStore.getState();

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const isSupported = hasHardware && isEnrolled;

    setDeviceSupported(isSupported);

    if (isSupported) {
      const types =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      const { AuthenticationType } = LocalAuthentication;

      const typeMap = {
        [AuthenticationType.FINGERPRINT]: "fingerprint",
        [AuthenticationType.FACIAL_RECOGNITION]: "face",
        [AuthenticationType.IRIS]: "iris",
      };

      const best = types.includes(AuthenticationType.FINGERPRINT)
        ? AuthenticationType.FINGERPRINT
        : types.includes(AuthenticationType.FACIAL_RECOGNITION)
          ? AuthenticationType.FACIAL_RECOGNITION
          : types[0];

      setBiometricType(typeMap[best] || "fingerprint");
    }

    return isSupported;
  } catch (error) {
    console.warn("Biometric capability check failed:", error);
    return false;
  }
}

/**
 * ─────────────────────────────────────────────
 * Prompt biometric authentication
 * ─────────────────────────────────────────────
 */
export async function promptBiometric({
  reason = "Verify your identity to continue",
  fallbackLabel = "Use Device PIN",
} = {}) {
  if (isWeb) {
    return { success: false, error: "not_available_on_web" };
  }

  try {
    return await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel,
      disableDeviceFallback: false,
      cancelLabel: "Cancel",
    });
  } catch (error) {
    console.warn("Biometric prompt failed:", error);
    return { success: false, error: "auth_error" };
  }
}

/**
 * ─────────────────────────────────────────────
 * Enable biometric lock
 * ─────────────────────────────────────────────
 */
export async function enableBiometric() {
  const supported = await checkDeviceBiometrics();
  if (!supported) return { ok: false, reason: "not_supported" };

  const result = await promptBiometric({
    reason: "Confirm to enable biometric lock",
  });

  if (!result.success) {
    return { ok: false, reason: result.error || "auth_failed" };
  }

  useBiometricStore.getState().setEnabled(true);
  return { ok: true };
}

/**
 * ─────────────────────────────────────────────
 * Disable biometric lock
 * ─────────────────────────────────────────────
 */
export async function disableBiometric() {
  const result = await promptBiometric({
    reason: "Confirm to disable biometric lock",
  });

  if (!result.success) {
    return { ok: false, reason: result.error || "auth_failed" };
  }

  useBiometricStore.getState().setEnabled(false);
  return { ok: true };
}
