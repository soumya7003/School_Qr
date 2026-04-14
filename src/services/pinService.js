// src/services/pinService.js
/**
 * PIN Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles all PIN cryptography and secure storage.
 *
 * Security model:
 *  - PIN is NEVER stored in plaintext.
 *  - A random salt is generated per device on first PIN save.
 *  - SHA-256(salt + pin + APP_PEPPER) is stored in expo-secure-store.
 *  - expo-secure-store uses the device keychain (iOS) / keystore (Android),
 *    so the data is hardware-protected and not accessible to other apps.
 *
 * Fallback:
 *  - If expo-secure-store is unavailable (rare emulator edge cases),
 *    we throw clearly so the UI can warn the user.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

// ── Storage keys ──────────────────────────────────────────────────────────────
const KEY_PIN_HASH = 'resqid_app_pin_hash';
const KEY_PIN_SALT = 'resqid_app_pin_salt';

// App-level pepper — adds a second factor to the hash even if salt leaks.
// This is a build-time constant, not user data.
const APP_PEPPER = 'resqid_coreZ_2025_lock';

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Generates a cryptographically random-enough salt string.
 * expo-crypto doesn't expose getRandomBytes easily outside of randomUUID,
 * so we combine two sources of entropy.
 */
const generateSalt = () => {
  const uuid = Crypto.randomUUID(); // expo-crypto v13+
  return `${uuid}-${Date.now().toString(36)}`;
};

/**
 * Hashes a PIN with a given salt.
 * @param {string} pin   - 4-digit string
 * @param {string} salt  - per-device random salt
 * @returns {Promise<string>} hex digest
 */
const hashPin = async (pin, salt) => {
  const input = `${salt}::${pin}::${APP_PEPPER}`;
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    input,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Saves a new PIN. Overwrites any existing PIN.
 * Generates a fresh salt every time.
 */
export const savePin = async (pin) => {
  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    throw new Error('PIN must be exactly 4 digits.');
  }
  const salt = generateSalt();
  const hash = await hashPin(pin, salt);
  await SecureStore.setItemAsync(KEY_PIN_SALT, salt);
  await SecureStore.setItemAsync(KEY_PIN_HASH, hash);
};

/**
 * Verifies a candidate PIN against the stored hash.
 * @returns {Promise<boolean>}
 */
export const verifyPin = async (pin) => {
  if (!pin || pin.length !== 4) return false;
  try {
    const salt = await SecureStore.getItemAsync(KEY_PIN_SALT);
    const storedHash = await SecureStore.getItemAsync(KEY_PIN_HASH);
    if (!salt || !storedHash) return false;
    const hash = await hashPin(pin, salt);
    return hash === storedHash;
  } catch {
    return false;
  }
};

/**
 * Returns true if a PIN has been saved on this device.
 * @returns {Promise<boolean>}
 */
export const hasPin = async () => {
  try {
    const hash = await SecureStore.getItemAsync(KEY_PIN_HASH);
    return !!hash;
  } catch {
    return false;
  }
};

/**
 * Deletes the stored PIN and salt (used on logout or PIN reset).
 */
export const clearPin = async () => {
  await SecureStore.deleteItemAsync(KEY_PIN_HASH);
  await SecureStore.deleteItemAsync(KEY_PIN_SALT);
};