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
 *
 * WHY NOT JUST UUID:
 *   Pure UUID resets on app uninstall + reinstall.
 *   Hardware composite alone resets on factory reset.
 *   Combined = most stable possible fingerprint.
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

const getOrCreateUUID = async () => {
  try {
    const existing = await SecureStore.getItemAsync(UUID_KEY, SECURE_OPT);
    if (existing) return existing;

    const newUUID = Crypto.randomUUID();
    await SecureStore.setItemAsync(UUID_KEY, newUUID, SECURE_OPT);
    return newUUID;
  } catch {
    return Crypto.randomUUID();
  }
};

const buildHardwareComposite = async () => {
  const parts = [];

  // ✅ FIX: iOS has no getAndroidId() – handle gracefully
  if (Platform.OS === "android") {
    try {
      const androidId = await Application.getAndroidId();
      parts.push(androidId ?? "no-android-id");
    } catch {
      parts.push("no-android-id");
    }
  } else {
    // iOS: use identifierForVendor instead
    try {
      const iosId = await Application.getIosIdForVendorAsync();
      parts.push(iosId ?? "no-ios-id");
    } catch {
      parts.push("no-ios-id");
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

export const getDeviceFingerprint = async () => {
  try {
    const cached = await SecureStore.getItemAsync(FINGERPRINT_KEY, SECURE_OPT);
    if (cached) return cached;

    const [hardwareComposite, uuid] = await Promise.all([
      buildHardwareComposite(),
      getOrCreateUUID(),
    ]);

    const hardwareHash = await sha256(hardwareComposite);
    const fingerprint = await sha256(`${hardwareHash}:${uuid}`);

    await SecureStore.setItemAsync(FINGERPRINT_KEY, fingerprint, SECURE_OPT);

    return fingerprint;
  } catch (error) {
    if (__DEV__) console.warn("[deviceFingerprint] failed:", error.message);
    return sha256(Crypto.randomUUID());
  }
};

export const resetDeviceFingerprint = async () => {
  try {
    await SecureStore.deleteItemAsync(FINGERPRINT_KEY, SECURE_OPT);
    await SecureStore.deleteItemAsync(UUID_KEY, SECURE_OPT);
  } catch {
    /* best effort */
  }
};

export const getDeviceMeta = () => ({
  deviceName: Device.deviceName ?? "Unknown Device",
  brand: Device.brand ?? "Unknown",
  model: Device.modelName ?? "Unknown",
  osVersion: Device.osVersion ?? "Unknown",
  platform: Platform.OS,
});
