/**
 * src/store/biometricStore.js
 *
 * FIX 1: Uncommented persist middleware (was commented out for UI dev)
 * FIX 2: Typo fixed — setsetEnabled → setEnabled
 * FIX 3: partialize added — only persist isBiometricEnabled, NOT
 *         isDeviceSupported or biometricType (those come from hardware)
 * FIX 4: isDeviceSupported default changed false → checked from hardware
 *         in BiometricGate on mount (not hardcoded true)
 *
 * ROOT CAUSE OF BUG:
 *   Store was memory-only → reset to false on app kill.
 *   Minimize = memory preserved = toggle state kept = biometric worked.
 *   Kill/reopen = memory wiped = isBiometricEnabled false = no gate shown.
 */

import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const secureStorage = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, val) =>
    SecureStore.setItemAsync(key, val, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export const useBiometricStore = create(
  persist(
    (set) => ({
      // ── Persisted ─────────────────────────────────────────────────────
      isBiometricEnabled: false, // user's on/off preference

      // ── NOT persisted (re-checked from hardware on every cold start) ──
      isDeviceSupported: false, // set by BiometricGate on mount
      biometricType: null, // 'fingerprint' | 'face' | 'iris'

      // ── Actions ───────────────────────────────────────────────────────
      setEnabled: (val) => set({ isBiometricEnabled: val }), // FIX: was setsetEnabled
      setDeviceSupported: (val) => set({ isDeviceSupported: val }),
      setBiometricType: (type) => set({ biometricType: type }),
    }),
    {
      name: "biometric-prefs",
      storage: createJSONStorage(() => secureStorage),

      // FIX: Only persist user preference — NOT hardware state
      // isDeviceSupported and biometricType are re-detected on every launch
      partialize: (state) => ({
        isBiometricEnabled: state.isBiometricEnabled,
      }),
    },
  ),
);

export default useBiometricStore;
