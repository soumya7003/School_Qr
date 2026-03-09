/**
 * features/profile/profile.store.js
 *
 * Offline-first: cold start reads from SecureStore — zero API calls.
 * API is called only when:
 *   1. First login (fetchAndPersist)
 *   2. App foregrounds after 30 min stale (fetchIfStale)
 *   3. Push notification triggers scan/anomaly refresh
 *   4. Parent edits profile (patchStudent → fetchAndPersist)
 *
 * activeStudentId: supports multi-child families.
 * All computed getters derive from students[activeStudentId].
 */

import { useAuthStore } from "@/features/auth/auth.store";
import { profileApi } from "@/features/profile/profile.api";
import { storage } from "@/lib/storage/storage";
import { create } from "zustand";

// ── Store ─────────────────────────────────────────────────────────────────────

export const useProfileStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  parent: null, // { id, phone }
  students: [], // full array from GET /parent/me
  activeStudentId: null, // which student is selected
  isHydrated: false,
  isFetching: false, // true while GET /parent/me is in-flight

  // ── Hydrate (cold start, zero API calls) ───────────────────────────────────
  /**
   * Reads profile snapshot from SecureStore.
   * Called in parallel with auth.store.hydrate() from AuthProvider.
   */
  hydrate: async () => {
    try {
      const snap = await storage.readProfile();
      if (snap?.data) {
        const { parent, students } = snap.data;
        set({
          parent,
          students: students ?? [],
          activeStudentId: students?.[0]?.id ?? null,
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },

  // ── Fetch + Persist ────────────────────────────────────────────────────────
  /**
   * GET /parent/me → update store + save to SecureStore.
   * Called after login and after profile mutations.
   *
   * Also updates auth.store.parentUser with the decrypted phone
   * that GET /parent/me returns (login only gives us parent.id).
   */
  fetchAndPersist: async () => {
    if (get().isFetching) return;
    set({ isFetching: true });

    try {
      const data = await profileApi.getFullProfile();
      // data shape: { parent: { id, phone }, students: [...] }

      await storage.saveProfile(data);

      // Populate phone in auth.store — login only gave us { id }
      if (data.parent) {
        await useAuthStore.getState().setParentUser(data.parent);
      }

      set({
        parent: data.parent,
        students: data.students ?? [],
        activeStudentId:
          get().activeStudentId ?? data.students?.[0]?.id ?? null,
      });

      return data;
    } finally {
      set({ isFetching: false });
    }
  },

  // ── Fetch If Stale ─────────────────────────────────────────────────────────
  /**
   * Called on app foreground (AppState change). Only hits the network
   * if snapshot is older than 30 minutes. Zero cost on most foregrounds.
   */
  fetchIfStale: async () => {
    const stale = await storage.isProfileStale();
    if (stale) return get().fetchAndPersist();
  },

  // ── Patch Student (optimistic + persist) ──────────────────────────────────
  /**
   * PATCH /parent/student/:id → merge response into store + SecureStore slice.
   * Does NOT do a full re-fetch — uses patchProfileStudent for minimal writes.
   *
   * For onboarding completion (updates.jsx):
   *   await patchStudent(studentId, payload)
   *   await fetchAndPersist()       ← get full fresh data (token becomes ACTIVE)
   *   await setIsNewUser(false)     ← unlock the rest of the app
   */
  patchStudent: async (studentId, payload) => {
    await profileApi.updateStudent(studentId, payload);

    // Optimistic local merge — avoids full refetch for minor edits
    const partial = {
      ...(payload.student ?? {}),
      ...(payload.emergency
        ? {
            emergency: {
              ...get()._getStudent(studentId)?.emergency,
              ...payload.emergency,
            },
          }
        : {}),
      ...(payload.contacts !== undefined ? { contacts: payload.contacts } : {}),
    };

    // Update in-memory store
    set((state) => ({
      students: state.students.map((s) =>
        s.id === studentId ? { ...s, ...partial } : s,
      ),
    }));

    // Update SecureStore slice — single student, not full profile
    await storage.patchProfileStudent(studentId, partial);
  },

  // ── Active Student ─────────────────────────────────────────────────────────

  setActiveStudent: (id) => set({ activeStudentId: id }),

  // ── Clear (on logout) ─────────────────────────────────────────────────────

  clear: async () => {
    await storage.clearProfile();
    set({
      parent: null,
      students: [],
      activeStudentId: null,
      isHydrated: false,
      isFetching: false,
    });
  },

  // ── Internal helper ────────────────────────────────────────────────────────
  _getStudent: (id) => {
    return get().students.find((s) => s.id === id) ?? null;
  },
}));

// ── Derived selectors ─────────────────────────────────────────────────────────
// All computed from activeStudentId — screens never need to search themselves.

export const useActiveStudent = () =>
  useProfileStore(
    (s) => s.students.find((st) => st.id === s.activeStudentId) ?? null,
  );

export const useToken = () =>
  useProfileStore((s) => {
    const student = s.students.find((st) => st.id === s.activeStudentId);
    return student?.token ?? null;
  });

export const useEmergencyProfile = () =>
  useProfileStore((s) => {
    const student = s.students.find((st) => st.id === s.activeStudentId);
    return student?.emergency ?? null;
  });

export const useSchool = () =>
  useProfileStore((s) => {
    const student = s.students.find((st) => st.id === s.activeStudentId);
    return student?.school ?? null;
  });

export const useCardVisibility = () =>
  useProfileStore((s) => {
    const student = s.students.find((st) => st.id === s.activeStudentId);
    return student?.card_visibility ?? null;
  });
