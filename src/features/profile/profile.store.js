/**
 * features/profile/profile.store.js
 *
 * BUGS FIXED:
 *
 *   [FIX-1] fetchAndPersist isNewUser auto-correct fires too eagerly:
 *           Added defensive check: only auto-correct if the store
 *           currently has isNewUser=true.
 *
 *   [FIX-2] clear() race condition:
 *           Previously set isHydrated: true BEFORE storage cleared.
 *           Now sets isHydrated: false first, waits for storage clear,
 *           then sets final state.
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
  // ── Hydrate ─────────────────────────────────────────────────────────────────
  hydrate: async () => {
    console.log("[ProfileStore] hydrate START");
    try {
      const snap = await storage.readProfile();

      if (snap?.data) {
        console.log("[ProfileStore] snap.data keys:", Object.keys(snap.data));

        // ✅ Handle old structure (single student)
        let students = [];
        let parent = null;
        let lastScan = null;
        let scanCount = 0;
        let anomaly = null;

        // Check if we have the new multi-child structure
        if (snap.data.students && Array.isArray(snap.data.students)) {
          students = snap.data.students;
          parent = snap.data.parent;
          lastScan = snap.data.last_scan;
          scanCount = snap.data.scan_count;
          anomaly = snap.data.anomaly;
        }
        // Handle old structure (single student)
        else if (snap.data.student) {
          // Convert single student to array
          const singleStudent = {
            id: snap.data.student.id,
            first_name: snap.data.student.first_name,
            last_name: snap.data.student.last_name,
            class: snap.data.student.class,
            section: snap.data.student.section,
            photo_url: snap.data.student.photo_url,
            setup_stage: snap.data.student.setup_stage,
            school: snap.data.student.school,
            token: snap.data.token
              ? {
                  id: snap.data.token.id,
                  status: snap.data.token.status,
                  expires_at: snap.data.token.expires_at,
                  card_number: snap.data.token.card_number,
                }
              : null,
            emergency: snap.data.emergencyProfile
              ? {
                  blood_group: snap.data.emergencyProfile.blood_group,
                  allergies: snap.data.emergencyProfile.allergies,
                  conditions: snap.data.emergencyProfile.conditions,
                  medications: snap.data.emergencyProfile.medications,
                  doctor_name: snap.data.emergencyProfile.doctor_name,
                  doctor_phone: snap.data.emergencyProfile.doctor_phone,
                  notes: snap.data.emergencyProfile.notes,
                  visibility: snap.data.emergencyProfile.visibility,
                  is_visible: snap.data.emergencyProfile.is_visible,
                  contacts: snap.data.contacts || [],
                }
              : null,
            card_visibility: snap.data.cardVisibility || null,
            location_consent: snap.data.locationConsent || null,
          };
          students = [singleStudent];
          parent = snap.data.parent;
          lastScan = snap.data.last_scan;
          scanCount = snap.data.scan_count;
          anomaly = snap.data.anomaly;
        }

        console.log("[ProfileStore] students count:", students.length);

        set({
          parent: parent ?? null,
          students: students,
          activeStudentId: students[0]?.id ?? null,
          lastScan: lastScan ?? null,
          scanCount: scanCount ?? 0,
          anomaly: anomaly ?? null,
          isHydrated: true,
        });
      } else {
        // Fallback to mock data
        const mockStudents = [
          {
            id: "student-001",
            first_name: "Arjun",
            last_name: "Sharma",
            class: "6",
            section: "B",
            token: { status: "ACTIVE", card_number: "RESQID-001" },
            emergency: { visibility: "PUBLIC", blood_group: "B+" },
            card_visibility: { visibility: "PUBLIC", hidden_fields: [] },
            location_consent: { enabled: true },
            school: { name: "Delhi Public School", city: "Delhi" },
          },
          {
            id: "student-002",
            first_name: "Ananya",
            last_name: "Sharma",
            class: "3",
            section: "A",
            token: { status: "ACTIVE", card_number: "RESQID-002" },
            emergency: { visibility: "PUBLIC", blood_group: "O+" },
            card_visibility: { visibility: "PUBLIC", hidden_fields: [] },
            location_consent: { enabled: false },
            school: { name: "Delhi Public School", city: "Delhi" },
          },
        ];

        set({
          parent: {
            id: "parent-001",
            name: "Priya Sharma",
            phone: "+919876543210",
            is_phone_verified: true,
            notification_prefs: {
              scan_notify_enabled: true,
              anomaly_notify_enabled: true,
            },
          },
          students: mockStudents,
          activeStudentId: mockStudents[0]?.id ?? null,
          lastScan: null,
          scanCount: 0,
          anomaly: null,
          isHydrated: true,
        });
      }
    } catch (err) {
      console.error("[ProfileStore] hydrate error:", err);
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

  patchStudent: async (studentId, payload) => {
    const result = await profileApi.updateProfile(studentId, payload);

    const currentStudent =
      get().students.find((s) => s.id === studentId) ?? null;

    // Build updated student object
    let updatedStudent = { ...currentStudent };
    if (payload.student) Object.assign(updatedStudent, payload.student);
    if (payload.emergency) {
      updatedStudent.emergency = {
        ...(updatedStudent.emergency ?? {}),
        ...payload.emergency,
      };
    }
    if (payload.contacts !== undefined) {
      updatedStudent.emergency = {
        ...(updatedStudent.emergency ?? {}),
        contacts: payload.contacts,
      };
    }
    if (payload.card_visibility) {
      updatedStudent.card_visibility = {
        ...(updatedStudent.card_visibility ?? {}),
        ...payload.card_visibility,
      };
    }

    // Update local store
    set((state) => ({
      students: state.students.map((s) =>
        s.id === studentId ? updatedStudent : s,
      ),
    }));

    // Update storage cache without refetch
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

    // Update storage cache
    await storage.patchProfileStudent(studentId, {
      card_visibility: {
        visibility,
        hidden_fields,
        updated_by_parent: true,
      },
    });

    // ✅ No fetchAndPersist
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

    // Update storage cache (parent prefs are in profile root)
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

    // ✅ No fetchAndPersist
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

    await storage.patchProfileStudent(studentId, {
      location_consent: { enabled },
    });

    // ✅ No fetchAndPersist
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
  // ✅ FIX: Set isHydrated: false first to block reads during clear
  clear: async () => {
    set({ isHydrated: false });
    await storage.clearProfile();
    set({
      parent: null,
      students: [],
      activeStudentId: null,
      lastScan: null,
      scanCount: 0,
      anomaly: null,
      isHydrated: true,
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
