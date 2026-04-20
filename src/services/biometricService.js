// src/services/biometricService.js
import * as LocalAuthentication from "expo-local-authentication";

/**
 * Check if the device has biometric hardware AND has enrolled biometrics.
 * Logs each step so you can see exactly why it returns false.
 * @returns {Promise<boolean>}
 */
export async function isBiometricAvailable() {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    console.log("[Biometric] hasHardware:", hasHardware);

    if (!hasHardware) {
      console.warn("[Biometric] No biometric hardware detected.");
      return false;
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    console.log("[Biometric] isEnrolled:", isEnrolled);

    if (!isEnrolled) {
      console.warn("[Biometric] Hardware found but no biometrics enrolled.");
      return false;
    }

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    console.log("[Biometric] supportedTypes:", types);

    return true;
  } catch (error) {
    console.error("[Biometric] isBiometricAvailable error:", error);
    return false;
  }
}

/**
 * Get supported biometric type label for UI display.
 * ✅ FIX: Added IRIS_SCAN support
 * @returns {Promise<'fingerprint' | 'face' | 'iris' | 'biometric'>}
 */
export async function getBiometricLabel() {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    // Order of preference: face > fingerprint > iris > generic
    if (
      types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
    ) {
      return "face";
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return "fingerprint";
    }
    // ✅ FIX: Add IRIS_SCAN support for Android devices with iris scanner
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS_SCAN)) {
      return "iris";
    }
    return "biometric";
  } catch {
    return "biometric";
  }
}

/**
 * Trigger biometric authentication.
 * @param {object} options
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function authenticate({
  promptMessage = "Scan to unlock the app",
  cancelLabel = "Cancel",
  disableDeviceFallback = false,
} = {}) {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel,
      disableDeviceFallback,
      fallbackLabel: "Use Passcode",
    });

    console.log("[Biometric] authenticate result:", result);

    if (result.success) {
      return { success: true };
    }
    return { success: false, error: result.error || "cancelled" };
  } catch (error) {
    console.error("[Biometric] authenticate error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Used specifically for app-resume unlock.
 * @returns {Promise<boolean>}
 */
export async function authenticateForAppResume() {
  const result = await authenticate({
    promptMessage: "Scan to unlock the app",
    cancelLabel: "Cancel",
    disableDeviceFallback: false,
  });
  return result.success;
}
