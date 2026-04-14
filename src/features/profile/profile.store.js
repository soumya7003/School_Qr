/**
 * features/profile/profile.store.js
 *
 * PRODUCTION: Cache-first with silent background refresh
 * DEVELOPMENT: Bypass with mock data
 */

import { useAuthStore } from "@/features/auth/auth.store";
import { profileApi } from "@/features/profile/profile.api";
import { storage } from "@/lib/storage/storage";
import { create } from "zustand";

// ⚠️ DEVELOPMENT BYPASS – NEVER set to true in production builds
const __DEV_BYPASS_PROFILE__ = true;

// Mock student data for bypass mode
const MOCK_STUDENTS = [
  {
    id: "mock-student-1",
    first_name: "Aarav",
    class: "10",
    setup_stage: "COMPLETE",
    school: { name: "Delhi Public School", city: "Delhi" },
    emergency: { phone: "+919876543210", name: "Parent" },
    card_visibility: { visibility: "SHOW_ALL", hidden_fields: [] },
    location_consent: { enabled: true },
    token: { status: "ACTIVE" },
  },
];

const MOCK_PARENT = {
  id: "mock-parent-id",
  phone: "+919876543210",
  name: "Priya Sharma",
  notification_prefs: { email: true, push: true },
};

export const useProfileStore = create((set, get) => ({
  // ── State ───────────────────────────────────────────────────────────────────
  parent: __DEV_BYPASS_PROFILE__ ? MOCK_PARENT : null,
  students: __DEV_BYPASS_PROFILE__ ? MOCK_STUDENTS : [],
  activeStudentId: __DEV_BYPASS_PROFILE__ ? MOCK_STUDENTS[0]?.id : null,
  lastScan: __DEV_BYPASS_PROFILE__ ? { timestamp: Date.now(), location: "School Gate" } : null,
  scanCount: __DEV_BYPASS_PROFILE__ ? 42 : 0,
  anomaly: __DEV_BYPASS_PROFILE__ ? null : null,
  isHydrated: __DEV_BYPASS_PROFILE__ ? true : false,
  isFetching: false,
  isInitialized: __DEV_BYPASS_PROFILE__ ? true : false,
  lastRefreshTime: __DEV_BYPASS_PROFILE__ ? Date.now() : null,

  // ── Hydrate (called once on app start) ──────────────────────────────────────
  hydrate: async () => {
    if (__DEV_BYPASS_PROFILE__) {
      console.log("[ProfileStore] Bypass mode – skipping real hydrate");
      set({
        isHydrated: true,
        isInitialized: true,
        parent: MOCK_PARENT,
        students: MOCK_STUDENTS,
        activeStudentId: MOCK_STUDENTS[0]?.id,
      });
      return;
    }

    // [ORIGINAL IMPLEMENTATION – keep unchanged for production]
    if (get().isInitialized) {
      console.log("[ProfileStore] Already initialized, skipping");
      return;
    }

    console.log("[ProfileStore] hydrate START");

    // Step 1: Wait for auth to be ready
    const authState = useAuthStore.getState();

    if (!authState.isHydrated) {
      console.log("[ProfileStore] Waiting for auth hydration...");
      await new Promise((resolve) => {
        const unsubscribe = useAuthStore.subscribe((state) => {
          if (state.isHydrated) {
            unsubscribe();
            resolve();
          }
        });
      });
      console.log("[ProfileStore] Auth hydration complete");
    }

    // Step 2: Check if authenticated
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) {
      console.log("[ProfileStore] Not authenticated, setting empty state");
      set({
        isHydrated: true,
        isInitialized: true,
        students: [],
        parent: null,
        activeStudentId: null,
      });
      return;
    }

    // Step 3: Load cached data IMMEDIATELY (skeleton UI)
    try {
      const snap = await storage.readProfile();

      if (snap?.data && snap.data.students?.length > 0) {
        console.log("[ProfileStore] Cache found, showing immediately");

        let students = snap.data.students;
        // Handle old single-student structure
        if (!Array.isArray(students) && snap.data.student) {
          students = [snap.data.student];
        }

        // 🟢 FIX: Use parent.active_student_id from cache, fallback to first student
        const activeId =
          snap.data.parent?.active_student_id ?? students[0]?.id ?? null;

        set({
          parent: snap.data.parent ?? null,
          students: students,
          activeStudentId: activeId,
          lastScan: snap.data.last_scan ?? null,
          scanCount: snap.data.scan_count ?? 0,
          anomaly: snap.data.anomaly ?? null,
          isHydrated: true,
          isInitialized: true,
          lastRefreshTime: snap.savedAt
            ? new Date(snap.savedAt).getTime()
            : null,
        });
      } else {
        console.log("[ProfileStore] No cache found");
        set({
          isHydrated: true,
          isInitialized: true,
          students: [],
          parent: null,
          activeStudentId: null,
        });
      }
    } catch (err) {
      console.error("[ProfileStore] hydrate cache read error:", err);
      set({
        isHydrated: true,
        isInitialized: true,
        activeStudentId: null,
      });
    }

    // Step 4: Silently refresh in background
    await get()._silentRefresh();
  },

  // ── Silent background refresh ───────────────────────────────────────────────
  _silentRefresh: async () => {
    if (__DEV_BYPASS_PROFILE__) {
      console.log("[ProfileStore] Bypass mode – skip refresh");
      return null;
    }
    // [original implementation]
  },

  // ── Fetch from API (with optional silent mode) ──────────────────────────────
  fetchAndPersist: async ({ silent = false } = {}) => {
    if (__DEV_BYPASS_PROFILE__) {
      console.log("[ProfileStore] Bypass mode – returning mock data");
      set({
        parent: MOCK_PARENT,
        students: MOCK_STUDENTS,
        activeStudentId: MOCK_STUDENTS[0]?.id,
        lastScan: { timestamp: Date.now(), location: "Mock Scan" },
        scanCount: 42,
        isFetching: false,
        lastRefreshTime: Date.now(),
      });
      return { parent: MOCK_PARENT, students: MOCK_STUDENTS };
    }

    // [original fetchAndPersist implementation]
  },

  // ── Force refresh (user pull-to-refresh) ────────────────────────────────────
  refresh: async () => {
    if (__DEV_BYPASS_PROFILE__) {
      console.log("[ProfileStore] Bypass – refresh does nothing");
      return get().fetchAndPersist({ silent: false });
    }
    // [original]
  },

  // ── Called after login ──────────────────────────────────────────────────────
  onLogin: async () => {
    if (__DEV_BYPASS_PROFILE__) {
      console.log("[ProfileStore] Bypass – onLogin resetting to mock");
      await storage.clearProfile(); // optional, safe
      set({
        parent: MOCK_PARENT,
        students: MOCK_STUDENTS,
        activeStudentId: MOCK_STUDENTS[0]?.id,
        lastRefreshTime: Date.now(),
        isFetching: false,
      });
      return { parent: MOCK_PARENT, students: MOCK_STUDENTS };
    }
    // [original]
  },

  // ── Called after logout ─────────────────────────────────────────────────────
  onLogout: async () => {
    if (__DEV_BYPASS_PROFILE__) {
      console.log("[ProfileStore] Bypass – onLogout clears mock");
      set({
        parent: null,
        students: [],
        activeStudentId: null,
        lastScan: null,
        scanCount: 0,
        anomaly: null,
        isFetching: false,
        lastRefreshTime: null,
      });
      return;
    }
    // [original]
  },

  // ── Student update methods ──────────────────────────────────────────────────
  patchStudent: async (studentId, payload) => {
    if (__DEV_BYPASS_PROFILE__) {
      console.log("[ProfileStore] Bypass – mock patchStudent");
      // Optionally update local mock data
      set((state) => ({
        students: state.students.map((s) =>
          s.id === studentId ? { ...s, ...payload.student } : s
        ),
      }));
      return;
    }
    // [original]
  },

  fetchIfStale: async () => {
    if (__DEV_BYPASS_PROFILE__) return null;
    return get()._silentRefresh();
  },

  updateVisibility: async (studentId, { visibility, hidden_fields }) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");

    // 🟢 FIX: Single API call - backend handles both CardVisibility and EmergencyProfile
    await profileApi.updateVisibility(studentId, { visibility, hidden_fields });

    // Update local state optimistically
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
              emergency: {
                ...(s.emergency ?? {}),
                visibility,
              },
            },
      ),
    }));

    // Update storage cache
    await storage.patchProfileStudent(studentId, {
      card_visibility: { visibility, hidden_fields, updated_by_parent: true },
      emergency: { visibility },
    });

    // Silent refresh to sync with server
    get()._silentRefresh();
  },

  updateNotifications: async (prefs) => {
    if (__DEV_BYPASS_PROFILE__) {
      console.log("[ProfileStore] Bypass – mock updateNotifications");
      set((state) => ({
        parent: state.parent ? { ...state.parent, notification_prefs: { ...state.parent.notification_prefs, ...prefs } } : state.parent,
      }));
      return;
    }
    // [original]
  },

  updateLocationConsent: async (studentId, enabled) => {
    if (__DEV_BYPASS_PROFILE__) {
      console.log("[ProfileStore] Bypass – mock updateLocationConsent");
      set((state) => ({
        students: state.students.map((s) =>
          s.id === studentId ? { ...s, location_consent: { enabled } } : s
        ),
      }));
      return;
    }
    // [original]
  },

  lockCard: async (studentId) => {
    if (__DEV_BYPASS_PROFILE__) {
      console.log("[ProfileStore] Bypass – mock lockCard");
      set((state) => ({
        students: state.students.map((s) =>
          s.id === studentId
            ? { ...s, token: { ...s.token, status: "INACTIVE" } }
            : s
        ),
      }));
      return { success: true };
    }
    // [original]
  },

  requestReplace: async (studentId, reason) => {
    if (__DEV_BYPASS_PROFILE__) {
      console.log("[ProfileStore] Bypass – mock requestReplace");
      return { success: true };
    }
    return profileApi.requestReplace(studentId, reason);
  },

  deleteAccount: async () => {
    if (__DEV_BYPASS_PROFILE__) {
      console.log("[ProfileStore] Bypass – mock deleteAccount");
      await get().onLogout();
      return;
    }
    // [original]
  },

  setActiveStudent: (id) => set({ activeStudentId: id }),

  getChildrenList: async () => {
    if (__DEV_BYPASS_PROFILE__) {
      console.log("[ProfileStore] Bypass – returning mock children");
      return MOCK_STUDENTS.map(s => ({ id: s.id, name: s.first_name, class: s.class }));
    }
    // [original]
  },

  linkCard: async ({ card_number }) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");

    const result = await profileApi.linkCard({ card_number });

    // 🟢 FIX: Force immediate full refresh, not silent
    await get().fetchAndPersist({ silent: false });

    return result;
  },

  setActiveStudentWithSync: async (studentId) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");

    const student = get().students.find((s) => s.id === studentId);
    if (!student) throw new Error("Student not found");

    await profileApi.setActiveStudent(studentId);

    set({ activeStudentId: studentId });

    // 🟢 Persist to storage
    await storage.setLastActiveChild(studentId);

    // Update parent in storage
    const snap = await storage.readProfile();
    if (snap?.data) {
      snap.data.parent = {
        ...snap.data.parent,
        active_student_id: studentId,
      };
      await storage.saveProfile(snap.data);
    }

    return { success: true };
  },

  unlinkChild: async (studentId, otp, nonce) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");

    const result = await profileApi.unlinkChildVerify(studentId, otp, nonce);

    // 🟢 FIX: Optimistically update local state with server response
    set((state) => {
      const newStudents = state.students.filter((s) => s.id !== studentId);
      const newActiveId =
        result.active_student_id ?? newStudents[0]?.id ?? null;

      return {
        students: newStudents,
        activeStudentId: newActiveId,
        parent: state.parent
          ? {
              ...state.parent,
              active_student_id: newActiveId,
            }
          : null,
      };
    });

    // Force full refresh to sync all screens
    await get().refresh();

    return result;
  },

  unlinkChildInit: async (studentId) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");

    const result = await profileApi.unlinkChildInit(studentId);
    return result;
  },

  clear: async () => {
    if (__DEV_BYPASS_PROFILE__) {
      console.log("[ProfileStore] Bypass – clearing mock data");
      set({
        parent: null,
        students: [],
        activeStudentId: null,
        lastScan: null,
        scanCount: 0,
        anomaly: null,
        isFetching: false,
        lastRefreshTime: null,
      });
      return;
    }
    await storage.clearProfile();
    set({ /* original clear */ });
  },

  _getStudent: (id) => get().students.find((s) => s.id === id) ?? null,
}));

// ── Selectors (unchanged) ─────────────────────────────────────────────────────
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
export const useIsFetchingProfile = () => useProfileStore((s) => s.isFetching);