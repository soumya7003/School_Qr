// src/store/biometricStore.js
import { create } from 'zustand';

export const useBiometricStore = create((set) => ({
  // Is the app currently locked (biometric gate showing)?
  isLocked: false,

  // Has the user turned on biometric app lock in settings?
  isBiometricEnabled: false,

  // ─────────────────────────────────────────────────────────────────────────
  // DEFAULT IS TRUE — we assume the device supports biometrics until proven
  // otherwise. This prevents the toggle from being permanently disabled on
  // devices where expo-local-authentication hasn't initialized yet.
  // The real check happens inside BiometricRow when the user taps the toggle.
  // ─────────────────────────────────────────────────────────────────────────
  isBiometricAvailable: true,

  setLocked: (val) => set({ isLocked: val }),
  setBiometricEnabled: (val) => set({ isBiometricEnabled: val }),
  setBiometricAvailable: (val) => set({ isBiometricAvailable: val }),

  reset: () =>
    set({
      isLocked: false,
      isBiometricEnabled: false,
      isBiometricAvailable: true, // reset to true, not false
    }),
}));