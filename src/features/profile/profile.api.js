// features/profile/profile.api.js

import { apiClient, authClient } from "@/lib/api/apiClient";
import { mockApi } from "@/services/mockService";
const USE_MOCK = false;

// ── Guards ─────────────────────────────────────────────────────────────────────

function assertRegVerifyResponse(data) {
  if (!data?.access_token) throw new Error("REG: missing access_token");
  if (!data?.refresh_token) throw new Error("REG: missing refresh_token");
  if (!data?.parent_id) throw new Error("REG: missing parent_id");
}

// ── Registration API (unauthenticated) ────────────────────────────────────────

export const registrationApi = {
  initRegistration: async ({ card_number, phone }) => {
    const res = await authClient.post("/auth/register/init", {
      card_number,
      phone,
    });
    return res?.data?.data ?? res?.data ?? res;
  },

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
   * Full home data — parent + all students (each with last_scan, anomaly,
   * scan_count embedded) + global last_scan scoped to active student.
   */
  getFullProfile: async () => {
    if (USE_MOCK) return mockApi.getFullProfile();
    const res = await apiClient.get("/parents/me");
    return res?.data?.data ?? res?.data;
  },

  /**
   * PATCH /api/parents/me/profile
   * body: { student_id, student?, emergency?, contacts? }
   */
  updateProfile: async (studentId, payload) => {
    const res = await apiClient.patch("/parents/me/profile/emergency", {
      student_id: studentId,
      ...payload,
    });
    return res?.data?.data ?? res?.data;
  },

  // Add inside profileApi object:
  updateStudentBasicInfo: async (studentId, data) => {
    const res = await apiClient.patch(
      `/parents/me/students/${studentId}/basic`,
      data,
    );
    return res?.data?.data ?? res?.data;
  },

  updateParentProfile: async (data) => {
    const res = await apiClient.patch("/parents/me/profile", data);
    return res?.data?.data ?? res?.data;
  },

  /**
   * PATCH /api/parents/me/visibility
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
   */
  updateNotifications: async (prefs) => {
    const res = await apiClient.patch("/parents/me/notifications", prefs);
    return res?.data?.data ?? res?.data;
  },

  /**
   * PATCH /api/parents/me/location-consent
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
   */
  deleteAccount: async () => {
    const res = await apiClient.delete("/parents/me");
    return res?.data ?? res;
  },

  /**
   * GET /api/parents/me/scans
   * FIX: studentId is now REQUIRED — the server scopes results to that student.
   * query: { student_id (required), cursor?, limit?, filter? }
   */
  getScanHistory: async ({
    studentId,
    cursor,
    limit = 20,
    filter = "all",
  } = {}) => {
    if (!studentId) throw new Error("getScanHistory: studentId is required");
    const params = { student_id: studentId, limit, filter };
    if (cursor) params.cursor = cursor;
    const res = await apiClient.get("/parents/me/scans", { params });
    return res?.data?.data ?? res?.data;
  },

  /**
   * GET /api/parents/me/children
   */
  getChildrenList: async () => {
    if (USE_MOCK) return mockApi.getChildrenList();
    const res = await apiClient.get("/parents/me/children");
    return res?.data?.data ?? res?.data;
  },

  /**
   * POST /api/parents/me/link-card
   */
  linkCard: async ({ card_number }) => {
    const res = await apiClient.post("/parents/me/link-card", { card_number });
    return res?.data?.data ?? res?.data;
  },

  /**
   * PATCH /api/parents/me/active-student
   */
  setActiveStudent: async (studentId) => {
    if (USE_MOCK) return mockApi.setActiveStudent(studentId);
    const res = await apiClient.patch("/parents/me/active-student", {
      student_id: studentId,
    });
    return res?.data?.data ?? res?.data;
  },

  /**
   * POST /api/parents/me/unlink-child/init
   */
  unlinkChildInit: async (studentId) => {
    const res = await apiClient.post("/parents/me/unlink-child/init", {
      student_id: studentId,
    });
    return res?.data?.data ?? res?.data;
  },

  /**
   * POST /api/parents/me/unlink-child/verify
   */
  unlinkChildVerify: async (studentId, otp, nonce) => {
    const res = await apiClient.post("/parents/me/unlink-child/verify", {
      student_id: studentId,
      otp,
      nonce,
    });
    return res?.data?.data ?? res?.data;
  },

  // ── Photo Upload ────────────────────────────────────────────────────────────

  generateStudentPhotoUploadUrl: async (studentId, contentType, fileSize) => {
    const res = await apiClient.post(
      `/parents/me/students/${studentId}/photo/upload-url`,
      { contentType, fileSize },
    );
    return res?.data?.data ?? res?.data;
  },

  confirmStudentPhotoUpload: async (studentId, key, nonce) => {
    const res = await apiClient.post(
      `/parents/me/students/${studentId}/photo/confirm`,
      { key, nonce },
    );
    return res?.data?.data ?? res?.data;
  },

  generateAvatarUploadUrl: async (contentType, fileSize) => {
    const res = await apiClient.post(`/parents/me/avatar/upload-url`, {
      contentType,
      fileSize,
    });
    return res?.data?.data ?? res?.data;
  },

  confirmAvatarUpload: async (key, nonce) => {
    const res = await apiClient.post(`/parents/me/avatar/confirm`, {
      key,
      nonce,
    });
    return res?.data?.data ?? res?.data;
  },

  // change phone number
  // Add to profileApi object in profile.api.js:

  /**
   * POST /api/parents/me/send-phone-otp
   * Send OTP to new phone number before changing
   * body: { new_phone }
   * → { success, message, expiresIn }
   */
  sendPhoneChangeOtp: async (new_phone) => {
    const res = await apiClient.post("/parents/me/send-phone-otp", {
      new_phone,
    });
    return res?.data?.data ?? res?.data;
  },

  /**
   * POST /api/parents/me/change-phone
   * Verify OTP and update phone number
   * body: { new_phone, otp }
   * → { success, message }
   */
  changePhone: async ({ new_phone, otp }) => {
    const res = await apiClient.post("/parents/me/change-phone", {
      new_phone,
      otp,
    });
    return res?.data?.data ?? res?.data;
  },

  // ── Email verification ──────────────────────────────────────────────────────

  /**
   * POST /api/parents/me/send-email-otp
   * body: { email }
   * → { success, message, expiresIn }
   */
  sendEmailVerificationOtp: async (email) => {
    const res = await apiClient.post("/parents/me/send-email-otp", { email });
    return res?.data?.data ?? res?.data;
  },

  /**
   * POST /api/parents/me/verify-email
   * body: { email, otp }
   * → { success, message }
   */
  verifyEmail: async (email, otp) => {
    const res = await apiClient.post("/parents/me/verify-email", {
      email,
      otp,
    });
    return res?.data?.data ?? res?.data;
  },

  /**
   * POST /api/parents/me/change-email
   * body: { new_email, otp }
   * → { success, message }
   */
  changeEmail: async (newEmail, otp) => {
    const res = await apiClient.post("/parents/me/change-email", {
      new_email: newEmail,
      otp,
    });
    return res?.data?.data ?? res?.data;
  },

  /**
   * POST /api/parents/me/send-email-change-otp
   * body: { email }
   * → { success, message, expiresIn }
   */
  sendEmailChangeOtp: async (email) => {
    const res = await apiClient.post("/parents/me/send-email-change-otp", {
      email,
    });
    return res?.data?.data ?? res?.data;
  },

  /**
   * POST /api/parents/me/verify-email-change
   * body: { email, otp }
   * → { success, message }
   */
  verifyEmailChange: async (email, otp) => {
    const res = await apiClient.post("/parents/me/verify-email-change", {
      email,
      otp,
    });
    return res?.data?.data ?? res?.data;
  },
};
