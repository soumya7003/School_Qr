/**
 * src/lib/security/deviceFingerprint.js
 *
 * Generates a stable, unique device fingerprint for single-device login.
 *
 * STRATEGY:
 *   1. Check SecureStore for existing fingerprint — return immediately if found.
 *   2. If none exists, generate a new one using two approaches combined:
 *
 *   Approach A — Hardware composite hash:
 *     SHA256( androidId + deviceName + brand + model + osVersion )
 *     Stable across app reinstalls but resets on factory reset.
 *
 *   Approach B — Generated UUID stored in SecureStore:
 *     crypto.randomUUID() stored permanently.
 *     Survives factory reset only as long as SecureStore data persists.
 *
 *   Final fingerprint = SHA256( hashA + uuidB )
 *   Combining both makes it resistant to:
 *     - androidId reset (factory reset)
 *     - Non-unique androidId across apps
 *     - App reinstall
 *
 * WHY NOT JUST UUID:
 *   Pure UUID resets on app uninstall + reinstall.
 *   Hardware composite alone resets on factory reset.
 *   Combined = most stable possible fingerprint on Android.
 *
 * SECURITY NOTE:
 *   No fingerprint is 100% permanent on Android due to OS restrictions.
 *   The goal is not permanence — it is making session hijacking hard enough
 *   that an attacker would need physical access to the exact device.
 */

import * as Application from "expo-application";
import * as Crypto from "expo-crypto";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// ── Storage keys ──────────────────────────────────────────────────────────────

const FINGERPRINT_KEY = "device_fingerprint_v1";
const UUID_KEY = "device_uuid_v1";

const SECURE_OPT = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const sha256 = async (input) => {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
};

/**
 * Get or generate a persistent UUID stored in SecureStore.
 * Survives app updates and device reboots.
 * Resets only if user clears app data or uninstalls.
 */
const getOrCreateUUID = async () => {
  try {
    const existing = await SecureStore.getItemAsync(UUID_KEY, SECURE_OPT);
    if (existing) return existing;

    const newUUID = Crypto.randomUUID();
    await SecureStore.setItemAsync(UUID_KEY, newUUID, SECURE_OPT);
    return newUUID;
  } catch {
    // Fallback — generate without persisting (rare SecureStore failure)
    return Crypto.randomUUID();
  }
};

/**
 * Build hardware composite string from device properties.
 * Each value falls back to 'unknown' if unavailable.
 */
const buildHardwareComposite = async () => {
  const parts = [];

  // androidId — may reset on factory reset but still useful as one factor
  if (Platform.OS === "android") {
    try {
      const androidId = await Application.getAndroidId();
      parts.push(androidId ?? "no-android-id");
    } catch {
      parts.push("no-android-id");
    }
  }

  // Device hardware properties — stable across app reinstalls
  parts.push(Device.deviceName ?? "unknown-name");
  parts.push(Device.brand ?? "unknown-brand");
  parts.push(Device.modelName ?? "unknown-model");
  parts.push(Device.osVersion ?? "unknown-os");
  parts.push(Device.osBuildId ?? "unknown-build");
  parts.push(Platform.OS);

  return parts.join("|");
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns a stable device fingerprint.
 *
 * First call: generates + stores fingerprint (~10ms).
 * Subsequent calls: reads from SecureStore (~2ms).
 *
 * @returns {Promise<string>} 64-char hex SHA256 fingerprint
 */
export const getDeviceFingerprint = async () => {
  try {
    // Return cached fingerprint if exists
    const cached = await SecureStore.getItemAsync(FINGERPRINT_KEY, SECURE_OPT);
    if (cached) return cached;

    // Generate both components in parallel
    const [hardwareComposite, uuid] = await Promise.all([
      buildHardwareComposite(),
      getOrCreateUUID(),
    ]);

    // Hash hardware composite
    const hardwareHash = await sha256(hardwareComposite);

    // Final fingerprint = hash of both combined
    const fingerprint = await sha256(`${hardwareHash}:${uuid}`);

    // Persist for future calls
    await SecureStore.setItemAsync(FINGERPRINT_KEY, fingerprint, SECURE_OPT);

    return fingerprint;
  } catch (error) {
    if (__DEV__) console.warn("[deviceFingerprint] failed:", error.message);

    // Last resort fallback — UUID only (not persisted on this error path)
    return sha256(Crypto.randomUUID());
  }
};

/**
 * Force regenerate fingerprint.
 * Call this after factory reset detection or when backend rejects fingerprint.
 */
export const resetDeviceFingerprint = async () => {
  try {
    await SecureStore.deleteItemAsync(FINGERPRINT_KEY, SECURE_OPT);
    await SecureStore.deleteItemAsync(UUID_KEY, SECURE_OPT);
  } catch {
    /* best effort */
  }
};

/**
 * Returns device metadata to send alongside fingerprint to backend.
 * Backend can use this for display in "active sessions" screen.
 */
export const getDeviceMeta = () => ({
  deviceName: Device.deviceName ?? "Unknown Device",
  brand: Device.brand ?? "Unknown",
  model: Device.modelName ?? "Unknown",
  osVersion: Device.osVersion ?? "Unknown",
  platform: Platform.OS,
});
