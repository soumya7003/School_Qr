/**
 * features/profile/profile.api.js
 *
 * ALL endpoints verified against:
 *   auth.routes.js       → mounted at /api/auth
 *   parent.routes.js     → mounted at /api/parents
 *   parent.service.js    → exact response shapes
 *   parent.validation.js → exact request shapes
 *
 * ── Registration (unauthenticated — authClient) ──────────────────────────────
 *
 * POST /api/auth/register/init
 *   body: { card_number, phone }
 *   → { success, data: { nonce, masked_phone, student_first_name? } }
 *
 * POST /api/auth/register/verify
 *   body: { nonce, otp, phone }
 *   → { success, data: { accessToken, refreshToken, expiresAt,
 *                         isNewUser, parent_id, student_id } }
 *
 * ── Profile (authenticated — apiClient with Bearer token) ───────────────────
 *
 * GET /api/parents/me
 *   → { success, data: {
 *         parent: { id, name, is_phone_verified, notification_prefs },
 *         students: [{
 *           id, first_name, last_name, class, section, photo_url,
 *           setup_stage, relationship, is_primary,
 *           school: { id, name, code, city },
 *           token: { id, status, expires_at, card_number, qr_url } | null,
 *           emergency: {
 *             blood_group, allergies, conditions, medications,
 *             doctor_name, doctor_phone, notes, visibility,
 *             is_visible, contacts: [{ id, name, phone, relationship,
 *                                      priority, display_order,
 *                                      call_enabled, whatsapp_enabled }]
 *           } | null,
 *           card_visibility: { visibility, hidden_fields, updated_by_parent } | null,
 *           location_consent: { enabled } | null,
 *         }],
 *         last_scan: { id, result, ip_city, ip_region, ip_country,
 *                       scan_purpose, created_at, latitude, longitude } | null,
 *         scan_count: number,
 *         anomaly: { id, anomaly_type, severity, reason, created_at } | null,
 *         cache_ttl_days: 30,
 *       }
 *     }
 *
 * PATCH /api/parents/me/profile
 *   body: { student_id (required), student?, emergency?, contacts? }
 *   → { success, data: { cache_invalidated: true } }
 *
 * PATCH /api/parents/me/visibility
 *   body: { student_id, visibility, hidden_fields }
 *   → { success, data: { cache_invalidated: true } }
 *
 * PATCH /api/parents/me/notifications
 *   body: any subset of notification pref fields
 *   → { success, data: { cache_invalidated: true } }
 *
 * PATCH /api/parents/me/location-consent
 *   body: { student_id, enabled }
 *   → { success, data: { cache_invalidated: true } }
 *
 * POST /api/parents/me/lock-card
 *   body: { student_id, confirmation: "LOCK" }
 *   → { success, data: { locked: true, count: number, cache_invalidated: true } }
 *
 * POST /api/parents/me/request-replace
 *   body: { student_id, reason }
 *   → { success, data: { id, created_at } }
 *
 * DELETE /api/parents/me
 *   → { success, message: "Account deleted" }
 *
 * GET /api/parents/me/scans
 *   query: { cursor?, limit?, filter? }
 *   → { success, data: { scans, anomalies, hasMore, nextCursor } }
 */

import { apiClient, authClient } from "@/lib/api/apiClient";

// ── Guards ─────────────────────────────────────────────────────────────────────

function assertRegVerifyResponse(data) {
  if (!data?.accessToken) throw new Error("REG: missing accessToken");
  if (!data?.refreshToken) throw new Error("REG: missing refreshToken");
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
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt ?? null,
      isNewUser: true, // always true — registration path
      parent_id: data.parent_id, // snake_case from backend
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
