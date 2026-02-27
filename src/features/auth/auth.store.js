/**
 * Auth Store — UI state only, no API calls.
 * Simulates a logged-in parent with mock data.
 */

import { mockParent } from "@/src/mock/mockData";
import { create } from "zustand";

export const useAuthStore = create((set) => ({
  // ── State ──────────────────────────────────────
  isAuthenticated: true, // set true to skip login during UI dev
  parentUser: mockParent,
  accessToken: "mock-token-xyz",
  isLoading: false,

  // ── Actions ────────────────────────────────────
  setAuthenticated: (val) => set({ isAuthenticated: val }),

  setParentUser: (user) => set({ parentUser: user }),

  logout: () =>
    set({
      isAuthenticated: false,
      parentUser: null,
      accessToken: null,
    }),

  // Mock login — used on OTP screen "Verify" press
  mockLogin: () =>
    set({
      isAuthenticated: true,
      parentUser: mockParent,
      accessToken: "mock-token-xyz",
    }),
}));

export default useAuthStore;
