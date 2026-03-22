/**
 * features/profile/profile.store.js
 *
 * Offline-first: cold start reads from SecureStore — zero API calls.
 * API is called only when:
 *   1. First login / registration  (fetchAndPersist)
 *   2. App foregrounds after 30min stale  (fetchIfStale)
 *   3. Any write endpoint returns { cache_invalidated: true }
 *   4. Push notification triggers refresh
 *
 * GET /api/parents/me response shape (parent.service.js → fetchAndShape):
 * {
 *   parent:   { id, name, is_phone_verified, notification_prefs }
 *   students: [{ id, first_name, last_name, class, section, photo_url,
 *                setup_stage, relationship, is_primary, school,
 *                token: { id, status, expires_at, card_number, qr_url } | null,
 *                emergency: { ..., contacts: [...] } | null,
 *                card_visibility: { visibility, hidden_fields, updated_by_parent } | null,
 *                location_consent: { enabled } | null }]
 *   last_scan:      { ... } | null
 *   scan_count:     number
 *   anomaly:        { id, anomaly_type, severity, reason, created_at } | null
 *   cache_ttl_days: 30
 * }
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
  // ── State ───────────────────────────────────────────────────────────────────

  parent: null, // { id, name, is_phone_verified, notification_prefs }
  students: [], // full array from GET /api/parents/me
  activeStudentId: null, // which student is in focus (multi-child support)
  lastScan: null, // last scan across all students — home screen
  scanCount: 0, // total scan count — home screen
  anomaly: null, // latest unresolved anomaly — home screen alert
  isHydrated: false,
  isFetching: false,

  // ── Hydrate (cold start — zero API calls) ───────────────────────────────────
  /**
   * Reads full profile snapshot from SecureStore.
   * Called in parallel with auth.store.hydrate() from AuthProvider.
   * Sets ALL state fields — screens render from store immediately on mount.
   */
  hydrate: async () => {
    try {
      const snap = await storage.readProfile();
      if (snap?.data) {
        const { parent, students, lastScan, scanCount, anomaly } = snap.data;
        set({
          parent: parent ?? null,
          students: students ?? [],
          activeStudentId: students?.[0]?.id ?? null,
          lastScan: lastScan ?? null,
          scanCount: scanCount ?? 0,
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
  /**
   * GET /api/parents/me → update store + persist full snapshot to SecureStore.
   * Called:
   *   - After login / registration (AuthProvider)
   *   - After any write that returns { cache_invalidated: true }
   *   - On app foreground when snapshot is stale (fetchIfStale)
   *
   * Also syncs parent.name / is_phone_verified into auth.store.parentUser
   * (login only gives us { id }).
   */
  fetchAndPersist: async () => {
    if (get().isFetching) return;
    set({ isFetching: true });

    try {
      const data = await profileApi.getFullProfile();
      // data shape: { parent, students, last_scan, scan_count, anomaly, cache_ttl_days }

      await storage.saveProfile(data);

      // Sync name + phone verification status into auth store
      if (data.parent) {
        await useAuthStore.getState().setParentUser(data.parent);
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
  /**
   * Called on app foreground (AppState change).
   * Only hits the network if the SecureStore snapshot is older than 30 minutes.
   * Zero cost on most foregrounds.
   */
  fetchIfStale: async () => {
    const stale = await storage.isProfileStale();
    if (stale) return get().fetchAndPersist();
  },

  // ── Patch Student ────────────────────────────────────────────────────────────
  /**
   * PATCH /api/parents/me/profile
   * Updates student info + emergency profile + contacts in one DB tx.
   *
   * Flow:
   *   1. POST to backend
   *   2. Optimistic local merge (no spinner for minor edits)
   *   3. Persist merged slice to SecureStore
   *   4. If backend returns cache_invalidated → full re-fetch to stay consistent
   *
   * For onboarding completion (updates.jsx wizard):
   *   await patchStudent(studentId, payload)
   *   await fetchAndPersist()       ← full fresh data (token becomes ACTIVE)
   *   await setIsNewUser(false)     ← unlock the rest of the app
   */
  patchStudent: async (studentId, payload) => {
    const result = await profileApi.updateProfile(studentId, payload);

    // Optimistic local merge — payload structure mirrors the student object
    set((state) => ({
      students: state.students.map((s) => {
        if (s.id !== studentId) return s;

        const updated = { ...s };

        // Merge top-level student fields (first_name, last_name, class, section…)
        if (payload.student) {
          Object.assign(updated, payload.student);
        }

        // Merge emergency sub-object (blood_group, allergies, doctor_phone…)
        if (payload.emergency) {
          updated.emergency = {
            ...(updated.emergency ?? {}),
            ...payload.emergency,
          };
        }

        // Replace contacts array entirely — backend does atomic replace
        if (payload.contacts !== undefined) {
          updated.emergency = {
            ...(updated.emergency ?? {}),
            contacts: payload.contacts,
          };
        }

        // Merge card_visibility if included in payload
        if (payload.card_visibility) {
          updated.card_visibility = {
            ...(updated.card_visibility ?? {}),
            ...payload.card_visibility,
          };
        }

        return updated;
      }),
    }));

    // Persist the merged student slice to SecureStore
    await storage.patchProfileStudent(studentId, {
      ...(payload.student ?? {}),
      ...(payload.emergency
        ? {
            emergency: {
              ...(get()._getStudent(studentId)?.emergency ?? {}),
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
              ...(get()._getStudent(studentId)?.emergency ?? {}),
              contacts: payload.contacts,
            },
          }
        : {}),
      ...(payload.card_visibility
        ? {
            card_visibility: {
              ...(get()._getStudent(studentId)?.card_visibility ?? {}),
              ...payload.card_visibility,
            },
          }
        : {}),
    });

    // If backend invalidated server cache → do a full re-fetch to stay consistent
    if (result?.cache_invalidated) {
      await get().fetchAndPersist();
    }
  },

  // ── Update Visibility ────────────────────────────────────────────────────────
  /**
   * PATCH /api/parents/me/visibility
   * Updates CardVisibility (PUBLIC / MINIMAL / HIDDEN + hidden_fields[]).
   * Optimistic local merge then full re-fetch on cache_invalidated.
   */
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

    if (result?.cache_invalidated) {
      await get().fetchAndPersist();
    }
  },

  // ── Update Notifications ─────────────────────────────────────────────────────
  /**
   * PATCH /api/parents/me/notifications
   * Merges prefs into parent.notification_prefs optimistically.
   */
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

    if (result?.cache_invalidated) {
      await get().fetchAndPersist();
    }
  },

  // ── Update Location Consent ──────────────────────────────────────────────────
  /**
   * PATCH /api/parents/me/location-consent
   * body: { student_id, enabled }
   */
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

    if (result?.cache_invalidated) {
      await get().fetchAndPersist();
    }
  },

  // ── Lock Card ────────────────────────────────────────────────────────────────
  /**
   * POST /api/parents/me/lock-card
   * Sets token status: ACTIVE → INACTIVE.
   * confirmation: "LOCK" sent automatically (validation requirement).
   */
  lockCard: async (studentId) => {
    const result = await profileApi.lockCard(studentId);

    // Optimistic: update token status to INACTIVE
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

    if (result?.cache_invalidated) {
      await get().fetchAndPersist();
    }

    return result;
  },

  // ── Request Card Replacement ─────────────────────────────────────────────────
  /**
   * POST /api/parents/me/request-replace
   * Logs a replacement request in ParentEditLog.
   * No optimistic state change needed — no visible UI state to update.
   */
  requestReplace: async (studentId, reason) => {
    return profileApi.requestReplace(studentId, reason);
  },

  // ── Delete Account ───────────────────────────────────────────────────────────
  /**
   * DELETE /api/parents/me
   * Soft-deletes account. Call auth.store.logout() immediately after.
   */
  deleteAccount: async () => {
    await profileApi.deleteAccount();
    await get().clear();
  },

  // ── Active Student ───────────────────────────────────────────────────────────

  setActiveStudent: (id) => set({ activeStudentId: id }),

  // ── Clear (on logout) ────────────────────────────────────────────────────────

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

  // ── Internal helpers ─────────────────────────────────────────────────────────

  _getStudent: (id) => get().students.find((s) => s.id === id) ?? null,
}));

// ── Derived selectors ─────────────────────────────────────────────────────────
// All computed from activeStudentId — screens never search themselves.

export const useActiveStudent = () =>
  useProfileStore(
    (s) => s.students.find((st) => st.id === s.activeStudentId) ?? null,
  );

export const useToken = () =>
  useProfileStore((s) => {
    const st = s.students.find((st) => st.id === s.activeStudentId);
    return st?.token ?? null;
  });

export const useEmergencyProfile = () =>
  useProfileStore((s) => {
    const st = s.students.find((st) => st.id === s.activeStudentId);
    return st?.emergency ?? null;
  });

export const useSchool = () =>
  useProfileStore((s) => {
    const st = s.students.find((st) => st.id === s.activeStudentId);
    return st?.school ?? null;
  });

export const useCardVisibility = () =>
  useProfileStore((s) => {
    const st = s.students.find((st) => st.id === s.activeStudentId);
    return st?.card_visibility ?? null;
  });

export const useLocationConsent = () =>
  useProfileStore((s) => {
    const st = s.students.find((st) => st.id === s.activeStudentId);
    return st?.location_consent ?? null;
  });

export const useNotificationPrefs = () =>
  useProfileStore((s) => s.parent?.notification_prefs ?? null);

export const useLastScan = () => useProfileStore((s) => s.lastScan);

export const useScanCount = () => useProfileStore((s) => s.scanCount);

export const useUnresolvedAnomaly = () => useProfileStore((s) => s.anomaly);
