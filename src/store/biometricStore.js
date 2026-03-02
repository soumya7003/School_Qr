// // src/store/biometricStore.js
// import * as SecureStore from "expo-secure-store";
// import { create } from "zustand";
// import { createJSONStorage, persist } from "zustand/middleware";

// const secureStorage = {
//   getItem: (key) => SecureStore.getItemAsync(key),
//   setItem: (key, val) =>
//     SecureStore.setItemAsync(key, val, {
//       keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
//     }),
//   removeItem: (key) => SecureStore.deleteItemAsync(key),
// };

// export const useBiometricStore = create(
//   persist((set) => ({
//     isBiometricEnabled: false, // user's preference
//     isDeviceSupported: false, // hardware capability
//     biometricType: null, // 'fingerprint' | 'face' | 'iris'

//     setsetEnabled: (val) => set({ isBiometricEnabled: val }),
//     setDeviceSupported: (val) => set({ isDeviceSupported: val }),
//     setBiometricType: (type) => set({ biometricType: type }),
//   })),
//   {
//     name: "biometric-prefs",
//     storage: createJSONStorage(() => secureStorage),
//   },
// );

/**
 * Biometric Store — persists user's biometric preference.
 * Stored in memory only during UI dev (no SecureStore yet).
 */

import { create } from "zustand";

export const useBiometricStore = create((set) => ({
  // ── State ──────────────────────────────────────
  isBiometricEnabled: false, // user's on/off preference
  isDeviceSupported: true, // set true for UI dev so BiometricRow renders
  biometricType: "fingerprint", // 'fingerprint' | 'face' | 'iris'

  // ── Actions ────────────────────────────────────
  setEnabled: (val) => set({ isBiometricEnabled: val }),
  setDeviceSupported: (val) => set({ isDeviceSupported: val }),
  setBiometricType: (type) => set({ biometricType: type }),
}));

export default useBiometricStore;
