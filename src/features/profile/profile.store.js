/**
 * Profile Store — UI state only, no API calls.
 * Holds student, emergency profile, contacts, token.
 */

import {
  mockContacts,
  mockEmergencyProfile,
  mockStudent,
  mockSubscription,
  mockToken,
} from "@/src/mock/mockData";
import { create } from "zustand";

export const useProfileStore = create((set, get) => ({
  // ── State ──────────────────────────────────────
  student: mockStudent,
  emergencyProfile: mockEmergencyProfile,
  contacts: mockContacts,
  token: mockToken,
  subscription: mockSubscription,
  isLoading: false,
  error: null,

  // ── Profile completeness ───────────────────────
  // Mirrors the "complete profile" banner logic on home screen.
  // A profile is "complete" when blood_group + at least 1 contact exist.
  isProfileComplete: () => {
    const { emergencyProfile, contacts } = get();
    return !!(emergencyProfile?.blood_group && contacts?.length > 0);
  },

  // ── Token status helpers ───────────────────────
  isCardActive: () => get().token?.status === "ACTIVE",

  // ── Actions ────────────────────────────────────
  setStudent: (student) => set({ student }),

  updateEmergencyProfile: (updates) =>
    set((s) => ({
      emergencyProfile: { ...s.emergencyProfile, ...updates },
    })),

  addContact: (contact) => set((s) => ({ contacts: [...s.contacts, contact] })),

  removeContact: (id) =>
    set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),

  // Toggle card active/inactive (simulates the toggle on home screen)
  toggleCardStatus: () =>
    set((s) => ({
      token: {
        ...s.token,
        status: s.token.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      },
    })),

  setLoading: (val) => set({ isLoading: val }),
  setError: (err) => set({ error: err }),
}));

export default useProfileStore;
