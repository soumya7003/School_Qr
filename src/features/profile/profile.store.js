/**
 * features/profile/profile.store.js
 *
 * STRATEGY: Cache-first with silent background refresh.
 */

import { useAuthStore } from "@/features/auth/auth.store";
import { profileApi } from "@/features/profile/profile.api";
import { storage } from "@/lib/storage/storage";
import { create } from "zustand";

// ✅ Deduplication promise
let _fetchPromise = null;

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
        const activeStudent =
          students.find((s) => s.id === activeId) ?? students[0] ?? null;

        set({
          parent: snap.data.parent ?? null,
          students,
          activeStudentId: activeId,
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
          lastRefreshTime: null,
        });
      }
    } catch (err) {
      console.error("[ProfileStore] hydrate cache read error:", err);
      set({
        isHydrated: true,
        isInitialized: true,
        activeStudentId: null,
        lastRefreshTime: null,
      });
    }

    // ✅ Fire and forget — but only if not already fetching
    if (!_fetchPromise) {
      get()
        ._silentRefresh()
        .catch((err) => {
          console.warn("[ProfileStore] Background refresh failed:", err);
        });
    } else {
      console.log(
        "[ProfileStore] Fetch already running, skipping background refresh",
      );
    }
  },

  // ── Silent background refresh ───────────────────────────────────────────────
  _silentRefresh: async () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return null;

    // ✅ Don't start another fetch if one is already running
    if (_fetchPromise) {
      console.log(
        "[ProfileStore] Fetch already in progress, skipping silent refresh",
      );
      return _fetchPromise;
    }

    try {
      const stale = await storage.isProfileStale();
      const neverRefreshed = get().lastRefreshTime === null;

      console.log(
        `[ProfileStore] Silent refresh check — stale: ${stale}, neverRefreshed: ${neverRefreshed}`,
      );

      if (!stale && !neverRefreshed) {
        console.log("[ProfileStore] Cache fresh, skipping refresh");
        return null;
      }

      return await get().fetchAndPersist({ silent: true });
    } catch (err) {
      console.warn("[ProfileStore] Silent refresh failed:", err);
      return null;
    }
  },

  // ── Fetch from API ──────────────────────────────────────────────────────────
  fetchAndPersist: async ({ silent = false } = {}) => {
    // ✅ If already fetching, return the existing promise
    if (_fetchPromise) {
      console.log("[ProfileStore] Already fetching, reusing promise");
      return _fetchPromise;
    }

    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) return null;

    console.log(`[ProfileStore] Starting fetch (silent: ${silent})`);
    set({ isFetching: true });

    _fetchPromise = (async () => {
      try {
        const data = await profileApi.getFullProfile();

        // ✅ ALWAYS update lastRefreshTime, even if no data
        set({ lastRefreshTime: Date.now() });

        if (data && data.students) {
          await storage.saveProfile(data);

          const currentState = get();
          const activeStudentId =
            data.parent?.active_student_id ??
            currentState.activeStudentId ??
            data.students?.[0]?.id ??
            null;
          const activeStudent =
            data.students?.find((s) => s.id === activeStudentId) ??
            data.students?.[0] ??
            null;

          set({
            parent: data.parent ?? currentState.parent,
            students: data.students ?? currentState.students,
            activeStudentId,
            lastScan:
              activeStudent?.last_scan ??
              data.last_scan ??
              currentState.lastScan,
            scanCount:
              activeStudent?.scan_count ??
              data.scan_count ??
              currentState.scanCount,
            anomaly:
              activeStudent?.anomaly ?? data.anomaly ?? currentState.anomaly,
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

          console.log(
            "[ProfileStore] Fetch complete — students:",
            data.students.length,
          );
          return data;
        }

        console.log("[ProfileStore] Fetch complete — no students");
        return null;
      } catch (err) {
        // ✅ Still update lastRefreshTime on error
        set({ lastRefreshTime: Date.now() });
        console.error("[ProfileStore] fetchAndPersist error:", err);
        if (!silent) throw err;
        return null;
      } finally {
        console.log("[ProfileStore] Cleaning up fetch state");
        set({ isFetching: false });
        _fetchPromise = null;
      }
    })();

    return _fetchPromise;
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
      isInitialized: false,
      isHydrated: false, // ← forces consumers to wait
    });
    const result = await get().fetchAndPersist({ silent: false });
    set({ isHydrated: true }); // ← mark ready only after fetch
    return result;
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
      isInitialized: false,
    });
  },

  // ── Student basic update ────────────────────────────────────────────────────
  updateStudentBasic: async (studentId, data) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");

    await profileApi.updateStudentBasicInfo(studentId, data);

    // ✅ FIX: optimistic update only — NO refresh() here.
    // patchStudent is always called after this in handleSubmitAll and it
    // already calls refresh() at the end. Calling refresh() here races
    // against patchStudent and can overwrite the store with stale server
    // data before patchStudent's optimistic contacts merge runs.
    set((state) => ({
      students: state.students.map((s) =>
        s.id === studentId ? { ...s, ...data } : s,
      ),
    }));
  },

  // ── Student update methods ──────────────────────────────────────────────────
  patchStudent: async (studentId, payload) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");

    const result = await profileApi.updateProfile(studentId, payload);

    const currentStudent = get().students.find((s) => s.id === studentId);
    if (currentStudent) {
      let updatedStudent = { ...currentStudent };

      if (payload.student) {
        Object.assign(updatedStudent, payload.student);
      }

      if (payload.emergency) {
        updatedStudent.emergency = {
          ...(currentStudent.emergency ?? {}),
          ...payload.emergency,
        };
      }

      // ✅ FIX: merge contacts into emergency so the store reflects what was
      // just saved. Without this, student.emergency.contacts in the store
      // stays as the old DB value and useProfileForm seeds the form with
      // stale contacts on every subsequent open.
      if (payload.contacts) {
        updatedStudent.emergency = {
          ...(updatedStudent.emergency ?? {}),
          contacts: payload.contacts,
        };
      }

      set((state) => ({
        students: state.students.map((s) =>
          s.id === studentId ? updatedStudent : s,
        ),
      }));

      // ✅ Persist the full merged emergency (including contacts) to storage
      // so the correct data survives app restart before the next API refresh.
      await storage.patchProfileStudent(studentId, {
        ...payload,
        emergency: {
          ...(payload.emergency ?? {}),
          contacts:
            payload.contacts ?? currentStudent.emergency?.contacts ?? [],
        },
      });
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
      if (responseData?.student_id || responseData?.student?.id) {
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

  updateParentProfile: async (data) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");

    await profileApi.updateParentProfile(data);

    set((state) => ({
      parent: state.parent ? { ...state.parent, ...data } : state.parent,
    }));

    const snap = await storage.readProfile();
    if (snap?.data) {
      snap.data.parent = { ...snap.data.parent, ...data };
      await storage.saveProfile(snap.data);
    }
  },

  sendEmailOtp: async (email) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");
    return profileApi.sendEmailVerificationOtp(email);
  },

  verifyEmail: async (email, otp) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");

    const result = await profileApi.verifyEmail(email, otp);

    set((state) => ({
      parent: state.parent
        ? { ...state.parent, email, is_email_verified: true }
        : state.parent,
    }));

    const snap = await storage.readProfile();
    if (snap?.data) {
      snap.data.parent = {
        ...snap.data.parent,
        email,
        is_email_verified: true,
      };
      await storage.saveProfile(snap.data);
    }

    return result;
  },

  changeEmail: async (newEmail, otp) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");

    const result = await profileApi.changeEmail(newEmail, otp);

    set((state) => ({
      parent: state.parent
        ? { ...state.parent, email: newEmail, is_email_verified: true }
        : state.parent,
    }));

    const snap = await storage.readProfile();
    if (snap?.data) {
      snap.data.parent = {
        ...snap.data.parent,
        email: newEmail,
        is_email_verified: true,
      };
      await storage.saveProfile(snap.data);
    }

    return result;
  },

  sendEmailChangeOtp: async (email) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");
    return profileApi.sendEmailChangeOtp(email);
  },

  verifyEmailChange: async (email, otp) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw new Error("Not authenticated");

    const result = await profileApi.verifyEmailChange(email, otp);

    set((state) => ({
      parent: state.parent
        ? { ...state.parent, email, is_email_verified: true }
        : state.parent,
    }));

    const snap = await storage.readProfile();
    if (snap?.data) {
      snap.data.parent = {
        ...snap.data.parent,
        email,
        is_email_verified: true,
      };
      await storage.saveProfile(snap.data);
    }

    return result;
  },

  confirmAvatarUpload: async (key, nonce) => {
    const result = await profileApi.confirmAvatarUpload(key, nonce);

    set((state) => ({
      parent: state.parent
        ? { ...state.parent, avatar_url: result.avatar_url }
        : state.parent,
    }));

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
      isInitialized: false,
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
