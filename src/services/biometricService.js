import { useBiometricStore } from "@/src/store/biometricStore";
import * as LocalAuthentication from "expo-local-authentication";

// check what the device supports
export async function checkDeviceBiometrics() {
  const { setDeviceSupported, setBiometricType } = useBiometricStore.getState();

  const isHardwareAvailable = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  const isSupported = isHardwareAvailable && isEnrolled;

  setDeviceSupported(isSupported);

  if (isSupported) {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    //   types is array of numbers
    const typeMap = {
      [LocalAuthentication.AuthenticationType.FINGERPRINT]: "fingerprint",
      [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION]: "face",
      [LocalAuthentication.AuthenticationType.IRIS]: "iris",
    };

    // Pick the strongest available
    const best = types.includes(2) ? 2 : types.includes(1) ? 1 : types[0];
    setBiometricType(typeMap[best] ?? "fingerprint");
  }

  return isSupported;
}

// ── Prompt the biometric / device lock dialog ─────────────────────────────
export async function promptBiometric({
  reason = "Verify your identity to continue",
  fallbackLabel = "Use Device PIN",
} = {}) {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    fallbackLabel: fallbackLabel,
    disableDeviceFallback: false, // allows PIN/pattern if biometric fails
    cancelLabel: "Cancel",
  });

  return result; // { success: boolean, error?: string, warning?: string }
}

// ── Enable biometric for this user (call after login) ────────────────────
export async function enableBiometric() {
  const supported = await checkDeviceBiometrics();
  if (!supported) return { ok: false, reason: "not_supported" };

  // Do one auth to confirm before enabling
  const result = await promptBiometric({
    reason: "Confirm to enable biometric lock",
  });
  if (!result.success) return { ok: false, reason: result.error };

  useBiometricStore.getState().setEnabled(true);
  return { ok: true };
}

// ── Disable biometric (call from settings) ────────────────────────────────
export async function disableBiometric() {
  // Auth once before disabling — so someone can't just turn it off
  const result = await promptBiometric({
    reason: "Confirm to disable biometric lock",
  });
  if (!result.success) return { ok: false, reason: result.error };

  useBiometricStore.getState().setEnabled(false);
  return { ok: true };
}
