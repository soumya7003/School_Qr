// src/store/biometricStore.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useBiometricStore = create(
  persist(
    (set) => ({
      // ── CRITICAL: always false on startup ──
      // App should NEVER start in a locked state.
      // Lock only triggers when app returns FROM background.
      isLocked: false,

      // Has the user enabled biometric lock in settings?
      isBiometricEnabled: false,

      // Has the user enabled PIN lock? (used when biometrics unavailable)
      isPinEnabled: false,

      // Has the user completed PIN setup? (distinguishes "enabled but not set up yet")
      hasPinSetup: false,

      // Has the app fully mounted and the navigator is ready?
      // Lock will NOT trigger until this is true.
      isAppReady: false,

      // Suppresses lock during intentional background trips
      // e.g. image picker, camera, settings deep-link
      suppressLock: false,

      // ── Setters ──
      setLocked: (val) => set({ isLocked: val }),
      setBiometricEnabled: (val) => set({ isBiometricEnabled: val }),
      setPinEnabled: (val) => set({ isPinEnabled: val }),
      setHasPinSetup: (val) => set({ hasPinSetup: val }),
      setAppReady: (val) => set({ isAppReady: val }),
      setSuppressLock: (val) => set({ suppressLock: val }),

      // ── Derived helper ──
      // Returns true if ANY lock method is active.
      // Use this in useInactivityLock instead of checking each separately.
      // (Zustand getters aren't reactive outside components — use this in
      //  the hook by reading both fields directly from the store.)

      reset: () =>
        set({
          isLocked: false,
          isBiometricEnabled: false,
          isPinEnabled: false,
          hasPinSetup: false,
          isAppReady: false,
          suppressLock: false,
        }),
    }),
    {
      name: "biometric-store",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user preferences, not runtime state
      partialize: (state) => ({
        isBiometricEnabled: state.isBiometricEnabled,
        isPinEnabled: state.isPinEnabled,
        hasPinSetup: state.hasPinSetup,
      }),
    },
  ),
);