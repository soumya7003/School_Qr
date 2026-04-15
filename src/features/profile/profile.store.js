/**
 * features/profile/profile.store.js
 *
 * STRATEGY: Cache-first with silent background refresh
 * - Shows cached data immediately
 * - Waits for auth to be ready
 * - Refreshes in background when stale
 * - Never blocks UI on network
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
  isInitialized: false,
  lastRefreshTime: null,

  // ── Hydrate (called once on app start) ──────────────────────────────────────
  hydrate: async () => {
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
    const { isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated) {
      console.log("[ProfileStore] Not authenticated, skipping silent refresh");
      return null;
    }

    // Check if refresh is needed (stale or never refreshed)
    const stale = await storage.isProfileStale();
    const neverRefreshed = get().lastRefreshTime === null;

    if (!stale && !neverRefreshed) {
      console.log("[ProfileStore] Cache fresh, skipping refresh");
      return null;
    }

    console.log("[ProfileStore] Starting silent background refresh");
    return get().fetchAndPersist({ silent: true });
  },

  // ── Fetch from API (with optional silent mode) ──────────────────────────────
  fetchAndPersist: async ({ silent = false } = {}) => {
    // Prevent concurrent fetches
    if (get().isFetching) {
      console.log("[ProfileStore] Already fetching, skipping");
      return null;
    }

    // Check auth
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      console.log("[ProfileStore] Not authenticated, skipping fetch");
      return null;
    }

    if (!silent) {
      set({ isFetching: true });
    }

    try {
      console.log("[ProfileStore] Fetching from API...");
      const data = await profileApi.getFullProfile();

      if (data && data.students) {
        // Save to storage
        await storage.saveProfile(data);

        // Update store
        const currentState = get();

        set({
          parent: data.parent ?? currentState.parent,
          students: data.students ?? currentState.students,
          activeStudentId:
            data.parent?.active_student_id ??
            currentState.activeStudentId ??
            data.students?.[0]?.id ??
            null,
          lastScan: data.last_scan ?? currentState.lastScan,
          scanCount: data.scan_count ?? currentState.scanCount,
          anomaly: data.anomaly ?? currentState.anomaly,
          lastRefreshTime: Date.now(),
        });

        // Update auth store if needed
        if (data.parent) {
          await useAuthStore.getState().setParentUser(data.parent);
        }

        // Handle new user flag
        const hasCompletedStudent = (data.students ?? []).some(
          (s) => s.setup_stage === "COMPLETE",
        );
        const authState = useAuthStore.getState();
        if (hasCompletedStudent && authState.isNewUser) {
          await authState.setIsNewUser(false);
        }

        console.log("[ProfileStore] Fetch complete");
        return data;
      }
    } catch (err) {
      console.error("[ProfileStore] fetchAndPersist error:", err);
      if (!silent) {
        throw err;
      }
      return null;
    } finally {
      if (!silent) {
        set({ isFetching: false });
      }
    }
  },

  // ── Force refresh (user pull-to-refresh) ────────────────────────────────────
  refresh: async () => {
    console.log("[ProfileStore] Force refresh");
    set({ isFetching: true });
    try {
      return await get().fetchAndPersist({ silent: false });
    } finally {
      set({ isFetching: false });
    }
  },

  // ── Called after login ──────────────────────────────────────────────────────
  onLogin: async () => {
    console.log("[ProfileStore] onLogin - clearing cache and fetching fresh");
    await storage.clearProfile();
    set({
      students: [],
      parent: null,
      lastRefreshTime: null,
      isFetching: false,
    });
    return get().fetchAndPersist({ silent: false });
  },

  // ── Called after logout ─────────────────────────────────────────────────────
  onLogout: async () => {
    console.log("[ProfileStore] onLogout - clearing all data");
    await storage.clearProfile();
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
  },

  // ── Student update methods ──────────────────────────────────────────────────
  patchStudent: async (studentId, payload) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");

    console.log("[ProfileStore] patchStudent called with:", {
      studentId,
      payload,
    });

    const result = await profileApi.updateProfile(studentId, payload);
    console.log("[ProfileStore] API result:", result);

    // Update local store optimistically
    const currentStudent = get().students.find((s) => s.id === studentId);
    if (currentStudent) {
      let updatedStudent = { ...currentStudent };
      if (payload.student) Object.assign(updatedStudent, payload.student);
      if (payload.emergency) {
        updatedStudent.emergency = {
          ...(currentStudent.emergency ?? {}),
          ...payload.emergency,
        };
      }

      set((state) => ({
        students: state.students.map((s) =>
          s.id === studentId ? updatedStudent : s,
        ),
      }));

      await storage.patchProfileStudent(studentId, payload);
    }

    // 🟢 FIX: Force immediate refresh, not silent
    await get().refresh();

    return result;
  },

  fetchIfStale: async () => {
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
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");

    await profileApi.updateNotifications(prefs);

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

    // Update storage
    const snap = await storage.readProfile();
    if (snap?.data) {
      snap.data.parent = {
        ...snap.data.parent,
        notification_prefs: {
          ...(snap.data.parent?.notification_prefs ?? {}),
          ...prefs,
        },
      };
      await storage.saveProfile(snap.data);
    }

    get()._silentRefresh();
  },

  updateLocationConsent: async (studentId, enabled) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");

    await profileApi.updateLocationConsent(studentId, enabled);

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

    await storage.patchProfileStudent(studentId, {
      location_consent: { enabled },
    });
    get()._silentRefresh();
  },

  lockCard: async (studentId) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");

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

    await get().refresh();
    return result;
  },

  requestReplace: async (studentId, reason) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");
    return profileApi.requestReplace(studentId, reason);
  },

  deleteAccount: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");
    await profileApi.deleteAccount();
    await get().onLogout();
  },

  setActiveStudent: (id) => set({ activeStudentId: id }),

  getChildrenList: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");
    const data = await profileApi.getChildrenList();
    return data?.children ?? data ?? [];
  },

  linkCard: async ({ card_number }) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");

    const result = await profileApi.linkCard({ card_number });

    // 🟢 FIX: Wait for refresh to complete
    await get().refresh();

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
    await storage.clearProfile();
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
export const useIsFetchingProfile = () => useProfileStore((s) => s.isFetching);
