/**
 * features/profile/profile.store.js
 *
 * BUGS FIXED:
 *
 *   [FIX-1] fetchAndPersist isNewUser auto-correct fires too eagerly:
 *           The original logic was:
 *             if (hasCompletedStudent) await setIsNewUser(false)
 *           This ran even during the registration flow when fetchAndPersist
 *           is called right after loginSuccess. On registration the student
 *           setup_stage is NOT 'COMPLETE', so setIsNewUser(false) should NOT
 *           fire. This was actually correct logic — but the check was only for
 *           'COMPLETE'. Added defensive check: only auto-correct if the store
 *           currently has isNewUser=true (no point calling setIsNewUser(false)
 *           if it's already false — avoids a spurious SecureStore write on
 *           every profile refresh for existing users).
 *
 *   [FIX-2] hydrate() set isHydrated=true even when students array is empty
 *           (snap.data exists but students = []). This caused AuthProvider to
 *           see profileHydrated=true + hasStudents=false and block routing to
 *           /updates. Now isHydrated is set to true regardless (correct), but
 *           the AuthProvider no longer uses hasStudents as a gate (fixed there).
 *           No change needed here for that specific bug — documenting for clarity.
 *
 *   [FIX-3] clear() set isHydrated: false which caused a brief re-hydration
 *           cycle after logout. The root _layout.jsx calls hydrate() again on
 *           mount but the profile store being un-hydrated while auth store is
 *           already hydrated caused AuthProvider to block (waits for both).
 *           Fixed: clear() keeps isHydrated: true so AuthProvider's guard can
 *           immediately fire the logout redirect to /(auth)/login.
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
  fetchAndPersist: async () => {
    if (get().isFetching) return;
    set({ isFetching: true });

    try {
      const data = await profileApi.getFullProfile();

      await storage.saveProfile(data);

      if (data.parent) {
        await useAuthStore.getState().setParentUser(data.parent);
      }

      // [FIX-1] Only auto-correct isNewUser→false when:
      //   a) The auth store currently has isNewUser=true (avoid pointless write)
      //   b) A student with setup_stage='COMPLETE' exists in the response
      // This prevents the correction from firing mid-registration where
      // isNewUser=true was just set and the student is not yet COMPLETE.
      const hasCompletedStudent = (data.students ?? []).some(
        (s) => s.setup_stage === "COMPLETE",
      );
      const authState = useAuthStore.getState();
      if (hasCompletedStudent && authState.isNewUser) {
        await authState.setIsNewUser(false);
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
    const stale = await storage.isProfileStale();
    if (stale) return get().fetchAndPersist();
  },

  // ── Patch Student ────────────────────────────────────────────────────────────
  patchStudent: async (studentId, payload) => {
    const result = await profileApi.updateProfile(studentId, payload);

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
  // [FIX-3] isHydrated stays true after clear() so AuthProvider can immediately
  // fire the logout redirect. Setting it false caused a stuck state where both
  // stores needed re-hydration simultaneously after logout.
  clear: async () => {
    await storage.clearProfile();
    set({
      parent: null,
      students: [],
      activeStudentId: null,
      lastScan: null,
      scanCount: 0,
      anomaly: null,
      isHydrated: true, // [FIX-3] was: false
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
