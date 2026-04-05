import { apiClient, authClient } from "@/lib/api/apiClient";
import { mockApi } from "@/services/mockService";
const USE_MOCK = __DEV__;

// ── Guards ─────────────────────────────────────────────────────────────────────

function assertRegVerifyResponse(data) {
  if (!data?.access_token) throw new Error("REG: missing access_token");
  if (!data?.refresh_token) throw new Error("REG: missing refresh_token");
  if (!data?.parent_id) throw new Error("REG: missing parent_id");
}

// ── Registration API (unauthenticated) ────────────────────────────────────────

export const registrationApi = {
  /**
   * POST /api/auth/register/init
   * Validates card → sends OTP → returns nonce.
   * Returns { nonce, masked_phone, student_first_name? }
   * nonce is opaque — pass straight to verifyRegistration.
   */
  initRegistration: async ({ card_number, phone }) => {
    const res = await authClient.post("/auth/register/init", {
      card_number,
      phone,
    });
    return res?.data?.data ?? res?.data ?? res;
  },

  /**
   * POST /api/auth/register/verify
   * phone MUST be included — backend encrypts and stores it for the ParentUser.
   *
   * Returns normalised shape for otp.jsx → onRegistrationSuccess:
   * { accessToken, refreshToken, expiresAt, isNewUser: true, parent_id, student_id }
   *
   * NOTE: parent_id is snake_case here (differs from login's parent.id shape).
   */
  verifyRegistration: async ({ nonce, otp, phone }) => {
    const res = await authClient.post("/auth/register/verify", {
      nonce,
      otp,
      phone,
    });
    const data = res?.data?.data ?? res?.data;

    assertRegVerifyResponse(data);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at ?? null,
      isNewUser: true,
      parent_id: data.parent_id,
      student_id: data.student_id,
    };
  },
};

// ── Profile API (authenticated) ───────────────────────────────────────────────

export const profileApi = {
  /**
   * GET /api/parents/me
   * Full home data — parent + all students + last_scan + anomaly + scan_count.
   * Device caches this for 30 days (cache_ttl_days in response).
   * Re-fetched when stale OR when any write returns { cache_invalidated: true }.
   */
  getFullProfile: async () => {
    if (USE_MOCK) return mockApi.getFullProfile();
    const res = await apiClient.get("/parents/me");
    return res?.data?.data ?? res?.data;
  },

  /**
   * PATCH /api/parents/me/profile
   * Batched update: student info + emergency profile + contacts in one DB tx.
   * student_id is REQUIRED. All other sections are optional (partial update).
   * At least one of student / emergency / contacts must be present.
   *
   * body: { student_id, student?, emergency?, contacts? }
   * → { cache_invalidated: true }
   */
  updateProfile: async (studentId, payload) => {
    const res = await apiClient.patch("/parents/me/profile", {
      student_id: studentId,
      ...payload,
    });
    return res?.data?.data ?? res?.data;
  },

  /**
   * PATCH /api/parents/me/visibility
   * body: { student_id, visibility: "PUBLIC"|"MINIMAL"|"HIDDEN", hidden_fields: string[] }
   * → { cache_invalidated: true }
   */
  updateVisibility: async (studentId, { visibility, hidden_fields }) => {
    const res = await apiClient.patch("/parents/me/visibility", {
      student_id: studentId,
      visibility,
      hidden_fields,
    });
    return res?.data?.data ?? res?.data;
  },

  /**
   * PATCH /api/parents/me/notifications
   * body: any subset of ParentNotificationPref boolean/string fields.
   * Accepted keys (all optional):
   *   scan_notify_enabled, scan_notify_push, scan_notify_sms,
   *   anomaly_notify_push, anomaly_notify_sms, card_expiry_notify,
   *   quiet_hours_enabled, quiet_hours_start ("HH:MM"), quiet_hours_end ("HH:MM")
   * → { cache_invalidated: true }
   */
  updateNotifications: async (prefs) => {
    const res = await apiClient.patch("/parents/me/notifications", prefs);
    return res?.data?.data ?? res?.data;
  },

  /**
   * PATCH /api/parents/me/location-consent
   * body: { student_id, enabled: boolean }
   * → { cache_invalidated: true }
   */
  updateLocationConsent: async (studentId, enabled) => {
    const res = await apiClient.patch("/parents/me/location-consent", {
      student_id: studentId,
      enabled,
    });
    return res?.data?.data ?? res?.data;
  },

  /**
   * POST /api/parents/me/lock-card
   * Sets token status: ACTIVE → INACTIVE.
   * confirmation: "LOCK" is required (prevents accidental locks).
   * body: { student_id, confirmation: "LOCK" }
   * → { locked: true, count: number, cache_invalidated: true }
   */
  lockCard: async (studentId) => {
    const res = await apiClient.post("/parents/me/lock-card", {
      student_id: studentId,
      confirmation: "LOCK",
    });
    return res?.data?.data ?? res?.data;
  },

  /**
   * POST /api/parents/me/request-replace
   * Logs a card replacement request (stored in ParentEditLog).
   * body: { student_id, reason: string (min 5 chars) }
   * → { id, created_at }
   */
  requestReplace: async (studentId, reason) => {
    const res = await apiClient.post("/parents/me/request-replace", {
      student_id: studentId,
      reason,
    });
    return res?.data?.data ?? res?.data;
  },

  /**
   * DELETE /api/parents/me
   * Soft-deletes the parent account (status → DELETED, deleted_at set).
   * Call auth.store.logout() immediately after this resolves.
   * → { success, message: "Account deleted" }
   */
  deleteAccount: async () => {
    const res = await apiClient.delete("/parents/me");
    return res?.data ?? res;
  },

  /**
   * GET /api/parents/me/scans
   * Cursor-paginated scan history + recent anomalies.
   * query: { cursor?, limit? (1–50, default 20), filter?: "all"|"emergency"|"success"|"flagged" }
   * → { scans: [...], anomalies: [...], hasMore: boolean, nextCursor: string | null }
   */
  getScanHistory: async ({ cursor, limit = 20, filter = "all" } = {}) => {
    const params = { limit, filter };
    if (cursor) params.cursor = cursor;
    const res = await apiClient.get("/parents/me/scans", { params });
    return res?.data?.data ?? res?.data;
  },
};
