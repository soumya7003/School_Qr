/**
 * features/profile/profile.store.js
 *
 * STRATEGY: Cache-first with silent background refresh.
 *
 * FIX: lastScan, scanCount, and anomaly are now read from the active student's
 * embedded data (student.last_scan, student.scan_count, student.anomaly) rather
 * than from global top-level fields. This makes all scan-related UI automatically
 * reflect the currently selected child.
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
  // NOTE: lastScan / scanCount / anomaly are now derived from the active student
  // in the selectors below. These top-level fields are kept for storage compat.
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
    }

    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) {
      set({
        isHydrated: true,
        isInitialized: true,
        students: [],
        parent: null,
        activeStudentId: null,
      });
      return;
    }

    try {
      const snap = await storage.readProfile();

      if (snap?.data && snap.data.students?.length > 0) {
        console.log("[ProfileStore] Cache found, showing immediately");

        let students = snap.data.students;
        if (!Array.isArray(students) && snap.data.student) {
          students = [snap.data.student];
        }

        const activeId =
          snap.data.parent?.active_student_id ?? students[0]?.id ?? null;

        // FIX: derive lastScan/anomaly/scanCount from the active student's data
        const activeStudent =
          students.find((s) => s.id === activeId) ?? students[0] ?? null;

        set({
          parent: snap.data.parent ?? null,
          students,
          activeStudentId: activeId,
          // Keep global fields populated for backwards-compat
          lastScan: activeStudent?.last_scan ?? snap.data.last_scan ?? null,
          scanCount: activeStudent?.scan_count ?? snap.data.scan_count ?? 0,
          anomaly: activeStudent?.anomaly ?? snap.data.anomaly ?? null,
          isHydrated: true,
          isInitialized: true,
          lastRefreshTime: snap.savedAt
            ? new Date(snap.savedAt).getTime()
            : null,
        });
      } else {
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
      set({ isHydrated: true, isInitialized: true, activeStudentId: null });
    }

    await get()._silentRefresh();
  },

  // ── Silent background refresh ───────────────────────────────────────────────
  _silentRefresh: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return null;

    const stale = await storage.isProfileStale();
    const neverRefreshed = get().lastRefreshTime === null;

    if (!stale && !neverRefreshed) {
      console.log("[ProfileStore] Cache fresh, skipping refresh");
      return null;
    }

    return get().fetchAndPersist({ silent: true });
  },

  // ── Fetch from API ──────────────────────────────────────────────────────────
  fetchAndPersist: async ({ silent = false } = {}) => {
    if (get().isFetching) {
      console.log("[ProfileStore] Already fetching, skipping");
      return null;
    }

    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return null;

    if (!silent) set({ isFetching: true });

    try {
      const data = await profileApi.getFullProfile();

      if (data && data.students) {
        await storage.saveProfile(data);

        const currentState = get();

        // FIX: resolve active student id from response
        const activeStudentId =
          data.parent?.active_student_id ??
          currentState.activeStudentId ??
          data.students?.[0]?.id ??
          null;

        // FIX: pull lastScan / anomaly / scanCount from the active student's
        // embedded data returned by the updated /me endpoint
        const activeStudent =
          data.students?.find((s) => s.id === activeStudentId) ??
          data.students?.[0] ??
          null;

        set({
          parent: data.parent ?? currentState.parent,
          students: data.students ?? currentState.students,
          activeStudentId,
          lastScan:
            activeStudent?.last_scan ?? data.last_scan ?? currentState.lastScan,
          scanCount:
            activeStudent?.scan_count ??
            data.scan_count ??
            currentState.scanCount,
          anomaly:
            activeStudent?.anomaly ?? data.anomaly ?? currentState.anomaly,
          lastRefreshTime: Date.now(),
        });

        if (data.parent) {
          await useAuthStore.getState().setParentUser(data.parent);
        }

        const hasCompletedStudent = (data.students ?? []).some(
          (s) => s.setup_stage === "COMPLETE",
        );
        const authState = useAuthStore.getState();
        if (hasCompletedStudent && authState.isNewUser) {
          await authState.setIsNewUser(false);
        }

        return data;
      }
    } catch (err) {
      console.error("[ProfileStore] fetchAndPersist error:", err);
      if (!silent) throw err;
      return null;
    } finally {
      if (!silent) set({ isFetching: false });
    }
  },

  // ── Force refresh ───────────────────────────────────────────────────────────
  refresh: async () => {
    set({ isFetching: true });
    try {
      return await get().fetchAndPersist({ silent: false });
    } finally {
      set({ isFetching: false });
    }
  },

  // ── Login / logout lifecycle ────────────────────────────────────────────────
  onLogin: async () => {
    await storage.clearProfile();
    set({
      students: [],
      parent: null,
      lastRefreshTime: null,
      isFetching: false,
    });
    return get().fetchAndPersist({ silent: false });
  },

  onLogout: async () => {
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

    const result = await profileApi.updateProfile(studentId, payload);

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

    await get().refresh();
    return result;
  },

  fetchIfStale: async () => get()._silentRefresh(),

  updateVisibility: async (studentId, { visibility, hidden_fields }) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");

    await profileApi.updateVisibility(studentId, { visibility, hidden_fields });

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
              emergency: { ...(s.emergency ?? {}), visibility },
            },
      ),
    }));

    await storage.patchProfileStudent(studentId, {
      card_visibility: { visibility, hidden_fields, updated_by_parent: true },
      emergency: { visibility },
    });

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

    try {
      const result = await profileApi.linkCard({ card_number });

      const studentId = result?.student_id || result?.student?.id;
      const studentName =
        result?.student_name ||
        `${result?.student?.first_name || ""} ${result?.student?.last_name || ""}`.trim();

      await storage.clearProfile();
      await get().fetchAndPersist({ silent: false });

      return {
        success: true,
        student_id: studentId,
        student_name: studentName,
        is_first_child: result?.is_first_child || false,
      };
    } catch (error) {
      const responseData = error?.response?.data?.data || error?.response?.data;
      if (
        responseData &&
        (responseData.student_id || responseData.student?.id)
      ) {
        await storage.clearProfile();
        await get().fetchAndPersist({ silent: false });
        return {
          success: true,
          student_id: responseData.student_id || responseData.student?.id,
          student_name:
            responseData.student_name ||
            `${responseData.student?.first_name || ""} ${responseData.student?.last_name || ""}`.trim(),
          is_first_child: responseData?.is_first_child || false,
        };
      }
      throw error;
    }
  },

  setActiveStudentWithSync: async (studentId) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");

    const student = get().students.find((s) => s.id === studentId);
    if (!student) throw new Error("Student not found");

    await profileApi.setActiveStudent(studentId);
    set({ activeStudentId: studentId });

    // FIX: update the global lastScan/anomaly/scanCount to match the newly
    // selected student so all consumers immediately reflect the switch
    set({
      lastScan: student.last_scan ?? null,
      scanCount: student.scan_count ?? 0,
      anomaly: student.anomaly ?? null,
    });

    await storage.setLastActiveChild(studentId);

    const snap = await storage.readProfile();
    if (snap?.data) {
      snap.data.parent = { ...snap.data.parent, active_student_id: studentId };
      await storage.saveProfile(snap.data);
    }

    return { success: true };
  },

  unlinkChild: async (studentId, otp, nonce) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");

    const result = await profileApi.unlinkChildVerify(studentId, otp, nonce);

    set((state) => {
      const newStudents = state.students.filter((s) => s.id !== studentId);
      const newActiveId =
        result.active_student_id ?? newStudents[0]?.id ?? null;
      const newActive = newStudents.find((s) => s.id === newActiveId) ?? null;

      return {
        students: newStudents,
        activeStudentId: newActiveId,
        parent: state.parent
          ? { ...state.parent, active_student_id: newActiveId }
          : null,
        lastScan: newActive?.last_scan ?? null,
        scanCount: newActive?.scan_count ?? 0,
        anomaly: newActive?.anomaly ?? null,
      };
    });

    await get().refresh();
    return result;
  },

  unlinkChildInit: async (studentId) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");
    return profileApi.unlinkChildInit(studentId);
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

// FIX: lastScan, scanCount, anomaly are now derived from the active student's
// embedded data, NOT from global top-level store fields.

export const useLastScan = () =>
  useProfileStore(
    (s) =>
      s.students.find((st) => st.id === s.activeStudentId)?.last_scan ?? null,
  );

export const useScanCount = () =>
  useProfileStore(
    (s) =>
      s.students.find((st) => st.id === s.activeStudentId)?.scan_count ?? 0,
  );

export const useUnresolvedAnomaly = () =>
  useProfileStore(
    (s) =>
      s.students.find((st) => st.id === s.activeStudentId)?.anomaly ?? null,
  );

export const useIsFetchingProfile = () => useProfileStore((s) => s.isFetching);
