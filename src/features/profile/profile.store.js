/**
 * features/profile/profile.store.js
 *
 * Works in BOTH Expo Go (AsyncStorage) and production build (MMKV).
 * All storage calls are async — consistent regardless of which storage is used.
 *
 * The only difference from the MMKV-only version:
 *   hydrate() is now async again (AsyncStorage requires await)
 *   fetchAndPersist() awaits saveProfile()
 *   fetchIfStale() awaits isProfileStale()
 *   patchStudent() awaits patchProfileStudent()
 *   clear() awaits clearProfile()
 */

import { useAuthStore } from "@/features/auth/auth.store";
import { profileApi } from "@/features/profile/profile.api";
import { storage } from "@/lib/storage/storage";
import { create } from "zustand";

export const useProfileStore = create((set, get) => ({
  // ── State ───────────────────────────────────────────────────────────────────
  parent: null,
  students: [],
  activeStudentId: null,
  lastScan: null,
  scanCount: 0,
  anomaly: null,
  isHydrated: false,
  isFetching: false,

  // ── Hydrate ─────────────────────────────────────────────────────────────────
  /**
   * Called from root _layout.jsx on cold start.
   * async in both modes — AsyncStorage requires await.
   */
  hydrate: async () => {
    try {
      const snap = await storage.readProfile();
      if (snap?.data) {
        const { parent, students, last_scan, scan_count, anomaly } = snap.data;
        set({
          parent: parent ?? null,
          students: students ?? [],
          activeStudentId: students?.[0]?.id ?? null,
          lastScan: last_scan ?? null,
          scanCount: scan_count ?? 0,
          anomaly: anomaly ?? null,
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },

  // ── Fetch + Persist ─────────────────────────────────────────────────────────
  // ── Fetch + Persist ─────────────────────────────────────────────────────────
  fetchAndPersist: async () => {
    if (get().isFetching) return;
    set({ isFetching: true });

    try {
      const data = await profileApi.getFullProfile();

      await storage.saveProfile(data);

      if (data.parent) {
        await useAuthStore.getState().setParentUser(data.parent);
      }

      // ✅ FIX: reconcile isNewUser with actual setup_stage from DB
      const hasCompletedStudent = (data.students ?? []).some(
        (s) => s.setup_stage === "COMPLETE",
      );
      if (hasCompletedStudent) {
        const authState = useAuthStore.getState();
        if (authState.isNewUser) {
          await authState.setIsNewUser(false); // clears flag in store + SecureStore
        }
      }

      set({
        parent: data.parent ?? null,
        students: data.students ?? [],
        activeStudentId:
          get().activeStudentId ?? data.students?.[0]?.id ?? null,
        lastScan: data.last_scan ?? null,
        scanCount: data.scan_count ?? 0,
        anomaly: data.anomaly ?? null,
      });

      return data;
    } finally {
      set({ isFetching: false });
    }
  },

  // ── Fetch If Stale ──────────────────────────────────────────────────────────
  fetchIfStale: async () => {
    const stale = await storage.isProfileStale(); // async in both modes
    if (stale) return get().fetchAndPersist();
  },

  // ── Patch Student ────────────────────────────────────────────────────────────
  patchStudent: async (studentId, payload) => {
    const result = await profileApi.updateProfile(studentId, payload);

    // Capture BEFORE set() — avoids stale read bug
    const currentStudent =
      get().students.find((s) => s.id === studentId) ?? null;

    set((state) => ({
      students: state.students.map((s) => {
        if (s.id !== studentId) return s;
        const updated = { ...s };
        if (payload.student) Object.assign(updated, payload.student);
        if (payload.emergency)
          updated.emergency = {
            ...(updated.emergency ?? {}),
            ...payload.emergency,
          };
        if (payload.contacts !== undefined)
          updated.emergency = {
            ...(updated.emergency ?? {}),
            contacts: payload.contacts,
          };
        if (payload.card_visibility)
          updated.card_visibility = {
            ...(updated.card_visibility ?? {}),
            ...payload.card_visibility,
          };
        return updated;
      }),
    }));

    await storage.patchProfileStudent(studentId, {
      ...(payload.student ?? {}),
      ...(payload.emergency
        ? {
            emergency: {
              ...(currentStudent?.emergency ?? {}),
              ...payload.emergency,
              ...(payload.contacts !== undefined
                ? { contacts: payload.contacts }
                : {}),
            },
          }
        : {}),
      ...(payload.contacts !== undefined && !payload.emergency
        ? {
            emergency: {
              ...(currentStudent?.emergency ?? {}),
              contacts: payload.contacts,
            },
          }
        : {}),
      ...(payload.card_visibility
        ? {
            card_visibility: {
              ...(currentStudent?.card_visibility ?? {}),
              ...payload.card_visibility,
            },
          }
        : {}),
    });

    if (result?.cache_invalidated) {
      await get().fetchAndPersist();
    }
  },

  // ── Update Visibility ────────────────────────────────────────────────────────
  updateVisibility: async (studentId, { visibility, hidden_fields }) => {
    const result = await profileApi.updateVisibility(studentId, {
      visibility,
      hidden_fields,
    });

    set((state) => ({
      students: state.students.map((s) =>
        s.id !== studentId
          ? s
          : {
              ...s,
              card_visibility: {
                ...(s.card_visibility ?? {}),
                visibility,
                hidden_fields,
                updated_by_parent: true,
              },
            },
      ),
    }));

    if (result?.cache_invalidated) await get().fetchAndPersist();
  },

  // ── Update Notifications ─────────────────────────────────────────────────────
  updateNotifications: async (prefs) => {
    const result = await profileApi.updateNotifications(prefs);

    set((state) => ({
      parent: state.parent
        ? {
            ...state.parent,
            notification_prefs: {
              ...(state.parent.notification_prefs ?? {}),
              ...prefs,
            },
          }
        : state.parent,
    }));

    if (result?.cache_invalidated) await get().fetchAndPersist();
  },

  // ── Update Location Consent ──────────────────────────────────────────────────
  updateLocationConsent: async (studentId, enabled) => {
    const result = await profileApi.updateLocationConsent(studentId, enabled);

    set((state) => ({
      students: state.students.map((s) =>
        s.id !== studentId
          ? s
          : {
              ...s,
              location_consent: { ...(s.location_consent ?? {}), enabled },
            },
      ),
    }));

    if (result?.cache_invalidated) await get().fetchAndPersist();
  },

  // ── Lock Card ────────────────────────────────────────────────────────────────
  lockCard: async (studentId) => {
    const result = await profileApi.lockCard(studentId);

    set((state) => ({
      students: state.students.map((s) =>
        s.id !== studentId
          ? s
          : {
              ...s,
              token: s.token ? { ...s.token, status: "INACTIVE" } : s.token,
            },
      ),
    }));

    await get().fetchAndPersist();
    return result;
  },

  // ── Request Replace ──────────────────────────────────────────────────────────
  requestReplace: async (studentId, reason) => {
    return profileApi.requestReplace(studentId, reason);
  },

  // ── Delete Account ───────────────────────────────────────────────────────────
  deleteAccount: async () => {
    await profileApi.deleteAccount();
    await get().clear();
  },

  // ── Active Student ───────────────────────────────────────────────────────────
  setActiveStudent: (id) => set({ activeStudentId: id }),

  // ── Clear ────────────────────────────────────────────────────────────────────
  clear: async () => {
    await storage.clearProfile();
    set({
      parent: null,
      students: [],
      activeStudentId: null,
      lastScan: null,
      scanCount: 0,
      anomaly: null,
      isHydrated: false,
      isFetching: false,
    });
  },

  _getStudent: (id) => get().students.find((s) => s.id === id) ?? null,
}));

// ── Selectors ─────────────────────────────────────────────────────────────────
export const useActiveStudent = () =>
  useProfileStore(
    (s) => s.students.find((st) => st.id === s.activeStudentId) ?? null,
  );

export const useToken = () =>
  useProfileStore(
    (s) => s.students.find((st) => st.id === s.activeStudentId)?.token ?? null,
  );

export const useEmergencyProfile = () =>
  useProfileStore(
    (s) =>
      s.students.find((st) => st.id === s.activeStudentId)?.emergency ?? null,
  );

export const useSchool = () =>
  useProfileStore(
    (s) => s.students.find((st) => st.id === s.activeStudentId)?.school ?? null,
  );

export const useCardVisibility = () =>
  useProfileStore(
    (s) =>
      s.students.find((st) => st.id === s.activeStudentId)?.card_visibility ??
      null,
  );

export const useLocationConsent = () =>
  useProfileStore(
    (s) =>
      s.students.find((st) => st.id === s.activeStudentId)?.location_consent ??
      null,
  );

export const useNotificationPrefs = () =>
  useProfileStore((s) => s.parent?.notification_prefs ?? null);
export const useLastScan = () => useProfileStore((s) => s.lastScan);
export const useScanCount = () => useProfileStore((s) => s.scanCount);
export const useUnresolvedAnomaly = () => useProfileStore((s) => s.anomaly);
