// src/store/biometricStore.js
import { create } from 'zustand';

export const useBiometricStore = create((set) => ({
  // ── CRITICAL: always false on startup ──
  // App should NEVER start in a locked state.
  // Lock only triggers when app returns FROM background.
  isLocked: false,

  // Has the user enabled biometric lock in settings?
  isBiometricEnabled: false,

  // Has the app fully mounted and the navigator is ready?
  // Lock will NOT trigger until this is true.
  isAppReady: false,

  setLocked: (val) => set({ isLocked: val }),
  setBiometricEnabled: (val) => set({ isBiometricEnabled: val }),
  setAppReady: (val) => set({ isAppReady: val }),

  reset: () =>
    set({
      isLocked: false,
      isBiometricEnabled: false,
      isAppReady: false,
    }),
}));