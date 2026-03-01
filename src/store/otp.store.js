import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  LOCKOUT_MS,
  MAX_ATTEMPTS,
  OTP_ACTIONS,
  OTP_TTL_MS,
} from "../constants/constants";

// initial state
const initialState = {
  action: null,
  payload: null,
  status: "idle", // "idle" | "pending" | "verifying" | "success" | "error"
  error: null,
  attemptCount: 0,
  lastAttemptAt: null,
  expiresAt: null,
};

export const useOtpStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      startOtpFlow: (action, payload = {}) => {
        if (!Object.values(OTP_ACTIONS).includes(action)) {
          console.warn(`[OtpStore] Unknown action: "${action}"`);
        }
        set({
          action,
          payload,
          status: "pending",
          error: null,
          attemptCount: 0,
          lastAttemptAt: null,
          expiresAt: Date.now() + OTP_TTL_MS,
        });
      },

      setStatus: (status, error = null) => {
        set({ status, error });
      },

      recordAttempt: () => {
        set((state) => {
          const next = state.attemptCount + 1;
          return {
            attemptCount: next,
            lastAttemptAt: Date.now(),
            status: next >= MAX_ATTEMPTS ? "error" : state.status,
            error:
              next >= MAX_ATTEMPTS
                ? "Too many attempts. Please try again later."
                : state.error,
          };
        });
      },

      clearOtpFlow: () => set(initialState),

      // ── Derived selectors ──
      isExpired: () => {
        const { expiresAt } = get();
        return expiresAt !== null && Date.now() > expiresAt;
      },

      isLocked: () => {
        const { attemptCount, lastAttemptAt } = get();
        if (attemptCount < MAX_ATTEMPTS || !lastAttemptAt) return false;
        return Date.now() - lastAttemptAt < LOCKOUT_MS;
      },

      canRetry: () => {
        const { isExpired, isLocked } = get();
        return !isExpired() && !isLocked();
      },
    }),
    {
      name: "otp-store",
      storage: createJSONStorage(() => AsyncStorage),

      partialize: (state) => ({
        action: state.action,
        payload: state.payload,
        attemptCount: state.attemptCount,
        lastAttemptAt: state.lastAttemptAt,
        expiresAt: state.expiresAt,
      }),

      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.expiresAt && Date.now() > state.expiresAt) {
          state.clearOtpFlow();
        }
      },
    },
  ),
);
